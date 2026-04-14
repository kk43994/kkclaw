const fs = require('fs');
const path = require('path');
const { execFileSync, execSync } = require('child_process');
const pathResolver = require('./path-resolver');
const openClawPathResolver = require('./openclaw-path-resolver');
const SafeConfigLoader = require('./safe-config-loader');

const TRUTHY_VALUES = new Set(['1', 'true', 'yes', 'on']);

function isTruthy(value) {
  return TRUTHY_VALUES.has(String(value || '').trim().toLowerCase());
}

function firstLine(value) {
  return String(value || '').trim().split(/\r?\n/)[0] || '';
}

function findCli(name) {
  try {
    const cmd = process.platform === 'win32' ? 'where' : 'which';
    const output = execSync(`${cmd} ${name}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      windowsHide: true,
    });
    const cliPath = firstLine(output);
    return cliPath && fs.existsSync(cliPath) ? path.normalize(cliPath) : null;
  } catch {
    return null;
  }
}

function readPetCompatMode() {
  try {
    const petConfigPath = path.join(pathResolver.getProjectRoot(), 'pet-config.json');
    if (!fs.existsSync(petConfigPath)) {
      return null;
    }
    const config = JSON.parse(fs.readFileSync(petConfigPath, 'utf8'));
    const mode = String(config.compatMode || '').trim().toLowerCase();
    return mode === 'openclaw' || mode === 'hermes' || mode === 'auto' ? mode : null;
  } catch {
    return null;
  }
}

function parseEnvFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return {};
  }

  const env = {};
  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const index = line.indexOf('=');
    if (index === -1) {
      continue;
    }
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function parsePort(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

class BackendCompat {
  constructor() {
    this._cache = null;
  }

  clearCache() {
    this._cache = null;
  }

  resolve() {
    if (this._cache) {
      return this._cache;
    }

    const preference = this._resolvePreference();
    const openclaw = this._buildOpenClawInfo();
    const hermes = this._buildHermesInfo();

    let activeMode = 'openclaw';
    if (preference.mode === 'hermes') {
      activeMode = hermes.installed ? 'hermes' : 'openclaw';
    } else if (preference.mode === 'openclaw') {
      activeMode = openclaw.installed ? 'openclaw' : 'hermes';
    } else if (openclaw.installed) {
      activeMode = 'openclaw';
    } else if (hermes.installed) {
      activeMode = 'hermes';
    }

    const active = activeMode === 'hermes' ? hermes : openclaw;
    this._cache = {
      preference,
      activeMode,
      active,
      openclaw,
      hermes,
    };
    return this._cache;
  }

  _resolvePreference() {
    const envMode = String(process.env.KKCLAW_COMPAT_MODE || '').trim().toLowerCase();
    if (envMode === 'openclaw' || envMode === 'hermes' || envMode === 'auto') {
      return { mode: envMode, source: 'env' };
    }

    const petMode = readPetCompatMode();
    if (petMode === 'openclaw' || petMode === 'hermes' || petMode === 'auto') {
      return { mode: petMode, source: 'pet-config' };
    }

    return { mode: 'auto', source: 'auto' };
  }

  _buildOpenClawInfo() {
    const cliPath = openClawPathResolver.findOpenClawCliPath();
    const configDir = pathResolver.getOpenClawConfigDir();
    const configPath = pathResolver.getOpenClawConfigPath();
    const config = SafeConfigLoader.load(configPath, {});
    const port = parsePort(config.gateway?.port, 18789);
    const token = String(config.gateway?.auth?.token || '').trim();
    const logDir = path.join(configDir, 'logs');

    return {
      mode: 'openclaw',
      label: 'OpenClaw',
      installed: Boolean(cliPath || fs.existsSync(configDir)),
      cliPath,
      configDir,
      configPath,
      apiHost: `http://127.0.0.1:${port}`,
      healthUrl: `http://127.0.0.1:${port}`,
      apiKey: token,
      apiKeyHeader: token ? { Authorization: `Bearer ${token}` } : {},
      model: 'openclaw:main',
      logPaths: {
        out: path.join(logDir, 'gateway.log'),
        err: path.join(logDir, 'gateway.err.log'),
      },
      invocation(args = []) {
        return openClawPathResolver.resolveOpenClawInvocation(args);
      },
    };
  }

  _buildHermesInfo() {
    const cliPath = findCli('hermes') || path.join(pathResolver.getUserHome(), '.local', 'bin', 'hermes');
    const normalizedCli = cliPath && fs.existsSync(cliPath) ? path.normalize(cliPath) : null;
    const configDir = path.join(pathResolver.getUserHome(), '.hermes');
    const envPath = path.join(configDir, '.env');
    const env = parseEnvFile(envPath);
    const host = String(env.API_SERVER_HOST || '127.0.0.1').trim() || '127.0.0.1';
    const port = parsePort(env.API_SERVER_PORT, 8642);
    const apiServerEnabled = isTruthy(env.API_SERVER_ENABLED) || Boolean(env.API_SERVER_KEY);
    const key = String(env.API_SERVER_KEY || '').trim();
    const model = String(env.API_SERVER_MODEL_NAME || 'hermes-agent').trim() || 'hermes-agent';
    const logDir = path.join(configDir, 'logs');

    return {
      mode: 'hermes',
      label: 'Hermes',
      installed: Boolean(normalizedCli),
      cliPath: normalizedCli,
      configDir,
      configPath: path.join(configDir, 'config.yaml'),
      envPath,
      env,
      apiServerEnabled,
      chatReady: apiServerEnabled,
      chatBlockReason: apiServerEnabled
        ? null
        : 'Hermes API server 未启用，请在 ~/.hermes/.env 中设置 API_SERVER_ENABLED=true 后重启 Hermes。',
      apiHost: `http://${host}:${port}`,
      healthUrl: apiServerEnabled ? `http://${host}:${port}/health` : null,
      apiKey: key,
      apiKeyHeader: key ? { Authorization: `Bearer ${key}` } : {},
      model,
      logPaths: {
        out: path.join(logDir, 'gateway.log'),
        err: path.join(logDir, 'gateway.error.log'),
      },
      invocation(args = []) {
        if (!normalizedCli) {
          return null;
        }
        return {
          source: 'installed-cli',
          installRoot: path.dirname(path.dirname(normalizedCli)),
          cliPath: normalizedCli,
          command: normalizedCli,
          args,
          cwd: path.dirname(normalizedCli),
          shell: false,
          windowsHide: true,
        };
      },
    };
  }

  async probeGateway() {
    const { active } = this.resolve();

    if (active.healthUrl) {
      let timeoutId = null;
      try {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 4000);
        const response = await fetch(active.healthUrl, {
          method: 'GET',
          headers: active.apiKeyHeader || {},
          signal: controller.signal,
        });
        return {
          ok: true,
          status: response.status,
          source: 'http',
          url: active.healthUrl,
        };
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
          source: 'http',
          url: active.healthUrl,
        };
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    }

    if (active.mode === 'hermes' && active.cliPath) {
      try {
        const output = execFileSync(active.cliPath, ['gateway', 'status'], {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'pipe'],
          windowsHide: true,
        });
        return {
          ok: /loaded|running|gateway service is loaded/i.test(output),
          status: 0,
          source: 'cli',
          detail: firstLine(output) || 'hermes gateway status',
        };
      } catch (error) {
        const detail = firstLine(error.stdout) || firstLine(error.stderr) || error.message;
        return {
          ok: false,
          error: detail,
          source: 'cli',
        };
      }
    }

    return {
      ok: false,
      error: 'No health probe available',
      source: 'none',
    };
  }
}

module.exports = new BackendCompat();
