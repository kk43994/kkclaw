// 兼容修复：某些环境会残留 ELECTRON_RUN_AS_NODE=1，导致 require('electron').app 为 undefined
if (process.env.ELECTRON_RUN_AS_NODE === '1') {
  try {
    const { spawn } = require('child_process');
    const env = { ...process.env };
    delete env.ELECTRON_RUN_AS_NODE;

    const child = spawn(process.execPath, [__dirname], {
      detached: true,
      stdio: 'ignore',
      shell: false,
      windowsHide: true,
      env
    });
    child.unref();
    process.exit(0);
  } catch (err) {
    console.error('无法修复 ELECTRON_RUN_AS_NODE 环境:', err.message);
    process.exit(1);
  }
}

const fs = require('fs');

// macOS GUI apps inherit a minimal PATH from launchd, so Homebrew-installed
// tools like npm/openclaw disappear unless we re-add the common prefixes.
if (process.platform === 'darwin') {
  const extraPathEntries = [
    '/opt/homebrew/bin',
    '/opt/homebrew/opt/node@24/bin',
    '/usr/local/bin',
    '/Library/Developer/CommandLineTools/usr/bin',
  ].filter((dir) => {
    try {
      return fs.existsSync(dir);
    } catch (_) {
      return false;
    }
  });

  if (extraPathEntries.length > 0) {
    const currentPathEntries = String(process.env.PATH || '')
      .split(':')
      .map((entry) => entry.trim())
      .filter(Boolean);
    const mergedPathEntries = [
      ...extraPathEntries,
      ...currentPathEntries.filter((entry) => !extraPathEntries.includes(entry)),
    ];
    process.env.PATH = mergedPathEntries.join(':');
  }
}

const { app, BrowserWindow, ipcMain, screen, Menu, Tray, Notification, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const OpenClawClient = require('./openclaw-client');
const SmartVoiceSystem = require('./smart-voice'); // 🎙️ 智能语音系统
const MessageSyncSystem = require('./message-sync');
const WorkLogger = require('./work-logger');
const DesktopNotifier = require('./desktop-notifier');
const PetConfig = require('./pet-config');
const ScreenshotSystem = require('./screenshot-system'); // 🔥 新增
const LarkUploader = require('./lark-uploader'); // 🔥 新增
const ServiceManager = require('./service-manager'); // 🔧 服务管理
const CacheManager = require('./cache-manager'); // 🧹 缓存管理
const { ElectronRestartHandler } = require('./auto-restart'); // 🔄 自动重启
const PerformanceMonitor = require('./performance-monitor'); // 📊 性能监控
const LogRotationManager = require('./log-rotation'); // 📝 日志轮转
const GlobalErrorHandler = require('./global-error-handler'); // 🛡️ 全局错误处理
const GatewayGuardian = require('./gateway-guardian'); // 🛡️ Gateway 进程守护
const ModelSwitcher = require('./model-switcher'); // 🔄 模型切换器
const SetupWizard = require('./setup-wizard'); // 🧙 首次运行向导
const configManager = require('./utils/config-manager'); // 🔒 配置管理
const SecureStorage = require('./utils/secure-storage'); // 🔒 安全存储
const pathResolver = require('./utils/openclaw-path-resolver'); // 🔧 路径解析
const SessionLockManager = require('./utils/session-lock-manager');
const { printHero, printReady } = require('./startup-banner'); // 🦞 启动动画

// Windows透明窗口修复 — 禁用硬件加速彻底解决浅色背景矩形框
// macOS 上禁用硬件加速反而会破坏透明度，仅在 Windows 上启用
if (process.platform === 'win32') {
  app.disableHardwareAcceleration();
}

// 读取 OpenClaw 配置获取 token 和端口
function getGatewayConfig() {
  try {
    const config = configManager.getConfig();
    const configPath = pathResolver.getConfigPath();
    const token = SecureStorage.getSecureToken(configPath) || config.gateway?.auth?.token || '';

    return {
      port: config.gateway?.port || 18789,
      token
    };
  } catch (err) {
    return {
      port: 18789,
      token: ''
    };
  }
}

function buildGatewayDashboardUrl(port, token) {
  const parsedPort = Number.parseInt(port, 10);
  const safePort = Number.isInteger(parsedPort) ? parsedPort : 18789;
  const baseUrl = `http://127.0.0.1:${safePort}/`;
  if (!token) return baseUrl;
  return `${baseUrl}#token=${encodeURIComponent(token)}`;
}

function resolveDashboardUrlFromCli() {
  return new Promise((resolve, reject) => {
    const child = process.platform === 'win32'
      ? spawn('cmd.exe', ['/d', '/s', '/c', 'openclaw dashboard --no-open'], { windowsHide: true })
      : spawn('openclaw', ['dashboard', '--no-open'], { windowsHide: true });

    let output = '';
    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      const match = output.match(/Dashboard URL:\s*(https?:\/\/\S+)/i);
      if (match && match[1]) {
        resolve(match[1].trim());
        return;
      }
      if (code === 0) {
        resolve(null);
        return;
      }
      reject(new Error(`openclaw dashboard 执行失败 (code=${code})`));
    });
  });
}

async function openGatewayDashboard() {
  const { port, token } = getGatewayConfig();
  const fallbackUrl = buildGatewayDashboardUrl(port, token);

  try {
    const cliUrl = await resolveDashboardUrlFromCli();
    await shell.openExternal(cliUrl || fallbackUrl);
  } catch (err) {
    console.warn('⚠️ 获取 Dashboard URL 失败，使用回退地址:', err.message);
    await shell.openExternal(fallbackUrl);
  }
}

// 🔒 单实例锁 - 防止重复启动
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // 已有实例在运行，退出当前进程
  console.log('⚠️ 桌面宠物已在运行，聚焦到已有窗口');
  app.quit();
} else {
  // 当第二个实例尝试启动时，聚焦到已有窗口
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });
}

let mainWindow;
let lyricsWindow;
let lyricsReady = false; // 歌词窗口是否加载完成
let tray;
let openclawClient;
let voiceSystem;
let messageSync;
let workLogger;
let desktopNotifier;
let petConfig;
let screenshotSystem; // 🔥 新增
let larkUploader; // 🔥 新增
let serviceManager; // 🔧 服务管理
let cacheManager; // 🧹 缓存管理

// 安全发送歌词到歌词窗口
function sendLyric(data) {
  if (lyricsWindow && !lyricsWindow.isDestroyed() && lyricsReady) {
    try {
      lyricsWindow.webContents.send('show-lyric', data);
    } catch (err) {
      console.warn('⚠️ 歌词发送失败:', err.message);
    }
  }
}
let restartHandler; // 🔄 自动重启处理器
let performanceMonitor; // 📊 性能监控
let logRotation; // 📝 日志轮转
let errorHandler; // 🛡️ 全局错误处理
let gatewayGuardian; // 🛡️ Gateway 进程守护
let modelSwitcher; // 🔄 模型切换器
let setupWizard; // 🧙 首次运行向导
let setupWizardWindow; // 🧙 向导窗口

// 🛡️ 初始化全局错误处理 (最优先)
errorHandler = new GlobalErrorHandler({
  exitOnCritical: false,  // 不直接退出，交给 restartHandler
  notifyOnError: true,
  logErrors: true,
  maxRecoveryAttempts: 3
});

// 错误处理器事件
errorHandler.on('error', (errorInfo) => {
  console.error('🔴 全局错误:', errorInfo.type);
  if (performanceMonitor) {
    performanceMonitor.recordError(errorInfo.type, errorInfo.error?.message || 'Unknown', 'error');
  }
});

errorHandler.on('warning', (warningInfo) => {
  console.warn('🟡 全局警告:', warningInfo.type);
  if (performanceMonitor) {
    performanceMonitor.recordError(warningInfo.type, warningInfo.reason?.toString() || warningInfo.message, 'warning');
  }
});

errorHandler.on('recovery', async (errorInfo) => {
  console.log('🔄 执行恢复操作...');
  
  // 清理缓存
  if (cacheManager) {
    await cacheManager.triggerCleanup();
  }
  
  // 语音提示
  if (voiceSystem) {
    voiceSystem.speak('检测到错误，正在尝试恢复');
  }
});

errorHandler.on('shutdown', (info) => {
  console.log('🚪 优雅关闭中...');
  
  // 保存状态
  if (performanceMonitor) {
    performanceMonitor.saveStats();
  }
  
  // 停止所有系统
  if (cacheManager) cacheManager.stop();
  if (performanceMonitor) performanceMonitor.stop();
  if (logRotation) logRotation.stop();
});

// 🔄 初始化自动重启系统
restartHandler = new ElectronRestartHandler(app, {
  maxRestarts: 10,           // 1小时内最多重启10次
  restartWindow: 60 * 60 * 1000, // 1小时窗口
  minUptime: 10 * 1000,      // 最小运行10秒
  restartDelay: 3000         // 基础延迟3秒
});

// 📊 初始化性能监控
performanceMonitor = new PerformanceMonitor({
  interval: 60 * 1000,       // 1分钟采样
  maxSamples: 1440,          // 24小时数据
});

// 📝 初始化日志轮转
logRotation = new LogRotationManager({
  maxAge: 30,                // 保留30天
  maxSize: 10 * 1024 * 1024, // 单文件10MB
  checkInterval: 24 * 60 * 60 * 1000 // 每天检查
});

// 检查是否是自动重启
if (process.env.RESTARTED_BY === 'auto-restart') {
  const { colorLog: clRestart } = require('./utils/color-log');
  clRestart(`🔄 自动重启完成 (原因: ${process.env.RESTART_REASON})`);
  performanceMonitor.incrementStat('restarts');
}

