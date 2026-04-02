// Open a system terminal and run KKClaw (npm start)
const { execFile } = require('child_process');
const path = require('path');

const projectPath = path.resolve(__dirname, '..');
const runCmd = `cd "${projectPath}" && npm start`;

function onError(err) {
  console.error('Failed to open terminal:', err.message);
  console.error(`Fallback: run manually -> ${runCmd}`);
  process.exitCode = 1;
}

if (process.platform === 'darwin') {
  const osaScript = [
    'tell application "Terminal"',
    'activate',
    `do script "${runCmd.replace(/"/g, '\\"')}"`,
    'end tell',
  ].join('\n');
  execFile('osascript', ['-e', osaScript], (err) => {
    if (err) onError(err);
  });
} else if (process.platform === 'win32') {
  const cmd = `start "" cmd.exe /k "cd /d ${projectPath} && npm start"`;
  execFile('cmd.exe', ['/d', '/s', '/c', cmd], (err) => {
    if (err) onError(err);
  });
} else {
  const candidates = [
    ['x-terminal-emulator', ['-e', 'sh', '-lc', runCmd]],
    ['gnome-terminal', ['--', 'sh', '-lc', runCmd]],
    ['konsole', ['-e', 'sh', '-lc', runCmd]],
    ['xterm', ['-e', 'sh', '-lc', runCmd]],
  ];
  let launched = false;
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
      launched = true;
    });
  };
  tryNext();
  if (!launched) {
    // async fallback will call onError if all fail
  }
}
