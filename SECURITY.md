# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 3.1.x   | :white_check_mark: |
| 3.0.x   | :white_check_mark: |
| < 3.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT open a public issue**
2. Email: [kk43994@gmail.com](mailto:kk43994@gmail.com)
3. Include: description, reproduction steps, and affected version
4. Expected response within 48 hours

## Security Measures Implemented

### v3.1.1+ — Command Injection Prevention

- **Audio playback** — `exec()` shell string interpolation replaced with `execFile()`/`spawn()` + argument arrays in `_playAudioFile()` and `_playAudio()`
- **Edge TTS** — User text passed via temp file (`--text-file`) instead of inline `--text` to prevent shell injection
- **Commit**: [`f8f73a3`](https://github.com/kk43994/kkclaw/commit/f8f73a3)

### v3.0.0+ — Electron Security Hardening

- **IPC Whitelist** — All renderer-to-main communication goes through explicit IPC channel whitelist in preload scripts. Renderer processes cannot directly `require()` Node.js modules
- **safeStorage Encryption** — API keys encrypted with Electron's `safeStorage` API; keys never stored in plaintext on disk
- **Preload Sandbox** — Separate preload scripts for each window type (main, lyrics, diagnostic, model-settings, setup-wizard), each exposing only the APIs needed

### v2.0.4+ — Credential Hygiene

- **Hardcoded credentials removed** — 5 files cleaned of API keys, tokens, and personal paths
- **Runtime config** — `openclaw-client.js` reads tokens from `~/.openclaw/openclaw.json` at runtime, not at module load
- **Asar audit** — Verified 0 secret leaks in packaged `.asar` build artifact

### Runtime Security Modules

| Module | Purpose |
| --- | --- |
| `SecureStorage` | Encrypts/decrypts sensitive config values using Electron safeStorage |
| `LogSanitizer` | Strips tokens, keys, and PII from log output before writing to disk |
| `IpcValidator` | Validates IPC channel names against whitelist; rejects unknown channels |
| `GatewayGuardian` | Monitors gateway process health; prevents unauthorized restarts |

## Dependency Security

- **Minimal dependencies** — Only `ws` (WebSocket) as production dependency
- **Electron** — Kept up to date (currently v28.x)
- Run `npm audit` to check for known vulnerabilities

## Best Practices for Users

1. **Never share** your `pet-config.json` — it may contain API keys
2. **Use `.env`** for sensitive configuration (see `.env.example`)
3. **Keep KKClaw updated** to get the latest security fixes
4. **Review permissions** before granting microphone/file access in Setup Wizard
