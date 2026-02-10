# 🦞 Claw Desktop Pet

**空气感AI桌面伙伴 — 像桌面歌词一样，不妨碍操作的智能助手**

一款面向 7×24 稳定运行的透明桌面 AI 伙伴，集成 OpenClaw AI、MiniMax 语音克隆、流体玻璃球UI、**KKClaw Switch 模型热切换**。

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.3-blue)
![Updated](https://img.shields.io/badge/updated-2026--02--10-informational)
![CI](https://github.com/kk43994/claw-desktop-pet/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-green)
![Stability](https://img.shields.io/badge/stability-7×24-success)
![Platform](https://img.shields.io/badge/platform-Windows-blue)

[🚀 快速开始](#-快速开始) • [✨ 功能特性](#-功能特性) • [📖 文档](#-文档) • [🔧 配置](#-配置) • [🤝 社群](#-加入社群)

[**🎥 在线演示**](https://kk43994.github.io/claw-desktop-pet/) | [**📦 下载发布版**](https://github.com/kk43994/claw-desktop-pet/releases)

</div>

---

## 📸 预览

<div align="center">

![V2.0 空气感UI](docs/images/v2-preview.jpg)

*67px 流体玻璃球 + 桌面歌词 + 自发光文字 — 像空气一样融入桌面 🦞*

</div>

---

## 🎯 核心特性一览

<table>
<tr>
<td width="50%">

### 🎨 **空气感双窗口设计**
- **精灵窗口** (200×220px)
  - 67px 流体玻璃球
  - SVG图标工具栏
  - 胶囊形发光眼睛
- **歌词窗口** (400×100px)
  - 桌面歌词效果
  - 打字机逐字出现
  - 完全鼠标穿透

</td>
<td width="50%">

### 🎤 **智能语音系统**
- **MiniMax Speech 2.5 Turbo**
  - 小团团克隆音色
  - 7种情感控制
  - 自动情感识别
- **三级降级保障**
  - MiniMax → CosyVoice → Edge TTS
  - 自动切换，无缝体验

</td>
</tr>
<tr>
<td width="50%">

### 👀 **15+种眼睛表情**
- 胶囊形白色发光眼睛 (Bunny Hole风格)
- 待机微表情随机触发
- 鼠标跟随注视
- 眨眼、开心、惊讶、好奇、思考...

</td>
<td width="50%">

### 🎨 **7种情绪色系**
- 🔴 idle — 红橙流体 (默认待机)
- 🟡 happy — 金橙流体 (快乐模式)
- 🩷 talking — 粉红流体 (对话中)
- 🔵 thinking — 蓝紫流体 (思考中)
- 🩶 sleepy — 灰粉流体 (休眠)
- 🟠 surprised — 金黄流体 (惊讶)
- ⚫ offline — 灰色无力 + 复活动画

</td>
</tr>
<tr>
<td width="50%">

### 🤖 **OpenClaw AI 集成**
- 完整对话能力
- 飞书消息双向同步
- 截图发送功能
- 三击查看历史消息

</td>
<td width="50%">

### 🔁 **KKClaw Switch 热切换**
- **Provider切换自动同步**
  - 实时监听DB变化 (每2秒)
  - 自动同步到OpenClaw配置
  - 零重启切换模型
- **手动同步脚本**
  - 一键同步 + 重启
  - 配置文件修复工具

</td>
<td width="50%">

### 🛡️ **企业级稳定性**
- 5种全局错误捕获
- 崩溃自动恢复
- 性能监控 + 健康评分
- 日志轮转 + 缓存清理

</td>
</tr>
</table>

---

## 🚀 快速开始

### 📦 方式一：直接使用（推荐新手）

1. **下载最新版本**
   ```bash
   # 访问 GitHub Releases 页面下载打包好的版本
   https://github.com/kk43994/claw-desktop-pet/releases
   ```

2. **解压运行**
   - 解压到任意目录
   - 双击 `Claw Desktop Pet.exe`
   - 龙虾将以离线模式启动（灰色状态）

### 🛠️ 方式二：从源码运行（推荐开发者）

#### 最简安装（无AI功能）

```bash
# 1️⃣ 克隆项目
git clone https://github.com/kk43994/claw-desktop-pet.git
cd claw-desktop-pet

# 2️⃣ 安装依赖
npm install

# 3️⃣ 启动（离线模式）
npm start
```

#### 完整安装（含AI + 语音）

```bash
# 前面1-2步同上

# 3️⃣ 安装 OpenClaw（AI引擎）
npm install -g openclaw

# 4️⃣ 启动 OpenClaw Gateway
openclaw gateway start

# 5️⃣ 配置语音API密钥（可选）
# 复制 pet-config.example.json → pet-config.json
# 填入你的 MiniMax / DashScope API Key
cp pet-config.example.json pet-config.json
# 编辑 pet-config.json，填入真实密钥

# 6️⃣ 启动龙虾
npm start
```

### ✨ 首次启动效果

- 🩶 **离线状态** — 龙虾以灰色离线状态出现在桌面
- 🔴 **连接成功** — 复活动画（灰→彩色 + 粒子爆散）
- 🎵 **歌词浮现** — 桌面歌词窗口出现在球体上方
- 🎤 **语音就绪** — 如果配置了TTS，语音系统自动启动

---

## ✨ 功能特性

### 🎨 UI系统

#### 双窗口架构
- **精灵窗口** (200×220px)
  - 流体玻璃球 (67px)
  - SVG线条图标工具栏
  - 胶囊形发光眼睛
  - 拖动时两窗口同步移动
  
- **歌词窗口** (400×100px)
  - 白色自发光文字
  - 打字机逐字出现 (35ms/字)
  - 等语音播完后优雅淡出
  - 完全鼠标穿透，不妨碍操作

#### 流体玻璃球
- **67px 球体** — 放大 1/3，视觉更明显
- **7种情绪色系** — idle/happy/talking/thinking/sleepy/surprised/offline
- **琉璃质感** — 3层径向渐变 + 双高光系统
- **60fps 动画** — requestAnimationFrame 流畅运行
- **2秒平滑过渡** — 颜色渐变如丝般顺滑

#### 眼睛表情系统
- **15+种表情** — happy, sad, angry, surprised, curious, sleepy...
- **胶囊形眼睛** — 11×19px，白色发光
- **鼠标跟随** — 自然注视鼠标位置
- **待机微表情** — 随机触发眨眼、好奇等
- **情绪配合** — 不同mood有不同默认表情

#### 工具栏
- **SVG线条图标** — 💬发消息 📸截图 🎤语音
- **hover展开** — 平时收起，鼠标悬停才展开
- **26px图标** — 简洁清晰

#### 离线/上线动画
- **离线状态**
  - 灰色无力 (#b0b0b0)
  - sleepy眼睛表情
  - 缩小0.93x
  - 流体动画减速到20s
  
- **上线复活**
  - 灰色→彩色渐变
  - squish弹性动画
  - 双倍粒子爆散特效
  - 眼睛睁开

### 🎤 语音系统

#### MiniMax Speech 2.5 Turbo
- **语音克隆** — 小团团克隆音色 (xiaotuantuan_minimax)
- **7种情感** — happy/sad/angry/fearful/disgusted/surprised/calm
- **自动识别** — smart-voice.js 根据文本自动选择emotion
- **停顿控制** — `<#0.5#>` 在文本中插入停顿
- **成本优化** — 2元/万字符

#### 三级降级保障
```
MiniMax (主引擎)
   ↓ 失败
CosyVoice (备用1)
   ↓ 失败
Edge TTS (兜底)
```

#### CosyVoice v3-plus
- **高质量克隆** — CosyVoice v3-plus 模型
- **小团团音色** — cosyvoice-v3-plus-tuantuan-...
- **WebSocket流式** — 每次调用创建新连接

### 💬 交互功能

#### AI对话
- **OpenClaw 集成** — 完整AI对话能力
- **输入条** — 底部输入框，回车发送
- **历史记录** — 三击球体查看最近消息
- **实时响应** — 消息实时显示在歌词窗口

#### 飞书同步
- **双向同步**
  - 飞书消息 → 桌面通知 + 语音播报
  - 桌面输入 → 发送到飞书
- **消息桥接** — message-sync.js 自动同步
- **mood触发** — 收到消息时切换talking mood

#### 截图系统
- **一键截图** — 点击📸图标
- **自动发送** — 截图后自动发送到飞书
- **图片清理** — 发送后立即删除本地文件

#### 托盘菜单
- **服务管理**
  - 启动/停止 OpenClaw Gateway
  - 重启 Gateway
  - 显示 Gateway 状态
- **恢复Session** — 一键恢复OpenClaw会话
- **退出** — 优雅关闭所有服务

### 🔁 KKClaw Switch 模型热切换

#### 自动同步模式（推荐）
桌面龙虾启动时会自动启动 **KKClaw Switch 监听器**：

```javascript
// kkclaw-auto-sync.js 自动运行
// - 每2秒监听 ~/.cc-switch/cc-switch.db
// - 检测到provider变化 → 自动同步到OpenClaw配置
// - 自动重启Gateway使配置生效
```

**工作流程：**
1. 在 KKClaw Switch / CC Switch 切换provider
2. 监听器自动检测DB变化
3. 读取新的active provider配置
4. 同步到 `~/.openclaw/openclaw.json`
5. 自动重启OpenClaw Gateway
6. **零手动操作，切换即生效！** ✨

#### 手动同步模式
如果自动同步失败，可以手动运行：

```bash
# 同步当前激活provider到OpenClaw
node C:\Users\zhouk\openclaw-data\kkclaw-hotswitch.js

# 同步并自动重启Gateway（推荐）
node C:\Users\zhouk\openclaw-data\kkclaw-hotswitch.js --restart
```

#### 配置修复工具
如果遇到 `openclaw.json` 重复key问题：

```bash
# 自动清理重复的provider key（大小写冲突）
node C:\Users\zhouk\openclaw-data\fix-openclaw-config.js
```

#### 常见问题

**Q: 为什么切换了provider但不生效？**

A: 可能原因：
1. OpenClaw Gateway没有重启 → 使用 `--restart` 选项
2. 配置文件有重复key → 运行 `fix-openclaw-config.js`
3. 自动监听器未启动 → 重启桌面龙虾

**Q: PowerShell报错 "&& is not a valid statement separator"？**

A: PowerShell不支持 `&&`，请用 `;` 分隔命令：
```powershell
node kkclaw-hotswitch.js ; openclaw gateway restart
```

**Q: 如何确认当前使用的provider？**

A: 运行 `kkclaw-hotswitch.js` 会显示当前激活的provider：
```
🔍 Current active provider: kok6/claude-sonnet-4-5-20250929
✅ Synced to OpenClaw config
```

详细说明见: [SYNC-GUIDE.md](SYNC-GUIDE.md)

### 🛡️ 稳定性系统

#### 全局错误处理
```javascript
// 5种错误捕获
process.on('uncaughtException')      // 未捕获异常
process.on('unhandledRejection')     // 未处理Promise拒绝
app.on('render-process-gone')        // 渲染进程崩溃
webContents.on('crashed')            // 页面崩溃
window.on('unresponsive')            // 窗口无响应
```

#### 崩溃自动恢复
- **渐进式延迟重启**
  - 首次: 1秒
  - 第二次: 2秒
  - 第三次: 4秒
  - 上限: 10秒
- **健康检查** — 重启前检查系统健康状态
- **日志记录** — 详细记录崩溃原因

#### 性能监控
```javascript
{
  memory: {
    heapUsed: 60MB,      // 堆内存使用
    heapTotal: 120MB,    // 堆内存总量
    external: 5MB        // 外部内存
  },
  cpu: 0.8%,             // CPU使用率
  uptime: 86400,         // 运行时长(秒)
  healthScore: 95        // 健康评分(0-100)
}
```

#### 日志轮转
- **自动清理** — 30天以上日志自动删除
- **大小限制** — 单个日志文件上限50MB
- **格式化输出** — 时间戳 + 级别 + 消息
- **日志分级** — INFO / WARN / ERROR

#### 缓存清理
- **语音缓存** — 6小时自动清理 .mp3/.wav 文件
- **截图缓存** — 发送后立即删除
- **临时文件** — 定期清理系统临时目录

#### Gateway守护
- **自动检测** — 每30秒检测Gateway状态
- **自动重启** — Gateway崩溃时自动重启
- **状态通知** — 状态变化时桌面通知

---

## 🏗️ 系统架构

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
│  │ - Message Bridge (Feishu ↔ Desktop)                        │
│  │ - TTS Pipeline (MiniMax → CosyVoice → Edge TTS)            │
│  │ - Resilience Layer (global error hooks, auto-restart)        │
│  │ - Observability (health score, perf monitor, log rotation)   │
│  │ - KKClaw Auto-Sync (DB watcher → OpenClaw config sync)      │
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

## 🔧 配置

### 🔑 API密钥配置 (pet-config.json)

> ⚠️ **安全提示**: 绝对不要将真实API密钥提交到Git！使用 `pet-config.example.json` 作为模板。

#### MiniMax Speech 配置

```json
{
  "ttsEngine": "minimax",
  "voiceEnabled": true,
  "minimax": {
    "apiKey": "YOUR_MINIMAX_API_KEY",
    "groupId": "YOUR_GROUP_ID",
    "model": "speech-2.5-turbo-preview",
    "voiceId": "xiaotuantuan_minimax",
    "speed": 1.1,
    "vol": 3.0,
    "emotion": "calm"
  }
}
```

#### DashScope (CosyVoice) 配置

```json
{
  "ttsEngine": "dashscope",
  "voiceEnabled": true,
  "dashscope": {
    "apiKey": "YOUR_DASHSCOPE_API_KEY",
    "model": "cosyvoice-v3-plus",
    "voice": "cosyvoice-v3-plus-tuantuan-...",
    "speechRate": 1.1
  }
}
```

### ⚙️ OpenClaw配置 (可选)

如果你想使用AI对话功能，需要配置OpenClaw:

```bash
# 启动OpenClaw配置向导
openclaw config

# 或者手动编辑配置文件
# Windows: C:\Users\<你���用户名>\.openclaw\openclaw.json
```

配置示例:
```json
{
  "providers": {
    "claude": {
      "type": "anthropic",
      "apiKey": "YOUR_ANTHROPIC_API_KEY"
    }
  },
  "defaultModel": "claude-sonnet-4"
}
```

### 🔁 KKClaw Switch 热切换

桌面龙虾内置 **KKClaw Switch 自动同步** 功能，可以在切换模型后自动同步到OpenClaw。

#### 自动同步（推荐）

桌面龙虾启动时会自动启动同步监听器:
- 每2秒检测 `~/.cc-switch/cc-switch.db`
- 发现provider变化时自动同步到OpenClaw
- 自动重启Gateway使配置生效

#### 手动同步

```bash
# 同步当前激活provider到OpenClaw
node C:\Users\zhouk\openclaw-data\kkclaw-hotswitch.js

# 同步并自动重启Gateway（推荐）
node C:\Users\zhouk\openclaw-data\kkclaw-hotswitch.js --restart
```

#### 常见问题

**Q: 切换了provider但不生效？**

A: 可能是配置文件有重复key，运行修复脚本:
```bash
node C:\Users\zhouk\openclaw-data\fix-openclaw-config.js
```

**Q: PowerShell报错 "&& is not a valid statement separator"？**

A: PowerShell不支持 `&&`，请用 `;` 分隔命令:
```powershell
node kkclaw-hotswitch.js ; openclaw gateway restart
```

详细说明见: `SYNC-GUIDE.md`

---

## 📊 性能指标

| 指标 | 数值 | 说明 |
|------|------|------|
| **内存占用** | ~60MB | 含监控数据 |
| **CPU占用** | <1% | 正常运行 |
| **启动时间** | ~3秒 | 含语音初始化 |
| **球体帧率** | 60fps | requestAnimationFrame |
| **语音延迟** | ~3秒 | MiniMax TTS生成 |
| **语音成本** | 2元/万字 | speech-2.5-turbo |
| **崩溃恢复** | <5秒 | 自动重启 |
| **日志轮转** | 30天 | 自动清理 |

---

## 🛠️ 技术栈

<div align="center">

| 技术 | 版本 | 用途 |
|------|------|------|
| **Electron** | 28.x | 桌面应用框架 |
| **Node.js** | 18.x+ | 后端运行时 |
| **OpenClaw** | latest | AI 对话引擎 |
| **MiniMax Speech** | 2.5 Turbo | 语音克隆+情感TTS |
| **CosyVoice** | v3-plus | 备用TTS引擎 |
| **HTML/CSS/JS** | - | 前端界面 (纯代码动画) |
| **Better-SQLite3** | - | KKClaw Switch DB监听 |

</div>

---

## 🐛 故障排查

### 常见问题

#### 1. 窗口不透明/黑色背景

**原因**: Windows硬件加速问题

**解决**:
```javascript
// main.js 已自动添加
app.disableHardwareAcceleration();
```

#### 2. 语音播报失败

**检查步骤**:
1. 确认 `pet-config.json` 中的API密钥正确
2. 检查网络连接
3. 查看控制台日志 (F12)
4. 尝试切换TTS引擎

```json
// 切换到Edge TTS (无需API密钥)
{
  "ttsEngine": "edge"
}
```

#### 3. AI对话不响应

**检查步骤**:
1. 确认OpenClaw Gateway正在运行
   ```bash
   openclaw status
   ```
2. 重启Gateway
   ```bash
   openclaw gateway restart
   ```
3. 检查OpenClaw配置
   ```bash
   openclaw config
   ```

#### 4. 眼睛表情不动

**原因**: 可能是CSS动画被禁用

**解决**: 检查系统设置 → 辅助功能 → 显示动画

#### 5. 歌词窗口不显示

**检查**: 
- 歌词窗口可能在屏幕外，拖动精灵窗口试试
- 检查 `lyrics.html` 是否存在

### 日志位置

```
桌面龙虾日志: logs/app.log
OpenClaw日志: ~/.openclaw/logs/
```

### 报告Bug

如果遇到问题:
1. 查看日志文件
2. 截图错误信息
3. 在 GitHub Issues 提交报告
4. 附上操作系统版本、Node.js版本

---

## 📖 文档

- **快速开始**: 本README
- **同步指南**: [SYNC-GUIDE.md](SYNC-GUIDE.md)
- **更新日志**: [CHANGELOG.md](CHANGELOG.md)
- **在线演示**: [GitHub Pages](https://kk43994.github.io/claw-desktop-pet/)
- **OpenClaw文档**: [https://docs.openclaw.ai](https://docs.openclaw.ai)

---

## 🤝 贡献指南

欢迎贡献代码！

### 开发流程

1. **Fork 项目**
2. **创建特性分支**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **提交更改**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. **推送到分支**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **提交 Pull Request**

### 代码规范

- UI变更请附上截图/GIF
- 保持代码简洁易读
- 添加必要的注释
- 更新相关文档

### 发布检查清单

- [ ] 更新 `package.json` 版本号
- [ ] 更新 `README.md` badge版本
- [ ] 更新 `CHANGELOG.md`
- [ ] 测试所有核心功能
- [ ] 创建Git标签
  ```bash
  git tag v2.0.3
  git push --tags
  ```

---

## 📝 更新日志

### v2.0.3 (2026-02-10) 🎨 丝滑颜色过渡 + KKClaw自动同步

**新增:**
- ✨ **2秒平滑颜色过渡** — 主层2.0s / 中层1.8s / 外层2.2s
- ✨ **优化贝塞尔曲线** — cubic-bezier(0.33, 0.0, 0.2, 1) 更自然
- ✨ **交互动画增强** — 点击时球体变亮(1.15) + 眼睛放大
- ✨ **Hover交互** — 鼠标悬停时眼睛微睁(1.08) + 球体微亮
- ✨ **KKClaw自动同步** — 启动时开启DB监听器，自动同步provider变更

**优化:**
- 🎨 琉璃质感强化 — 3层渐变 + 双高光系统
- 🎨 眼睛表情配合情绪 — 三击超开心时眼睛也放大

### v2.0.2 (2026-02-10) 📚 文档强化

**新增:**
- 📖 完整功能介绍
- ��� 详细配置说明
- 📖 故障排查指南
- 📖 贡献指南

### v2.0.1 (2026-02-10) 🔁 KKClaw Switch热切换修复

**修复:**
- 🔧 修复provider热切换不生效问题
- 🔧 修复openclaw.json重复key导致解析失败
- 🔧 新增配置修复脚本
- 🔧 新增热切换脚本

### v2.0.0 (2026-02-08) 🎨 空气感UI重构

**全新UI:**
- 🫧 双窗口架构 (精灵+歌词)
- 👀 流体玻璃球 67px + 胶囊眼睛
- 🎵 桌面歌词效果
- 🎨 SVG线条图标工具栏
- ⚫ 离线/上线动画

**语音升级:**
- 🎤 MiniMax Speech 2.5 Turbo
- 🎭 7种情感自动控制
- 📉 三级降级保障

完整更新日志见: [CHANGELOG.md](CHANGELOG.md)

---

## 🧑‍🤝‍🧑 加入社群

扫码加入 **AI Coding 交流群**，与开发者直接沟通:

<img src="docs/images/ai-coding-qr.jpg" alt="AI coding group QR" width="260" />

*(二维码 7 天有效，过期请提Issue获取新二维码)*

---

## ☕ 赞赏支持

如果这个项目帮到了你，欢迎请作者喝杯咖啡 ☕

支持持续维护与功能迭代 🚀

<img src="docs/images/support-qr.jpg" alt="Support QR" width="260" />

---

## 🔐 安全 & 隐私

- ✅ **绝不提交API密钥** — `pet-config.json` 已加入 `.gitignore`
- ✅ **使用示例配置** — `pet-config.example.json` 用于文档和新手引导
- ✅ **密钥泄露应对** — 如不慎泄露，立即轮换密钥
- ✅ **本地运行** — 所有数据在本地处理，不上传到第三方

---

## 📄 许可证

MIT License

Copyright (c) 2026 zhouk (kk43994)

---

## 👨‍💻 作者

- **zhouk (kk43994)** - 主要开发者
- **小K (AI)** - 灵魂设计师 & 功能规划 🦞

---

<div align="center">

**⭐ 如果喜欢，请给个 Star！⭐**

**🦞 空气感桌面龙虾 — 你的AI伙伴**

Made with ❤️ and 🦞

[⬆ 回到顶部](#-claw-desktop-pet)

</div>
