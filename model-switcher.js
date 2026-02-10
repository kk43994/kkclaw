/**
 * 🔄 Model Switcher V3 — CC Switch 风格模型管理器
 * 
 * 参考 CC Switch (17k⭐) 设计:
 * - 卡片式 Provider 管理
 * - 丰富的预设模板（含中转站）
 * - API 延迟测速
 * - "Currently Using" 状态标记
 * - Provider 图标和品牌色
 * - 拖拽排序
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const SwitchLogger = require('./utils/switch-logger');

// ===== 预设 Provider 模板（参考 CC Switch 的 17+ 预设） =====
const PROVIDER_PRESETS = {
  // ── 官方 ──
  'anthropic': {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com',
    website: 'https://console.anthropic.com',
    api: 'anthropic-messages',
    icon: '✦',
    color: '#D97757',
    description: 'Claude 官方 API',
    models: [
      { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', reasoning: true, contextWindow: 200000, maxTokens: 32000 },
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', reasoning: true, contextWindow: 200000, maxTokens: 16000 },
      { id: 'claude-haiku-3-5-20241022', name: 'Claude Haiku 3.5', reasoning: false, contextWindow: 200000, maxTokens: 8192 },
    ]
  },
  'openai': {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    website: 'https://platform.openai.com',
    api: 'openai-completions',
    icon: '◎',
    color: '#10A37F',
    description: 'GPT 官方 API',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', reasoning: false, contextWindow: 128000, maxTokens: 16384 },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', reasoning: false, contextWindow: 128000, maxTokens: 16384 },
      { id: 'o3-mini', name: 'o3-mini', reasoning: true, contextWindow: 200000, maxTokens: 100000, params: { reasoning_effort: 'high' } },
      { id: 'o3', name: 'o3', reasoning: true, contextWindow: 200000, maxTokens: 100000, params: { reasoning_effort: 'high' } },
      { id: 'o4-mini', name: 'o4-mini', reasoning: true, contextWindow: 200000, maxTokens: 100000, params: { reasoning_effort: 'high' } },
    ]
  },
  'google': {
    name: 'Google AI',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    website: 'https://aistudio.google.com',
    api: 'openai-completions',
    icon: '✦',
    color: '#4285F4',
    description: 'Gemini 官方 API',
    models: [
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', reasoning: true, contextWindow: 1000000, maxTokens: 65536 },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', reasoning: false, contextWindow: 1000000, maxTokens: 8192 },
    ]
  },
  'deepseek': {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    website: 'https://platform.deepseek.com',
    api: 'openai-completions',
    icon: '⬡',
    color: '#4D6BFE',
    description: 'DeepSeek 官方 API',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek V3', reasoning: false, contextWindow: 64000, maxTokens: 8192 },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1', reasoning: true, contextWindow: 64000, maxTokens: 8192 },
    ]
  },
  // ── 中转站 ──
  'openrouter': {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    website: 'https://openrouter.ai',
    api: 'openai-completions',
    icon: '⊕',
    color: '#6366F1',
    description: '多模型聚合中转',
    models: [
      { id: 'anthropic/claude-opus-4', name: 'Claude Opus 4', reasoning: true, contextWindow: 200000, maxTokens: 32000 },
      { id: 'openai/gpt-4o', name: 'GPT-4o', reasoning: false, contextWindow: 128000, maxTokens: 16384 },
      { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', reasoning: true, contextWindow: 1000000, maxTokens: 65536 },
    ]
  },
  'zhipu-glm': {
    name: 'Z.ai GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    website: 'https://z.ai',
    api: 'openai-completions',
    icon: 'Z',
    color: '#4361EE',
    description: '智谱 GLM 编码计划',
    models: [
      { id: 'glm-4-plus', name: 'GLM-4 Plus', reasoning: false, contextWindow: 128000, maxTokens: 4096 },
    ]
  },
  'qwen-coder': {
    name: 'Qwen Coder',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    website: 'https://bailian.console.aliyun.com',
    api: 'openai-completions',
    icon: 'Q',
    color: '#6236FF',
    description: '通义千问百炼平台',
    models: [
      { id: 'qwen-max', name: 'Qwen Max', reasoning: false, contextWindow: 32000, maxTokens: 8192 },
      { id: 'qwen-turbo', name: 'Qwen Turbo', reasoning: false, contextWindow: 128000, maxTokens: 8192 },
    ]
  },
  'kimi': {
    name: 'Kimi For Coding',
    baseUrl: 'https://api.moonshot.cn/v1',
    website: 'https://www.kimi.com/coding/docs/',
    api: 'openai-completions',
    icon: 'K',
    color: '#000000',
    description: 'Kimi K2 编码模型',
    models: [
      { id: 'kimi-k2-0711-preview', name: 'Kimi K2', reasoning: true, contextWindow: 128000, maxTokens: 8192 },
    ]
  },
  'minimax': {
    name: 'MiniMax',
    baseUrl: 'https://api.minimaxi.chat/v1',
    website: 'https://platform.minimaxi.com',
    api: 'openai-completions',
    icon: 'M',
    color: '#FF4040',
    description: 'MiniMax M2 模型',
    models: [
      { id: 'MiniMax-M1-80k', name: 'MiniMax M1', reasoning: false, contextWindow: 80000, maxTokens: 8192 },
    ]
  },
  // 自定义中转站模板
  'custom-proxy': {
    name: '自定义中转站',
    baseUrl: 'https://api.kk666.online/v1',
    website: 'https://api.kk666.online',
    api: 'anthropic-messages',
    icon: '⚙',
    color: '#888888',
    description: '自定义 API 端点',
    models: []
  }
};

// ===== API 类型映射（与 OpenClaw 兼容） =====
const API_TYPES = {
  'anthropic-messages': { label: 'Anthropic Messages API', brands: ['Claude'] },
  'openai-completions': { label: 'OpenAI Chat Completions', brands: ['GPT', 'DeepSeek', 'Qwen', 'Llama', 'Gemini', 'GLM'] },
  'openai-responses': { label: 'OpenAI Responses API', brands: ['GPT-5', 'Codex', 'o3', 'o4'] },
};

class ModelSwitcher {
  constructor(options = {}) {
    this.configPath = options.configPath || 
      path.join(process.env.HOME || process.env.USERPROFILE, '.openclaw', 'openclaw.json');
    this.gatewayPort = options.port || 18789;
    this.gatewayToken = options.token || '';
    
    this.models = [];         // 所有可用模型（扁平列表）
    this.providers = {};      // provider 详情（含 apiKey）
    this.currentModel = null; // 当前激活模型
    this.currentIndex = 0;    // 当前模型索引
    this.listeners = [];      // 变更监听器
    this.speedTestResults = {};  // 测速结果缓存
    this.providerOrder = [];    // Provider 排序

    // 监控日志
    this.switchLog = new SwitchLogger();

    this._loadConfig();
  }

  // ==================== 配置读写 ====================

  _loadConfig() {
    try {
      const raw = fs.readFileSync(this.configPath, 'utf8');
      const config = JSON.parse(raw);
      
      this.gatewayPort = config.gateway?.port || 18789;
      this.gatewayToken = config.gateway?.auth?.token || this.gatewayToken;
      
      this.models = [];
      this.providers = {};
      this.providerOrder = [];
      const providers = config.models?.providers || {};
      
      for (const [providerName, providerConfig] of Object.entries(providers)) {
        this.providerOrder.push(providerName);
        
        // 尝试匹配预设以获取图标和颜色
        const preset = this._matchPreset(providerName, providerConfig.baseUrl);
        
        this.providers[providerName] = {
          name: providerName,
          baseUrl: providerConfig.baseUrl || '',
          apiKey: providerConfig.apiKey || '',
          api: providerConfig.api || 'anthropic-messages',
          models: providerConfig.models || [],
          icon: preset?.icon || providerName.substring(0, 1).toUpperCase(),
          color: preset?.color || '#888888',
          website: preset?.website || '',
          description: preset?.description || '',
        };
        
        const modelList = providerConfig.models || [];
        for (const model of modelList) {
          this.models.push({
            id: `${providerName}/${model.id}`,
            name: model.name || model.id,
            shortName: this._getShortName(model.id, model.name),
            provider: providerName,
            providerBaseUrl: providerConfig.baseUrl || '',
            modelId: model.id,
            api: model.api || providerConfig.api,
            reasoning: model.reasoning || false,
            contextWindow: model.contextWindow || 200000,
            maxTokens: model.maxTokens || 32000,
            params: model.params || null,
            color: this._getModelColor(model.id),
            icon: this._getModelIcon(model.id),
          });
        }
      }
      
      // 获取当前默认模型
      const primaryModel = config.agents?.defaults?.model?.primary;
      if (primaryModel) {
        this.currentIndex = this.models.findIndex(m => m.id === primaryModel);
        if (this.currentIndex === -1) this.currentIndex = 0;
        this.currentModel = this.models[this.currentIndex] || null;
      }
      
      console.log(`🔄 ModelSwitcher V3: ${Object.keys(this.providers).length} providers, ${this.models.length} models, current: ${this.currentModel?.shortName || '?'}`);
      this.switchLog.info('配置加载', `${Object.keys(this.providers).length} providers, ${this.models.length} models, current: ${this.currentModel?.shortName || '?'}`);
    } catch (err) {
      console.error('❌ ModelSwitcher 配置加载失败:', err.message);
      this.switchLog.error('配置加载失败', err.message);
    }
  }

  /**
   * 根据 provider 名称或 baseUrl 匹配预设
   */
  _matchPreset(name, baseUrl) {
    const nameLower = name.toLowerCase();
    for (const [key, preset] of Object.entries(PROVIDER_PRESETS)) {
      if (nameLower.includes(key) || nameLower.includes(preset.name.toLowerCase())) {
        return preset;
      }
      try {
        if (baseUrl && preset.baseUrl && baseUrl.includes(new URL(preset.baseUrl).hostname)) {
          return preset;
        }
      } catch {}

    }
    
    // 通过 baseUrl 关键词匹配
    if (baseUrl) {
      if (baseUrl.includes('anthropic')) return PROVIDER_PRESETS['anthropic'];
      if (baseUrl.includes('openai.com')) return PROVIDER_PRESETS['openai'];
      if (baseUrl.includes('googleapis')) return PROVIDER_PRESETS['google'];
      if (baseUrl.includes('deepseek')) return PROVIDER_PRESETS['deepseek'];
      if (baseUrl.includes('openrouter')) return PROVIDER_PRESETS['openrouter'];
      if (baseUrl.includes('minimax')) return PROVIDER_PRESETS['minimax'];
      if (baseUrl.includes('bigmodel')) return PROVIDER_PRESETS['zhipu-glm'];
      if (baseUrl.includes('dashscope') || baseUrl.includes('aliyun')) return PROVIDER_PRESETS['qwen-coder'];
      if (baseUrl.includes('moonshot') || baseUrl.includes('kimi')) return PROVIDER_PRESETS['kimi'];
    }
    
    return null;
  }

  _saveConfig(config) {
    // 原子写入：先写临时文件再 rename
    const tmpPath = this.configPath + '.tmp';
    fs.writeFileSync(tmpPath, JSON.stringify(config, null, 2), 'utf8');
    fs.renameSync(tmpPath, this.configPath);
    // 热映射: 同步写入 models.json
    this._syncModelsJson(config);
  }

  _syncModelsJson(config) {
    try {
      const modelsPath = path.join(path.dirname(this.configPath), 'agents', 'main', 'agent', 'models.json');
      const providers = config.models?.providers || {};
      fs.writeFileSync(modelsPath, JSON.stringify({ providers }, null, 2), 'utf8');
    } catch (err) {
      console.warn('⚠️ models.json 同步失败:', err.message);
    }
  }

  _readConfig() {
    const raw = fs.readFileSync(this.configPath, 'utf8');
    return JSON.parse(raw);
  }

  // ==================== API 类型自动检测 ====================

  /**
   * 根据 baseUrl 和模型 ID 自动检测 API 类型
   * - anthropic.com / 含 claude 模型 → anthropic-messages
   * - codex/gpt-5+ 模型 → openai-responses
   * - 其他 OpenAI 兼容 → openai-completions
   */
  _detectApiType(baseUrl, modelId) {
    const url = (baseUrl || '').toLowerCase();
    const model = (modelId || '').toLowerCase();

    // Anthropic 官方或含 claude 的中转
    if (url.includes('anthropic')) return 'anthropic-messages';

    // 模型名判断 claude → anthropic
    if (model.includes('claude')) return 'anthropic-messages';

    // Codex / GPT-5+ 系列用 Responses API
    if (model.includes('codex') || model.includes('gpt-5')) return 'openai-responses';

    // baseUrl 路径含 /responses
    if (url.includes('/responses')) return 'openai-responses';

    // 默认 OpenAI Completions
    if (url.includes('openai') || url.includes('openrouter') || url.includes('deepseek') ||
        url.includes('dashscope') || url.includes('bigmodel') || url.includes('moonshot') ||
        url.includes('minimax') || url.includes('googleapis')) {
      return 'openai-completions';
    }

    return 'anthropic-messages';
  }

  // ==================== Provider 管理 ====================

  addProvider(name, opts = {}) {
    const config = this._readConfig();
    if (!config.models) config.models = { mode: 'merge', providers: {} };
    if (!config.models.providers) config.models.providers = {};
    
    if (config.models.providers[name]) {
      throw new Error(`Provider "${name}" already exists. Use updateProvider() to modify.`);
    }

    // Avoid case-insensitive collisions (some consumers treat provider keys as case-insensitive).
    const existing = Object.keys(config.models.providers).find(k => k.toLowerCase() === String(name).toLowerCase());
    if (existing) {
      throw new Error(`Provider "${name}" conflicts with existing "${existing}" (case-insensitive). Please rename.`);
    }

    const detectedApi = opts.api || this._detectApiType(opts.baseUrl, '');
    const provider = {
      baseUrl: opts.baseUrl || '',
      apiKey: opts.apiKey || '',
      api: detectedApi,
      models: (opts.models || []).map(m => ({
        id: m.id,
        name: m.name || m.id,
        api: m.api || this._detectApiType(opts.baseUrl, m.id),
        reasoning: m.reasoning || false,
        input: m.input || ['text', 'image'],
        cost: m.cost || { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: m.contextWindow || 200000,
        maxTokens: m.maxTokens || 32000,
      }))
    };

    config.models.providers[name] = provider;
    
    if (!config.agents) config.agents = { defaults: {} };
    if (!config.agents.defaults) config.agents.defaults = {};
    if (!config.agents.defaults.models) config.agents.defaults.models = {};
    for (const m of provider.models) {
      const modelEntry = {};
      if (m.params) modelEntry.params = m.params;
      config.agents.defaults.models[`${name}/${m.id}`] = modelEntry;
    }

    this._saveConfig(config);
    this._loadConfig();
    this._notifyListeners();

    console.log(`✅ Provider added: ${name} (${provider.models.length} models)`);
    this.switchLog.success('添加 Provider', `${name} (${provider.models.length} models, api: ${detectedApi})`);
    return provider;
  }

  addFromPreset(presetKey, apiKey, customName = null, customBaseUrl = null) {
    const preset = PROVIDER_PRESETS[presetKey];
    if (!preset) {
      throw new Error(`Unknown preset: ${presetKey}. Available: ${Object.keys(PROVIDER_PRESETS).join(', ')}`);
    }

    const name = customName || preset.name;
    const baseUrl = customBaseUrl || preset.baseUrl;

    return this.addProvider(name, {
      baseUrl,
      apiKey,
      api: preset.api,
      models: preset.models,
    });
  }

  updateProvider(name, updates = {}) {
    const config = this._readConfig();
    const provider = config.models?.providers?.[name];
    if (!provider) throw new Error(`Provider "${name}" not found`);

    if (updates.baseUrl !== undefined) provider.baseUrl = updates.baseUrl;
    if (updates.apiKey !== undefined) provider.apiKey = updates.apiKey;
    if (updates.api !== undefined) provider.api = updates.api;

    this._saveConfig(config);
    this._loadConfig();
    this._notifyListeners();

    console.log(`✅ Provider updated: ${name}`);
    this.switchLog.info('更新 Provider', `${name} | ${JSON.stringify(updates)}`);
    return provider;
  }

  removeProvider(name) {
    const config = this._readConfig();
    if (!config.models?.providers?.[name]) {
      throw new Error(`Provider "${name}" not found`);
    }

    delete config.models.providers[name];

    if (config.agents?.defaults?.models) {
      for (const key of Object.keys(config.agents.defaults.models)) {
        if (key.startsWith(`${name}/`)) {
          delete config.agents.defaults.models[key];
        }
      }
    }

    if (config.agents?.defaults?.model?.primary?.startsWith(`${name}/`)) {
      const remaining = Object.keys(config.models.providers);
      if (remaining.length > 0) {
        const firstProvider = config.models.providers[remaining[0]];
        if (firstProvider.models?.length > 0) {
          config.agents.defaults.model.primary = `${remaining[0]}/${firstProvider.models[0].id}`;
        }
      }
    }

    this._saveConfig(config);
    this._loadConfig();
    this._notifyListeners();

    console.log(`✅ Provider removed: ${name}`);
    this.switchLog.warn('删除 Provider', name);
  }

  getProviders() {
    return Object.entries(this.providers).map(([name, p]) => ({
      name,
      baseUrl: p.baseUrl,
      api: p.api,
      apiType: API_TYPES[p.api]?.label || p.api,
      modelCount: p.models.length,
      hasApiKey: !!p.apiKey,
      icon: p.icon,
      color: p.color,
      website: p.website,
      description: p.description,
      isCurrent: this.currentModel?.provider === name,
      speedTest: this.speedTestResults[name] || null,
    }));
  }

  getPresets() {
    return Object.entries(PROVIDER_PRESETS).map(([key, preset]) => ({
      key,
      name: preset.name,
      baseUrl: preset.baseUrl,
      api: preset.api,
      icon: preset.icon,
      color: preset.color,
      website: preset.website,
      description: preset.description,
      modelCount: preset.models.length,
      models: preset.models.map(m => m.name),
    }));
  }

  // ==================== 测速功能 ====================

  /**
   * 测试 Provider API 延迟
   * @param {string} providerName - Provider 名称
   * @returns {Promise<{latencyMs: number, status: string}>}
   */
  async speedTest(providerName) {
    const provider = this.providers[providerName];
    if (!provider || !provider.baseUrl) {
      return { latencyMs: -1, status: 'error', error: 'No base URL configured' };
    }

    const startTime = Date.now();
    
    try {
      // 简单的 HTTP HEAD/GET 请求测延迟
      const url = new URL(provider.baseUrl);
      const isHttps = url.protocol === 'https:';
      const httpModule = isHttps ? https : http;

      // 构建 /v1/models 请求路径（与 fetchModels 保持一致）
      let testPath = url.pathname;
      if (testPath.endsWith('/')) testPath = testPath.slice(0, -1);
      if (/\/v\d+/.test(testPath)) testPath += '/models';
      else testPath += '/v1/models';

      await new Promise((resolve, reject) => {
        const headers = { 'Content-Type': 'application/json' };
        // Anthropic 用 x-api-key，OpenAI 兼容用 Authorization Bearer
        if (provider.api === 'anthropic-messages') {
          headers['x-api-key'] = provider.apiKey;
          headers['anthropic-version'] = '2023-06-01';
        } else {
          headers['Authorization'] = `Bearer ${provider.apiKey}`;
        }

        const req = httpModule.request({
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 80),
          path: testPath,
          method: 'GET',
          headers,
          timeout: 10000,
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve({ statusCode: res.statusCode }));
        });
        
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
        req.end();
      });
      
      const latencyMs = Date.now() - startTime;
      let quality = 'fast';
      if (latencyMs > 3000) quality = 'slow';
      else if (latencyMs > 1000) quality = 'medium';
      
      const result = { latencyMs, status: 'ok', quality, timestamp: Date.now() };
      this.speedTestResults[providerName] = result;
      
      console.log(`⏱️ Speed test ${providerName}: ${latencyMs}ms (${quality})`);
      this.switchLog.info('测速', `${providerName}: ${latencyMs}ms (${quality})`);
      return result;
    } catch (err) {
      const result = { latencyMs: -1, status: 'error', error: err.message, timestamp: Date.now() };
      this.speedTestResults[providerName] = result;
      this.switchLog.error('测速失败', `${providerName}: ${err.message}`);
      return result;
    }
  }

  /**
   * 测试所有 Provider
   */
  async speedTestAll() {
    const results = {};
    for (const name of Object.keys(this.providers)) {
      results[name] = await this.speedTest(name);
    }
    return results;
  }

  // ==================== 远程获取模型列表 ====================

  async fetchModels(providerName) {
    const provider = this.providers[providerName];
    if (!provider || !provider.baseUrl) {
      return { success: false, error: 'No base URL configured' };
    }

    try {
      const url = new URL(provider.baseUrl);
      const isHttps = url.protocol === 'https:';
      const httpModule = isHttps ? https : http;

      // 构建 /v1/models 请求路径
      let modelsPath = url.pathname;
      if (modelsPath.endsWith('/')) modelsPath = modelsPath.slice(0, -1);
      // 如果路径已经包含版本号如 /v1，直接加 /models
      if (/\/v\d+/.test(modelsPath)) {
        modelsPath += '/models';
      } else {
        modelsPath += '/v1/models';
      }

      const data = await new Promise((resolve, reject) => {
        const headers = { 'Content-Type': 'application/json' };
        // Anthropic 用 x-api-key，OpenAI 兼容用 Authorization Bearer
        if (provider.api === 'anthropic-messages') {
          headers['x-api-key'] = provider.apiKey;
          headers['anthropic-version'] = '2023-06-01';
        } else {
          headers['Authorization'] = `Bearer ${provider.apiKey}`;
        }

        const req = httpModule.request({
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 80),
          path: modelsPath,
          method: 'GET',
          headers,
          timeout: 15000,
        }, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            try { resolve({ statusCode: res.statusCode, body: JSON.parse(body) }); }
            catch { resolve({ statusCode: res.statusCode, body }); }
          });
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
        req.end();
      });

      if (data.statusCode !== 200) {
        return { success: false, error: `HTTP ${data.statusCode}` };
      }

      // 解析模型列表（兼容 OpenAI / Anthropic / Gemini / OpenRouter 格式）
      let models = [];
      const body = data.body;

      if (body.data && Array.isArray(body.data)) {
        // OpenAI / Anthropic / OpenRouter 格式: { data: [...] }
        models = body.data.map(m => {
          const model = {
            id: m.id,
            name: m.display_name || m.name || m.id,
          };
          // OpenRouter 返回丰富元数据
          if (m.context_length) model.contextWindow = m.context_length;
          if (m.top_provider?.max_completion_tokens) model.maxTokens = m.top_provider.max_completion_tokens;
          if (m.supported_parameters?.includes('reasoning')) {
            model.reasoning = true;
            model.params = { reasoning_effort: 'high' };
          }
          return model;
        });
      } else if (body.models && Array.isArray(body.models)) {
        // Google Gemini 格式: { models: [...] }
        models = body.models.map(m => {
          const model = {
            id: (m.name || '').replace('models/', ''),
            name: m.displayName || m.name,
          };
          if (m.inputTokenLimit) model.contextWindow = m.inputTokenLimit;
          if (m.outputTokenLimit) model.maxTokens = m.outputTokenLimit;
          if (m.thinking) model.reasoning = true;
          return model;
        });
      } else if (Array.isArray(body)) {
        models = body.map(m => ({
          id: m.id || m.model,
          name: m.name || m.display_name || m.id || m.model,
        }));
      }

      // 用已知模型元数据补全 API 未返回的字段
      models = models.map(m => this._enrichModelMeta(m));

      console.log(`📡 ${providerName}: 获取到 ${models.length} 个模型`);
      this.switchLog.info('获取模型列表', `${providerName}: ${models.length} 个模型`);
      return { success: true, models };
    } catch (err) {
      console.error(`❌ 获取模型失败 ${providerName}:`, err.message);
      this.switchLog.error('获取模型失败', `${providerName}: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  // ==================== Model 管理 ====================

  addModel(providerName, model) {
    const config = this._readConfig();
    const provider = config.models?.providers?.[providerName];
    if (!provider) throw new Error(`Provider "${providerName}" not found`);

    provider.models = provider.models || [];
    
    if (provider.models.find(m => m.id === model.id)) {
      throw new Error(`Model "${model.id}" already exists in provider "${providerName}"`);
    }

    const modelEntry = {
      id: model.id,
      name: model.name || model.id,
      api: model.api || this._detectApiType(provider.baseUrl, model.id),
      reasoning: model.reasoning || false,
      input: model.input || ['text', 'image'],
      cost: model.cost || { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: model.contextWindow || 200000,
      maxTokens: model.maxTokens || 32000,
    };
    if (model.params) modelEntry.params = model.params;
    provider.models.push(modelEntry);

    if (!config.agents) config.agents = { defaults: {} };
    if (!config.agents.defaults) config.agents.defaults = {};
    if (!config.agents.defaults.models) config.agents.defaults.models = {};
    const agentModelEntry = {};
    if (model.params) agentModelEntry.params = model.params;
    config.agents.defaults.models[`${providerName}/${model.id}`] = agentModelEntry;

    this._saveConfig(config);
    this._loadConfig();
    this._notifyListeners();

    console.log(`✅ Model added: ${providerName}/${model.id}`);
    this.switchLog.success('添加模型', `${providerName}/${model.id}`);
  }

  removeModel(providerName, modelId) {
    const config = this._readConfig();
    const provider = config.models?.providers?.[providerName];
    if (!provider) throw new Error(`Provider "${providerName}" not found`);

    provider.models = (provider.models || []).filter(m => m.id !== modelId);

    if (config.agents?.defaults?.models) {
      delete config.agents.defaults.models[`${providerName}/${modelId}`];
    }

    // 如果删除的是默认模型，回退到第一个可用模型，避免 primary 指向不存在的模型
    const removedFullId = `${providerName}/${modelId}`;
    if (config.agents?.defaults?.model?.primary === removedFullId) {
      const providers = config.models?.providers || {};
      let nextPrimary = null;
      for (const [pName, pCfg] of Object.entries(providers)) {
        const first = (pCfg.models || [])[0];
        if (first?.id) {
          nextPrimary = `${pName}/${first.id}`;
          break;
        }
      }
      if (nextPrimary) {
        config.agents.defaults.model.primary = nextPrimary;
      }
    }

    this._saveConfig(config);
    this._loadConfig();
    this._notifyListeners();

    console.log(`✅ Model removed: ${providerName}/${modelId}`);
    this.switchLog.warn('删除模型', `${providerName}/${modelId}`);
  }

  // ==================== 模型切换 ====================

  getModels() { return this.models; }
  getCurrent() { return this.currentModel; }

  async next() {
    if (this.models.length <= 1) return this.currentModel;
    this.currentIndex = (this.currentIndex + 1) % this.models.length;
    return this._applySwitch();
  }

  async prev() {
    if (this.models.length <= 1) return this.currentModel;
    this.currentIndex = (this.currentIndex - 1 + this.models.length) % this.models.length;
    return this._applySwitch();
  }

  async switchToProvider(providerName) {
    // 如果该服务商没有模型，自动补上标准模型
    const providerModels = this.models.filter(m => m.provider === providerName);
    if (providerModels.length === 0) {
      const provider = this.providers[providerName];
      const api = provider?.api || 'anthropic-messages';
      let stdModels;
      if (api === 'openai-responses') {
        stdModels = [
          { id: 'gpt-5.3-codex', name: 'GPT-5.3 Codex' },
          { id: 'gpt-5.1-codex', name: 'GPT-5.1 Codex' },
        ];
      } else if (api === 'openai-completions') {
        stdModels = [
          { id: 'gpt-4o', name: 'GPT-4o' },
          { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
        ];
      } else {
        stdModels = [
          { id: 'claude-opus-4-6', name: 'Claude Opus 4.6' },
          { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5' },
          { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5' },
        ];
      }
      for (const m of stdModels) {
        this.addModel(providerName, m);
      }
    }
    const firstModel = this.models.find(m => m.provider === providerName);
    if (!firstModel) {
      console.error(`❌ 服务商 ${providerName} 无可用模型`);
      return null;
    }
    return this.switchTo(firstModel.id);
  }

  async switchTo(modelId) {
    const idx = this.models.findIndex(m => m.id === modelId || m.modelId === modelId);
    if (idx === -1) {
      console.error(`❌ 未找到模型: ${modelId}`);
      return null;
    }
    this.currentIndex = idx;
    return this._applySwitch();
  }

  async _applySwitch() {
    this.currentModel = this.models[this.currentIndex];
    console.log(`🔄 切换模型 → ${this.currentModel.shortName} (${this.currentModel.id})`);
    this.switchLog.success('切换模型', `${this.currentModel.shortName} (${this.currentModel.provider}/${this.currentModel.modelId})`);

    // 直接改写 openclaw.json，Gateway 的 file watcher 会自动热加载
    this._writeModelToConfig(this.currentModel.id);

    this._notifyListeners();
    return this.currentModel;
  }

  _writeModelToConfig(modelId) {
    try {
      const config = this._readConfig();

      // 确保路径存在
      if (!config.agents) config.agents = {};
      if (!config.agents.defaults) config.agents.defaults = {};
      if (!config.agents.defaults.model) config.agents.defaults.model = {};

      const previousModel = config.agents.defaults.model.primary;
      config.agents.defaults.model.primary = modelId;

      // 同步模型的 params（如 reasoning_effort）到 agents.defaults.models
      if (!config.agents.defaults.models) config.agents.defaults.models = {};
      const model = this.models.find(m => m.id === modelId);
      if (model && model.params) {
        config.agents.defaults.models[modelId] = {
          ...(config.agents.defaults.models[modelId] || {}),
          params: model.params
        };
      }

      // 原子写入：先写临时文件再 rename，防止写入中断导致配置损坏
      const tmpPath = this.configPath + '.tmp';
      fs.writeFileSync(tmpPath, JSON.stringify(config, null, 2), 'utf8');
      fs.renameSync(tmpPath, this.configPath);

      // 同步 models.json
      this._syncModelsJson(config);

      console.log(`✅ openclaw.json 已更新: ${previousModel || '(none)'} → ${modelId}`);
      if (model?.params) {
        console.log(`   params: ${JSON.stringify(model.params)}`);
      }
      this.switchLog.info('配置写入', `${previousModel || '(none)'} → ${modelId} (Gateway file watcher 热加载)`);

      // 清理飞书 session，迫使 Gateway 用新模型重建对话
      this._clearLarkSessions();

      // 重新加载内存状态
      this._loadConfig();
    } catch (err) {
      console.error(`❌ 写入 openclaw.json 失败:`, err.message);
      this.switchLog.error('配置写入失败', err.message);
    }
  }

  _clearLarkSessions() {
    try {
      const sessionDir = path.join(process.env.HOME || process.env.USERPROFILE, '.openclaw', 'agents', 'main', 'sessions');
      const sessionFile = path.join(sessionDir, 'sessions.json');

      if (!fs.existsSync(sessionFile)) return;

      const sessionsData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
      let deletedCount = 0;

      for (const [key, value] of Object.entries(sessionsData)) {
        if (key.includes('lark:') && value.sessionId) {
          const sessionPath = path.join(sessionDir, `${value.sessionId}.jsonl`);
          const lockPath = sessionPath + '.lock';

          if (fs.existsSync(sessionPath)) {
            fs.unlinkSync(sessionPath);
            deletedCount++;
          }
          if (fs.existsSync(lockPath)) {
            fs.unlinkSync(lockPath);
          }
        }
      }

      if (deletedCount > 0) {
        console.log(`🗑️ 已清理 ${deletedCount} 个飞书 session，新消息将使用新模型`);
        this.switchLog.info('Session 清理', `删除 ${deletedCount} 个飞书会话，下次消息使用新模型`);
      }
    } catch (err) {
      console.error(`⚠️ 清理飞书 session 失败:`, err.message);
      this.switchLog.warn('Session 清理失败', err.message);
    }
  }

  // ==================== 模型元数据补全 ====================

  /**
   * 已知模型元数据表 — 补全 /models API 未返回的 contextWindow、maxTokens、reasoning、params
   * OpenAI/Anthropic/DeepSeek 的 /models 接口只返回 id，缺少这些关键字段
   */
  static get KNOWN_MODELS() {
    return {
      // OpenAI
      'gpt-4o':            { contextWindow: 128000, maxTokens: 16384, reasoning: false },
      'gpt-4o-mini':       { contextWindow: 128000, maxTokens: 16384, reasoning: false },
      'gpt-4-turbo':       { contextWindow: 128000, maxTokens: 4096, reasoning: false },
      'o3':                { contextWindow: 200000, maxTokens: 100000, reasoning: true, params: { reasoning_effort: 'high' } },
      'o3-mini':           { contextWindow: 200000, maxTokens: 100000, reasoning: true, params: { reasoning_effort: 'high' } },
      'o4-mini':           { contextWindow: 200000, maxTokens: 100000, reasoning: true, params: { reasoning_effort: 'high' } },
      // Anthropic
      'claude-opus-4-20250514':      { contextWindow: 200000, maxTokens: 32000, reasoning: true },
      'claude-sonnet-4-20250514':    { contextWindow: 200000, maxTokens: 16000, reasoning: true },
      'claude-sonnet-4-5-20250514':  { contextWindow: 200000, maxTokens: 16000, reasoning: true },
      'claude-haiku-3-5-20241022':   { contextWindow: 200000, maxTokens: 8192, reasoning: false },
      // DeepSeek
      'deepseek-chat':     { contextWindow: 64000, maxTokens: 8192, reasoning: false },
      'deepseek-reasoner': { contextWindow: 64000, maxTokens: 8192, reasoning: true },
    };
  }

  _enrichModelMeta(model) {
    // 如果 API 已经返回了丰富数据（OpenRouter / Gemini），直接用
    if (model.contextWindow && model.maxTokens) return model;

    // 用 id 的最后一段匹配（兼容 openrouter 的 "openai/o3-mini" 格式）
    const shortId = model.id.includes('/') ? model.id.split('/').pop() : model.id;
    const known = ModelSwitcher.KNOWN_MODELS[shortId] || ModelSwitcher.KNOWN_MODELS[model.id];

    if (known) {
      if (!model.contextWindow) model.contextWindow = known.contextWindow;
      if (!model.maxTokens) model.maxTokens = known.maxTokens;
      if (model.reasoning === undefined) model.reasoning = known.reasoning;
      if (!model.params && known.params) model.params = known.params;
    }

    return model;
  }

  // ==================== 名称/颜色/图标 ====================

  _getShortName(modelId, modelName) {
    if (modelName && modelName !== modelId) {
      if (modelName.length <= 15) return modelName;
    }
    
    const map = {
      'claude-opus-4-6': 'Opus 4.6',
      'claude-opus-4': 'Opus 4',
      'claude-sonnet-4-5': 'Sonnet 4.5',
      'claude-sonnet-4': 'Sonnet 4',
      'claude-haiku-4-5': 'Haiku 4.5',
      'claude-haiku-4': 'Haiku 4',
      'claude-haiku-3-5': 'Haiku 3.5',
      'gpt-5.3-codex': 'GPT-5.3 Codex',
      'gpt-5.1-codex-max': 'GPT-5.1 Max',
      'gpt-5.1-codex-mini': 'GPT-5.1 Mini',
      'gpt-5.1-codex': 'GPT-5.1 Codex',
      'gpt-5-codex': 'GPT-5 Codex',
      'gpt-5.1-2025-11-13': 'GPT-5.1',
      'gpt-5-2025-08-07': 'GPT-5',
      'gpt-4o-mini': 'GPT-4o Mini',
      'gpt-4o': 'GPT-4o',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'o3-mini': 'o3-mini',
      'o3': 'o3',
      'o4-mini': 'o4-mini',
      'gemini-2.5-pro': 'Gemini 2.5 Pro',
      'gemini-2.0-flash': 'Gemini Flash',
      'deepseek-chat': 'DeepSeek V3',
      'deepseek-reasoner': 'DeepSeek R1',
      'qwen-max': 'Qwen Max',
      'qwen-turbo': 'Qwen Turbo',
    };
    
    if (map[modelId]) return map[modelId];
    for (const [key, val] of Object.entries(map)) {
      if (modelId.includes(key)) return val;
    }
    
    let short = modelId.replace(/-\d{8}$/, '');
    const parts = short.split('-');
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
  }

  _getModelColor(modelId) {
    const id = modelId.toLowerCase();
    if (id.includes('opus')) return '#E8A838';
    if (id.includes('sonnet')) return '#7C6BF0';
    if (id.includes('haiku')) return '#4ECDC4';
    if (id.includes('codex')) return '#19C37D';
    if (id.includes('gpt-5')) return '#10A37F';
    if (id.includes('o3') || id.includes('o4')) return '#FF6B9D';
    if (id.includes('gpt-4o-mini')) return '#74AA9C';
    if (id.includes('gpt')) return '#10A37F';
    if (id.includes('gemini')) return '#4285F4';
    if (id.includes('deepseek')) return '#4D6BFE';
    if (id.includes('qwen')) return '#6236FF';
    if (id.includes('llama')) return '#0467DF';
    if (id.includes('kimi') || id.includes('k2')) return '#000000';
    if (id.includes('glm')) return '#4361EE';
    if (id.includes('minimax')) return '#FF4040';
    return '#FF6B6B';
  }

  _getModelIcon(modelId) {
    const id = modelId.toLowerCase();
    if (id.includes('opus')) return 'OP';
    if (id.includes('sonnet')) return 'SN';
    if (id.includes('haiku')) return 'HK';
    if (id.includes('codex-max')) return '5M';
    if (id.includes('codex-mini')) return '5m';
    if (id.includes('codex')) return '5C';
    if (id.includes('gpt-5.3')) return '53';
    if (id.includes('gpt-5.1')) return '51';
    if (id.includes('gpt-5')) return 'G5';
    if (id.includes('o3')) return 'o3';
    if (id.includes('o4')) return 'o4';
    if (id.includes('gpt-4o-mini')) return '4m';
    if (id.includes('gpt-4o')) return '4o';
    if (id.includes('gpt-4')) return 'G4';
    if (id.includes('gemini') && id.includes('pro')) return 'GP';
    if (id.includes('gemini') && id.includes('flash')) return 'GF';
    if (id.includes('gemini')) return 'GM';
    if (id.includes('deepseek') && id.includes('reason')) return 'R1';
    if (id.includes('deepseek')) return 'DS';
    if (id.includes('qwen')) return 'QW';
    if (id.includes('llama')) return 'LL';
    if (id.includes('kimi') || id.includes('k2')) return 'K2';
    if (id.includes('glm')) return 'GL';
    if (id.includes('minimax')) return 'MM';
    return modelId.substring(0, 2).toUpperCase();
  }

  // ==================== 工具方法 ====================

  onChange(callback) {
    this.listeners.push(callback);
    return () => { this.listeners = this.listeners.filter(cb => cb !== callback); };
  }

  _notifyListeners() {
    for (const cb of this.listeners) {
      try { cb(this.currentModel, this.currentIndex, this.models); } catch (err) {
        console.error('ModelSwitcher listener error:', err);
      }
    }
  }

  reload() {
    this._loadConfig();
    this._notifyListeners();
  }

  getTrayMenuItems() {
    const groups = {};
    for (const model of this.models) {
      if (!groups[model.provider]) groups[model.provider] = [];
      groups[model.provider].push(model);
    }

    const items = [];
    for (const [provider, models] of Object.entries(groups)) {
      items.push({ label: `── ${provider} ──`, enabled: false });
      for (const model of models) {
        const isCurrent = this.currentModel?.id === model.id;
        items.push({
          label: `${isCurrent ? '✓ ' : '   '}${model.icon} ${model.shortName}`,
          type: 'radio',
          checked: isCurrent,
          click: () => this.switchTo(model.id)
        });
      }
    }
    return items;
  }

  getStatusText() {
    if (!this.currentModel) return 'No Model';
    return `${this.currentModel.icon} ${this.currentModel.shortName}`;
  }

  getFullStatus() {
    return {
      providers: this.getProviders(),
      models: this.models,
      current: this.currentModel,
      currentIndex: this.currentIndex,
      presets: this.getPresets(),
      apiTypes: Object.entries(API_TYPES).map(([key, val]) => ({ key, ...val })),
      speedTestResults: this.speedTestResults,
    };
  }
}

module.exports = ModelSwitcher;
