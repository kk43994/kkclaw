const { contextBridge, ipcRenderer } = require('electron');

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
  'wizard-smart-env-check',
  'wizard-path-snapshot',
  'wizard-verify-openclaw-path',
  'wizard-start-gateway',
  'wizard-save-voice-id',
  'check-tts',
  'install-python',
  'install-edge-tts',
  'install-dashscope',
  'wizard-install-missing-deps',
];

const VALID_ON_CHANNELS = [
  'soul-infuse-progress',
  'dep-install-progress',
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
      return ipcRenderer.invoke('open-external', url).then((result) => {
        if (result?.success) {
          return true;
        }
        throw new Error(result?.error || 'Failed to open external URL');
      });
    }
    return Promise.reject(new Error('Invalid external URL'));
  }
});
