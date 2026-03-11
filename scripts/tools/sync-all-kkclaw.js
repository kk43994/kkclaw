// 批量同步所有 KKCLAW provider 到完整模型列表
const ModelSwitcher = require('./model-switcher');

async function syncAllKKCLAW() {
  console.log('🔄 批量同步所有 KKCLAW provider...\n');

  try {
    const switcher = new ModelSwitcher();
    const providers = switcher.getProviders();

    const kkclawProviders = providers.filter(p =>
      p.baseUrl?.includes('gptclubapi') || p.features?.includes('quota-query')
    );

    if (kkclawProviders.length === 0) {
      console.log('❌ 没有检测到 KKCLAW provider');
      return;
    }

    console.log(`📋 检测到 ${kkclawProviders.length} 个 KKCLAW provider\n`);

    for (const p of kkclawProviders) {
      console.log(`🔄 同步 ${p.name} (当前 ${p.modelCount} 个模型)...`);
      try {
        const result = await switcher.syncProviderModels(p.name);
        console.log(`   ✅ 同步完成: ${p.modelCount} → ${result.count} 个模型\n`);
      } catch (err) {
        console.log(`   ❌ 同步失败: ${err.message}\n`);
      }
    }

    console.log('✅ 批量同步完成！');
  } catch (err) {
    console.error('❌ 同步失败:', err.message);
  }
}

syncAllKKCLAW();
