# 🦞 Claw Desktop Pet

<div align="center">

<img src="docs/images/banner-openclaw-core.jpg" alt="OpenClaw Core — Desktop Embodiment" width="100%" />

**The desktop embodiment of OpenClaw. A living interface with emotion, voice, and presence.**

**OpenClaw 的桌面化身。一个有情绪、有语音、有存在感的活体界面。**

![Version](https://img.shields.io/badge/version-2.0.2-blue)
![Updated](https://img.shields.io/badge/updated-2026--02--10-informational)
![CI](https://github.com/kk43994/claw-desktop-pet/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/badge/license-Personal%20Use%20%7C%20No%20Resale-orange)
![Platform](https://img.shields.io/badge/platform-Windows-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![Electron](https://img.shields.io/badge/electron-28.x-9feaf9)

[Live Demo](https://kk43994.github.io/claw-desktop-pet/) · [Quick Start](#-quick-start) · [Features](#-features) · [Architecture](#-architecture) · [Configuration](#%EF%B8%8F-configuration) · [Roadmap](#-roadmap)

</div>

---

## 🌟 Why This Exists

| | EN | 中文 |
|---|---|---|
| **Problem** | OpenClaw is powerful, but invisible — it lives in a terminal. | OpenClaw 很强，但"看不见" — 它活在终端里。 |
| **Solution** | Give it a body: a fluid glass ball that floats on your desktop with emotion, voice, and presence. | 给它一个身体：一颗浮在桌面上的流体玻璃球，有情绪、有声音、有存在感。 |
| **Philosophy** | "Air-sense UI" — like desktop lyrics, it's there but never in the way. | "空气感UI" — 像桌面歌词一样，存在但不打扰。 |

---

## 📸 Screenshots

> **Note:** Screenshots are placeholders. Real images coming soon.

<table>
<tr>
<td width="50%" align="center">

<!-- TODO: Replace with real screenshot -->
![Fluid Glass Ball](https://via.placeholder.com/400x300/1a1a2e/e94560?text=Fluid+Glass+Ball+%2867px%29)

**Fluid Glass Ball UI**
67px ball with 7 mood colors and 15+ eye expressions

流体玻璃球 · 7种情绪色系 · 15+眼睛表情

</td>
<td width="50%" align="center">

<!-- TODO: Replace with real screenshot -->
![Desktop Lyrics](https://via.placeholder.com/400x300/1a1a2e/e94560?text=Desktop+Lyrics+Effect)

**Desktop Lyrics Effect**
Typewriter text with glow, fully click-through

桌面歌词效果 · 打字机+自发光 · 鼠标完全穿透

</td>
</tr>
<tr>
<td width="50%" align="center">

<!-- TODO: Replace with real screenshot -->
![KKClaw Switch](https://via.placeholder.com/400x300/1a1a2e/e94560?text=KKClaw+Switch+Panel)

**KKClaw Switch**
One-click provider/model management and sync

一键服务商/模型管理 · 同步到OpenClaw

</td>
<td width="50%" align="center">

<!-- TODO: Replace with real screenshot -->
![Offline & Revive](https://via.placeholder.com/400x300/1a1a2e/e94560?text=Offline+%E2%86%92+Revive+Animation)

**Offline → Revive Animation**
Grey when disconnected, colorful particle burst on connect

离线灰色 → 连接复活动画 · 粒子爆散

</td>
</tr>
</table>

---

## ✨ Features

### 🫧 Fluid Glass Ball UI

<table>
<tr><td>

| Feature | Detail | 说明 |
|---|---|---|
| Ball size | 67px, always-on-top transparent window | 67px 透明置顶窗口 |
| Mood colors | 7 states: idle, happy, talking, thinking, sleepy, surprised, offline | 7种情绪色系 |
| Eye expressions | 15+ micro-expressions (blink, curious, thinking, surprised…) | 15+种眼睛微表情 |
| Mouse tracking | Eyes follow cursor position | 眼睛跟随鼠标 |
| Toolbar | 3 SVG icons (chat, voice, screenshot), expand on hover | 悬停展开工具栏 |
| Drag sync | Sprite + lyrics windows move together | 拖拽两窗口同步 |

</td></tr>
</table>

<!-- TODO: Add GIF of ball animation -->
> 📷 *Screenshot placeholder: ball mood transitions GIF*

### 🎵 Desktop Lyrics

<table>
<tr><td>

| Feature | Detail | 说明 |
|---|---|---|
| Display style | White self-luminous text on transparent background | 白色自发光文字 |
| Animation | Typewriter effect, 35ms per character | 打字机逐字出现 |
| Fade out | 0.8s ease-out after speech ends | 语音结束后优雅淡出 |
| Click-through | Full mouse passthrough (`setIgnoreMouseEvents`) | 完全鼠标穿透 |
| Window size | 400×100px, synced position with sprite | 400×100 同步位置 |

</td></tr>
</table>

<!-- TODO: Add screenshot of lyrics effect -->
> 📷 *Screenshot placeholder: desktop lyrics typewriter effect*

### 🎤 Emotional TTS Pipeline

<table>
<tr><td>

| Engine | Role | Model | 说明 |
|---|---|---|---|
| **MiniMax** | Primary | `speech-2.5-turbo-preview` | 主引擎 · 克隆音色 · 7种情感 |
| **CosyVoice** | Fallback #1 | `cosyvoice-v3-plus` | 备用1 · DashScope |
| **Edge TTS** | Fallback #2 | Built-in | 备用2 · 免费兜底 |

**Smart emotion detection**: automatically selects emotion (happy/sad/angry/calm…) based on text content.

**智能情感识别**：根据文本内容自动选择情绪。

</td></tr>
</table>

<!-- TODO: Add screenshot of voice settings panel -->
> 📷 *Screenshot placeholder: voice settings / emotion selection*

### 🔁 KKClaw Switch (Model Hot-Switching)

<table>
<tr><td>

| Capability | Detail | 说明 |
|---|---|---|
| Provider management | Add / edit / delete API providers | 增删改服务商 |
| One-click switch | Switch active provider instantly | 一键切换当前Provider |
| Sync to OpenClaw | Push config to `openclaw.json` + `models.json` | 同步配置到OpenClaw |
| Auto restart | `--restart` flag restarts gateway automatically | 自动重启Gateway生效 |
| Import from CC Switch | Import providers from CC Switch database | 从CC Switch导入 |

</td></tr>
</table>

```bash
# Sync current provider + restart OpenClaw
node kkclaw-hotswitch.js --restart
```

<!-- TODO: Add screenshot of KKClaw Switch panel -->
> 📷 *Screenshot placeholder: KKClaw Switch management panel*

### 🛡️ Production-Grade Reliability

<table>
<tr><td>

| System | What it does | 说明 |
|---|---|---|
| Global error handler | Catches 5 error types (uncaught, unhandled, renderer, IPC, network) | 5种错误全捕获 |
| Auto restart | Progressive delay restart on crash | 崩溃渐进式重启 |
| Health monitor | Real-time health score + anomaly alerts | 实时健康评分 |
| Log rotation | Auto-cleanup logs older than 30 days | 30天日志轮转 |
| Cache cleanup | Auto-cleanup voice/screenshot cache every 6 hours | 6小时缓存清理 |
| Gateway guardian | Detects and restarts OpenClaw Gateway | Gateway守护进程 |

</td></tr>
</table>

### 💬 Interaction & Integration

<table>
<tr><td>

| Feature | Detail | 说明 |
|---|---|---|
| AI chat | Integrated OpenClaw conversation via input bar | 集成OpenClaw对话 |
| Feishu sync | Feishu messages ↔ desktop notification + voice | 飞书消息双向同步+语音 |
| Screenshot | One-click screenshot to Feishu | 一键截图发飞书 |
| Triple-click history | Triple-click ball to show recent messages | 三击球体看历史 |
| System tray | Service management + session recovery + exit | 托盘菜单管理 |

</td></tr>
</table>

### 📊 Performance

| Metric | Value | Note |
|---|---|---|
| Memory | ~60MB | Including monitoring data |
| CPU | <1% | Normal operation |
| Startup | ~3s | Including TTS initialization |
| Ball FPS | 60fps | `requestAnimationFrame` |
| TTS latency | ~3s | MiniMax generation time |

---

## 🚀 Quick Start

### Minimum (3 steps)

```bash
git clone https://github.com/kk43994/claw-desktop-pet.git
cd claw-desktop-pet
npm install
npm start
```

### Full Experience (OpenClaw + TTS)

```bash
# 1. Clone & install (same as above)

# 2. Install OpenClaw
npm install -g openclaw

# 3. Start Gateway
openclaw gateway start

# 4. Configure TTS (optional)
# Copy pet-config.example.json -> pet-config.json
# Fill in your API keys (DO NOT commit real keys)

# 5. Launch
npm start
```

**What happens on first launch:**
1. 🩶 Ball appears in **grey/offline** state
2. 🔴 Gateway connects → **revive animation** (grey → colorful + particle burst)
3. 🎵 Lyrics window fades in above the ball
4. 🎤 TTS system initializes and is ready

<!-- TODO: Add GIF of first-launch sequence -->
> 📷 *Screenshot placeholder: first-launch revive animation GIF*

---

## 🏗️ Architecture

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
│  │ ┌─────────────┐ ┌──────────────┐ ┌────────────────────────┐ │
│  │ │ Msg Bridge  │ │ TTS Pipeline │ │ Resilience & Observ.   │ │
│  │ │ Feishu <->  │ │ MiniMax ->   │ │ Error hooks, restart,  │ │
│  │ │ Desktop     │ │ CosyVoice -> │ │ health score, logs,    │ │
│  │ │             │ │ Edge TTS     │ │ cache cleanup          │ │
│  │ └─────────────┘ └──────────────┘ └────────────────────────┘ │
│  └──────────────────────────────────────────────────────────────┘
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐
│  │ OpenClaw Gateway (optional)                                  │
│  │ - Model providers + routing (Claude / Codex etc.)            │
│  │ - KKClaw Switch (provider/model hotswitch + sync)            │
│  └──────────────────────────────────────────────────────────────┘
└──────────────────────────────────────────────────────────────────┘
```

### Module Responsibilities / 模块职责

| Module | File(s) | Responsibility |
|---|---|---|
| **Main Process** | `main.js` | Window creation, IPC, lifecycle, Gateway connection |
| **Sprite UI** | `index.html` | Fluid ball, eyes, toolbar, animations |
| **Lyrics UI** | `lyrics.html` | Desktop lyrics rendering, typewriter, fade |
| **Smart Voice** | `smart-voice.js` | Emotion detection, TTS engine selection |
| **MiniMax TTS** | `minimax-tts.js` | MiniMax API integration, voice cloning |
| **CosyVoice TTS** | `cosyvoice-tts.py`, `dashscope-tts.js` | DashScope TTS fallback |
| **Model Switcher** | `model-switcher.js`, `model-settings.html` | KKClaw Switch UI + logic |
| **Error Handler** | `global-error-handler.js` | 5-type error catching + recovery |
| **Auto Restart** | `auto-restart.js` | Progressive delay crash recovery |
| **Performance** | `performance-monitor.js` | Health score, anomaly detection |
| **Log Rotation** | `log-rotation.js` | 30-day auto cleanup |
| **Cache Manager** | `cache-manager.js` | 6-hour voice/screenshot cache cleanup |
| **Gateway Guardian** | `gateway-guardian.js` | Auto-detect and restart gateway |
| **Message Bridge** | `desktop-bridge.js` (in openclaw-data) | Feishu ↔ desktop notification relay |

---

## ⚙️ Configuration

> ⚠️ Never commit real credentials. Use `pet-config.example.json` as a safe template.

### `pet-config.json`

| Key | Type | Default | EN | 中文 |
|---|---|---:|---|---|
| `position.x` / `position.y` | number | `0` | Ball position on screen | 球体屏幕位置 |
| `mood` | string | `idle` | Current mood state | 当前情绪状态 |
| `voiceEnabled` | boolean | `true` | Enable/disable TTS | 是否开启语音 |
| `ttsEngine` | string | `minimax` | Active engine: `minimax` / `dashscope` | TTS引擎 |
| `minimax.apiKey` | string | — | MiniMax API key | MiniMax密钥 |
| `minimax.model` | string | `speech-2.5-turbo-preview` | Voice model | 语音模型 |
| `minimax.voiceId` | string | — | Cloned voice ID | 克隆音色ID |
| `minimax.speed` | number | `1.1` | Speech speed | 语速 |
| `minimax.vol` | number | `3` | Volume | 音量 |
| `minimax.emotion` | string | `calm` | Default emotion hint | 默认情绪 |
| `dashscope.apiKey` | string | — | DashScope API key | DashScope密钥 |
| `dashscope.model` | string | `cosyvoice-v3-plus` | CosyVoice model | CosyVoice模型 |
| `dashscope.voice` | string | — | CosyVoice voice ID | CosyVoice音色ID |
| `dashscope.speechRate` | number | `1.1` | Speech rate | 语速 |

### OpenClaw Gateway

| Config | Location | Purpose |
|---|---|---|
| Main config | `~/.openclaw/openclaw.json` | Gateway settings, model providers |
| Agent models | `~/.openclaw/agents/main/agent/models.json` | Per-agent model overrides |
| Gateway port | Default `18789` | Local API endpoint |

---

## 🔁 KKClaw Switch: Hot Switch & Sync

### What it does

KKClaw Switch is the built-in provider/model management panel. It reads from CC Switch database, lets you add/edit/delete providers, and syncs configurations to OpenClaw.

KKClaw Switch 是内置的服务商/模型管理面板。支持从 CC Switch 导入、增删改服务商、一键同步到 OpenClaw。

### Usage

```bash
# Sync current active provider to OpenClaw
node kkclaw-hotswitch.js

# Sync + auto restart gateway (recommended)
node kkclaw-hotswitch.js --restart
```

### Sync Flow

```text
CC Switch DB ──import──> KKClaw Switch ──sync──> openclaw.json + models.json ──restart──> Gateway
```

### Known Pitfalls

| Issue | Cause | Fix |
|---|---|---|
| `&&` not valid in PowerShell | PowerShell syntax | Use `;` instead |
| Config not taking effect | Gateway not restarted | `openclaw gateway restart` |
| JSON parse error | Duplicated keys (case collision) | `node fix-openclaw-config.js` |

---

## 🧰 Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Ball stays grey | Gateway not running or not connected | `openclaw gateway start` |
| No voice output | TTS keys missing or engine down | Check `pet-config.json`, verify API keys |
| Switched model but old one responds | Config not synced/restarted | `node kkclaw-hotswitch.js --restart` |
| PowerShell `&&` error | PowerShell doesn't support `&&` | Use `;` |
| `openclaw.json` parse failure | Duplicated provider keys | `node fix-openclaw-config.js` |
| Window not transparent | GPU acceleration conflict | Already handled: `disableHardwareAcceleration` |
| High memory usage | Log/cache buildup | Automatic cleanup runs every 6 hours |

---

## 🔐 Security & Privacy

- **Never commit** API keys, tokens, or `pet-config.json`
- Real config stays local; only `pet-config.example.json` is in the repo
- If a key is accidentally exposed, rotate immediately
- Logs may contain message content; the 30-day auto-cleanup limits exposure
- All network calls are to your own configured API endpoints (no telemetry)

---

## 🗺️ Roadmap

| Priority | Feature | Status |
|---|---|---|
| 🟢 Done | Fluid glass ball + desktop lyrics | v2.0 |
| 🟢 Done | MiniMax TTS + emotion detection | v2.0 |
| 🟢 Done | KKClaw Switch + hot sync | v2.0.1 |
| 🟡 Planned | Linux (Ubuntu + X11) experimental | — |
| 🟡 Planned | Wayland support | TBD |
| 🟡 Planned | Multi-frame idle animation | — |
| 🔵 Idea | macOS support | — |
| 🔵 Idea | Plugin system for custom expressions | — |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: description"`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request

### Guidelines
- Keep UI changes isolated from runtime logic
- Include screenshots/GIFs for any visual change
- Follow existing code style (no linter configured yet)
- Test on Windows before submitting

---

## 📋 Release Process

- [ ] Bump version in `package.json`
- [ ] Update `CHANGELOG.md`
- [ ] Update README badges (version, date)
- [ ] Verify GitHub Pages renders correctly (`docs/`)
- [ ] Commit, tag, push: `git tag vX.Y.Z && git push --tags`
- [ ] Create GitHub Release with notes

---

## 🧑‍🤝‍🧑 Community

<div align="center">

<img src="docs/images/ai-coding-qr.jpg" alt="AI Coding WeChat Group" width="240" />

**Join the AI Coding group · 加入 AI Coding 群**

*(QR valid for 7 days / 二维码 7 天有效)*

</div>

---

## ☕ Support

If this project helps you, consider buying the author a coffee:

如果这个项目帮到了你，欢迎请作者喝杯咖啡：

<div align="center">

<img src="docs/images/support-qr.jpg" alt="Support QR" width="240" />

</div>

---

## ⚖️ License & Commercial Use

This project is licensed under a **Personal Use, No Resale** license.

| Allowed | Not Allowed |
|---|---|
| ✅ Personal use on your own devices | ❌ Selling or reselling |
| ✅ Modifying for personal needs | ❌ Paid redistribution |
| ✅ Free redistribution (with attribution) | ❌ Commercial hosting/support |
| ✅ Learning and research | ❌ Bundling with paid products |

**Need commercial use?** Contact via GitHub Issue or community channels.

**需要商用？** 通过 GitHub Issue 或社群联系作者获取商业授权。

See [LICENSE](LICENSE) for full terms.

---

<div align="center">

**Built by [KK](https://github.com/kk43994) · Soul designed by 小K 🦞**

**⭐ Star this repo if you like it!**

</div>
