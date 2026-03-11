// Mock Electron module for Jest testing
module.exports = {
  app: {
    getPath: (name) => `/tmp/kkclaw-test/${name}`,
    getVersion: () => '3.1.2',
    getName: () => 'KKClaw Desktop Pet',
    quit: jest.fn(),
    on: jest.fn(),
    isReady: () => true,
  },
  BrowserWindow: jest.fn().mockImplementation(() => ({
    loadFile: jest.fn(),
    on: jest.fn(),
    webContents: {
      send: jest.fn(),
      on: jest.fn(),
    },
    show: jest.fn(),
    hide: jest.fn(),
    close: jest.fn(),
    isDestroyed: () => false,
  })),
  ipcMain: {
    on: jest.fn(),
    handle: jest.fn(),
    removeHandler: jest.fn(),
  },
  ipcRenderer: {
    on: jest.fn(),
    send: jest.fn(),
    invoke: jest.fn(),
  },
  Notification: jest.fn().mockImplementation(() => ({
    show: jest.fn(),
    on: jest.fn(),
  })),
  Tray: jest.fn().mockImplementation(() => ({
    setContextMenu: jest.fn(),
    setToolTip: jest.fn(),
    on: jest.fn(),
  })),
  Menu: {
    buildFromTemplate: jest.fn(() => ({})),
    setApplicationMenu: jest.fn(),
  },
  shell: {
    openExternal: jest.fn(),
  },
  screen: {
    getPrimaryDisplay: () => ({
      workAreaSize: { width: 1920, height: 1080 },
    }),
  },
  session: {
    defaultSession: {
      clearCache: jest.fn().mockResolvedValue(undefined),
      getCacheSize: jest.fn().mockResolvedValue(0),
    },
  },
  safeStorage: {
    isEncryptionAvailable: () => false,
    encryptString: jest.fn(),
    decryptString: jest.fn(),
  },
}
