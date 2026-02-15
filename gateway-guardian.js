// Gateway 进程守护模块 — 指数退避 + 自适应频率 + 深度健康检查
const EventEmitter = require('events');
const path = require('path');
const fs = require('fs');

class GatewayGuardian extends EventEmitter {
    constructor(serviceManager, options = {}) {
        super();
        this.serviceManager = serviceManager;
        this.gatewayHost = options.gatewayHost || 'http://127.0.0.1:18789';
        this.maxRestarts = options.maxRestarts || 10;
        this.restartWindow = options.restartWindow || 60 * 60 * 1000; // 1小时

        // 自适应轮询间隔
        this.healthyInterval = 30000;   // 健康时 30s
        this.baseInterval = 5000;       // 异常时起始 5s
        this.maxInterval = 300000;      // 退避上限 5min

        // 深度检查：每 N 次浅检查做 1 次深度检查
        this.deepCheckEvery = 3;
        this.checkCount = 0;

        // 连续重启失败后自动清理 session 的阈值
        this.sessionCleanupThreshold = 3;

        this.isRunning = false;
        this.checkTimer = null;
        this.currentInterval = this.baseInterval;
        this.consecutiveFailures = 0;
        this.consecutiveRestartFailures = 0;
        this.restartHistory = [];
        this.isRestarting = false; // 防止重复触发
        this._lastError = null;   // 最近一次错误原因
    }

    start() {
        if (this.isRunning) return;

        console.log('[Guardian] 启动 Gateway 守护');
        this.isRunning = true;

        this._check();
        this.emit('started');
    }

    stop() {
        console.log('[Guardian] 停止 Gateway 守护');
        this.isRunning = false;
        this._clearTimer();
        this.emit('stopped');
    }

    // 调度下一次检查
    _scheduleNext(interval) {
        this._clearTimer();
        if (!this.isRunning) return;
        this.currentInterval = interval;
        this.checkTimer = setTimeout(() => this._check(), interval);
    }

    _clearTimer() {
        if (this.checkTimer) {
            clearTimeout(this.checkTimer);
            this.checkTimer = null;
        }
    }

    // 核心检查循环
    async _check() {
        if (!this.isRunning) return;

        this.checkCount++;
        // 周期性做深度检查，避免 "假活"
        const needDeepCheck = this.checkCount % this.deepCheckEvery === 0;
        const healthy = needDeepCheck ? await this._deepPing() : await this._ping();

        if (healthy) {
            this._onHealthy();
        } else {
            await this._onUnhealthy();
        }
    }

    // 浅检查：HTTP GET 根路径
    async _ping() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(this.gatewayHost, {
                method: 'GET',
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            return response.ok || response.status === 200;
        } catch {
            return false;
        }
    }

