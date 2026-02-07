// 🔄 自动重启系统 - 真正的进程守护
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class AutoRestartManager {
    constructor(options = {}) {
        this.maxRestarts = options.maxRestarts || 10; // 最大重启次数
        this.restartWindow = options.restartWindow || 60 * 60 * 1000; // 1小时窗口
        this.minUptime = options.minUptime || 10 * 1000; // 最小运行时间10秒
        this.restartDelay = options.restartDelay || 3000; // 重启延迟3秒
        
        this.restartHistory = [];
        this.stateFile = path.join(
            process.env.USERPROFILE || process.env.HOME,
            'openclaw-data',
            'desktop-pet-state.json'
        );
        
        this.loadState();
    }

    // 加载状态
    loadState() {
        try {
            if (fs.existsSync(this.stateFile)) {
                const data = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
                this.restartHistory = data.restartHistory || [];
                // 清理过期记录
                const cutoff = Date.now() - this.restartWindow;
                this.restartHistory = this.restartHistory.filter(r => r.timestamp > cutoff);
            }
        } catch (err) {
            console.error('加载状态失败:', err);
            this.restartHistory = [];
        }
    }

    // 保存状态
    saveState() {
        try {
            const dir = path.dirname(this.stateFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.stateFile, JSON.stringify({
                restartHistory: this.restartHistory,
                lastUpdate: new Date().toISOString()
            }, null, 2));
        } catch (err) {
            console.error('保存状态失败:', err);
        }
    }

    // 记录重启
    recordRestart(reason, uptime) {
        const restart = {
            timestamp: Date.now(),
            reason,
            uptime
        };
        this.restartHistory.push(restart);
        
        // 只保留窗口内的记录
        const cutoff = Date.now() - this.restartWindow;
        this.restartHistory = this.restartHistory.filter(r => r.timestamp > cutoff);
        
        this.saveState();
        return this.restartHistory.length;
    }

    // 检查是否允许重启
    canRestart(uptime) {
        // 清理过期记录
        const cutoff = Date.now() - this.restartWindow;
        this.restartHistory = this.restartHistory.filter(r => r.timestamp > cutoff);
        
        // 检查重启次数
        if (this.restartHistory.length >= this.maxRestarts) {
            console.error(`⛔ 重启次数过多 (${this.restartHistory.length}/${this.maxRestarts} in ${this.restartWindow/60000}分钟)`);
            return false;
        }
        
        // 检查运行时间
        if (uptime < this.minUptime) {
            console.warn(`⚠️ 运行时间过短 (${uptime}ms < ${this.minUptime}ms)`);
            // 如果连续短时间崩溃，拒绝重启
            const recentRestarts = this.restartHistory.slice(-3);
            const allShortLived = recentRestarts.every(r => r.uptime < this.minUptime);
            if (recentRestarts.length >= 3 && allShortLived) {
                console.error('⛔ 检测到崩溃循环，停止自动重启');
                return false;
            }
        }
        
        return true;
    }

    // 获取重启统计
    getStats() {
        const cutoff = Date.now() - this.restartWindow;
        const recent = this.restartHistory.filter(r => r.timestamp > cutoff);
        
        return {
            totalRestarts: this.restartHistory.length,
            recentRestarts: recent.length,
            maxRestarts: this.maxRestarts,
            windowMinutes: this.restartWindow / 60000,
            canRestart: recent.length < this.maxRestarts,
            history: recent.map(r => ({
                time: new Date(r.timestamp).toLocaleString('zh-CN'),
                reason: r.reason,
                uptime: `${(r.uptime / 1000).toFixed(1)}s`
            }))
        };
    }

    // 计算重启延迟（渐进式延迟）
    getRestartDelay() {
        const recentCount = this.restartHistory.filter(
            r => r.timestamp > Date.now() - this.restartWindow
        ).length;
        
        // 重启次数越多，延迟越长
        const delay = this.restartDelay * Math.pow(1.5, Math.min(recentCount, 5));
        return Math.min(delay, 60000); // 最多延迟1分钟
    }
}

