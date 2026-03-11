// OpenClaw 环境探测器 — Smart Setup Phase 1
// 结构化探测 OpenClaw 是否已安装、属于哪种安装模式、配置文件和工作目录在哪
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const pathResolver = require('./path-resolver');

class OpenClawDetector {
  async detect(options = {}) {
    const manualInput = options.manualPath ? path.resolve(options.manualPath) : null;
    const candidates = [];
    const seen = new Set();

    const addCandidate = (candidate) => {
      if (!candidate) return;
      const key = [candidate.cliPath || '', candidate.installRoot || '', candidate.installMode || 'unknown'].join('|');
      if (seen.has(key)) return;
      seen.add(key);
      candidates.push({
        installMode: candidate.installMode || 'unknown',
        cliPath: candidate.cliPath || null,
        installRoot: candidate.installRoot || null,
        source: candidate.source || 'unknown',
        confidence: candidate.confidence ?? 0.5,
      });
    };

    if (manualInput) {
      addCandidate(await this._detectFromManualPath(manualInput));
    }

    const cliCandidate = await this._detectFromCommandPath();
    addCandidate(cliCandidate);

    const npmCandidate = await this._detectFromNpmGlobal();
    addCandidate(npmCandidate);

    for (const candidate of await this._detectStandardLocations()) {
      addCandidate(candidate);
    }

    const sorted = candidates.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    const primary = sorted[0] || null;

    const cliPath = primary?.cliPath || (await this._findExecutablePath()) || null;
    const version = cliPath ? await this._getVersion(cliPath) : null;

    const configDirPath = pathResolver.getOpenClawConfigDir();
    const configFilePath = pathResolver.getOpenClawConfigPath();
    const dataDirPath = pathResolver.getOpenClawDataDir();

    const result = {
      installed: !!primary || !!cliPath,
      installMode: primary?.installMode || (manualInput ? 'manual' : 'unknown'),
      cliPath,
      installRoot: primary?.installRoot || this._inferInstallRoot(cliPath),
      version,
      source: primary?.source || (manualInput ? 'manual-input' : 'unknown'),
      configDir: { path: configDirPath, exists: fs.existsSync(configDirPath) },
      configFile: { path: configFilePath, exists: fs.existsSync(configFilePath) },
      dataDir: { path: dataDirPath, exists: fs.existsSync(dataDirPath) },
      gatewayScript: this._detectGatewayScript(configDirPath),
      statusCheck: { ok: false, message: 'Not checked' },
      candidates: sorted,
      multipleCandidates: sorted.length > 1,
      manualInput: manualInput || null,
      manualValidated: !!manualInput && (!!primary || !!cliPath),
    };

    if (result.installed) {
      result.statusCheck = await this._checkStatus(cliPath);
    }

    return result;
  }

  async verifyManualPath(inputPath) {
    return this.detect({ manualPath: inputPath });
  }

  async _detectFromManualPath(inputPath) {
    try {
      const stat = fs.existsSync(inputPath) ? fs.statSync(inputPath) : null;
      if (!stat) return null;

      if (stat.isFile()) {
        const normalized = inputPath;
        const lower = normalized.toLowerCase();
        if (lower.endsWith('openclaw') || lower.endsWith('openclaw.cmd') || lower.endsWith('openclaw.ps1') || lower.endsWith('openclaw.bat') || lower.endsWith('index.js')) {
          return {
            installMode: this._inferInstallModeFromPath(normalized),
            cliPath: normalized,
            installRoot: this._inferInstallRoot(normalized),
            source: 'manual-input',
            confidence: 0.96,
          };
        }
      }

      if (stat.isDirectory()) {
        const cliCandidates = this._buildCliCandidatesFromDir(inputPath);
        for (const cliCandidate of cliCandidates) {
          if (fs.existsSync(cliCandidate)) {
            return {
              installMode: this._inferInstallModeFromPath(cliCandidate),
              cliPath: cliCandidate,
              installRoot: this._inferInstallRoot(cliCandidate),
              source: 'manual-input',
              confidence: 0.94,
            };
          }
        }

        if (fs.existsSync(path.join(inputPath, 'openclaw.json')) || fs.existsSync(path.join(inputPath, 'data'))) {
          return {
            installMode: 'manual',
            cliPath: null,
            installRoot: inputPath,
            source: 'manual-input',
            confidence: 0.75,
          };
        }
      }
    } catch (_) {}
    return null;
  }

