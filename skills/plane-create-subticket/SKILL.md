---
name: plane-create-subticket
description: Create one Plane subticket under a verified User Story after explicit confirmation.
---

# Create a Plane subticket

Use `npx @aonic/plane-skills@latest plane`. Before every command, verify `PLANE_API_KEY`, `PLANE_WORKSPACE_SLUG`, and `PLANE_PROJECT_ID` are set; never display the API key.

1. Resolve the parent only from an unambiguous ID. If the request supplies a name or search yields zero or multiple candidates, show the candidates and ask the user to choose; never guess.
2. Run `plane get <parent-id>`, summarize the selected parent, and verify its type is exactly `User Story`. If it is not, stop.
3. Run `plane types` and resolve exactly one type for the requested child. If the type is ambiguous or absent, ask the user to resolve it.
4. Present the complete proposed payload: name, type ID/name, optional description, and `parent: <parent-id>`.
5. Ask for explicit confirmation immediately before the mutation. On confirmation, invoke exactly one create command and no other mutation: `plane create --name <name> --type-id <type-id> --parent <parent-id> [--description <description>]`.
6. Report the returned subticket. Do not create another item without a new confirmation.
