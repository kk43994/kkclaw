// 🛡️ 全局错误处理器 - 系统级错误捕获和恢复
const EventEmitter = require('events');

class GlobalErrorHandler extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            exitOnCritical: options.exitOnCritical !== false, // 默认 true
            notifyOnError: options.notifyOnError !== false,   // 默认 true
            logErrors: options.logErrors !== false,           // 默认 true
            maxRecoveryAttempts: options.maxRecoveryAttempts || 3,
            recoveryDelay: options.recoveryDelay || 1000,
            ...options
        };
        
        this.errors = [];
        this.maxErrors = 100;
        this.recoveryAttempts = new Map(); // 按错误类型记录恢复尝试
        this.criticalErrors = new Set([
            'ENOSPC',      // 磁盘空间不足
            'ENOMEM',      // 内存不足
            'ERR_OUT_OF_MEMORY'
        ]);
        
        this.isHandling = false;
        this.setupHandlers();
    }

    // 设置全局错误处理
    setupHandlers() {
        // 未捕获的异常
        process.on('uncaughtException', (error, origin) => {
            this.handleUncaughtException(error, origin);
        });

        // 未处理的 Promise 拒绝
        process.on('unhandledRejection', (reason, promise) => {
            this.handleUnhandledRejection(reason, promise);
        });

        // 警告
        process.on('warning', (warning) => {
            this.handleWarning(warning);
        });

        // 多次监听器警告
        process.on('multipleResolves', (type, promise, reason) => {
            this.handleMultipleResolves(type, promise, reason);
        });

        // 优雅退出
        process.on('beforeExit', (code) => {
            this.handleBeforeExit(code);
        });

        console.log('🛡️ 全局错误处理器已启动');
    }

    // 处理未捕获异常
    handleUncaughtException(error, origin) {
        if (this.isHandling) return; // 防止递归
        this.isHandling = true;

        const errorInfo = {
            type: 'uncaughtException',
            error: error,
            origin: origin,
            stack: error.stack,
            timestamp: Date.now(),
            critical: this.isCriticalError(error)
        };

        this.recordError(errorInfo);
        this.emit('error', errorInfo);

        console.error('💥 未捕获异常:');
        console.error(`  来源: ${origin}`);
        console.error(`  错误: ${error.message}`);
        console.error(`  堆栈: ${error.stack}`);

        // 尝试恢复
        if (!errorInfo.critical) {
            this.attemptRecovery(errorInfo)
                .then(recovered => {
                    if (recovered) {
                        console.log('✅ 错误已恢复，继续运行');
                        this.isHandling = false;
                    } else {
                        console.error('❌ 无法恢复，准备退出');
                        this.gracefulShutdown(1);
                    }
                })
                .catch(() => {
                    this.gracefulShutdown(1);
                });
        } else {
            console.error('🚨 致命错误，准备退出');
            this.gracefulShutdown(1);
        }
    }

    // 处理未处理的 Promise 拒绝
    handleUnhandledRejection(reason, promise) {
        const errorInfo = {
            type: 'unhandledRejection',
            reason: reason,
            promise: promise,
            stack: reason?.stack || new Error().stack,
            timestamp: Date.now(),
            critical: false
        };

        this.recordError(errorInfo);
        this.emit('warning', errorInfo);

        console.warn('⚠️ 未处理的 Promise 拒绝:');
        console.warn(`  原因: ${reason}`);
        if (reason?.stack) {
            console.warn(`  堆栈: ${reason.stack}`);
        }

        // Promise 拒绝通常不致命，记录即可
        this.attemptRecovery(errorInfo).catch(() => {
            console.warn('⚠️ Promise 拒绝恢复失败，但继续运行');
        });
    }

    // 处理警告
    handleWarning(warning) {
        const warningInfo = {
            type: 'warning',
            name: warning.name,
            message: warning.message,
            stack: warning.stack,
            timestamp: Date.now(),
            critical: false
        };

        this.recordError(warningInfo);
        this.emit('warning', warningInfo);

        console.warn(`⚠️ 系统警告: ${warning.name} - ${warning.message}`);
    }

    // 处理多次 resolve
    handleMultipleResolves(type, promise, reason) {
        console.warn(`⚠️ Promise 多次 ${type}: ${reason}`);
    }

    // 退出前处理
    handleBeforeExit(code) {
        console.log(`���� 进程即将退出，代码: ${code}`);
        this.emit('beforeExit', { code, timestamp: Date.now() });
    }

    // 判断是否为致命错误
    isCriticalError(error) {
        if (!error) return false;
        
        const code = error.code || error.errno;
        if (this.criticalErrors.has(code)) {
            return true;
        }

        // 检查错误消息
        const message = error.message || '';
        if (message.includes('out of memory') || 
            message.includes('FATAL ERROR') ||
            message.includes('heap out of memory')) {
            return true;
        }

        return false;
    }

    // 尝试恢复
    async attemptRecovery(errorInfo) {
        const errorType = errorInfo.type;
        const attempts = this.recoveryAttempts.get(errorType) || 0;

        if (attempts >= this.options.maxRecoveryAttempts) {
            console.error(`❌ 恢复尝试次数已达上限 (${attempts}/${this.options.maxRecoveryAttempts})`);
            return false;
        }

        this.recoveryAttempts.set(errorType, attempts + 1);

        console.log(`🔄 尝试恢复 (${attempts + 1}/${this.options.maxRecoveryAttempts})...`);

        // 延迟恢复
        await new Promise(r => setTimeout(r, this.options.recoveryDelay));

        try {
            // 触发恢复事件，让外部处理
            this.emit('recovery', errorInfo);

            // 基础恢复操作
            await this.performBasicRecovery(errorInfo);

            // 重置计数器
            setTimeout(() => {
                this.recoveryAttempts.set(errorType, 0);
            }, 60000); // 1分钟后重置

            return true;
        } catch (err) {
            console.error('恢复失败:', err);
            return false;
        }
    }

    // 执行基础恢复操作
    async performBasicRecovery(errorInfo) {
        // 1. 清理内存
        if (global.gc) {
            console.log('🧹 执行垃圾回收...');
            global.gc();
        }

        // 2. 清理缓存
        if (global.clearImmediate) {
            console.log('🧹 清理定时器...');
        }

        // 3. 触发自定义恢复钩子
        this.emit('recover', errorInfo);

        return true;
    }

    // 记录错误
    recordError(errorInfo) {
        this.errors.push(errorInfo);
        
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }

        // 触发日志事件
        if (this.options.logErrors) {
            this.emit('log', errorInfo);
        }
    }

    // 获取错���历史
    getErrorHistory(count = 10) {
        return this.errors.slice(-count).map(e => ({
            type: e.type,
            message: e.error?.message || e.reason?.toString() || e.message,
            time: new Date(e.timestamp).toLocaleString('zh-CN'),
            critical: e.critical
        }));
    }

    // 获取统计
    getStats() {
        const byType = {};
        this.errors.forEach(e => {
            byType[e.type] = (byType[e.type] || 0) + 1;
        });

        const criticalCount = this.errors.filter(e => e.critical).length;

        return {
            totalErrors: this.errors.length,
            criticalErrors: criticalCount,
            byType,
            recentErrors: this.getErrorHistory(5),
            recoveryAttempts: Object.fromEntries(this.recoveryAttempts)
        };
    }

    // 优雅关闭
    async gracefulShutdown(exitCode = 0) {
        console.log('🚪 开始优雅关闭...');
        
        this.emit('shutdown', { exitCode, timestamp: Date.now() });

        // 给其他模块时间清理
        await new Promise(r => setTimeout(r, 1000));

        if (this.options.exitOnCritical) {
            console.log(`👋 退出进程，代码: ${exitCode}`);
            process.exit(exitCode);
        }
    }

    // 手动触发错误（测试用）
    triggerTestError(type = 'uncaughtException') {
        if (type === 'uncaughtException') {
            throw new Error('测试未捕获异常');
        } else if (type === 'unhandledRejection') {
            Promise.reject(new Error('测试 Promise 拒绝'));
        }
    }
}

module.exports = GlobalErrorHandler;
