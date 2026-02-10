// 桌面通知辅助工具 - 修复版
const http = require('http');

function notifyDesktop(type, payload) {
    const data = JSON.stringify({ type, payload });
    
    const options = {
        hostname: '127.0.0.1',
        port: 18788,
        path: '/notify',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
        }
    };

    const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => {
            responseData += chunk;
        });
        res.on('end', () => {
            if (res.statusCode === 200) {
                console.log('✅ 通知已发送');
            } else {
                console.log('❌ 通知发送失败:', responseData);
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ 通知发送失败:', error.message);
    });

    req.write(data);
    req.end();
}

// 从命令行参数获取类型和内容
const args = process.argv.slice(2);
if (args.length >= 2) {
    const type = args[0];
    const content = args.slice(1).join(' ');
    
    let payload;
    if (type === 'user-message') {
        payload = { 
            sender: '用户', 
            content: content
        };
    } else if (type === 'agent-response') {
        payload = { 
            content: content
        };
    } else {
        payload = { 
            message: content
        };
    }
    
    notifyDesktop(type, payload);
} else {
    console.log('用法: node notify-desktop.js <type> <content>');
    console.log('示例: node notify-desktop.js user-message "你好"');
    console.log('示例: node notify-desktop.js agent-response "我收到了"');
}
