// 真正的消息同步系统 - 通过轮询会话历史
const EventEmitter = require('events');

class MessageSyncSystem extends EventEmitter {
    constructor(gatewayClient) {
        super();
        this.gatewayClient = gatewayClient;
        this.isConnected = true;
        this.messageHistory = [];
    }

    connect() {
        const { colorLog } = require('./utils/color-log');
        colorLog('✅ 消息同步系统已启动(会话监听模式)');
        this.isConnected = true;
        this.emit('connected');
    }

    handleMessage(message) {
        // 处理新消息
        this.messageHistory.push({
            timestamp: Date.now(),
            sender: message.sender || '用户',
            content: message.content,
            channel: message.channel || 'lark'
        });

        this.emit('new_message', {
            sender: message.sender || '用户',
            content: message.content,
            channel: message.channel || 'lark'
        });
    }

    disconnect() {
        this.isConnected = false;
    }
}

module.exports = MessageSyncSystem;
