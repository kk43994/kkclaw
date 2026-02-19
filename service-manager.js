// OpenClaw 服务管理模块 - 按需检测版
const { spawn, exec } = require('child_process');
const path = require('path');
const EventEmitter = require('events');

const OPENCLAW_HOST = 'http://127.0.0.1:18789';

class ServiceManager extends EventEmitter {
    constructor() {
        super();
        this.services = {
            gateway: {
                name: 'OpenClaw Gateway',
                status: 'unknown', // unknown, running, stopped, error
                pid: null,
                lastCheck: 0,
                lastError: null,
                uptime: 0
            }
        };
        this.logs = [];
        this.maxLogs = 100;
        this._restartLock = false; // 防止并发重启
        this._startupState = null; // 启动状态追踪: { pid, startedAt, child }
    }

    // 开始（仅初始化，不轮询）
    start() {
        this.log('info', '服务管理器启动 (按需检测模式)');
        // 初始检测一次
        this.checkGateway();
    }

    // 停止
    stop() {
        this.log('info', '服务管理器停止');
    }

    // 记录日志
    log(level, message, service = 'manager') {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            service,
            message
        };
        this.logs.push(entry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        this.emit('log', entry);
        console.log(`[${level.toUpperCase()}] [${service}] ${message}`);
    }

    // 获取最近日志
    getRecentLogs(count = 50) {
        return this.logs.slice(-count);
    }

    // 通信失败时调用此方法检测服务状态
    async onCommunicationError(error) {
        this.log('warn', `通信错误触发检测: ${error}`, 'gateway');
        return await this.checkGateway();
    }

    // 检查 Gateway 状态（按需调用）
    async checkGateway() {
        const service = this.services.gateway;
        const previousStatus = service.status;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(OPENCLAW_HOST, {
                method: 'GET',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok || response.status === 200) {
                service.status = 'running';
                service.lastError = null;
                if (previousStatus !== 'running') {
                    service.uptime = Date.now();
                    this.log('success', 'Gateway 已连接', 'gateway');
                }
            } else {
                service.status = 'error';
                service.lastError = `HTTP ${response.status}`;
                this.log('error', `Gateway 返回错误: ${response.status}`, 'gateway');
            }
        } catch (err) {
            service.status = 'stopped';
            service.lastError = err.message;
            if (previousStatus === 'running') {
                this.log('error', `Gateway 连接断开: ${err.message}`, 'gateway');
            }
        }

        service.lastCheck = Date.now();

        // 状态变化时发送事件
        if (previousStatus !== service.status) {
            this.emit('status-change', {
                service: 'gateway',
                previousStatus,
                currentStatus: service.status,
                error: service.lastError
            });
        }

        return service;
    }

    // 查找占用指定端口的进程 PID（排除 Electron 自身）
    _findPortPids(port) {
        return new Promise((resolve) => {
            exec(`netstat -ano | findstr :${port} | findstr LISTENING`, { windowsHide: true }, (err, stdout) => {
                if (err || !stdout) {
                    resolve([]);
                    return;
                }

                const electronPid = process.pid;
                const parentPid = process.ppid;
                const pids = new Set();

                stdout.trim().split('\n').forEach(line => {
                    const parts = line.trim().split(/\s+/);
                    const pid = parts[parts.length - 1];
                    if (pid && /^\d+$/.test(pid) &&
                        pid !== String(electronPid) && pid !== String(parentPid)) {
                        pids.add(pid);
                    }
                });

                resolve([...pids]);
            });
        });
    }

    // 强制杀死占用端口的所有进程
    async _forceKillPort(port) {
        const pids = await this._findPortPids(port);
        if (pids.length === 0) return;

        this.log('info', `强制终止占用端口 ${port} 的进程: ${pids.join(', ')}`, 'gateway');

        const killPromises = pids.map(pid => new Promise((resolve) => {
            exec(`taskkill /PID ${pid} /F /T`, { windowsHide: true }, (err) => {
                if (err) {
                    this.log('warn', `终止 PID ${pid} 失败: ${err.message}`, 'gateway');
                }
                resolve();
            });
        }));

        await Promise.all(killPromises);
    }