  async _detectFromCommandPath() {
    const cliPath = await this._findExecutablePath();
    if (!cliPath) return null;
    return {
      installMode: this._inferInstallModeFromPath(cliPath),
      cliPath,
      installRoot: await this._resolveBestInstallRoot(cliPath),
      source: 'where-openclaw',
      confidence: 0.98,
    };
  }

  async _detectFromNpmGlobal() {
    try {
      const { stdout: prefixStdout } = await execAsync('npm prefix -g', { windowsHide: true, timeout: 5000 });
      const { stdout: rootStdout } = await execAsync('npm root -g', { windowsHide: true, timeout: 5000 });
      const prefix = prefixStdout.trim();
      const root = rootStdout.trim();

      const cliCandidates = process.platform === 'win32'
        ? [path.join(prefix, 'openclaw.cmd'), path.join(prefix, 'openclaw.ps1'), path.join(prefix, 'openclaw')]
        : [path.join(prefix, 'bin', 'openclaw'), path.join(prefix, 'openclaw')];

      const cliPath = cliCandidates.find((p) => fs.existsSync(p)) || null;
      const packageDir = path.join(root, 'openclaw');
      const installRoot = fs.existsSync(packageDir) ? packageDir : this._inferInstallRoot(cliPath);

      if (cliPath || installRoot) {
        return {
          installMode: 'npm-global',
          cliPath,
          installRoot,
          source: 'npm-global',
          confidence: cliPath ? 0.9 : 0.72,
        };
      }
    } catch (_) {}
    return null;
  }

  async _detectStandardLocations() {
    const home = pathResolver.getUserHome();
    const results = [];

    const localPrefixRoots = [
      path.join(home, '.openclaw'),
      path.join(home, 'openclaw'),
    ];

    for (const root of localPrefixRoots) {
      const cliCandidates = this._buildCliCandidatesFromDir(root);
      const cliPath = cliCandidates.find((p) => fs.existsSync(p));
      if (cliPath || fs.existsSync(path.join(root, 'openclaw.json')) || fs.existsSync(path.join(root, 'data'))) {
        results.push({
          installMode: root.endsWith('.openclaw') ? 'local-prefix' : 'git',
          cliPath: cliPath || null,
          installRoot: root,
          source: 'standard-location',
          confidence: cliPath ? 0.84 : 0.62,
        });
      }
    }

    const projectRoot = pathResolver.getProjectRoot();
    if (fs.existsSync(path.join(projectRoot, 'package.json')) && fs.existsSync(path.join(projectRoot, 'setup-wizard.js'))) {
      results.push({
        installMode: 'git',
        cliPath: null,
        installRoot: projectRoot,
        source: 'project-root',
        confidence: 0.35,
      });
    }

    return results;
  }

  async _findExecutablePath() {
    try {
      const cmd = process.platform === 'win32' ? 'where openclaw' : 'which openclaw';
      const { stdout } = await execAsync(cmd, { windowsHide: true, timeout: 5000 });
      const binPath = stdout.trim().split(/\r?\n/)[0];
      if (binPath && fs.existsSync(binPath)) return binPath;
    } catch (_) {}
    return null;
  }

  _buildCliCandidatesFromDir(dir) {
    return process.platform === 'win32'
      ? [
          path.join(dir, 'bin', 'openclaw.cmd'),
          path.join(dir, 'bin', 'openclaw.ps1'),
          path.join(dir, 'openclaw.cmd'),
          path.join(dir, 'openclaw.ps1'),
          path.join(dir, 'node_modules', 'openclaw', 'dist', 'index.js'),
        ]
      : [
          path.join(dir, 'bin', 'openclaw'),
          path.join(dir, 'openclaw'),
          path.join(dir, 'node_modules', 'openclaw', 'dist', 'index.js'),
        ];
  }

