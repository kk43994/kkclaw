// 测试全局错误处理系统
const GlobalErrorHandler = require('./global-error-handler');

async function test() {
    console.log('🧪 测试全局错误处理系统\n');
    
    const handler = new GlobalErrorHandler({
        exitOnCritical: false, // 测试模式，不退出
        maxRecoveryAttempts: 3
    });
    
    // 监听事件
    handler.on('error', (errorInfo) => {
        console.log(`📥 捕获错误事件: ${errorInfo.type}`);
    });
    
    handler.on('warning', (warningInfo) => {
        console.log(`📥 捕获警告事件: ${warningInfo.type}`);
    });
    
    handler.on('recovery', async (errorInfo) => {
        console.log(`📥 触发恢复事件: ${errorInfo.type}`);
        // 模拟恢复操作
        await new Promise(r => setTimeout(r, 100));
        console.log('✅ 恢复操作完成');
    });
    
    console.log('📊 初始统计:');
    console.log(JSON.stringify(handler.getStats(), null, 2));
    console.log('');
    
    // 测试1: Promise 拒绝
    console.log('⚠️ 测试1: 未处理的 Promise 拒绝');
    Promise.reject(new Error('测试 Promise 拒绝'));
    await new Promise(r => setTimeout(r, 1000));
    console.log('');
    
    // 测试2: 警告
    console.log('⚠️ 测试2: 触发警告');
    process.emit('warning', {
        name: 'TestWarning',
        message: '这是一个测试警告',
        stack: new Error().stack
    });
    await new Promise(r => setTimeout(r, 500));
    console.log('');
    
    // 测试3: 查看统计
    console.log('📊 当前统计:');
    const stats = handler.getStats();
    console.log(JSON.stringify(stats, null, 2));
    console.log('');
    
    // 测试4: 错误历史
    console.log('📜 错误历史:');
    const history = handler.getErrorHistory(5);
    history.forEach((e, i) => {
        console.log(`  ${i + 1}. [${e.type}] ${e.message} - ${e.time}`);
    });
    console.log('');
    
    // 测试5: 恢复尝试
    console.log('🔄 测试恢复机制:');
    for (let i = 0; i < 4; i++) {
        const recovered = await handler.attemptRecovery({
            type: 'test-error',
            error: new Error('测试恢复'),
            timestamp: Date.now()
        });
        console.log(`  尝试 ${i + 1}: ${recovered ? '成功' : '失败'}`);
    }
    console.log('');
    
    console.log('📊 最终统计:');
    console.log(JSON.stringify(handler.getStats(), null, 2));
    console.log('');
    
    console.log('✅ 测试完成');
    process.exit(0);
}

test().catch(err => {
    console.error('测试失败:', err);
    process.exit(1);
});
