# Plane Skills Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a versioned npm package that installs four Plane skills for Codex and Claude Code.

**Architecture:** A Node 20 TypeScript package exposes a `plane-skills` CLI that installs packaged Agent Skills into an explicitly selected runtime directory. The skills invoke a shared Node helper, which validates environment configuration and makes Plane REST calls; all state-changing instructions require user confirmation immediately before execution.

**Tech Stack:** Node.js 20+, TypeScript, `tsx`, Vitest, Node `fetch`, npm SemVer.

**Spec:** `docs/superpowers/specs/2026-08-25-plane-skills-design.md`

## Global Constraints

- Use package name `@aonic/plane-skills` and Semantic Versioning.
- Require `--runtime codex|claude` and exactly one target: `--global` or `--project`.
- Codex targets are `~/.codex/skills` and `.agents/skills`; Claude targets are `~/.claude/skills` and `.claude/skills`.
- Never write Plane credentials or context to disk; use `PLANE_API_KEY`, `PLANE_WORKSPACE_SLUG`, `PLANE_PROJECT_ID`, and optional `PLANE_API_BASE_URL` only.
- A User Story is an exact `User Story` work-item type; subtickets use that item UUID as `parent`.
- Confirm immediately before every Plane POST or PATCH; never auto-retry mutations.
- Do not publish to npm as part of this plan.

---

## File structure

```text
package.json                         Package scripts, bin entry, release metadata
tsconfig.json                        Strict TypeScript build configuration
src/cli.ts                           Argument parsing and install/update orchestration
src/install.ts                       Runtime target, manifest, hash, copy, update rules
src/plane/config.ts                  Environment validation and safe configuration
src/plane/client.ts                  Authenticated Plane fetch and bounded read retries
src/plane/work-items.ts              Work-item, type, state, and search operations
src/plane/index.ts                   CLI-facing action commands used by skills
skills/*/SKILL.md                    Four portable Agent Skills
skills/*/agents/openai.yaml          Codex-only UI metadata
tests/install.test.ts                Installer and update behavior
tests/plane-client.test.ts           HTTP, errors, and retry behavior
tests/plane-work-items.test.ts       Plane endpoint/request behavior
tests/skills.test.ts                 Skill contents and mutation confirmation invariants
README.md                            npx install/update and environment setup
```

### Task 1: Bootstrap a testable TypeScript npm package

**Files:**
- Create: `package.json`, `tsconfig.json`, `.gitignore`, `README.md`
- Create: `src/cli.ts`, `tests/package.test.ts`

**Interfaces:**
- Produces `npm run test`, `npm run typecheck`, `npm run build`, and executable `plane-skills`.

- [ ] **Step 1: Write the failing package contract test.**

```ts
import pkg from '../package.json';
import { expect, test } from 'vitest';

test('publishes an executable CLI and quality scripts', () => {
  expect(pkg.name).toBe('@aonic/plane-skills');
  expect(pkg.bin).toEqual({ 'plane-skills': './dist/cli.js' });
  expect(pkg.scripts).toMatchObject({ test: 'vitest run', typecheck: 'tsc --noEmit' });
});
```

- [ ] **Step 2: Run `npm test -- tests/package.test.ts` and verify it fails because `package.json` is absent.**
- [ ] **Step 3: Add `package.json` using Node >=20, `type: module`, `files: ["dist", "skills", "README.md"]`, a `bin` map, and dev dependencies `typescript`, `tsx`, and `vitest`; add strict `tsconfig.json` targeting ES2022.**
- [ ] **Step 4: Add a minimal `src/cli.ts` that exports `main(): Promise<void>` and calls it only when executed as the bin entry.**
- [ ] **Step 5: Run `npm install`, `npm test -- tests/package.test.ts`, and `npm run typecheck`; verify all pass.**
- [ ] **Step 6: Commit `chore: bootstrap plane skills package`.**

### Task 2: Implement Plane configuration and safe HTTP client

**Files:**
- Create: `src/plane/config.ts`, `src/plane/client.ts`
- Test: `tests/plane-client.test.ts`

**Interfaces:**
- Produces `readPlaneConfig(env): PlaneConfig` and `PlaneClient.request<T>(path, init, options): Promise<T>`.
- `PlaneConfig` is `{ apiKey: string; workspaceSlug: string; projectId: string; baseUrl: string }`.

- [ ] **Step 1: Write failing tests for missing configuration, request headers, a 429 read retry, and no mutation retry.**

