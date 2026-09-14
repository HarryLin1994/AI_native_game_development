# Godot + Blender MCP Setup

This project uses Godot as the game client and Blender as a local art source.

Confirmed direction:

```text
Card visual direction = 爆裂戰鬥卡框
Primary asset storage = local project folders
Editor MCP = Godot MCP + Blender MCP
```

## Installed Local Tools

Current local setup:

| Tool | Version / status |
|---|---|
| Godot | `4.7.2.stable.official.ed1daf0bf` |
| Blender | `5.2.1 LTS` |
| Node.js | `v23.4.0` |
| uvx | `0.12.13` |
| Codex MCP `godot-mcp` | configured globally |
| Codex MCP `blender` | configured globally |

Disk snapshot after setup:

```text
Available project volume space: about 32GiB
Godot.app: about 338MiB
Blender.app: about 907MiB
MCP source folders before generated caches/assets: about 4MiB
```

This is enough for the editor setup and initial card assets. It is not enough to casually keep many
large model checkpoints, video exports, or uncompressed asset experiments forever.

## Local Folder Layout

```text
.local-tools/mcp/godot-mcp/
  Godot MCP source, Node server, and upstream plugin copy

.local-tools/mcp/blender-mcp/
  Blender MCP source clone for reference

godot/
  Godot game client project

godot/addons/godot_mcp/
  Godot MCP editor plugin copied into the Godot project

godot/art/
  local card-art workspace
```

Godot local cache folders are ignored by git:

```text
godot/.godot/
godot/.import/
godot/export_presets.cfg
```

## Codex MCP Servers

Configured servers:

```text
godot-mcp
  command: node
  args: /Users/harrylin/help_me_my_friend!/.local-tools/mcp/godot-mcp/server/build/index.js
  env: GODOT_MCP_PORT=6505

blender
  command: /opt/homebrew/bin/uvx
  args: --python 3.11 blender-mcp
  env:
    BLENDER_HOST=localhost
    BLENDER_PORT=9876
    BLENDER_MCP_SAFE_MODE=1
    UV_PYTHON_PREFERENCE=only-managed
```

Use this to inspect the configured servers:

```bash
codex mcp list
```

New MCP tools usually require restarting Codex or starting a new Codex session before they are
available to the agent.

## Godot Startup

Open the Godot project:

```bash
godot --editor godot/project.godot
```

Confirm:

```text
Project -> Project Settings -> Plugins -> Godot MCP -> Enable
```

The project is already configured with:

```text
[editor_plugins]
enabled=PackedStringArray("res://addons/godot_mcp/plugin.cfg")
```

Godot MCP architecture:

```text
Codex -> stdio MCP -> Node server -> WebSocket :6505 -> Godot editor plugin
```

## Blender Startup

The Blender addon was installed to:

```text
/Users/harrylin/Library/Application Support/Blender/5.2/scripts/addons/blender_mcp.py
```

Open Blender, then confirm:

```text
Edit -> Preferences -> Add-ons -> Interface: MCP for Blender -> enabled
3D Viewport -> press N -> MCP for Blender -> Connect to MCP server
```

Blender MCP architecture:

```text
Codex -> stdio MCP -> uvx blender-mcp -> localhost:9876 -> Blender addon
```

Blender MCP is configured with safe mode:

```text
BLENDER_MCP_SAFE_MODE=1
```

This blocks risky script actions while still allowing normal Blender modeling, materials,
rendering, saving, import, and export.

## Asset Production Rule

Godot is the presentation and integration tool. Blender is a source tool for 3D, 2.5D, rendered
card-frame parts, rarity badges, and effect elements.

Keep functional UI text code-native in Godot. Generate or model:

- frame ornaments
- rarity glow layers
- attribute badges
- background plates
- cut-in panels
- particle/light textures
- 3D frame pieces rendered to transparent PNG/WebP

Every generated or sourced asset needs:

- stable filename
- intended size
- source/provenance note
- license or generated-media note
- approval state
- Godot import expectation

Primary references:

- Godot MCP: https://github.com/mkdevkit/godot-mcp
- Blender MCP: https://github.com/MCPBlender/blender-mcp
- Codex MCP docs: https://developers.openai.com/codex/mcp
