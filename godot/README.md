# Godot Workspace

This folder is the Godot client workspace for Help Me My Friend.

Current setup:

- Godot target: 4.7.x
- Main scene: `res://scenes/card_art_lab.tscn`
- MCP editor plugin: `res://addons/godot_mcp/plugin.cfg`
- Local art workspace: `res://art/`

To connect Codex through Godot MCP:

1. Open this folder in Godot:

   ```bash
   godot --editor godot/project.godot
   ```

2. In Godot, confirm `Project -> Project Settings -> Plugins -> Godot MCP` is enabled.
3. Restart Codex or start a new Codex session so the new MCP server list is loaded.
4. Use `/mcp` in Codex to confirm `godot-mcp` is available.

Godot MCP uses the local Node server at:

```text
.local-tools/mcp/godot-mcp/server/build/index.js
```
