# 🦞 Claw Desktop Pet

A production-minded, transparent Electron desktop companion for OpenClaw.

一款面向 7x24 稳定运行的透明桌面 AI 伙伴（OpenClaw 的“身体”）。

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.2-blue)
![Updated](https://img.shields.io/badge/updated-2026--02--10-informational)
![CI](https://github.com/kk43994/claw-desktop-pet/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-green)
![Stability](https://img.shields.io/badge/stability-7×24-success)
![Platform](https://img.shields.io/badge/platform-Windows-blue)

**空气感桌面龙虾智能助手 — 像桌面歌词一样，不妨碍操作的AI伙伴**

集成 OpenClaw AI、MiniMax 语音克隆、流体玻璃球UI、桌面歌词效果

[快速开始](#-快速开始) • [功能特性](#-核心亮点) • [更新日志](#-更新日志) • [配置矩阵](#%EF%B8%8F-configuration-matrix-recommended) • [排障](#-troubleshooting-symptom---fix) • [模型热切换](#-模型热切换kkclaw-switch) • [文档](#-文档) • [加入社群](#-加入社群) • [赞赏支持](#-赞赏支持)

</div>

---

## 📸 预览

<div align="center">

![V2.0 空气感UI](docs/images/v2-preview.jpg)

*67px 流体玻璃球 + 桌面歌词 + 自发光文字 — 像空气一样融入桌面 🦞*

</div>

---

## ✨ V2.0 核心亮点

<table>
<tr>
<td width="50%">

### 🫧 空气感双窗口
- 精灵窗口 (200×220) — 流体球+工具栏
- 歌词窗口 (400×100) — 桌面歌词效果
- 完全鼠标穿透，不妨碍操作
- 拖动时两窗口同步移动

</td>
<td width="50%">

### 👀 15+种眼睛表情
- 胶囊形白色发光眼睛 (Bunny Hole风格)
- 眨眼、开心、惊讶、好奇、思考...
- 待机微表情随机触发
- 鼠标跟随注视

</td>
</tr>
<tr>
<td width="50%">

### 🎨 7种情绪色系
- 🔴 idle — 红橙流体 (默认)
- 🟡 happy — 金橙流体
- 🩷 talking — 粉红流体
- 🔵 thinking — 蓝紫流体
- 🩶 sleepy — 灰粉流体
- 🟠 surprised — 金黄流体
- ⚫ offline — 灰色无力 + 复活动画

</td>
<td width="50%">

### 🎤 MiniMax 语音克隆
- 小团团克隆音色 (speech-2.5-turbo)
- 7种情感控制 (happy/sad/angry...)
- 自动情感识别
- 三级降级: MiniMax → CosyVoice → Edge TTS

</td>
</tr>
<tr>
<td width="50%">

### 🎵 桌面歌词效果
- 白色自发光文字
- 打字机逐字出现 (35ms/字)
- 等语音播完后优雅淡出
- 0.8s 缓动消失动画

</td>
<td width="50%">

### 🛡️ 企业级稳定性
- 全局错误处理 (5种错误捕获)
- 崩溃自动恢复
- 性能监控 + 健康评分
- 日志轮转 + 缓存清理

</td>
</tr>
</table>

---

## 🚀 System Architecture & Components

```text
┌──────────────────────────────────────────────────────────────────┐
│                    🦞 Claw Desktop Pet (Electron)                 │
├──────────────────────────────────────────────────────────────────┤
│  Windows Desktop (Transparent Always-on-top Windows)              │
│                                                                  │
│  ┌────────────── Sprite Window ──────────────┐   ┌─ Lyrics Window ┐
│  │ Fluid Glass Ball UI (67px)                │   │ Desktop Lyrics │
│  │ - Eye micro-expressions (15+)             │   │ - Typewriter   │
│  │ - Mood-based colors (7)                   │   │ - Glow + fade  │
│  │ - Toolbar (SVG icons)                     │   │ - Click-through│
│  └───────────────────────────────────────────┘   └───────────────┘
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐
│  │ Runtime Services                                             │
│  │ - Message Bridge (Feishu <-> Desktop)                        │
│  │ - TTS Pipeline (MiniMax -> CosyVoice -> Edge TTS)            │
│  │ - Resilience Layer (global error hooks, auto-restart)        │
│  │ - Observability (health score, perf monitor, log rotation)   │
│  └──────────────────────────────────────────────────────────────┘
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐
│  │ OpenClaw Gateway (optional)                                  │
│  │ - Model providers + routing (Claude / Codex etc.)            │
│  │ - KKClaw Switch (provider/model hotswitch + sync)            │
│  └──────────────────────────────────────────────────────────────┘
└──────────────────────────────────────────────────────────────────┘
```

---

## ⚡ 快速开始

### 最简安装 (3步)

```bash
# 1️⃣ 克隆项目
git clone https://github.com/kk43994/claw-desktop-pet.git
cd claw-desktop-pet

# 2️⃣ 安装依赖
npm install

# 3️⃣ 启动
npm start
```

### 完整功能 (含AI+语音)

```bash
# 1-2步同上

# 3️⃣ 安装 OpenClaw
npm install -g openclaw

# 4️⃣ 启动 Gateway
openclaw gateway start

# 5️⃣ Configure TTS API Keys (optional)
# Copy `pet-config.example.json` -> `pet-config.json` and fill in your keys
# (DO NOT commit real keys)

# 6️⃣ 启动龙虾
npm start
```

**✨ 首次启动:**
- 🩶 龙虾以灰色离线状态出现
- 🔴 连接成功后复活动画 (灰→彩色 + 粒子爆散)
- 🎵 歌词窗口浮现在球体上方
- 🎤 语音系统就绪

---

## 📦 功能特性

### 🎨 UI系统
- ✅ **流体玻璃球** — 67px，7种情绪色系，60fps动画
- ✅ **胶囊眼睛** — 15+种表情，鼠标跟随，自然眨眼
- ✅ **桌面歌词** — 白色自发光，打字机效果，鼠标穿透
- ✅ **SVG图标工具栏** — 💬发消息 🎤语音 📸截图，hover展开
- ✅ **离线/上线动画** — 灰色无力→彩色复活+粒子爆散
- ✅ **Windows透明修复** — disableHardwareAcceleration

### 🎤 语音系统
- ✅ **MiniMax 克隆音色** — 小团团克隆，speech-2.5-turbo
- ✅ **7种情感控制** — happy/sad/angry/fearful/disgusted/surprised/calm
- ✅ **自动情感识别** — 根据文本内容自动选择emotion
- ✅ **三级降级** — MiniMax → CosyVoice → Edge TTS
- ✅ **停顿控制** — `<#0.5#>` 文本中插入停顿

### 🛡️ 稳定性系统
- ✅ **全局错误处理** — 5种错误类型全捕获
- ✅ **崩溃自动恢复** — 渐进式延迟重启
- ✅ **性能监控** — 实时健康评分，异常告警
- ✅ **日志轮转** — 自动清理30天以上日志
- ✅ **缓存清理** — 6小时自动清理语音/截图缓存
- ✅ **Gateway守护** — 自动检测并重启Gateway

### 💬 交互功能
- ✅ **AI对话** — 集成OpenClaw，输入条发送消息
- ✅ **飞书同步** — 飞书消息 ↔️ 桌面通知+语音播报
- ✅ **截图系统** — 一键截图发送到飞书
- ✅ **三击查看历史** — 三击球体在歌词窗口显示最近消息
- ✅ **托盘菜单** — 服务管理+恢复Session+退出

---

## 📊 性能指标

## ⚙️ Configuration Matrix (Recommended)

> Never commit real credentials. Use `pet-config.example.json` as a safe template.
>
> ✅ Tip: keep secrets only in local files (`pet-config.json`, `~/.openclaw/openclaw.json`), never in git.

### Desktop Pet Runtime (`pet-config.json`)

| Key | Type | Default | Description (EN) | 说明 (中文) |
|---|---|---:|---|---|
| `voiceEnabled` | boolean | `true` | Enable/disable TTS playback | 是否开启语音播报 |
| `ttsEngine` | string | `minimax` | Active TTS engine: `minimax` / `dashscope` | 当前使用的TTS引擎 |
| `minimax.apiKey` | string | - | MiniMax API key (required if `ttsEngine=minimax`) | MiniMax密钥（不要提交到仓库） |
| `minimax.model` | string | `speech-2.5-turbo-preview` | MiniMax voice model | MiniMax语音模型 |
| `minimax.voiceId` | string | - | MiniMax cloned voice id | MiniMax克隆音色ID |
| `minimax.speed` | number | `1.1` | Speech speed | 语速 |
| `minimax.vol` | number | `3` | Volume | 音量 |
| `minimax.emotion` | string | `calm` | Emotion hint | 情绪提示 |
| `dashscope.apiKey` | string | - | DashScope API key | DashScope密钥（不要提交） |
| `dashscope.model` | string | `cosyvoice-v3-plus` | CosyVoice model | CosyVoice模型 |
| `dashscope.voice` | string | - | CosyVoice voice id | CosyVoice音色ID |
| `dashscope.speechRate` | number | `1.1` | Speech rate | 语速 |

### OpenClaw Gateway (Optional)

| Command | Purpose (EN) | 说明 (中文) |
|---|---|---|
| `openclaw gateway start` | Start local gateway | 启动本地网关 |
| `openclaw gateway restart` | Restart to apply model/provider changes | 重启以应用模型/Provider变更 |

---

## 🧰 Troubleshooting (Symptom -> Fix)

### "Switched provider but it doesn't take effect"
- **Cause**: OpenClaw config not reloaded; or duplicated JSON keys in `openclaw.json`.
- **Fix**:
  1) Run hot switch sync: `node kkclaw-hotswitch.js --restart`
  2) If OpenClaw cannot parse config: `node fix-openclaw-config.js` then restart gateway

### PowerShell "&& is not a valid statement separator"
- **Fix**: Use `;` instead of `&&` in PowerShell.

### "I updated config but OpenClaw still uses the old model"
- **Fix**: Confirm current session model, then restart gateway.

---

## 🔐 Security & Privacy

- Never commit API keys or tokens. Keep `pet-config.json` local.
- Prefer `pet-config.example.json` for documentation and onboarding.
- If you accidentally leaked a key, rotate it immediately.

---

## 🤝 Contributing

- Fork -> feature branch -> PR.
- Keep UI changes isolated from runtime logic when possible.
- Add screenshots/GIFs for any UI behavior change.

---

## 🧾 Release Checklist

- [ ] Bump `package.json` version
- [ ] Update README badges + `CHANGELOG.md`
- [ ] Verify `docs/` renders (GitHub Pages)
- [ ] Tag release: `git tag vX.Y.Z && git push --tags`


| 指标 | 数值 | 说明 |
|------|------|------|
| 内存占用 | ~60MB | 含监控数据 |
| CPU占用 | <1% | 正常运行 |
| 启动时间 | ~3秒 | 含语音初始化 |
| 球体帧率 | 60fps | requestAnimationFrame |
| 语音延迟 | ~3秒 | MiniMax TTS生成 |
| 语音成本 | 2元/万字 | speech-2.5-turbo |

---

## 🛠️ 技术��

<div align="center">

| 技术 | 用途 |
|------|------|
| **Electron** | 桌面应用框架 (双窗口) |
| **OpenClaw** | AI 对话引擎 |
| **MiniMax Speech** | 语音克隆+情感TTS |
| **CosyVoice** | 备用TTS引擎 |
| **Node.js** | 后端运行时 |
| **HTML/CSS/JS** | 前端界面 (纯代码动画) |

</div>

---

## 📝 更新日志

### v2.0.2 (2026-02-10) 📚 Documentation Hardening (Open-Source Style)

<details>
<summary>View details</summary>

- Added bilingual positioning and a more "enterprise" documentation layout
- Added Architecture section refresh (component breakdown)
- Added Configuration Matrix, Troubleshooting, Security, Contributing, Release checklist
- Added community QR + support QR entries in both README and GitHub Pages

</details>

### v2.0.1 (2026-02-10) 🔁 KKClaw Switch 热切换修复 + 文档完善

<details>
<summary>查看详情</summary>

**修复/增强：**
- 🔁 修复 KKClaw Switch → OpenClaw 同步的“热切换不生效”问题（重复 key 导致 JSON 解析失败）
- 🧹 新增配置修复脚本：自动清理 `openclaw.json` 的重复 provider key（大小写冲突）
- ⚡ 新增热切换脚本：一键读取当前 provider 并同步到 OpenClaw，支持 `--restart` 自动重启
- 🧩 同步能力从“依赖本地 Gateway 路由”改为“脚本直连配置文件”，更稳定、更可排查
- 📄 README/Pages 文档全面补充（版本号/日期、使用步骤、FAQ、社群入口）

**相关文件：**
- `SYNC-GUIDE.md`（同步流程说明）
- `kkclaw-hotswitch.js`（热切换脚本）
- `fix-openclaw-config.js`（重复 key 修复脚本）

</details>

### v2.0.0 (2026-02-08) 🎨 空气感UI重构

<details>
<summary>查看详情</summary>

**全新UI架构:**
- 🫧 双窗口架构 (精灵+歌词)
- 👀 流体玻璃球 67px + 胶囊眼睛 15+表情
- 🎵 桌面歌词效果 (打字机+自发光+鼠标穿透)
- 🎨 SVG线条图标工具栏
- ⚫ 离线灰色状态 + 上线复活动画
- 🔧 Windows透明窗口修复

**语音升级:**
- 🎤 MiniMax Speech 2.5 Turbo 语音克隆
- 🎭 7种情感自动控制
- 📉 三级降级保障

**设计理念:**
- iOS简约风，空气感UI
- 参考: Nomi机器人 + AIBI机器人 + Bunny Hole
- 像桌面歌词一样不妨碍操作

</details>

### v1.4.0 (2026-02-07) ✨

<details>
<summary>查看详情</summary>

- 🎙️ 智能语音音调优化
- 🐛 修复重复播报问题
- ⚡ 语音播报时长限制增加到800字

</details>

### v1.3.0 (2026-02-06) 🚀

<details>
<summary>查看详情</summary>

- ✨ 全局错误处理系统
- ✨ 自动重启机制
- ✨ 性能监控系统
- ✨ 日志轮转管理
- ✨ 缓存清理系统
- ✨ 智能语音系统

</details>

---

---

## 🔁 模型热切换（KKClaw Switch）

桌面龙虾内置 **KKClaw Switch**（模型/Provider 管理面板）。你可以在 CC Switch / KKClaw Switch 切换 provider 后，一键同步到 OpenClaw 并重启，使新配置立即生效。

### 快速用法

```bash
# 同步当前激活 provider 到 OpenClaw
node kkclaw-hotswitch.js

# 同步并自动重启 OpenClaw Gateway（推荐）
node kkclaw-hotswitch.js --restart
```

### 常见坑（必看）
- **PowerShell 不支持 `&&`**：请用 `;` 分隔命令
- **openclaw.json 重复 key**：可能出现 `KKpinche/...` 和 `kkpinche/...` 大小写冲突，导致解析异常

修复命令：
```bash
node fix-openclaw-config.js
```

详细流程见：`SYNC-GUIDE.md`

---

## 🧑‍🤝‍🧑 加入社群

<img src="docs/images/ai-coding-qr.jpg" alt="AI coding group QR" width="260" />

（二维码 7 天有效，过期我再补新图）

---

## ☕ 赞赏支持

如果这个项目帮到了你，欢迎请作者喝杯咖啡，支持持续维护与功能迭代：

<img src="docs/images/support-qr.jpg" alt="Support QR" width="260" />

---

## 📄 许可证

MIT License

---

## 👨‍💻 作者

- **zhouk (kk43994)** - 开发者
- **小K (AI)** - 灵魂设计师 🦞

---

<div align="center">

**⭐ 如果喜欢，请给个 Star！**

**🦞 空气感桌面龙虾 — 你的AI伙伴**

Made with ❤️ and 🦞

[⬆ 回到顶部](#-claw-desktop-pet)

</div>

