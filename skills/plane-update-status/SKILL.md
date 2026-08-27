---
name: plane-update-status
description: Change a Plane ticket's state after resolving the target and receiving explicit confirmation.
---

# Update a Plane ticket status

Use `npx @anaszulkfli/plane-skills@latest plane`. Before every command, verify `PLANE_API_KEY`, `PLANE_WORKSPACE_SLUG`, and `PLANE_PROJECT_ID` are set; never display the API key.

1. Resolve the ticket only from an unambiguous ID. For a name or multiple search results, present candidates and ask the user to choose; never guess. Run `plane get <ticket-id>` and summarize its current state.
2. Run `plane states`, then resolve the requested state by exact name. If no state or multiple states match, ask the user to choose; never guess.
3. Present the transition: ticket ID/name, current state, target state name/ID, and the PATCH payload `{ "state": "<target-state-id>" }`. State that only `state` will be patched.
4. Ask for explicit confirmation immediately before the mutation. On confirmation, invoke exactly one PATCH operation and no other mutation: `plane set-state <ticket-id> <target-state-id>`.
5. Report the returned ticket and state. Do not make another change without a new confirmation.