async function createWindow() {
  const pkg = require('./package.json');
  const { colorLog } = require('./utils/color-log');
  colorLog(`🦞 KKClaw v${pkg.version} | PID ${process.pid} | ${__dirname}`);

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  // 加载配置
  petConfig = new PetConfig();
  await petConfig.load();
  
  // 初始化所有系统
  openclawClient = new OpenClawClient();
  voiceSystem = new SmartVoiceSystem(petConfig); // 🎙️ 智能语音系统
  workLogger = new WorkLogger();
  messageSync = new MessageSyncSystem(openclawClient);
  desktopNotifier = new DesktopNotifier(18788);
  await desktopNotifier.start(); // 异步启动，自动处理端口冲突
  petConfig.set('notifierPort', desktopNotifier.getPort()); // 保存实际端口供 wizard/bridge 使用
  screenshotSystem = new ScreenshotSystem(); // 🔥 新增
  larkUploader = new LarkUploader(); // 🔥 新增
  serviceManager = new ServiceManager(); // 🔧 服务管理
  
  // 🔄 初始化模型切换器
  modelSwitcher = new ModelSwitcher({
    port: getGatewayConfig().port,
    token: getGatewayConfig().token
  });
  
  // 模型切换时通知前端更新UI
  modelSwitcher.onChange((model) => {
    if (mainWindow) {
      mainWindow.webContents.send('model-changed', model);
    }
    if (modelSettingsWindow && !modelSettingsWindow.isDestroyed()) {
      modelSettingsWindow.webContents.send('model-changed', model);
    }
    if (lyricsWindow) {
      sendLyric({
        text: `模型切换 → ${model.shortName}`,
        type: 'system',
        sender: '系统'
      });
    }
    // 语音播报
    if (voiceSystem) {
      voiceSystem.speak(`已切换到${model.shortName}`, { priority: 'high' });
    }
  });
  
  // 🧹 初始化缓存管理器
  cacheManager = new CacheManager({
    interval: 6 * 60 * 60 * 1000,  // 6小时清理一次
    screenshots: 50,                // 保留50张截图
    voiceFiles: 100,                // 保留100个语音文件
    logDays: 30,                    // 保留30天日志
    onCleanup: (result) => {
      // 清理完成回调
      colorLog(`🧹 自动清理完成: ${result.freedMB}MB`);
      
      // 🎙️ 智能语音播报
      if (voiceSystem && result.freedMB > 10) {
        voiceSystem.speak(`清理缓存完成，释放了${Math.round(result.freedMB)}兆字节空间`, {
          priority: 'normal'
        });
      } else if (voiceSystem && result.freedMB > 0) {
        voiceSystem.speak(`完成例行缓存清理`, { priority: 'low' });
      }
      
      // 记录日志
      workLogger.log('action', `🧹 清理缓存: ${result.totalFiles}个文件, ${result.freedMB}MB`);
    }
  });
  
  // 启动自动清理
  cacheManager.start();
  
  // 📊 启动性能监控
  performanceMonitor.start();
  
  // 🎙️ 性能监控告警播报
  setInterval(() => {
    const health = performanceMonitor.calculateHealthScore();
    
    if (health.status === 'critical' && voiceSystem) {
      voiceSystem.speak(`性能告警，健康评分仅${health.score}分`, { priority: 'high' });
    } else if (health.status === 'warning' && voiceSystem) {
      voiceSystem.speak(`性能警告，当前评分${health.score}分`, { priority: 'medium' });
    }
  }, 30 * 60 * 1000); // 每30分钟检查一次
  
  // 📝 启动日志轮转
  logRotation.start();

  // 连接 OpenClaw 客户端的错误处理到服务管理器
  openclawClient.setErrorHandler((error) => {
    serviceManager.onCommunicationError(error);
    performanceMonitor.recordError('openclaw', error.message);
  });

  // 启动服务管理器
  serviceManager.start();

  // 启动 Gateway 进程守护
  const { port: guardianPort } = getGatewayConfig();
  gatewayGuardian = new GatewayGuardian(serviceManager, {
    gatewayHost: `http://127.0.0.1:${guardianPort}`
  });

  // 监听 Guardian 事件
  gatewayGuardian.on('unhealthy', (info) => {
    colorLog(`🚨 Gateway 不健康: ${info.reason}, 连续失败 ${info.consecutiveFailures} 次`);
    if (voiceSystem) {
      voiceSystem.speak('检测到Gateway异常，正在自动恢复', { priority: 'high' });
    }
    workLogger.log('error', `Gateway 不健康: ${info.reason}`);
  });

  gatewayGuardian.on('restarted', (info) => {
    colorLog(`✅ Gateway 已自动重启 (第 ${info.restartCount}/${info.maxRestarts} 次)`);
    if (voiceSystem) {
      voiceSystem.speak('Gateway已自动重启', { priority: 'normal' });
    }
    workLogger.log('success', `Gateway 自动重启成功 (${info.restartCount}/${info.maxRestarts})`);
  });

  gatewayGuardian.on('restart-limit-reached', (info) => {
    colorLog('❌ Gateway 重启次数过多，进入低频监控');
    if (voiceSystem) {
      voiceSystem.speak('Gateway频繁异常，进入低频监控', { priority: 'high' });
    }
    workLogger.logError(`Gateway 重启次数过多 (${info.restartHistory.length} 次)，进入低频监控`);

    new Notification({
      title: 'OpenClaw Gateway 异常',
      body: info.lastError
        ? `原因: ${info.lastError}\n已重启 ${info.restartHistory.length} 次，进入低频监控。`
        : `Gateway 已重启 ${info.restartHistory.length} 次，进入低频监控。`,
      icon: path.join(__dirname, 'icon.png'),
      silent: true
    }).show();
  });

  gatewayGuardian.on('restart-failed', (info) => {
    colorLog(`❌ Gateway 重启失败 (连续 ${info.consecutiveRestartFailures || '?'} 次): ${info.error}`);
    workLogger.logError(`Gateway 重启失败: ${info.error}`);

    // 弹通知告诉用户具体原因
    showServiceNotification(
      'Gateway 重启失败',
      info.error || '未知错误'
    );
  });

  gatewayGuardian.on('session-cleanup', (info) => {
    colorLog(`🧹 Guardian 自动清理 session: ${info.reason}`);
    workLogger.log('action', `Guardian 自动清理 session lock: ${info.reason}`);
    if (voiceSystem) {
      voiceSystem.speak('检测到会话锁残留，已自动清理', { priority: 'normal' });
    }
  });

  gatewayGuardian.on('recovered', () => {
    workLogger.log('success', 'Gateway 已自动恢复');
    if (voiceSystem) {
      voiceSystem.speak('连接已恢复');
    }
  });

  // 首次启动事件
  gatewayGuardian.on('starting', (info) => {
    colorLog(`⏳ ${info.message}`);
    if (voiceSystem) {
      voiceSystem.speak(info.message, { priority: 'normal' });
    }
  });

  gatewayGuardian.on('first-start-success', () => {
    colorLog('✅ Gateway 首次启动成功');
    if (voiceSystem) {
      voiceSystem.speak('Gateway启动成功，已准备就绪', { priority: 'normal' });
    }
  });

  gatewayGuardian.on('first-start-failed', (info) => {
    colorLog(`❌ Gateway 首次启动失败: ${info.error}`);
    if (voiceSystem) {
      voiceSystem.speak(`Gateway启动失败，${info.error}`, { priority: 'high' });
    }
  });

  // 启动守护
  gatewayGuardian.start();

  // 监听服务状态变化
  serviceManager.on('status-change', (change) => {
    colorLog(`🔧 服务状态变化: ${change.service} ${change.previousStatus} -> ${change.currentStatus}`);

    // 更新托盘图标提示
    updateTrayTooltip();

    // 🎙️ 服务状态播报
    if (change.currentStatus === 'stopped' && change.previousStatus === 'running') {
      showServiceNotification('OpenClaw 服务已断开', '点击托盘图标可重启服务');
      if (voiceSystem) {
        voiceSystem.speak('OpenClaw服务断开连接', { priority: 'high' });
      }
    } else if (change.currentStatus === 'running' && change.previousStatus !== 'running') {
      // 🦞 Gateway 就绪 — 打印 Ready Banner
      if (change.service === 'gateway') {
        const configMgr = require('./utils/config-manager');
        const port = (() => { try { const p = Number.parseInt(configMgr.getConfig()?.gateway?.port, 10); return p > 0 ? p : 18789; } catch { return 18789; } })();
        printReady(port);
      }

      if (voiceSystem) {
        voiceSystem.speak('OpenClaw服务已连接', { priority: 'normal' });
      }

      // 🔄 Gateway 重启后自动重连
      if (change.service === 'gateway') {
        setTimeout(async () => {
          try {
            await openclawClient.checkConnection();
            colorLog('✅ Gateway 重启后已重新连接');
            workLogger.log('success', 'Gateway 重启后已重新连接');
          } catch (err) {
            console.error('重连失败:', err.message);
          }
        }, 2000);
      }
    }
  });

  // 记录启动
  workLogger.log('success', '桌面应用启动成功');
  
  // 启动消息同步
  messageSync.connect();

  // 🧹 清理旧的事件监听器,防止重复播报
  desktopNotifier.removeAllListeners('user-message');
  desktopNotifier.removeAllListeners('agent-response');

  // 监听桌面通知（服务器已在上面启动）
  desktopNotifier.on('user-message', (payload) => {
    console.log('👤 用户消息:', payload);
    if (mainWindow) {
      mainWindow.webContents.send('new-message', {
        sender: payload.sender || '用户',
        content: payload.content,
        channel: 'lark'
      });
      // 歌词窗口显示
      sendLyric({
        text: payload.content,
        type: 'user',
        sender: payload.sender || '用户'
      });
      workLogger.logMessage(payload.sender || '用户', payload.content);
      
      // 🔔 Windows 系统通知（silent: true 防止系统朗读通知内容）
      if (!mainWindow.isFocused()) {
        new Notification({
          title: payload.sender || '用户',
          body: payload.content.substring(0, 100),
          icon: path.join(__dirname, 'icon.png'),
          silent: true
        }).show();
      }
      
      // 🔊 语音播报用户消息
      if (payload.content && voiceSystem) {
        const maxLength = 800; // 增加到800字,约2-3分钟
        const voiceText = payload.content.substring(0, maxLength);
        voiceSystem.speak(voiceText);
      }
    }
  });
  
  desktopNotifier.on('agent-response', (payload) => {
    console.log('🤖 AI回复:', payload);
    if (mainWindow) {
      // 🧹 清理 TTS 停顿标记（<#0.3#> 等），只给 MiniMax 用，不显示
      const displayContent = (payload.content || '').replace(/<#[\d.]+#>/g, '');
      
      mainWindow.webContents.send('agent-response', {
        content: displayContent,
        emotion: payload.emotion || 'happy'
      });
      // 歌词窗口显示（等语音播完后消失）
      const estimatedDuration = Math.max(6000, displayContent.length * 180 + 2000);
      sendLyric({
        text: displayContent,
        type: 'agent',
        sender: '小K',
        duration: estimatedDuration
      });
      // 直接在这里触发语音,完整播放
      // ⚠️ 语音用原始内容（保留 <#0.3#> 停顿标记给 MiniMax）
      if (payload.content && voiceSystem) {
        const maxLength = 800;
        const voiceText = payload.content.substring(0, maxLength);
        voiceSystem.speak(voiceText, { emotion: payload.emotion || 'calm' });
      }
      workLogger.log('message', `我回复: ${displayContent}`);
    }
  });
  
  // 监听外部命令：打开模型管理面板
  desktopNotifier.on('open-model-settings', () => {
    console.log('🔧 收到外部命令: 打开模型管理面板');
    openModelSettings();
  });

  // 监听消息同步事件
  messageSync.on('new_message', (msg) => {
    if (mainWindow) {
      mainWindow.webContents.send('new-message', msg);
      sendLyric({
        text: msg.content, type: 'user', sender: msg.sender
      });
      workLogger.logMessage(msg.sender, msg.content);
      console.log('📩 新消息:', msg.sender, '-', msg.content.substring(0, 50));

      // ⚠️ 不在这里播报语音 — desktopNotifier 的 user-message 已经负责播报了
      // 如果两边都 speak 会导致双重播报
    }
  });

  mainWindow = new BrowserWindow({
    width: 200,
    height: 260,
    x: petConfig.get('position')?.x || width - 200,
    y: petConfig.get('position')?.y || height - 200,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000', // macOS 全透明背景，消除淡粉色方框
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');

  // 渲染进程错误转发到主进程日志（防止静默失败）
  mainWindow.webContents.on('preload-error', (event, preloadPath, error) => {
    console.error('❌ [preload-error]', preloadPath, error);
  });
  mainWindow.webContents.on('console-message', (event, level, message) => {
    // level: 0=debug, 1=info, 2=warn, 3=error
    if (level >= 2) console.warn(`⚠️ [renderer] ${message}`);
  });

  // 注入CSS强制禁止滚动条
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.insertCSS(`
      html, body, * { overflow: hidden !important; scrollbar-width: none !important; }
      ::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
    `);
  });

  // 歌词窗口 — 桌面歌词效果
  const petPos = mainWindow.getPosition();
  lyricsWindow = new BrowserWindow({
    width: 400,
    height: 100,
    x: petPos[0] - 100,
    y: petPos[1] - 110,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    focusable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  lyricsWindow.loadFile('lyrics.html');
  lyricsWindow.setIgnoreMouseEvents(true); // 完全鼠标穿透！
  
  // 歌词窗口加载完成标记
  lyricsWindow.webContents.on('did-finish-load', () => {
    console.log('🎵 歌词窗口加载完成');
    lyricsReady = true;
  });
  lyricsWindow.on('closed', () => {
    lyricsWindow = null;
    lyricsReady = false;
  });
  
  // 窗口加载完成后发送测试通知
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('🎉 精灵窗口加载完成');
    setTimeout(() => {
      // 在歌词窗口显示欢迎消息
      sendLyric({
        text: '龙虾待命 🦞',
        type: 'system',
        sender: '系统'
      });
      mainWindow.webContents.send('new-message', {
        sender: '系统',
        content: '桌面应用已启动!',
        channel: 'system'
      });
    }, 2000);
  });
  
  // 开发模式打开开发者工具
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // 让窗口可以穿透点击(点击宠物除外)
  mainWindow.setIgnoreMouseEvents(false);

  // 右键菜单 - 增强版
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示/隐藏',
      click: () => {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
        }
      }
    },
    { type: 'separator' },
    {
      label: `🔄 模型: ${modelSwitcher.getStatusText()}`,
      submenu: [
        ...modelSwitcher.getTrayMenuItems(),
        { type: 'separator' },
        {
          label: '⚙️ 模型管理面板',
          click: () => {
            openModelSettings();
          }
        },
        {
          label: '🔃 刷新模型列表',
          click: () => {
            modelSwitcher.reload();
            rebuildTrayMenu();
            showServiceNotification('模型列表已刷新', `共 ${modelSwitcher.getModels().length} 个模型`);
          }
        }
      ]
    },
    { type: 'separator' },
    {
      label: '🔧 服务管理',
      submenu: [
        {
          label: '📊 服务状态',
          click: () => {
            const status = serviceManager.getStatus();
            const gatewayStatus = status.gateway.status === 'running' ? '✅ 运行中' : '❌ 已停止';
            const uptime = serviceManager.formatUptime(serviceManager.getUptime('gateway'));
            showServiceNotification('OpenClaw 服务状态', `Gateway: ${gatewayStatus}\n运行时间: ${uptime}`);
          }
        },
        { type: 'separator' },
        {
          label: '▶️ 启动 Gateway',
          click: async () => {
            showServiceNotification('正在启动...', 'OpenClaw Gateway');
            const result = await serviceManager.startGateway();
            if (result.success) {
              showServiceNotification('启动成功', 'OpenClaw Gateway 已启动');
            } else {
              showServiceNotification('启动失败', result.error || '未知错误');
            }
          }
        },
        {
          label: '⏹️ 停止 Gateway',
          click: async () => {
            showServiceNotification('正在停止...', 'OpenClaw Gateway');
            await serviceManager.stopGateway();
            showServiceNotification('已停止', 'OpenClaw Gateway');
          }
        },
        {
          label: '🔄 重启 Gateway',
          click: async () => {
            showServiceNotification('正在重启...', 'OpenClaw Gateway');
            const result = await serviceManager.restartGateway();
            if (result.success) {
              showServiceNotification('重启成功', 'OpenClaw Gateway 已重新启动');
            } else {
              showServiceNotification('重启失败', result.error || '未知错误');
            }
          }
        },
        { type: 'separator' },
        {
          label: '📋 查看日志',
          click: () => {
            const logs = serviceManager.getRecentLogs(10);
            const logText = logs.map(l => `[${l.level}] ${l.message}`).join('\n');
            showServiceNotification('最近日志', logText || '暂无日志');
          }
        },
        { type: 'separator' },
        {
          label: '💬 会话管理',
          submenu: [
            {
              label: '📊 查看会话状态',
              click: async () => {
                const info = await openclawClient.getSessionInfo();
                const contextCheck = await openclawClient.checkContextLength('');
                const percentage = contextCheck.percentage || 0;
                const statusIcon = percentage > 80 ? '🔴' : percentage > 50 ? '🟡' : '🟢';

                showServiceNotification(
                  '会话状态',
                  `${statusIcon} 上下文使用: ${percentage}%\n` +
                  `活跃会话: ${info.activeSessions} 个\n` +
                  `估算 tokens: ~${info.estimatedTokens}\n` +
                  `模型限制: ${contextCheck.limit} tokens`
                );
              }
            },
            {
              label: '🗑️ 清理当前会话',
              click: async () => {
                showServiceNotification('正在清理...', '删除会话文件');
                const result = await openclawClient.clearCurrentSession();
                if (result.success) {
                  showServiceNotification('清理成功', result.message);
                  if (voiceSystem) {
                    voiceSystem.speak('会话已清理，可以开始新对话了');
                  }
                } else {
                  showServiceNotification('清理失败', result.message);
                }
              }
            },
            {
              label: '🔍 诊断会话问题',
              click: async () => {
                const info = await openclawClient.getSessionInfo();
                const contextCheck = await openclawClient.checkContextLength('');

                let diagnosis = '会话诊断报告:\n\n';

                // 检查会话数量
                if (info.activeSessions === 0) {
                  diagnosis += '✅ 没有活跃会话\n';
                } else if (info.activeSessions > 3) {
                  diagnosis += `⚠️ 会话过多 (${info.activeSessions}个)，建议清理\n`;
                } else {
                  diagnosis += `✅ 会话数量正常 (${info.activeSessions}个)\n`;
                }

                // 检查上下文长度
                if (contextCheck.percentage > 90) {
                  diagnosis += `🔴 上下文严重超限 (${contextCheck.percentage}%)，必须清理！\n`;
                } else if (contextCheck.percentage > 80) {
                  diagnosis += `🟡 上下文接近限制 (${contextCheck.percentage}%)，建议清理\n`;
                } else {
                  diagnosis += `✅ 上下文使用正常 (${contextCheck.percentage}%)\n`;
                }

                // 检查会话文件大小
                if (info.sessions && info.sessions.length > 0) {
                  const largeSession = info.sessions.find(s => s.sizeKB > 500);
                  if (largeSession) {
                    diagnosis += `⚠️ 发现大型会话文件 (${largeSession.sizeKB}KB)\n`;
                  }
                }

                showServiceNotification('诊断结果', diagnosis);
              }
            }
          ]
        },
        { type: 'separator' },
        {
          label: '🔍 诊断工具',
          submenu: [
            {
              label: '📊 完整诊断报告',
              click: async () => {
                const diagnostics = await openclawClient.getDiagnostics();

                let report = '=== OpenClaw 诊断报告 ===\n\n';

                // 连接状态
                report += `连接状态: ${diagnostics.connection.connected ? '✅ 已连接' : '❌ 未连接'}\n`;

                // 会话状态
                const contextIcon = diagnostics.session.contextPercentage > 80 ? '🔴' :
                                   diagnostics.session.contextPercentage > 50 ? '🟡' : '🟢';
                report += `\n会话状态:\n`;
                report += `${contextIcon} 上下文: ${diagnostics.session.contextPercentage}% (${diagnostics.session.estimatedTokens}/${diagnostics.session.contextLimit})\n`;
                report += `活跃会话: ${diagnostics.session.activeSessions} 个\n`;

                // 请求统计
                report += `\n请求统计:\n`;
                report += `总请求数: ${diagnostics.requests.total}\n`;
                report += `最近请求: ${diagnostics.requests.recentCount} 条\n`;

                // 错误统计
                report += `\n错误统计:\n`;
                report += `总错误数: ${diagnostics.errors.total}\n`;
                report += `最近错误: ${diagnostics.errors.recentCount} 条\n`;

                if (diagnostics.errors.recent.length > 0) {
                  report += `\n最近错误详情:\n`;
                  diagnostics.errors.recent.slice(0, 3).forEach(err => {
                    report += `- [Req#${err.requestId}] ${err.error} (${err.elapsed}ms)\n`;
                  });
                }

                showServiceNotification('诊断报告', report);
              }
            },
            {
              label: '❌ 查看最近错误',
              click: async () => {
                const errors = openclawClient.getRecentErrors(10);

                if (errors.length === 0) {
                  showServiceNotification('最近错误', '✅ 没有错误记录');
                  return;
                }

                let errorReport = `最近 ${errors.length} 条错误:\n\n`;
                errors.forEach((err, idx) => {
                  const time = new Date(err.timestamp).toLocaleTimeString();
                  errorReport += `${idx + 1}. [${time}] Req#${err.requestId}\n`;
                  errorReport += `   ${err.error} (${err.elapsed}ms)\n`;
                  errorReport += `   消息: ${err.message}\n\n`;
                });

                showServiceNotification('最近错误', errorReport);
              }
            },
            {
              label: '📝 查看最近请求',
              click: async () => {
                const requests = openclawClient.getRecentRequests(10);

                if (requests.length === 0) {
                  showServiceNotification('最近请求', '没有请求记录');
                  return;
                }

                let requestReport = `最近 ${requests.length} 条请求:\n\n`;
                requests.forEach((req, idx) => {
                  const time = new Date(req.timestamp).toLocaleTimeString();
                  const status = req.success ? '✅' : '❌';
                  requestReport += `${idx + 1}. ${status} [${time}] Req#${req.requestId} (${req.elapsed}ms)\n`;
                  requestReport += `   消息: ${req.message}\n`;
                  if (req.response) {
                    requestReport += `   响应: ${req.response}\n`;
                  }
                  requestReport += `\n`;
                });

                showServiceNotification('最近请求', requestReport);
              }
            },
            {
              label: '🏥 检查 Gateway 健康',
              click: async () => {
                showServiceNotification('正在检查...', 'Gateway 健康状态');

                const isConnected = await openclawClient.checkConnection();
                const status = serviceManager.getStatus();
                const uptime = serviceManager.formatUptime(serviceManager.getUptime('gateway'));

                let healthReport = 'Gateway 健康检查:\n\n';
                healthReport += `连接状态: ${isConnected ? '✅ 正常' : '❌ 异常'}\n`;
                healthReport += `进程状态: ${status.gateway.status === 'running' ? '✅ 运行中' : '❌ 已停止'}\n`;
                healthReport += `运行时间: ${uptime}\n`;

                if (status.gateway.pid) {
                  healthReport += `进程 PID: ${status.gateway.pid}\n`;
                }

                showServiceNotification('健康检查结果', healthReport);
              }
            }
          ]
        }
      ]
    },
    {
      label: '🏥 诊断工具箱',
      click: () => { openDiagnosticToolbox(); }
    },
    {
      label: '🌐 打开控制台',
      click: async () => {
        await openGatewayDashboard();
      }
    },
    {
      label: '设置',
      click: () => {
        // TODO: 打开设置窗口
      }
    },
    {
      label: '🧙 KKClaw 新手引导',
      click: () => { reopenSetupWizard(); }
    },
    { type: 'separator' },
    {
      label: '🔄 恢复 Session',
      click: async () => {
        showServiceNotification('正在恢复...', '清理飞书会话缓存');
        try {
          const result = await doRefreshSession();
          showServiceNotification('恢复成功', `已清理 ${result.sessions?.length || 0} 个会话`);
        } catch(e) {
          showServiceNotification('恢复失败', e.message);
        }
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit();
      }
    }
  ]);

  // 创建系统托盘图标（macOS 使用 Template 图标自动适配深色/浅色模式）
  let trayIconPath;
  if (process.platform === 'darwin') {
    trayIconPath = path.join(__dirname, 'trayIconTemplate.png');
  } else {
    trayIconPath = path.join(__dirname, 'tray-icon.png');
  }
  tray = new Tray(trayIconPath);
  tray.setToolTip('Claw - 你的数字助手');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
  
  // 模型切换后重建托盘菜单以更新显示
  modelSwitcher.onChange(() => {
    rebuildTrayMenu();
  });

  // 监控日志实时推送到设置窗口
  modelSwitcher.switchLog.onLog((entry) => {
    if (modelSettingsWindow && !modelSettingsWindow.isDestroyed()) {
      modelSettingsWindow.webContents.send('switch-log-entry', entry);
    }
  });
}

