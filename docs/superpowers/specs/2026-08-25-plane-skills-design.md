# Plane Skills Package Design

## Goal

Publish one versioned npm package, `@aonic/plane-skills`, that installs and updates four Plane work-item skills for both Codex and Claude Code:

1. Create a subticket below a User Story.
2. Search relevant tickets from a natural-language prompt.
3. Create a User Story.
4. Update a ticket's status.

## Package and installation

The package is TypeScript-based and exposes an `npx` CLI.

```text
npx @aonic/plane-skills install --runtime codex --global
npx @aonic/plane-skills install --runtime codex --project
npx @aonic/plane-skills install --runtime claude --global
npx @aonic/plane-skills install --runtime claude --project
npx @aonic/plane-skills update --runtime codex --global
npx @aonic/plane-skills update --runtime claude --project
```

The `--runtime` option is required to prevent installation into an unintended tool's directory. `--global` installs to `~/.codex/skills` for Codex and `~/.claude/skills` for Claude Code. `--project` installs to `.agents/skills` for Codex and `.claude/skills` for Claude Code in the current project. The CLI creates an install manifest recording the package version, target runtime, destination, installed files, and their hashes. Updates replace only files previously installed by this package. They preserve unrelated skills and refuse to replace manually modified installed files unless `--force` is supplied.

The package follows Semantic Versioning. Users may select a release through npx package resolution, for example `@aonic/plane-skills@1.1.0` or `@latest`.

## Layout

```text
bin/
  plane-skills.js
skills/
  plane-create-subticket/
  plane-search-tickets/
  plane-create-user-story/
  plane-update-status/
shared/
  Plane REST helper scripts and API reference
```

The skills follow the Agent Skills open standard. The package emits target-specific metadata only where a runtime needs it; the shared instructions and helper scripts remain identical. The four installed skills use shared helpers so HTTP authentication, errors, pagination, and self-hosted base URLs behave consistently.

## Plane configuration

The skills use environment variables only. They never write credentials or workspace configuration to disk:

```text
PLANE_API_KEY
PLANE_WORKSPACE_SLUG
PLANE_PROJECT_ID
PLANE_API_BASE_URL   # optional; defaults to https://api.plane.so
```

The helper sends `PLANE_API_KEY` in the `X-API-Key` header. It validates required configuration before making a request and redacts credentials from output. `PLANE_API_BASE_URL` supports self-hosted Plane deployments.

## User Story model

`User Story` is the exact, case-sensitive Plane work-item type display name. Its UUID is resolved from the configured project before creating a User Story or validating a selected parent. A subticket is a new work item with its `parent` field set to the selected User Story UUID. The creation workflow fails instead of guessing when the type is absent or the selected parent is not that type.

## Skill workflows

### Create subticket

The skill resolves the referenced User Story, fetches and summarizes it, and derives the requested child work item. It shows the title, description, type, and parent for user confirmation immediately before creating the item. It then verifies and reports the created item.

### Search tickets

The skill translates a prompt into Plane search criteria, handles pagination, and returns compact ranked matches with identifiers, state, type, and URL. This is read-only.

### Create User Story

The skill converts the request into a title, description, and acceptance criteria. It resolves the exact User Story type, presents the payload, and creates only after user confirmation.

### Update status

The skill resolves the target work item and requested state by name. It presents the current-to-requested transition and updates the `state` field only after confirmation. Ambiguous work-item or state names require user selection.

## Error handling and safety

All mutating workflows require an explicit confirmation immediately before their POST or PATCH request. The workflows report actionable errors for missing environment variables, authentication failures, a missing User Story type, invalid/ambiguous selections, and Plane HTTP errors. They do not retry mutations automatically. Read requests may make bounded retries for 429 and transient 5xx errors while respecting Plane response headers.

## Verification

Automated tests cover installation target selection, manifests, version/update rules, file-change protection, required environment variables, URL/request construction, authentication header handling, pagination, ambiguous matches, User Story parent/type validation, and confirmation gates. HTTP tests use mocked responses and never require live Plane credentials.

## Scope boundaries

The first release does not save credentials, create Plane work-item types or states, delete work items, or publish to npm. Publishing requires the maintainer's npm registry authority and is a separate explicit action.
