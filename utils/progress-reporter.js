// 进度汇报工具 - 实时通知桌面
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class ProgressReporter {
    constructor(desktopNotifyPath = null) {
        this.desktopNotifyPath = desktopNotifyPath || require('path').join(__dirname, 'notify-desktop.js');
        this.currentTask = null;
        this.steps = [];
        this.currentStep = 0;
    }

    // 开始新任务
    startTask(taskName, steps = []) {
        this.currentTask = taskName;
        this.steps = steps;
        this.currentStep = 0;
        this.notify('task-start', `🚀 开始: ${taskName}`);
    }

    // 更新进度
    progress(message, percentage = null) {
        this.currentStep++;
        let msg = message;
        
        if (percentage !== null) {
            msg = `[${percentage}%] ${message}`;
        } else if (this.steps.length > 0) {
            const percent = Math.round((this.currentStep / this.steps.length) * 100);
            msg = `[${percent}%] ${message}`;
        }
        
        this.notify('task-progress', `⚙️ ${msg}`);
    }

    // 完成任务
    complete(message = '任务完成') {
        this.notify('task-complete', `✅ ${message}`);
        this.currentTask = null;
        this.steps = [];
        this.currentStep = 0;
    }

    // 任务失败
    error(message) {
        this.notify('task-error', `❌ ${message}`);
        this.currentTask = null;
    }

    // 发送通知到桌面
    async notify(type, message) {
        try {
            const cmd = `node "${this.desktopNotifyPath}" agent-response "${message}"`;
            await execAsync(cmd);
            console.log(`📢 进度通知: ${message}`);
        } catch (err) {
            console.error('进度通知失败:', err.message);
        }
    }

    // 步骤式任务
    async runSteps(taskName, steps) {
        this.startTask(taskName, steps);
        
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            this.progress(step.name || `步骤 ${i + 1}`);
            
            if (step.action && typeof step.action === 'function') {
                try {
                    await step.action();
                } catch (err) {
                    this.error(`${step.name} 失败: ${err.message}`);
                    throw err;
                }
            }
            
            if (step.delay) {
                await new Promise(resolve => setTimeout(resolve, step.delay));
            }
        }
        
        this.complete(`${taskName} 完成`);
    }
}

// 使用示例:
// const reporter = new ProgressReporter();
// reporter.startTask('代码重构', ['分析代码', '生成方案', '执行修改', '测试验证']);
// reporter.progress('正在分析代码结构...');
// reporter.progress('生成重构方案...', 50);
// reporter.complete('重构完成!');

module.exports = ProgressReporter;
