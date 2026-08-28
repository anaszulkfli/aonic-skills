---
name: plane-create-user-story
description: Use when a user asks to create a Plane work item classified as an exact User Story.
---

# Create a Plane User Story

Use the **Official Plane MCP** with the user's **individual Plane OAuth** login. Do not use a local CLI, REST calls, API keys, or environment-variable configuration.

1. Collect the required title and any requested description or other fields. Ask rather than inventing material work-item content.
2. Use the MCP's read capabilities to resolve the target workspace/project and the exact `User Story` type when Plane exposes types. If the type is missing or ambiguous, ask the user to resolve it; never substitute a similar type.
3. Present the complete proposed work item, including project, title, type, description, and every field that would be sent.
4. Ask for **explicit confirmation immediately before** the MCP create mutation. On confirmation, use exactly one Official Plane MCP create operation for the approved payload. Do not make another mutation without new confirmation.
5. Report the created work item's returned identifier, title, and URL when available. If OAuth, permission, validation, or service errors occur, report the error without retrying the create automatically.
