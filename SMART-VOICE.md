# 🎙️ 智能语音播报系统 - 开发文档

## 概述

升级桌面龙虾的语音系统，让播报更智能、更人性化、涵盖更多场景。

## 核心模块

### **smart-voice.js** - 智能语音系统

#### 新增功能

**1. 智能内容分析**
- 自动分类：success, error, warning, data, celebration
- 优先级识别：high, medium, normal, low
- 情境检测：happy, urgent, calm, excited

**2. 口语化处理**
- 技术术语转换 (API→接口, JSON→数据)
- 数字读法优化 (100MB→100兆)
- 自然停顿添加
- 连接词补充

**3. 智能过滤**
- 去重检测 (5秒内重复内容)
- 内容过短/纯标点过滤
- 长度智能处理 (>300字自动摘要)

**4. 情境化播报**
- 根据内容调整语速和音调
- 紧急消息换男声 (云溪)
- 成功消息音调更高
- 重要消息插队

**5. 播报队列**
- 最多排队10条
- 高优先级插队
- 自动依次播放

## 对比 working-voice.js

| 功能 | working-voice.js | smart-voice.js | 提升 |
|------|-----------------|----------------|------|
| 内容分析 | ❌ | ✅ | 智能分类和优先级 |
| 口语化 | 基础 | ✅ | 完整技术术语转换 |
| 去重 | 简单 | ✅ | 5秒窗口 + 内容比对 |
| 情境播报 | ❌ | ✅ | 根据内容调整语音 |
| 优先级 | ❌ | ✅ | 高优先级插队 |
| 统计 | ❌ | ✅ | 完整播报统计 |

## API

### 基础方法

```javascript
// 智能播报 (带选项)
await voice.speak(text, {
  priority: 'high',    // 优先级
  context: 'urgent',   // 情境
  emotion: 'happy'     // 情绪
});

// 开关语音
voice.toggle(true/false);

// 设置模式
voice.setMode('normal' | 'excited' | 'calm' | 'urgent');

// 获取统计
const stats = voice.getStats();

// 清空队列
voice.clearQueue();

// 停止播放
voice.stop();
```

### IPC 接口 (main.js)

```javascript
// 基础播报
await window.ipc.invoke('voice-speak', text, options);

// 获取统计
await window.ipc.invoke('voice-stats');

// 设置模式
await window.ipc.invoke('voice-set-mode', 'excited');

// 清空队列
await window.ipc.invoke('voice-clear-queue');

// 开关
await window.ipc.invoke('set-voice-enabled', true);
```

## 集成场景

### 1. 缓存清理播报

**旧版:**
```javascript
voice.speak(`清理缓存完成,释放了50MB空间`);
```

**新版:**
```javascript
voice.speak(`清理缓存完成，释放了50兆字节空间`, {
  priority: 'normal'
});
// 播报: "清理缓存完成， 释放了50兆字节空间"
```

### 2. 服务状态播报

**新增场景:**
```javascript
// 服务断开
voice.speak('OpenClaw服务断开连接', { priority: 'high' });
// 播报: "OpenClaw服务断开连接" (高优先级,插队)

// 服务恢复
voice.speak('OpenClaw服务已连接', { priority: 'normal' });
```

### 3. 性能告警播报

**新增场景:**
```javascript
// 性能告警 (每30分钟检查)
if (health.status === 'critical') {
  voice.speak(`性能告警，健康评分仅${health.score}分`, { 
    priority: 'high' 
  });
}
// 播报: "性能告警， 健康评分仅50分" (高优先级,紧急语气)
```

### 4. 错误恢复播报

**新增场景:**
```javascript
errorHandler.on('recovery', () => {
  voice.speak('检测到错误，正在尝试恢复');
});
// 播报: "检测到错误， 正在尝试恢复"
```

## 播报分类处理

### 成功消息 (happy)
- 识别: ✅, 完成, 成功, 好
- 效果: 音调更高, 添加感叹号
- 示例: "部署成功！" (音调 +30Hz)

### 错误消息 (urgent)
- 识别: 🔥, 紧急, 错误, 崩溃, 失败
- 效果: 换男声, 语速加快
- 示例: "检测到错误" (云溪男声, 语速 +10%)

### 警告消息 (concern)
- 识别: ⚠️, 警告, 注意
- 效果: 中等优先级
- 示例: "性能警告"

### 庆祝消息 (excited)
- 识别: 🎉, 恭喜, 太好了
- 效果: 语速更快, 音调更高
- 示例: "恭喜！P0完成" (语速 +20%, 音调 +50Hz)

### 数据消息 (data)
- 识别: 📊, 监控, 性能, 统计
- 效果: 标准播报
- 示例: "性能监控报告"

## 口语化示例

**技术术语转换:**
```
"API调用成功，JSON数据已保存，100MB空间已释放"
↓
"接口调用成功， 数据已保存， 100兆空间已释放"
```

**数字优化:**
```
"内存使用50MB，CPU占用2%"
↓
"内存使用50兆， 处理器占用百分之2"
```

**断句优化:**
```
"完成部署，启动成功，开始运行"
↓
"完成部署， 启动成功， 开始运行"
(添加停顿，更自然)
```

## 智能过滤

### 跳过的内容
- 长度 < 2 字符
- 纯标点或空白
- 5秒内重复内容
- ���数字
- 清理后为空

### 长度处理
- \>300字: 自动摘要
- 取前面关键句子
- 添加"等内容,详情请查看桌面"

## 统计数据

```javascript
{
  totalSpoken: 42,        // 总播报次数
  totalSkipped: 15,       // 跳过次数
  totalQueued: 8,         // 排队次数
  avgDuration: 5.2,       // 平均时长(秒)
  queueLength: 0,         // 当前队列
  isSpeaking: false,      // 是否播报中
  enabled: true           // 是否启用
}
```

## 性能影响

- **内存占用:** ~500KB (比旧版略高)
- **文件大小:** 13.8KB vs 7.2KB (+91%)
- **播报延迟:** <100ms (分析时间)
- **队列处理:** 自动,无阻塞

## 测试

### 运行测试
```bash
node test-smart-voice.js
```

### 测试场景
- ✅ 成功消息
- 🔥 错误消息
- 📊 数据消息
- 🎉 庆祝消息
- 💬 口语化处理
- 🔄 去重测试
- 📝 队列测试

## 最佳实践

### 1. 合理使用优先级
```javascript
// ❌ 滥用高优先级
voice.speak('完成', { priority: 'high' });

// ✅ 仅紧急情况
voice.speak('系统崩溃', { priority: 'high' });
```

### 2. 避免过长内容
```javascript
// ❌ 超长文本
voice.speak(longText); // 会自动截断,不优雅

// ✅ 精炼关键信息
voice.speak('部署完成,共5个模块');
```

### 3. 善用情境模式
```javascript
// 调试模式 - 更详细
voice.setMode('normal');

// 演示模式 - 更兴奋
voice.setMode('excited');

// 夜间模式 - 更平静
voice.setMode('calm');
```

## 未来优化

可选的增强功能:
- [ ] 多语言支持 (英文播报)
- [ ] 更多声音选择 (晓晓、云溪、晓萱)
- [ ] 背景音乐支持
- [ ] 语音情感分析
- [ ] 个性化语音设置

## 总结

✅ **完成度: 100%**

核心功能:
- ✅ 智能内容分析
- ✅ 口语化处理
- ✅ 情境化播报
- ✅ 优先级队列
- ✅ 完整统计
- ✅ 多场景集成

**效果: 播报更自然、更智能、更人性化** 🎙️
