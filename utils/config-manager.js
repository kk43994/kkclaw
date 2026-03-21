// 配置缓存管理器（单例）
const fs = require('fs');
const pathResolver = require('./openclaw-path-resolver');
const SafeConfigLoader = require('./safe-config-loader');

class ConfigManager {
    constructor() {
        this._cache = null;
        this._lastModified = 0;
        this._watcher = null;
    }

    /**
     * 获取配置（带缓存）
     */
    getConfig() {
        const configPath = pathResolver.getConfigPath();
        try {
            const stats = fs.existsSync(configPath) ? fs.statSync(configPath) : null;
            const currentModified = stats ? stats.mtimeMs : 0;

            // 缓存有效
            if (this._cache && currentModified === this._lastModified) {
                return this._cache;
            }

            // 重新加载
            this._cache = SafeConfigLoader.load(configPath, {});
            this._lastModified = currentModified;

            // 启动文件监听（仅一次）
            if (!this._watcher && stats) {
                this._startWatcher(configPath);
            }

            return this._cache;
        } catch (err) {
            console.error('配置读取失败:', err.message);
            return this._cache || {};
        }
    }

    /**
     * 启动文件监听
     */
    _startWatcher(configPath) {
        try {
            this._watcher = fs.watch(configPath, () => {
                this._cache = null; // 清除缓存
            });
        } catch (err) {
            console.warn('配置文件监听启动失败:', err.message);
        }
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this._cache = null;
        this._lastModified = 0;
    }

    /**
     * 停止监听
     */
    destroy() {
        if (this._watcher) {
            this._watcher.close();
            this._watcher = null;
        }
    }
}

// 导出单例
module.exports = new ConfigManager();
