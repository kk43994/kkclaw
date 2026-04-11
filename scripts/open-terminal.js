// Open a system terminal and run KKClaw.
const { execFile } = require('child_process');
const path = require('path');

const DEFAULT_PROJECT_PATH = path.resolve(__dirname, '..');
const DEFAULT_ENTRY_COMMAND = 'node scripts/launch-console.js';

function buildRunCommand(options = {}) {
  const projectPath = options.projectPath || DEFAULT_PROJECT_PATH;
  const entryCommand = options.entryCommand || DEFAULT_ENTRY_COMMAND;
  return `cd "${projectPath}" && ${entryCommand}`;
}

function openTerminal(options = {}) {
  const projectPath = options.projectPath || DEFAULT_PROJECT_PATH;
  const runCmd = buildRunCommand(options);

  return new Promise((resolve, reject) => {
    const onError = (err) => {
      console.error('Failed to open terminal:', err.message);
      console.error(`Fallback: run manually -> ${runCmd}`);
      reject(err);
    };

    if (process.platform === 'darwin') {
      const osaScript = [
        'tell application "Terminal"',
        'activate',
        `do script "${runCmd.replace(/"/g, '\\"')}"`,
        'end tell',
      ].join('\n');
      execFile('osascript', ['-e', osaScript], (err) => {
        if (err) {
          onError(err);
          return;
        }
        resolve({ launched: true, command: runCmd });
      });
      return;
    }

    if (process.platform === 'win32') {
      const cmd = `start "" cmd.exe /k "${runCmd}"`;
      execFile('cmd.exe', ['/d', '/s', '/c', cmd], (err) => {
        if (err) {
          onError(err);
          return;
        }
        resolve({ launched: true, command: runCmd });
      });
      return;
    }

    const candidates = [
      ['x-terminal-emulator', ['-e', 'sh', '-lc', runCmd]],
      ['gnome-terminal', ['--', 'sh', '-lc', runCmd]],
      ['konsole', ['-e', 'sh', '-lc', runCmd]],
      ['xterm', ['-e', 'sh', '-lc', runCmd]],
    ];

    const tryNext = () => {
      if (candidates.length === 0) {
        onError(new Error('No supported terminal found'));
        return;
      }
      const [bin, args] = candidates.shift();
      execFile(bin, args, (err) => {
        if (err) {
          tryNext();
          return;
        }
        resolve({ launched: true, command: runCmd });
      });
    };

    tryNext();
  });
}

module.exports = {
  buildRunCommand,
  openTerminal,
};

if (require.main === module) {
  openTerminal().catch(() => {
    process.exitCode = 1;
  });
}