/**
 * 重建托盘菜单（模型切换后刷新显示）
 */
function rebuildTrayMenu() {
  if (!tray || !modelSwitcher) return;
  tray.setToolTip(`Claw 🦞 | ${modelSwitcher.getStatusText()}`);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示/隐藏',
      click: () => {
        if (mainWindow) {
          mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
        }
      }
    },
    { type: 'separator' },
    {
      label: `🔄 模型: ${modelSwitcher.getStatusText()}`,
      submenu: [
        ...modelSwitcher.getTrayMenuItems(),
        { type: 'separator' },
        {
          label: '⚙️ 模型管理面板',
          click: () => { openModelSettings(); }
        },
        {
          label: '🔃 刷新模型列表',
          click: () => {
            modelSwitcher.reload();
            rebuildTrayMenu();
            showServiceNotification('模型列表已刷新', `共 ${modelSwitcher.getModels().length} 个模型`);
          }
        }
      ]
    },
    { type: 'separator' },
    {
      label: '🔧 服务管理',
      submenu: [
        {
          label: '📊 服务状态',
          click: () => {
            const status = serviceManager.getStatus();
            const gatewayStatus = status.gateway.status === 'running' ? '✅ 运行中' : '❌ 已停止';
            const uptime = serviceManager.formatUptime(serviceManager.getUptime('gateway'));
            showServiceNotification('OpenClaw 服务状态', `Gateway: ${gatewayStatus}\n运行时间: ${uptime}`);
          }
        },
        { type: 'separator' },
        {
          label: '▶️ 启动 Gateway',
          click: async () => {
            showServiceNotification('正在启动...', 'OpenClaw Gateway');
            const result = await serviceManager.startGateway();
            if (result.success) showServiceNotification('启动成功', 'OpenClaw Gateway 已启动');
            else showServiceNotification('启动失败', result.error || '未知错误');
          }
        },
        {
          label: '⏹️ 停止 Gateway',
          click: async () => {
            showServiceNotification('正在停止...', 'OpenClaw Gateway');
            await serviceManager.stopGateway();
            showServiceNotification('已停止', 'OpenClaw Gateway');
          }
        },
        {
          label: '🔄 重启 Gateway',
          click: async () => {
            showServiceNotification('正在重启...', 'OpenClaw Gateway');
            const result = await serviceManager.restartGateway();
            if (result.success) showServiceNotification('重启成功', 'OpenClaw Gateway 已重新启动');
            else showServiceNotification('重启失败', result.error || '未知错误');
          }
        },
        { type: 'separator' },
        {
          label: '📋 查看日志',
          click: () => {
            const logs = serviceManager.getRecentLogs(10);
            const logText = logs.map(l => `[${l.level}] ${l.message}`).join('\n');
            showServiceNotification('最近日志', logText || '暂无日志');
          }
        },
        { type: 'separator' },
        {
          label: '💬 会话管理',
          submenu: [
            {
              label: '📊 查看会话状态',
              click: async () => {
                const info = await openclawClient.getSessionInfo();
                const contextCheck = await openclawClient.checkContextLength('');
                const percentage = contextCheck.percentage || 0;
                const statusIcon = percentage > 80 ? '🔴' : percentage > 50 ? '🟡' : '🟢';

                showServiceNotification(
                  '会话状态',
                  `${statusIcon} 上下文使用: ${percentage}%\n` +
                  `活跃会话: ${info.activeSessions} 个\n` +
                  `估算 tokens: ~${info.estimatedTokens}\n` +
                  `模型限制: ${contextCheck.limit} tokens`
                );
              }
            },
            {
              label: '🗑️ 清理当前会话',
              click: async () => {
                showServiceNotification('正在清理...', '删除会话文件');
                const result = await openclawClient.clearCurrentSession();
                if (result.success) {
                  showServiceNotification('清理成功', result.message);
                  if (voiceSystem) {
                    voiceSystem.speak('会话已清理，可以开始新对话了');
                  }
                } else {
                  showServiceNotification('清理失败', result.message);
                }
              }
            },
            {
              label: '🔍 诊断会话问题',
              click: async () => {
                const info = await openclawClient.getSessionInfo();
                const contextCheck = await openclawClient.checkContextLength('');

                let diagnosis = '会话诊断报告:\n\n';

                // 检查会话数量
                if (info.activeSessions === 0) {
                  diagnosis += '✅ 没有活跃会话\n';
                } else if (info.activeSessions > 3) {
                  diagnosis += `⚠️ 会话过多 (${info.activeSessions}个)，建议清理\n`;
                } else {
                  diagnosis += `✅ 会话数量正常 (${info.activeSessions}个)\n`;
                }

                // 检查上下文长度
                if (contextCheck.percentage > 90) {
                  diagnosis += `🔴 上下文严重超限 (${contextCheck.percentage}%)，必须清理！\n`;
                } else if (contextCheck.percentage > 80) {
                  diagnosis += `🟡 上下文接近限制 (${contextCheck.percentage}%)，建议清理\n`;
                } else {
                  diagnosis += `✅ 上下文使用正常 (${contextCheck.percentage}%)\n`;
                }

                // 检查会话文件大小
                if (info.sessions && info.sessions.length > 0) {
                  const largeSession = info.sessions.find(s => s.sizeKB > 500);
                  if (largeSession) {
                    diagnosis += `⚠️ 发现大型会话文件 (${largeSession.sizeKB}KB)\n`;
                  }
                }

                showServiceNotification('诊断结果', diagnosis);
              }
            }
          ]
        },
        { type: 'separator' },
        {
          label: '🔍 诊断工具',
          submenu: [
            {
              label: '📊 完整诊断报告',
              click: async () => {
                const diagnostics = await openclawClient.getDiagnostics();

                let report = '=== OpenClaw 诊断报告 ===\n\n';

                // 连接状态
                report += `连接状态: ${diagnostics.connection.connected ? '✅ 已连接' : '❌ 未连接'}\n`;

                // 会话状态
                const contextIcon = diagnostics.session.contextPercentage > 80 ? '🔴' :
                                   diagnostics.session.contextPercentage > 50 ? '🟡' : '🟢';
                report += `\n会话状态:\n`;
                report += `${contextIcon} 上下文: ${diagnostics.session.contextPercentage}% (${diagnostics.session.estimatedTokens}/${diagnostics.session.contextLimit})\n`;
                report += `活跃会话: ${diagnostics.session.activeSessions} 个\n`;

                // 请求统计
                report += `\n请求统计:\n`;
                report += `总请求数: ${diagnostics.requests.total}\n`;
                report += `最近请求: ${diagnostics.requests.recentCount} 条\n`;

                // 错误统计
                report += `\n错误统计:\n`;
                report += `总错误数: ${diagnostics.errors.total}\n`;
                report += `最近错误: ${diagnostics.errors.recentCount} 条\n`;

                if (diagnostics.errors.recent.length > 0) {
                  report += `\n最近错误详情:\n`;
                  diagnostics.errors.recent.slice(0, 3).forEach(err => {
                    report += `- [Req#${err.requestId}] ${err.error} (${err.elapsed}ms)\n`;
                  });
                }

                showServiceNotification('诊断报告', report);
              }
            },
            {
              label: '❌ 查看最近错误',
              click: async () => {
                const errors = openclawClient.getRecentErrors(10);

                if (errors.length === 0) {
                  showServiceNotification('最近错误', '✅ 没有错误记录');
                  return;
                }

                let errorReport = `最近 ${errors.length} 条错误:\n\n`;
                errors.forEach((err, idx) => {
                  const time = new Date(err.timestamp).toLocaleTimeString();
                  errorReport += `${idx + 1}. [${time}] Req#${err.requestId}\n`;
                  errorReport += `   ${err.error} (${err.elapsed}ms)\n`;
                  errorReport += `   消息: ${err.message}\n\n`;
                });

                showServiceNotification('最近错误', errorReport);
              }
            },
            {
              label: '📝 查看最近请求',
              click: async () => {
                const requests = openclawClient.getRecentRequests(10);

                if (requests.length === 0) {
                  showServiceNotification('最近请求', '没有请求记录');
                  return;
                }

                let requestReport = `最近 ${requests.length} 条请求:\n\n`;
                requests.forEach((req, idx) => {
                  const time = new Date(req.timestamp).toLocaleTimeString();
                  const status = req.success ? '✅' : '❌';
                  requestReport += `${idx + 1}. ${status} [${time}] Req#${req.requestId} (${req.elapsed}ms)\n`;
                  requestReport += `   消息: ${req.message}\n`;
                  if (req.response) {
                    requestReport += `   响应: ${req.response}\n`;
                  }
                  requestReport += `\n`;
                });

                showServiceNotification('最近请求', requestReport);
              }
            },
            {
              label: '🏥 检查 Gateway 健康',
              click: async () => {
                showServiceNotification('正在检查...', 'Gateway 健康状态');

                const isConnected = await openclawClient.checkConnection();
                const status = serviceManager.getStatus();
                const uptime = serviceManager.formatUptime(serviceManager.getUptime('gateway'));

                let healthReport = 'Gateway 健康检查:\n\n';
                healthReport += `连接状态: ${isConnected ? '✅ 正常' : '❌ 异常'}\n`;
                healthReport += `进程状态: ${status.gateway.status === 'running' ? '✅ 运行中' : '❌ 已停止'}\n`;
                healthReport += `运行时间: ${uptime}\n`;

                if (status.gateway.pid) {
                  healthReport += `进程 PID: ${status.gateway.pid}\n`;
                }

                showServiceNotification('健康检查结果', healthReport);
              }
            }
          ]
        }
      ]
    },
    {
      label: '🏥 诊断工具箱',
      click: () => { openDiagnosticToolbox(); }
    },
    {
      label: '🌐 打开控制台',
      click: async () => {
        await openGatewayDashboard();
      }
    },
    {
      label: '设置',
      click: () => {}
    },
    {
      label: '🧙 KKClaw 新手引导',
      click: () => { reopenSetupWizard(); }
    },
    { type: 'separator' },
    {
      label: '🔄 恢复 Session',
      click: async () => {
        showServiceNotification('正在恢复...', '清理飞书会话缓存');
        try {
          const result = await doRefreshSession();
          showServiceNotification('恢复成功', `已清理 ${result.sessions?.length || 0} 个会话`);
        } catch(e) {
          showServiceNotification('恢复失败', e.message);
        }
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => { app.quit(); }
    }
  ]);
  tray.setContextMenu(contextMenu);
}

