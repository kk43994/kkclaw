// KKClaw Switch 监控日志模块
const fs = require('fs');
const path = require('path');

class SwitchLogger {
  constructor(options = {}) {
    this.logDir = options.logDir || path.join(process.env.HOME || process.env.USERPROFILE, '.openclaw', 'logs');
    this.logFile = path.join(this.logDir, 'switch.log');
    this.maxFileSize = options.maxFileSize || 2 * 1024 * 1024; // 2MB
    this.maxMemoryLogs = options.maxMemoryLogs || 500;
    this.logs = []; // 内存中的日志缓存
    this.listeners = [];

    // 确保日志目录存在
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (err) {
      console.error('[SwitchLogger] 创建日志目录失败:', err.message);
    }

    // 启动时加载最近日志
    this._loadRecent();
  }

  // 记录日志
  log(level, action, detail = '') {
    const entry = {
      time: new Date().toISOString(),
      level, // info | warn | error | success
      action,
      detail: typeof detail === 'object' ? JSON.stringify(detail) : String(detail)
    };

    // 内存缓存
    this.logs.push(entry);
    if (this.logs.length > this.maxMemoryLogs) {
      this.logs.splice(0, this.logs.length - this.maxMemoryLogs);
    }

    // 写文件
    this._appendToFile(entry);

    // 通知监听器
    for (const cb of this.listeners) {
      try { cb(entry); } catch {}
    }

    return entry;
  }

  info(action, detail) { return this.log('info', action, detail); }
  success(action, detail) { return this.log('success', action, detail); }
  warn(action, detail) { return this.log('warn', action, detail); }
  error(action, detail) { return this.log('error', action, detail); }

  // 获取最近日志
  getRecent(count = 100, levelFilter = null) {
    let result = this.logs;
    if (levelFilter) {
      result = result.filter(e => e.level === levelFilter);
    }
    return result.slice(-count);
  }

  // 清除日志
  clear() {
    this.logs = [];
    try {
      fs.writeFileSync(this.logFile, '', 'utf8');
    } catch {}
  }

  // 监听新日志
  onLog(callback) {
    this.listeners.push(callback);
    return () => { this.listeners = this.listeners.filter(cb => cb !== callback); };
  }

  // 写入文件
  _appendToFile(entry) {
    try {
      const line = `[${entry.time}] [${entry.level.toUpperCase()}] ${entry.action}${entry.detail ? ' | ' + entry.detail : ''}\n`;
      fs.appendFileSync(this.logFile, line, 'utf8');

      // 检查文件大小，超出则轮转
      const stat = fs.statSync(this.logFile);
      if (stat.size > this.maxFileSize) {
        this._rotate();
      }
    } catch (err) {
      console.error('[SwitchLogger] 写入失败:', err.message);
    }
  }

  // 日志轮转
  _rotate() {
    try {
      const backupPath = this.logFile + '.1';
      if (fs.existsSync(backupPath)) {
        fs.unlinkSync(backupPath);
      }
      fs.renameSync(this.logFile, backupPath);
    } catch (err) {
      console.error('[SwitchLogger] 轮转失败:', err.message);
    }
  }

  // 启动时加载最近日志到内存
  _loadRecent() {
    try {
      if (!fs.existsSync(this.logFile)) return;
      const content = fs.readFileSync(this.logFile, 'utf8');
      const lines = content.trim().split('\n').filter(Boolean).slice(-this.maxMemoryLogs);

      for (const line of lines) {
        const match = line.match(/^\[(.+?)\] \[(\w+)\] (.+?)(?:\s\|\s(.*))?$/);
        if (match) {
          this.logs.push({
            time: match[1],
            level: match[2].toLowerCase(),
            action: match[3],
            detail: match[4] || ''
          });
        }
      }
    } catch {}
  }
}

module.exports = SwitchLogger;
