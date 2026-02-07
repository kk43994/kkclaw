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

    // 启动 Gateway
    async startGateway() {
        this.log('info', '正在启动 Gateway...', 'gateway');

        return new Promise((resolve, reject) => {
            const openclawPath = path.join(process.env.HOME || process.env.USERPROFILE, '.npm-global', 'node_modules', 'openclaw', 'dist', 'index.js');

            const child = spawn('node', [openclawPath, 'gateway', '--port', '18789'], {
                detached: true,
                stdio: 'ignore',
                shell: true
            });

            child.unref();

            // 等待几秒后检查
            setTimeout(async () => {
                const status = await this.checkGateway();
                if (status.status === 'running') {
                    this.log('success', 'Gateway 启动成功', 'gateway');
                    resolve({ success: true });
                } else {
                    this.log('error', 'Gateway 启动失败', 'gateway');
                    resolve({ success: false, error: status.lastError });
                }
            }, 3000);
        });
    }

    // 停止 Gateway (通过 taskkill)
    async stopGateway() {
        this.log('info', '正在停止 Gateway...', 'gateway');

        return new Promise((resolve) => {
            // 查找并终止监听 18789 端口的进程
            exec('netstat -ano | findstr :18789', (err, stdout) => {
                if (err || !stdout) {
                    this.log('warn', 'Gateway 可能已经停止', 'gateway');
                    resolve({ success: true });
                    return;
                }

                // 解析 PID
                const lines = stdout.trim().split('\n');
                const pids = new Set();
                lines.forEach(line => {
                    const parts = line.trim().split(/\s+/);
                    const pid = parts[parts.length - 1];
                    if (pid && /^\d+$/.test(pid)) {
                        pids.add(pid);
                    }
                });

                if (pids.size === 0) {
                    this.log('warn', '未找到 Gateway 进程', 'gateway');
                    resolve({ success: true });
                    return;
                }

                // 终止进程
                let killed = 0;
                pids.forEach(pid => {
                    exec(`taskkill /PID ${pid} /F`, (err) => {
                        killed++;
                        if (killed === pids.size) {
                            this.log('success', 'Gateway 已停止', 'gateway');
                            this.services.gateway.status = 'stopped';
                            this.emit('status-change', {
                                service: 'gateway',
                                previousStatus: 'running',
                                currentStatus: 'stopped'
                            });
                            resolve({ success: true });
                        }
                    });
                });
            });
        });
    }

    // 重启 Gateway
    async restartGateway() {
        this.log('info', '正在重启 Gateway...', 'gateway');
        await this.stopGateway();
        await new Promise(r => setTimeout(r, 1000));
        return await this.startGateway();
    }

    // 获取所有服务状态
    getStatus() {
        return {
            gateway: { ...this.services.gateway },
            timestamp: Date.now()
        };
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
