---
name: plane-create-subticket
description: Create one Plane subticket under a verified User Story after explicit confirmation.
---

# Create a Plane subticket

Use `npx @anaszulkfli/plane-skills@latest plane`. Before every command, verify `PLANE_API_KEY`, `PLANE_WORKSPACE_SLUG`, and `PLANE_PROJECT_ID` are set; never display the API key.

1. Resolve the parent only from an unambiguous ID. If the request supplies a name or search yields zero or multiple candidates, show the candidates and ask the user to choose; never guess.
2. Run `plane get <parent-id>`, summarize the selected parent, and verify its type is exactly `User Story`. If it is not, stop.
3. Derive the required `name` and optional description from the user's request. Ask for clarification rather than inventing either when it is needed.
4. Build the API payload with required `name` and `parent: <parent-id>`. The CLI maps `--parent` to Plane's optional `parent` field and `--description` to escaped paragraph HTML in optional `description_html`.
5. Do not use `plane types` for the child. Use `type: Plane default` and omit `--type-id` entirely. Add `--type-id <type-uuid>` only if the caller provides a concrete type UUID; pass that UUID unchanged, which the CLI maps to the optional `type_id` field. Do not try to resolve a type name.
6. Present the complete proposed payload: required `name`, optional `description_html`, `parent: <parent-id>`, and either `type: Plane default` or the caller-provided `type_id` UUID.
7. Ask for explicit confirmation immediately before the mutation. On confirmation, invoke exactly one create command and no other mutation: `plane create --name <name> --parent <parent-id> [--description <description>]`; include `--type-id <type-uuid>` only for the caller-provided UUID case.
8. A successful create returns HTTP 201. Report the created subticket's identifier, name, and URL when returned. For 401 or 403, report authentication or authorization failure; for 429, 500, 502, 503, or 504, report the failure without retrying the create. Do not create another item without a new confirmation.
