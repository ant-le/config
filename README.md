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

This parses publishable JSON/TOML, tests the agent installer in disposable homes,
loads Neovim, loads tmux in an isolated server, and checks diff whitespace.
`mise run agents:test` runs just the portable installer tests. The optional
image-service integration check is described in [agents/README.md](agents/README.md).

## Hetzner

Use `/home/t3/projects/config` as the server checkout. See the
[operator workflow](agents/README.md#hetzner-operator-workflow) for sparse checkout,
preview/apply commands, and OAuth acceptance. Publication and server application
are separate steps; local checks do not establish live server acceptance.
