// 依赖检测器 — Smart Setup Phase 1
// 统一检查环境依赖是否满足运行条件，输出结构化结果
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const pathResolver = require('./path-resolver');
const openclawDetector = require('./openclaw-detector');

class DependencyChecker {
  /**
   * 执行完整依赖检测
   * @returns {Promise<Object>} 每项依赖的检测结果
   */
  async checkAll() {
    const [node, npm, git, openclaw, python, pip, edgeTts, sqlite3, projectDeps] =
      await Promise.all([
        this._checkNode(),
        this._checkNpm(),
        this._checkGit(),
        this._checkOpenClaw(),
        this._checkPython(),
        this._checkPip(),
        this._checkEdgeTts(),
        this._checkSqlite3(),
        this._checkProjectDeps(),
      ]);

    return {
      node,
      npm,
      git,
      openclaw,
      python,
      pip,
      edgeTts,
      sqlite3,
      projectDeps,
    };
  }

  // ─── 核心依赖 ──────────────────────────

  async _checkNode() {
    try {
      const ver = process.version;
      const major = parseInt(ver.replace('v', '').split('.')[0]);
      return {
        ok: major >= 18,
        version: ver,
        required: true,
        installHint: major < 18 ? 'Please upgrade to Node.js 18+: https://nodejs.org/' : null,
      };
    } catch (e) {
      return { ok: false, version: null, required: true, installHint: 'Install Node.js 18+: https://nodejs.org/' };
    }
  }

  async _checkNpm() {
    try {
      const { stdout } = await execAsync('npm --version', { windowsHide: true, timeout: 5000 });
      return { ok: true, version: stdout.trim(), required: true };
    } catch (e) {
      return { ok: false, version: null, required: true, installHint: 'npm should come with Node.js. Reinstall Node.js if missing.' };
    }
  }

  async _checkGit() {
    try {
      const { stdout } = await execAsync('git --version', { windowsHide: true, timeout: 5000 });
      const match = stdout.match(/(\d+\.\d+[\.\d]*)/);
      return { ok: true, version: match ? match[1] : stdout.trim(), required: true };
    } catch (e) {
      return { ok: false, version: null, required: true, installHint: 'Install git: https://git-scm.com/' };
    }
  }

  async _checkOpenClaw() {
    try {
      const detection = await openclawDetector.detect();
      return {
        ok: detection.installed,
        version: detection.version,
        required: true,
        installHint: detection.installed ? null : 'npm install -g openclaw',
        detail: {
          cliPath: detection.cliPath,
          installMode: detection.installMode,
          installRoot: detection.installRoot,
          source: detection.source,
          multipleCandidates: detection.multipleCandidates,
          candidates: detection.candidates,
          configDir: detection.configDir,
          configFile: detection.configFile,
          dataDir: detection.dataDir,
        },
      };
    } catch (e) {
      return { ok: false, version: null, required: true, installHint: 'npm install -g openclaw' };
    }
  }

  // ─── 增强依赖（可选） ──────────────────────

  async _checkPython() {
    const cmds = ['python', 'python3', 'py'];
    for (const cmd of cmds) {
      try {
        const { stdout, stderr } = await execAsync(`${cmd} --version`, { windowsHide: true, timeout: 5000 });
        const raw = (stdout + ' ' + stderr).trim();
        const match = raw.match(/Python (\d+)\.(\d+)/);
        if (match) {
          const major = parseInt(match[1]);
          const minor = parseInt(match[2]);
          if (major > 3 || (major === 3 && minor >= 6)) {
            return {
              ok: true,
              version: `${match[0]}`,
              required: false,
              source: cmd,
            };
          }
        }
      } catch (e) { continue; }
    }
    return {
      ok: false,
      version: null,
      required: false,
      installHint: 'Install Python 3.6+: https://www.python.org/downloads/',
    };
  }

