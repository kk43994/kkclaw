# KKClaw v3.7.0 — Hermes Compatibility & Dual Backend Launcher

> Release date: 2026-04-11

<div align="center">
  <img src="https://raw.githubusercontent.com/kk43994/kkclaw/master/docs/images/hermes-agent-banner.png" alt="Hermes Agent banner" width="100%">
  <p><sub>Hermes Agent banner adapted from <a href="https://github.com/NousResearch/hermes-agent">NousResearch/hermes-agent</a></sub></p>
</div>

KKClaw is now officially compatible with Hermes.

This release turns KKClaw from an OpenClaw-only desktop companion into a more flexible desktop shell that can drive OpenClaw, Hermes, or automatically choose between them while keeping the same animated console, health checks, voice layer, and desktop presence.

## Highlights

- Hermes compatibility mode via `KKCLAW_COMPAT_MODE` or `pet-config.json.compatMode`
- OpenClaw / Hermes / Auto launcher before entering the animated terminal
- External Hermes Gateway reuse instead of false port-conflict warnings
- Backend-aware `status`, `doctor`, `gateway status`, `dashboard`, and startup banners
- Clearer voice playback docs: TTS works only when the agent actively triggers `desktop-bridge.js`

## Added

- Hermes-compatible backend resolver with `openclaw`, `hermes`, and `auto` modes
- Launcher flow that remembers the last backend choice
- Example config support for `compatMode: "auto"`
- Release docs and README visuals for Hermes compatibility

## Improved

- Diagnostics now expose backend label, CLI path, probe source, log paths, API server readiness, and reuse hints
- Startup and ready banners now reflect the active backend theme
- Gateway host, dashboard target, token usage, and lifecycle operations now follow the active backend
- README now more clearly separates TTS issues from "agent never triggered bridge" issues

## Fixed

- Hermes services already running outside KKClaw are no longer treated as ownership conflicts
- Console launch helpers now route through the same backend-aware entrypoint
- Regression coverage added for Hermes mode, launcher defaults, and reusable external services