```ts
test('uses X-API-Key without exposing it in errors', async () => {
  const fetcher = vi.fn().mockResolvedValue(jsonResponse({ results: [] }));
  await new PlaneClient(config, fetcher).request('/health', { method: 'GET' }, { retryRead: true });
  expect(fetcher).toHaveBeenCalledWith('https://api.plane.so/health', expect.objectContaining({
    headers: expect.objectContaining({ 'X-API-Key': 'secret' }),
  }));
});

test('does not retry a POST', async () => {
  const fetcher = vi.fn().mockResolvedValue(jsonResponse({ detail: 'busy' }, 503));
  await expect(client.request('/items', { method: 'POST' })).rejects.toThrow('Plane request failed: 503');
  expect(fetcher).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run `npm test -- tests/plane-client.test.ts` and verify it fails because the modules do not exist.**
- [ ] **Step 3: Implement `readPlaneConfig` to reject empty required variables, default and normalize `PLANE_API_BASE_URL` to `https://api.plane.so`, and never return the key in an error message.**
- [ ] **Step 4: Implement `PlaneClient` with JSON request/response handling, `X-API-Key`, `Content-Type: application/json` for bodies, and `PlaneApiError` containing status plus server detail with credential redaction. Retry GET only on 429/500/502/503/504 at most twice, using `Retry-After` or bounded exponential delay.**
- [ ] **Step 5: Re-run the focused test, then `npm run typecheck`; verify both pass.**
- [ ] **Step 6: Commit `feat: add safe Plane API client`.**

### Task 3: Implement work-item operations

**Files:**
- Create: `src/plane/work-items.ts`, `src/plane/index.ts`
- Test: `tests/plane-work-items.test.ts`

**Interfaces:**
- Consumes `PlaneClient` and `PlaneConfig`.
- Produces `findUserStoryType()`, `getWorkItem(id)`, `createWorkItem(payload)`, `searchWorkItems(query)`, `listStates()`, `resolveUniqueByName()`, and `updateWorkItemState(id, stateId)`.

- [ ] **Step 1: Write failing request-contract tests.**

```ts
test('creates a child with parent and type_id', async () => {
  await api.createWorkItem({ name: 'Add audit event', parent: 'story-1', typeId: 'task-1' });
  expect(fetcher).toHaveBeenCalledWith(
    'https://api.plane.so/api/v1/workspaces/acme/projects/project-1/work-items/',
    expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'Add audit event', parent: 'story-1', type_id: 'task-1' }) }),
  );
});

test('rejects when the exact User Story type is absent', async () => {
  await expect(api.findUserStoryType()).rejects.toThrow('User Story work-item type was not found');
});
```

- [ ] **Step 2: Run `npm test -- tests/plane-work-items.test.ts` and verify it fails because `PlaneWorkItems` is missing.**
- [ ] **Step 3: Implement the documented Plane calls: POST `/api/v1/workspaces/{workspace}/projects/{project}/work-items/`; PATCH `/work-items/{id}/`; GET `/api/v1/workspaces/{workspace}/work-items/search/?project_id={project}&search={query}`; list types and states from their project endpoints. Follow every `next_cursor` response for list endpoints.**
- [ ] **Step 4: Resolve case-sensitive `User Story`; reject zero or multiple exact matches. Resolve named issue/state selections only when unique, returning candidate summaries when ambiguous. Convert descriptions to escaped paragraph HTML before posting as `description_html`.**
- [ ] **Step 5: Run focused tests and `npm test`; verify all pass.**
- [ ] **Step 6: Commit `feat: add Plane work item operations`.**

### Task 4: Author the four portable skills and their Codex metadata

**Files:**
- Create: `skills/plane-create-subticket/SKILL.md`, `skills/plane-create-subticket/agents/openai.yaml`
- Create: `skills/plane-search-tickets/SKILL.md`, `skills/plane-search-tickets/agents/openai.yaml`
- Create: `skills/plane-create-user-story/SKILL.md`, `skills/plane-create-user-story/agents/openai.yaml`
- Create: `skills/plane-update-status/SKILL.md`, `skills/plane-update-status/agents/openai.yaml`
- Test: `tests/skills.test.ts`

**Interfaces:**
- Consumes the package CLI operations defined in Task 5: `get`, `search`, `types`, `states`, `create`, and `set-state`.
- Produces four Agent Skills valid for Codex and Claude Code; `openai.yaml` is excluded for Claude targets.

- [ ] **Step 1: Write failing invariant tests that read every `SKILL.md`.**

```ts
test.each(['plane-create-subticket', 'plane-create-user-story', 'plane-update-status'])(
  '%s requires confirmation before mutation',
  (skill) => expect(readSkill(skill)).toMatch(/confirm.*immediately before/i),
);

test('search is read-only', () => expect(readSkill('plane-search-tickets')).toMatch(/never changes Plane data/i));
```

