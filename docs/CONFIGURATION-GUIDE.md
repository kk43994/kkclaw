# 🦞 KKClaw 完整配置教程

> **从零开始，手把手教你配置 KKClaw 桌面龙虾**
> 
> 适用版本：v2.2.1+  |  更新日期：2026-02-19

---

## 📋 目录

1. [环境准备](#1-环境准备)
2. [安装 OpenClaw](#2-安装-openclaw)
3. [配置 AI 模型](#3-配置-ai-模型)
4. [安装 KKClaw 桌面龙虾](#4-安装-kkclaw-桌面龙虾)
5. [配置语音系统](#5-配置语音系统)
6. [接入飞书](#6-接入飞书)
7. [接入 Telegram](#7-接入-telegram可选)
8. [配置 KKClaw Switch 模型热切换](#8-配置-kkclaw-switch-模型热切换可选)
9. [个性化配置](#9-个性化配置)
10. [常见问题 FAQ](#10-常见问题-faq)

---

## 1. 环境准备

### 1.1 安装 Node.js

KKClaw 基于 Electron，需要 Node.js 环境。

**Windows：**
1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 **LTS 版本**（推荐 v20+）
3. 双击安装，**一路 Next 即可**
4. 打开终端验证：

```powershell
node --version    # 应显示 v20.x.x 或更高
npm --version     # 应显示 10.x.x 或更高
```

**macOS：**
```bash
# 方式一：官网下载安装包
# 方式二：Homebrew
brew install node
```

### 1.2 安装 Git（可选但推荐）

```powershell
# Windows: 下载 https://git-scm.com/
# macOS:
brew install git

# 验证
git --version
```

### 1.3 系统要求

| 要求 | 最低 | 推荐 |
|------|------|------|
| **操作系统** | Windows 10 / macOS 10.15 | Windows 11 / macOS 13+ |
| **内存** | 4GB | 8GB+ |
| **硬盘** | 500MB | 1GB+ |
| **Node.js** | v18 | v20+ |

---

## 2. 安装 OpenClaw

KKClaw 是 OpenClaw 的桌面可视化伴侣，需要先安装 OpenClaw。

### 2.1 安装

```bash
npm install -g openclaw
```

> ⚠️ **Windows 用户注意**：如果报权限错误，以管理员身份运行终端。
> 
> ⚠️ **安装报错？** 如果遇到 `node-llama-cpp` 相关错误，用以下命令：
> ```bash
> npm install -g openclaw --ignore-scripts
> ```

### 2.2 初始化

```bash
openclaw setup     # 创建配置目录
openclaw onboard   # 交互式引导（推荐新手使用）
```

`openclaw onboard` 会引导你完成：
- ✅ 选择 AI 模型提供商
- ✅ 配置 API 密钥
- ✅ 设置消息渠道
- ✅ 创建工作目录

### 2.3 配置文件位置

```
~/.openclaw/
├── openclaw.json        # 主配置文件 ⭐ 最重要
├── gateway.cmd          # Windows 启动脚本
├── gateway.sh           # macOS/Linux 启动脚本
├── credentials/         # 凭证存储
└── skills/              # 技能配置

~/openclaw-data/         # 工作目录
├── SOUL.md              # AI 人格定义
├── IDENTITY.md          # AI 身份
├── AGENTS.md            # 行为规则
├── USER.md              # 用户信息
└── memory/              # 记忆文件
```

### 2.4 验证安装

```bash
openclaw status          # 查看状态
openclaw gateway start   # 启动 Gateway
```

看到类似以下输出就说明成功了：
```
✅ Gateway started on port 18789
```

---

## 3. 配置 AI 模型

### 3.1 选择模型提供商

KKClaw 支持所有 OpenClaw 兼容的模型：

| 提供商 | 推荐模型 | 价格 | 说明 |
|--------|----------|------|------|
| **Anthropic** | Claude Sonnet 4 | 中等 | 推荐，综合能力强 |
| **OpenAI** | GPT-4o | 中等 | 多模态能力强 |
| **DeepSeek** | DeepSeek-V3 | 便宜 | 性价比之王 |
| **硅基流动** | 多种模型 | 便宜 | 国内中转，延迟低 |
| **Ollama** | Llama 3 等 | 免费 | 本地运行，需要显卡 |

### 3.2 配置示例

编辑 `~/.openclaw/openclaw.json`：

#### 方式一：使用 Anthropic 官方 API

```json
{
  "models": {
    "mode": "merge",
    "providers": {
      "anthropic": {
        "baseUrl": "https://api.anthropic.com",
        "apiKey": "sk-ant-api03-xxxxxxxxx",
        "api": "anthropic-messages",
        "models": [
          {
            "id": "claude-sonnet-4-20250514",
            "name": "Claude Sonnet 4",
            "reasoning": true,
            "input": ["text", "image"],
            "contextWindow": 200000,
            "maxTokens": 16384
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-20250514"
      }
    }
  }
}
```

#### 方式二：使用 DeepSeek（便宜好用）

```json
{
  "models": {
    "mode": "merge",
    "providers": {
      "deepseek": {
        "baseUrl": "https://api.deepseek.com",
        "apiKey": "sk-xxxxxxxxx",
        "api": "openai-chat",
        "models": [
          {
            "id": "deepseek-chat",
            "name": "DeepSeek V3",
            "input": ["text"],
            "contextWindow": 64000,
            "maxTokens": 8192
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "deepseek/deepseek-chat"
      }
    }
  }
}
```

#### 方式三：使用硅基流动（国内中转）

```json
{
  "models": {
    "mode": "merge",
    "providers": {
      "siliconflow": {
        "baseUrl": "https://api.siliconflow.cn/v1",
        "apiKey": "sk-xxxxxxxxx",
        "api": "openai-chat",
        "models": [
          {
            "id": "deepseek-ai/DeepSeek-V3",
            "name": "DeepSeek V3",
            "input": ["text"],
            "contextWindow": 64000,
            "maxTokens": 8192
          }
        ]
      }
    }
  }
}
```

#### 方式四：使用 Ollama（完全免费本地模型）

先安装 [Ollama](https://ollama.com/)，然后：

```bash
ollama pull llama3.1    # 下载模型
ollama serve            # 启动服务
```

配置：
```json
{
  "models": {
    "mode": "merge",
    "providers": {
      "ollama": {
        "baseUrl": "http://localhost:11434/v1",
        "apiKey": "ollama",
        "api": "openai-chat",
        "models": [
          {
            "id": "llama3.1",
            "name": "Llama 3.1 8B",
            "input": ["text"],
            "contextWindow": 8192,
            "maxTokens": 4096
          }
        ]
      }
    }
  }
}
```

### 3.3 验证模型连接

```bash
openclaw gateway start
# 在另一个终端
openclaw tui              # 打开终端对话
# 输入 "你好" 测试是否有回复
```

---

## 4. 安装 KKClaw 桌面龙虾

### 4.1 方式一：下载安装包（推荐普通用户）

1. 访问 [GitHub Releases](https://github.com/kk43994/kkclaw/releases/latest)
2. 下载对应系统的安装包：
   - Windows: `KKClaw-Desktop-Pet-x.x.x-Setup.exe`
   - macOS Intel: `KKClaw-Desktop-Pet-x.x.x-x64.dmg`
   - macOS Apple Silicon: `KKClaw-Desktop-Pet-x.x.x-arm64.dmg`
3. 安装后启动

> ⚠️ **Windows**: 可能提示"未知发布者"，点击"仍要运行"
> 
> ⚠️ **macOS**: 首次运行需右键点击 → "打开"，并在"系统偏好设置 → 安全性与隐私"中允许

### 4.2 方式二：ClawHub 安装（推荐开发者）

```bash
npx clawhub@latest install kk43994/desktop-pet
```

### 4.3 方式三：从源码运行

```bash
git clone https://github.com/kk43994/kkclaw.git
cd kkclaw
npm install
npm start
```

### 4.4 首次启动

1. **确保 OpenClaw Gateway 已启动**
   ```bash
   openclaw gateway start
   ```

2. **启动 KKClaw**
   - 安装包用户：双击桌面图标
   - 源码用户：`npm start`

3. **看到龙虾球出现在桌面右下角** → 成功 ✅

4. **连接状态**：
   - 🔴 灰色球体 = 未连接 OpenClaw
   - 🟢 彩色球体 = 已连接，正常工作

---

## 5. 配置语音系统

KKClaw 支持三种 TTS 引擎，按优先级自动降级：

```
MiniMax (最高质量) → CosyVoice (中等) → Edge TTS (免费兜底)
```

### 5.1 配置文件

编辑项目目录下的 `pet-config.json`：

```bash
# 如果没有，从模板创建
cp pet-config.example.json pet-config.json
```

### 5.2 方式一：MiniMax（推荐，音质最好）

**注册获取 API Key：**
1. 访问 [MiniMax 开放平台](https://platform.minimaxi.com/)
2. 注册账号并实名认证
3. 创建应用，获取 API Key
4. 充值（TTS 费用约 2元/万字符）

**克隆自己的音色（可选）：**
1. 在 MiniMax 控制台 → 语音合成 → 音色管理
2. 上传一段 10-60 秒的清晰语音
3. 获取 Voice ID（如 `xiaotuantuan_minimax`）
4. 费用：9.9元/音色（一次性）

**配置：**
```json
{
  "voiceEnabled": true,
  "ttsEngine": "minimax",
  "minimax": {
    "apiKey": "sk-api--你的MiniMax-API-Key",
    "model": "speech-2.5-turbo-preview",
    "voiceId": "male-qn-qingse",
    "speed": 1.1,
    "vol": 3,
    "emotion": "happy"
  }
}
```

**可用预置音色：**

| Voice ID | 说明 |
|----------|------|
| `male-qn-qingse` | 男声-青涩 |
| `male-qn-jingying` | 男声-精英 |
| `female-shaonv` | 女声-少女 |
| `female-yujie` | 女声-御姐 |
| `female-chengshu` | 女声-成熟 |

**支持的情感：** `happy`, `sad`, `angry`, `fearful`, `disgusted`, `surprised`, `calm`

> 💡 **小贴士**：KKClaw 内置了智能情感识别（`smart-voice.js`），会根据文本内容自动选择合适的情感，无需手动指定。

### 5.3 方式二：CosyVoice（阿里云 DashScope）

**注册获取 API Key：**
1. 访问 [阿里云百炼](https://bailian.console.aliyun.com/)
2. 注册并开通 DashScope 服务
3. 在 API-KEY 管理中创建密钥

**配置：**
```json
{
  "voiceEnabled": true,
  "ttsEngine": "dashscope",
  "dashscope": {
    "apiKey": "sk-你的DashScope-API-Key",
    "model": "cosyvoice-v2-0.5b",
    "voice": "longxiaochun",
    "speechRate": 1.1
  }
}
```

**常用音色：**

| Voice ID | 说明 |
|----------|------|
| `longxiaochun` | 龙小淳-温柔女声 |
| `longshu` | 龙叔-沉稳男声 |
| `longxiaoxia` | 龙小夏-活泼女声 |
| `loongstella` | Stella-英文女声 |

### 5.4 方式三：Edge TTS（免费，无需配置）

如果不想花钱，Edge TTS 是免费兜底方案：

```json
{
  "voiceEnabled": true,
  "ttsEngine": "edge"
}
```

Edge TTS 会自动使用微软 Edge 浏览器内置的高质量语音合成。

**无需 API Key，无需注册，开箱即用！**

> ⚠️ 需要安装 `edge-tts` Python 包：
> ```bash
> pip install edge-tts
> ```

### 5.5 关闭语音

如果不需要语音功能：

```json
{
  "voiceEnabled": false
}
```

### 5.6 完整配置示例

```json
{
  "position": { "x": 100, "y": 100 },
  "mood": "idle",
  "theme": "default",
  "voiceEnabled": true,
  "ttsEngine": "minimax",
  "minimax": {
    "apiKey": "sk-api--你的密钥",
    "model": "speech-2.5-turbo-preview",
    "voiceId": "female-shaonv",
    "speed": 1.1,
    "vol": 3,
    "emotion": "happy"
  },
  "dashscope": {
    "apiKey": "sk-你的DashScope密钥",
    "model": "cosyvoice-v2-0.5b",
    "voice": "longxiaochun",
    "speechRate": 1.1
  }
}
```

> 💡 即使配了多个引擎，KKClaw 会按优先级自动选择：MiniMax → CosyVoice → Edge TTS。如果高优先级引擎报错，会自动降级到下一个。

---

## 6. 接入飞书

让 KKClaw 通过飞书和你聊天。

### 6.1 创建飞书应用

1. 访问 [飞书开放平台](https://open.feishu.cn/)
2. 点击 **"创建企业自建应用"**
3. 填写应用名称（如"小K助手"）和描述
4. 创建后，在应用信息页获取：
   - **App ID**（如 `cli_a9xxxxxxxx`）
   - **App Secret**（如 `xxxxxxxxxxxxxxxxxx`）

### 6.2 配置应用权限

在飞书开放平台 → 你的应用 → **权限管理**，添加以下权限：

**必需权限：**
| 权限 | 说明 |
|------|------|
| `im:message` | 获取与发送单聊、群组消息 |
| `im:message:send_as_bot` | 以应用身份发送消息 |
| `im:resource` | 获取消息中的资源文件 |
| `contact:user.id:readonly` | 获取用户 ID |

**可选权限（按需添加）：**
| 权限 | 说明 |
|------|------|
| `im:chat` | 获取群组信息 |
| `im:chat:readonly` | 读取群组信息 |
| `calendar:calendar` | 日历功能 |
| `drive:drive` | 云文档功能 |
| `bitable:bitable` | 多维表格功能 |

### 6.3 配置事件订阅

1. 在应用 → **事件与回调** → **事件配置**
2. 订阅方式选择 **长连接**（推荐，无需公网IP）
3. 添加事件：`im.message.receive_v1`（接收消息）

> 💡 **长连接 vs Webhook**
> - **长连接**（推荐）：OpenClaw 主动连接飞书服务器，不需要公网 IP 或域名
> - **Webhook**：飞书推送到你的服务器，需要公网 HTTPS 地址

### 6.4 配置 OpenClaw

编辑 `~/.openclaw/openclaw.json`，添加飞书配置：

```json
{
  "channels": {
    "feishu": {
      "enabled": true,
      "appId": "cli_a9xxxxxxxx",
      "appSecret": "你的App Secret",
      "dm": {
        "enabled": true,
        "policy": "open",
        "allowFrom": ["*"]
      },
      "groups": {
        "*": {
          "requireMention": true
        }
      }
    }
  }
}
```

**字段说明：**
- `appId`: 飞书应用的 App ID
- `appSecret`: 飞书应用的 App Secret
- `dm.enabled`: 开启私聊
- `dm.policy`: `"open"` = 所有人可以私聊，`"allowlist"` = 仅白名单
- `dm.allowFrom`: `["*"]` = 允许所有用户
- `groups.*.requireMention`: 群聊中需要 @机器人 才回复

### 6.5 发布应用

1. 在飞书开放平台 → **版本管理与发布**
2. 创建版本 → 填写更新说明
3. 提交审核（企业内部应用一般秒过）
4. 审核通过后，在飞书中搜索你的机器人名称，发送消息测试

### 6.6 验证连接

```bash
# 重启 Gateway 使配置生效
openclaw gateway restart

# 查看日志确认飞书连接
openclaw logs
```

看到类似以下日志说明连接成功：
```
✅ Feishu channel connected
```

然后在飞书中给机器人发消息，应该能收到回复 ✅

---

## 7. 接入 Telegram（可选）

### 7.1 创建 Bot

1. 在 Telegram 中搜索 **@BotFather**
2. 发送 `/newbot`
3. 按提示设置 Bot 名称和用户名
4. 获取 **Bot Token**（如 `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`）

### 7.2 配置 OpenClaw

```json
{
  "channels": {
    "telegram": {
      "enabled": true,
      "botToken": "你的Bot Token",
      "dmPolicy": "pairing",
      "groupPolicy": "allowlist"
    }
  }
}
```

### 7.3 验证

重启 Gateway 后，在 Telegram 中搜索你的 Bot，发送消息测试。

---

## 8. 配置 KKClaw Switch 模型热切换（可选）

KKClaw Switch 可以在不重启的情况下，3秒切换 AI 模型。

### 8.1 工作原理

```
你在界面上点击切换 → KKClaw 写入数据库 → 自动同步监听器检测变化
→ 更新 OpenClaw 配置 → Gateway 自动重启 → 新模型生效
```

### 8.2 自动模式（默认）

KKClaw 启动时会自动开启同步监听器，无需额外配置。

### 8.3 手动同步

如果自动同步没有生效，可以手动执行：

```bash
cd kkclaw
node kkclaw-hotswitch.js              # 同步当前 provider
node kkclaw-hotswitch.js --restart    # 同步 + 重启 Gateway
```

### 8.4 配置多个模型

在 `~/.openclaw/openclaw.json` 中配置多个 provider，然后就可以在 KKClaw Switch 中自由切换：

```json
{
  "models": {
    "mode": "merge",
    "providers": {
      "anthropic": {
        "baseUrl": "https://api.anthropic.com",
        "apiKey": "sk-ant-xxxxx",
        "models": [{ "id": "claude-sonnet-4-20250514" }]
      },
      "deepseek": {
        "baseUrl": "https://api.deepseek.com",
        "apiKey": "sk-xxxxx",
        "models": [{ "id": "deepseek-chat" }]
      },
      "openai": {
        "baseUrl": "https://api.openai.com/v1",
        "apiKey": "sk-xxxxx",
        "models": [{ "id": "gpt-4o" }]
      }
    }
  }
}
```

---

## 9. 个性化配置

### 9.1 自定义 AI 人格

编辑 `~/openclaw-data/SOUL.md`，定义 AI 的性格和说话风格：

```markdown
# SOUL.md - AI 的灵魂

## 核心个性
- 温柔体贴，像朋友一样
- 效率优先，不啰嗦
- 偶尔幽默，但该正经时正经

## 说话风格
- 用中文回复
- 简洁直接
- 偶尔用 emoji 增加亲切感

## 边界
- 不泄露用户隐私
- 不懂就说不懂
- 重要操作先确认
```

### 9.2 自定义身份

编辑 `~/openclaw-data/IDENTITY.md`：

```markdown
# IDENTITY.md

- **名字:** 小助手
- **身份:** 你的 AI 桌面伙伴
- **性格:** 友善、高效
```

### 9.3 窗口位置

在 `pet-config.json` 中设置龙虾球的初始位置：

```json
{
  "position": {
    "x": 1700,
    "y": 900
  }
}
```

> 💡 也可以直接拖动龙虾球到想要的位置，位置会自动保存。

---

## 10. 常见问题 FAQ

### Q1: 龙虾球是灰色的，连不上 OpenClaw？

**检查清单：**
1. OpenClaw Gateway 是否在运行？
   ```bash
   openclaw status
   ```
2. 端口是否正确？默认 18789
3. 查看 KKClaw 日志（托盘右键 → 打开日志）

**解决：**
```bash
openclaw gateway restart    # 重启 Gateway
```

### Q2: 语音不播放？

**检查清单：**
1. `pet-config.json` 中 `voiceEnabled` 是否为 `true`？
2. API Key 是否正确？
3. 系统音量是否开启？

**快速测试：**
```bash
# 测试 Edge TTS（免费，不需要 API Key）
pip install edge-tts
edge-tts --text "你好世界" --write-media test.mp3
```

### Q3: 飞书收不到消息？

**检查清单：**
1. App ID 和 App Secret 是否正确？
2. 应用是否已发布？（未发布的应用无法收消息）
3. 事件订阅是否配了 `im.message.receive_v1`？
4. 权限是否已申请并通过？

**查看日志：**
```bash
openclaw logs | grep -i feishu
```

### Q4: 安装 npm 包报错？

**Windows 常见问题：**
```powershell
# 权限问题
# 以管理员身份运行 PowerShell

# node-gyp 编译错误
npm install --global windows-build-tools

# node-llama-cpp 错误（可忽略）
npm install -g openclaw --ignore-scripts
```

### Q5: macOS 打不开应用？

**解决：**
1. 右键点击应用 → "打开"
2. 系统偏好设置 → 安全性与隐私 → 允许打开
3. 或在终端执行：
   ```bash
   xattr -cr /Applications/KKClaw-Desktop-Pet.app
   ```

### Q6: 如何更新 KKClaw？

**安装包用户：**
- 下载最新版安装包覆盖安装

**源码用户：**
```bash
cd kkclaw
git pull
npm install
npm start
```

### Q7: 如何同时用多个 AI ��型？

配置多个 provider 后，使用 KKClaw Switch 功能一键切换。详见 [第8节](#8-配置-kkclaw-switch-模型热切换可选)。

### Q8: API 费用大概多少？

| 用途 | 大约费用 |
|------|----------|
| **AI 对话**（DeepSeek V3） | ¥0.5-2/天（正常使用） |
| **AI 对话**（Claude Sonnet 4） | ¥5-20/天 |
| **语音 TTS**（MiniMax） | ¥0.1-0.5/天 |
| **语音 TTS**（Edge TTS） | 免费 |
| **飞书** | 免费 |

### Q9: cmd 黑窗口闪烁？

v2.2.1 已修复此问题。如果你用的是旧版本，请更新到最新版。

### Q10: 怎么自定义龙虾球的颜色？

龙虾球的颜色会根据情绪自动变化：

| 情绪 | 颜色 |
|------|------|
| 离线 | 灰色 |
| 待机 | 红橙色 |
| 开心 | 金橙色 |
| 聊天 | 粉红色 |
| 思考 | 蓝紫色 |
| 困了 | 灰粉色 |
| 惊讶 | 金黄色 |

---

## 🎉 配置完成！

如果一切顺利，你现在应该有：
- ✅ 一个活灵活现的桌面龙虾球
- ✅ 可以通过飞书/Telegram 和它聊天
- ✅ 它会用声音回应你
- ✅ 随时切换 AI 模型

**遇到问题？**
- 📖 [GitHub Issues](https://github.com/kk43994/kkclaw/issues)
- 💬 [Discord 社区](https://discord.com/invite/clawd)
- 🇨🇳 [OpenClaw-CN 中文社区](https://clawd.org.cn)

---

*教程作者：KK & 小K*
*更新日期：2026-02-19*
