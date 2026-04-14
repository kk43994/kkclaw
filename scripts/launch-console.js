#!/usr/bin/env node

const readline = require('readline');
const { spawn } = require('child_process');
const backendCompat = require('../utils/backend-compat');
const SafeConfigLoader = require('../utils/safe-config-loader');
const pathResolver = require('../utils/path-resolver');

const COLOR = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  gray: '\x1b[90m',
  white: '\x1b[37m',
  red: '\x1b[91m',
  green: '\x1b[92m',
  cyan: '\x1b[96m',
  champagne: '\x1b[38;2;247;231;206m',
};

const MODE_OPTIONS = [
  {
    key: '1',
    mode: 'openclaw',
    label: 'OpenClaw',
    color: COLOR.red,
    summary: 'classic red flame, uses the OpenClaw-compatible path',
  },
  {
    key: '2',
    mode: 'hermes',
    label: 'Hermes',
    color: COLOR.champagne,
    summary: 'champagne flame, uses the Hermes-compatible path',
  },
  {
    key: '3',
    mode: 'auto',
    label: 'Auto',
    color: COLOR.cyan,
    summary: 'prefer the installed backend, with OpenClaw before Hermes when both exist',
  },
];

const VALID_MODES = new Set(['openclaw', 'hermes', 'auto']);

function normalizeMode(value) {
  const mode = String(value || '').trim().toLowerCase();
  return VALID_MODES.has(mode) ? mode : null;
}

function getPetConfigPath() {
  return `${pathResolver.getProjectRoot()}/pet-config.json`;
}

function readLauncherSettings() {
  return SafeConfigLoader.load(getPetConfigPath(), {});
}

function saveLauncherSettings(config) {
  return SafeConfigLoader.save(getPetConfigPath(), config);
}

function rememberLastChoice(mode, config = readLauncherSettings()) {
  const normalizedMode = normalizeMode(mode);
  if (!normalizedMode) {
    return false;
  }

  const nextConfig = { ...config, lastCompatMode: normalizedMode };
  return saveLauncherSettings(nextConfig);
}

function persistLauncherChoice(mode, config = readLauncherSettings()) {
  const normalizedMode = normalizeMode(mode);
  if (!normalizedMode) {
    return false;
  }

  const nextConfig = { ...config, lastCompatMode: normalizedMode };
  if (!normalizeMode(config.compatMode)) {
    nextConfig.compatMode = normalizedMode;
  }
  return saveLauncherSettings(nextConfig);
}

function getCompatSnapshot() {
  try {
    backendCompat.clearCache();
  } catch (_) {}
  return backendCompat.resolve();
}

function resolveLauncherDefault(snapshot, settings = {}) {
  const fixedMode = normalizeMode(settings.compatMode);
  if (fixedMode) {
    return {
      mode: fixedMode,
      source: 'pet-config.compatMode',
      fixed: true,
      requiresChoice: false,
    };
  }

  const lastMode = normalizeMode(settings.lastCompatMode);
  if (lastMode) {
    return {
      mode: lastMode,
      source: 'pet-config.lastCompatMode',
      fixed: false,
      requiresChoice: false,
    };
  }

  return {
    mode: null,
    source: 'first-launch',
    fixed: false,
    requiresChoice: true,
  };
}

function getDefaultChoice(snapshot, settings = {}) {
  return resolveLauncherDefault(snapshot, settings).mode;
}

function describeDefault(snapshot, defaultMode, meta = null) {
  if (defaultMode === 'auto') {
    const targetLabel = snapshot?.active?.label || 'OpenClaw';
    return meta?.fixed ? `Auto (fixed) -> ${targetLabel}` : `Auto -> ${targetLabel}`;
  }
  const baseLabel = MODE_OPTIONS.find((option) => option.mode === defaultMode)?.label || 'OpenClaw';
  return meta?.fixed ? `${baseLabel} (fixed)` : baseLabel;
}

function resolveModeInput(input, defaultMode) {
  const normalized = String(input || '').trim().toLowerCase();
  if (!normalized) {
    return defaultMode || null;
  }

  const byKey = MODE_OPTIONS.find((option) => option.key === normalized);
  if (byKey) {
    return byKey.mode;
  }

  const byMode = MODE_OPTIONS.find((option) => option.mode === normalized);
  if (byMode) {
    return byMode.mode;
  }

  const byLabel = MODE_OPTIONS.find((option) => option.label.toLowerCase() === normalized);
  if (byLabel) {
    return byLabel.mode;
  }

  return null;
}

function buildChildEnv(mode) {
  const env = { ...process.env };
  const normalizedMode = normalizeMode(mode);
  if (normalizedMode) {
    env.KKCLAW_COMPAT_MODE = normalizedMode;
  } else {
    delete env.KKCLAW_COMPAT_MODE;
  }
  return env;
}

