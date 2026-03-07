---
name: kkclaw
description: 给你的 AI Agent 一个桌面身体 — Setup Wizard、14情绪球体、语音克隆、歌词窗、Doctor 自检、跨平台支持（Windows + macOS）
version: 3.0.0
author: xiao-k-assistant
tags: [desktop-pet, electron, tts, voice, emotion, openclaw, visualization, cross-platform]
---

# kkclaw — 桌面龙虾 AI 伴侣

给你的 AI Agent 一个桌面身体：可视化球体 + 语音交互 + 情绪表达。

## 功能特性

- 🧙 **Setup Wizard** — 首次运行引导配置，3 分钟上手
- 🔐 **safeStorage 加密** — API Key 本地加密存储，不再明文
- 🎭 **人设定制** — 自动生成 `AGENTS.md` / `SOUL.md` / `USER.md` / `HEARTBEAT.md`
- 🎵 **声音系统** — MiniMax 声音克隆 + CosyVoice + Edge TTS 三级降级，永不失声
- 👀 **情绪表达** — 14 种情绪 + 多种眼睛微表情 + 动态 glow 光效
- 🩺 **Doctor 自检** — 一键诊断 Gateway / 模型 / TTS / 端口 / 日志 / 歌词窗
- 🎛️ **模型管理** — Provider CRUD、模型增删、延迟测速、预设快速添加
- 🧠 **Gateway 同步** — WebSocket 实时同步 OpenClaw Agent 状态，毫秒级响应
- 💪 **7x24 可靠** — 自动恢复、健康评分监控、Switch Logger
- 🖥️ **轻量渲染** — 纯 HTML/CSS/JS 球体，CSS radial-gradient 琉璃质感，不依赖框架
- 🎤 **语音播报** — Agent 回复自动转语音，支持情感识别与停顿标记
- 🖱️ **桌面集成** — 窗口置顶、鼠标穿透、拖动跟随、歌词式字幕窗口

## 技术栈

- Electron（桌面容器）
- OpenClaw Gateway（WebSocket 通信）
- MiniMax Speech / CosyVoice / Edge TTS（语音合成）
- CSS Animation + requestAnimationFrame（球体动画）

## 安装

```bash
git clone https://github.com/kk43994/kkclaw.git
cd kkclaw
npm install
npm start
```

或下载安装包：
- **Windows:** https://github.com/kk43994/kkclaw/releases/download/v3.0.0/KKClaw-Desktop-Pet-3.0.0-Setup.exe
- **macOS (Intel):** https://github.com/kk43994/kkclaw/releases/download/v3.0.0/KKClaw-Desktop-Pet-3.0.0-x64.dmg
- **macOS (Apple Silicon):** https://github.com/kk43994/kkclaw/releases/download/v3.0.0/KKClaw-Desktop-Pet-3.0.0-arm64.dmg

## 配置

编辑 `pet-config.json` 自定义：
- TTS 引擎和声音
- 球体颜色和大小
- OpenClaw Gateway 连接
- 情绪映射规则
- Setup Wizard 首次引导流程

## 目录结构

```
kkclaw/
├── main.js              # Electron 主进程
├── index.html           # 球体渲染 UI
├── lyrics.html          # 歌词字幕窗口
├── setup-wizard.html    # Setup Wizard 界面
├── setup-wizard.js      # Setup Wizard 逻辑
├── openclaw-client.js   # Gateway WebSocket 客户端
├── smart-voice.js       # 语音调度系统
├── templates/           # Agent 模板文件
├── voice/               # TTS 引擎模块
├── utils/               # 工具模块
├── scripts/             # 构建脚本
└── docs-dev/            # 开发文档
```

## 链接

- GitHub: https://github.com/kk43994/kkclaw
- Landing Page: https://kk43994.github.io/kkclaw/
- ClawHub: https://clawhub.ai/kk43994/desktop-pet
- 版本: v3.0.0

