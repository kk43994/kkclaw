const { app, BrowserWindow, ipcMain, screen, Menu, Tray, Notification, shell } = require('electron');
const path = require('path');
const fs = require('fs');
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
const GlobalErrorHandler = require('./global-error-handler'); // 🛡️ 全局错误处���
const GatewayGuardian = require('./gateway-guardian'); // 🛡️ Gateway 进程守护

// Windows透明窗口修复 — 禁用硬件加速彻底解决浅色背景矩形框
app.disableHardwareAcceleration();

// 读取 OpenClaw 配置获取 token 和端口
function getGatewayConfig() {
  try {
    const configPath = path.join(process.env.HOME || process.env.USERPROFILE, '.openclaw', 'openclaw.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return {
      port: config.gateway?.port || 18789,
      token: config.gateway?.auth?.token || 'f341263d57a0efcbc83c69c6d9e2b2e0f885aaacb35572dd'
    };
  } catch (err) {
    return {
      port: 18789,
      token: 'f341263d57a0efcbc83c69c6d9e2b2e0f885aaacb35572dd'
    };
  }
}

// 读取 OpenClaw 配置获取 token
function getGatewayToken() {
  const config = getGatewayConfig();
  return config.token;
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
let restartHandler; // 🔄 自动重启处理器
let performanceMonitor; // 📊 性能监控
let logRotation; // 📝 日志轮转
let errorHandler; // 🛡️ 全局错误处理
let gatewayGuardian; // 🛡️ Gateway 进程守护

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
  console.log(`🔄 自动重启完成 (原因: ${process.env.RESTART_REASON})`);
  performanceMonitor.incrementStat('restarts');
}

