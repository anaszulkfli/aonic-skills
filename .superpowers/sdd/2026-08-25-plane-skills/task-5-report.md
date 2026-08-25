# Task 5 report

## Delivered

- Added the runtime/scope installer with SHA-256 manifests, atomic manifest replacement, update protection for changed package files, and forced-update support.
- Codex installs retain `agents/openai.yaml`; Claude installs omit it. Both preserve unrelated target files.
- Added `install`, `update`, and `plane` CLI commands. The Plane command emits JSON results or redacted JSON errors for `get`, `search`, `types`, `states`, `create`, and `set-state`.
- Corrected the inherited CLI direct-execution guard using `fileURLToPath`.

## TDD and verification

- The new installer suite was first run before `src/install.ts` existed and failed with `Cannot find module '../src/install.js'`.
- `npm test -- tests/install.test.ts` — 5 tests passed.
- `npm test` — 21 tests passed across 4 files.
- `npm run typecheck` — passed.
- `npm run build` — passed.
- `git diff --check` — passed.

## Concern

The four skill source directories are intentionally absent until Task 4. The installer is verified against controlled fixtures and will copy those exact source directories once Task 4 adds them.

## Commit

`feat: install and update skills by runtime`

## Fix round 1

- `update` now refuses to overwrite an existing packaged skill directory when its manifest is missing, malformed, for a different runtime, or for another package; `--force` remains the explicit override.
- The executable guard resolves both the supplied bin path and module path, allowing npm-style symlinked bins to run.
- The Plane runner validates exact positional arguments and accepted, non-duplicate `create` options before reading configuration or making a request.

Regression verification: `npm test` passed 25 tests across 5 files; `npm run typecheck`, `npm run build`, and `git diff --check` passed.
