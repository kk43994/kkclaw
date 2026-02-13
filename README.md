# 🦞 kkclaw

**给 OpenClaw 一个身体 — 透明桌面AI伴侣，情感语音、生动表情、空气感UI**

<div align="center">

![Hero Banner](docs/images/hero-banner.png)

*OpenClaw Core + Desktop Embodiment = A living interface with emotion, voice, and presence*

[![Version](https://img.shields.io/badge/version-2.1.0-FF6B4A?style=for-the-badge&logo=github)](https://github.com/kk43994/kkclaw/releases)
[![Updated](https://img.shields.io/badge/updated-2026--02--13-34D399?style=for-the-badge)](https://github.com/kk43994/kkclaw)
[![Build](https://img.shields.io/github/actions/workflow/status/kk43994/kkclaw/build-release.yml?style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com/kk43994/kkclaw/actions)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows_|_macOS-0078D6?style=for-the-badge&logo=apple&logoColor=white)](https://github.com/kk43994/kkclaw)

[🎥 **在线演示**](https://kk43994.github.io/kkclaw/) | [📦 **下载最新版**](https://github.com/kk43994/kkclaw/releases) | [📖 **文档**](#-文档) | [💬 **加入社群**](#-社群)

</div>

---

## 🌟 项目亮点

一个**不一样**的桌面AI助手：

- 🎨 **空气感UI** — 像桌面歌词，不妨碍操作，却始终陪伴
- 🦞 **67px 龙虾球** — 流体动画 + 琉璃质感 + 7种情绪色系
- 👀 **38个待机表情** — 眨眼、歪头、星星眼、打盹...自然随机
- 🎙️ **克隆音色TTS** — MiniMax 2.5 Turbo，小团团音色，7种情感
- 🔁 **KKClaw Switch** — 3秒热切换AI模型，无需重启
- 🎯 **7×24 稳定** — 自动重启、日志轮转、错误恢复
- 🍎 **跨平台支持** — Windows 10/11 + macOS (Intel & Apple Silicon)

---

## 📦 下载安装

### 最新版本：v2.1.0

<div align="center">

| 平台 | 架构 | 下载链接 | 大小 |
|------|------|----------|------|
| 🪟 **Windows** | x64 | [KKClaw-Desktop-Pet-2.1.0-Setup.exe](https://github.com/kk43994/kkclaw/releases/download/v2.1.0/KKClaw-Desktop-Pet-2.1.0-Setup.exe) | ~150MB |
| 🍎 **macOS** | Intel | [KKClaw-Desktop-Pet-2.1.0-x64.dmg](https://github.com/kk43994/kkclaw/releases/download/v2.1.0/KKClaw-Desktop-Pet-2.1.0-x64.dmg) | ~160MB |
| 🍎 **macOS** | Apple Silicon | [KKClaw-Desktop-Pet-2.1.0-arm64.dmg](https://github.com/kk43994/kkclaw/releases/download/v2.1.0/KKClaw-Desktop-Pet-2.1.0-arm64.dmg) | ~160MB |

[📦 查看所有版本](https://github.com/kk43994/kkclaw/releases) | [🎥 在线演示](https://kk43994.github.io/kkclaw/)

</div>

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

### 🎨 7种情绪色系

![Mood System](docs/images/mood-system.png)

**丰富的情绪状态** — 7种���色 × 38种表情 = 超自然的情感表达

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
├── smart-voice.js          # 智能语音调度
├── voice/                  # TTS引擎目录
│   ├── minimax-tts.js
│   ├── dashscope-tts.js
│   └── cosyvoice-tts.py
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

## 🙏 致谢

- [OpenClaw](https://openclaw.ai) — 强大的AI助手框架
- [Electron](https://www.electronjs.org) — 跨平台桌面应用框架
- [MiniMax](https://platform.deepseek.com) — 高质量语音克隆API
- [Nomi](https://nomi.ai) & [AIBI](https://aibi.com) — UI设计灵感
- [Bunny Hole](https://bunnyhole.com) — 眼睛设计参考

---

<div align="center">

**用❤️打造 by 小K**

[🔝 回到顶部](#-kkclaw)

</div>
