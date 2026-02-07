// 测试自动重启系统
const { AutoRestartManager } = require('./auto-restart');

async function test() {
    console.log('🧪 测试自动重启系统\n');
    
    const manager = new AutoRestartManager({
        maxRestarts: 5,
        restartWindow: 5 * 60 * 1000, // 5分钟窗口
        minUptime: 5 * 1000 // 5秒最小运行时间
    });
    
    console.log('📊 初始状态:');
    console.log(JSON.stringify(manager.getStats(), null, 2));
    console.log('');
    
    // 测试1: 正常重启
    console.log('✅ 测试1: 正常重启 (运行30秒)');
    const canRestart1 = manager.canRestart(30000);
    console.log(`  可以重启: ${canRestart1}`);
    if (canRestart1) {
        manager.recordRestart('test-normal', 30000);
        console.log(`  重启延迟: ${manager.getRestartDelay()}ms`);
    }
    console.log('');
    
    // 测试2: 短时间崩溃
    console.log('⚠️ 测试2: 短时间崩溃 (运行2秒)');
    const canRestart2 = manager.canRestart(2000);
    console.log(`  可以重启: ${canRestart2}`);
    if (canRestart2) {
        manager.recordRestart('test-crash', 2000);
        console.log(`  重启延迟: ${manager.getRestartDelay()}ms`);
    }
    console.log('');
    
    // 测试3: 连续崩溃
    console.log('🔥 测试3: 模拟连续崩溃');
    for (let i = 0; i < 4; i++) {
        const uptime = Math.random() * 10000; // 随机运行时间
        const canRestart = manager.canRestart(uptime);
        console.log(`  第${i + 1}次: 运行${(uptime / 1000).toFixed(1)}秒, 可重启: ${canRestart}`);
        if (canRestart) {
            manager.recordRestart(`test-crash-${i}`, uptime);
        } else {
            console.log('  ⛔ 达到重启限制');
            break;
        }
    }
    console.log('');
    
    // 最终统计
    console.log('📊 最终统计:');
    const stats = manager.getStats();
    console.log(JSON.stringify(stats, null, 2));
    console.log('');
    
    // 测试状态持久化
    console.log('💾 测试状态持久化');
    manager.saveState();
    console.log('  状态已保存');
    
    const manager2 = new AutoRestartManager({
        maxRestarts: 5,
        restartWindow: 5 * 60 * 1000
    });
    console.log('  新实例加载状态:');
    console.log(JSON.stringify(manager2.getStats(), null, 2));
    
    console.log('\n✅ 测试完成');
}

test().catch(console.error);