/**
 * 打开模型管理设置窗口
 */
let modelSettingsWindow = null;
function openModelSettings() {
  if (modelSettingsWindow && !modelSettingsWindow.isDestroyed()) {
    modelSettingsWindow.focus();
    return;
  }
  
  modelSettingsWindow = new BrowserWindow({
    width: 520,
    height: 640,
    title: 'KKClaw Switch',
    frame: false,
    resizable: true,
    minimizable: true,
    maximizable: false,
    autoHideMenuBar: true,
    backgroundColor: '#0f0f17',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  modelSettingsWindow.setMenuBarVisibility(false);
  modelSettingsWindow.loadFile('model-settings.html');

  // 转发渲染进程日志到主进程（方便排查）
  modelSettingsWindow.webContents.on('console-message', (event, level, message) => {
    const prefix = ['DEBUG', 'INFO', 'WARN', 'ERROR'][level] || 'LOG';
    console.log(`[model-settings][${prefix}] ${message}`);
  });
  modelSettingsWindow.webContents.on('preload-error', (event, preloadPath, error) => {
    console.error('❌ [model-settings preload-error]', preloadPath, error);
  });
  modelSettingsWindow.webContents.on('did-finish-load', async () => {
    try {
      const apiType = await modelSettingsWindow.webContents.executeJavaScript('typeof window.electronAPI');
      console.log(`[model-settings] electronAPI type = ${apiType}`);
    } catch (err) {
      console.error('❌ [model-settings] 检查 electronAPI 失败:', err.message);
    }
  });

  // F12 打开 DevTools
  modelSettingsWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12' && input.type === 'keyDown') {
      modelSettingsWindow.webContents.toggleDevTools();
    }
  });

  // 开发模式打开 DevTools
  if (process.argv.includes('--dev')) {
    modelSettingsWindow.webContents.openDevTools({ mode: 'detach' });
  }

  modelSettingsWindow.on('closed', () => {
    modelSettingsWindow = null;
  });
}

