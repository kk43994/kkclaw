// 快速通知函数 - 直接在 Node.js 中使用
async function notifyDesktop(type, payload) {
    try {
        const response = await fetch('http://127.0.0.1:18788/notify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ type, payload })
        });
        
        if (response.ok) {
            console.log('✅ 桌面通知已发送');
            return true;
        } else {
            console.log('❌ 桌面通知发送失败');
            return false;
        }
    } catch (err) {
        console.log('❌ 桌面应用未运行或连接失败');
        return false;
    }
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = notifyDesktop;
}
