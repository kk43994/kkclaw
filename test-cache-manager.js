/**
 * 缓存管理器测试脚本
 */

const CacheManager = require('./cache-manager');

async function test() {
  console.log('🧪 开始测试缓存管理器...\n');
  
  // 创建缓存管理器
  const manager = new CacheManager({
    interval: 10000, // 测试时10秒清理一次
    screenshots: 5,   // 只保留5张截图
    voiceFiles: 10,   // 只保留10个语音
    logDays: 7,       // 只保留7天日志
    onCleanup: (result) => {
      console.log('\n📊 清理回调:');
      console.log(`  - 删除文件: ${result.totalFiles}`);
      console.log(`  - 释放空间: ${result.freedMB}MB`);
      console.log(`  - 耗时: ${result.duration}ms`);
    }
  });
  
  // 手动触发一次清理
  console.log('🧹 手动触发清理...\n');
  const result = await manager.triggerCleanup();
  
  console.log('\n✅ 清理结果:');
  console.log(`  截图: ${result.results.screenshots.filesDeleted}个文件, ${(result.results.screenshots.freedBytes / 1024).toFixed(2)}KB`);
  console.log(`  语音: ${result.results.voiceFiles.filesDeleted}个文件, ${(result.results.voiceFiles.freedBytes / 1024).toFixed(2)}KB`);
  console.log(`  日志: ${result.results.logs.filesDeleted}个文件, ${(result.results.logs.freedBytes / 1024).toFixed(2)}KB`);
  console.log(`  应用缓存: ${(result.results.appCache.freedBytes / 1024 / 1024).toFixed(2)}MB`);
  
  console.log(`\n📊 总计: ${result.totalFiles}个文件, ${result.freedMB}MB`);
  
  // 查看统计
  const stats = manager.getStats();
  console.log('\n📈 统计信息:');
  console.log(`  上次清理: ${stats.lastCleanup}`);
  console.log(`  清理次数: ${stats.cleanupCount}`);
  console.log(`  累计清理: ${stats.totalCleanedMB}MB`);
  
  console.log('\n✅ 测试完成!');
  console.log('💡 提示: 自动清理将在启动桌面龙虾后每6小时执行一次');
}

test().catch(console.error);
