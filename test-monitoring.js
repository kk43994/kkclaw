// 测试性能监控和日志系统
const PerformanceMonitor = require('./performance-monitor');
const LogRotationManager = require('./log-rotation');

async function testPerformanceMonitor() {
    console.log('📊 测试性能监控系统\n');
    
    const monitor = new PerformanceMonitor({
        interval: 1000, // 1秒采样（测试用）
        maxSamples: 10
    });
    
    // 启动监控
    monitor.start();
    
    // 等待几秒采集数据
    await new Promise(r => setTimeout(r, 5000));
    
    // 获取当前统计
    console.log('📈 当前性能状态:');
    const stats = monitor.getCurrentStats();
    console.log(JSON.stringify(stats, null, 2));
    console.log('');
    
    // 模拟错误
    console.log('🔥 模拟错误...');
    monitor.recordError('test', '测试错误1', 'error');
    monitor.recordError('test', '测试警告1', 'warning');
    monitor.recordError('crash', '模拟崩溃', 'error');
    console.log('');
    
    // 获取历史数据
    console.log('📉 历史数据:');
    const history = monitor.getHistoryData(1);
    console.log(`采样数: ${history.samples}`);
    console.log(`内存范围: ${monitor.formatBytes(history.memory.min)} - ${monitor.formatBytes(history.memory.max)}`);
    console.log('');
    
    // 健康检查
    console.log('💚 健康评分:');
    const health = monitor.calculateHealthScore();
    console.log(JSON.stringify(health, null, 2));
    console.log('');
    
    // 生成报告
    console.log('📄 生成性能报告...');
    const report = await monitor.generateReport();
    console.log(`报告已保存: ${report.generatedAt}`);
    console.log('');
    
    monitor.stop();
    console.log('✅ 性能监控测试完成\n');
}

async function testLogRotation() {
    console.log('📝 测试日志轮转系统\n');
    
    const rotation = new LogRotationManager({
        maxAge: 7, // 测试用：7天
        maxSize: 1024 * 1024 // 测试用：1MB
    });
    
    // 获取日志统计
    console.log('📊 日志统计:');
    const stats = await rotation.getStats();
    console.log(JSON.stringify(stats, null, 2));
    console.log('');
    
    // 列出最近日志
    console.log('📋 最近的日志文件:');
    const recent = await rotation.listRecentLogs(5);
    recent.forEach(log => {
        console.log(`  ${log.name} - ${log.size} - ${log.modified}`);
    });
    console.log('');
    
    // 执行轮转
    console.log('🔄 执行日志轮转...');
    const rotateResult = await rotation.rotate();
    console.log(`  删除: ${rotateResult.deleted}个文件`);
    console.log(`  压缩: ${rotateResult.compressed}个文件`);
    console.log('');
    
    console.log('✅ 日志轮转测试完成\n');
}

async function main() {
    console.log('🧪 开始测试日志与监控系统\n');
    console.log('='.repeat(60) + '\n');
    
    await testPerformanceMonitor();
    await testLogRotation();
    
    console.log('='.repeat(60));
    console.log('✅ 所有测试完成');
}

main().catch(console.error);
