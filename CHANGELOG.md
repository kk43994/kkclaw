# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.1.2] - 2026-03-11

### Fixed
- **Edge TTS 语音播报修复** — 修正 `--text-file` → `--file` 参数，修复语音播报全部失败的问题
- **macOS 托盘图标修复** — 使用 22×22 Template PNG 替换原 128×121 RGB 图标，消除黑色方框
- **macOS 球体透明度修复** — 添加 `backgroundColor: '#00000000'`，仅在 Windows 上禁用硬件加速
- **外部链接修复** — `open-external` IPC 调用改为直接 `shell.openExternal`，修复链接无法打开
- **Preload 白名单补全** — 添加 `wizard-save-voice-id` 通道，修复语音克隆 ID 保存失败

## [3.1.1] - 2026-03-11

### Security
- **命令注入修复** — 音频播放 (`_playAudioFile`, `_playAudio`) 由 `exec()` 字符串拼接改为 `execFile()`/`spawn()` + 参数数组
- **Edge TTS 命令注入修复** — 文本通过临时文件 (`--text-file`) 传递，替代内联 `--text`
- **Token 安全** — ��态配置读取替代模块级缓存；新增 `SecureStorage`、`LogSanitizer`、`IpcValidator` 模块

### Added
- **模型热切换** — 状态机 + 策略模式 + 切换历史记录
- **Gateway 智能监控** — 异常检测、健康评分、指标采集、智能探测器
- **SessionLockManager** — 安全并发访问的会话锁管理
- **openclaw-path-resolver** — 消除硬编码路径

### Fixed
- **`stop()` 终止播放** — 正确终止正在运行的音频进程

## [3.0.0] - 2026-02-22

### Added
- **Setup Wizard 配置向导** — RPG 游戏风格，7 ���引导流程（Gateway → 模型 → 渠道 → TTS → 播报 → 显示 → 测试）
- **一键音色克隆** — 上传 30 秒录音，自动调 MiniMax/CosyVoice API 创建专属音色
- **人设定制系统** — 5 种预设风格（甜妹/专业/幽默/酷帅/自定义），一键生成 `AGENTS.md` + `SOUL.md` + `USER.md` + `HEARTBEAT.md`
- **14 种情绪系统** — 在原 7 种基础上新增 sad、angry、fearful、calm、excited、love、focused，每种有专属 glow 光效
- **情绪文本检测** — `desktop-bridge.js` 自动分析内容情绪，10 种匹配规则
- **Doctor 自检系统** — 10 项全自动诊断（Gateway / 托盘 / TTS / 模型 / 端口 / 健康度 / 缓存 / 歌词 / 日志），每项带修复建议
- **模型管理升级** — 延迟测速、Provider CRUD、模型增删
- **预设语音选择** — 8 种官方 MiniMax 语音 + 自定义 voice_id 输入

### Fixed
- **voice_id 错误 2042** — 测试播放使用当前选中 voice_id 而非旧配置
- **默认语音** — 新用户默认使用官方预设语音，避免权限错误
- **语音优先级** — 配置文件 voice_id 优先于默认值

### Security
- **API Key 加密存储** — `safeStorage` 加密，密钥不再明文写入磁盘
- **preload 安全沙箱** — 主窗口/歌词/诊断/模型设置全部走 IPC 白名单
- **渲染进程错误转发** — `preload-error` + `console-message` 转发到主进程日志

## [2.2.0] - 2026-02-15

### Added
- **Gateway Guardian v2** — 启动宽限期（60s），防止慢启动误触重启
- **安全模型切换与回滚** — 乐观更新 + 验证，5s 内失败自动回滚
- **会话管理** — 托盘菜单新增「会话管理」子菜单，支持上下文状态查看与一键清理
- **OpenClaw Client v2** — 请求计数器、错误历史（最近 50 条）、上下文长度感知

### Improved
- **Service Manager** — 捕获 stdout + stderr，解析错误根因
- **进程管理** — `shell:false` 直接 spawn，更干净的进程管控

## [2.0.4] - 2026-02-11

