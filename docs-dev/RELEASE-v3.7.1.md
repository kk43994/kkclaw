# KKClaw v3.7.1 — Hermes Readiness Patch

> Release date: 2026-04-14

A focused patch release for Hermes compatibility.

## Fixed

- Hermes startup and desktop chat now fail fast when `API_SERVER_ENABLED=true` is missing, instead of entering a half-working state
- Hermes is no longer marked as installed when only `~/.hermes` exists but the Hermes CLI is missing

## Added

- Regression coverage for the “leftover config directory, missing Hermes CLI” false-positive case
