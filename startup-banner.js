// KKClaw Startup Hero Banner
// Animation: fire-sweep + flash + eye-open

const os = require('os');

const c = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  white:   '\x1b[37m',
  bWhite:  '\x1b[97m',
  gray:    '\x1b[90m',
  bRed:    '\x1b[91m',
  champagne: '\x1b[38;2;230;198;138m',
  bChampagne: '\x1b[38;2;247;231;206m',
  bGreen:  '\x1b[92m',
  bCyan:   '\x1b[96m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
};

function getBannerTheme(backendMode = 'openclaw') {
  if (backendMode === 'hermes') {
    return {
      backendLabel: 'Hermes Gateway',
      settle: c.bChampagne,
      accent: c.champagne,
    };
  }

  return {
    backendLabel: 'OpenClaw Gateway',
    settle: c.bRed,
    accent: c.bRed,
  };
}

// Lobster Ball (13 lines) — eyes CLOSED
const LOGO_CLOSED = [
  '            \u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2588\u2588\u2588\u2588            ',
  '          \u2588\u2588\u2591\u2591\u2591\u2591\u2591\u2591\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2588\u2588          ',
  '        \u2588\u2588\u2591\u2591\u2591\u2591\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2591\u2591\u2588\u2588        ',
  '       \u2588\u2591\u2591\u2591\u2591\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2588       ',
  '      \u2588\u2591\u2591\u2591\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2588      ',
  '     \u2588\u2591\u2591\u2591\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2588     ',
  '     \u2588\u2591\u2591\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2588     ',
  '     \u2588\u2591\u2591\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2588     ',
  '      \u2588\u2591\u2591\u2591\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2588      ',
  '       \u2588\u2591\u2591\u2591\u2591\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2588       ',
  '        \u2588\u2588\u2591\u2591\u2591\u2591\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2591\u2591\u2588\u2588        ',
  '          \u2588\u2588\u2591\u2591\u2591\u2591\u2591\u2591\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2588\u2588          ',
  '            \u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2588\u2588\u2588\u2588            ',
];

// Lobster Ball (13 lines) — eyes OPEN (line 6 has eye gaps)
const LOGO_OPEN = [
  '            \u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2588\u2588\u2588\u2588            ',
  '          \u2588\u2588\u2591\u2591\u2591\u2591\u2591\u2591\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2588\u2588          ',
  '        \u2588\u2588\u2591\u2591\u2591\u2591\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2591\u2591\u2588\u2588        ',
  '       \u2588\u2591\u2591\u2591\u2591\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2588       ',
  '      \u2588\u2591\u2591\u2591\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2588      ',
  '     \u2588\u2591\u2591\u2591\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2588     ',
  '     \u2588\u2591\u2591\u2588\u2588\u2588\u2588\u2588\u2588\u2588  \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588  \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2588     ',
  '     \u2588\u2591\u2591\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2588     ',
  '      \u2588\u2591\u2591\u2591\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2588      ',
  '       \u2588\u2591\u2591\u2591\u2591\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2588       ',
  '        \u2588\u2588\u2591\u2591\u2591\u2591\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2591\u2591\u2588\u2588        ',
  '          \u2588\u2588\u2591\u2591\u2591\u2591\u2591\u2591\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2588\u2588          ',
  '            \u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2588\u2588\u2588\u2588            ',
];

const TITLE = [
  ' \u2588\u2588\u2557  \u2588\u2588\u2557\u2588\u2588\u2557  \u2588\u2588\u2557 \u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2557      \u2588\u2588\u2588\u2588\u2588\u2557 \u2588\u2588\u2557    \u2588\u2588\u2557',
  ' \u2588\u2588\u2551 \u2588\u2588\u2554\u255d\u2588\u2588\u2551 \u2588\u2588\u2554\u255d\u2588\u2588\u2554\u2550\u2550\u2550\u2550\u255d\u2588\u2588\u2551     \u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2557\u2588\u2588\u2551    \u2588\u2588\u2551',
  ' \u2588\u2588\u2588\u2588\u2588\u2554\u255d \u2588\u2588\u2588\u2588\u2588\u2554\u255d \u2588\u2588\u2551     \u2588\u2588\u2551     \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2551\u2588\u2588\u2551 \u2588\u2557 \u2588\u2588\u2551',
  ' \u2588\u2588\u2554\u2550\u2588\u2588\u2557 \u2588\u2588\u2554\u2550\u2588\u2588\u2557 \u2588\u2588\u2551     \u2588\u2588\u2551     \u2588\u2588\u2554\u2550\u2550\u2588\u2588\u2551\u2588\u2588\u2551\u2588\u2588\u2588\u2557\u2588\u2588\u2551',
  ' \u2588\u2588\u2551  \u2588\u2588\u2557\u2588\u2588\u2551  \u2588\u2588\u2557\u255a\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2557\u2588\u2588\u2551  \u2588\u2588\u2551\u255a\u2588\u2588\u2588\u2554\u2588\u2588\u2588\u2554\u255d',
  ' \u255a\u2550\u255d  \u255a\u2550\u255d\u255a\u2550\u255d  \u255a\u2550\u255d \u255a\u2550\u2550\u2550\u2550\u2550\u255d\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u255d\u255a\u2550\u255d  \u255a\u2550\u255d \u255a\u2550\u2550\u255d\u255a\u2550\u2550\u255d ',
];