    // 等待端口释放（带超时）
    async _waitForPortFree(port, timeoutMs = 10000) {
        const startTime = Date.now();
        const checkInterval = 500;

        while (Date.now() - startTime < timeoutMs) {
            const pids = await this._findPortPids(port);
            if (pids.length === 0) {
                return true;
            }
            await new Promise(r => setTimeout(r, checkInterval));
        }

        return false;
    }

    // 检查 gateway 是否仍在启动中（进程存活且在宽限期内）
    isGatewayStartingUp() {
        if (!this._startupState) return false;
        const { startedAt, exited } = this._startupState;
        // 进程已退出，不算启动中
        if (exited) {
            this._startupState = null;
            return false;
        }
        // 60 秒宽限期：gateway 可能需要较长时间初始化
        const STARTUP_GRACE_MS = 60000;
        if (Date.now() - startedAt > STARTUP_GRACE_MS) {
            this.log('warn', '启动宽限期已过，放弃等待', 'gateway');
            this._startupState = null;
            return false;
        }
        return true;
    }

    // 启动 Gateway
    async startGateway() {
        this.log('info', '正在启动 Gateway...', 'gateway');

        // 启动前确保端口没被占用
        const pids = await this._findPortPids(18789);
        if (pids.length > 0) {
            this.log('warn', `启动前发现端口被占用 (PID: ${pids.join(', ')})，先强制清理`, 'gateway');
            await this._forceKillPort(18789);
            const freed = await this._waitForPortFree(18789, 5000);
            if (!freed) {
                this.log('error', '端口清理超时，无法启动 Gateway', 'gateway');
                return { success: false, error: '端口 18789 被占用且无法释放' };
            }
        }

        const openclawPath = path.join(process.env.HOME || process.env.USERPROFILE, '.npm-global', 'node_modules', 'openclaw', 'dist', 'index.js');

        const fs = require('fs');
        if (!fs.existsSync(openclawPath)) {
            this.log('error', `openclaw 不存在: ${openclawPath}`, 'gateway');
            return { success: false, error: `openclaw 不存在: ${openclawPath}` };
        }

        const child = spawn('node', [openclawPath, 'gateway', '--port', '18789'], {
            stdio: ['ignore', 'pipe', 'pipe'], // 捕获 stdout + stderr 用于诊断
            shell: false,
            windowsHide: true
        });

        // 收集 stdout + stderr 输出（各保留最后 2KB）
        let stdoutBuf = '';
        let stderrBuf = '';
        let exited = false;
        let exitCode = null;

        // 记录启动状态
        this._startupState = { pid: child.pid, startedAt: Date.now(), exited: false };

        child.stdout.on('data', (chunk) => {
            stdoutBuf = (stdoutBuf + chunk.toString()).slice(-2048);
        });
        child.stderr.on('data', (chunk) => {
            stderrBuf = (stderrBuf + chunk.toString()).slice(-2048);
        });
        // 用 close 而不是 exit — close 在所有 stdio 流结束后才触发，确保 buffer 已填充
        child.on('close', (code) => {
            exitCode = code;
            exited = true;
            if (this._startupState) this._startupState.exited = true;
            if (code !== null && code !== 0) {
                const reason = this._extractErrorReason(stdoutBuf, stderrBuf) || `exit code ${code}`;
                this.log('error', `Gateway 进程异常退出 (code ${code}): ${reason}`, 'gateway');
            }
        });

        child.unref();

        // 轮询等待启动完成（最长 30 秒）
        const startTime = Date.now();
        const maxWait = 30000;
        const pollInterval = 1000;

        while (Date.now() - startTime < maxWait) {
            // 进程已退出说明闪退了，不用继续等
            if (exited) {
                this._startupState = null;
                // 等一下让 close 事件的回调跑完，确保 buffer 已填充
                await new Promise(r => setTimeout(r, 200));
                const reason = this._extractErrorReason(stdoutBuf, stderrBuf) || '进程异常退出';
                this.log('error', `Gateway 闪退: ${reason}`, 'gateway');
                return { success: false, error: `闪退: ${reason}` };
            }
            await new Promise(r => setTimeout(r, pollInterval));
            const status = await this.checkGateway();
            if (status.status === 'running') {
                this._startupState = null;
                this.log('success', `Gateway 启动成功 (${Math.round((Date.now() - startTime) / 1000)}s)`, 'gateway');
                return { success: true };
            }
        }

        // 超时但进程还活着 → 不杀进程，保留 _startupState 让 Guardian 知道还在启动
        const errorReason = this._extractErrorReason(stdoutBuf, stderrBuf);
        const errorDetail = errorReason
            ? `启动超时: ${errorReason}`
            : `启动超时 (${maxWait / 1000}s)，进程仍在运行`;
        this.log('warn', `Gateway ${errorDetail}`, 'gateway');
        return { success: false, error: errorDetail, stillStarting: !exited };
    }

