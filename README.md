# Personal configuration

Configuration for Kitty, Neovim, tmux, and coding agents. Portable personal
instructions, skills, and OAuth MCP definitions live under [agents/](agents/README.md).
Codex and Claude use their native workflows through T3.

## Local setup

Use this checkout as `~/.config` on the Mac. Kitty, Neovim, and tmux use their
respective directories; the existing provider symlinks point into `agents/`.
Install a Nerd Font and the applications you use. Neovim manages plugins with
lazy.nvim and language servers with Mason.

OpenCode is optional. Its minimal native configuration lives only under
`agents/opencode/`. Select it with the native environment setting:

```sh
export OPENCODE_CONFIG_DIR="$HOME/.config/agents/opencode"
opencode
```

There is no top-level OpenCode alias, custom plugin stack, or Neovim integration.
Provider accounts and service state stay local. Machine-specific mise and T3
settings, k3d state, and credentials are ignored by Git.

## Validation

With mise, Neovim (including its installed plugins), and tmux available:

```sh
mise run check
```

This parses publishable JSON/TOML, loads Neovim/tmux, and checks diff whitespace.
Native T3 setup and authenticated MCP calls use the separate
[native configuration checklist](agents/README.md#native-setup-checklist).

## Hetzner

Use `/srv/projects/config` as the native coding-host checkout. See the
[native workflow](agents/README.md#native-coding-host-workflow) for the initial
reconciliation, explicit Git sync, native links and MCP acceptance. Publication
and server application are separate; local checks do not establish live acceptance.