function getSystemInfo(version) {
  const cpus = os.cpus();
  const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);
  const platform = process.platform === 'win32' ? 'Windows' : process.platform === 'darwin' ? 'macOS' : 'Linux';
  const arch = process.arch === 'x64' ? 'x86_64' : process.arch;
  return {
    platform: `${platform} ${arch}`,
    node: process.versions.node,
    electron: process.versions.electron,
    cpu: `${cpus[0]?.model?.trim() || 'Unknown'} (${cpus.length} cores)`,
    memory: `${totalMem} GB`,
    version: version || '3.1.2',
  };
}

function printSeparator() {
  const width = Math.min(process.stdout.columns || 60, 60);
  console.log(c.gray + '='.repeat(width) + c.reset);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/** Render full banner frame as a single string (for flicker-free redraws) */
function renderFrame(logoLines, titleLines, colorFn) {
  let frame = '';
  for (let i = 0; i < logoLines.length; i++) {
    frame += '\x1b[2K\r' + colorFn(i, 'logo') + '  ' + logoLines[i] + c.reset + '\n';
  }
  frame += '\x1b[2K\r\n';
  for (let i = 0; i < titleLines.length; i++) {
    frame += '\x1b[2K\r' + colorFn(i, 'title') + ' ' + titleLines[i] + c.reset + '\n';
  }
  return frame;
}

// Total lines rendered: 13 (logo) + 1 (gap) + 6 (title) = 20
const TOTAL_LINES = LOGO_CLOSED.length + 1 + TITLE.length;

/**
 * Print startup Hero Banner:
 * 1. Closed-eyes lobster in dim gray
 * 2. White fire-sweep top to bottom
 * 3. Flash white → switch to open-eyes → settle into backend color
 */
async function printHero(version, animate = true, options = {}) {
  const info = getSystemInfo(version);
  const theme = getBannerTheme(options.backendMode);

  console.log('');

  if (animate) {
    // === Phase 1: Closed-eye logo, dim gray ===
    process.stdout.write(renderFrame(LOGO_CLOSED, TITLE, () => c.dim + c.gray));
    await sleep(400);

    // === Phase 2: Fire sweep (white band top-to-bottom, closed eyes) ===
    for (let front = -1; front <= TOTAL_LINES + 1; front++) {
      process.stdout.write('\x1b[' + TOTAL_LINES + 'A');
      process.stdout.write(renderFrame(LOGO_CLOSED, TITLE, (lineIdx, section) => {
        const g = section === 'logo' ? lineIdx : LOGO_CLOSED.length + 1 + lineIdx;
        if (g <= front - 2) return theme.settle + (section === 'title' ? c.bold : '');
        if (g === front - 1 || g === front) return c.bWhite + c.bold;
        return c.dim + c.gray;
      }));
      const t = Math.max(0, Math.min(1, front / TOTAL_LINES));
      await sleep(Math.round(50 - 30 * Math.sin(t * Math.PI)));
    }

    // === Phase 3: Flash white (closed eyes) ===
    await sleep(60);
    process.stdout.write('\x1b[' + TOTAL_LINES + 'A');
    process.stdout.write(renderFrame(LOGO_CLOSED, TITLE, () => c.bWhite + c.bold));
    await sleep(120);

    // === Phase 4: Eyes OPEN! Settle into backend accent ===
    process.stdout.write('\x1b[' + TOTAL_LINES + 'A');
    process.stdout.write(renderFrame(LOGO_OPEN, TITLE, (_i, section) =>
      theme.settle + (section === 'title' ? c.bold : '')));

  } else {
    // No animation: open eyes in backend accent
    process.stdout.write(renderFrame(LOGO_OPEN, TITLE, (_i, section) =>
      theme.settle + (section === 'title' ? c.bold : '')));
  }

  // Subtitle
  console.log('');
  console.log(
    c.gray + '  ' + c.reset +
    c.white + c.bold + ' Desktop Pet  x  ' + c.reset +
    theme.accent + c.bold + theme.backendLabel + c.reset +
    c.white + c.bold + '  x  Live Console' + c.reset
  );
  console.log('');

  printSeparator();

  // System info
  const label = (l) => c.gray + '  ' + l.padEnd(12) + c.reset;
  const val = (v) => c.white + v + c.reset;
  const hi = (v) => c.bCyan + c.bold + v + c.reset;

  console.log(label('Version') + hi('v' + info.version));
  console.log(label('Electron') + val('v' + info.electron) +
    c.gray + '  |  ' + c.reset + label('Node') + val('v' + info.node));
  console.log(label('Platform') + val(info.platform));
  console.log(label('CPU') + val(info.cpu));
  console.log(label('Memory') + val(info.memory));

  printSeparator();
  console.log(c.yellow + '  >> ' + c.reset + 'Initializing modules...');
  console.log('');
}

function printReady(target = 18789, options = {}) {
  const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  const theme = getBannerTheme(options.backendMode);
  const gatewayTarget = typeof target === 'string' ? target : `http://127.0.0.1:${target}`;
  printSeparator();
  console.log('');
  console.log(c.bGreen + c.bold + '  [OK] KKClaw is ready!' + c.reset);
  console.log('');
  console.log(c.gray + '  Backend   ' + c.reset + theme.accent + c.bold +
    theme.backendLabel + c.reset);
  console.log(c.gray + '  Gateway   ' + c.reset + c.green + c.bold +
    gatewayTarget + c.reset);
  console.log(c.gray + '  Started   ' + c.reset + c.white + time + c.reset);
  console.log(c.gray + '  Logs      ' + c.reset + c.dim +
    'Gateway output will appear below' + c.reset);
  console.log('');
  printSeparator();
  console.log('');
}

module.exports = { printHero, printReady };
