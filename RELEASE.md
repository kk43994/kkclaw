# KKClaw Release Process

Use this checklist for every user-facing KKClaw iteration. The goal is to keep versions, tags, docs, and GitHub artifacts aligned.

## Release rules

- Treat `package.json`, `package-lock.json`, `README.md`, and `CHANGELOG.md` as release metadata.
- Every shipped iteration must have:
  - a version bump
  - a changelog entry
  - a git tag
  - a GitHub push for both commit and tag
- Keep KKClaw aligned with the installed OpenClaw workflow unless the release explicitly changes that contract.

## Versioning

- `patch` for bug fixes, polish, diagnostics, and non-breaking repo/process improvements
- `minor` for new user-facing features, command surfaces, workflow additions, or notable UX improvements
- `major` for breaking changes, migration-required config changes, or incompatible workflow shifts

## Pre-release checklist

1. Confirm the scope of the iteration.
2. Run targeted tests for the touched surface.
3. Run key manual checks:
   - `kkclaw --version`
   - `kkclaw gateway status`
   - `kkclaw doctor`
   - `kkclaw dashboard --no-open` or `kkclaw dashboard`
4. Update `README.md` if user-facing behavior changed.
5. Add a new entry to `CHANGELOG.md`.
6. Bump versions in:
   - `package.json`
   - `package-lock.json`

## Release commands

```bash
# Example patch release
npm version 3.6.1 --no-git-tag-version

# Commit the release payload
git add package.json package-lock.json CHANGELOG.md README.md
git commit -m "Release v3.6.1"

# Tag it
git tag -a v3.6.1 -m "Release v3.6.1"

# Push code + tag
git push origin master
git push origin v3.6.1
```

## GitHub release follow-up

After pushing the tag:

1. Verify the GitHub Actions release workflow starts.
2. Create or review the GitHub Release notes for the new tag.
3. Check that artifacts are attached for supported platforms.
4. Sanity-check the README download links if they were updated manually.

## Post-release checklist

- Confirm `git status` is clean.
- Confirm `git ls-remote --tags origin vX.Y.Z` shows the new tag.
- Confirm `master` contains the release commit.
- Open a follow-up maintenance issue if there is known unfinished work.
