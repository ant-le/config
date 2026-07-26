## Usage

Personal configurations for [Kitty](https://sw.kovidgoyal.net/kitty/),
[Neovim](https://neovim.io/), [Tmux](https://github.com/tmux/tmux/wiki),
and [OpenCode](https://opencode.ai/).

## Requirements

- A Nerd Font
- `kitty`, `nvim`, `tmux`, and `opencode`
- `jq` for configuration validation
- Language servers used by Neovim, installed with Mason as needed

## Development Session

Start Neovim and OpenCode in a project-specific tmux session:

```sh
cd /path/to/project
dev-session
```

Run `make check` from this repository to validate the configuration.
