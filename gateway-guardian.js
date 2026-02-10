// Gateway 进程守护模块 — 指数退避 + 自适应频率
const EventEmitter = require('events');

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

        this.isRunning = false;
        this.checkTimer = null;
        this.currentInterval = this.baseInterval;
        this.consecutiveFailures = 0;
        this.restartHistory = [];
        this.isRestarting = false; // 防止重复触发
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

        const healthy = await this._ping();

        if (healthy) {
            this._onHealthy();
        } else {
            await this._onUnhealthy();
        }
    }

    // 健康检查
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

    // 健康时：重置计数，降频到 30s
    _onHealthy() {
        if (this.consecutiveFailures > 0) {
            console.log('[Guardian] Gateway 已恢复');
            this.emit('recovered');
        }
        this.consecutiveFailures = 0;
        this.isRestarting = false;
        this._scheduleNext(this.healthyInterval);
    }

    // 不健康时：指数退避 + 自动重启
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

        if (this._canRestart()) {
            this.isRestarting = true;
            this.emit('unhealthy', { reason, consecutiveFailures: this.consecutiveFailures });

            // 委托 ServiceManager 执行重启
            const result = await this.serviceManager.restartGateway();
            this.restartHistory.push(Date.now());

            if (result.success) {
                this.consecutiveFailures = 0;
                this.isRestarting = false;
                console.log('[Guardian] Gateway 重启成功');
                this.emit('restarted', {
                    restartCount: this._recentRestarts().length,
                    maxRestarts: this.maxRestarts
                });
                this._scheduleNext(this.healthyInterval);
            } else {
                this.isRestarting = false;
                console.log(`[Guardian] Gateway 重启失败: ${result.error}`);
                this.emit('restart-failed', { error: result.error });
                this._scheduleNext(this._backoffInterval());
            }
        } else {
            // 达到重启上限，进入长间隔监控（不放弃）
            console.log(`[Guardian] 重启次数达上限，进入低频监控 (${this.maxInterval / 1000}s)`);
            this.emit('restart-limit-reached', { restartHistory: this.restartHistory });
            this._scheduleNext(this.maxInterval);
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
            currentIntervalSec: Math.round(this.currentInterval / 1000),
            restartsInWindow: recent.length,
            maxRestarts: this.maxRestarts,
            canRestart: this._canRestart()
        };
    }
}

module.exports = GatewayGuardian;
