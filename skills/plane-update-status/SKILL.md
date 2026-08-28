---
name: plane-update-status
description: Use when changing a resolved Plane work item's state after explicit confirmation.
---

# Update a Plane work item status

Use the **Official Plane MCP** with the user's **individual Plane OAuth** login. Do not use a local CLI, REST calls, API keys, or environment-variable configuration.

1. Resolve the target through MCP search and retrieval. For an ambiguous name, partial identifier, or multiple matches, show candidates and ask the user to choose; never guess.
2. Retrieve the selected item and its current state. Use the MCP's available state information to resolve the requested state exactly. If no unique target state exists, ask the user to choose. If the item is already in that state, report that no change is needed.
3. Present the transition: selected work item, current state, target state, and the fact that only the state will change.
4. Ask for **explicit confirmation immediately before** the MCP update mutation. On confirmation, use exactly one Official Plane MCP update operation to change only the approved state. Do not make another mutation without new confirmation.
5. Report the returned work item and state. If OAuth, permission, validation, or service errors occur, report the error. Do not automatically retry a failed update; retrieve the item to verify its actual state, then require new confirmation before a further update.