// Electron 主进程集成的重启处理
class ElectronRestartHandler {
    constructor(app, options = {}) {
        this.app = app;
        this.manager = new AutoRestartManager(options);
        this.startTime = Date.now();
        this.setupHandlers();
    }

    setupHandlers() {
        // 未捕获异常
        process.on('uncaughtException', (error) => {
            console.error('🔥 未捕获异常:', error);
            this.handleCrash('uncaughtException', error);
        });

        // Promise 拒绝
        process.on('unhandledRejection', (reason, promise) => {
            console.error('🔥 未处理的 Promise 拒绝:', reason);
            this.handleCrash('unhandledRejection', reason);
        });

        // 优雅退出
        process.on('SIGTERM', () => {
            console.log('📴 收到 SIGTERM 信号');
            this.gracefulShutdown('SIGTERM');
        });

        process.on('SIGINT', () => {
            console.log('📴 收到 SIGINT 信号');
            this.gracefulShutdown('SIGINT');
        });

        // Electron 特定事件
        if (this.app) {
            this.app.on('will-quit', (event) => {
                console.log('🚪 应用即将退出');
            });
        }
    }

    handleCrash(reason, error) {
        const uptime = Date.now() - this.startTime;
        const errorMessage = error?.message || error?.toString() || 'Unknown error';
        
        console.error(`💥 崩溃检测: ${reason} - ${errorMessage}`);
        console.error(`⏱️ 运行时间: ${(uptime / 1000).toFixed(1)}秒`);
        
        // 检查是否可以重启
        if (this.manager.canRestart(uptime)) {
            const restartCount = this.manager.recordRestart(reason, uptime);
            const delay = this.manager.getRestartDelay();
            
            console.log(`🔄 准备重启 (${restartCount}/${this.manager.maxRestarts}), 延迟 ${delay}ms`);
            
            setTimeout(() => {
                this.restart(reason);
            }, delay);
        } else {
            console.error('⛔ 无法重启，已达到重启限制');
            this.emergencyShutdown();
        }
    }

    restart(reason) {
        console.log(`🔄 正在重启应用 (原因: ${reason})`);
        
        // 获取当前执行路径
        const appPath = process.argv[0];
        const args = process.argv.slice(1);
        
        // 重启应用
        const child = spawn(appPath, args, {
            detached: true,
            stdio: 'ignore',
            shell: true,
            env: {
                ...process.env,
                RESTARTED_BY: 'auto-restart',
                RESTART_REASON: reason
            }
        });
        
        child.unref();
        
        // 退出当前进程
        process.exit(0);
    }

    gracefulShutdown(signal) {
        console.log(`👋 优雅退出 (${signal})`);
        
        // 记录正常退出，但不重启
        const uptime = Date.now() - this.startTime;
        console.log(`⏱️ 运行时间: ${(uptime / 1000).toFixed(1)}秒`);
        
        // 清理工作
        setTimeout(() => {
            process.exit(0);
        }, 1000);
    }

    emergencyShutdown() {
        console.error('🚨 紧急关闭');
        process.exit(1);
    }

    getStats() {
        const uptime = Date.now() - this.startTime;
        return {
            uptime: {
                ms: uptime,
                seconds: (uptime / 1000).toFixed(1),
                formatted: this.formatUptime(uptime)
            },
            restart: this.manager.getStats(),
            wasRestarted: process.env.RESTARTED_BY === 'auto-restart',
            lastRestartReason: process.env.RESTART_REASON || null
        };
    }

    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}天 ${hours % 24}小时`;
        } else if (hours > 0) {
            return `${hours}小时 ${minutes % 60}分钟`;
        } else if (minutes > 0) {
            return `${minutes}分钟 ${seconds % 60}秒`;
        } else {
            return `${seconds}秒`;
        }
    }
}

module.exports = {
    AutoRestartManager,
    ElectronRestartHandler
};
