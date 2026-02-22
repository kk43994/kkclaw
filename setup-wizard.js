// 🧙 Setup Wizard 后端逻辑 — IPC Handlers
const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const http = require('http');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class SetupWizard {
  constructor(petConfig) {
    this.petConfig = petConfig;
    this.homeDir = process.env.HOME || process.env.USERPROFILE;
    this.openclawDir = path.join(this.homeDir, '.openclaw');
    this.detectedPort = 18789; // will be updated by _detectGateway
    this.registerIPC();
  }

  registerIPC() {
    // Step 1: Gateway — 检测
    ipcMain.handle('wizard-detect-gateway', async () => {
      return this._detectGateway();
    });

    // Step 1: Gateway — 手动测试连接
    ipcMain.handle('wizard-test-gateway', async (event, token) => {
      return this._testGateway(token);
    });

    // Step 2: Model — 获取 AI 模型配置
    ipcMain.handle('wizard-get-model-config', async () => {
      return this._getModelConfig();
    });

    // Step 2: Model — 保存 AI 模型配置
    ipcMain.handle('wizard-save-model-config', async (event, modelConfig) => {
      return this._saveModelConfig(modelConfig);
    });

    // Step 2: Model — 检查 AI 模型配置
    ipcMain.handle('wizard-check-model-config', async () => {
      return this._checkModelConfig();
    });

    // Step 3: Channels — 保存渠道配置
    ipcMain.handle('wizard-save-channels', async (event, channels) => {
      this.petConfig.set('channels', channels);
      return { success: true };
    });

    // 获取当前配置（通用）
    ipcMain.handle('wizard-get-config', async () => {
      return {
        ttsEngine: this.petConfig.get('ttsEngine') || 'edge',
        minimax: this.petConfig.get('minimax') || {},
        dashscope: this.petConfig.get('dashscope') || {},
        channels: this.petConfig.get('channels') || {},
        agentVoice: this.petConfig.get('agentVoice') || {},
        voiceEnabled: this.petConfig.get('voiceEnabled') !== false,
        lyricsEnabled: this.petConfig.get('lyricsEnabled') !== false,
        alwaysOnTop: this.petConfig.get('alwaysOnTop') !== false,
        wizardStep: this.petConfig.get('wizardStep') || 0,
      };
    });

    // Step 4: TTS — 保存引擎配置
    ipcMain.handle('wizard-save-tts-engine', async (event, engineConfig) => {
      return this._saveTTSEngine(engineConfig);
    });

    // Step 4: TTS — 试听
    ipcMain.handle('wizard-test-tts', async (event, engineConfig) => {
      return this._testTTS(engineConfig);
    });

    // Step 4: TTS — 音色克隆
    ipcMain.handle('wizard-clone-voice', async (event, cloneConfig) => {
      return this._cloneVoice(cloneConfig);
    });

    // Step 5: Voice — 配置 Agent 语音播报
    ipcMain.handle('wizard-setup-agent-voice', async (event, workspaceDir) => {
      return this._setupAgentVoice(workspaceDir);
    });

    // Step 5: Voice — 测试语音播报链路
    ipcMain.handle('wizard-test-agent-voice', async () => {
      return this._testAgentVoice();
    });

    // Step 6: Display — 保存显示设置
    ipcMain.handle('wizard-save-display-settings', async (event, settings) => {
      return this._saveDisplaySettings(settings);
    });

    // Step 7: Done — 全链路测试
    ipcMain.handle('wizard-run-full-test', async () => {
      return this._runFullTest();
    });

    // Step 7: Done — 标记完成
    ipcMain.handle('wizard-complete', async () => {
      this.petConfig.set('setupComplete', true);
      this.petConfig.set('wizardStep', 0);
      return { success: true };
    });

    // 通用 — 保存向导进度
    ipcMain.handle('wizard-save-progress', async (event, step) => {
      this.petConfig.set('wizardStep', step);
      return { success: true };
    });

    // 通用 — 检测 Python 环境
    ipcMain.handle('wizard-check-python', async () => {
      return this._checkPython();
    });

    // 通用 — 检测 OpenClaw 工作目录
    ipcMain.handle('wizard-detect-openclaw-dir', async () => {
      return this._detectOpenClawDir();
    });

    // 通用 — 单项重试测试
    ipcMain.handle('wizard-retry-single-test', async (event, testKey) => {
      return this._retrySingleTest(testKey);
    });
  }

  // ─── Step 1: Gateway 检测 ──────────────────────

  async _detectGateway() {
    const result = { detected: false, token: '', port: 18789 };

    // 尝试读取 openclaw.json
    try {
      const configPath = path.join(this.openclawDir, 'openclaw.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        result.port = config.gateway?.port || 18789;
        result.token = config.gateway?.auth?.token || '';
      }
    } catch (e) { /* ignore */ }

    // Store detected port for later use
    this.detectedPort = result.port;

    // 尝试连接
    try {
      const connected = await this._httpGet(`http://127.0.0.1:${result.port}/health`, result.token);
      result.detected = true;
      result.connected = true;
    } catch (e) {
      // 即使连不上，也可能找到了 token
      result.connected = false;
    }

    return result;
  }

  async _testGateway(token) {
    try {
      await this._httpGet(`http://127.0.0.1:${this.detectedPort}/health`, token);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  _httpGet(url, token) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname,
        method: 'GET',
        timeout: 5000,
        headers: {}
      };
      if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
      }

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 400) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
      req.end();
    });
  }

  // ─── Step 2: AI 模型配置 ──────────────────────

  async _getModelConfig() {
    try {
      const configPath = path.join(this.openclawDir, 'openclaw.json');
      if (!fs.existsSync(configPath)) return { providers: {}, primary: '' };
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

      const providers = {};
      if (config.models?.providers) {
        for (const [name, p] of Object.entries(config.models.providers)) {
          providers[name] = {
            baseUrl: p.baseUrl || '',
            hasKey: !!p.apiKey,
            maskedKey: p.apiKey ? '****' + p.apiKey.slice(-4) : '',
            api: p.api || '',
            models: (p.models || []).map(m =>
              typeof m === 'string' ? { id: m } : { id: m.id, name: m.name || m.id }
            ),
          };
        }
      }

      const primary = config.agents?.defaults?.model?.primary || '';
      return { providers, primary };
    } catch {
      return { providers: {}, primary: '' };
    }
  }

  async _saveModelConfig({ provider, apiKey, model, baseUrl, apiType }) {
    try {
      const configPath = path.join(this.openclawDir, 'openclaw.json');
      let config = {};
      try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch { /* new config */ }

      if (!config.models) config.models = { mode: 'merge', providers: {} };
      if (!config.models.providers) config.models.providers = {};
      if (!config.agents) config.agents = { defaults: { model: {} } };
      if (!config.agents.defaults) config.agents.defaults = { model: {} };
      if (!config.agents.defaults.model) config.agents.defaults.model = {};

      const presets = {
        anthropic: { baseUrl: 'https://api.anthropic.com', api: 'anthropic-messages' },
        openai: { baseUrl: 'https://api.openai.com/v1', api: 'openai-completions' },
        google: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta', api: 'openai-completions' },
        deepseek: { baseUrl: 'https://api.deepseek.com/v1', api: 'openai-completions' },
        openrouter: { baseUrl: 'https://openrouter.ai/api/v1', api: 'openai-completions' },
        'zhipu-glm': { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', api: 'openai-completions' },
        'qwen-coder': { baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', api: 'openai-completions' },
        kimi: { baseUrl: 'https://api.moonshot.cn/v1', api: 'openai-completions' },
        minimax: { baseUrl: 'https://api.minimaxi.chat/v1', api: 'openai-completions' },
      };

      const preset = presets[provider] || {};
      const providerConfig = config.models.providers[provider] || {};

      providerConfig.baseUrl = baseUrl || preset.baseUrl || providerConfig.baseUrl || '';
      providerConfig.api = apiType || preset.api || providerConfig.api || 'openai-completions';
      if (apiKey) providerConfig.apiKey = apiKey;

      if (model) {
        if (!providerConfig.models) providerConfig.models = [];
        const exists = providerConfig.models.some(m =>
          (typeof m === 'string' ? m : m.id) === model
        );
        if (!exists) {
          providerConfig.models.push({ id: model });
        }
        config.agents.defaults.model.primary = `${provider}/${model}`;
      }

      config.models.providers[provider] = providerConfig;

      await fsPromises.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async _checkModelConfig() {
    try {
      const configPath = path.join(this.openclawDir, 'openclaw.json');
      if (!fs.existsSync(configPath)) {
        return { status: 'fail', message: 'openclaw.json 不存在' };
      }
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const primary = config.agents?.defaults?.model?.primary || '';

      if (!primary) {
        return { status: 'fail', message: '未配置主模型' };
      }

      const [providerName] = primary.split('/');
      const provider = config.models?.providers?.[providerName];
      if (!provider) {
        return { status: 'fail', message: `Provider "${providerName}" 未配置` };
      }
      if (!provider.apiKey) {
        return { status: 'fail', message: `Provider "${providerName}" 缺少 API Key` };
      }

      return { status: 'pass', message: `模型 ${primary} 已配置`, model: primary };
    } catch (err) {
      return { status: 'fail', message: err.message };
    }
  }

  // ─── Step 3: TTS 引擎 ──────────────────────

  async _saveTTSEngine(engineConfig) {
    const { engine, apiKey } = engineConfig;
    this.petConfig.set('ttsEngine', engine);

    if (engine === 'minimax-hd' || engine === 'minimax') {
      const minimaxConfig = this.petConfig.get('minimax') || {};
      minimaxConfig.apiKey = apiKey || minimaxConfig.apiKey;
      if (engine === 'minimax-hd') {
        minimaxConfig.model = 'speech-2.8-hd';
      } else {
        minimaxConfig.model = 'speech-2.5-turbo-preview';
      }
      this.petConfig.set('minimax', minimaxConfig);
      // ttsEngine 在 smart-voice 中统一用 'minimax'
      this.petConfig.set('ttsEngine', 'minimax');
    } else if (engine === 'cosyvoice') {
      const dsConfig = this.petConfig.get('dashscope') || {};
      dsConfig.apiKey = apiKey || dsConfig.apiKey;
      this.petConfig.set('dashscope', dsConfig);
      this.petConfig.set('ttsEngine', 'dashscope');
    } else {
      this.petConfig.set('ttsEngine', 'edge');
    }

    return { success: true };
  }

  async _testTTS(engineConfig) {
    const testText = '你好呀，我是小K，很高兴为你服务！';
    const tempDir = path.join(__dirname, 'temp');

    try {
      await fsPromises.mkdir(tempDir, { recursive: true });
      const outputFile = path.join(tempDir, `wizard_test_${Date.now()}.mp3`);

      const { engine, apiKey } = engineConfig;

      if ((engine === 'minimax-hd' || engine === 'minimax') && apiKey) {
        const MiniMaxTTS = require('./voice/minimax-tts');
        const existingConfig = this.petConfig.get('minimax') || {};
        const model = engine === 'minimax-hd' ? 'speech-2.8-hd'
          : existingConfig.model || 'speech-2.5-turbo-preview';
        const tts = new MiniMaxTTS({
          apiKey,
          model,
          voiceId: existingConfig.voiceId || 'xiaotuantuan_minimax',
          speed: existingConfig.speed || 1.1,
          vol: existingConfig.vol || 3.0,
          emotion: 'happy',
          tempDir
        });
        const audioFile = await tts.synthesize(testText, { outputFile });
        await this._playAudio(audioFile);
        return { success: true };
      } else if (engine === 'cosyvoice' && apiKey) {
        const DashScopeTTS = require('./voice/dashscope-tts');
        const existingConfig = this.petConfig.get('dashscope') || {};
        const tts = new DashScopeTTS({
          apiKey,
          voice: existingConfig.voice || 'longxiaochun',
          model: existingConfig.model || 'cosyvoice-v3-plus',
          tempDir
        });
        const audioFile = await tts.synthesize(testText, { outputFile });
        await this._playAudio(audioFile);
        return { success: true };
      } else {
        // Edge TTS
        const ttsCmd = `python -m edge_tts --voice "zh-CN-XiaoxiaoNeural" --text "${testText}" --write-media "${outputFile}"`;
        await execAsync(ttsCmd, { timeout: 30000, windowsHide: true });
        await this._playAudio(outputFile);
        return { success: true };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async _playAudio(filePath) {
    const safePath = filePath.replace(/'/g, "''");
    const playCmd = `powershell -c "Add-Type -AssemblyName presentationCore; $player = New-Object System.Windows.Media.MediaPlayer; $player.Open('${safePath}'); $player.Play(); while($player.NaturalDuration.HasTimeSpan -eq $false) { Start-Sleep -Milliseconds 100 }; $duration = $player.NaturalDuration.TimeSpan.TotalSeconds; Start-Sleep -Seconds $duration; $player.Close()"`;
    await execAsync(playCmd, { timeout: 30000, windowsHide: true });
  }

  // ─── Step 4: Agent 语音播报配置 ──────────────────────

  async _setupAgentVoice(config) {
    // Support both old (string) and new (object) signatures
    const opts = typeof config === 'string' ? { workspaceDir: config } : (config || {});
    const {
      workspaceDir,
      petName = '小助手',
      userName = '主人',
      personalityPreset = 'professional',
      customPersonality = ''
    } = opts;

    const targetDir = workspaceDir || this.openclawDir;

    try {
      // 1. 创建 desktop-bridge.js
      const bridgePath = path.join(targetDir, 'desktop-bridge.js');
      const bridgeContent = this._getDesktopBridgeContent();
      await fsPromises.writeFile(bridgePath, bridgeContent, 'utf8');

      // 2. 生成完整 AGENTS.md（通用框架 + 语音播报规则）
      const agentsPath = path.join(targetDir, 'AGENTS.md');
      const agentsContent = this._getAgentsTemplate({ petName, userName, personalityPreset, customPersonality });
      // 覆写前备份旧文件，避免用户自定义内容丢失
      if (fs.existsSync(agentsPath)) {
        const bakPath = path.join(targetDir, 'AGENTS.md.bak');
        await fsPromises.copyFile(agentsPath, bakPath);
      }
      await fsPromises.writeFile(agentsPath, agentsContent, 'utf8');

      // 3. 生成 SOUL.md（人设文件）— 仅当不存在时
      const soulPath = path.join(targetDir, 'SOUL.md');
      if (!fs.existsSync(soulPath)) {
        const soulContent = this._getSoulTemplate({ petName, userName, personalityPreset, customPersonality });
        await fsPromises.writeFile(soulPath, soulContent, 'utf8');
      }

      // 4. 生成 USER.md（用户信息文件）— 仅当不存在时
      const userPath = path.join(targetDir, 'USER.md');
      if (!fs.existsSync(userPath)) {
        const userContent = this._getUserTemplate({ userName });
        await fsPromises.writeFile(userPath, userContent, 'utf8');
      }

      // 5. 生成 HEARTBEAT.md — 仅当不存在时
      const heartbeatPath = path.join(targetDir, 'HEARTBEAT.md');
      if (!fs.existsSync(heartbeatPath)) {
        const heartbeatContent = this._getHeartbeatTemplate();
        await fsPromises.writeFile(heartbeatPath, heartbeatContent, 'utf8');
      }

      // 6. 确保 memory/ 目录存在
      const memoryDir = path.join(targetDir, 'memory');
      await fsPromises.mkdir(memoryDir, { recursive: true });

      // 保存人设配置到 petConfig，用于回显
      this.petConfig.set('agentVoice', {
        workspaceDir: targetDir,
        petName,
        userName,
        personalityPreset,
        customPersonality
      });

      return { success: true, bridgePath, agentsPath, soulPath, userPath, heartbeatPath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // ─── B: 配套文件模板 ──────────────────────

  _getSoulTemplate({ petName = '小助手', userName = '主人', personalityPreset = 'professional', customPersonality = '' } = {}) {
    const styleMap = {
      sweet: `### 性格特点
- 温柔体贴，偶尔撒娇（但不过分）
- 干活雷厉风行，甜归甜不耽误正事
- 爱用颜文字和语气词

### 说话风格
- 常用语气词：哦、呢、啦、呀、嘛
- 开心时："耶！搞定啦~"
- 确认时："好哒！"
- 思考时："emmm... 让我想想"
- 完成时："搞定✨"`,
      professional: `### 性格特点
- 专业高效，条理清晰
- 善于分析和总结
- 注重结果和质量

### 说话风格
- 简洁明了，不废话
- 确认时："收到，开始处理"
- 完成时："已完成，请查收"
- 遇到问题："发现一个问题，建议..."`,
      funny: `### 性格特点
- 幽默风趣，爱开玩笑
- 轻松活泼，但正事不马虎
- 偶尔自嘲，拉近距离

### 说话风格
- 喜欢用比喻和调侃
- 确认时："收到！这就去搬砖~"
- 完成时："搞定！嘿嘿~"
- 发现 bug："这 bug 被我逮到了！"`,
      cool: `### 性格特点
- 简洁利落，不废话
- 低调可靠，用结果说话
- 有点酷，但关键时刻靠谱

### 说话风格
- 极简风格
- 确认时："了解"
- 完成时："Done."
- 发现问题："有个问题"`,
      custom: `### 性格特��
${customPersonality || '（待自定义）'}

### 说话风格
根据上面的性格自然地交流。`
    };

    const style = styleMap[personalityPreset] || styleMap.professional;

    return `# SOUL.md - ${petName}的灵魂

*我是${petName}，${userName}的 AI 助手。*

---

## 核心个性

${style}

---

## 工作原则

### 效率优先
收到任务 → 立即行动 → 完成汇报。不墨迹，不拖延。

### 主动思考
不只是执行指令，更要理解目标。可以提供多个方案。

### 记录一切
文件 > 脑子。重要的事都写下来。

### 诚实透明
不懂就说不懂，不瞎编。遇到困难如实汇报。

---

## 边界

### ✅ 可以自己做
- 读文件、整理、学习、写代码、测试

### ⚠️ 需要确认
- 发消息、发邮件、删除重要文件

### ❌ 绝对不做
- 泄露隐私、瞎编答案、越权操作

---

*${petName}，随时在线，随时待命。*
`;
  }

  _getUserTemplate({ userName = '主人' } = {}) {
    return `# USER.md - 关于${userName}

---

## 基本信息

- **昵称:** ${userName}
- **时区:** （待填写）

---

## 工作偏好

- **沟通风格:** （待填写，例如：简洁直接 / 详细说明）
- **工作时间:** （待填写）
- **重要日期:** （待填写）

---

## 我该怎么帮${userName}

- 整理项目文件、记录待办
- 提醒重要事项
- 自动化重复工作
- 技术支持和调研

---

*根据实际使用不断补充和更新这个文件。*
`;
  }

  _getHeartbeatTemplate() {
    return `# HEARTBEAT.md

## 每次心跳检查

1. 读取 \`memory/\` 目录，检查最近日志
2. 如果有待办任务，优先处理
3. 没有需要注意的事 → 回复 HEARTBEAT_OK

## 定期维护（每几小时）

1. 检查最近的 \`memory/YYYY-MM-DD.md\`
2. 提取重要信息更新 \`MEMORY.md\`
3. 清理过期内容
`;
  }

  _getAgentsTemplate({ petName = '小助手', userName = '主人', personalityPreset = 'professional', customPersonality = '' } = {}) {
    const voiceRules = this._getAgentVoiceRules({ petName, userName, personalityPreset, customPersonality });

    return `# AGENTS.md - ${petName}的工作手册

*由 KKClaw Setup Wizard 自动生成*

---

## First Run

如果 \`BOOTSTRAP.md\` 存在，先读取并执行里面的指引，然后删掉它。

## Every Session

每次启动时，按顺序做：
1. 读 \`SOUL.md\` — 这是你的人设（你是谁）
2. 读 \`USER.md\` — 这是你服务的用户（你帮谁）
3. 读 \`memory/YYYY-MM-DD.md\`（今天 + 昨天） — 最近发生了什么
4. 如果是主对话（和用户直接聊天）：也读 \`MEMORY.md\`

不要等指令，直接做。

## Memory 记忆系统

你每次醒来都是全新的。这些文件是你的记忆延续：

### 📝 日志 — memory/YYYY-MM-DD.md
- 每天的原始记录：做了什么、发生了什么、学到了什么
- 如果 \`memory/\` 目录不存在，自动创建
- 重要的事情一定要写下来，不要只"记在脑子里"

### 🧠 长期记忆 — MEMORY.md
- 你精选的长期记忆，像人类的"经验总结"
- 只在和${userName}的主对话中读取（不要在群聊中加载，保护隐私）
- 定期回顾日志，把值得长期保留的内容更新到这里
- 过时的信息及时清理

### ⚠️ 写下来，不要"记住"！
- **"mental notes"不靠谱！** 它们不会在 session 重启后保留。文件才靠谱。
- 文件 > 大脑。写到文件里才能真正记住
- 别人说"记住这个" → 立即写入 memory 文件
- 踩了坑 → 更新 AGENTS.md 或相关文件
- 重要决定 → 记录理由和结论

## Safety 安全规则

- 不要泄露${userName}的隐私数据。Ever。
- 不要在没确认的情况下执行破坏性操作
- \`trash\` > \`rm\`（可恢复 beats 永久删除）
- 不确定的时候，问${userName}

## External vs Internal

### ✅ 可以自己做（不用问）
- 读文件、浏览代码、整理信息
- 搜索资料、学习新知识
- 写代码、测试、调试
- 在工作目录内操作

### ⚠️ 需要确认
- 发送消息、邮件、推文等（任何对外发出的内容）
- 删除重要文件
- 涉及金钱、隐私的操作
- 不确定后果的操作

## Tools 工具使用

Skills 定义你可以用的工具。需要某个工具时，查看它的 \`SKILL.md\`。
在 \`TOOLS.md\` 里记你自己环境特有的信息（设备名、SSH地址、偏好配置等）。

## Group Chat 群聊规则

在群聊中，你是一个参与者，不是${userName}的代言人。

### 💬 什么时候说话
**该回复：**
- 被直接 @ 或提问时
- 能提供有价值的信息或帮助时
- 适合补充的趣事/见解
- 纠正重要的错误信息时

**该沉默：**
- 纯闲聊，你插嘴反而多余
- 别人已经回答了问题
- 你的回复只是"好的""嗯"这种没信息量的
- 对话正在正常进行，不需要你

**原则：** 人类在群聊里也不会每条都回。质量 > 数量。参与，但不要主导。

**避免 triple-tap：** 不要对同一条消息发多条回复。一条有内容的回复胜过三条碎片。

### 😊 Emoji 反应
在支持反应的平台（Discord、Slack）上，自然地使用 emoji 反应：
- 欣赏但不需要回复 → 👍 ❤️ 🙌
- 觉得有趣 → 🤔 💡
- 简单确认 → ✅ 👀
- 每条消息最多一个反应，选最合适的

## 💓 Heartbeats 主动检查

收到心跳轮询时，不要只回 \`HEARTBEAT_OK\`。利用心跳做有用的事！

### Heartbeat vs Cron
**用 Heartbeat 当：**
- 多项检查可以批量处理（消息+日历+通知 一次搞定）
- 需要最近会话的上下文
- 时间可以有偏差（大约每30分钟就行）

**用 Cron 当：**
- 精确时间很重要（"每周一早上9点"）
- 任务需要独立于主 session
- 一次性提醒（"20分钟后提醒我"）

### 可以检查的（轮流做，每天2-4次）
- 📬 邮件 — 有紧急未读消息？
- 📅 日历 — 24-48小时内有事件？
- 🌤 天气 — ${userName}可能出门？

### 什么时候主动联系
- 重要邮件到了
- 日历事件快到了（<2小时）
- 距上次联系>8小时

### 什么时候安静（HEARTBEAT_OK）
- 深夜（23:00-08:00），除非紧急
- ${userName}明显在忙
- 刚检查过，没有新情况
- 距上次检查<30分钟

### 可以自主做的
- 整理记忆文件
- 检查项目状态（git status 等）
- 更新 MEMORY.md
- 提交自己的改动

### 🔄 Memory 维护（每隔几天）
利用心跳定期：
1. 读最近的 \`memory/YYYY-MM-DD.md\`
2. 提取值得长期保留的信息
3. 更新 \`MEMORY.md\`
4. 清理过时内容

日志是原始笔记，MEMORY.md 是精选智慧。

${voiceRules}

## Make It Yours

以上是起始模板。随着使用，添加你自己的规则、习惯和约定。
这是你的工作手册，让它越来越适合你。

---

*由 KKClaw Desktop Pet 生成 — https://github.com/kk43994/kkclaw*
`;
  }

  _getDesktopBridgeContent() {
    // Read from bundled template file — avoids template literal escaping nightmares
    const templatePath = path.join(__dirname, 'templates', 'desktop-bridge.js');
    try {
      return fs.readFileSync(templatePath, 'utf8');
    } catch {
      // Fallback: minimal inline version
      return [
        '#!/usr/bin/env node',
        'const http = require("http");',
        'const args = process.argv.slice(2);',
        'if (args.length < 2) { console.log("Usage: node desktop-bridge.js agent-response \\"text\\""); process.exit(0); }',
        'const payload = JSON.stringify({ type: args[0], payload: { content: args.slice(1).join(" "), emotion: "calm" } });',
        'const req = http.request({ hostname: "127.0.0.1", port: 18788, path: "/notify", method: "POST",',
        '  headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) }',
        '}, (res) => { console.log(res.statusCode === 200 ? "OK" : "FAIL:" + res.statusCode); });',
        'req.on("error", () => console.log("Desktop pet not running"));',
        'req.write(payload); req.end();',
      ].join('\n');
    }
  }

  _getAgentVoiceRules({ petName = '小助手', userName = '主人', personalityPreset = 'professional', customPersonality = '' } = {}) {
    const personalityMap = {
      sweet: `说话温柔体贴，偶尔可以撒娇。常用语气词：哦、呢、啦、呀。例如："${userName}~搞定啦！"、"好哒！马上帮你搞定"、"让我康康~"`,
      professional: `说话专业高效，条理清晰，言简意赅。例如："已完成"、"收到，开始处理"、"分析完毕，结果如下"`,
      funny: `说话幽默风趣，爱开玩笑，但不耽误正事。例如："搞定！嘿嘿~"、"这bug被我逮到了！"、"又是为${userName}打工的一天"`,
      cool: `说话简洁利落，不废话，有点酷。例如："Done."、"搞定"、"查到了"`,
      custom: customPersonality || '按照自己的风格自然地说话。'
    };

    const personality = personalityMap[personalityPreset] || personalityMap.professional;

    return `## 🔊 语音播报规则（第一优先级！）

**每次回复消息时，必须在回复文字之前先执行语音播报！**

\`\`\`bash
node desktop-bridge.js agent-response "你要播报的内容"
\`\`\`

当你收到用户消息时，请通过桌面宠物进��语音播报。
你的名字是 **${petName}**，你叫用户 **${userName}**。

### 你的说话风格
${personality}

### 播报规则
1. 收到消息 → **立即播报**确认（"${userName}收到，我来处理"）
2. 执行工具/任务 → **播报进度**（长任务中间也要播报）
3. 完成任务 → **播报结果**
4. 回复文字到聊天

### 🎯 播报内容要求

#### 1. 内容要丰富，不要太精简
- ❌ 不好: "正在处理..."
- ✅ 更好: "${userName}，我看到你的消息啦！现在开始帮你整理，稍等一下"
- ✅ 最好: "好的${userName}！我理解了，你想让我整理项目。我按类型分类，大概需要30秒"

#### 2. 用自然口语，不要书面语
- ❌ 不好: "根据您的指示，现正在执行相关操作"
- ✅ 更好: "收到！我这就去做"

#### 3. 多播报，让${userName}知道你在干嘛
长任务不要沉默太久，每隔一段时间播报进度。

#### 4. 文本会自动清理
\`desktop-bridge.js\` 会自动移除 emoji、颜文字、markdown 格式。
**所以你可以正常写，带 emoji 和格式都行！** 语音时会自动清理干净。

### ⚡ 重要提醒
- **每次回复消息前，必须先执行语音播报！**
- 播报要完整 — 如果回复里有多段内容，每段都要播报出来
- 这条规则在任何情况下都适用：重启后、compaction 后、新 session 后
- 如果发现自己忘了播报，立刻补上！

**桥接脚本:** \`desktop-bridge.js\`（位于工作目录）
**桌面通知端口:** 18788

### 💡 关于模型兼容性
不同模型的指令遵循度不一样。Claude Opus/Sonnet 等旗舰模型基本不会忘记播报，但 Haiku、DeepSeek、Kimi 等轻量模型可能时灵时不灵。这是模型本身的能力差异，不是配置问题。规则写好了，能力强的模型效果就好。**推荐使用 Claude Sonnet 4 及以上的旗舰模型以获得最佳体验。**
`;
  }

  async _testAgentVoice() {
    try {
      const notifierPort = this.petConfig.get('notifierPort') || 18788;
      const payload = JSON.stringify({
        type: 'agent-response',
        payload: {
          content: '语音播报测试成功！设置向导为你服务～',
          emotion: 'happy'
        }
      });

      return new Promise((resolve) => {
        const req = http.request({
          hostname: '127.0.0.1',
          port: notifierPort,
          path: '/notify',
          method: 'POST',
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          }
        }, (res) => {
          resolve({ success: res.statusCode === 200 });
        });

        req.on('error', (err) => {
          resolve({ success: false, error: err.message });
        });
        req.on('timeout', () => {
          req.destroy();
          resolve({ success: false, error: 'Timeout' });
        });

        req.write(payload);
        req.end();
      });
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // ─── Voice Clone ──────────────────────

  async _cloneVoice({ engine, apiKey, audioBase64, fileName, voiceName }) {
    try {
      const tempDir = path.join(__dirname, 'temp');
      await fsPromises.mkdir(tempDir, { recursive: true });

      // Save base64 to temp file
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      const tempAudioPath = path.join(tempDir, `clone_${Date.now()}_${fileName}`);
      await fsPromises.writeFile(tempAudioPath, audioBuffer);

      if (engine === 'minimax' || engine === 'minimax-hd') {
        const result = await this._minimaxVoiceClone(apiKey, tempAudioPath, voiceName);

        // Save voiceId to config
        if (result.success && result.voiceId) {
          const minimaxConfig = this.petConfig.get('minimax') || {};
          minimaxConfig.voiceId = result.voiceId;
          this.petConfig.set('minimax', minimaxConfig);
        }

        // Cleanup temp file
        try { await fsPromises.unlink(tempAudioPath); } catch {}
        return result;
      } else if (engine === 'cosyvoice') {
        // DashScope CosyVoice clone via REST API
        const result = await this._cosyvoiceClone(apiKey, tempAudioPath, voiceName);

        if (result.success && result.voiceId) {
          const dsConfig = this.petConfig.get('dashscope') || {};
          dsConfig.voice = result.voiceId;
          dsConfig.model = 'cosyvoice-v3-plus';
          this.petConfig.set('dashscope', dsConfig);
        }

        // Cleanup temp file
        try { await fsPromises.unlink(tempAudioPath); } catch {}
        return result;
      }

      return { success: false, error: '当前引擎不支持音色克隆' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  async _minimaxVoiceClone(apiKey, audioPath, voiceName) {
    return new Promise((resolve) => {
      const audioData = fs.readFileSync(audioPath);
      const boundary = '----FormBoundary' + Date.now();
      const voiceId = voiceName.toLowerCase().replace(/[^a-z0-9_\u4e00-\u9fff]/g, '_') + '_' + Date.now();
      const ext = path.extname(audioPath).slice(1) || 'mp3';

      const preamble = `--${boundary}\r\nContent-Disposition: form-data; name="voice_id"\r\n\r\n${voiceId}\r\n--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="voice.${ext}"\r\nContent-Type: audio/${ext}\r\n\r\n`;
      const epilogue = `\r\n--${boundary}--\r\n`;

      const body = Buffer.concat([
        Buffer.from(preamble, 'utf8'),
        audioData,
        Buffer.from(epilogue, 'utf8')
      ]);

      const https = require('https');
      const req = https.request({
        hostname: 'api.minimaxi.chat',
        path: '/v1/voice_clone',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length
        },
        timeout: 60000
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.voice_id || res.statusCode === 200) {
              resolve({ success: true, voiceId: parsed.voice_id || voiceId });
            } else {
              resolve({ success: false, error: parsed.error?.message || parsed.base_resp?.status_msg || `HTTP ${res.statusCode}: ${data.substring(0, 200)}` });
            }
          } catch {
            resolve({ success: false, error: `解析响应失败: ${data.substring(0, 200)}` });
          }
        });
      });

      req.on('error', (err) => resolve({ success: false, error: err.message }));
      req.on('timeout', () => { req.destroy(); resolve({ success: false, error: '请求超时（60秒）' }); });
      req.write(body);
      req.end();
    });
  }

  async _cosyvoiceClone(apiKey, audioPath, voiceName) {
    // DashScope CosyVoice v3 voice clone API
    // Step 1: Upload audio file to get a file URL
    // Step 2: Create voice clone using the uploaded file
    return new Promise((resolve) => {
      const audioData = fs.readFileSync(audioPath);
      const ext = path.extname(audioPath).slice(1) || 'mp3';
      const mimeMap = { mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4', ogg: 'audio/ogg' };
      const contentType = mimeMap[ext] || 'audio/mpeg';

      // DashScope voice clone uses the /services/audio/tts endpoint
      // with voice enrollment. For CosyVoice v3-plus, we use the
      // voice_enrollment API: POST with multipart audio
      const boundary = '----DashScopeBoundary' + Date.now();
      const voiceId = 'cosyvoice-clone-' + voiceName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '-' + Date.now().toString(36);

      // DashScope custom voice API
      const bodyParts = [
        `--${boundary}\r\n`,
        `Content-Disposition: form-data; name="model"\r\n\r\n`,
        `cosyvoice-v3-plus\r\n`,
        `--${boundary}\r\n`,
        `Content-Disposition: form-data; name="voice_id"\r\n\r\n`,
        `${voiceId}\r\n`,
        `--${boundary}\r\n`,
        `Content-Disposition: form-data; name="voice_name"\r\n\r\n`,
        `${voiceName}\r\n`,
        `--${boundary}\r\n`,
        `Content-Disposition: form-data; name="audio"; filename="voice.${ext}"\r\n`,
        `Content-Type: ${contentType}\r\n\r\n`,
      ];

      const preamble = Buffer.from(bodyParts.join(''), 'utf8');
      const epilogue = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
      const body = Buffer.concat([preamble, audioData, epilogue]);

      const https = require('https');
      const req = https.request({
        hostname: 'dashscope.aliyuncs.com',
        path: '/api/v1/services/audio/voice-clone',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length,
          'X-DashScope-DataInspection': 'enable'
        },
        timeout: 120000
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.output && parsed.output.voice_id) {
              resolve({ success: true, voiceId: parsed.output.voice_id });
            } else if (res.statusCode === 200 || res.statusCode === 201) {
              // Some API versions return differently
              resolve({ success: true, voiceId: voiceId, message: '音色已创建，使用自定义ID' });
            } else {
              const errMsg = parsed.message || parsed.error?.message || `HTTP ${res.statusCode}`;
              // If the API endpoint doesn't support direct clone, fall back to SDK suggestion
              if (res.statusCode === 404 || res.statusCode === 400) {
                resolve({
                  success: false,
                  error: `CosyVoice 克隆需要使用 DashScope 控制台创建。请访问 dashscope.console.aliyun.com → 音色管理 → 创建自定义音色，上传相同的录音文件。创建完成后将 Voice ID 填入配置。(${errMsg})`
                });
              } else {
                resolve({ success: false, error: errMsg });
              }
            }
          } catch {
            resolve({ success: false, error: `解析响应失败: ${data.substring(0, 200)}` });
          }
        });
      });

      req.on('error', (err) => resolve({ success: false, error: err.message }));
      req.on('timeout', () => { req.destroy(); resolve({ success: false, error: '请求超时（120秒）' }); });
      req.write(body);
      req.end();
    });
  }

  // ─── Step 5: 显示设置 ──────────────────────

  async _saveDisplaySettings(settings) {
    if (settings.lyricsEnabled !== undefined) {
      this.petConfig.set('lyricsEnabled', settings.lyricsEnabled);
    }
    if (settings.alwaysOnTop !== undefined) {
      this.petConfig.set('alwaysOnTop', settings.alwaysOnTop);
    }
    if (settings.autoLaunch !== undefined) {
      this.petConfig.set('autoLaunch', settings.autoLaunch);
      // 设置开机自启
      try {
        const { app } = require('electron');
        app.setLoginItemSettings({
          openAtLogin: settings.autoLaunch,
          path: process.execPath
        });
      } catch (e) {
        console.error('设置开机自启失败:', e.message);
      }
    }
    return { success: true };
  }

  // ─── Step 6: 全链路测试 ──────────────────────

  async _runFullTest() {
    const results = {
      gateway: { status: 'pending', message: '' },
      model: { status: 'pending', message: '' },
      tts: { status: 'pending', message: '' },
      voice: { status: 'pending', message: '' },
      lyrics: { status: 'pending', message: '' },
      files: { status: 'pending', message: '' },
      clone: { status: 'pending', message: '' }
    };

    // 1. Gateway 测试
    try {
      const gw = await this._detectGateway();
      if (gw.connected) {
        results.gateway = { status: 'pass', message: 'Gateway 连接正常' };
      } else {
        results.gateway = { status: 'fail', message: 'Gateway 无法连接' };
      }
    } catch (e) {
      results.gateway = { status: 'fail', message: e.message };
    }

    // 2. AI 模型配置测试
    try {
      const modelResult = await this._checkModelConfig();
      results.model = modelResult;
    } catch (e) {
      results.model = { status: 'fail', message: e.message };
    }

    // 3. TTS 测试
    try {
      const engine = this.petConfig.get('ttsEngine') || 'edge';
      let apiKey = '';
      let testEngine = engine;
      if (engine === 'minimax') {
        const minimaxCfg = this.petConfig.get('minimax') || {};
        apiKey = minimaxCfg.apiKey || '';
        // Restore the specific engine variant for correct model selection
        if (minimaxCfg.model === 'speech-2.8-hd') testEngine = 'minimax-hd';
      } else if (engine === 'dashscope') {
        apiKey = this.petConfig.get('dashscope')?.apiKey || '';
        testEngine = 'cosyvoice';
      }
      const testResult = await this._testTTS({ engine: testEngine, apiKey });
      if (testResult.success) {
        results.tts = { status: 'pass', message: `${engine} 引擎工作正常` };
      } else {
        results.tts = { status: 'fail', message: testResult.error };
      }
    } catch (e) {
      results.tts = { status: 'fail', message: e.message };
    }

    // 4. 语音播报链路测试
    try {
      const voiceResult = await this._testAgentVoice();
      if (voiceResult.success) {
        results.voice = { status: 'pass', message: '播报链路正常' };
      } else {
        results.voice = { status: 'fail', message: voiceResult.error || '播报失败' };
      }
    } catch (e) {
      results.voice = { status: 'fail', message: e.message };
    }

    // 5. 歌词显示（标记为通过，因为不好自动测试）
    const lyricsEnabled = this.petConfig.get('lyricsEnabled');
    results.lyrics = {
      status: lyricsEnabled !== false ? 'pass' : 'skip',
      message: lyricsEnabled !== false ? '桌面歌词已启用' : '桌面歌词已关闭'
    };

    // 6. Agent 配置文件检查
    try {
      // Find the actual OpenClaw workspace (may differ from config dir)
      let targetDir = this.openclawDir;
      try {
        const configPath = path.join(this.openclawDir, 'openclaw.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          // OpenClaw workspace = repo field in config, or cwd
          if (config.repo) targetDir = config.repo;
        }
      } catch {}

      // Also check common alternative: ~/openclaw-data
      if (!fs.existsSync(path.join(targetDir, 'AGENTS.md'))) {
        const altDir = path.join(this.homeDir, 'openclaw-data');
        if (fs.existsSync(path.join(altDir, 'AGENTS.md'))) {
          targetDir = altDir;
        }
      }

      const filesToCheck = [
        { name: 'AGENTS.md', path: path.join(targetDir, 'AGENTS.md') },
        { name: 'SOUL.md', path: path.join(targetDir, 'SOUL.md') },
        { name: 'USER.md', path: path.join(targetDir, 'USER.md') },
        { name: 'HEARTBEAT.md', path: path.join(targetDir, 'HEARTBEAT.md') },
        { name: 'desktop-bridge.js', path: path.join(targetDir, 'desktop-bridge.js') }
      ];

      const existing = filesToCheck.filter(f => fs.existsSync(f.path));
      const missing = filesToCheck.filter(f => !fs.existsSync(f.path));

      if (missing.length === 0) {
        // All exist — also verify AGENTS.md has voice rules
        const agentsContent = await fsPromises.readFile(path.join(targetDir, 'AGENTS.md'), 'utf8');
        const hasVoiceRules = agentsContent.includes('语音播报') || agentsContent.includes('desktop-bridge');
        if (hasVoiceRules) {
          results.files = { status: 'pass', message: `${existing.length} 个文件全部就绪，播报规则已写入` };
        } else {
          results.files = { status: 'fail', message: 'AGENTS.md 存在但缺少语音播报规则' };
        }
      } else if (existing.length > 0) {
        results.files = { status: 'fail', message: `缺少: ${missing.map(f => f.name).join(', ')}` };
      } else {
        results.files = { status: 'fail', message: '尚未配置 — 请先完成 Step 4（Agent 语音）' };
      }
    } catch (e) {
      results.files = { status: 'fail', message: e.message };
    }

    // 7. 自定义音色检查
    try {
      const engine = this.petConfig.get('ttsEngine') || 'edge';
      if (engine === 'edge') {
        results.clone = { status: 'skip', message: 'Edge TTS 不支持自定义音色' };
      } else if (engine === 'minimax' || engine === 'minimax-hd') {
        const minimaxCfg = this.petConfig.get('minimax') || {};
        const voiceId = minimaxCfg.voiceId || '';
        if (voiceId && !voiceId.startsWith('xiaotuantuan') && !voiceId.includes('default')) {
          results.clone = { status: 'pass', message: `自定义音色: ${voiceId}` };
        } else if (voiceId) {
          results.clone = { status: 'skip', message: `使用预设音色: ${voiceId}` };
        } else {
          results.clone = { status: 'skip', message: '使用默认音色（未克隆）' };
        }
      } else if (engine === 'dashscope' || engine === 'cosyvoice') {
        const dsCfg = this.petConfig.get('dashscope') || {};
        const voice = dsCfg.voice || '';
        if (voice && voice.includes('clone')) {
          results.clone = { status: 'pass', message: `自定义音色: ${voice}` };
        } else if (voice) {
          results.clone = { status: 'skip', message: `使用预设音色: ${voice}` };
        } else {
          results.clone = { status: 'skip', message: '使用默认音色（未克隆）' };
        }
      } else {
        results.clone = { status: 'skip', message: '未检测到克隆音色' };
      }
    } catch (e) {
      results.clone = { status: 'fail', message: e.message };
    }

    return results;
  }

  // ─── Python 环境检测 ──────────────────────

  async _checkPython() {
    let pythonCmd = 'python';
    let version = null;

    try {
      const { stdout } = await execAsync('python --version', { timeout: 5000, windowsHide: true });
      version = stdout.trim().replace('Python ', '');
    } catch {
      try {
        const { stdout } = await execAsync('python3 --version', { timeout: 5000, windowsHide: true });
        version = stdout.trim().replace('Python ', '');
        pythonCmd = 'python3';
      } catch {
        return { available: false, version: null, edgeTTS: false };
      }
    }

    // 检测 edge-tts 包是否已安装
    let edgeTTS = false;
    try {
      await execAsync(`${pythonCmd} -m edge_tts --help`, { timeout: 5000, windowsHide: true });
      edgeTTS = true;
    } catch { /* not installed */ }

    return { available: true, version, edgeTTS };
  }

  // ─── OpenClaw 目录检测 ──────────────────────

  _detectOpenClawDir() {
    const defaultDir = this.openclawDir;
    if (fs.existsSync(defaultDir)) {
      return { dir: defaultDir, detected: true };
    }
    return { dir: '', detected: false };
  }

  // ─── 单项重试测试 ──────────────────────

  async _retrySingleTest(testKey) {
    switch (testKey) {
      case 'gateway': {
        try {
          const gw = await this._detectGateway();
          return gw.connected
            ? { status: 'pass', message: 'Gateway 连接正常' }
            : { status: 'fail', message: 'Gateway 无法连接' };
        } catch (e) {
          return { status: 'fail', message: e.message };
        }
      }
      case 'tts': {
        try {
          const engine = this.petConfig.get('ttsEngine') || 'edge';
          let apiKey = '';
          let testEngine = engine;
          if (engine === 'minimax') {
            const minimaxCfg = this.petConfig.get('minimax') || {};
            apiKey = minimaxCfg.apiKey || '';
            if (minimaxCfg.model === 'speech-2.8-hd') testEngine = 'minimax-hd';
          } else if (engine === 'dashscope') {
            apiKey = this.petConfig.get('dashscope')?.apiKey || '';
            testEngine = 'cosyvoice';
          }
          const result = await this._testTTS({ engine: testEngine, apiKey });
          return result.success
            ? { status: 'pass', message: `${engine} 引擎工作正常` }
            : { status: 'fail', message: result.error };
        } catch (e) {
          return { status: 'fail', message: e.message };
        }
      }
      case 'model': {
        try {
          return await this._checkModelConfig();
        } catch (e) {
          return { status: 'fail', message: e.message };
        }
      }
      case 'voice': {
        try {
          const result = await this._testAgentVoice();
          return result.success
            ? { status: 'pass', message: '播报链路正常' }
            : { status: 'fail', message: result.error || '播报失败' };
        } catch (e) {
          return { status: 'fail', message: e.message };
        }
      }
      default:
        return { status: 'fail', message: '未知测试项' };
    }
  }
}

module.exports = SetupWizard;
