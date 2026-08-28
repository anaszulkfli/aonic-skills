---
name: plane-search-tickets
description: Use when locating or inspecting Plane work items by identifier or text query without changing Plane data.
---

# Search Plane work items

Use the **Official Plane MCP**. It authenticates through the user's **individual Plane OAuth** login; do not use a local CLI, REST calls, API keys, or environment-variable configuration.

1. Use the available MCP search/list capability to search work items for the supplied UUID, complete identifier, or text query. If no query is supplied, ask for one.
2. Show possible matches using only returned fields, such as identifier, title, project, and state. If there are no matches, ask for a broader query. If multiple matches could be intended, ask the user to select one; never guess.
3. After selection, use the Official Plane MCP to retrieve the selected work item and summarize the returned details. Flag a returned project or identifier mismatch rather than substituting a different item.
4. If Plane asks the user to sign in, let the individual OAuth flow complete. If access is denied or the MCP is unavailable, report that and ask the user to restore their Plane connection or permissions.

This skill never changes Plane data. Do not use an MCP create, update, or delete operation, and do not request mutation confirmation.
