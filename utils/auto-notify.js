// 自动通知桌面的包装函数
// 我可以在回复时调用这个

async function notifyDesktopAuto(userMessage, myReply) {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    const desktopPath = 'C:\\Users\\zhouk\\Desktop\\02_开发项目\\desktop-pet';
    
    try {
        // 先通知用户消息
        if (userMessage) {
            await execAsync(`node "${desktopPath}\\notify-desktop.js" user-message "${userMessage.replace(/"/g, '\\"')}"`);
            console.log('✅ 用户消息已通知桌面');
        }
        
        // 等待1秒后通知我的回复
        if (myReply) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await execAsync(`node "${desktopPath}\\notify-desktop.js" agent-response "${myReply.replace(/"/g, '\\"')}"`);
            console.log('✅ AI回复已通知桌面');
        }
        
        return true;
    } catch (err) {
        console.error('❌ 桌面通知失败:', err.message);
        return false;
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = notifyDesktopAuto;
}

// 命令行使用示例:
// node auto-notify.js "用户消息" "我的回复"
if (require.main === module) {
    const userMsg = process.argv[2];
    const myReply = process.argv[3];
    notifyDesktopAuto(userMsg, myReply);
}
