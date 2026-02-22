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
];

contextBridge.exposeInMainWorld('wizardAPI', {
  invoke: (channel, ...args) => {
    if (VALID_INVOKE_CHANNELS.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    return Promise.reject(new Error(`Invalid wizard channel: ${channel}`));
  },
  openExternal: (url) => {
    if (typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'))) {
      shell.openExternal(url);
    }
  }
});