- [ ] **Step 2: Run `npm test -- tests/skills.test.ts` and verify it fails because skills do not exist.**
- [ ] **Step 3: Write concise standard frontmatter (`name`, discriminating `description`) and instructions for each workflow. Require the skill to validate the environment, use the shared commands, resolve ambiguity rather than guessing, present a payload/transition, receive explicit confirmation, then invoke exactly one mutation.**
- [ ] **Step 4: In subticket instructions, retrieve and summarize the selected parent first, ensure it has type `User Story`, then create the child with `parent`. In story instructions, create with the exact `User Story` type. In status instructions, list/resolve states and PATCH only `state`.**
- [ ] **Step 5: Add `agents/openai.yaml` with display name and short description; use no Claude-specific frontmatter so the same `SKILL.md` remains portable.**
- [ ] **Step 6: Run focused tests and validate each skill with the Codex skill validator; verify success.**
- [ ] **Step 7: Commit `feat: add Plane workflow skills`.**

### Task 5: Implement installer, manifest protections, and skill command runner

**Files:**
- Create: `src/install.ts`, `src/plane-cli.ts`
- Modify: `src/cli.ts`, `package.json`
- Test: `tests/install.test.ts`

**Interfaces:**
- Produces `resolveTarget(runtime, scope, cwd, home)`, `installPackage(options)`, and CLI commands `install`, `update`, and internal `plane`.
- Manifest filename is `.plane-skills-manifest.json` in the selected skills root, containing `{ packageName, version, runtime, files: Record<string, string> }`.

- [ ] **Step 1: Write failing installer tests.**

```ts
test('maps runtime and scope to the documented directory', () => {
  expect(resolveTarget('claude', 'global', '/repo', '/home/a')).toBe('/home/a/.claude/skills');
  expect(resolveTarget('codex', 'project', '/repo', '/home/a')).toBe('/repo/.agents/skills');
});

test('update preserves a manually changed packaged file without --force', async () => {
  await expect(updatePackage(options)).rejects.toThrow('modified since installation');
});
```

- [ ] **Step 2: Run `npm test -- tests/install.test.ts` and verify it fails because installer functions do not exist.**
- [ ] **Step 3: Implement argument parsing that requires a valid command, `--runtime`, and exactly one scope. Copy the four skill directories into the target, rendering their command examples with the installed package version. For Claude, omit every `agents/openai.yaml`; for Codex, retain it. Use recursive copy with SHA-256 hashes and atomic manifest replacement.**
- [ ] **Step 4: On update, compare current hashes to manifest hashes before replacing. Reject any mismatch with the exact changed relative paths unless `--force`; leave unrelated target files untouched. Report target, prior version, and installed version.**
- [ ] **Step 5: Implement `plane-skills plane <operation>` in `src/plane-cli.ts` to call Task 3 interfaces and print only JSON result data or redacted errors. Include operations `get`, `search`, `types`, `states`, `create`, and `set-state`.**
- [ ] **Step 6: Run focused tests, `npm test`, `npm run typecheck`, and `npm run build`; verify all pass.**
- [ ] **Step 7: Commit `feat: install and update skills by runtime`.**

### Task 6: Finish documentation and release checks

**Files:**
- Modify: `README.md`, `package.json`
- Test: `tests/package.test.ts`

**Interfaces:**
- Produces user-facing installation/update examples and package artifacts suitable for `npm pack --dry-run`.

- [ ] **Step 1: Write a failing documentation test asserting README includes all four install targets, update command, all four required/optional variables, and states that publishing is not performed locally.**
- [ ] **Step 2: Run `npm test -- tests/package.test.ts` and verify it fails on missing documentation.**
- [ ] **Step 3: Document `npx @aonic/plane-skills@latest install --runtime {codex|claude} --{global|project}`, update commands, environment setup, User Story type requirement, confirmation behavior, self-hosted base URL, and `npm version patch|minor|major` followed by maintainer-authorized `npm publish`.**
- [ ] **Step 4: Run `npm test`, `npm run typecheck`, `npm run build`, and `npm pack --dry-run`; verify skills and built CLI are included, tests pass, and no credential/config file is listed.**
- [ ] **Step 5: Commit `docs: document Plane skills installation and releases`.**

## Plan self-review

- Spec coverage: Tasks 1, 5, and 6 cover npm, SemVer, install/update, and both runtimes; Tasks 2–3 cover configuration and Plane REST; Task 4 covers all four skills and confirmation; Tasks 2–6 cover safety and tests. No gaps found.
- Placeholder scan: no TBD/TODO, undefined operations, or generic testing steps remain.
- Type consistency: Task 2 supplies `PlaneConfig`/`PlaneClient`; Task 3 supplies `PlaneWorkItems` operations; Task 5 exposes those operations to the skills authored in Task 4.
