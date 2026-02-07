// 测试智能语音系统
const SmartVoiceSystem = require('./smart-voice');

async function test() {
    console.log('🧪 测试智能语音系统\n');
    
    const voice = new SmartVoiceSystem();
    
    // 测试1: 成功消息
    console.log('✅ 测试1: 成功消息');
    await voice.speak('✅ 部署成功！所有系统运行正常');
    await new Promise(r => setTimeout(r, 2000));
    
    // 测试2: 错误消息
    console.log('\n🔥 测试2: 错误消息');
    await voice.speak('🔥 检测到错误！系统正在尝试恢复');
    await new Promise(r => setTimeout(r, 2000));
    
    // 测试3: 数据消息
    console.log('\n📊 测试3: 数据消息');
    await voice.speak('📊 性能监控报告：内存使用50MB，CPU占用2%');
    await new Promise(r => setTimeout(r, 2000));
    
    // 测试4: 庆祝消息
    console.log('\n🎉 测试4: 庆祝消息');
    await voice.speak('🎉 恭喜！P0阶段全部完成');
    await new Promise(r => setTimeout(r, 2000));
    
    // 测试5: 口语化处理
    console.log('\n💬 测试5: 口语化处理');
    await voice.speak('API调用成功，JSON数据已保存，100MB空间已释放');
    await new Promise(r => setTimeout(r, 2000));
    
    // 测试6: 去重测试
    console.log('\n🔄 测试6: 去重测试');
    await voice.speak('完成');
    await new Promise(r => setTimeout(r, 1000));
    await voice.speak('完成'); // 应该被跳过
    await new Promise(r => setTimeout(r, 2000));
    
    // 测试7: 队列测试
    console.log('\n📝 测试7: 队列测试');
    voice.speak('消息1');
    voice.speak('消息2');
    voice.speak('消息3');
    await new Promise(r => setTimeout(r, 10000));
    
    // 获取统计
    console.log('\n📊 播报统计:');
    const stats = voice.getStats();
    console.log(JSON.stringify(stats, null, 2));
    
    console.log('\n✅ 测试完成');
    process.exit(0);
}

test().catch(err => {
    console.error('测试失败:', err);
    process.exit(1);
});
