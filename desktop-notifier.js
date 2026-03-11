// 桌面通知客户端 - 让主会话可以推送通知到桌面
const http = require('http');
const EventEmitter = require('events');

class DesktopNotifier extends EventEmitter {
    constructor(port = 18788) {
        super();
        this.basePort = port;
        this.port = port;
        this.maxRetries = 5; // 最多尝试5个端口
        this.server = null;
    }

    async start() {
        for (let i = 0; i < this.maxRetries; i++) {
            const tryPort = this.basePort + i;
            try {
                await this._tryListen(tryPort);
                this.port = tryPort;
                const { colorLog } = require('./utils/color-log');
                colorLog(`✅ 桌面通知服务器启动: http://127.0.0.1:${this.port}`);
                return true;
            } catch (err) {
                if (err.code === 'EADDRINUSE') {
                    console.log(`⚠️ 端口 ${tryPort} 被占用，尝试下一个...`);
                    continue;
                }
                throw err;
            }
        }
        console.error(`❌ 无法启动通知服务器，端口 ${this.basePort}-${this.basePort + this.maxRetries - 1} 都被占用`);
        return false;
    }

    _tryListen(port) {
        return new Promise((resolve, reject) => {
            const server = http.createServer((req, res) => {
                this._handleRequest(req, res);
            });

            server.on('error', (err) => {
                reject(err);
            });

            server.listen(port, '127.0.0.1', () => {
                this.server = server;
                resolve();
            });
        });
    }

    _handleRequest(req, res) {
        // 设置 CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        if (req.method === 'POST' && req.url === '/notify') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    this._handleNotification(data);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ ok: true }));
                } catch (err) {
                    console.error('通知处理失败:', err);
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: err.message }));
                }
            });
        } else if (req.method === 'GET' && req.url === '/health') {
            // 健康检查端点
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, port: this.port }));
        } else {
            res.writeHead(404);
            res.end();
        }
    }

    _handleNotification(data) {
        const { type, payload } = data;
        // 不再打印完整 payload — 各事件处理器（main.js）已有详细日志
        // 只打印类型，避免与 🤖/👤 日志重复
        console.log(`📢 收到通知: ${type}`);
        this.emit(type, payload);
    }

    // 兼容旧的 on 方法（现在继承自 EventEmitter）

    getPort() {
        return this.port;
    }

    stop() {
        if (this.server) {
            this.server.close();
            this.server = null;
            console.log('🛑 通知服务器已停止');
        }
    }
}

module.exports = DesktopNotifier;
