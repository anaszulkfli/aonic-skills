# Plane Skills

Four portable Plane skills for Codex, Cursor, and compatible agents: search work items, create a subticket, create a User Story, and update a status.

## Architecture

```text
Developer
  ↓
Codex / Cursor
  ↓
Team Plane instructions
  ↓
Official Plane MCP
  ↓
Plane REST API
```

The skills use the **Official Plane MCP**, which uses the developer's **individual Plane OAuth** login. They do not require a local API key, local Plane CLI, or environment-variable configuration.

## Install

Choose exactly one runtime and scope:

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

Use the same runtime and scope to update an installation. Updates preserve unrelated files and refuse to replace locally modified installed files unless `--force` is supplied.

```sh
npx @anaszulkfli/plane-skills@latest update --runtime codex --global
npx @anaszulkfli/plane-skills@latest update --runtime claude --project
```

## Team setup

1. Enable the Official Plane MCP in Codex or Cursor. Each developer completes their own individual Plane OAuth login when prompted.
2. Put the shared workflow in Team Plane instructions: search first, show possible matches, retrieve the user-selected ticket, and ask for explicit confirmation before any change.
3. For Cursor, place the equivalent Cursor rules in its project or team rule configuration.
4. Optionally add repository Plane configuration that names the default workspace/project or links to the team's instructions. Keep it non-secret; OAuth credentials belong to the MCP connection.

## Workflow safety

Search is read-only. Before any create or update, the skills show the selected work item or complete proposed change and require explicit confirmation immediately before the Official Plane MCP mutation. Ambiguous tickets, states, or types require user selection rather than guessing.

Example prompt:

> Find the relevant Plane ticket for implementing a barcode scanner.

The agent reads the team instructions, searches through Plane MCP, shows possible matches, retrieves the selected ticket, and asks for confirmation before making an approved change.

## Development and package checks

```sh
npm install
npm test
npm run typecheck
npm run build
npm pack --dry-run
```

## Maintainer release

Publishing is a separate, explicitly authorized maintainer action. Do not publish as part of local development, installation, or a skill run:

```sh
npm version patch   # or: minor, major
npm test && npm run typecheck && npm run build && npm pack --dry-run
npm publish
```