function printMenu(snapshot, defaultMeta) {
  const defaultMode = defaultMeta.mode;
  const defaultLabel = defaultMode ? describeDefault(snapshot, defaultMode, defaultMeta) : null;
  const sourceLine = defaultMeta.requiresChoice
    ? 'First launch detected: choose the backend you want KKClaw to keep using'
    : defaultMeta.fixed
    ? 'Saved choice from `pet-config.json` -> `compatMode`'
    : defaultMeta.source === 'pet-config.lastCompatMode'
    ? 'Defaulting to your last launch choice'
    : 'Defaulting to automatic backend detection';

  console.log('');
  console.log(`${COLOR.bold}${COLOR.white}KKClaw Console Launcher${COLOR.reset}`);
  console.log(`${COLOR.gray}Choose a backend for this launch.${COLOR.reset}`);
  if (defaultLabel) {
    console.log(`${COLOR.gray}Press Enter to keep: ${COLOR.bold}${defaultLabel}${COLOR.reset}`);
  } else {
    console.log(`${COLOR.gray}No backend is selected yet. You need to choose one this first time.${COLOR.reset}`);
  }
  console.log(`${COLOR.gray}${sourceLine}${COLOR.reset}`);
  console.log(`${COLOR.gray}Tip: set ${COLOR.bold}compatMode${COLOR.reset}${COLOR.gray} in pet-config.json if you want to change the saved backend later.${COLOR.reset}`);
  console.log('');

  for (const option of MODE_OPTIONS) {
    const installed =
      option.mode === 'openclaw'
        ? snapshot?.openclaw?.installed
        : option.mode === 'hermes'
        ? snapshot?.hermes?.installed
        : true;
    const availability = installed ? `${COLOR.green}detected${COLOR.reset}` : `${COLOR.gray}not detected${COLOR.reset}`;
    console.log(`  ${option.key}) ${option.color}${COLOR.bold}${option.label}${COLOR.reset} ${COLOR.dim}- ${option.summary}${COLOR.reset} ${COLOR.gray}[${availability}${COLOR.gray}]${COLOR.reset}`);
  }

  console.log('');
}

function askQuestion(promptText) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(promptText, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function promptForMode(snapshot) {
  const explicitEnv = String(process.env.KKCLAW_COMPAT_MODE || '').trim().toLowerCase();
  if (normalizeMode(explicitEnv)) {
    return explicitEnv;
  }

  const settings = readLauncherSettings();
  const defaultMeta = resolveLauncherDefault(snapshot, settings);
  const defaultMode = defaultMeta.mode;

  if (defaultMode && !defaultMeta.requiresChoice) {
    return defaultMode;
  }

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return defaultMode || 'auto';
  }

  while (true) {
    printMenu(snapshot, defaultMeta);
    const answer = await askQuestion(`${COLOR.bold}Select backend [1/2/3]${COLOR.reset}: `);
    const selectedMode = resolveModeInput(answer, defaultMode);

    if (selectedMode) {
      return selectedMode;
    }

    console.log(
      `${COLOR.red}Invalid choice.${COLOR.reset} ${
        defaultMeta.requiresChoice
          ? 'First launch requires an explicit choice: enter 1, 2, 3, openclaw, hermes, or auto.'
          : 'Enter 1, 2, 3, openclaw, hermes, or auto.'
      }`
    );
    console.log('');
  }
}

function launchElectron(mode) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['start'], {
      stdio: 'inherit',
      env: buildChildEnv(mode),
      shell: false,
      windowsHide: true,
    });

    child.on('error', reject);
    child.on('close', (code) => resolve(code ?? 0));
  });
}

async function launchConsole() {
  const snapshot = getCompatSnapshot();
  const settings = readLauncherSettings();
  const selectedMode = await promptForMode(snapshot);
  persistLauncherChoice(selectedMode, settings);
  const selectedOption = MODE_OPTIONS.find((option) => option.mode === selectedMode);

  console.log(
    `${COLOR.gray}Starting with ${selectedOption ? selectedOption.color : COLOR.white}${COLOR.bold}${selectedOption?.label || selectedMode}${COLOR.reset}${COLOR.gray}...${COLOR.reset}`
  );
  console.log('');

  return launchElectron(selectedMode);
}

module.exports = {
  MODE_OPTIONS,
  buildChildEnv,
  describeDefault,
  getCompatSnapshot,
  getDefaultChoice,
  getPetConfigPath,
  launchConsole,
  launchElectron,
  promptForMode,
  persistLauncherChoice,
  readLauncherSettings,
  rememberLastChoice,
  resolveModeInput,
  resolveLauncherDefault,
  saveLauncherSettings,
};

if (require.main === module) {
  launchConsole()
    .then((code) => {
      process.exit(code);
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    });
}
