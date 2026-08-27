---
name: plane-search-tickets
description: Use when locating or inspecting Plane work items by UUID, complete identifier, or text query without changing Plane data.
---

# Search Plane work items

Use `npx @anaszulkfli/plane-skills@latest plane`. Before every command, verify `PLANE_API_KEY`, `PLANE_WORKSPACE_SLUG`, and `PLANE_PROJECT_ID` are set. Never display the API key or credential-bearing command output.

1. Classify the supplied reference:
   - For a UUID, run `plane get <uuid>`.
   - For a complete Plane identifier such as `ENG-123`, run `plane search <identifier>`. Continue only when exactly one result's returned `identifier` exactly matches the supplied identifier and its project matches `PLANE_PROJECT_ID`; then run `plane get <resolved-uuid>`.
   - For a name, partial identifier, or other text query, run exactly `plane search <query>`. If no query was supplied, ask for one.
2. For search results, present only fields actually returned: ID, identifier (or project identifier plus sequence ID), name, project ID, and workspace. Do not infer or claim type, state, priority, or other fields that the search response does not provide.
3. If a text search returns no results, report that and ask for a broader or alternate query. If it returns multiple results, show the candidates and ask the user to choose a UUID or displayed identifier; never guess. When the user requests details for a selected, unambiguous result, run `plane get <resolved-uuid>`.
4. Summarize a retrieved work item using only fields actually returned. Include its ID, identifier when available, name, description, priority, assignees, labels, and relevant dates when present; identify unavailable fields as unavailable rather than inventing values. If the retrieved item conflicts with the selected identifier or configured project, stop and report the mismatch.

## Errors

- Missing configuration: ask the user to configure the missing variable; do not issue a partial request.
- `401` or `403`: report an authentication or permission failure and ask the user to verify the API key and Plane access; never expose credentials.
- `404`: report that the requested work item was not found or is inaccessible in the configured workspace/project; do not substitute another target.
- `400`: report Plane's validation detail and ask for a corrected query, UUID, or identifier.
- `429`, `500`, `502`, `503`, or `504`: report that Plane could not complete the read request. Respect a retry interval when supplied; otherwise do not repeatedly retry automatically.

This skill never changes Plane data. Do not call `create` or `set-state`, and do not request mutation confirmation.
