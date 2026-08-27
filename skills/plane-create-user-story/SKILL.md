---
name: plane-create-user-story
description: Create one Plane work item with the exact User Story type after explicit confirmation.
---

# Create a Plane User Story

Use `npx @anaszulkfli/plane-skills@latest plane`. Before every command, verify `PLANE_API_KEY`, `PLANE_WORKSPACE_SLUG`, and `PLANE_PROJECT_ID` are set; never display the API key.

1. Collect the User Story name and optional description. Ask rather than invent missing content.
2. Run `plane types` and require exactly one returned type whose name is exactly `User Story`. If it is absent or duplicates exist, stop and ask the user to resolve the Plane configuration; never substitute a similarly named type.
3. Present the complete payload: name, `type-id`, exact type name `User Story`, and optional description.
4. Ask for explicit confirmation immediately before the mutation. On confirmation, invoke exactly one create command and no other mutation: `plane create --name <name> --type-id <user-story-type-id> [--description <description>]`.
5. Report the returned User Story. Do not create another item without a new confirmation.
