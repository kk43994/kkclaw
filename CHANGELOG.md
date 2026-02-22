# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project loosely follows semantic versioning.


## [3.0.0] - 2026-02-22

### 🎤 Setup Wizard Voice Configuration Improvements

#### New Features
- ✨ **Preset voice selection**: 8 official MiniMax voices (female-tianmei, female-shaonv, diadia_xuemei, qiaopi_mengmei, tianxin_xiaoling, lovely_girl, Sweet_Girl, Cute_Elf)
- ✨ **Custom voice_id input**: Manual input field for users who cloned voices in MiniMax console
- ✨ **Current voice display**: Real-time display of selected voice_id in UI
- ✨ **Permission detection**: Auto-detect and warn if using someone else's cloned voice

#### Bug Fixes
- 🐛 **Fixed error 2042**: Test playback now uses current selected voice_id instead of old config
- 🐛 **Fixed default voice**: New users default to official preset voices, avoiding permission errors
- 🐛 **Fixed voice priority**: Configuration file voice_id takes precedence over defaults

#### Improvements
- 💡 **3 configuration methods**: Preset selection / Custom input / Upload & clone
- 💡 **Smart fallback**: If no voice_id configured, uses official preset instead of unavailable cloned voice
- 💡 **Better UX**: Voice selection dropdown with descriptions, custom input for advanced users

---

## [2.2.0] - 2026-02-15

### 🛡️ Gateway Error Diagnosis Chain
- **Gateway Guardian v2**: Startup grace period (60s), prevents false-positive restarts during slow init
- **Service Manager**: Captures stdout + stderr from gateway process for error diagnosis
- **Error extraction**: `_extractErrorReason()` parses gateway output to identify root cause
- **Restart notifications**: Desktop notifications now show specific error reasons (not just "restart failed")
- **Restart-limit-reached event**: Emits last error for UI display when entering low-frequency monitoring
- **shell:false**: Spawns gateway without shell wrapper for cleaner process management

### 🔄 Safe Model Switching with Rollback
- **Optimistic update + verify**: Switches model, waits for gateway reload, then verifies
- **Auto-rollback**: If gateway fails to load new model within 5s, rolls back to previous model
- **Switch logging**: Detailed logs for every switch attempt (success/fail/rollback)
- **Gateway reload detection**: `_waitForGatewayReload()` polls gateway status after config write

### 📊 Session Management & Context Tracking
- **Tray menu**: New "会话管理" submenu with context status and session clear
- **Context length check**: Estimates token usage percentage before each request
- **Token estimation**: Chinese (~2 tokens/char) and English (~1.3 tokens/word) heuristics
- **Request tracking**: Numbered requests with timing, error history (last 50), request history (last 20)
- **Timeout warnings**: 30s timeout detection with diagnostic suggestions
- **Session clear**: One-click session cleanup from tray menu

### 🔧 OpenClaw Client v2
- **Request counter**: Sequential request IDs for log correlation
- **Error history**: Tracks last 50 errors with request ID, message, elapsed time
- **Context awareness**: `checkContextLength()` warns when approaching model limits
- **Graceful degradation**: Better error messages with actionable suggestions

---

## [2.0.4] - 2026-02-11

### 🏗️ Major Refactor
- **Project restructure**: 97 files reorganized — clean separation of concerns
  - `voice/` — all TTS engines (MiniMax, CosyVoice, DashScope, Edge)
  - `utils/` — auto-notify, progress-reporter, notify helpers
  - `scripts/` — build scripts, shortcuts, screenshots
  - `docs-dev/` — developer documentation (30+ files moved)
  - `archive/` — deprecated voice files
  - `tests/` — test files isolated

### 🔒 Security
- **Hardcoded credentials removed**: 5 files cleaned (API keys, tokens, personal paths)
- **Safe runtime config**: `openclaw-client.js` reads tokens from `~/.openclaw/openclaw.json` at runtime
- **Asar audit**: 0 leaks verified in packaged build

### 🎨 Enhanced
- **GitHub Pages v3.0**: Interactive 7-emotion ball demo, click-to-switch mood
- **Brand upgrade**: kkclaw branding throughout
- **README rewrite**: Bilingual, screenshots gallery, architecture diagrams

### 🔧 Added
- **KKClaw Switch logger** (`utils/switch-logger.js`): 132-line provider switch tracking
- **Service manager** (`service-manager.js`): Unified service lifecycle
- **Project structure doc** (`PROJECT-STRUCTURE.md`): Complete file map
- **Feature guide** (`docs-dev/FEATURE-GUIDE.md`): 1446-line comprehensive guide

### 📦 Build
- **Windows exe installer**: 74MB NSIS installer, electron-builder
- **GitHub Release v2.0.3→v2.0.4**: Automated build pipeline
- **Repo renamed**: `claw-desktop-pet` → `KKClaw-Desktop-Pet`

### 🐛 Fixes
- Fixed `model-switcher.js` import path error
- Removed legacy files: `gateway-listener.js`, `lark-uploader.js`, `work-logger.js`, etc.
- Cleaned up 7 test files that shouldn't ship in production

---

## [2.0.3] - 2026-02-10

### 🎨 Enhanced
- **Silky smooth color transitions**: Upgraded mood color changes from basic `ease` to layered `cubic-bezier` curves
- **Tri-layer gradient timing**: Inner fluid (2.2s), blob1 (1.8s), blob2 (2.6s) create visual depth
- **Blush & opacity transitions**: Happy-mode blush and sleepy-mode opacity now fade smoothly (1.5s/2.5s)
- **Material Design easing**: All transitions use `cubic-bezier(0.4, 0.0, 0.2, 1)` for natural motion

### 🔧 Added
- **KKClaw Switch Auto-Sync Watcher** (`kkclaw-auto-sync.js`): Monitors `~/.cc-switch/cc-switch.db` every 2s, auto-syncs provider changes to OpenClaw with minimal restart
- **Integrated into Desktop Pet lifecycle**: Watcher starts with pet, stops on quit—no manual management needed
- **Installed `better-sqlite3`** dependency for DB monitoring

---

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
