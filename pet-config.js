// 配置存储系统
const fs = require('fs').promises;
const path = require('path');
const { safeStorage } = require('electron');

// Keys that contain sensitive data and should be encrypted
const SENSITIVE_KEYS = ['minimax.apiKey', 'dashscope.apiKey'];

class PetConfig {
    constructor() {
        this.configPath = path.join(__dirname, 'pet-config.json');
        this.config = {
            position: { x: null, y: null },
            mood: 'happy', // happy, thinking, busy, sleepy
            theme: 'default',
            voiceEnabled: true,
            lastSeen: Date.now()
        };
    }

    _canEncrypt() {
        try {
            return safeStorage.isEncryptionAvailable();
        } catch {
            return false;
        }
    }

    _encrypt(value) {
        if (!value || !this._canEncrypt()) return value;
        if (typeof value !== 'string' || value.startsWith('enc:')) return value;
        try {
            const encrypted = safeStorage.encryptString(value);
            return 'enc:' + encrypted.toString('base64');
        } catch {
            return value;
        }
    }

    _decrypt(value) {
        if (!value || typeof value !== 'string' || !value.startsWith('enc:')) return value;
        if (!this._canEncrypt()) return value;
        try {
            const buffer = Buffer.from(value.slice(4), 'base64');
            return safeStorage.decryptString(buffer);
        } catch {
            return value;
        }
    }

    _decryptSensitive(config) {
        for (const keyPath of SENSITIVE_KEYS) {
            const [section, key] = keyPath.split('.');
            if (config[section] && config[section][key]) {
                config[section][key] = this._decrypt(config[section][key]);
            }
        }
    }

    _encryptSensitive(config) {
        const copy = JSON.parse(JSON.stringify(config));
        for (const keyPath of SENSITIVE_KEYS) {
            const [section, key] = keyPath.split('.');
            if (copy[section] && copy[section][key]) {
                copy[section][key] = this._encrypt(copy[section][key]);
            }
        }
        return copy;
    }

    async load() {
        try {
            const data = await fs.readFile(this.configPath, 'utf-8');
            this.config = { ...this.config, ...JSON.parse(data) };
            this._decryptSensitive(this.config);
            console.log('✅ 配置加载成功');
        } catch (err) {
            console.log('📝 使用默认配置');
        }
        return this.config;
    }

    async save() {
        try {
            const toSave = this._encryptSensitive(this.config);
            await fs.writeFile(this.configPath, JSON.stringify(toSave, null, 2));
            console.log('💾 配置已保存');
        } catch (err) {
            console.error('❌ 保存配置失败:', err);
        }
    }

    set(key, value) {
        this.config[key] = value;
        // 防抖保存：高频调用（如拖动）时不会每次都写磁盘
        if (this._saveTimer) clearTimeout(this._saveTimer);
        this._saveTimer = setTimeout(() => this.save(), 500);
    }

    get(key) {
        return this.config[key];
    }

    isConfigComplete() {
        return this.config.setupComplete === true;
    }
}

module.exports = PetConfig;
