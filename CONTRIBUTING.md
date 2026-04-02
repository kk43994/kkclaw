# Contributing to KKClaw

感谢你对 KKClaw 的关注！欢迎通过以下方式参与贡献。

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- Git
- Python 3.6+ (optional, for Edge TTS)

### Setup Development Environment

```bash
# Clone the repo
git clone https://github.com/kk43994/kkclaw.git
cd kkclaw

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm start
```

### Project Structure

```
kkclaw/
├── main.js                 # Electron main process entry
├── preload.js              # Main window preload script
├── setup-preload.js        # Setup wizard preload script
├── index.html              # Main pet UI
├── setup-wizard.html       # Setup wizard UI
├── openclaw-client.js      # OpenClaw API client
├── smart-voice.js          # TTS voice system
├── message-sync.js         # WebSocket message sync
├── gateway-guardian.js     # Gateway health monitor
├── service-manager.js      # Service lifecycle manager
├── model-switcher.js       # AI model hot-swap
├── cache-manager.js        # Cache management
├── pet-config.js           # Configuration loader
├── utils/                  # Utility modules
├── voice/                  # TTS engine implementations
├── scripts/                # Build & utility scripts
├── tests/                  # Test files
├── docs/                   # GitHub Pages & docs
└── docs-dev/               # Developer documentation
```

## How to Contribute

### Reporting Bugs

1. Check [existing issues](https://github.com/kk43994/kkclaw/issues) first
2. Use the bug report template
3. Include: OS, KKClaw version, steps to reproduce, expected vs actual behavior
4. Attach logs from `%APPDATA%/kkclaw/logs/` (Windows) or `~/Library/Logs/kkclaw/` (macOS)

### Suggesting Features

1. Open a [feature request issue](https://github.com/kk43994/kkclaw/issues/new)
2. Describe the use case and expected behavior
3. If possible, include mockups or references

### Submitting Code

1. Fork the repo and create a feature branch
   ```bash
   git checkout -b feat/your-feature
   ```

2. Follow existing code patterns:
   - Use class-based modules (see `cache-manager.js` as template)
   - Add IPC channels to preload whitelist when needed
   - Never use `exec()` with string interpolation — use `execFile()` or `spawn()`

3. Test your changes:
   ```bash
   npm test          # Run automated tests
   npm run dev       # Manual testing
   ```

4. Commit with conventional format:
   ```
   feat: add new emotion type
   fix: resolve TTS playback on macOS
   docs: update configuration guide
   refactor: simplify gateway health check
   ```

5. Open a Pull Request against `master`

## Release Discipline

KKClaw is a continuously maintained project, so every meaningful iteration should be traceable.

- Update `CHANGELOG.md` for every user-facing change
- Bump the version when shipping an iteration
- Tag every shipped release
- Push both commit and tag to GitHub
- Use [RELEASE.md](RELEASE.md) as the release checklist

## Code Style

- **No semicolons** (project uses ASI)
- **Single quotes** for strings
- **2-space indentation**
- **Descriptive variable names** (Chinese comments are OK)
- **Error handling** — Always catch async errors, provide user-friendly messages

## Security

- **Never commit API keys, tokens, or credentials**
- Use `SecureStorage` for sensitive data
- Use `execFile()`/`spawn()` instead of `exec()` for shell commands
- All new IPC channels must be added to the preload whitelist
- See [SECURITY.md](SECURITY.md) for full details

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