  async _checkPip() {
    const cmds = ['pip', 'pip3'];
    for (const cmd of cmds) {
      try {
        const { stdout } = await execAsync(`${cmd} --version`, { windowsHide: true, timeout: 5000 });
        const match = stdout.match(/pip (\d+[\.\d]*)/);
        return { ok: true, version: match ? match[1] : stdout.trim(), required: false, source: cmd };
      } catch (e) { continue; }
    }
    return { ok: false, version: null, required: false, installHint: 'pip comes with Python. Reinstall Python if missing.' };
  }

  async _checkEdgeTts() {
    try {
      const { stdout } = await execAsync('pip show edge-tts', { windowsHide: true, timeout: 5000 });
      const match = stdout.match(/Version:\s*([\d.]+)/i);
      return { ok: true, version: match ? match[1] : 'installed', required: false };
    } catch (e) {
      // fallback: try pip3
      try {
        const { stdout } = await execAsync('pip3 show edge-tts', { windowsHide: true, timeout: 5000 });
        const match = stdout.match(/Version:\s*([\d.]+)/i);
        return { ok: true, version: match ? match[1] : 'installed', required: false };
      } catch (e2) {
        return { ok: false, version: null, required: false, installHint: 'pip install edge-tts' };
      }
    }
  }

  async _checkSqlite3() {
    try {
      const { stdout } = await execAsync('sqlite3 --version', { windowsHide: true, timeout: 5000 });
      const ver = stdout.trim().split(' ')[0];
      return { ok: true, version: ver, required: false, source: 'PATH' };
    } catch (e) {
      // sqlite3 也可能作为 Node 模块存在
      const projectRoot = pathResolver.getProjectRoot();
      const sqlitePath = path.join(projectRoot, 'node_modules', 'better-sqlite3');
      if (fs.existsSync(sqlitePath)) {
        return { ok: true, version: 'better-sqlite3 (npm)', required: false, source: 'node_modules' };
      }
      return { ok: false, version: null, required: false, installHint: 'Optional: used for local data caching' };
    }
  }

  // ─── 项目依赖 ──────────────────────────

  async _checkProjectDeps() {
    const projectRoot = pathResolver.getProjectRoot();
    const nodeModulesExists = fs.existsSync(path.join(projectRoot, 'node_modules'));
    const electronExists = fs.existsSync(path.join(projectRoot, 'node_modules', 'electron'));

    return {
      nodeModules: {
        ok: nodeModulesExists,
        required: true,
        installHint: nodeModulesExists ? null : 'npm install',
      },
      electron: {
        ok: electronExists,
        required: true,
        installHint: electronExists ? null : 'npm install (electron is a dependency)',
      },
    };
  }

  /**
   * 生成用户可读的状态摘要
   * @param {Object} results checkAll() 的返回值
   * @returns {Object} { overall: 'ok'|'warning'|'error', coreReady, enhancedReady, missing, warnings }
   */
  summarize(results) {
    const missing = [];
    const warnings = [];

    // 核心依赖
    if (!results.node.ok) missing.push('Node.js 18+');
    if (!results.npm.ok) missing.push('npm');
    if (!results.git.ok) missing.push('git');
    if (!results.openclaw.ok) missing.push('OpenClaw');
    if (!results.projectDeps.nodeModules.ok) missing.push('node_modules (run npm install)');
    if (!results.projectDeps.electron.ok) missing.push('Electron (run npm install)');

    // 可选依赖
    if (!results.python.ok) warnings.push('Python not found — EdgeTTS / CosyVoice unavailable');
    if (!results.edgeTts.ok) warnings.push('edge-tts not installed — EdgeTTS fallback unavailable');
    if (!results.sqlite3.ok) warnings.push('sqlite3 not found — local caching unavailable');

    const coreReady = missing.length === 0;
    const overall = coreReady ? (warnings.length > 0 ? 'warning' : 'ok') : 'error';

    return { overall, coreReady, missing, warnings };
  }
}

module.exports = new DependencyChecker();