    // 深度检查：实际调用 API 验证业务层没卡死
    async _deepPing() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const response = await fetch(`${this.gatewayHost}/v1/models`, {
                method: 'GET',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok && response.status !== 200) {
                return false;
            }

            // 确认响应体可读（不是挂起状态）
            await response.text();
            return true;
        } catch {
            return false;
        }
    }

    // 健康时：重置计数，降频到 30s
    _onHealthy() {
        if (this.consecutiveFailures > 0) {
            console.log('[Guardian] Gateway 已恢复');
            this.emit('recovered');
        }
        this.consecutiveFailures = 0;
        this.consecutiveRestartFailures = 0;
        this.isRestarting = false;
        // 恢复后清空重启历史，给后续异常留足重启配额
        if (this.restartHistory.length > 0) {
            this.restartHistory = [];
        }
        this._scheduleNext(this.healthyInterval);
    }

    // 不健康时：指数退避 + 自动重启 + 自动清理
    async _onUnhealthy() {
        this.consecutiveFailures++;

        if (this.consecutiveFailures < 3) {
            // 前两次失败：快速重试确认
            this._scheduleNext(this.baseInterval);
            return;
        }

        // 连续失败 3 次，确认异常
        const reason = `连续失败 ${this.consecutiveFailures} 次`;
        console.log(`[Guardian] Gateway 异常: ${reason}`);

        if (this.isRestarting) {
            // 正在重启中，用退避间隔等待
            this._scheduleNext(this._backoffInterval());
            return;
        }

        // 检查 gateway 是否仍在启动中（进程还活着，只是还没就绪）
        if (this.serviceManager.isGatewayStartingUp()) {
            console.log('[Guardian] Gateway 进程仍在启动中，跳过重启，继续等待');
            this._scheduleNext(this.baseInterval);
            return;
        }

        if (this._canRestart()) {
            this.isRestarting = true;
            this.emit('unhealthy', { reason, consecutiveFailures: this.consecutiveFailures });

            // 连续重启失败达到阈值时，先清理 session lock 再重启
            if (this.consecutiveRestartFailures >= this.sessionCleanupThreshold) {
                console.log('[Guardian] 连续重启失败，自动清理 session lock 文件');
                this._cleanupSessionLocks();
                this.consecutiveRestartFailures = 0;
                this.emit('session-cleanup', { reason: '连续重启失败触发自动清理' });
            }

            // 委托 ServiceManager 执行重启
            const result = await this.serviceManager.restartGateway();

            // 如果返回 "重启正在进行中"，不计入历史和失败
            if (result.error === '重启正在进行中') {
                this.isRestarting = false;
                console.log('[Guardian] 外部重启进行中，等待完成');
                this._scheduleNext(this.baseInterval);
                return;
            }

            this.restartHistory.push(Date.now());

            if (result.success) {
                this.consecutiveFailures = 0;
                this.consecutiveRestartFailures = 0;
                this.isRestarting = false;
                console.log('[Guardian] Gateway 重启成功');
                this.emit('restarted', {
                    restartCount: this._recentRestarts().length,
                    maxRestarts: this.maxRestarts
                });
                this._scheduleNext(this.healthyInterval);
            } else {
                this.isRestarting = false;
                // 进程还在启动中，不计入重启失败，用短间隔继续观察
                if (result.stillStarting) {
                    console.log(`[Guardian] Gateway 启动超时但进程仍在运行，继续等待`);
                    this._scheduleNext(this.baseInterval);
                } else {
                    this.consecutiveRestartFailures++;
                    this._lastError = result.error;
                    console.log(`[Guardian] Gateway 重启失败 (连续 ${this.consecutiveRestartFailures} 次): ${result.error}`);
                    this.emit('restart-failed', { error: result.error, consecutiveRestartFailures: this.consecutiveRestartFailures });
                    this._scheduleNext(this._backoffInterval());
                }
            }
        } else {
            // 达到重启上限，进入长间隔监控（不放弃）
            console.log(`[Guardian] 重启次数达上限，进入低频监控 (${this.maxInterval / 1000}s)`);
            this.emit('restart-limit-reached', { restartHistory: this.restartHistory, lastError: this._lastError });
            this._scheduleNext(this.maxInterval);
        }
    }

    // 清理 session lock 文件（防止死锁导致 gateway 启动后卡住）
    _cleanupSessionLocks() {
        try {
            const sessionDir = path.join(
                process.env.HOME || process.env.USERPROFILE,
                '.openclaw', 'agents', 'main', 'sessions'
            );

            if (!fs.existsSync(sessionDir)) return;

            const files = fs.readdirSync(sessionDir);
            let cleaned = 0;

            for (const file of files) {
                if (file.endsWith('.lock')) {
                    try {
                        fs.unlinkSync(path.join(sessionDir, file));
                        cleaned++;
                    } catch { /* ignore */ }
                }
            }

            if (cleaned > 0) {
                console.log(`[Guardian] 已清理 ${cleaned} 个 session lock 文件`);
            }
        } catch (err) {
            console.log(`[Guardian] 清理 session lock 失败: ${err.message}`);
        }
    }

    // 指数退避：5s → 10s → 20s → 40s → 60s (上限)
    _backoffInterval() {
        const backoff = this.baseInterval * Math.pow(2, Math.min(this.consecutiveFailures - 3, 4));
        return Math.min(backoff, 60000);
    }

    _canRestart() {
        return this._recentRestarts().length < this.maxRestarts;
    }

    _recentRestarts() {
        const now = Date.now();
        this.restartHistory = this.restartHistory.filter(t => now - t < this.restartWindow);
        return this.restartHistory;
    }

    getStats() {
        const recent = this._recentRestarts();
        return {
            isRunning: this.isRunning,
            consecutiveFailures: this.consecutiveFailures,
            consecutiveRestartFailures: this.consecutiveRestartFailures,
            currentIntervalSec: Math.round(this.currentInterval / 1000),
            restartsInWindow: recent.length,
            maxRestarts: this.maxRestarts,
            canRestart: this._canRestart()
        };
    }
}

module.exports = GatewayGuardian;
