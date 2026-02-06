const { app, BrowserWindow, ipcMain, screen, Menu, Tray, Notification } = require('electron');
const path = require('path');
const OpenClawClient = require('./openclaw-client');
const VoiceSystem = require('./working-voice'); // 18:04能听到的版本
const MessageSyncSystem = require('./message-sync');
const WorkLogger = require('./work-logger');
const DesktopNotifier = require('./desktop-notifier');
const PetConfig = require('./pet-config');

let mainWindow;
let tray;
let openclawClient;
let voiceSystem;
let messageSync;
let workLogger;
let desktopNotifier;
let petConfig;

async function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  // 加载配置
  petConfig = new PetConfig();
  await petConfig.load();
  
  // 初始化所有系统
  openclawClient = new OpenClawClient();
  voiceSystem = new VoiceSystem();
  workLogger = new WorkLogger();
  messageSync = new MessageSyncSystem(openclawClient);
  desktopNotifier = new DesktopNotifier(18788);
  
  // 记录启动
  workLogger.log('success', '桌面应用启动成功');
  
  // 启动消息同步
  messageSync.connect();
  
  // 启动桌面通知服务器
  desktopNotifier.start();
  
  // 监听桌面通知
  desktopNotifier.on('user-message', (payload) => {
    console.log('👤 用户消息:', payload);
    if (mainWindow) {
      mainWindow.webContents.send('new-message', {
        sender: payload.sender || '用户',
        content: payload.content,
        channel: 'lark'
      });
      workLogger.logMessage(payload.sender || '用户', payload.content);
    }
  });
  
  desktopNotifier.on('agent-response', (payload) => {
    console.log('🤖 AI回复:', payload);
    if (mainWindow) {
      mainWindow.webContents.send('agent-response', {
        content: payload.content
      });
      // 直接在这里触发语音,完整播放(最多500字符)
      if (payload.content && voiceSystem) {
        const maxLength = 500; // 增加到500字符,约1-2分钟
        const voiceText = payload.content.substring(0, maxLength);
        voiceSystem.speak(voiceText);
      }
      workLogger.log('message', `我回复: ${payload.content}`);
    }
  });
  
  // 监听消息同步事件
  messageSync.on('new_message', (msg) => {
    // 新消息到达,通知桌面
    if (mainWindow) {
      mainWindow.webContents.send('new-message', msg);
      workLogger.logMessage(msg.sender, msg.content);
      console.log('📩 新消息:', msg.sender, '-', msg.content.substring(0, 50));
    }
  });
  
  messageSync.on('agent_response', (response) => {
    // AI 回复,显示并播放语音
    if (mainWindow) {
      mainWindow.webContents.send('agent-response', response);
      if (response.content) {
        voiceSystem.speak(response.content.substring(0, 200));
        workLogger.log('message', `我回复: ${response.content}`);
      }
    }
  });
  
  messageSync.on('status_change', (status) => {
    // 状态变化
    if (mainWindow) {
      mainWindow.webContents.send('status-update', status);
    }
  });
  
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    x: petConfig.get('position')?.x || width - 450,
    y: petConfig.get('position')?.y || height - 650,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
  
  // 窗口加载完成后发送测试通知
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('🎉 窗口加载完成,发送测试通知');
    setTimeout(() => {
      mainWindow.webContents.send('new-message', {
        sender: '系统',
        content: '桌面应用已启动!通知系统正常工作!',
        channel: 'system'
      });
    }, 2000);
  });
  
  // 开发模式打开开发者工具
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // 总是打开开发者工具来调试
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // 让窗口可以穿透点击(点击宠物除外)
  mainWindow.setIgnoreMouseEvents(false);

  // 右键菜单
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
    {
      label: '设置',
      click: () => {
        // TODO: 打开设置窗口
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

// 监听来自渲染进程的消息
ipcMain.on('move-window', (event, { x, y }) => {
  const [currentX, currentY] = mainWindow.getPosition();
  const newX = currentX + x;
  const newY = currentY + y;
  mainWindow.setPosition(newX, newY);
  // 保存新位置
  petConfig.set('position', { x: newX, y: newY });
});

ipcMain.on('quit-app', () => {
  app.quit();
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
ipcMain.handle('voice-speak', async (event, text) => {
  workLogger.logVoice(text, 'speaking');
  await voiceSystem.speak(text);
  return true;
});

ipcMain.handle('voice-stop', async () => {
  voiceSystem.stop();
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

app.whenReady().then(createWindow);

app.on('before-quit', () => {
  // 清理资源
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
