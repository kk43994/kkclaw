# 🦞 Claw Desktop Pet

一个可爱的桌面龙虾助手,集成了 OpenClaw AI、Edge TTS 语音、表情动画系统。

![Version](https://img.shields.io/badge/version-1.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ⚡ 快速开始

**最简单的方式 (不需要AI功能):**

```bash
# 1. 克隆项目
git clone https://github.com/kk43994/claw-desktop-pet.git
cd claw-desktop-pet

# 2. 安装依赖
npm install
pip install edge-tts

# 3. 启动
npm start
```

**完整功能 (包含AI对话):**

```bash
# 1-2. 同上

# 3. 安装 OpenClaw
npm install -g openclaw

# 4. 启动 Gateway
openclaw gateway start

# 5. 启动龙虾
npm start
```

第一次启动后:
- 🦞 龙虾出现在右下角
- 拖动到喜欢的位置
- 点击打开菜单
- 享受你的桌面助手!

---

## ✨ 功能特性

### 🎨 核心功能
- **桌面宠物** - 可爱的龙虾🦞在桌面陪伴你
- **AI 对话** - 集成 OpenClaw,实时智能对话
- **语音播报** - Edge TTS 自然中文语音(晓晓)
- **双向同步** - 飞书消息 ↔️ 桌面通知

### 🎭 表情系统
- 🦞 正常状态 - 平静待机
- 🤔 思考中 - 处理问题时
- 💼 忙碌中 - 收到消息时
- 🎉 兴奋 - 开心时刻
- 😴 困了 - 可扩展

### 🎬 动画效果
- **呼吸动画** - 默认状态,上下浮动
- **思考动画** - 左右摇头
- **说话动画** - 上下跳动
- **工作动画** - 左右摇摆
- **开心动画** - 旋转庆祝
- **闲置动画** - 10秒无操作自动触发随机动作

### 💾 智能特性
- **位置记忆** - 自动保存窗口位置
- **状态指示** - 实时连接状态显示
- **工作日志** - 自动记录操作历史

## 📦 安装与配置

### 前置要求
- **Node.js** 16+ ([下载](https://nodejs.org/))
- **Python** 3.8+ ([下载](https://www.python.org/downloads/))
- **Windows** 10/11
- **OpenClaw Gateway** (可选,用于AI对话)

### 详细步骤

#### 1. 克隆仓库
```bash
git clone https://github.com/kk43994/claw-desktop-pet.git
cd claw-desktop-pet
```

#### 2. 安装 Node.js 依赖
```bash
npm install
```

如果安装失败,尝试:
```bash
npm install --legacy-peer-deps
```

#### 3. 安装 Python 依赖 (语音系统)
```bash
# 方式1: 使用 pip
pip install edge-tts

# 方式2: 如果 pip 不在 PATH 里
python -m pip install edge-tts

# 验证安装
edge-tts --version
```

**常见问题:**
- 如果提示 `edge-tts: command not found`
  - Windows: 添加 Python Scripts 目录到 PATH
    通常在 `C:\Users\你的用户名\AppData\Roaming\Python\Python3X\Scripts`
  - 或者使用完整路径运行

#### 4. 配置 OpenClaw (可选)

**如果你想使用AI对话功能:**

a. 安装 OpenClaw Gateway:
```bash
npm install -g openclaw
```

b. 启动 Gateway:
```bash
openclaw gateway start
```

c. 配置 API (如果需要):
编辑 `openclaw-client.js`:
```javascript
this.baseUrl = 'http://localhost:3000'; // 你的 Gateway 地址
```

**如果不使用AI对话:**
- 龙虾仍然可以正常运行
- 只是"发送"功能会不可用
- 其他功能(语音、动画、闲置)都正常

#### 5. 自定义配置 (可选)

**更换语音:**
编辑 `working-voice.js`:
```javascript
this.voice = 'zh-CN-XiaoxiaoNeural'; // 默认: 晓晓(活泼女声)

// 其他选项:
// 'zh-CN-YunxiNeural'    - 云希(温暖男声)
// 'zh-CN-XiaoyiNeural'   - 晓伊(温柔女声)
// 'zh-CN-YunjianNeural'  - 云健(新闻播报)
```

**调整窗口位置:**
首次启动后会自动保存位置到 `pet-config.json`
手动编辑:
```json
{
  "position": { "x": 1580, "y": 418 },
  "mood": "happy",
  "voiceEnabled": true
}
```

#### 6. 运行
```bash
npm start
```

**首次运行:**
- 窗口会出现在屏幕右下角
- 拖动到你喜欢的位置,下次会记住
- 点击龙虾打开菜单
- 点击 🔊 切换语音播报

### 🔍 验证安装

**测试语音系统:**
```bash
edge-tts --voice "zh-CN-XiaoxiaoNeural" --text "你好,我是龙虾助手" --write-media test.mp3
```
如果生成了 `test.mp3` 文件,说明语音系统正常!

**测试 OpenClaw 连接:**
访问 http://localhost:3000 
如果看到 OpenClaw Gateway 界面,说明连接正常!

### ⚙️ 环境变量配置 (Windows)

**添加 Python Scripts 到 PATH:**

1. 右键 "此电脑" → 属性
2. 高级系统设置 → 环境变量
3. 系统变量 → Path → 编辑
4. 新建 → 添加:
   ```
   C:\Users\你的用户名\AppData\Roaming\Python\Python313\Scripts
   ```
5. 确定 → 重启命令行

## 🎮 使用方法

### 基本操作
- **拖动** - 按住龙虾拖动到任意位置
- **点击** - 打开控制菜单
- **输入** - 在输入框输入消息发送
- **语音** - 点击🔊按钮切换语音播报

### 快捷按钮
- 💬 **发送** - 发送消息给AI
- 🔊 **语音** - 开启/关闭语音播报
- ⚡ **充能** - 给龙虾加能量
- 🎯 **任务** - 触发工作动画

### 闲置模式
10秒无操作后,龙虾会:
- 随机说话 ("...", "嗯?", "*挥钳*")
- 做小动作 (跳跃、摇摆)
- 持续循环,保持活力

## 🛠️ 技术栈

- **Electron** - 桌面应用框架
- **OpenClaw** - AI 对话引擎
- **Edge TTS** - 微软语音合成
- **Node.js** - 后端运行时
- **HTML/CSS/JS** - 前端界面

## 📁 项目结构

```
claw-desktop-pet/
├── main.js                 # Electron 主进程
├── index.html              # 前端界面
├── openclaw-client.js      # OpenClaw API 客户端
├── working-voice.js        # Edge TTS 语音系统
├── message-sync.js         # 消息同步系统
├── desktop-notifier.js     # 桌面通知服务器
├── pet-config.js           # 配置管理
├── work-logger.js          # 工作日志
├── auto-notify.js          # 自动通知辅助
├── package.json            # 项目配置
├── README.md               # 说明文档
└── temp/                   # 临时文件(语音缓存)
```

## 🔧 配置选项

### pet-config.json
```json
{
  "position": { "x": 1580, "y": 418 },
  "mood": "happy",
  "theme": "default",
  "voiceEnabled": true
}
```

- `position` - 窗口位置(自动保存)
- `mood` - 当前情绪状态
- `theme` - 主题(未来扩展)
- `voiceEnabled` - 语音开关

## 🎨 自定义

### 更换声音
编辑 `working-voice.js`:
```javascript
this.voice = 'zh-CN-YunxiNeural'; // 温暖男声
// 或
this.voice = 'zh-CN-XiaoyiNeural'; // 温柔女声
```

### 更换表情
编辑 `index.html`:
```javascript
const emotions = {
    normal: '🦞',
    happy: '🎉',
    // 添加更多...
};
```

### 调整动画
CSS 动画定义在 `index.html` 的 `<style>` 部分。

## 🐛 常见问题

### 听不到声音?

**问题1: edge-tts 未安装**
```bash
# 安装
pip install edge-tts

# 验证
edge-tts --version
```

**问题2: Python Scripts 不在 PATH**
- 找到 Scripts 目录 (通常在 `AppData\Roaming\Python\...`)
- 添加到系统环境变量 PATH
- 重启命令行

**问题3: 系统音量静音**
- 检查 Windows 音量混合器
- 确认 "Node.js" 或 "Electron" 没被静音

**问题4: 播放器被占用**
- 关闭其他音乐播放器 (如酷狗)
- 重启应用

### 窗口位置不对?

**重置位置:**
1. 关闭应用
2. 删除 `pet-config.json`
3. 重新启动,会恢复默认位置

**手动调整:**
编辑 `pet-config.json`:
```json
{
  "position": { "x": 100, "y": 100 }
}
```

### OpenClaw 连接失败?

**检查 Gateway 状态:**
```bash
openclaw gateway status
```

**启动 Gateway:**
```bash
openclaw gateway start
```

**修改连接地址:**
编辑 `openclaw-client.js`:
```javascript
this.baseUrl = 'http://localhost:3000'; // 你的地址
```

### 应用启动失败?

**清理并重装:**
```bash
# 删除 node_modules
rm -rf node_modules package-lock.json

# 重新安装
npm install --legacy-peer-deps
```

**检查 Node.js 版本:**
```bash
node --version  # 应该 >= 16
```

### 龙虾没有动画?

- 检查浏览器开发者工具 (F12)
- 查看 Console 是否有错误
- 确认 `index.html` 没有被修改

### 语音播放但听不见?

**检查音频设备:**
1. 打开 Windows 设置 → 系统 → 声音
2. 确认默认输出设备正确
3. 测试设备是否工作

**测试 PowerShell 音频:**
```powershell
Add-Type -AssemblyName System.Speech
$speak = New-Object System.Speech.Synthesis.SpeechSynthesizer
$speak.Speak("测试")
```
如果能听到,说明系统音频正常。

### 如何卸载?

```bash
# 1. 删除项目文件夹
rm -rf claw-desktop-pet

# 2. (可选) 卸载 edge-tts
pip uninstall edge-tts
```

## 🚀 未来计划

- [ ] 快捷键唤起 (Ctrl+Shift+C)
- [ ] 主题切换系统
- [ ] 夜间模式
- [ ] 消息历史记录
- [ ] 定时提醒功能
- [ ] 截图功能
- [ ] 拖拽文件发送
- [ ] 多窗口支持

## 📝 更新日志

### v1.1.0 (2026-02-06)
- ✨ **进度汇报系统** - 执行任务时实时通知进度
- 🎤 **emoji 过滤** - 语音播报更清晰
- 📏 **增加语音长度** - 支持500字符(约1-2分钟)
- 📖 **完善文档** - 详细配置说明和FAQ

### v1.0.0 (2026-02-06)
- 🎉 初始发布

[查看完整更新日志](CHANGELOG.md)

## 📄 许可证

MIT License - 自由使用、修改、分发

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

## 👨‍💻 作者

- **zhouk** - 开发者
- **Claw (AI)** - 灵魂设计师 🦞

---

**⭐ 如果喜欢,请给个 Star!**

Made with ❤️ and 🦞
