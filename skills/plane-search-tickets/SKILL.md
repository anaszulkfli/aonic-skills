---
name: plane-search-tickets
description: Search and summarize Plane tickets without changing Plane data.
---

# Search Plane tickets

Use `npx @aonic/plane-skills@latest plane`. Before searching, verify `PLANE_API_KEY`, `PLANE_WORKSPACE_SLUG`, and `PLANE_PROJECT_ID` are set; never display the API key.

1. Ask for a search query if none was supplied.
2. Run exactly `plane search <query>` and present the returned ticket IDs, identifiers, names, types, and states needed to choose a result.
3. If the user wants ticket details, require an unambiguous ID and run `plane get <id>`; if a name or results are ambiguous, ask the user to choose and never guess.

This skill never changes Plane data. Do not call `create` or `set-state`, and do not request mutation confirmation.
