---
name: plane-create-user-story
description: Use when a user needs one confirmed Plane work item classified as an exact User Story.
---

# Create a Plane User Story

Use `npx @anaszulkfli/plane-skills@latest plane`. Before every command, verify `PLANE_API_KEY`, `PLANE_WORKSPACE_SLUG`, and `PLANE_PROJECT_ID` are set; never display the API key.

1. Collect the required `name` and optional description. Ask rather than invent missing content or other work-item fields.
2. Run `plane types` and require exactly one returned type whose name is exactly `User Story`. If it is absent or duplicates exist, stop and ask the user to resolve the Plane configuration; never substitute a similarly named type.
3. Present the complete API payload: required `name`, `type_id` for the resolved exact `User Story` type, and optional `description_html`. The CLI maps `--type-id` to `type_id` and `--description` to escaped paragraph HTML in `description_html`.
4. Ask for explicit confirmation immediately before the mutation. On confirmation, invoke exactly one create command and no other mutation: `plane create --name <name> --type-id <user-story-type-id> [--description <description>]`.
5. A successful create returns HTTP 201. Report the created User Story's identifier, name, and URL when returned. Surface errors without retrying the create; do not create another item without a new confirmation.
