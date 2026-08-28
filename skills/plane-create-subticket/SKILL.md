---
name: plane-create-subticket
description: Use when a user asks to create one Plane subticket under a verified User Story.
---

# Create a Plane subticket

Use the **Official Plane MCP** with the user's **individual Plane OAuth** login. Do not use a local CLI, REST calls, API keys, or environment-variable configuration.

1. Resolve the parent through MCP search and retrieval. If the request is ambiguous, show candidates and ask the user to choose; never guess.
2. Retrieve the selected parent and verify that it is an exact `User Story`. If it is not, stop and explain why.
3. Collect the new subticket's required title and optional description. Ask rather than inventing missing material content.
4. Present the complete proposed item: title, description, parent, project, and any type the user explicitly specified. Leave the child type to Plane unless the user specified one.
5. Ask for **explicit confirmation immediately before** the MCP create mutation. On confirmation, use exactly one Official Plane MCP create operation with the selected parent. Do not make another mutation without new confirmation.
6. Report the created subticket's returned identifier, title, and URL when available. If OAuth, permission, validation, or service errors occur, report the error without retrying the create automatically.
