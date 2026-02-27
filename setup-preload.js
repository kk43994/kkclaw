const { contextBridge, ipcRenderer, shell } = require('electron');

// Setup Wizard 专用 IPC 桥接
const VALID_INVOKE_CHANNELS = [
  'wizard-detect-gateway',
  'wizard-test-gateway',
  'wizard-save-channels',
  'wizard-get-config',
  'wizard-save-tts-engine',
  'wizard-test-tts',
  'wizard-clone-voice',
  'wizard-setup-agent-voice',
  'wizard-infuse-soul',
  'wizard-test-agent-voice',
  'wizard-save-display-settings',
  'wizard-run-full-test',
  'wizard-complete',
  'wizard-save-progress',
  'wizard-check-python',
  'wizard-detect-openclaw-dir',
  'wizard-retry-single-test',
  'wizard-get-model-config',
  'wizard-save-model-config',
  'wizard-check-model-config',
  'wizard-env-check',
  'wizard-install-openclaw',
  'wizard-start-gateway',
  'check-tts',
  'install-edge-tts',
  'install-dashscope',
];

const VALID_ON_CHANNELS = [
  'soul-infuse-progress',
];

contextBridge.exposeInMainWorld('wizardAPI', {
  invoke: (channel, ...args) => {
    if (VALID_INVOKE_CHANNELS.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    return Promise.reject(new Error(`Invalid wizard channel: ${channel}`));
  },
  on: (channel, callback) => {
    if (VALID_ON_CHANNELS.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },
  off: (channel) => {
    if (VALID_ON_CHANNELS.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
    }
  },
  openExternal: (url) => {
    if (typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'))) {
      shell.openExternal(url);
    }
  }
});