/**
 * 打开诊断工具箱窗口
 */
let diagnosticToolboxWindow = null;
function openDiagnosticToolbox() {
  if (diagnosticToolboxWindow && !diagnosticToolboxWindow.isDestroyed()) {
    diagnosticToolboxWindow.focus();
    return;
  }
  diagnosticToolboxWindow = new BrowserWindow({
    width: 600, height: 700, title: '诊断工具箱',
    resizable: true, minimizable: true, maximizable: false,
    autoHideMenuBar: true, backgroundColor: '#0f0f17',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  diagnosticToolboxWindow.setMenuBarVisibility(false);
  diagnosticToolboxWindow.loadFile('diagnostic-toolbox.html');
  diagnosticToolboxWindow.on('closed', () => { diagnosticToolboxWindow = null; });
}

function reopenSetupWizard() {
  if (setupWizardWindow && !setupWizardWindow.isDestroyed()) {
    setupWizardWindow.focus();
    return;
  }
  // Reset setupComplete so wizard can run
  petConfig.set('setupComplete', false);

  // Create wizard with current petConfig
  if (!setupWizard) {
    setupWizard = new SetupWizard(petConfig);
  } else {
    // Update config reference in case it was created with a different instance
    setupWizard.petConfig = petConfig;
  }

  setupWizardWindow = new BrowserWindow({
    width: 700,
    height: 550,
    title: 'KKClaw 新手引导',
    resizable: false,
    minimizable: true,
    maximizable: false,
    autoHideMenuBar: true,
    backgroundColor: '#3a7d2a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'setup-preload.js')
    }
  });
  setupWizardWindow.setMenuBarVisibility(false);
  setupWizardWindow.loadFile('setup-wizard.html');
  setupWizardWindow.on('closed', () => { setupWizardWindow = null; });

  // 🐛 Debug: 监听渲染进程错误
  setupWizardWindow.webContents.on('console-message', (e, level, msg, line, source) => {
    if (level >= 2) console.log(`[Wizard:ERROR] ${msg} (line:${line})`);
  });
  setupWizardWindow.webContents.on('did-fail-load', (e, code, desc) => {
    console.log(`[Wizard] did-fail-load: ${code} ${desc}`);
  });
}

// 屏幕边界约束 — 防止球体跑到屏幕外
function clampToScreen(x, y, winWidth = 200, winHeight = 260) {
  const displays = screen.getAllDisplays();
  // 获取所有显示器的总边界
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const display of displays) {
    const { x: dx, y: dy, width: dw, height: dh } = display.workArea;
    minX = Math.min(minX, dx);
    minY = Math.min(minY, dy);
    maxX = Math.max(maxX, dx + dw);
    maxY = Math.max(maxY, dy + dh);
  }
  // 球体在窗口中居中，约67px大小，窗口200x260
  // 确保窗口不超出屏幕边界（留少量边距让球体始终可见可拖）
  const padding = 10; // 窗口边缘到屏幕边缘的最小距离
  const clampedX = Math.max(minX - padding, Math.min(x, maxX - winWidth + padding));
  const clampedY = Math.max(minY - padding, Math.min(y, maxY - winHeight + padding));
  return { x: clampedX, y: clampedY };
}

// 拖动 — 精灵+歌词窗口同步（带屏幕围栏）
ipcMain.on('drag-pet', (event, { x, y, offsetX, offsetY }) => {
  if (!mainWindow) return;
  // 用鼠标的相对偏移精确定位，避免跳跃
  const rawX = x - (offsetX || 100);
  const rawY = y - (offsetY || 80);
  const { x: newX, y: newY } = clampToScreen(rawX, rawY);
  mainWindow.setPosition(newX, newY);
  // 歌词窗口跟随（在球体上方）
  if (lyricsWindow) {
    lyricsWindow.setPosition(newX - 100, newY - 110);
  }
  petConfig.set('position', { x: newX, y: newY });
});

// 三击查看历史消息
ipcMain.handle('show-history', async () => {
  try {
    const logs = workLogger.getRecentMessages ? workLogger.getRecentMessages(20) : [];
    // 在歌词窗口依次显示最近消息
    if (lyricsReady && logs.length > 0) {
      const recent = logs.slice(-5); // 最近5条
      for (let i = 0; i < recent.length; i++) {
        setTimeout(() => {
          sendLyric({
            text: recent[i].content || recent[i].message || '',
            type: recent[i].sender === '小K' ? 'agent' : 'user',
            sender: recent[i].sender || '',
            duration: 8000
          });
        }, i * 2000);
      }
    }
    return { success: true };
  } catch(e) {
    return { success: false, error: e.message };
  }
});

// OpenClaw 消息处理（串行队列 + 异常重试，避免流事件乱序）
let openclawSendQueue = Promise.resolve();
ipcMain.handle('openclaw-send', async (event, message) => {
  const run = async () => {
    workLogger.logMessage('用户', message);
    workLogger.logTask(`处理消息: ${message}`);

    let response = await openclawClient.sendMessage(message);

    // 兼容上游偶发流事件乱序：Unexpected event order
    if (typeof response === 'string' && response.includes('Unexpected event order')) {
      workLogger.log('warn', '检测到流事件乱序，正在自动重试一次');
      await new Promise(resolve => setTimeout(resolve, 600));
      response = await openclawClient.sendMessage(message);
    }

    if (response && !response.startsWith('请求失败') && !response.startsWith('连接失败') && !response.startsWith('错误')) {
      workLogger.logSuccess('消息发送成功');
      workLogger.log('message', `AI回复: ${response.substring(0, 100)}`);
    } else {
      workLogger.logError(response || '发送失败');
    }

    return response;
  };

  // 串行化发送，避免并发请求导致会话流事件顺序错乱
  const task = openclawSendQueue.then(run, run);
  openclawSendQueue = task.catch(() => {});
  return task;
});

ipcMain.handle('openclaw-status', async () => {
  const connected = await openclawClient.checkConnection();
  const status = await openclawClient.getStatus();
  return { connected, status };
});

// 🎙️ 语音控制
ipcMain.handle('set-voice-enabled', async (event, enabled) => {
  voiceSystem.toggle(enabled);
  petConfig.set('voiceEnabled', enabled);
  console.log(`🔊 语音${enabled ? '开启' : '关闭'}`);
  return true;
});

// 🔍 TTS 依赖检测
const TTSChecker = require('./voice/tts-checker');

ipcMain.handle('check-tts', async (event, config = {}) => {
  try {
    const results = await TTSChecker.checkAll({
      minimaxApiKey: config.minimaxApiKey || petConfig.get('minimax')?.apiKey,
      dashscopeApiKey: config.dashscopeApiKey || petConfig.get('dashscope')?.apiKey,
      tempDir: path.join(__dirname, 'temp')
    });
    return results;
  } catch (err) {
    console.error('[TTS Check] 检测失败:', err);
    return {
      error: err.message,
      recommended: 'none'
    };
  }
});