  _inferInstallModeFromPath(cliPath) {
    if (!cliPath) return 'unknown';
    const normalized = cliPath.replace(/\\/g, '/').toLowerCase();
    if (normalized.includes('/.openclaw/')) return 'local-prefix';
    if (normalized.includes('/appdata/local/pnpm/')) return 'npm-global';
    if (normalized.includes('/node_modules/openclaw/')) return normalized.includes('/appdata/roaming/npm/') || normalized.includes('/.npm-global/') || normalized.includes('/pnpm/global/') ? 'npm-global' : 'git';
    if (normalized.endsWith('/openclaw') || normalized.endsWith('/openclaw.cmd') || normalized.endsWith('/openclaw.ps1') || normalized.endsWith('/openclaw.bat')) {
      if (normalized.includes('/appdata/roaming/npm/') || normalized.includes('/.npm-global/') || normalized.includes('/pnpm/global/') || normalized.includes('/appdata/local/pnpm/')) return 'npm-global';
      if (normalized.includes('/.openclaw/')) return 'local-prefix';
    }
    return 'unknown';
  }

  _inferInstallRoot(cliPath) {
    if (!cliPath) return null;
    const normalized = path.normalize(cliPath);
    const lower = normalized.toLowerCase();

    if (lower.includes(`${path.sep}appdata${path.sep}local${path.sep}pnpm${path.sep}`)) {
      return path.join(pathResolver.getUserHome(), 'AppData', 'Local', 'pnpm');
    }

    if (lower.endsWith(`${path.sep}dist${path.sep}index.js`)) {
      return path.dirname(path.dirname(path.dirname(normalized)));
    }
    if (lower.endsWith('openclaw.cmd') || lower.endsWith('openclaw.ps1') || lower.endsWith('openclaw.bat') || lower.endsWith('openclaw')) {
      const binDir = path.dirname(normalized);
      if (path.basename(binDir).toLowerCase() === 'bin') {
        return path.dirname(binDir);
      }
      return binDir;
    }
    return path.dirname(normalized);
  }

  async _resolveBestInstallRoot(cliPath) {
    const inferred = this._inferInstallRoot(cliPath);
    const mode = this._inferInstallModeFromPath(cliPath);

    if (mode === 'npm-global') {
      try {
        const { stdout: rootStdout } = await execAsync('npm root -g', { windowsHide: true, timeout: 5000 });
        const packageDir = path.join(rootStdout.trim(), 'openclaw');
        if (packageDir && fs.existsSync(packageDir)) {
          return packageDir;
        }
      } catch (_) {}
    }

    return inferred;
  }

  _detectGatewayScript(configDirPath) {
    if (!configDirPath || !fs.existsSync(configDirPath)) {
      return { path: null, exists: false };
    }

    const gatewayNames = process.platform === 'win32'
      ? ['gateway.cmd', 'gateway.bat', 'gateway.ps1']
      : ['gateway.sh'];

    for (const name of gatewayNames) {
      const gp = path.join(configDirPath, name);
      if (fs.existsSync(gp)) {
        return { path: gp, exists: true };
      }
    }

    return { path: null, exists: false };
  }

  async _getVersion(cliPath) {
    try {
      const command = this._buildCliCommand(cliPath, '--version');
      const { stdout } = await execAsync(command, { windowsHide: true, timeout: 5000 });
      return stdout.trim() || null;
    } catch (_) {
      return null;
    }
  }

  async _checkStatus(cliPath) {
    try {
      const command = this._buildCliCommand(cliPath, 'status');
      const { stdout } = await execAsync(command, { windowsHide: true, timeout: 5000 });
      return { ok: true, message: stdout.trim() || 'Status OK' };
    } catch (e) {
      const msg = e.stderr ? e.stderr.trim() : (e.message || 'Unknown error');
      return { ok: false, message: msg };
    }
  }

  _buildCliCommand(cliPath, arg) {
    const target = cliPath ? `"${cliPath}"` : 'openclaw';
    const lower = (cliPath || '').toLowerCase();
    if (lower.endsWith('index.js')) {
      return `node ${target} ${arg}`;
    }
    return `${target} ${arg}`;
  }
}

module.exports = new OpenClawDetector();
