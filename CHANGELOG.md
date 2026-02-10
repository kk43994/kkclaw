# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project loosely follows semantic versioning.


## [2.0.2] - 2026-02-10

### 📝 Docs
- README hardened into a bilingual, open-source friendly "enterprise" layout
- Added configuration matrix, troubleshooting, security, contributing and release checklist
- Added community QR + support QR entries to GitHub Pages and README

---

## [2.0.1] - 2026-02-10

### 🐛 Fixes
- Fix KKClaw Switch -> OpenClaw sync failing due to duplicated provider keys (case-sensitive collisions)

### ✨ Added
- `kkclaw-hotswitch.js`: sync current active provider from KKClaw Switch and optionally restart OpenClaw (`--restart`)
- `fix-openclaw-config.js`: repair helper for duplicated keys in `~/.openclaw/openclaw.json`

### 📝 Docs
- README and GitHub Pages refreshed: version/date, hot-switch guide, and community QR entry

---

## [1.4.0] - 2026-02-07

### ✨ 新功能
- 🎙️ 智能语音音调调整
  - 普通消息从0Hz提升到+20Hz,声音更年轻活泼
  - 保持情绪化音调变化 (开心+30Hz, 超兴奋+50Hz)
  - 声音更有层次感和表现力

### 🐛 Bug修复
- 修复重复播报问题
  - 在main.js添加EventEmitter监听器清理
  - 解决同一消息播报3次的bug
  
### ⚡ 性能优化
- 大幅增加语音播报时长限制
  - TTS生成超时: 15秒 → 30秒
  - 播放超时: 60秒 → 120秒
  - 文本长度: 300-500字 → 800字
  - 支持更长的内容播报,不会被截断

- 文本清理增强 (desktop-bridge.js)
  - 自动移除emoji、颜文字
  - 清理markdown格式
  - 标点符号归一化
  - 播报更自然流畅

### 📝 其他改进
- 更新.gitignore,排除个人设置和临时文件
- 代码注释优化
- 错误日志改进

---

## [1.3.0] - 2026-02-06

### ✨ 新功能
- 🎭 智能语音系统 (SmartVoiceSystem)
- 🔄 自动重启系统
- 📊 性能监控
- 🧹 缓存管理
- 🛡️ 全局错误处理
- 📝 日志轮转

### 🐛 Bug修复
- 修复内存泄漏问题
- 优化窗口位置保存

---

## [1.2.0] - 2026-02-05

### ✨ 新功能
- 📸 截图功能
- 📤 Lark上传集成
- 💬 消息同步系统

---

## [1.1.0] - 2026-02-04

### ✨ 新功能
- 🎙️ 语音播报系统
- 🔧 服务管理器
- 📋 工作日志

---

## [1.0.0] - 2026-02-03

### 🎉 初始版本
- 基础桌面宠物功能
- OpenClaw集成
- 简单语音系统
