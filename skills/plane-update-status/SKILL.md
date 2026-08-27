---
name: plane-update-status
description: Change a Plane ticket's state after resolving the target and receiving explicit confirmation.
---

# Update a Plane ticket status

Use `npx @anaszulkfli/plane-skills@latest plane`. Before every command, verify `PLANE_API_KEY`, `PLANE_WORKSPACE_SLUG`, and `PLANE_PROJECT_ID` are set; never display the API key.

1. Resolve the ticket within `PLANE_PROJECT_ID`. Accept either a UUID or a complete Plane identifier such as `ENG-123`:
   - For a UUID, run `plane get <ticket-id>`.
   - For an identifier, run `plane search <identifier>`. Require exactly one result whose returned `identifier` exactly matches the supplied identifier, then run `plane get <resolved-uuid>`.
   - For a name, partial identifier, no exact identifier match, or multiple exact matches, present candidates and ask the user to choose; never guess.
   Summarize the resolved ticket ID, identifier, name, project (when returned), and current state. If the returned project conflicts with `PLANE_PROJECT_ID`, stop without a mutation.
2. Run `plane states` for the configured project, then resolve the requested state by exact name. If no state or multiple states match, ask the user to choose; never guess. If the ticket is already in the target state, report that no change is needed and do not ask for confirmation or run a PATCH.
3. Present the transition: ticket UUID/identifier/name, configured project, current state, target state name/ID, and the PATCH payload `{ "state": "<target-state-id>" }`. State that only `state` will be patched.
4. Ask for explicit confirmation immediately before the mutation. On confirmation, invoke exactly one PATCH operation and no other mutation: `plane set-state <resolved-uuid> <target-state-id>`.
5. Report the returned ticket and state. Do not make another change without a new confirmation.

## Failure handling

- Missing configuration: name the missing variable(s) without displaying `PLANE_API_KEY`.
- `401` or `403`: report an authentication or permission failure and ask the user to verify the API key and required Plane scopes.
- `404`: report that the ticket or state was not found in the configured workspace/project; do not substitute a different target.
- `400`: report Plane's validation detail and ask the user to correct the request.
- `429`, `500`, `502`, `503`, or `504`: read-only commands may be retried by the CLI. Do not automatically retry `plane set-state`; instead, run `plane get <resolved-uuid>` to verify the actual state, report it, and require a new explicit confirmation before any further PATCH.
