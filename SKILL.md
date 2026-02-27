---
name: kkclaw
description: 给你的 AI Agent 一个桌面身体 — 可视化情绪球体 + 语音交互 + 跨平台支持（Windows + macOS）
version: 3.0.0
author: xiao-k-assistant
tags: [desktop-pet, electron, tts, voice, emotion, openclaw, visualization, cross-platform]
---

# kkclaw — 桌面龙虾 AI 伴侣

给你的 AI Agent 一个桌面身体：可视化球体 + 语音交互 + 情绪表达。

## 功能特性

- u{1F9D9} **Setup Wizard** u{2014} 首次运行引导配置，3分钟上手
- u{1F512} **safeStorage 加密** u{2014} API Key 本地加密存储，不再明文
- u{1F3AD} **人设定制** u{2014} SOUL.md 自定义 AI 性格和说话风格

- 🎵 **声音系统** — MiniMax 声音克隆 + CosyVoice + Edge TTS 三级降级，永不失声
- 👀 **情绪表达** — 14种情绪（idle/happy/talking/thinking/sleepy/surprised/offline）+ 15种眼睛微表情
- 🧠 **Gateway 同步** — WebSocket 实时同步 OpenClaw Agent 状态，毫秒级响应
- 💪 **7x24 可靠** — 自动恢复、健康评分监控、Switch Logger
- 🖥️ **轻量渲染** — 纯 HTML/CSS/JS 球体，CSS radial-gradient 琉璃质感，不依赖框架
- 🎤 **语音播报** — Agent 回复自动转语音，支持情感识别（happy/sad/angry/calm等）
- 🖱️ **桌面集成** — 窗口置顶、鼠标穿透、拖动跟随、歌词式字幕窗口

## 技术栈

- Electron（桌面容器）
- OpenClaw Gateway（WebSocket 通信）
- MiniMax Speech 2.5 Turbo / CosyVoice / Edge TTS（语音合成）
- CSS Animation + requestAnimationFrame（球体动画）

## 安装

```bash
git clone https://github.com/kk43994/kkclaw.git
cd kkclaw
npm install
npm start
```

或下载安装包：
- **Windows:** https://github.com/kk43994/kkclaw/releases/download/v3.0.0/KKClaw-Desktop-Pet-2.1.0-Setup.exe
- **macOS (Intel):** https://github.com/kk43994/kkclaw/releases/download/v3.0.0/KKClaw-Desktop-Pet-2.1.0-x64.dmg
- **macOS (Apple Silicon):** https://github.com/kk43994/kkclaw/releases/download/v3.0.0/KKClaw-Desktop-Pet-2.1.0-arm64.dmg

## 配置

编辑 `pet-config.json` 自定义：
- TTS 引擎和声音
- 球体颜色和大小
- OpenClaw Gateway 连接
- 情绪映射规则

## 目录结构

```
kkclaw/
├── main.js              # Electron 主进程
├── index.html           # 球体渲染 UI
├── lyrics.html          # 歌词字幕窗口
├── openclaw-client.js   # Gateway WebSocket 客户端
├── desktop-bridge.js    # Agent 消息→桌面通知桥接
├── voice/               # TTS 引擎模块
├── utils/               # 工具模块
├── scripts/             # 构建脚本
└── docs-dev/            # 开发文档
```

## 链接

- GitHub: https://github.com/kk43994/kkclaw
- Landing Page: https://kk43994.github.io/kkclaw/
- 版本: v3.0.0
