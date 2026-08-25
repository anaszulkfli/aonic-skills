# Task 6 report

## Delivered

- Documented all four runtime/scope installation targets for Codex and Claude Code.
- Documented runtime-matched update commands, target directories, manifest/file-change protection, and `--force` behavior.
- Documented `PLANE_API_KEY`, `PLANE_WORKSPACE_SLUG`, `PLANE_PROJECT_ID`, optional `PLANE_API_BASE_URL`, and self-hosted Plane setup.
- Documented the exact case-sensitive `User Story` requirement and explicit confirmation immediately before mutations.
- Documented package checks, expected `npm pack --dry-run` contents, and maintainer-authorized `npm version`/`npm publish` release steps; no publish was performed.
- Added a package test that guards the required user-facing documentation.

## TDD and verification

The new documentation test was run before the README implementation and failed on the missing install command. It then passed after the documentation was added.

- `npm test -- tests/package.test.ts` — 2 tests passed
- `npm test` — 32 tests passed across 6 files
- `npm run typecheck` — passed
- `npm run build` — passed
- `npm_config_cache=/private/tmp/plane-npm-cache npm pack --dry-run` — passed; package contained `dist`, `skills`, `README.md`, and no credential/config files
- `git diff --check` — passed

## Concern

The default `npm pack --dry-run` cache failed with `EPERM` because `/Users/user/.npm` contains root-owned cache files. The same required command succeeded with an isolated temporary npm cache. No credentials were accessed and npm publish was not run.

## Commit

Commit subject: `docs: document Plane skills installation and releases` (final SHA is reported in the agent handoff).
