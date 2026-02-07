# 🧹 自动缓存清理系统

## 功能概述

桌面龙虾现在具备完整的自动缓存清理能力,确保长期运行不会占用过多磁盘空间。

## 🎯 清理内容

### 1. 截图文件 📸
- **位置**: `screenshots/` 目录
- **策略**: 保留最近 50 张
- **影响**: 旧的截图会自动删除

### 2. 语音文件 🔊
- **位置**: `temp/` 和 `voice-cache/` 目录
- **策略**: 保留最近 100 个
- **影响**: TTS 生成的临时音频文件会被清理

### 3. 日志文件 📝
- **位置**: `../../../openclaw-data/memory/` 目录
- **策略**: 保留最近 30 天
- **影响**: 30 天前的每日日志会被删除(MEMORY.md 不会删除)

### 4. 应用缓存 💾
- **位置**: Electron session 缓存
- **策略**: 每次清理时清空
- **影响**: 网页缓存等会被清除

## ⏰ 清理时机

### 自动清理
- **频率**: 每 6 小时一次
- **首次**: 应用启动时立即执行一次
- **后续**: 6小时、12小时、18小时...自动执行

### 手动清理
可以通过以下方式手动触发:
```javascript
// 在渲染进程中
await window.api.cacheCleanup();
```

## 📊 清理反馈

### 语音播报
当清理释放空间超过 10MB 时,会语音播报:
```
"清理缓存完成,释放了 XX MB 空间"
```

### 桌面通知
清理完成后会发送事件到桌面窗口:
```javascript
// 监听清理事件
ipcRenderer.on('cache-cleaned', (event, result) => {
  console.log(`清理了 ${result.totalFiles} 个文件`);
  console.log(`释放了 ${result.freedMB} MB 空间`);
});
```

### 日志记录
每次清理都会记录到工作日志:
```
🧹 清理缓存: 23个文件, 45.6MB
```

## 🔧 配置选项

在 `main.js` 中可以调整清理策略:

```javascript
cacheManager = new CacheManager({
  interval: 6 * 60 * 60 * 1000,  // 清理间隔(毫秒)
  screenshots: 50,                // 保留截图数量
  voiceFiles: 100,                // 保留语音文件数量
  logDays: 30,                    // 保留日志天数
  onCleanup: (result) => {        // 清理回调
    // 自定义处理
  }
});
```

## 📈 统计信息

可以查询清理统计:
```javascript
const stats = await window.api.cacheStats();
console.log(stats);
/*
{
  lastCleanup: Date,        // 上次清理时间
  totalCleaned: Number,     // 累计清理字节
  cleanupCount: Number,     // 清理次数
  totalCleanedMB: String    // 累计清理(MB)
}
*/
```

## 🧪 测试

运行测试脚本验证功能:
```bash
node test-cache-manager.js
```

输出示例:
```
🧹 手动触发清理...

✅ 清理结果:
  截图: 15个文件, 2340.56KB
  语音: 45个文件, 8920.12KB
  日志: 3个文件, 456.78KB
  应用缓存: 50.00MB

📊 总计: 63个文件, 61.23MB
```

## 💡 注意事项

1. **重要文件不会删除**
   - `MEMORY.md` (长期记忆)
   - `README.md` 等文档
   - 最近的截图和语音文件

2. **清理是安全的**
   - 只删除旧文件
   - 保留策略确保不影响使用
   - 清理前会检查文件时间

3. **性能影响**
   - 清理过程在后台执行
   - 不会影响正常使用
   - 通常在 100ms 内完成

4. **手动控制**
   - 可以随时停止自动清理: `cacheManager.stop()`
   - 可以随时手动触发: `cacheManager.triggerCleanup()`

## 🚀 下一步优化

可以考虑的增强功能:
- [ ] UI 界面显示清理进度
- [ ] 清理前确认对话框
- [ ] 更细粒度的清理策略
- [ ] 按文件大小清理(不只是数量)
- [ ] 压缩旧文件而不是删除

---

**状态**: ✅ 已实现并集成到 main.js  
**测试**: 运行 `node test-cache-manager.js`  
**生效**: 重启桌面龙虾后自动启用
