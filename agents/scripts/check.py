"""Validate publishable config files only; never read private provider state."""
import json
from pathlib import Path
import tomllib

ROOT = Path(__file__).resolve().parents[2]
for relative in [
    'agents/mcp.json', 'agents/claude/settings.json',
    'agents/opencode/opencode.json', 'agents/opencode/cli.json',
    'nvim/lazy-lock.json',
]:
    json.loads((ROOT / relative).read_text())
for relative in ['mise.toml', 'agents/codex/config.toml']:
    tomllib.loads((ROOT / relative).read_text())
servers = json.loads((ROOT / 'agents/mcp.json').read_text())
codex = tomllib.loads((ROOT / 'agents/codex/config.toml').read_text())
assert codex['mcp_servers'] == {name: {'url': entry['url']} for name, entry in servers.items()}, 'Mac MCP definitions differ from shared source'
print('Publishable JSON/TOML configuration validated.')
