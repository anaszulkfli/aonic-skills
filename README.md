# Plane Skills

Install four Plane work-item skills—search tickets, create a subticket, create a
User Story, and update status—for Codex or Claude Code. Node.js 20 or newer is
required.

## Install

Choose exactly one runtime and one scope. The runtime and scope are explicit so
skills cannot be installed into the wrong tool or project:

```sh
# Codex, all projects
npx @anaszulkfli/plane-skills@latest install --runtime codex --global
# Codex, this project
npx @anaszulkfli/plane-skills@latest install --runtime codex --project
# Claude Code, all projects
npx @anaszulkfli/plane-skills@latest install --runtime claude --global
# Claude Code, this project
npx @anaszulkfli/plane-skills@latest install --runtime claude --project
```

Global Codex skills are installed in `~/.codex/skills`; global Claude Code
skills in `~/.claude/skills`. Project-scoped skills go in `.agents/skills` for
Codex and `.claude/skills` for Claude Code.

To update an existing installation, use the same runtime and scope:

```sh
npx @anaszulkfli/plane-skills@latest update --runtime codex --global
npx @anaszulkfli/plane-skills@latest update --runtime claude --project
```

Updates preserve unrelated files and refuse to overwrite files changed after
installation. Review the reported paths and use `--force` only when you intend
to replace those local changes.

## Plane configuration

Set these environment variables in the shell or secret manager used to run the
skills. The package never writes credentials or workspace configuration to
disk, and the API key is never displayed:

```sh
export PLANE_API_KEY="your-plane-api-key"
export PLANE_WORKSPACE_SLUG="your-workspace-slug"
export PLANE_PROJECT_ID="your-project-id"
```

`PLANE_API_BASE_URL` is optional and defaults to `https://api.plane.so`. Set it
for a self-hosted Plane deployment, including its base URL (for example,
`https://plane.example.com`):

```sh
export PLANE_API_BASE_URL="https://plane.example.com"
```

## Workflow safety

The create User Story workflow requires one exact, case-sensitive Plane
work-item type named `User Story`; it stops if that type is missing or
ambiguous. A subticket must use a verified User Story as its parent.

Before every mutation, the skill presents the complete payload (or the current
and requested status transition) and asks for explicit confirmation immediately
before the request. No create or status update is sent without confirmation;
search and other read-only operations do not require confirmation. Ambiguous
work items, states, or types stop for user selection rather than guessing.

## Development and package checks

```sh
npm install
npm test
npm run typecheck
npm run build
npm pack --dry-run
```

`npm pack --dry-run` should include `dist`, `skills`, and this README, with no
credential or local configuration files.

## Maintainer release

Publishing is not performed by local development or installation commands.
Only a maintainer with the appropriate npm registry authority may publish a
reviewed release:

```sh
npm version patch   # or: minor, major
npm test && npm run typecheck && npm run build && npm pack --dry-run
npm publish
```

Run `npm publish` only as that explicitly authorized maintainer release action.
