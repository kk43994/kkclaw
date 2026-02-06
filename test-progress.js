// 进度汇报测试 - 演示实时通知
const ProgressReporter = require('./progress-reporter');

async function demoProgressReport() {
    const reporter = new ProgressReporter();
    
    // 方式1: 手动逐步汇报
    console.log('=== 方式1: 手动汇报 ===');
    reporter.startTask('文件处理', ['读取', '分析', '转换', '保存']);
    
    await sleep(2000);
    reporter.progress('正在读取文件...');
    
    await sleep(2000);
    reporter.progress('正在分析内容...', 50);
    
    await sleep(2000);
    reporter.progress('正在转换格式...', 75);
    
    await sleep(2000);
    reporter.complete('文件处理完成!');
    
    await sleep(3000);
    
    // 方式2: 自动步骤执行
    console.log('=== 方式2: 自动步骤 ===');
    await reporter.runSteps('代码优化', [
        {
            name: '扫描代码',
            action: async () => {
                console.log('  -> 扫描中...');
                await sleep(1500);
            }
        },
        {
            name: '检测问题',
            action: async () => {
                console.log('  -> 检测中...');
                await sleep(1500);
            }
        },
        {
            name: '生成方案',
            action: async () => {
                console.log('  -> 生成中...');
                await sleep(1500);
            }
        },
        {
            name: '应用修改',
            action: async () => {
                console.log('  -> 修改中...');
                await sleep(1500);
            },
            delay: 500
        }
    ]);
    
    console.log('✅ 演示完成!');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 运行演示
demoProgressReport().catch(console.error);
