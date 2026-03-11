# 🦞 KKClaw Desktop Pet

**[English](#-english) | [中文](#-中文)**

---

<a id="-中文"></a>

## 🇨🇳 中文

**OpenClaw 桌面可视化伴侣 — 流体玻璃球宠物、14情绪系统、声音克隆（MiniMax TTS）、一键配置向导、Gateway 智能守护**

<div align="center">

![Hero Banner](docs/images/hero-banner.png)

*OpenClaw Core + Desktop Embodiment = A living interface with emotion, voice, and presence*

[![Version](https://img.shields.io/badge/version-3.5.2-FF6B4A?style=for-the-badge&logo=github)](https://github.com/kk43994/kkclaw/releases)
[![CI](https://img.shields.io/github/actions/workflow/status/kk43994/kkclaw/ci.yml?style=for-the-badge&logo=github-actions&logoColor=white&label=CI)](https://github.com/kk43994/kkclaw/actions/workflows/ci.yml)
[![Stars](https://img.shields.io/github/stars/kk43994/kkclaw?style=for-the-badge&logo=github&color=FFD700)](https://github.com/kk43994/kkclaw/stargazers)
[![Downloads](https://img.shields.io/github/downloads/kk43994/kkclaw/total?style=for-the-badge&logo=github&color=8B5CF6)](https://github.com/kk43994/kkclaw/releases)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows_|_macOS-0078D6?style=for-the-badge&logo=apple&logoColor=white)](https://github.com/kk43994/kkclaw)
[![Electron](https://img.shields.io/badge/Electron-28.x-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Node](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Release](https://img.shields.io/github/v/release/kk43994/kkclaw?style=for-the-badge&color=34D399&logo=rocket&logoColor=white)](https://github.com/kk43994/kkclaw/releases/latest)
[![Issues](https://img.shields.io/github/issues/kk43994/kkclaw?style=for-the-badge&logo=github&color=F97316)](https://github.com/kk43994/kkclaw/issues)

[🎥 **在线演示**](https://kk43994.github.io/kkclaw/) | [📦 **下载最新版**](https://github.com/kk43994/kkclaw/releases) | [📖 **配置教程**](docs/CONFIGURATION-GUIDE.md) | [💬 **加入社群**](#-社群)

</div>

---

## 🌟 项目亮点

给你的 OpenClaw AI 一个**看得见、听得到**的桌面化身。

### 🦞 球体 & 动画

| 功能 | 说明 |
|------|------|
| 🔮 **会呼吸的小球** | 67px 琉璃球体，内部液体一直在流动，看起来像活的一样（3层流体动画 + 径向渐变 + 双重高光） |
| 🌈 **14种心情颜色** | 开心是暖橙色、伤心是天蓝色、生气是火红色…每种心情自动切换颜色和光晕（14-emotion glow system） |
| 👀 **38种小表情** | 不操作的时候也会自己眨眼、歪头、偷瞄、打盹、星星眼、装死…像真的有脾气（idle micro-expression engine） |
| 🕐 **看时间变表情** | 早上精神、下午犯困、深夜打哈欠，它知道现在几点（时间场景感知：morning / noon / afternoon / evening / latenight） |
| 🖱️ **眼睛跟着鼠标转** | 你移动鼠标，球体的眼睛会跟着光标方向看（mouse tracking） |
| 💗 **害羞会脸红** | 触发特定表情时，脸颊两边会浮现粉色红晕（dynamic blush overlay） |
| 🫧 **身边有小气泡** | 球体周围飘着半透明的小泡泡，增加灵动感（bubble particle decoration） |
| ✨ **点击有弹跳反馈** | 点球体会弹一下 + 颜色闪���下，有手感（squish animation + color pulse） |
| 🎈 **悬浮呼吸效果** | 球体会微微上下浮动，像在水面漂浮（60fps float + breath scaling） |

### 🎙️ 声音 & 语音

| 功能 | 说明 |
|------|------|
| 🎤 **30秒克隆你的声音** | 上传一段30秒录音，AI就能用你的声音说话（MiniMax Voice Cloning API） |
| 🗣️ **14种语气自动切换** | 说开心的事用欢快声、说难过的事用低沉声，自动识别（emotion-aware TTS） |
| 🔉 **永远不会哑巴** | 主引擎挂了自动切备用，备用也挂了用免费的，保证一直有声音（MiniMax → Edge TTS 降级链） |
| ⏸️ **说话会自然停顿** | 在逗号、句号处自然停顿，不是机器人念稿（TTS pause markers `<#0.5#>`） |
| 📝 **桌面字幕同步** | 说话时桌面同步显示字幕，像 KTV 一样一个字一个字蹦出来（typewriter lyrics overlay） |
| 🔇 **不会抢话** | 多条消息同时到不会叠在一起，排队一条条说（priority speech queue） |

### 🧠 人设 & 性格

| 功能 | 说明 |
|------|------|
| 🎭 **5种性格随你选** | 甜妹、专业、幽默、酷帅、自定义，选一个它就变成那种说话风格（personality preset system） |
| 📝 **自动生成人设档案** | 选好性格后一键生成 AI 的「人格档案」，不用自己写提示词（auto-generate AGENTS.md + SOUL.md + USER.md） |
| 💬 **给宠物取名字** | 给宠物起名、设定它怎么叫你，比如"小K叫你主人"（petName + userName 配置） |

### 🛡️ Gateway 智能守护

| 功能 | 说明 |
|------|------|
| ⚡ **挂了自动拉起来** | 检测到 Gateway 没运行会自动帮你启动，不用手动操作（Guardian auto-start，连续3次检测失败后触发） |
| 📊 **实时健康体检** | 后台一直在监控 Gateway 状态，有问题第一时间告诉你（anomaly detection + health scoring） |
| 🎙️ **语音播报状态** | 启动中、成功、失败都用声音告诉你，不用盯控制台（voice status announcement） |
| 🔄 **崩了自动重启** | Gateway 崩溃后自动重启，每小时最多10次防止死循环（auto-restart with rate limiting） |
| 🩺 **10项一键体检** | Gateway / TTS / 模型 / 端口 / 缓存 / 日志等10个维度一键诊断，告诉你怎么修（Doctor self-check） |
| 🔧 **不会误操作** | 重启前会二次确认，避免把好的 Gateway 误杀（cross-validation with ServiceManager） |

### 🧙 新手引导向导

| 功能 | 说明 |
|------|------|
| 🎮 **游戏风格界面** | 木质边框 + 羊皮纸背景 + 龙虾向导 + 打字机对话，像在玩 RPG（RPG-style Setup Wizard） |
| 📋 **7步搞定全部配置** | Gateway → 模型 → 消息渠道 → 语音引擎 → 播报设置 → 显示选项 → 全链路测试 |
| ⚡ **缺什么一键装** | 检测到缺依赖，一个按钮自动安装，装的时候还能看进度条（one-click dependency install + real-time progress） |
| 🔍 **自动检测你的环境** | 自动找 Node.js、Python、OpenClaw 等，装没装、版本多少一目了然（smart environment detection） |
| ✅ **最后来一次全面验证** | 7项测试确保所有功能正常工作，不留隐患（end-to-end validation） |

### 🎨 终端 & 日志

| 功能 | 说明 |
|------|------|
| 🌈 **彩色控制台** | 不同信息用不同颜色：模型名蓝色、URL绿色、错误红色，一眼看清（ANSI colorized logging，12+ 模块） |
| 🔇 **日志自动去重** | 同样的消息不会重复刷屏，控制台干干净净（whitespace-normalized dedup） |
| 📁 **日志自动整理** | 每天自动归档旧日志，超过10MB自动压缩，保留7天（log rotation + gzip archiving） |
| 📊 **性能实时监控** | 内存、CPU、帧率随时掌握，超标了自动告警（performance monitor + 24h sample history） |

### 🔁 模型切换

| 功能 | 说明 |
|------|------|
| 🔄 **一键换 AI 大脑** | Claude ↔ GPT ↔ Gemini ↔ DeepSeek，不用重启，3秒生效（hot model swap via CC-Switch） |
| 📊 **测 AI 响应速度** | 一键测每个模型的延迟，帮你选最快的（latency benchmark） |
| ➕ **自己加模型** | 支持15+主流 AI 服务商，也能自己填 API 地址（custom provider + preset templates） |
| 📜 **切换历史记录** | 记录每次切了什么模型、什么时候切的，可追溯（switch history tracking） |

### 🔐 安全

| 功能 | 说明 |
|------|------|
| 🔑 **密钥加密存盘** | API Key 加密后才写入硬盘，不是明文裸奔（Electron safeStorage 加密） |
| 🛡️ **操作权限管控** | 页面不能直接调系统功能，所有操作走白名单审核（IPC whitelist sandbox） |
| 🧹 **日志自动脱敏** | 日志里自动隐藏 API Key、Token 等敏感信息（log sanitizer） |

### 🖥️ 桌面集成

| 功能 | 说明 |
|------|------|
| 📌 **永远置顶** | 球体和字幕永远在最上面，切窗口不会被挡住（always-on-top） |
| 🖱️ **字幕不挡鼠标** | 歌词字幕完全穿透，不影响你点底下的东西（mouse-through transparent window） |
| 🔗 **自动建桌面快捷方式** | 第一次打开自动在桌面创建快捷方式，下次双击就能开（auto .lnk / .app creation） |
| 📸 **一键截图上传** | 工具栏点截图，自动截屏并上传到飞书（screenshot + Lark upload） |
| 💬 **多平台消息同步** | Discord / Telegram / 飞书 / 企业微信的消息都能同步过来语音播报（multi-channel message sync） |
| 🍎 **Win + Mac 都能用** | Windows 10/11 和 macOS（Intel & Apple Silicon）都支持（cross-platform Electron） |
| 📱 **托盘菜单一站式管理** | 右键托盘图标就能切模型、看状态、开诊断、管会话（system tray context menu） |

### 🆕 v3.5.2 — Setup Wizard 修复 + 一键安装缺失依赖

> ⚡ **体验优化！** Wizard 白屏修复 + 缺失依赖一键安装 + 跨平台支持

- ⚡ **一键安装缺失依赖** — 环境检测页新增按钮，自动安装 edge-tts / sqlite3 / node_modules，实时进度反馈
- 🔧 **跨平台安装** — Windows (winget/choco)、macOS (brew)、Linux (apt/yum)
- 🐛 **Wizard 白屏修复** — 修复 3 处语法错误导致的向导空白页
- 🐛 **Wizard 错误可视化** — 渲染出错时直接显示报错信息，方便用户排查
- 📝 **sqlite3 依赖说明** — 标注用途 `(CC-Switch 同步)`，未安装时提示安装命令

### 🆕 v3.5.1 — 双声音修复 + 桌面快捷方式修复

- 🔇 **双声音修复** — 所有 `new Notification()` 添加 `silent: true`，阻止 Windows 系统朗读
- 🖥️ **快捷方式修复** — 指向 `start.cmd`，启动时显示 CMD 控制台 + Gateway 日志

### 🆕 v3.5.0 — 体验大升级：彩色终端 + 智能守护 + 桌面快捷方式

> 🎨 **重大体验更新！** 全局彩色终端日志 + Gateway 智能自启动 + 日志去重降噪 + 首次启动自动创建桌面快捷方式

#### 🎨 全局彩色终端日志系统
- 🆕 **color-log.js 中心化模块** — 统一 ANSI 颜色常量 + 自动关键词高亮
- ✨ **12+ 模块全覆盖** — main.js / service-manager / gateway-guardian / smart-voice / message-sync / pet-config / screenshot / log-rotation / performance-monitor / desktop-notifier 全部迁移
- 🎯 **Gateway 日志高亮增强** — 模型名(cyan)、URL(green)、路径(dim)、渠道(magenta)、@botname(magenta)、key=value(yellow)、端口号(yellow)、协议(cyan)、错误(red)、成功(green)、警告(yellow)

#### 🛡️ Gateway 智能自启动
- 🆕 **首次启动主动拉起** — Guardian 不再永远等待，连续 3 次检测不到 Gateway 后自动执行 `startGateway()`
- 🆕 **启动状态语音播报** — 启动中播报"等待Gateway启动中"，成功/失败分别语音通知
- 🔧 **二次确认防误判** — 与 ServiceManager 探活交叉校验，避免误触重启
- 🔧 **启动期静默** — 首次启动阶段不发告警事件，避免噪音

#### 🔇 日志去重降噪
- 🔧 **修复 Gateway 日志重复** — 找到根因：`log()` 方法在 stdout handler 之后二次 `console.log()`，gateway-std* 服务跳过控制台输出
- 🔧 **stderr 智能过滤** — 仅显示含 error/fatal/panic/exception 的真错误行
- 🔧 **空白归一化去重** — `\s+` → `' '` 归一化后 Set 去重，彻底消除同内容重复

#### 🖥️ 首次启动自动创建桌面快捷方式
- 🆕 **自动创建 .lnk** — 首次启动自动在桌面创建"Claw 桌面宠物"快捷方式
- 🔧 **PowerShell COM 对象** — 使用 WScript.Shell 创建快捷方式，设置图标和最小化启动
- 🔧 **智能跳过** — 已存在快捷方式或非 Windows 平台自动跳过
- 🎙️ **语音播报** — 创建成功后播报"桌面快捷方式已创建"

#### 🔧 其他修复
- 🐛 **修复语音双响** — 移除 messageSync 中重复的 `voiceSystem.speak()` 调用
- 🐛 **修复通知日志重复** — desktop-notifier 只打印通知类型，不重复打印 payload
- 🐛 **DashScope TTS 引擎移除** — 语音降级链简化为 MiniMax → Edge TTS

### 🆕 v3.1.2 — 安全加固 & 模型管理升级

> 🔒 **安全重点更新！** 命令注入修复 + 动态 Token 管理 + 模型热切换状态机 + Gateway 智能监控

#### 🧙 Setup Wizard 配置向导（全新）
- 🎮 **RPG 游戏风格** — 木质边框 + 羊皮纸背景 + 龙虾向导角色
- 📋 **7 步引导流程** — Gateway → 模型 → 渠道 → TTS → 语音播报 → 显示 → 测试
- 🎤 **一键音色克隆** — 上传30秒录音，自动调 MiniMax/CosyVoice API 创建专属音色
- 🎭 **人设定制系统** — 5种预设风格（甜妹/专业/幽默/酷帅/自定义）
- 📝 **全套文件生成** — 一键生成 `AGENTS.md` + `SOUL.md` + `USER.md` + `HEARTBEAT.md` + `desktop-bridge.js`
- 🔗 **完整 AGENTS.md 模板** — 对齐生产级配置（记忆系统 + 安全规则 + 群聊规则 + 心跳检查 + 语音播报）
- 💡 **模型兼容性提示** — 推荐 Claude Sonnet 4+ 旗舰模型获得最佳播报体验
- ✅ **7 项全链路测试** — Gateway / 模型 / TTS / 播报 / 歌词 / Agent文件 / 音色

#### 🌈 情绪系统升级
- 🌈 **7 → 14 种情绪** — 新增 sad、angry、fearful、calm、excited、love、focused
- ✨ **动态外发光** — 每种情绪有专属 glow 光效
- 🎭 **情绪文本检测** — `desktop-bridge.js` 自动分析内容情绪，10种匹配规则

#### 🔐 安全与稳定性
- 🔑 **API Key 加密存储** — `safeStorage` 加密，密钥不再明文写入磁盘
- 🔒 **preload 安全沙箱** — 主窗口/歌词/诊断/模型设置全部走 IPC 白名单，渲染进程不再直接 require Node
- 🎵 **歌词窗口 Ready 守卫** — `lyricsReady` 标志位，防止加载未完成时崩溃
- 🔧 **sendLyric 封装** — 统一歌词推送，自动检查窗口状态
- 📡 **端口持久化** — 通知端口写入配置，wizard/bridge 可动态获取
- 📡 **渲染进程错误转发** — `preload-error` + `console-message` 转发到主进程日志，防止静默失败

#### 🩺 诊断与运维
- 🆕 **Doctor 自检系统** — 10 项全自动诊断（Gateway / 托盘 / TTS配置 / 模型 / 端口 / 健康度 / 缓存 / 歌词 / 日志），每项带修复建议
- 🆕 **会话刷新** — 损坏会话一键清理重连（`doRefreshSession`）
- 🔧 **诊断工具箱 UI 升级** — Doctor 面板新增 summary 统计 + 修复建议 + 分级状态（pass/warn/fail）

#### 🎛️ 模型管理升级
- 🆕 **延迟测速** — 单模型测速 + 全量批量测速（`speedTest` / `speedTestAll`）
- 🆕 **Provider CRUD** — 新增/编辑/删除服务商，编辑 baseUrl 和 API Key
- 🆕 **模型增删** — Provider 内添加/移除模型
- 🆕 **预设快速添加** — 内置主流 Provider 预设模板，一键填入配置

#### 🎙️ 语音系统增强
- 🆕 **MiniMax Speech 2.8 HD** — 新增高清语音引擎选项
- 🔄 **SmartVoice 配置统一** — 直接读 petConfig，不用重复读文件
- 🎤 **完整版 desktop-bridge.js** — cleanForTTS + detectEmotion + addTTSPauseMarkers
- 🎵 **歌词 TTS 标记过滤** — `<#0.3#>` 停顿标记不显示在字幕中，只给语音引擎用

#### 📖 文档
- 🆕 **完整配置教程** — [CONFIGURATION-GUIDE.md](docs/CONFIGURATION-GUIDE.md)（863行），从零开始手把手教学

### v2.2.1 特性

- 🔧 **诊断工具箱** — 全新独立窗口，一键查看 Gateway 状态、日志、连接信息
- 🔇 **CMD 屏闪修复** — 全面添加 `windowsHide: true`，彻底消除 Windows 命令行窗口闪烁

### v2.2.0 特性

- 🛡️ **Gateway 错误诊断链路** — 捕获 stdout/stderr，桌面通知显示具体崩溃原因
- 🔄 **安全模型切换 + 自动回滚** — 切换失败 5 秒内自动恢复上一个模型
- 📊 **会话管理托盘菜单** — 查看上下文使用率、token 估算、一键清理会话
- 📡 **请求追踪系统** — 序列 ID + 计时 + 错误历史(50条) + 30s 超时诊断
- ⏳ **启动宽限期** — 60s 冷启动保护，防止误判重启循环
- 🧠 **上下文感知** — 中英文 token 估算，接近限制时智能警告

---

## 🎬 演示视频

<div align="center">

### 直接点击播放 ▶️

<video width="100%" controls style="max-width: 800px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
  <source src="videos/demo.mp4" type="video/mp4">
  您的浏览器不支持视频播放。<a href="https://b23.tv/85bz09G">点击查看B站版本</a>
</video>

**居然让 OpenClaw 给自己做了个身体！**

[📱 B站视频](https://b23.tv/85bz09G) | [📱 抖音视频](https://v.douyin.com/9wKpkB8z4ew/)

</div>

---

## 📦 下载安装

### 最新版本：v3.5.2

<div align="center">

| 平台 | 架构 | 下载链接 | 大小 |
|------|------|----------|------|
| 🪟 **Windows** | x64 | [KKClaw-Desktop-Pet-3.5.2-Setup.exe](https://github.com/kk43994/kkclaw/releases/download/v3.5.2/KKClaw-Desktop-Pet-3.5.2-Setup.exe) | ~150MB |
| 🍎 **macOS** | Intel | [KKClaw-Desktop-Pet-3.5.2-x64.dmg](https://github.com/kk43994/kkclaw/releases/download/v3.5.2/KKClaw-Desktop-Pet-3.5.2-x64.dmg) | ~160MB |
| 🍎 **macOS** | Apple Silicon | [KKClaw-Desktop-Pet-3.5.2-arm64.dmg](https://github.com/kk43994/kkclaw/releases/download/v3.5.2/KKClaw-Desktop-Pet-3.5.2-arm64.dmg) | ~160MB |

[📦 查看所有版本](https://github.com/kk43994/kkclaw/releases) | [🎥 在线演示](https://kk43994.github.io/kkclaw/)

</div>

### ⚠️ 推荐使用方式：克隆仓库

> **建议有一定技术基础的用户直接克隆仓库运行，而非下载发行版。**
>
> 发行版为打包封装版本，存在以下限制：
> - 部分配置已硬编码在包内，自定义修改需要解包，不适合新手
> - 小版本的 bug 修复和功能更新不会单独推发行版，克隆仓库后 `git pull` 即可同步最新改动
>
> ```bash
> git clone https://github.com/kk43994/kkclaw.git
> cd kkclaw
> npm install
> npm start
> ```
>
> 发行版适合只想快速体验的用户，长期使用推荐源码运行。

### 安装说明

#### Windows
1. 下载 `.exe` 安装程序
2. 双击运行（可能需要允许"未知发布者"）
3. 按提示完成安装

#### macOS
1. 下载对应架构的 `.dmg` 文件
2. 打开 DMG，拖动应用到 Applications 文件夹
3. 首次运行需要在"系统偏好设置 → 安全性与隐私"中允许

> **注意**：macOS 版本未签名，首次运行需要右键点击 → "打开"

---

## 📸 预览

<div align="center">

### 🎨 14种情绪色系

![Mood System](docs/images/mood-system.png)

**丰富的情绪状态** — 14种颜色 × 38种表情 = 超自然的情感表达

---

### 🔧 精灵窗口 + 工具栏

<table>
<tr>
<td width="50%">

![Pet Closeup](docs/images/pet-closeup.png)

**67px 琉璃球体**
- 3层流体动画
- 双重高光系统
- 胶囊形发光眼睛

</td>
<td width="50%">

![Toolbar](docs/images/toolbar.png)

**SVG图标工具栏**
- 💬 聊天对话
- 📸 截图上传
- 🎤 语音切换
- ⚙️ 设置面板

</td>
</tr>
</table>

---

### 💬 聊天交互演示

![Chat Demo](docs/images/chat-demo.png)

**智能对话 + 文件操作** — 可以与桌面图标、文件进行自然语言交互

*示例：KK要复制图标文件，直接用红框标记图标，用飞书语音创建快捷方式*

</div>

---

## ✨ 核心功能

### 🎨 空气感双窗口设计

> **设计理念**：像桌面歌词一样，不妨碍操作，却始终陪伴。

#### 精灵窗口 (200×220px)
- **67px 流体玻璃球** — 3层径向渐变 + 双重高光 + 内外发光
- **胶囊形眼睛** (11×19px) — 15+种表情，SVG矢量
- **SVG图标工具栏** — 💬聊天 / 📸截图 / 🎤语音，hover展开

#### 歌词窗口 (400×100px)
- **完全鼠标穿透** — `setIgnoreMouseEvents`，不挡操作
- **白字描边** — `text-shadow` 8重叠加，任何背景可见
- **打字机效果** — 逐字出现，支持emoji，自动换行

#### 拖动同步
- 拖动精灵窗口 → 歌词窗口自动跟随
- IPC事件 `drag-pet` 双窗口实时同步

---

### 🎙️ 智能语音系统（三级降级）

#### **主引擎：MiniMax Speech 2.5 Turbo**
- **克隆音色** — 小团团导航音（`xiaotuantuan_minimax`）
- **7种情感** — happy, sad, angry, fearful, disgusted, surprised, calm
- **停顿控制** — `<#0.5#>` 在文本中插入自然停顿
- **费用** — 2元/万字符，克隆费9.9元/音色（一次性）

**自动情感识别**：
```javascript
// smart-voice.js 根据文本内容自动选择emotion
"太棒了！" → happy
"失败了..." → sad
"什么！？" → surprised
```

#### **降级链**：
1. MiniMax → 2元/万字符，高质量
2. CosyVoice → DashScope API，中等质量
3. Edge TTS → 免费本地，基础质量

---

### 🔁 KKClaw Switch 模型热切换

> **3秒切换AI模型，零重启，零中断**

#### 工作原理

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  KKClaw Switch  │  →    │  Auto Monitor   │  →    │   OpenClaw      │
│  (点击切换)      │       │  (每2秒检测)     │       │  (自动重启)      │
└─────────────────┘       └─────────────────┘       └─────────────────┘
        ↓                         ↓                         ↓
    切换Provider           读取DB变化               同步config → restart
```

#### 功能特性

✅ **自动同步监听器** — 集成到桌面宠物生命周期
- 启动时自动开启 `kkclaw-auto-sync.js`
- 关闭时自动停止
- 每2秒检测 `~/.cc-switch/cc-switch.db`

✅ **手动同步** （可选）
```bash
node kkclaw-hotswitch.js              # 同步当前provider
node kkclaw-hotswitch.js --restart    # 同步 + 重启Gateway
```

✅ **无缝切换**
- Claude Opus 4 ↔ GPT-5.3 ↔ Gemini Pro
- 3秒内生效
- 不中断对话上下文

---

### 👁️ 眼睛表情系统

#### 15+种基础表情

| 表情 | 参数 | 效果 |
|------|------|------|
| **normal** | 11×19px | 正常状态 |
| **blink** | 12×3px | 眨眼 |
| **happy** | 13×7px, br:7px 7px 3px 3px | 开心弯眼 |
| **surprised** | 13×21px | 惊讶瞪大 |
| **thinking** | 10×17px, ty:-3px | 思考眯眼 |
| **sleepy** | 12×4px, ty:2px | 困了半闭 |
| **sparkle** | 12×12px, rot:45deg | 星星眼 |
| **wink** | 左13×7px, 右11×19px | 单眼眨 |
| **love** | 14×13px, br:7px 1px, rot:45deg | 爱心眼 |
| **angry** | 12×14px, rot:±12deg | 生气皱眉 |
| **dizzy** | 10×10px, rot:±25deg | 头晕旋转 |
| **cross** | 10×3px, rot:±30deg | X眼（装死） |

#### 38个待机动作序列

**类型分布**：
- 👀 **眼睛动画** (14个) — 左右看、上下看、眨眼、歪头
- 😊 **表情组合** (12个) — 开心→惊讶、思考→闪亮、困→惊醒
- 💕 **情感表达** (6个) — 害羞脸红、爱心眼、生气跺脚
- 🎭 **复杂序列** (6个) — 环顾四周、开心蹦跶、装死复活

**触发机制**：
```javascript
setInterval(() => {
    if (currentMood === 'idle' && Math.random() < 0.3) {
        // 30%概率触发
        idleActs[Math.floor(Math.random() * 38)]();
    }
}, 4000); // 每4秒检查一次
```

---

### 🎨 琉璃质感球体

#### 视觉分层（由内到外）

```
┌─ 1. 内部流体层 ────────────────┐
│   - blob1: 20×20px 圆形       │
│   - blob2: 30×30px 椭圆       │
│   - 不同速度动画（20s / 25s）  │
└──────────────────────────────┘
        ↓
┌─ 2. 玻璃外壳 ──────────────────┐
│   - 3层径向渐变               │
│   - 主高光 (35% 18%)          │
│   - 副高光 (20% 12%)          │
│   - 1.5px border 半透明       │
└──────────────────────────────┘
        ↓
┌─ 3. 外部发光 ──────────────────┐
│   - box-shadow 内外双层       │
│   - 根据mood颜色动态变化      │
└──────────────────────────────┘
```

#### 颜色过渡动画

**1秒平滑渐变** — 动态 `@keyframes` 生成

```javascript
// 每次切换mood时动态创建过渡动画
function createColorTransition(fromColor, toColor) {
    const keyframes = `
        @keyframes colorShift-${Date.now()} {
            from { background: ${fromColor}; }
            to { background: ${toColor}; }
        }
    `;
    // 三层独立动画：0.8s / 1.0s / 1.2s
}
```

---

### 🛡️ 7×24 稳定性保障

#### 自动重启机制
- **Electron进程崩溃** → 5秒后自动重启
- **OpenClaw Gateway挂掉** → 30秒后自动重启
- **系统资源耗尽** → 内存清理 + 重启

#### 日志轮转
- **每日轮转** — 保留最近7天日志
- **大小限制** — 单文件10MB，超过自动归档
- **分级记录** — INFO / WARN / ERROR

#### 缓存管理
- **自动清理** — 每24小时清理临时文件
- **智能压缩** — 旧日志自动压缩为 `.gz`

#### 性能监控
- **CPU使用率** — 超过80%告警
- **内存使用** — 超过500MB告警
- **FPS监控** — 低于30fps告警

---

## 🚀 快速开始

> 📖 **完整配置教程请看 → [CONFIGURATION-GUIDE.md](docs/CONFIGURATION-GUIDE.md)**
> 
> 从环境准备到语音配置到飞书接入，一步步手把手教学，小白也能看懂！

### 前置要求

- **Node.js** ≥ 18.x ([下载](https://nodejs.org))
- **Windows** 10/11 或 **macOS** 10.15+
- **OpenClaw** ≥ 2026.x ([中文社区](https://clawd.org.cn) | [国际版](https://openclaw.ai))

### 安装

#### 方式一：ClawHub（推荐）

```bash
npx clawhub@latest install kk43994/desktop-pet
```

#### 方式二：GitHub

```bash
git clone https://github.com/kk43994/kkclaw.git
cd kkclaw
npm install
npm start
```

### 配置

> 🧙 **v3.0 新增 Setup Wizard！** 首次启动会自动弹出配置向导，跟着引导走即可完成全部设置。
> 
> 如需手动配置，参考以下步骤：

1. **复制配置模板**
   ```bash
   cp pet-config.example.json pet-config.json
   ```

2. **编辑 `pet-config.json`**
   ```json
   {
     "openclaw": {
       "gateway": "http://localhost:3000"
     },
     "voice": {
       "engine": "minimax",
       "minimax": {
         "apiKey": "sk-api--你的密钥",
         "groupId": "你的GroupID",
         "voiceId": "xiaotuantuan_minimax"
       }
     }
   }
   ```

3. **启动应用**
   ```bash
   npm start
   ```

---

## 📖 文档

### 项目文档

- [📖 **完整配置教程**](docs/CONFIGURATION-GUIDE.md) — ⭐ 新手必看！从零开始配置
- [📂 项目结构](PROJECT-STRUCTURE.md) — 目录组织、命名规范
- [🎙️ 智能语音系统](docs-dev/SMART-VOICE.md) — 三级降级、情感识别
- [🔁 KKClaw Switch](docs-dev/SYNC-GUIDE.md) — 模型热切换配置
- [📸 截图功能](docs-dev/SCREENSHOT-FEATURE.md) — 快捷键、自动上传
- [🔧 开发指南](docs-dev/SETUP-GUIDE.md) — 开发环境、调试

### 在线资源

- [🎥 **在线演示**](https://kk43994.github.io/kkclaw/) — 可交互的球体demo
- [📦 **ClawHub主页**](https://clawhub.ai/kk43994/desktop-pet) — 国际社区
- [📦 **OpenClaw-CN**](https://clawd.org.cn) — 中文社区技能市场

---

## 🔧 配置详解

### 基础配置

```json
{
  "openclaw": {
    "gateway": "http://localhost:3000",
    "sessionKey": "main",
    "checkInterval": 2000
  },
  "window": {
    "position": { "x": 100, "y": 100 },
    "alwaysOnTop": true,
    "opacity": 1.0
  }
}
```

### 语音配置

#### MiniMax配置
```json
{
  "voice": {
    "engine": "minimax",
    "minimax": {
      "apiKey": "sk-api--xxxxx",
      "groupId": "2020139946483921771",
      "voiceId": "xiaotuantuan_minimax",
      "model": "speech-2.5-turbo-preview",
      "speed": 1.1,
      "vol": 3.0,
      "emotion": "happy"
    }
  }
}
```

#### DashScope（CosyVoice）配置
```json
{
  "voice": {
    "engine": "dashscope",
    "dashscope": {
      "apiKey": "sk-xxxxxxxxxx",
      "model": "cosyvoice-v3-plus",
      "voice": "cosyvoice-v3-plus-tuantuan-xxx"
    }
  }
}
```

### KKClaw Switch配置

桌面宠物会自动集成，无需额外配置。

如需手动同步：
```bash
# 同步当前provider到OpenClaw
node kkclaw-hotswitch.js

# 同步并重启Gateway
node kkclaw-hotswitch.js --restart
```

---

## 🛠️ 开发

### 目录结构

```
desktop-pet/
├── main.js                  # Electron主进程
├── index.html              # 精灵窗口UI
├── lyrics.html             # 歌词窗口UI
├── setup-wizard.html       # 🧙 Setup Wizard UI（RPG风格）
├── setup-wizard.js         # 🧙 Setup Wizard 后端逻辑
├── setup-preload.js        # 🧙 Wizard IPC 安全桥接
├── smart-voice.js          # 智能语音调度
├── pet-config.js           # 🔐 配置管理（含 safeStorage 加密）
├── voice/                  # TTS引擎目录
│   ├── minimax-tts.js
│   ├── dashscope-tts.js
│   └── cosyvoice-tts.py
├── templates/              # 🧙 向导模板文件
│   └── desktop-bridge.js   # 语音播报桥接模板
├── utils/                  # 辅助工具目录
├── scripts/                # 工具脚本
├── tests/                  # 测试文件
├── docs-dev/               # 开发文档
└── archive/                # 归档旧版本
```

### 开发命令

```bash
npm start              # 启动应用
npm run dev            # 开发模式（热重载）
npm test               # 运行测试
npm run build          # 构建发布版
```

### 调试

1. **开启Electron DevTools**
   - 主窗口：`Ctrl + Shift + I`
   - 或修改 `main.js` 添加 `mainWindow.webContents.openDevTools()`

2. **查看日志**
   ```bash
   # 实时日志
   tail -f logs/app.log

   # 错误日志
   tail -f logs/error.log
   ```

---

## 🤝 贡献

欢迎贡献代码、报告Bug、提出建议！

### 贡献方式

1. **Fork** 本仓库
2. 创建分支 `git checkout -b feature/新功能`
3. 提交更改 `git commit -m 'Add: 新功能描述'`
4. 推送分支 `git push origin feature/新功能`
5. 提交 **Pull Request**

### 代码规范

- 使用 **kebab-case** 命名文件
- 添加 **详细注释**
- 遵循 **ESLint** 规则
- 测试覆盖 **核心功能**

---

## 🐛 故障排查

### 常见问题

#### 1. 球体不显示

**原因**：窗口位置超出屏幕
**解决**：删除 `pet-config.json` 中的 `window.position`，重启应用

#### 2. 语音不播报

**原因**：API密钥无效或配置错误
**解决**：
```bash
# 检查配置
node -e "console.log(require('./pet-config.json').voice)"

# 测试MiniMax API
node voice/minimax-tts.js
```

#### 3. OpenClaw连接失败

**原因**：Gateway未启动或端口错误
**解决**：
```bash
# 检查OpenClaw状态
openclaw status

# 启动Gateway
openclaw gateway start
```

#### 4. KKClaw Switch不同步

**原因**：
- `~/.cc-switch/cc-switch.db` 不存在
- 自动监听器未启动

**解决**：
```bash
# 检查DB文件
ls ~/.cc-switch/cc-switch.db

# 手动同步
node kkclaw-hotswitch.js --restart
```

---

## 📊 性能指标

| 指标 | 目标 | 实测 |
|------|------|------|
| **启动时间** | <3秒 | 2.1秒 |
| **内存占用** | <200MB | 147MB |
| **CPU占用** | <5% | 2.8% |
| **帧率** | ≥60fps | 60fps |
| **语音延迟** | <500ms | 320ms |

*测试环境：Windows 11, i7-12700K, 32GB RAM*

---

## 📝 更新日志

### [3.5.2] - 2026-03-12

#### ⚡ 一键安装缺失依赖
- ⚡ **环境检测页新增按钮** — 自动安装 edge-tts / sqlite3 / node_modules，实时进度反馈
- 🔧 **跨平台安装** — Windows (winget/choco)、macOS (brew)、Linux (apt/yum)

#### 🐛 修复
- 修复 Setup Wizard 白屏 — 3 处函数声明缺失导致 SyntaxError
- Wizard 错误可视化 — 渲染出错时显示具体报错
- sqlite3 依赖说明优化 — 标注 `(CC-Switch 同步)` 用途

### [3.5.1] - 2026-03-12

#### 🐛 修复
- 修复双声音问题 — 所有 `new Notification()` 添加 `silent: true`
- 修复桌面快捷方式不显示 CMD — 指向 `start.cmd`，WindowStyle 1
- 移除 `speak()` 临时调试日志

### [3.5.0] - 2026-03-12

#### 🎨 全局彩色终端日志
- 🆕 **color-log.js** — 中心化 ANSI 颜色模块，统一颜色常量 + 自动高亮函数
- ✨ **全面迁移** — 12+ 模块启动日志迁移到 `colorLog()` / `kvLog()` / `tagLog()`
- ✨ **Gateway 日志高亮增强** — 模型名、URL、路径、渠道、@botname、key=value、端口号、协议、错误/成功/警告 全彩高亮

#### 🛡️ Gateway 智能自启动
- 🆕 **首次启动主动拉起** — 连续 3 次检测不到 Gateway 后自动 `startGateway()`，不再永远等待
- 🆕 **启动状态语音播报** — 启动中/成功/失败 分别语音通知
- 🔧 **二次确认防误判** — 与 ServiceManager 交叉校验

#### 🔇 日志去重降噪
- 🔧 **修复 Gateway 日志重复** — 根因：`log()` 二次打印；gateway-std* 跳过控制台输出
- 🔧 **stderr 智能过滤** — 仅显示 error/fatal/panic/exception
- 🔧 **空白归一化去重** — `\s+` → `' '` 归一化后 Set 去重

#### 🖥️ 首次启动自动创建桌面快捷方式
- 🆕 **自动创建 .lnk** — 首次启动自动在桌面创建"Claw 桌面宠物"快捷方式
- 🔧 **PowerShell COM** — WScript.Shell 创建快捷方式
- 🎙️ **语音播报** — 创建成功后播报

#### 🐛 修复
- 修复语音双响（移除 messageSync 重复 speak）
- 修复通知日志重复（desktop-notifier 只打印类型）
- DashScope TTS 引擎移除，降级链简化为 MiniMax → Edge TTS

### [3.1.2] - 2026-03-11

#### 🔒 安全加固
- 🔧 **命令注入修复** — `_playAudioFile()` / `_playAudio()` / `speakWithEdgeTTS()` 全部从 `exec()` shell 拼接改为 `execFile()` / `spawn()` + 参数数组
- 🔧 **Edge TTS 文本注入修复** — 文本通过临时文件 `--text-file` 传入，不再 inline `--text` 拼接
- 🔧 **stop() 真正停止播放** — 跟踪当前播放进程引用，`stop()` 时 `.kill()` 终止
- ✨ **Token 动态读取** — `openclaw-client.js` 不再模块加载时缓存 token，改用 `SecureStorage` + `configManager` 动态获取
- ✨ **IPC 校验模块** — 新增 `ipc-validator.js`，渠道白名单校验
- ✨ **日志脱敏** — 新增 `log-sanitizer.js`，防止敏感信息写入日志

#### 🎛️ 模型管理升级
- ✨ **模型热切换状态机** — `model-switch-state-machine.js`，状态驱动的切换流程
- ✨ **切换策略模式** — `model-switch-strategies.js`，可扩展的切换策略
- ✨ **切换历史记录** — `switch-history.js`，追踪模型切换轨迹
- ✨ **额度查询** — `quota-query.js`，查询 API 余额
- ✨ **CC Switch 同步** — `cc-switch-sync.js`，Claude Code 模型同步切换

#### 🛡️ Gateway 智能监控
- ✨ **异常检测器** — `gateway-anomaly-detector.js`，自动识别异常模式
- ✨ **健康评分** — `gateway-health-scorer.js`，多维度健康度量化
- ✨ **指标采集器** — `gateway-metrics-collector.js`，实时采集 Gateway 指标
- ✨ **智能检测器** — `gateway-smart-detector.js`，智能故障诊断

#### 🏗️ 架构优化
- ✨ **路径解析器** — `openclaw-path-resolver.js`，消除硬编码路径
- ✨ **安全配置加载** — `safe-config-loader.js`，带校验的配置读取
- ✨ **安全存储** — `secure-storage.js`，token 安全管理
- ✨ **会话锁管理器** — `session-lock-manager.js`，并发安全的会话操作
- ✨ **配置管理器** — `config-manager.js` + `config-writer.js`，统一配置读写
- ✨ **Setup Wizard 独立 preload** — `setup-preload.js`，最小化权限暴露
- ✨ **Model Settings 分离** — CSS/JS 从 HTML 中独立为 `model-settings.css` + `model-settings.js`

### [3.0.0] - 2026-02-22

#### 🧙 Setup Wizard — 一键配置向导（全新）
- ✨ **RPG 游戏风格引导界面** — 木质边框 + 羊皮纸背景 + 龙虾向导 + 打字机文字效果
- ✨ **7 步引导流程** — Gateway 连接 → AI 模型 → 消息渠道 → TTS 引擎 → Agent 语音 → 显示 → 全链路测试
- ✨ **一键音色克隆** — 拖拽上传录音文件，自动调用 MiniMax / CosyVoice API 克隆音色
- ✨ **人设定制系统** — 宠物昵称 + 用户称呼 + 5 种说话风格预设（甜妹/专业/幽默/酷帅/自定义）
- ✨ **全套 Agent 配置文件自动生成**：
  - `AGENTS.md` — 完整工作手册（记忆系统 + 安全规则 + 群聊规则 + 心跳检查 + 语音播报规则）
  - `SOUL.md` — Agent 人设文件（根据选择的风格自动生成）
  - `USER.md` — 用户信息框架
  - `HEARTBEAT.md` — 心跳检查配置
  - `desktop-bridge.js` — 语音播报桥接脚本（完整版，含 cleanForTTS + detectEmotion + addTTSPauseMarkers）
- ✨ **7 项全链路测试** — Gateway / AI模型 / TTS引擎 / 语音播报 / 桌面歌词 / Agent配置文件 / 自定义音色
- ✨ **模型兼容性提示** — 注明不同模型的指令遵循度差异，推荐 Claude Sonnet 4+
- ✨ **preload 安全白名单** — 所有 IPC 通道经白名单校验，防止恶意调用

#### 🌈 情绪系统大升级
- ✨ **14 种情绪色系** — 原有 7 种 + 新增 sad(天蓝)、angry(烈焰红)、fearful(紫罗兰)、calm(薄荷青)、excited(热粉)、love(珊瑚)、focused(青蓝)
- ✨ **动态外发光 (glow)** — 每种情绪有专属外发光效果
- ✨ **10 种文本情绪检测规则** — 自动分析内容情绪：thinking → surprised → fearful → sad → angry → calm → excited → happy

#### 🔐 安全与稳定性
- ✨ **API Key 加密存储** — 使用 Electron `safeStorage` 加密 MiniMax/DashScope 密钥，磁盘上不再明文
- ✨ **preload 安全沙箱** — 新增 `preload.js`，主窗口/歌词/诊断/模型设置全部走 IPC 白名单校验
- ✨ **歌词窗口 Ready 守卫** — `lyricsReady` 标志位，歌词窗口未加载完不发消息，防崩溃
- ✨ **sendLyric() 封装** — 统一歌词推送逻辑，自动检查窗口是否已销毁
- ✨ **通知端口持久化** — 实际端口写入 petConfig，wizard / bridge 可动态读取
- ✨ **渲染进程错误转发** — `preload-error` + `console-message` 事件转发到主进程日志

#### 🩺 诊断与运维
- ✨ **Doctor 自检系统** — `diag-doctor` IPC，10 项全自动诊断（Gateway / 系统托盘 / TTS 配置 / API Key / 模型配置 / 端口占用 / 健康评分 / 缓存大小 / 歌词窗口 / 日志目录），每项带修复建议
- ✨ **会话刷新** — `doRefreshSession()` 一键清理损坏会话并重连
- ✨ **诊断工具箱 UI 升级** — Doctor 面板新增 summary 统计条 + 修复建议 + pass/warn/fail 分级显示

#### 🎛️ 模型管理升级
- ✨ **延迟测速** — 单模型测速 `speedTest()` + 全量批量测速 `speedTestAll()`
- ✨ **Provider CRUD** — 新增/编辑/删除服务商（`model-update-provider` / `model-remove-provider`）
- ✨ **模型增删** — Provider 内添加/移除模型（`model-add-model` / `model-remove-model`）
- ✨ **预设快速添加** — 内置主流 Provider 预设模板（`model-presets`），一键填入配置

#### 🎙️ 语音系统增强
- ✨ **MiniMax Speech 2.8 HD 引擎** — 新增高清语音选项
- 🔧 **SmartVoiceSystem 配置统一** — 接受 petConfig 参数，直接读内存配置，不再重复读文件
- 🔧 **desktop-bridge.js 完整版** — TTS 停顿标记、文本清理、情绪检测三合一
- 🔧 **歌词 TTS 标记过滤** — `<#0.3#>` 停顿标记不显示在字幕中，只给语音引擎用

#### 📖 文档
- ✨ **完整配置教程** — 新增 [CONFIGURATION-GUIDE.md](docs/CONFIGURATION-GUIDE.md)（863行），从环境准备到语音配置到飞书接入，手把手教学

#### 🔧 修复
- 🐛 修复 `_testAgentVoice` 协议不匹配（`{action,text}` → `{type,payload:{content}}`）
- 🐛 修复 `wizard-clone-voice` 未加入 preload 白名单导致克隆报错
- 🐛 修复 Step 6 Agent 文件检测路径错误（`~/.openclaw` → 实际工作目录）
- 🐛 修复 Footer 初始文本 `Step 1/6` → `Step 1/7`
- 🐛 修复 `desktop-bridge.js` 模板字符串嵌套导致正则表达式转义错误（改为读取 `templates/` 文件）

### [2.2.1] - 2026-02-19

#### 新增
- 🔧 **诊断工具箱** — 独立窗口，一键查看 Gateway 状态、日志、连接诊断
- 🔇 **CMD 屏闪彻底修复** — 全部 exec/spawn 调用添加 `windowsHide: true` + `shell: false`

#### 优化
- 🎤 smart-voice 所有 PowerShell 播放命令静默化
- 🔄 openclaw-updater 全流程（版本检查/安装/doctor）静默执行
- 📸 截图系统进程隐藏
- 🔔 auto-notify 桌面通知静默化
- 🛡️ service-manager Gateway 进程管理改用 `shell: false`

---

### [2.1.0] - 2026-02-13

#### 🎉 重大更新
- ✨ **完整 macOS 支持** — Intel 和 Apple Silicon 双架构
- 🤖 **GitHub Actions 自动化** — 推送 tag 自动构建发布
- 📦 **跨平台打包** — DMG 安装器 + ZIP 便携版
- 🔄 **自动发布流程** — electron-builder 直接发布到 GitHub Release

#### 技术改进
- 🔧 跳过代码签名配置（Windows + macOS）
- 📦 升级 GitHub Actions artifacts 到 v4
- 🔐 配置完整的 GitHub Actions 权限
- 🎨 生成 macOS 专用 .icns 图标文件

#### 文档更新
- 📖 README 增加下载安装章节
- 🌐 GitHub Pages 更新双平台支持
- 📋 完善跨平台安装说明

---

### [2.0.4] - 2026-02-10

#### 新增
- ✨ KKClaw Switch自动同步集成
- ✨ 7种情绪色系完整实现
- ✨ 38个待机表情动画
- ✨ 琉璃质感球体升级（3层高光）
- ✨ 粉红龙虾球图标 + 桌面快捷方式

#### 优化
- 🎨 颜色过渡动画（1秒平滑）
- 🎙️ MiniMax TTS情感自动识别
- 🗂️ 项目目录重构（140→31个根文件）
- 📖 README全面改版 + 实际截图展示

#### 修复
- 🐛 多余closing div标签（GitHub Pages）
- 🐛 lark-uploader引用路径
- 🐛 语音播放重复问题

[查看完整更新日志](CHANGELOG.md)

---

## 💬 社群

### 加入我们

<div align="center">

| 平台 | 链接 | 说明 |
|------|------|------|
| 💬 **AI Coding 交流群** | [扫码加入](docs/images/ai-coding-qr.jpg) | 微信群（7天有效） |
| 🐦 **Discord** | [Friends of the Crustacean](https://discord.com/invite/clawd) | OpenClaw国际社区 |
| 🇨🇳 **OpenClaw-CN** | [clawd.org.cn](https://clawd.org.cn) | 中文论坛 |
| 📦 **ClawHub** | [clawhub.ai](https://clawhub.ai/kk43994/desktop-pet) | 技能市场 |
| 💡 **GitHub Discussions** | [讨论区](https://github.com/kk43994/kkclaw/discussions) | 提问、分享 |

</div>

### 支持项目

如果这个项目帮助了你，欢迎：
- ⭐ **Star** 本仓库
- 🐛 **报告Bug** 或提需求
- 📢 **分享**给朋友
- ☕ [**赞赏支持**](docs/images/support-qr.jpg)

---

## 📜 开源协议

[MIT License](LICENSE) © 2024-2026 KK

---

<a id="-english"></a>

## 🇬🇧 English

**Desktop visualization companion for OpenClaw — Fluid glass orb pet, 14-emotion system, voice cloning (MiniMax TTS), Setup Wizard, and Smart Gateway Guardian**

<div align="center">

![Hero Banner](docs/images/hero-banner.png)

[![Version](https://img.shields.io/badge/version-3.5.2-FF6B4A?style=for-the-badge&logo=github)](https://github.com/kk43994/kkclaw/releases)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows_|_macOS-0078D6?style=for-the-badge&logo=apple&logoColor=white)](https://github.com/kk43994/kkclaw)

[🎥 **Live Demo**](https://kk43994.github.io/kkclaw/) | [📦 **Download**](https://github.com/kk43994/kkclaw/releases) | [📖 **Docs**](docs/CONFIGURATION-GUIDE.md) | [💬 **Community**](#-社群)

</div>

### ✨ Highlights

Give your OpenClaw AI a **visible, audible** desktop embodiment.

#### 🦞 Orb & Animation

| Feature | Description |
|---------|-------------|
| 🔮 **Living Glass Orb** | 67px glass sphere with fluid constantly flowing inside, looks alive (3-layer fluid animation + radial gradient + dual highlights) |
| 🌈 **14 Mood Colors** | Happy = warm orange, sad = sky blue, angry = fire red… auto-switches color and glow per mood (14-emotion glow system) |
| 👀 **38 Micro-Expressions** | Blinks, tilts, peeks, dozes, sparkle eyes, plays dead while idle… like it has a personality (idle micro-expression engine) |
| 🕐 **Time-Aware Expressions** | Energetic in morning, sleepy in afternoon, yawning late at night — it knows what time it is (time scene awareness: morning / noon / afternoon / evening / latenight) |
| 🖱️ **Eye Tracking** | Eyes follow your cursor direction as you move the mouse (mouse tracking) |
| 💗 **Blushing** | Certain expressions trigger pink blush on both cheeks (dynamic blush overlay) |
| 🫧 **Floating Bubbles** | Semi-transparent bubbles floating around the orb for extra liveliness (bubble particle decoration) |
| ✨ **Bounce on Click** | Click the orb and it squishes + flashes color, satisfying feedback (squish animation + color pulse) |
| 🎈 **Breathing Float** | Orb gently bobs up and down, like floating on water (60fps float + breath scaling) |

#### 🎙️ Voice & Audio

| Feature | Description |
|---------|-------------|
| 🎤 **30s Voice Cloning** | Upload a 30-second recording, AI speaks in your voice (MiniMax Voice Cloning API) |
| 🗣️ **14 Auto Tone Shifts** | Happy news = cheerful voice, sad news = subdued voice, auto-detected (emotion-aware TTS) |
| 🔉 **Never Goes Silent** | Primary engine down → auto-switches to backup → then free fallback, always has a voice (MiniMax → Edge TTS fallback chain) |
| ⏸️ **Natural Pauses** | Pauses at commas and periods, not robotic read-aloud (TTS pause markers `<#0.5#>`) |
| 📝 **Desktop Subtitles** | Words pop up on screen in sync with speech, like karaoke (typewriter lyrics overlay) |
| 🔇 **No Overlapping Speech** | Multiple messages arrive at once? Queued and spoken one by one (priority speech queue) |

#### 🧠 Persona & Personality

| Feature | Description |
|---------|-------------|
| 🎭 **5 Personality Presets** | Sweet / Professional / Humorous / Cool / Custom — pick one and it talks that way (personality preset system) |
| 📝 **Auto-Generated Persona Files** | One click generates the AI's "character sheet", no manual prompt writing (auto-generate AGENTS.md + SOUL.md + USER.md) |
| 💬 **Name Your Pet** | Give it a name and set what it calls you, e.g. "Kiki calls you Boss" (petName + userName config) |

#### 🛡️ Gateway Guardian

| Feature | Description |
|---------|-------------|
| ⚡ **Auto-Restart on Crash** | Detects Gateway not running and auto-starts it for you (Guardian auto-start, triggers after 3 consecutive detection failures) |
| 📊 **Live Health Monitoring** | Continuously monitors Gateway health, alerts you at first sign of trouble (anomaly detection + health scoring) |
| 🎙️ **Voice Status Reports** | "Starting…", "Success!", "Failed!" — spoken aloud so you don't have to watch the console (voice status announcement) |
| 🔄 **Crash Auto-Recovery** | Auto-restarts after crash, max 10 times per hour to prevent infinite loops (auto-restart with rate limiting) |
| 🩺 **10-Point Health Check** | Gateway / TTS / Model / Port / Cache / Logs — one-click diagnosis with fix suggestions (Doctor self-check) |
| 🔧 **Safe Guard** | Double-confirms before restart to avoid killing a healthy Gateway (cross-validation with ServiceManager) |

#### 🧙 Setup Wizard

| Feature | Description |
|---------|-------------|
| 🎮 **RPG-Style UI** | Wood frames + parchment background + lobster guide + typewriter dialogue, feels like an RPG game (RPG-style Setup Wizard) |
| 📋 **7 Steps, Fully Configured** | Gateway → Model → Channels → TTS Engine → Voice Settings → Display → End-to-End Test |
| ⚡ **One-Click Install Missing Deps** | Missing something? One button auto-installs with live progress bar (one-click dependency install + real-time progress) |
| 🔍 **Auto Environment Detection** | Auto-finds Node.js, Python, OpenClaw, etc. — installed or not, version at a glance (smart environment detection) |
| ✅ **Full Validation at the End** | 7 checks ensure everything works before you start, no hidden issues (end-to-end validation) |

#### 🎨 Terminal & Logs

| Feature | Description |
|---------|-------------|
| 🌈 **Colorized Console** | Different info in different colors: model names blue, URLs green, errors red — easy to scan (ANSI colorized logging, 12+ modules) |
| 🔇 **Auto Log Dedup** | Same message won't spam your console, keeps output clean (whitespace-normalized dedup) |
| 📁 **Auto Log Archiving** | Old logs archived daily, compressed over 10MB, kept for 7 days (log rotation + gzip archiving) |
| 📊 **Real-Time Perf Monitoring** | Memory, CPU, FPS at your fingertips, auto-alerts when thresholds exceeded (performance monitor + 24h sample history) |

#### 🔁 Model Switching

| Feature | Description |
|---------|-------------|
| 🔄 **One-Click AI Brain Swap** | Claude ↔ GPT ↔ Gemini ↔ DeepSeek, no restart needed, 3 seconds (hot model swap via CC-Switch) |
| 📊 **AI Speed Test** | One-click latency benchmark for each model, pick the fastest (latency benchmark) |
| ➕ **Add Your Own Models** | 15+ mainstream AI providers supported, or enter your own API endpoint (custom provider + preset templates) |
| 📜 **Switch History** | Records every model switch — what, when, fully traceable (switch history tracking) |

#### 🔐 Security

| Feature | Description |
|---------|-------------|
| 🔑 **Encrypted Key Storage** | API keys encrypted before writing to disk, never plaintext (Electron safeStorage encryption) |
| 🛡️ **Permission Control** | Pages can't directly call system functions, all operations go through whitelist (IPC whitelist sandbox) |
| 🧹 **Auto Log Sanitization** | API keys, tokens auto-hidden from logs (log sanitizer) |

#### 🖥️ Desktop Integration

| Feature | Description |
|---------|-------------|
| 📌 **Always on Top** | Orb and subtitles stay on top of all windows, never hidden (always-on-top) |
| 🖱️ **Click-Through Subtitles** | Lyric subtitles are fully click-through, never block what's underneath (mouse-through transparent window) |
| 🔗 **Auto Desktop Shortcut** | First launch auto-creates desktop shortcut, double-click to start next time (auto .lnk / .app creation) |
| 📸 **One-Click Screenshot Upload** | Toolbar screenshot button, auto-captures and uploads to Lark (screenshot + Lark upload) |
| 💬 **Multi-Platform Message Sync** | Discord / Telegram / Lark / WeCom messages all synced for voice readout (multi-channel message sync) |
| 🍎 **Win + Mac Support** | Windows 10/11 and macOS (Intel & Apple Silicon) both supported (cross-platform Electron) |
| 📱 **Tray Menu Control Center** | Right-click tray icon to switch models, check status, run diagnostics, manage sessions (system tray context menu) |

### 🆕 What's New in v3.5.2

> ⚡ **UX polish!** Wizard blank page fix + One-click missing dependency installer + Cross-platform support

- ⚡ **One-click Install Missing Deps** — Auto-install edge-tts / sqlite3 / node_modules with real-time progress
- 🔧 **Cross-platform Install** — Windows (winget/choco), macOS (brew), Linux (apt/yum)
- 🐛 **Wizard Blank Page Fix** — Fixed 3 syntax errors causing empty wizard content
- 🐛 **Wizard Error Visualization** — Shows error details instead of blank page for easier debugging
- 🔇 **Dual Audio Fix** (v3.5.1) — All `new Notification()` use `silent: true` to prevent Windows narration
- 🖥️ **Shortcut Fix** (v3.5.1) — Desktop shortcut now targets `start.cmd` to show CMD console

> 🎨 **Major UX update!** Global colorized terminal logs + Smart Gateway auto-start + Log dedup & noise reduction + Auto desktop shortcut on first launch

#### 🎨 Global Colorized Terminal Logs
- 🆕 **color-log.js** — Centralized ANSI color module with auto-keyword highlighting
- ✨ **12+ modules migrated** — All startup logs use `colorLog()` / `kvLog()` / `tagLog()`
- 🎯 **Enhanced Gateway log highlighting** — Models(cyan), URLs(green), paths(dim), channels(magenta), @botname(magenta), key=value(yellow), ports(yellow), protocols(cyan), errors(red), success(green), warnings(yellow)

#### 🛡️ Smart Gateway Auto-Start
- 🆕 **Proactive first launch** — Guardian auto-starts Gateway after 3 consecutive failures instead of waiting forever
- 🆕 **Voice status announcements** — "Waiting for Gateway" / success / failure spoken aloud
- 🔧 **Cross-validation** — Double-checks with ServiceManager to prevent false restarts

#### 🔇 Log Dedup & Noise Reduction
- 🔧 **Fixed Gateway log duplication** — Root cause: `log()` method double-printing; gateway-std* services skip console output
- 🔧 **Smart stderr filtering** — Only show lines with error/fatal/panic/exception
- 🔧 **Whitespace-normalized dedup** — `\s+` → `' '` normalization before Set dedup

#### 🖥️ Auto Desktop Shortcut
- 🆕 **Auto-create .lnk on first launch** — Creates "Claw 桌面宠物" shortcut on desktop
- 🔧 **PowerShell COM** — WScript.Shell shortcut creation with icon and minimized start
- 🎙️ **Voice announcement** — "Desktop shortcut created" on success

#### 🐛 Fixes
- Fixed dual audio playback (removed duplicate `voiceSystem.speak()` from messageSync)
- Fixed duplicate notification logs (desktop-notifier only logs type)
- Removed DashScope TTS engine, simplified fallback: MiniMax → Edge TTS

### 🚀 Quick Start

#### Prerequisites

- **Node.js** ≥ 18.x ([Download](https://nodejs.org))
- **Windows** 10/11 or **macOS** 10.15+
- **OpenClaw** ≥ 2026.x ([Community](https://clawd.org.cn) | [International](https://openclaw.ai))

#### Install via ClawHub (Recommended)

```bash
npx clawhub@latest install kk43994/desktop-pet
```

#### Install from GitHub

```bash
git clone https://github.com/kk43994/kkclaw.git
cd kkclaw
npm install
npm start
```

> 🧙 **Setup Wizard** will launch automatically on first run — just follow the guide!

### 📦 Downloads

| Platform | Arch | Download | Size |
|----------|------|----------|------|
| 🪟 **Windows** | x64 | [Setup.exe](https://github.com/kk43994/kkclaw/releases/download/v3.5.2/KKClaw-Desktop-Pet-3.5.2-Setup.exe) | ~150MB |
| 🍎 **macOS** | Intel | [x64.dmg](https://github.com/kk43994/kkclaw/releases/download/v3.5.2/KKClaw-Desktop-Pet-3.5.2-x64.dmg) | ~160MB |
| 🍎 **macOS** | Apple Silicon | [arm64.dmg](https://github.com/kk43994/kkclaw/releases/download/v3.5.2/KKClaw-Desktop-Pet-3.5.2-arm64.dmg) | ~160MB |

[📦 All Releases](https://github.com/kk43994/kkclaw/releases)

### 🤝 Contributing

1. **Fork** this repo
2. Create branch `git checkout -b feature/your-feature`
3. Commit `git commit -m 'Add: feature description'`
4. Push `git push origin feature/your-feature`
5. Open a **Pull Request**

### 📜 License

[MIT License](LICENSE) © 2024-2026 KK

---

## 🙏 致谢

- [OpenClaw](https://openclaw.ai) — 强大的AI助手框架
- [Electron](https://www.electronjs.org) — 跨平台桌面应用框架
- [MiniMax](https://www.minimaxi.com) — 高质量语音克隆API
- [Nomi](https://nomi.ai) & [AIBI](https://aibi.com) — UI设计灵感
- [Bunny Hole](https://bunnyhole.com) — 眼睛设计参考

---

<div align="center">

**用❤️打造 by KK**

[🔝 回到顶部](#-kkclaw-desktop-pet)

</div>