    // 停止 Gateway — 强制杀死并确认端口释放
    async stopGateway() {
        this.log('info', '正在停止 Gateway...', 'gateway');
        this._startupState = null; // 主动停止时清除启动状态

        await this._forceKillPort(18789);

        // 等待端口真正释放
        const freed = await this._waitForPortFree(18789, 8000);
        if (!freed) {
            this.log('error', '停止 Gateway 超时，端口仍被占用', 'gateway');
            // 最后一搏：再杀一次
            await this._forceKillPort(18789);
            await new Promise(r => setTimeout(r, 2000));
        }

        this.log('success', 'Gateway 已停止', 'gateway');
        this.services.gateway.status = 'stopped';
        this.emit('status-change', {
            service: 'gateway',
            previousStatus: 'running',
            currentStatus: 'stopped'
        });
        return { success: true };
    }

    // 重启 Gateway（带并发锁，防止多处同时触发）
    async restartGateway() {
        if (this._restartLock) {
            this.log('warn', '重启已在进行中，跳过重复请求', 'gateway');
            return { success: false, error: '重启正在进行中' };
        }

        this._restartLock = true;
        this.log('info', '正在重启 Gateway...', 'gateway');

        try {
            await this.stopGateway();
            // stopGateway 已确认端口释放，无需额外等待
            return await this.startGateway();
        } finally {
            this._restartLock = false;
        }
    }

    // 获取所有服务状态
    getStatus() {
        return {
            gateway: { ...this.services.gateway },
            timestamp: Date.now()
        };
    }

    // 从 gateway 输出中提取可读的错误原因
    _extractErrorReason(stdout, stderr) {
        const combined = (stdout + '\n' + stderr).replace(/\x1b\[[0-9;]*m/g, ''); // 去掉 ANSI 颜色码

        // 配置校验错误
        const configMatch = combined.match(/Config invalid[\s\S]*?Problem:\s*([\s\S]*?)(?:\n\nRun:|$)/);
        if (configMatch) {
            return `配置错误: ${configMatch[1].trim()}`;
        }

        // Invalid config 单行格式
        const invalidCfg = combined.match(/Invalid config[^:]*:\s*\n\s*-\s*(.+)/);
        if (invalidCfg) {
            return `配置错误: ${invalidCfg[1].trim()}`;
        }

        // 端口占用
        if (combined.includes('EADDRINUSE') || combined.includes('address already in use')) {
            return '端口 18789 被占用';
        }

        // 权限错误
        if (combined.includes('EACCES') || combined.includes('permission denied')) {
            return '权限不足';
        }

        // 模块找不到
        const moduleMatch = combined.match(/Cannot find module '([^']+)'/);
        if (moduleMatch) {
            return `缺少模块: ${moduleMatch[1]}`;
        }

        // 通用 Error
        const errorMatch = combined.match(/(?:Error|TypeError|ReferenceError):\s*(.+)/);
        if (errorMatch) {
            return errorMatch[1].trim().slice(0, 200);
        }

        // 兜底：返回 stderr 或 stdout 最后一行有意义的内容
        const lastLine = (stderr.trim() || stdout.trim()).split('\n').filter(l => l.trim()).pop();
        return lastLine ? lastLine.trim().slice(0, 200) : '';
    }

    // 获取服务运行时间
    getUptime(service) {
        const svc = this.services[service];
        if (!svc || svc.status !== 'running' || !svc.uptime) {
            return 0;
        }
        return Date.now() - svc.uptime;
    }

    // 格式化运行时间
    formatUptime(ms) {
        if (!ms) return '-';
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
}

module.exports = ServiceManager;