async function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  // 加载配置
  petConfig = new PetConfig();
  await petConfig.load();
  
  // 初始化所有系统
  openclawClient = new OpenClawClient();
  voiceSystem = new SmartVoiceSystem(); // 🎙️ 智能语音系统
  workLogger = new WorkLogger();
  messageSync = new MessageSyncSystem(openclawClient);
  desktopNotifier = new DesktopNotifier(18788);
  await desktopNotifier.start(); // 异步启动，自动处理端口冲突
  screenshotSystem = new ScreenshotSystem(); // 🔥 新增
  larkUploader = new LarkUploader(); // 🔥 新增
  serviceManager = new ServiceManager(); // 🔧 服务管理
  
  // 🧹 初始化缓存管理器
  cacheManager = new CacheManager({
    interval: 6 * 60 * 60 * 1000,  // 6小时清理一次
    screenshots: 50,                // 保留50张截图
    voiceFiles: 100,                // 保留100个语音文件
    logDays: 30,                    // 保留30天日志
    onCleanup: (result) => {
      // 清理完成回调
      console.log(`🧹 自动清理完成: ${result.freedMB}MB`);
      
      // 🎙️ 智能语音播报
      if (voiceSystem && result.freedMB > 10) {
        voiceSystem.speak(`清理缓存完成，释放了${Math.round(result.freedMB)}兆字节空间`, {
          priority: 'normal'
        });
      } else if (voiceSystem && result.freedMB > 0) {
        voiceSystem.speak(`完成例行缓存清理`, { priority: 'low' });
      }
      
      // 通知桌面
      if (mainWindow) {
        mainWindow.webContents.send('cache-cleaned', result);
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

  // 🛡️ 启动 Gateway 进程守护
  gatewayGuardian = new GatewayGuardian({
    checkInterval: 5000,        // 每5秒检查一次
    maxRestarts: 10,            // 1小时内最多重启10次
    restartWindow: 60 * 60 * 1000, // 1小时窗口
    gatewayHost: 'http://127.0.0.1:18789'
  });

  // 监听 Guardian 事件
  gatewayGuardian.on('unhealthy', (info) => {
    console.log(`🚨 Gateway 不健康: ${info.reason}, 连续失败 ${info.consecutiveFailures} 次`);
    if (voiceSystem) {
      voiceSystem.speak('检测到Gateway异常，正在自动恢复', { priority: 'high' });
    }
    workLogger.log('error', `Gateway 不健康: ${info.reason}`);
  });

  gatewayGuardian.on('restarted', (info) => {
    console.log(`✅ Gateway 已自动重启 (第 ${info.restartCount}/${info.maxRestarts} 次)`);
    if (voiceSystem) {
      voiceSystem.speak('Gateway已自动重启', { priority: 'normal' });
    }
    workLogger.log('success', `Gateway 自动重启成功 (${info.restartCount}/${info.maxRestarts})`);
  });

  gatewayGuardian.on('restart-limit-reached', (info) => {
    console.log('❌ Gateway 重启次数过多，已停止自动重启');
    if (voiceSystem) {
      voiceSystem.speak('Gateway频繁异常，已停止自动重启，请检查日志', { priority: 'high' });
    }
    workLogger.logError(`Gateway 重启次数过多 (${info.restartHistory.length} 次)`);

    // 发送桌面通知
    new Notification({
      title: 'OpenClaw Gateway 异常',
      body: 'Gateway 频繁重启，已停止自动恢复。请检查日志或手动重启。',
      icon: path.join(__dirname, 'icon.png')
    }).show();
  });

  gatewayGuardian.on('restart-failed', (info) => {
    console.log('❌ Gateway 重启失败:', info.error);
    workLogger.logError(`Gateway 重启失败: ${info.error}`);
  });

  // 启动守护
  gatewayGuardian.start();

  // 🔄 心跳检测 - 自动恢复语音播报连接
  let lastSuccessfulPing = Date.now();
  let consecutiveFailures = 0;
  let isRecovering = false; // 防止重复恢复

  const heartbeatCheck = setInterval(async () => {
    try {
      const connected = await openclawClient.checkConnection();

      if (connected) {
        lastSuccessfulPing = Date.now();
        consecutiveFailures = 0;
        isRecovering = false;
      } else {
        consecutiveFailures++;
        const timeSinceLastSuccess = Date.now() - lastSuccessfulPing;

        // 如果连续失败3次且超过30秒没响应，尝试自动恢复
        if (consecutiveFailures >= 3 && timeSinceLastSuccess > 30000 && !isRecovering) {
          isRecovering = true;
          console.log('🔄 检测到 OpenClaw 掉线，尝试自动恢复...');

          if (voiceSystem) {
            voiceSystem.speak('检测到连接断开，正在自动恢复');
          }

          // 重启 gateway
          const result = await serviceManager.restartGateway();

          if (result.success) {
            // 重置计数
            consecutiveFailures = 0;
            lastSuccessfulPing = Date.now();

            workLogger.log('success', '自动恢复成功');

            if (voiceSystem) {
              voiceSystem.speak('连接已自动恢复');
            }
          } else {
            workLogger.logError(`自动恢复失败: ${result.error || '未知错误'}`);

            // 恢复失败，等待下一次尝试
            setTimeout(() => {
              isRecovering = false;
            }, 60000); // 1分钟后允许再次尝试
          }

          isRecovering = false;
        }
      }
    } catch (err) {
      console.error('心跳检测失败:', err.message);
    }
  }, 10000); // 每10秒检查一次

  // 监听服务状态变化
  serviceManager.on('status-change', (change) => {
    console.log(`🔧 服务状态变化: ${change.service} ${change.previousStatus} -> ${change.currentStatus}`);

    if (mainWindow) {
      mainWindow.webContents.send('service-status', serviceManager.getStatus());
    }

    // 更新托盘图标提示
    updateTrayTooltip();

    // 🎙️ 服务状态播报
    if (change.currentStatus === 'stopped' && change.previousStatus === 'running') {
      showServiceNotification('OpenClaw 服务已断开', '点击托盘图标可重启服务');
      if (voiceSystem) {
        voiceSystem.speak('OpenClaw服务断开连接', { priority: 'high' });
      }
    } else if (change.currentStatus === 'running' && change.previousStatus !== 'running') {
      if (voiceSystem) {
        voiceSystem.speak('OpenClaw服务已连接', { priority: 'normal' });
      }

      // 🔄 Gateway 重启后自动重连
      if (change.service === 'gateway') {
        setTimeout(async () => {
          try {
            await openclawClient.checkConnection();
            console.log('✅ Gateway 重启后已重新连接');
            workLogger.log('success', 'Gateway 重启后已重新连接');
          } catch (err) {
            console.error('重连失败:', err.message);
          }
        }, 2000);
      }
    }
  });

  serviceManager.on('log', (entry) => {
    if (mainWindow) {
      mainWindow.webContents.send('service-log', entry);
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
      if (lyricsWindow) {
        lyricsWindow.webContents.send('show-lyric', {
          text: payload.content,
          type: 'user',
          sender: payload.sender || '用户'
        });
      }
      workLogger.logMessage(payload.sender || '用户', payload.content);
      
      // 🔔 Windows 系统通知
      if (!mainWindow.isFocused()) {
        new Notification({
          title: payload.sender || '用户',
          body: payload.content.substring(0, 100),
          icon: path.join(__dirname, 'icon.png')
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
      mainWindow.webContents.send('agent-response', {
        content: payload.content
      });
      // 歌词窗口显示（等语音播完后消失）
      if (lyricsWindow) {
        // 估算语音时长：中文约每字0.18秒，最少6秒
        const estimatedDuration = Math.max(6000, (payload.content || '').length * 180 + 2000);
        lyricsWindow.webContents.send('show-lyric', {
          text: payload.content,
          type: 'agent',
          sender: '小K',
          duration: estimatedDuration
        });
      }
      // 直接在这里触发语音,完整播放(最多500字符)
      if (payload.content && voiceSystem) {
        const maxLength = 800; // 增加到800字,约2-3分钟 // 增加到500字符,约1-2分钟
        const voiceText = payload.content.substring(0, maxLength);
        voiceSystem.speak(voiceText);
      }
      workLogger.log('message', `我回复: ${payload.content}`);
    }
  });
  
  // 监听消息同步事件
  messageSync.on('new_message', (msg) => {
    if (mainWindow) {
      mainWindow.webContents.send('new-message', msg);
      if (lyricsWindow) {
        lyricsWindow.webContents.send('show-lyric', {
          text: msg.content, type: 'user', sender: msg.sender
        });
      }
      workLogger.logMessage(msg.sender, msg.content);
      console.log('📩 新消息:', msg.sender, '-', msg.content.substring(0, 50));
      
      // 🔥 添加语音播报用户消息
      if (msg.content) {
        voiceSystem.speak(msg.content.substring(0, 500)); // 用户消息也播报
      }
    }
  });
  
  messageSync.on('agent_response', (response) => {
    if (mainWindow) {
      mainWindow.webContents.send('agent-response', response);
      if (lyricsWindow) {
        lyricsWindow.webContents.send('show-lyric', {
          text: response.content, type: 'agent', sender: '小K'
        });
      }
      if (response.content) {
        voiceSystem.speak(response.content.substring(0, 200));
        workLogger.log('message', `我回复: ${response.content}`);
      }
    }
  });
  
  messageSync.on('status_change', (status) => {
    if (mainWindow) {
      mainWindow.webContents.send('status-update', status);
    }
  });
  
  mainWindow = new BrowserWindow({
    width: 200,
    height: 260,
    x: petConfig.get('position')?.x || width - 200,
    y: petConfig.get('position')?.y || height - 200,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');

  // 注入CSS强制禁止滚动条
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.insertCSS(`
      html, body, * { overflow: hidden !important; scrollbar-width: none !important; }
      ::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
    `);
  });

  // 歌词窗口 — 桌面歌词效果
  const petPos = mainWindow.getPosition();
  const petSize = mainWindow.getSize();
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
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  lyricsWindow.loadFile('lyrics.html');
  lyricsWindow.setIgnoreMouseEvents(true); // 完全鼠标穿透！
  
  // 窗口加载完成后发送测试通知
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('🎉 精灵窗口加载完成');
    setTimeout(() => {
      // 在歌词窗口显示欢迎消息
      if (lyricsWindow) {
        lyricsWindow.webContents.send('show-lyric', {
          text: '龙虾待命 🦞',
          type: 'system',
          sender: '系统'
        });
      }
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
        }
      ]
    },
    {
      label: '🌐 打开控制台',
      click: () => {
        const token = getGatewayToken();
        shell.openExternal(`http://127.0.0.1:18789/?token=${token}`);
      }
    },
    {
      label: '设置',
      click: () => {
        // TODO: 打开设置窗口
      }
    },
    { type: 'separator' },
    {
      label: '🔄 恢复 Session',
      click: async () => {
        showServiceNotification('正在恢复...', '清理飞书会话缓存');
        try {
          const result = await mainWindow.webContents.executeJavaScript(
            `require('electron').ipcRenderer.invoke('refresh-session')`
          );
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

  // 创建系统托盘图标
  tray = new Tray(path.join(__dirname, 'icon.png'));
  tray.setToolTip('Claw - 你的数字助手');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
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
  // 留出至少30px在屏幕内，这样用户总能拖回来
  const margin = 30;
  const clampedX = Math.max(minX - winWidth + margin, Math.min(x, maxX - margin));
  const clampedY = Math.max(minY, Math.min(y, maxY - margin));
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

ipcMain.on('move-window', (event, { x, y }) => {
  if (!mainWindow) return;
  const [currentX, currentY] = mainWindow.getPosition();
  const rawX = currentX + x;
  const rawY = currentY + y;
  const { x: newX, y: newY } = clampToScreen(rawX, rawY);
  mainWindow.setPosition(newX, newY);
  if (lyricsWindow) {
    lyricsWindow.setPosition(newX - 100, newY - 110);
  }
  petConfig.set('position', { x: newX, y: newY });
});

ipcMain.on('quit-app', () => {
  app.quit();
});

// 三击查看历史消息
ipcMain.handle('show-history', async () => {
  try {
    const logs = workLogger.getRecentMessages ? workLogger.getRecentMessages(20) : [];
    // 在歌词窗口依次显示最近消息
    if (lyricsWindow && logs.length > 0) {
      const recent = logs.slice(-5); // 最近5条
      for (let i = 0; i < recent.length; i++) {
        setTimeout(() => {
          lyricsWindow.webContents.send('show-lyric', {
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

// OpenClaw 消息处理
ipcMain.handle('openclaw-send', async (event, message) => {
  workLogger.logMessage('用户', message);
  workLogger.logTask(`处理消息: ${message}`);
  
  const response = await openclawClient.sendMessage(message);
  
  if (response && !response.startsWith('连接失败') && !response.startsWith('错误')) {
    workLogger.logSuccess('消息发送成功');
    workLogger.log('message', `AI回复: ${response.substring(0, 100)}`);
  } else {
    workLogger.logError(response || '发送失败');
  }
  
  return response;
});

ipcMain.handle('openclaw-status', async () => {
  const connected = await openclawClient.checkConnection();
  const status = await openclawClient.getStatus();
  return { connected, status };
});

// 语音系统
ipcMain.handle('voice-speak', async (event, text, options = {}) => {
  workLogger.logVoice(text, 'speaking');
  await voiceSystem.speak(text, options);
  return true;
});

ipcMain.handle('voice-stop', async () => {
  voiceSystem.stop();
  return true;
});

// 🎙️ 语音控制增强
ipcMain.handle('set-voice-enabled', async (event, enabled) => {
  voiceSystem.toggle(enabled);
  petConfig.set('voiceEnabled', enabled);
  console.log(`🔊 语音${enabled ? '开启' : '关闭'}`);
  return true;
});

ipcMain.handle('voice-stats', async () => {
  return voiceSystem.getStats();
});

ipcMain.handle('voice-set-mode', async (event, mode) => {
  voiceSystem.setMode(mode);
  return true;
});

ipcMain.handle('voice-clear-queue', async () => {
  voiceSystem.clearQueue();
  return true;
});

// 工作日志
ipcMain.handle('get-today-log', async () => {
  return await workLogger.getTodayLog();
});

ipcMain.handle('log-event', async (event, type, content, metadata) => {
  return await workLogger.log(type, content, metadata);
});

// 消息同步状态
ipcMain.handle('sync-status', async () => {
  return {
    connected: messageSync.isConnected,
    recentMessages: messageSync.getRecentMessages(5)
  };
});

// 测试: 模拟飞书消息
ipcMain.handle('simulate-message', async (event, sender, content) => {
  messageSync.simulateMessage(sender, content);
  workLogger.log('message', `[模拟] ${sender}: ${content}`);
  return true;
});

// 🔥 截图系统
ipcMain.handle('take-screenshot', async (event, reason = 'manual') => {
  try {
    workLogger.log('action', `📸 开始截图: ${reason}`);
    const filepath = await screenshotSystem.captureScreen(reason);
    
    // 通知桌面显示
    if (mainWindow) {
      mainWindow.webContents.send('screenshot-taken', {
        filepath,
        reason,
        timestamp: Date.now()
      });
    }
    
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

// 获取最近截图
ipcMain.handle('get-recent-screenshots', async (event, count = 5) => {
  return await screenshotSystem.getRecentScreenshots(count);
});

// 清理旧截图
ipcMain.handle('cleanup-screenshots', async (event, keep = 20) => {
  await screenshotSystem.cleanupOld(keep);
  return true;
});

// 🧹 缓存管理 IPC
ipcMain.handle('cache-cleanup', async () => {
  return await cacheManager.triggerCleanup();
});

ipcMain.handle('cache-stats', async () => {
  return cacheManager.getStats();
});

// 🔄 重启管理 IPC
ipcMain.handle('restart-stats', async () => {
  return restartHandler.getStats();
});

ipcMain.handle('force-restart', async (event, reason = 'manual') => {
  console.log(`🔄 手动触发重启: ${reason}`);
  restartHandler.restart(reason);
  return true;
});

// 📊 性能监控 IPC
ipcMain.handle('performance-stats', async () => {
  return performanceMonitor.getCurrentStats();
});

ipcMain.handle('performance-history', async (event, minutes = 60) => {
  return performanceMonitor.getHistoryData(minutes);
});

ipcMain.handle('performance-report', async () => {
  return await performanceMonitor.generateReport();
});

ipcMain.handle('health-check', async () => {
  return performanceMonitor.calculateHealthScore();
});

// 📝 日志管理 IPC
ipcMain.handle('log-stats', async () => {
  return await logRotation.getStats();
});

ipcMain.handle('log-list', async (event, count = 10) => {
  return await logRotation.listRecentLogs(count);
});

ipcMain.handle('log-read', async (event, filename, lines = 100) => {
  return await logRotation.readLog(filename, lines);
});

ipcMain.handle('log-rotate', async () => {
  return await logRotation.rotate();
});

// 🛡️ 错误处理 IPC
ipcMain.handle('error-stats', async () => {
  return errorHandler.getStats();
});

ipcMain.handle('error-history', async (event, count = 10) => {
  return errorHandler.getErrorHistory(count);
});

app.whenReady().then(createWindow);

// 🔧 服务通知
function showServiceNotification(title, body) {
  new Notification({
    title: title,
    body: body,
    icon: path.join(__dirname, 'icon.png')
  }).show();
}

// 🔧 更新托盘提示
function updateTrayTooltip() {
  if (!tray || !serviceManager) return;
  const status = serviceManager.getStatus();
  const gatewayStatus = status.gateway.status === 'running' ? '✅' : '❌';
  tray.setToolTip(`Claw 🦞 | Gateway: ${gatewayStatus}`);
}

// 🔧 服务管理 IPC
ipcMain.handle('service-status', async () => {
  return serviceManager.getStatus();
});

ipcMain.handle('service-start-gateway', async () => {
  return await serviceManager.startGateway();
});

ipcMain.handle('service-stop-gateway', async () => {
  return await serviceManager.stopGateway();
});

ipcMain.handle('service-restart-gateway', async () => {
  return await serviceManager.restartGateway();
});

ipcMain.handle('service-logs', async (event, count) => {
  return serviceManager.getRecentLogs(count || 50);
});

// 🆘 刷新 Session - 清理损坏会话
ipcMain.handle('refresh-session', async () => {
  try {
    const path = require('path');
    const fs = require('fs');

    const sessionDir = path.join(process.env.HOME || process.env.USERPROFILE, '.openclaw', 'agents', 'main', 'sessions');
    const sessionFile = path.join(sessionDir, 'sessions.json');

    // 读取 sessions.json 获取飞书对应的 session
    let larkSessions = [];
    let deletedCount = 0;

    if (fs.existsSync(sessionFile)) {
      const sessionsData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));

      // 查找所有 lark 相关的 session
      for (const [key, value] of Object.entries(sessionsData)) {
        if (key.includes('lark:') && value.sessionId) {
          larkSessions.push(value.sessionId);
        }
      }
    }

    // 删除对应的 session 文件
    for (const sessionId of larkSessions) {
      const sessionPath = path.join(sessionDir, `${sessionId}.jsonl`);
      const lockPath = path.join(sessionDir, `${sessionId}.jsonl.lock`);

      if (fs.existsSync(sessionPath)) {
        fs.unlinkSync(sessionPath);
        deletedCount++;
      }
      if (fs.existsSync(lockPath)) {
        fs.unlinkSync(lockPath);
      }
    }

    // 记录日志
    workLogger.log('action', `🆘 卡死脱离: 删除 ${deletedCount} 个会话`);

    // 重启 gateway
    if (serviceManager) {
      await serviceManager.restartGateway();
    }

    // 语音提示
    if (voiceSystem) {
      voiceSystem.speak('会话已清理完成，从飞书发送任何消息即可恢复对话');
    }

    return {
      success: true,
      deleted: deletedCount,
      sessions: larkSessions
    };
  } catch (err) {
    workLogger.logError(`卡死脱离失败: ${err.message}`);
    return {
      success: false,
      error: err.message
    };
  }
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