ipcMain.handle('install-edge-tts', async (event, pythonCmd) => {
  try {
    const result = await TTSChecker.installEdgeTTS(pythonCmd);
    return result;
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('install-python', async () => {
  try {
    const result = await TTSChecker.installPython();
    return result;
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('install-dashscope', async (event, pythonCmd) => {
  try {
    const result = await TTSChecker.installDashScope(pythonCmd);
    return result;
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 🔥 截图系统
ipcMain.handle('take-screenshot', async (event, reason = 'manual') => {
  try {
    workLogger.log('action', `📸 开始截图: ${reason}`);
    const filepath = await screenshotSystem.captureScreen(reason);

    // 上传到飞书
    await larkUploader.uploadToLark(filepath, `📸 ${reason}`);
    
    workLogger.log('success', `✅ 截图完成: ${filepath}`);
    
    return {
      success: true,
      filepath,
      reason
    };
  } catch (err) {
    workLogger.logError(`截图失败: ${err.message}`);
    return {
      success: false,
      error: err.message
    };
  }
});

// 🖥️ 首次启动自动创建桌面快捷方式（Windows + macOS）
function createDesktopShortcut() {
  const { colorLog } = require('./utils/color-log');
  const { execFile } = require('child_process');

  try {
    const desktopPath = app.getPath('desktop');
    const projectPath = path.resolve(__dirname);

    if (process.platform === 'win32') {
      _createWindowsShortcut(desktopPath, projectPath, colorLog, execFile);
    } else if (process.platform === 'darwin') {
      _createMacShortcut(desktopPath, projectPath, colorLog, execFile);
    }
  } catch (err) {
    console.error('❌ 创建桌面快捷方式异常:', err.message);
  }
}

// Windows: PowerShell COM 创建 .lnk
function _createWindowsShortcut(desktopPath, projectPath, colorLog, execFile) {
  const shortcutPath = path.join(desktopPath, 'Claw 桌面宠物.lnk');

  if (fs.existsSync(shortcutPath)) {
    colorLog('🖥️ 桌面快捷方式已存在，跳过创建');
    petConfig.set('shortcutCreated', true);
    return;
  }

  const iconPath = path.join(projectPath, 'icon.ico');
  const startCmd = path.join(projectPath, 'start.cmd');

  function escPS(value) {
    return value.replace(/'/g, "''");
  }

  // 快捷方式指向 start.cmd，这样会打开 CMD 控制台显示 Gateway 日志
  const psScript = [
    '$WshShell = New-Object -ComObject WScript.Shell',
    `$Shortcut = $WshShell.CreateShortcut('${escPS(shortcutPath)}')`,
    `$Shortcut.TargetPath = '${escPS(startCmd)}'`,
    `$Shortcut.WorkingDirectory = '${escPS(projectPath)}'`,
    "$Shortcut.Description = 'Claw 桌面宠物 - OpenClaw AI 助手'",
    `$Shortcut.IconLocation = '${escPS(iconPath)}'`,
    '$Shortcut.WindowStyle = 1',
    '$Shortcut.Save()'
  ].join('; ');

  colorLog('🖥️ 正在创建桌面快捷方式...');

  execFile('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psScript], (err) => {
    if (err) {
      console.error('❌ 创建桌面快捷方式失败:', err.message);
      return;
    }
    colorLog('🖥️ ✅ 桌面快捷方式创建成功!');
    petConfig.set('shortcutCreated', true);
    if (voiceSystem) voiceSystem.speak('桌面快捷方式已创建');
  });
}

// macOS: 创建 .app 启动器（AppleScript ��成 Application 快捷方式）
function _createMacShortcut(desktopPath, projectPath, colorLog, execFile) {
  const appName = 'Claw 桌面宠物.app';
  const appPath = path.join(desktopPath, appName);

  if (fs.existsSync(appPath)) {
    colorLog('🖥️ 桌面快捷方式已存在，跳过创建');
    petConfig.set('shortcutCreated', true);
    return;
  }

  colorLog('🖥️ 正在创建 macOS 桌面快捷方式...');

  // 构造 .app 目录结构
  const contentsDir = path.join(appPath, 'Contents');
  const macOSDir = path.join(contentsDir, 'MacOS');
  const resourcesDir = path.join(contentsDir, 'Resources');

  try {
    fs.mkdirSync(macOSDir, { recursive: true });
    fs.mkdirSync(resourcesDir, { recursive: true });

    // 1. 启动脚本
    const electronBin = path.join(projectPath, 'node_modules', '.bin', 'electron');
    const launchScript = `#!/bin/bash
cd "${projectPath}"
if [ -x "${electronBin}" ]; then
  "${electronBin}" "${projectPath}" &
else
  /usr/local/bin/npm start &
fi
`;
    const launchPath = path.join(macOSDir, 'launch');
    fs.writeFileSync(launchPath, launchScript, { mode: 0o755 });

    // 2. Info.plist
    const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key>
  <string>Claw 桌面宠物</string>
  <key>CFBundleDisplayName</key>
  <string>Claw 桌面宠物</string>
  <key>CFBundleIdentifier</key>
  <string>com.kk43994.kkclaw</string>
  <key>CFBundleVersion</key>
  <string>3.5.0</string>
  <key>CFBundleExecutable</key>
  <string>launch</string>
  <key>CFBundleIconFile</key>
  <string>icon</string>
  <key>LSUIElement</key>
  <false/>
</dict>
</plist>
`;
    fs.writeFileSync(path.join(contentsDir, 'Info.plist'), plist);

    // 3. 复制图标（如果 .icns 存在）
    const icnsPath = path.join(projectPath, 'icon.icns');
    if (fs.existsSync(icnsPath)) {
      fs.copyFileSync(icnsPath, path.join(resourcesDir, 'icon.icns'));
    }

    colorLog('🖥️ ✅ macOS 桌面快捷方式创建成功!');
    petConfig.set('shortcutCreated', true);
    if (voiceSystem) voiceSystem.speak('桌面快捷方式已创建');
  } catch (err) {
    console.error('❌ 创建 macOS 快捷方式失败:', err.message);
    // 兜底方案：创建符号链接
    try {
      const symlinkTarget = path.join(projectPath, 'node_modules', 'electron', 'dist', 'Electron.app');
      if (fs.existsSync(symlinkTarget)) {
        fs.symlinkSync(symlinkTarget, path.join(desktopPath, 'Claw 桌面宠物'), 'dir');
        colorLog('🖥️ ✅ macOS 桌面符号链接创建成功（降级方案）');
        petConfig.set('shortcutCreated', true);
      }
    } catch (linkErr) {
      console.error('❌ 降级符号链接也失败:', linkErr.message);
    }
  }
}

// 🔧 启动时修复配置：将 token_encrypted 恢复为 token（OpenClaw 不认识 token_encrypted）
function fixTokenEncryptedField() {
  try {
    const { safeStorage } = require('electron');
    const configPath = pathResolver.getConfigPath();

    if (!fs.existsSync(configPath)) return;

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    if (config.gateway?.auth?.token_encrypted) {
      console.log('[Config Fix] 检测到 token_encrypted 字段，正在恢复为 token...');

      const buffer = Buffer.from(config.gateway.auth.token_encrypted, 'base64');
      const plainToken = safeStorage.decryptString(buffer);

      config.gateway.auth.token = plainToken;
      delete config.gateway.auth.token_encrypted;
      delete config.gateway.auth.token_is_encrypted;

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log('[Config Fix] ✅ 配置已修复，Gateway 现在可以正常启动');
    }
  } catch (err) {
    console.error('[Config Fix] ⚠️ 修复失败:', err.message);
  }
}

app.whenReady().then(async () => {
  const pkg = require('./package.json');
  await printHero(pkg.version);

  // 首先修复配置
  fixTokenEncryptedField();

  await createWindow();
  console.log('\x1b[32m  ✅ Main window created\x1b[0m');

  // 🖥️ 首次启动自动创建桌面快捷方式（Windows + macOS）
  if (!petConfig.get('shortcutCreated') && (process.platform === 'win32' || process.platform === 'darwin')) {
    createDesktopShortcut();
  }

  // 🧙 首次运行自动弹出配置向导
  if (!petConfig.get('setupComplete')) {
    reopenSetupWizard();
  }
});

// 🔧 服务通知
function showServiceNotification(title, body) {
  new Notification({
    title: title,
    body: body,
    icon: path.join(__dirname, 'icon.png'),
    silent: true
  }).show();
}

// 🔧 更新托盘提示
function updateTrayTooltip() {
  if (!tray || !serviceManager) return;
  const status = serviceManager.getStatus();
  const gatewayStatus = status.gateway.status === 'running' ? '✅' : '❌';
  tray.setToolTip(`Claw 🦞 | Gateway: ${gatewayStatus}`);
}

// 🔄 模型切换 IPC
ipcMain.handle('model-current', async () => {
  return modelSwitcher ? modelSwitcher.getCurrent() : null;
});

ipcMain.handle('model-switch', async (event, modelId) => {
  if (!modelSwitcher) return { success: false, error: 'not initialized', model: null };
  const model = await modelSwitcher.switchTo(modelId);
  const result = modelSwitcher.getLastSwitchResult ? modelSwitcher.getLastSwitchResult() : null;
  if (result) return result;
  return {
    success: !!(model && model.id === modelId),
    error: model && model.id === modelId ? null : 'switch_failed',
    requestedModelId: modelId,
    resolvedApi: model?.api || null,
    model: model || null
  };
});

ipcMain.handle('model-switch-provider', async (event, providerName) => {
  if (!modelSwitcher) return { success: false, error: 'not initialized', model: null };
  const model = await modelSwitcher.switchToProvider(providerName);
  const result = modelSwitcher.getLastSwitchResult ? modelSwitcher.getLastSwitchResult() : null;
  if (result) return result;
  return {
    success: !!(model && model.provider === providerName),
    error: model && model.provider === providerName ? null : 'switch_failed',
    requestedProvider: providerName,
    resolvedApi: model?.api || null,
    model: model || null
  };
});

ipcMain.handle('model-next', async () => {
  if (!modelSwitcher) return { success: false, error: 'not initialized', model: null };
  const model = await modelSwitcher.next();
  const result = modelSwitcher.getLastSwitchResult ? modelSwitcher.getLastSwitchResult() : null;
  if (result) return result;
  return {
    success: !!model,
    error: model ? null : 'switch_failed',
    resolvedApi: model?.api || null,
    model: model || null
  };
});

// 🔄 Provider 管理 IPC
ipcMain.handle('model-full-status', async () => {
  return modelSwitcher ? modelSwitcher.getFullStatus() : null;
});

ipcMain.handle('model-presets', async () => {
  return modelSwitcher ? modelSwitcher.getPresets() : [];
});

ipcMain.handle('model-add-provider', async (event, name, opts) => {
  if (!modelSwitcher) return { error: 'not initialized' };

  const normalizedOpts = { ...(opts || {}) };
  if (normalizedOpts.baseUrl === undefined && typeof normalizedOpts.baseURL === 'string') {
    normalizedOpts.baseUrl = normalizedOpts.baseURL;
  }

  // 输入验证
  const IPCValidator = require('./utils/ipc-validator');
  const validation = IPCValidator.validateProvider({ name, ...normalizedOpts });
  if (!validation.valid) {
    return { error: `验证失败: ${validation.errors.join(', ')}` };
  }

  try {
    const result = modelSwitcher.addProvider(name, normalizedOpts);
    return { success: true, provider: result };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('model-add-from-preset', async (event, presetKey, apiKey, customName, customBaseUrl) => {
  if (!modelSwitcher) return { error: 'not initialized' };
  try {
    const result = modelSwitcher.addFromPreset(presetKey, apiKey, customName, customBaseUrl);
    return { success: true, provider: result };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('model-update-provider', async (event, name, updates) => {
  if (!modelSwitcher) return { error: 'not initialized' };
  try {
    const result = modelSwitcher.updateProvider(name, updates);
    return { success: true, provider: result };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('model-remove-provider', async (event, name) => {
  if (!modelSwitcher) return { error: 'not initialized' };
  try {
    modelSwitcher.removeProvider(name);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('model-add-model', async (event, providerName, model) => {
  if (!modelSwitcher) return { error: 'not initialized' };
  try {
    modelSwitcher.addModel(providerName, model);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 🔄 测速 IPC
ipcMain.handle('model-speed-test', async (event, providerName) => {
  if (!modelSwitcher) return { latencyMs: -1, status: 'error', error: 'not initialized' };
  return await modelSwitcher.speedTest(providerName);
});

ipcMain.handle('model-speed-test-all', async () => {
  if (!modelSwitcher) return {};
  return await modelSwitcher.speedTestAll();
});

ipcMain.handle('model-probe-provider', async (event, providerName, options) => {
  if (!modelSwitcher) return { success: false, error: 'not initialized' };
  try {
    return await modelSwitcher.probeProviderConnectivity(providerName, options || {});
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('model-remove-model', async (event, providerName, modelId) => {
  if (!modelSwitcher) return { error: 'not initialized' };
  try {
    modelSwitcher.removeModel(providerName, modelId);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('model-fetch-models', async (event, providerName) => {
  if (!modelSwitcher) return { success: false, error: 'not initialized' };
  return await modelSwitcher.fetchModels(providerName);
});

// 🔍 KKClaw Switch 监控日志 IPC
ipcMain.handle('switch-log-list', async (event, count, levelFilter) => {
  if (!modelSwitcher?.switchLog) return [];
  return modelSwitcher.switchLog.getRecent(count || 100, levelFilter || null);
});

ipcMain.handle('switch-log-clear', async () => {
  if (!modelSwitcher?.switchLog) return false;
  modelSwitcher.switchLog.clear();
  return true;
});

// 🔄 新增：模型切换状态和策略 IPC
ipcMain.handle('model-switch-state', async () => {
  if (!modelSwitcher) return null;
  return modelSwitcher.getSwitchState();
});

ipcMain.handle('model-switch-stats', async () => {
  if (!modelSwitcher) return null;
  return modelSwitcher.getSwitchStats();
});

ipcMain.handle('model-set-strategy', async (event, strategy) => {
  if (!modelSwitcher) return { success: false, error: 'not initialized' };
  try {
    modelSwitcher.setSwitchStrategy(strategy);
    return { success: true, strategy };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('model-switch-history', async (event, limit) => {
  if (!modelSwitcher) return [];
  return modelSwitcher.switchHistory.getRecent(limit || 10);
});

ipcMain.handle('model-sync-cc-switch', async () => {
  if (!modelSwitcher) return { success: false, error: 'not initialized' };
  try {
    modelSwitcher.syncFromCCSwitch();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('model-detect-package', async (event, providerName) => {
  if (!modelSwitcher) return { success: false, error: 'not initialized' };
  try {
    const available = await modelSwitcher.detectAvailableModels(providerName);
    const guess = modelSwitcher.guessPackage(available);
    return { success: true, available, guess };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('model-query-quota', async (event, providerName) => {
  if (!modelSwitcher) return { success: false, error: 'not initialized' };
  try {
    const quota = await modelSwitcher.queryQuota(providerName);
    return { success: true, quota };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('model-analyze-kkclaw', async (event, providerName) => {
  if (!modelSwitcher) return { success: false, error: 'not initialized' };
  try {
    const analysis = await modelSwitcher.analyzeKKCLAW(providerName);
    return { success: true, analysis };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('model-sync-preset', async (event, providerName) => {
  if (!modelSwitcher) return { success: false, error: 'not initialized' };
  try {
    const result = modelSwitcher.syncProviderModels(providerName);
    return result;
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 🏥 诊断工具箱 IPC
ipcMain.handle('diag-full-status', async () => {
  try {
    const health = performanceMonitor ? performanceMonitor.calculateHealthScore() : { score: 0, status: 'unknown', issues: [] };
    const stats = performanceMonitor ? performanceMonitor.getCurrentStats() : {};
    const gwStatus = serviceManager ? serviceManager.getStatus() : { gateway: {} };
    const guardian = gatewayGuardian ? gatewayGuardian.getStats() : {};
    let connection = { connected: false };
    try { connection = { connected: await openclawClient.checkConnection() }; } catch(e) { console.warn('[diag-status] checkConnection 失败:', e?.message || e); }
    let session = { activeSessions: 0, estimatedTokens: 0, contextPercentage: 0 };
    let requests = { total: 0, recentCount: 0, recent: [] };
    try {
      const diag = await openclawClient.getDiagnostics();
      session = diag.session || session;
      requests = diag.requests || requests;
    } catch(e) {
      console.warn('[diag-status] getDiagnostics 失败:', e?.message || e);
    }
    const ocErrors = openclawClient ? openclawClient.getRecentErrors(10) : [];
    const globalErrors = errorHandler ? errorHandler.getErrorHistory(10) : [];
    const gwUptime = serviceManager ? serviceManager.formatUptime(serviceManager.getUptime('gateway')) : '--';
    return {
      health,
      stats,
      gateway: { ...gwStatus.gateway, uptimeFormatted: gwUptime },
      guardian,
      connection,
      session,
      errors: { openclaw: ocErrors, global: globalErrors },
      requests: { total: requests.total, recentCount: requests.recentCount, recent: requests.recent || [] }
    };
  } catch (err) {
    return { health: { score: 0, status: 'error', issues: [err.message] }, stats: {}, gateway: {}, guardian: {}, connection: {}, session: {}, errors: {}, requests: {} };
  }
});

ipcMain.handle('diag-restart-gateway', async () => {
  if (!serviceManager) return { success: false, error: 'serviceManager 未初始化' };
  const result = await serviceManager.restartGateway();
  return { success: result.success, message: result.success ? 'Gateway 已重启' : (result.error || '重启失败'), error: result.error };
});

// 🔍 新增：Gateway 监控 IPC
ipcMain.handle('gateway-health-score', async () => {
  if (!gatewayGuardian) return null;
  return gatewayGuardian.getHealthScore();
});

ipcMain.handle('gateway-metrics', async () => {
  if (!gatewayGuardian) return null;
  return gatewayGuardian.getMetrics();
});

ipcMain.handle('gateway-anomalies', async () => {
  if (!gatewayGuardian) return [];
  return gatewayGuardian.getAnomalies();
});

ipcMain.handle('gateway-full-status', async () => {
  if (!gatewayGuardian) return null;
  return gatewayGuardian.getFullStatus();
});

ipcMain.handle('gateway-clear-metrics', async () => {
  if (!gatewayGuardian) return { success: false };
  gatewayGuardian.clearMetrics();
  return { success: true };
});

ipcMain.handle('diag-clear-session', async () => {
  if (!openclawClient) return { success: false, error: 'openclawClient 未初始化' };
  return await openclawClient.clearCurrentSession();
});

ipcMain.handle('diag-cleanup-cache', async () => {
  if (!cacheManager) return { success: false, error: 'cacheManager 未初始化' };
  try {
    const result = await cacheManager.triggerCleanup();
    return { success: true, message: '缓存清理完成' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('diag-kill-port', async () => {
  if (!serviceManager) return { success: false, error: 'serviceManager 未初始化' };
  try {
    const { port } = getGatewayConfig();
    await serviceManager._forceKillPort(port);
    await serviceManager._waitForPortFree(port);
    return { success: true, message: `端口 ${port} 已清理` };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 🩺 Doctor 自检
ipcMain.handle('diag-doctor', async () => {
  const checks = [];

  // 1. 主窗口
  checks.push({
    name: '主窗口',
    status: mainWindow && !mainWindow.isDestroyed() ? 'pass' : 'fail',
    message: mainWindow && !mainWindow.isDestroyed() ? '正常运行' : '窗口已销毁',
    fix: mainWindow ? null : '重启应用'
  });

  // 2. 歌词字幕窗口
  checks.push({
    name: '桌面字幕',
    status: lyricsWindow && !lyricsWindow.isDestroyed() ? 'pass' : 'fail',
    message: lyricsWindow && !lyricsWindow.isDestroyed() ? '正常运行' : '字幕窗口未创建或已销毁',
    fix: lyricsWindow ? null : '重启应用以恢复字幕窗口'
  });

  // 3. 托盘图标
  checks.push({
    name: '系统托盘',
    status: tray && !tray.isDestroyed() ? 'pass' : 'fail',
    message: tray && !tray.isDestroyed() ? '托盘图标正常' : '托盘未创建',
    fix: tray ? null : '重启应用'
  });

  // 4. Gateway 进程
  try {
    const gw = serviceManager ? serviceManager.getStatus() : null;
    const running = gw?.gateway?.status === 'running';
    checks.push({
      name: 'Gateway 进程',
      status: running ? 'pass' : 'fail',
      message: running ? '运行中' : '未运行',
      fix: running ? null : '尝试「重启 Gateway」或检查 OpenClaw CLI 是否安装'
    });
  } catch { checks.push({ name: 'Gateway 进程', status: 'fail', message: '检测异常', fix: '检查 service-manager 模块' }); }

  // 5. Gateway 通信
  try {
    const { port } = getGatewayConfig();
    const connected = openclawClient ? await openclawClient.checkConnection() : false;
    checks.push({
      name: 'Gateway 通信',
      status: connected ? 'pass' : 'fail',
      message: connected ? `端口 ${port} 连接正常` : '无法连接 Gateway',
      fix: connected ? null : `检查端口 ${port} 是否被占用，或尝试「清理端口」`
    });
  } catch { checks.push({ name: 'Gateway 通信', status: 'fail', message: '连接超时', fix: '检查网络或重启 Gateway' }); }

  // 6. OpenClaw CLI
  try {
    const ocConfigPath = path.join(process.env.HOME || process.env.USERPROFILE, '.openclaw', 'openclaw.json');
    const fs = require('fs');
    if (fs.existsSync(ocConfigPath)) {
      const ocConfig = JSON.parse(fs.readFileSync(ocConfigPath, 'utf-8'));
      const hasToken = !!(ocConfig.gateway?.auth?.token);
      checks.push({
        name: 'OpenClaw CLI',
        status: hasToken ? 'pass' : 'warn',
        message: hasToken ? 'openclaw.json 已配置，Token 存在' : 'openclaw.json 存在但缺少 Token',
        fix: hasToken ? null : '运行 openclaw 配置命令生成 Token'
      });
    } else {
      checks.push({ name: 'OpenClaw CLI', status: 'fail', message: 'openclaw.json 不存在', fix: '安装并配置 OpenClaw CLI' });
    }
  } catch { checks.push({ name: 'OpenClaw CLI', status: 'fail', message: '检测异常' }); }

  // 7. 通知服务
  try {
    const notifierUp = desktopNotifier && desktopNotifier.server !== null;
    checks.push({
      name: '通知服务',
      status: notifierUp ? 'pass' : 'fail',
      message: notifierUp ? `端口 ${desktopNotifier.getPort()} 运行中` : '未启动',
      fix: notifierUp ? null : '端口 18788 可能被占用，重启应用'
    });
  } catch { checks.push({ name: '通知服务', status: 'fail', message: '检测异常' }); }

  // 8. 语音引擎
  try {
    if (voiceSystem) {
      const engine = voiceSystem.ttsEngine;
      const hasMinimax = voiceSystem.minimax !== null;
      const stats = voiceSystem.getStats();

      let status = 'pass', message = '', fix = null;
      if (engine === 'edge') {
        status = 'warn';
        message = '使用 Edge TTS 兜底';
        fix = '检查 MiniMax API Key 是否正确配置';
      } else {
        message = 'MiniMax 引擎正常';
      }
      message += ` | MiniMax: ${hasMinimax ? '✓' : '✗'} | 回退: Edge TTS`;
      if (!stats.enabled) { status = 'warn'; message += ' | 语音已关闭'; }

      checks.push({ name: '语音引擎', status, message, fix });
    } else {
      checks.push({ name: '语音引擎', status: 'fail', message: '未初始化' });
    }
  } catch { checks.push({ name: '语音引擎', status: 'fail', message: '检测异常' }); }

  // 9. API Key 解密状态
  try {
    if (petConfig) {
      const issues = [];
      const minimax = petConfig.get('minimax');
      if (minimax?.apiKey && String(minimax.apiKey).startsWith('enc:')) issues.push('MiniMax Key 未解密');
      if (!minimax?.apiKey) issues.push('MiniMax API Key 未配置');
      checks.push({
        name: 'API Key',
        status: issues.length === 0 ? 'pass' : issues.some(i => i.includes('未解密')) ? 'fail' : 'warn',
        message: issues.length === 0 ? 'API Key 状态正常' : issues.join(', '),
        fix: issues.length > 0 ? '重新配置 API Key 或检查系统加密服务' : null
      });
    }
  } catch { checks.push({ name: 'API Key', status: 'fail', message: '检测异常' }); }

  // 10. 模型配置
  try {
    if (modelSwitcher) {
      const current = modelSwitcher.getCurrent();
      const full = modelSwitcher.getFullStatus();
      const providerCount = full.providers?.length || 0;
      const modelCount = full.models?.length || 0;
      checks.push({
        name: '模型配置',
        status: current ? 'pass' : 'warn',
        message: current ? `当前: ${current.shortName || current.id} | ${providerCount} 服务商, ${modelCount} 模型` : '未选择模型',
        fix: current ? null : '在 KKClaw Switch 中选择一个模型'
      });
    } else {
      checks.push({ name: '模型配置', status: 'fail', message: '模型切换器未初始化' });
    }
  } catch { checks.push({ name: '模型配置', status: 'fail', message: '检测异常' }); }

  // 11. Guardian 守护
  try {
    if (gatewayGuardian) {
      const gs = gatewayGuardian.getStats();
      let status = 'pass', message = '守护运行中';
      if (gs.consecutiveFailures > 0) {
        status = gs.consecutiveFailures >= 3 ? 'fail' : 'warn';
        message = `连续失败 ${gs.consecutiveFailures} 次`;
      }
      if (!gs.canRestart) {
        status = 'warn';
        message += ' | 重启次数已耗尽';
      }
      checks.push({ name: 'Guardian 守护', status, message, fix: status !== 'pass' ? '尝试手动重启 Gateway' : null });
    } else {
      checks.push({ name: 'Guardian 守护', status: 'warn', message: '未启动' });
    }
  } catch { checks.push({ name: 'Guardian 守护', status: 'fail', message: '检测异常' }); }

  // 12. 截图系统
  checks.push({
    name: '截图系统',
    status: screenshotSystem ? 'pass' : 'fail',
    message: screenshotSystem ? '已初始化' : '未初始化',
    fix: screenshotSystem ? null : '重启应用'
  });

  // 13. 飞书上传
  try {
    if (larkUploader) {
      const hasCredentials = larkUploader.appId && larkUploader.appSecret;
      checks.push({
        name: '飞书上传',
        status: hasCredentials ? 'pass' : 'warn',
        message: hasCredentials ? '凭证已配置' : '未配置飞书应用凭证（截图上传不可用）',
        fix: hasCredentials ? null : '在 OpenClaw 配置中设置飞书 appId / appSecret'
      });
    } else {
      checks.push({ name: '飞书上传', status: 'warn', message: '未初始化' });
    }
  } catch { checks.push({ name: '飞书上传', status: 'warn', message: '检测异常' }); }

  // 14. 系统健康
  try {
    if (performanceMonitor) {
      const h = performanceMonitor.calculateHealthScore();
      checks.push({
        name: '系统健康',
        status: h.score >= 70 ? 'pass' : h.score >= 40 ? 'warn' : 'fail',
        message: `评分 ${h.score}/100 (${h.status})` + (h.issues.length ? ` | ${h.issues.join(', ')}` : ''),
        fix: h.score < 70 ? '考虑清理缓存或重启应用' : null
      });
    }
  } catch { checks.push({ name: '系统健康', status: 'fail', message: '检测异常' }); }

  // 15. 临时目录
  try {
    const fs = require('fs');
    const tempDir = path.join(__dirname, 'temp');
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      const sizeMB = files.reduce((sum, f) => {
        try { return sum + fs.statSync(path.join(tempDir, f)).size; } catch { return sum; }
      }, 0) / (1024 * 1024);
      checks.push({
        name: '临时目录',
        status: sizeMB < 100 ? 'pass' : sizeMB < 500 ? 'warn' : 'fail',
        message: `${files.length} 个文件, ${sizeMB.toFixed(1)}MB`,
        fix: sizeMB >= 100 ? '使用「清理缓存」释放空间' : null
      });
    } else {
      checks.push({ name: '临时目录', status: 'pass', message: '目录不存在（无缓存）' });
    }
  } catch { checks.push({ name: '临时目录', status: 'warn', message: '检测异常' }); }

  // 16. 配置文件
  try {
    const fs = require('fs');
    const configPath = path.join(__dirname, 'pet-config.json');
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      JSON.parse(raw);
      checks.push({ name: '配置文件', status: 'pass', message: 'pet-config.json 正常' });
    } else {
      checks.push({ name: '配置文件', status: 'warn', message: '配置文件不存在，使用默认配置' });
    }
  } catch (e) {
    checks.push({ name: '配置文件', status: 'fail', message: `配置文件损坏: ${e.message}`, fix: '删除 pet-config.json 让应用重新生成' });
  }

  // 17. 错误处理器
  try {
    if (errorHandler) {
      const recentErrors = errorHandler.getRecentErrors ? errorHandler.getRecentErrors() : [];
      const criticalCount = Array.isArray(recentErrors) ? recentErrors.filter(e => e.critical).length : 0;
      checks.push({
        name: '错误处理',
        status: criticalCount === 0 ? 'pass' : 'warn',
        message: criticalCount === 0 ? '无严重错误' : `${criticalCount} 个严重错误`,
        fix: criticalCount > 0 ? '查看历史记录中的错误详情' : null
      });
    } else {
      checks.push({ name: '错误处理', status: 'warn', message: '未初始化' });
    }
  } catch { checks.push({ name: '错误处理', status: 'pass', message: '运行中' }); }

  const passed = checks.filter(c => c.status === 'pass').length;
  const warned = checks.filter(c => c.status === 'warn').length;
  const failed = checks.filter(c => c.status === 'fail').length;

  return { checks, summary: { total: checks.length, passed, warned, failed } };
});

// 🆘 刷新 Session - 清理损坏会话
async function doRefreshSession() {
  try {
    // 先停 Gateway，再做强制清理，避免删除活跃锁
    if (serviceManager) {
      await serviceManager.stopGateway();
    }

    const cleanupResult = SessionLockManager.cleanupPluginSessions({
      agentId: 'main',
      removeIndex: true,
      force: true,
      lockStaleMs: 10000
    });
    const staleLockResult = SessionLockManager.cleanupStaleLocks({
      agentId: 'main',
      force: true,
      lockStaleMs: 10000
    });

    const deletedCount = cleanupResult.deletedSessions;
    const removedLocks = cleanupResult.removedLocks + staleLockResult.removedLocks;
    const pluginSessions = cleanupResult.details
      .filter(item => item && item.sessionId)
      .map(item => item.sessionId);

    // 记录日志
    workLogger.log('action', `🆘 卡死脱离: 删除 ${deletedCount} 个会话, 清理 ${removedLocks} 个锁`);

    // 重新启动 gateway
    if (serviceManager) {
      await serviceManager.startGateway();
    }

    // 语音提示
    if (voiceSystem) {
      voiceSystem.speak('会话已清理完成，从聊天插件发送任何消息即可恢复对话');
    }

    return {
      success: true,
      deleted: deletedCount,
      removedLocks,
      skippedLocked: cleanupResult.skippedLocked,
      sessions: pluginSessions
    };
  } catch (err) {
    workLogger.logError(`卡死脱离失败: ${err.message}`);
    return {
      success: false,
      error: err.message
    };
  }
}

ipcMain.handle('refresh-session', async () => {
  return doRefreshSession();
});

app.on('before-quit', () => {
  // 清理歌词窗口
  if (lyricsWindow && !lyricsWindow.isDestroyed()) {
    lyricsWindow.destroy();
    lyricsWindow = null;
  }

  // 清理资源
  if (gatewayGuardian) {
    gatewayGuardian.stop();
  }
  if (cacheManager) {
    cacheManager.stop();
  }
  if (serviceManager) {
    serviceManager.stop();
  }
  if (messageSync) {
    messageSync.disconnect();
  }
  if (desktopNotifier) {
    desktopNotifier.stop();
  }
  if (voiceSystem) {
    voiceSystem.stop();
  }
  if (workLogger) {
    workLogger.log('success', '桌面应用正常退出');
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
