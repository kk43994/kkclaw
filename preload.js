const { contextBridge, ipcRenderer } = require('electron');

// Whitelisted IPC channels for security
const VALID_SEND_CHANNELS = [
  'drag-pet'
];

const VALID_INVOKE_CHANNELS = [
  'show-history',
  'set-voice-enabled',
  'model-next',
  'take-screenshot',
  'gateway-send',
  'openclaw-send',
  'model-current',
  'gateway-status',
  'openclaw-status',
  'model-full-status',
  'model-switch',
  'model-switch-provider',
  'model-presets',
  'model-add-from-preset',
  'model-add-provider',
  'model-update-provider',
  'model-remove-provider',
  'model-remove-model',
  'model-add-model',
  'model-speed-test',
  'model-speed-test-all',
  'model-fetch-models',
  'model-probe-provider',
  'model-analyze-kkclaw',
  'model-switch-state',
  'model-switch-stats',
  'model-set-strategy',
  'model-switch-history',
  'model-sync-cc-switch',
  'model-detect-package',
  'model-query-quota',
  'model-sync-preset',
  'switch-log-list',
  'switch-log-clear',
  'diag-full-status',
  'diag-restart-gateway',
  'diag-clear-session',
  'diag-cleanup-cache',
  'diag-kill-port',
  'diag-doctor',
  'refresh-session',
  'gateway-health-score',
  'gateway-metrics',
  'gateway-anomalies',
  'gateway-full-status',
  'gateway-clear-metrics'
];

const VALID_ON_CHANNELS = [
  'model-changed',
  'new-message',
  'agent-response',
  'status-update',
  'show-lyric',
  'switch-log-entry'
];

contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, data) => {
    if (VALID_SEND_CHANNELS.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  invoke: (channel, ...args) => {
    if (VALID_INVOKE_CHANNELS.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    return Promise.reject(new Error(`Invalid channel: ${channel}`));
  },
  on: (channel, callback) => {
    if (VALID_ON_CHANNELS.includes(channel)) {
      const subscription = (event, ...args) => callback(...args);
      ipcRenderer.on(channel, subscription);
      return () => ipcRenderer.removeListener(channel, subscription);
    }
  },
  pid: process.pid
});
