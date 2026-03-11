// 统一路径解析中心 — Smart Setup Phase 1
// 所有脚本应通过此模块获取关键路径，禁止硬编码用户目录
const path = require('path');
const os = require('os');
const fs = require('fs');

class PathResolver {
  constructor() {
    this._cache = {};
  }

  /** 项目根目录（基于本文件位置推导） */
  getProjectRoot() {
    if (!this._cache.projectRoot) {
      this._cache.projectRoot = path.resolve(__dirname, '..');
    }
    return this._cache.projectRoot;
  }

  /** 用户 home 目录 */
  getUserHome() {
    if (!this._cache.userHome) {
      this._cache.userHome = os.homedir();
    }
    return this._cache.userHome;
  }

  /** 桌面路径（跨平台） */
  getDesktopDir() {
    if (!this._cache.desktopDir) {
      const home = this.getUserHome();
      if (process.platform === 'win32') {
        this._cache.desktopDir = path.join(home, 'Desktop');
      } else if (process.platform === 'darwin') {
        this._cache.desktopDir = path.join(home, 'Desktop');
      } else {
        const xdgDesktop = process.env.XDG_DESKTOP_DIR;
        this._cache.desktopDir = xdgDesktop || path.join(home, 'Desktop');
      }
    }
    return this._cache.desktopDir;
  }

  /** 临时目录 */
  getTempDir() {
    if (!this._cache.tempDir) {
      this._cache.tempDir = os.tmpdir();
    }
    return this._cache.tempDir;
  }

  /** OpenClaw 配置目录 ~/.openclaw */
  getOpenClawConfigDir() {
    if (!this._cache.openclawConfigDir) {
      this._cache.openclawConfigDir = path.join(this.getUserHome(), '.openclaw');
    }
    return this._cache.openclawConfigDir;
  }

  /** OpenClaw 数据目录（优先同级/上层 openclaw-data，再项目内，再 ~/.openclaw/data） */
  getOpenClawDataDir() {
    if (!this._cache.openclawDataDir) {
      const candidates = this.getOpenClawDataCandidates();
      const existing = candidates.find((candidate) => fs.existsSync(candidate));
      this._cache.openclawDataDir = existing || candidates[candidates.length - 1];
    }
    return this._cache.openclawDataDir;
  }

  getOpenClawDataCandidates() {
    const projectRoot = this.getProjectRoot();
    const seen = new Set();
    const candidates = [];

    const pushCandidate = (dir) => {
      if (!dir) return;
      const normalized = path.normalize(dir);
      if (seen.has(normalized)) return;
      seen.add(normalized);
      candidates.push(normalized);
    };

    let current = projectRoot;
    for (let i = 0; i < 4; i += 1) {
      pushCandidate(path.join(current, 'openclaw-data'));
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }

    pushCandidate(path.join(this.getUserHome(), 'openclaw-data'));
    pushCandidate(path.join(this.getOpenClawConfigDir(), 'data'));

    return candidates;
  }

  /** OpenClaw 配置文件 ~/.openclaw/openclaw.json */
  getOpenClawConfigPath() {
    return path.join(this.getOpenClawConfigDir(), 'openclaw.json');
  }

  /** 文档截图输出目录 */
  getDocsImageDir() {
    return path.join(this.getProjectRoot(), 'docs-dev', 'images');
  }

  /** 语音临时目录 */
  getVoiceTempDir() {
    return path.join(this.getTempDir(), 'kkclaw-voice');
  }

  /** 状态文件路径（pet-state.json） */
  getStateFilePath() {
    return path.join(this.getProjectRoot(), 'pet-state.json');
  }

  ensureDir(dir) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  snapshot() {
    return {
      projectRoot: this.getProjectRoot(),
      userHome: this.getUserHome(),
      desktopDir: this.getDesktopDir(),
      tempDir: this.getTempDir(),
      openclawConfigDir: this.getOpenClawConfigDir(),
      openclawDataDir: this.getOpenClawDataDir(),
      openclawDataCandidates: this.getOpenClawDataCandidates(),
      openclawConfigPath: this.getOpenClawConfigPath(),
      docsImageDir: this.getDocsImageDir(),
      voiceTempDir: this.getVoiceTempDir(),
      stateFilePath: this.getStateFilePath(),
    };
  }

  clearCache() {
    this._cache = {};
  }
}

module.exports = new PathResolver();