### Changed
- **项目重构** — 97 个文件重新组织，按职责分离（`voice/`、`utils/`、`scripts/`、`docs-dev/`、`archive/`、`tests/`）
- **品牌升级** — 全面使用 kkclaw 品牌

### Security
- **清除硬编码凭证** — 5 个文件清理（API keys、tokens、个人路径）
- **运行时安全配置** — `openclaw-client.js` 从 `~/.openclaw/openclaw.json` 运行时读取 token
- **Asar 审计** — 打包产物 0 泄漏验证

### Added
- **KKClaw Switch 日志** (`utils/switch-logger.js`) — Provider 切换跟踪
- **服务管理器** (`service-manager.js`) — 统一服务生命周期
- **GitHub Pages v3.0** — 交互式 7 情绪球 demo

### Fixed
- 修复 `model-switcher.js` 引入路径错误
- 清理不应打包的测试文件

## [2.0.3] - 2026-02-10

### Improved
- **丝滑色彩过渡** — 从基础 `ease` 升级到分层 `cubic-bezier` 曲线
- **三层渐变时序** — inner fluid (2.2s)、blob1 (1.8s)、blob2 (2.6s) 营造视觉层次

### Added
- **KKClaw Switch 自动同步** (`kkclaw-auto-sync.js`) — 监控 `~/.cc-switch/cc-switch.db`，自动同步 Provider 变更
- **集成到桌面宠物生命周期** — 随宠物启动/退出，无需手动管理

## [2.0.2] - 2026-02-10

### Improved
- README 强化为双语企业级布局
- 新增配置矩阵、故障排查、安全、贡献与发布清单

## [2.0.1] - 2026-02-10

### Fixed
- KKClaw Switch → OpenClaw 同步因大小写冲突导致 Provider 键重复

### Added
- `kkclaw-hotswitch.js` — 同步当前 Provider 并可选重启 OpenClaw
- `fix-openclaw-config.js` — 修复重复键的配置修复工具

## [1.4.0] - 2026-02-07

### Added
- **智能语音音调** — 普通消息 +20Hz，情绪化音调变化（开心 +30Hz，超兴奋 +50Hz）

### Fixed
- 修复重复播报问题 — EventEmitter 监听器清理，解决同一消息播报 3 次的 bug

### Improved
- TTS 生成超时 15s → 30s，播放超时 60s → 120s，文本上限 500 → 800 字
- 文本清理增强 — 自动移除 emoji、颜文字、markdown 格式，标点归一化

## [1.3.0] - 2026-02-06

### Added
- 智能语音系统 (SmartVoiceSystem)
- 自动重启系统
- 性能监控
- 缓存管理
- 全局错误处理
- 日志轮转

### Fixed
- 修复内存泄漏问题
- 优化窗口位置保存

## [1.2.0] - 2026-02-05

### Added
- 截图功能
- Lark 上传集成
- 消息同步系统

## [1.1.0] - 2026-02-04

### Added
- 语音播报系统
- 服务管理器
- 工作日志

## [1.0.0] - 2026-02-03

### Added
- 基础桌面宠物功能
- OpenClaw 集成
- 简单语音系统

[3.1.2]: https://github.com/kk43994/kkclaw/compare/v3.1.1...v3.1.2
[3.1.1]: https://github.com/kk43994/kkclaw/compare/v3.0.0...v3.1.1
[3.0.0]: https://github.com/kk43994/kkclaw/compare/v2.2.0...v3.0.0
[2.2.0]: https://github.com/kk43994/kkclaw/compare/v2.0.4...v2.2.0
[2.0.4]: https://github.com/kk43994/kkclaw/compare/v2.0.3...v2.0.4
[2.0.3]: https://github.com/kk43994/kkclaw/compare/v2.0.2...v2.0.3
[2.0.2]: https://github.com/kk43994/kkclaw/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/kk43994/kkclaw/compare/v1.4.0...v2.0.1
[1.4.0]: https://github.com/kk43994/kkclaw/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/kk43994/kkclaw/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/kk43994/kkclaw/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/kk43994/kkclaw/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/kk43994/kkclaw/releases/tag/v1.0.0
