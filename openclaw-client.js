// OpenClaw 连接模块
const path = require('path');
const fs = require('fs');

const OPENCLAW_HOST = 'http://127.0.0.1:18789';

// 从 openclaw.json 自动读取 token
function getOpenClawToken() {
    if (process.env.OPENCLAW_GATEWAY_TOKEN) return process.env.OPENCLAW_GATEWAY_TOKEN;
    try {
        const configPath = path.join(process.env.HOME || process.env.USERPROFILE, '.openclaw', 'openclaw.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return config.gateway?.auth?.token || '';
    } catch (e) {
        return '';
    }
}
const OPENCLAW_TOKEN = getOpenClawToken();

class OpenClawClient {
    constructor() {
        this.connected = false;
        this.sessionKey = null;
        this.lastCheckTime = 0;
        this.checkInterval = 10000; // 10秒检查一次,不要太频繁
        this.onError = null; // 错误回调，用于触发服务管理器检测
        this.currentSessionId = null; // 当前会话 ID
        this.sessionTokenCount = 0; // 当前会话 token 估算
        this.requestCounter = 0; // 请求计数器
        this.errorHistory = []; // 错误历史记录
        this.maxErrorHistory = 50; // 最多保留50条错误
        this.requestHistory = []; // 请求历史记录
        this.maxRequestHistory = 20; // 最多保留20条请求记录
    }

    // 设置错误回调
    setErrorHandler(handler) {
        this.onError = handler;
    }

    async checkConnection() {
        // 避免频繁检查
        const now = Date.now();
        if (now - this.lastCheckTime < this.checkInterval && this.connected) {
            return this.connected;
        }
        this.lastCheckTime = now;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);

            const testResponse = await fetch(`${OPENCLAW_HOST}/`, {
                method: 'GET',
                signal: controller.signal
            }).catch(() => null);

            clearTimeout(timeoutId);

            this.connected = testResponse !== null;
            return this.connected;
        } catch (err) {
            this.connected = false;
            return false;
        }
    }

    async sendMessage(message) {
        const requestId = ++this.requestCounter;
        const startTime = Date.now();

        console.log(`[Req#${requestId}] 📤 发送消息: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);

        // 检查上下文长度
        const contextCheck = await this.checkContextLength(message);
        if (contextCheck.warning) {
            console.warn(`[Req#${requestId}] ⚠️ ${contextCheck.message}`);
        }

        // 设置超时检测（30秒）
        const timeoutWarning = setTimeout(() => {
            console.error(`[Req#${requestId}] ⏰ 请求超时警告：已等待30秒无响应`);
            console.error(`[Req#${requestId}] 可能原因：1) Gateway处理缓慢 2) API调用超时 3) 网络问题`);
        }, 30000);

        try {
            const response = await fetch(`${OPENCLAW_HOST}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
                    'Content-Type': 'application/json',
                    'x-openclaw-agent-id': 'main'
                },
                body: JSON.stringify({
                    model: 'openclaw:main',
                    messages: [
                        { role: 'user', content: message }
                    ],
                    stream: false
                })
            });

            const elapsed = Date.now() - startTime;

            clearTimeout(timeoutWarning); // 清除超时警告

            if (!response.ok) {
                const errorMsg = `连接失败 (${response.status})`;
                console.error(`[Req#${requestId}] ❌ ${errorMsg} (耗时: ${elapsed}ms)`);

                // 记录错误
                this._recordError(requestId, errorMsg, elapsed, message);

                // 触发服务检测
                if (this.onError) {
                    this.onError(errorMsg);
                }
                this.connected = false;
                return errorMsg;
            }

            this.connected = true;
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || '无响应';

            // 更新 token 计数（粗略估算：中文1字≈2token，英文1词≈1.3token）
            this.sessionTokenCount += this.estimateTokens(message) + this.estimateTokens(content);

            clearTimeout(timeoutWarning); // 确保清除超时警告

            console.log(`[Req#${requestId}] ✅ 收到响应 (耗时: ${elapsed}ms, 累计tokens: ~${this.sessionTokenCount})`);

            // 记录成功的请求
            this._recordRequest(requestId, message, content, elapsed, true);

            return content;
        } catch (err) {
            clearTimeout(timeoutWarning); // 清除超时警告
            const elapsed = Date.now() - startTime;
            console.error(`[Req#${requestId}] ❌ 发送消息失败 (耗时: ${elapsed}ms):`, err.message);

            // 记录错误
            this._recordError(requestId, err.message, elapsed, message);

            this.connected = false;
            // 触发服务检测
            if (this.onError) {
                this.onError(err.message);
            }
            return `错误: ${err.message}`;
        }
    }

    /**
     * 记录错误到历史
     */
    _recordError(requestId, error, elapsed, message) {
        this.errorHistory.unshift({
            requestId,
            timestamp: new Date().toISOString(),
            error,
            elapsed,
            message: message.substring(0, 100),
            type: error.includes('超时') ? 'timeout' : error.includes('连接') ? 'connection' : 'unknown'
        });

        // 限制历史记录数量
        if (this.errorHistory.length > this.maxErrorHistory) {
            this.errorHistory = this.errorHistory.slice(0, this.maxErrorHistory);
        }
    }

    /**
     * 记录请求到历史
     */
    _recordRequest(requestId, message, response, elapsed, success) {
        this.requestHistory.unshift({
            requestId,
            timestamp: new Date().toISOString(),
            message: message.substring(0, 100),
            response: response ? response.substring(0, 100) : null,
            elapsed,
            success
        });

        // 限制历史记录数量
        if (this.requestHistory.length > this.maxRequestHistory) {
            this.requestHistory = this.requestHistory.slice(0, this.maxRequestHistory);
        }
    }

    /**
     * 获取最近的错误
     */
    getRecentErrors(limit = 10) {
        return this.errorHistory.slice(0, limit);
    }

    /**
     * 获取最近的请求
     */
    getRecentRequests(limit = 10) {
        return this.requestHistory.slice(0, limit);
    }

    /**
     * 获取诊断信息
     */
    async getDiagnostics() {
        const info = await this.getSessionInfo();
        const contextCheck = await this.checkContextLength('');
        const recentErrors = this.getRecentErrors(5);
        const recentRequests = this.getRecentRequests(5);

        return {
            connection: {
                connected: this.connected,
                lastCheckTime: new Date(this.lastCheckTime).toISOString()
            },
            session: {
                activeSessions: info.activeSessions,
                estimatedTokens: this.sessionTokenCount,
                contextPercentage: contextCheck.percentage,
                contextLimit: contextCheck.limit
            },
            requests: {
                total: this.requestCounter,
                recentCount: recentRequests.length,
                recent: recentRequests
            },
            errors: {
                total: this.errorHistory.length,
                recentCount: recentErrors.length,
                recent: recentErrors
            }
        };
    }

    async getStatus() {
        return this.connected ? 'connected' : 'disconnected';
    }

    /**
     * 估算文本的 token 数量（粗略估算）
     * 中文：1字 ≈ 2 tokens
     * 英文：1词 ≈ 1.3 tokens
     */
    estimateTokens(text) {
        if (!text) return 0;

        // 统计中文字符
        const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
        // 统计英文单词（简单按空格分割）
        const englishWords = text.replace(/[\u4e00-\u9fa5]/g, '').split(/\s+/).filter(w => w.length > 0).length;

        return Math.ceil(chineseChars * 2 + englishWords * 1.3);
    }

    /**
     * 检查上下文长度是否接近限制
     */
    async checkContextLength(newMessage) {
        const newTokens = this.estimateTokens(newMessage);
        const totalTokens = this.sessionTokenCount + newTokens;

        // 从 model-switcher 获取当前模型的上下文限制
        const modelLimit = await this.getCurrentModelLimit();
        const threshold = modelLimit * 0.8; // 80% 阈值

        if (totalTokens > modelLimit) {
            return {
                warning: true,
                level: 'critical',
                message: `上下文已超出限制！当前 ~${totalTokens} tokens，模型限制 ${modelLimit} tokens。建议立即清理会话。`,
                tokens: totalTokens,
                limit: modelLimit,
                percentage: Math.round((totalTokens / modelLimit) * 100)
            };
        } else if (totalTokens > threshold) {
            return {
                warning: true,
                level: 'warning',
                message: `上下文接近限制：~${totalTokens}/${modelLimit} tokens (${Math.round((totalTokens / modelLimit) * 100)}%)`,
                tokens: totalTokens,
                limit: modelLimit,
                percentage: Math.round((totalTokens / modelLimit) * 100)
            };
        }

        return {
            warning: false,
            tokens: totalTokens,
            limit: modelLimit,
            percentage: Math.round((totalTokens / modelLimit) * 100)
        };
    }

    /**
     * 获取当前模型的上下文限制
     */
    async getCurrentModelLimit() {
        try {
            const configPath = path.join(process.env.HOME || process.env.USERPROFILE, '.openclaw', 'openclaw.json');
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            const primaryModel = config.agents?.defaults?.model?.primary;

            if (!primaryModel) return 200000; // 默认 200k

            // 从 providers 中查找模型配置
            const [providerName, modelId] = primaryModel.split('/');
            const provider = config.models?.providers?.[providerName];
            const model = provider?.models?.find(m => m.id === modelId);

            return model?.contextWindow || 200000;
        } catch (err) {
            console.warn('无法读取模型上下文限制，使用默认值 200k');
            return 200000;
        }
    }

    /**
     * 清理当前会话（删除 session 文件）
     */
    async clearCurrentSession() {
        try {
            const sessionDir = path.join(process.env.HOME || process.env.USERPROFILE, '.openclaw', 'agents', 'main', 'sessions');
            const sessionFile = path.join(sessionDir, 'sessions.json');

            if (!fs.existsSync(sessionFile)) {
                console.log('📭 没有找到会话文件');
                return { success: true, message: '没有活动会话' };
            }

            const sessionsData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
            let deletedCount = 0;

            // 删除所有 lark 相关的 session
            for (const [key, value] of Object.entries(sessionsData)) {
                if (key.includes('lark:') && value.sessionId) {
                    const sessionPath = path.join(sessionDir, `${value.sessionId}.jsonl`);
                    const lockPath = sessionPath + '.lock';

                    if (fs.existsSync(sessionPath)) {
                        fs.unlinkSync(sessionPath);
                        deletedCount++;
                        console.log(`🗑️ 已删除会话: ${value.sessionId}`);
                    }
                    if (fs.existsSync(lockPath)) {
                        fs.unlinkSync(lockPath);
                    }
                }
            }

            // 重置 token 计数
            this.sessionTokenCount = 0;
            this.currentSessionId = null;

            console.log(`✅ 已清理 ${deletedCount} 个会话`);
            return {
                success: true,
                message: `已清理 ${deletedCount} 个会话`,
                deletedCount
            };
        } catch (err) {
            console.error('清理会话失败:', err);
            return {
                success: false,
                message: `清理失败: ${err.message}`,
                error: err.message
            };
        }
    }

    /**
     * 获取会话信息
     */
    async getSessionInfo() {
        try {
            const sessionDir = path.join(process.env.HOME || process.env.USERPROFILE, '.openclaw', 'agents', 'main', 'sessions');
            const sessionFile = path.join(sessionDir, 'sessions.json');

            if (!fs.existsSync(sessionFile)) {
                return {
                    activeSessions: 0,
                    estimatedTokens: this.sessionTokenCount,
                    sessions: []
                };
            }

            const sessionsData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
            const sessions = [];

            for (const [key, value] of Object.entries(sessionsData)) {
                if (key.includes('lark:') && value.sessionId) {
                    const sessionPath = path.join(sessionDir, `${value.sessionId}.jsonl`);
                    if (fs.existsSync(sessionPath)) {
                        const stats = fs.statSync(sessionPath);
                        const content = fs.readFileSync(sessionPath, 'utf8');
                        const lines = content.trim().split('\n').filter(l => l.length > 0);

                        sessions.push({
                            key,
                            sessionId: value.sessionId,
                            messageCount: lines.length,
                            sizeKB: Math.round(stats.size / 1024),
                            lastModified: stats.mtime
                        });
                    }
                }
            }

            return {
                activeSessions: sessions.length,
                estimatedTokens: this.sessionTokenCount,
                sessions
            };
        } catch (err) {
            console.error('获取会话信息失败:', err);
            return {
                activeSessions: 0,
                estimatedTokens: this.sessionTokenCount,
                sessions: [],
                error: err.message
            };
        }
    }

    /**
     * 列出所有会话（用于诊断）
     */
    async listSessions() {
        return this.getSessionInfo();
    }
}

module.exports = OpenClawClient;
