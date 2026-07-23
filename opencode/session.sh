#!/usr/bin/env bash
set -euo pipefail

# Project dev session launcher
# Creates: Neovim (main pane) | OpenCode (right pane)
#          Tests/logs window (separate tmux window)
#
# Usage: dev-session [/path/to/project]
# If no path is given, uses the current directory.

PROJECT_DIR=$(cd -- "${1:-$PWD}" && pwd -P)
PROJECT_NAME=${PROJECT_DIR##*/}
PROJECT_NAME=${PROJECT_NAME:-root}
SAFE_NAME=$(printf '%s' "$PROJECT_NAME" | tr -c '[:alnum:]_-' '_')
PROJECT_HASH=$(printf '%s' "$PROJECT_DIR" | cksum)
PROJECT_HASH=${PROJECT_HASH%% *}
SESSION="dev-${SAFE_NAME}-${PROJECT_HASH}"

# Reattach if session already exists
if tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "Attaching to existing session: $SESSION"
  exec tmux attach-session -t "$SESSION"
fi

MAIN_PANE=$(tmux new-session \
  -d -P -F '#{pane_id}' \
  -s "$SESSION" -n "dev" -c "$PROJECT_DIR")

# Main pane: Neovim
tmux send-keys -t "$MAIN_PANE" "nvim ." Enter

# Right pane: OpenCode
OPENCODE_PANE=$(tmux split-window \
  -h -P -F '#{pane_id}' \
  -t "$MAIN_PANE" -c "$PROJECT_DIR")
tmux send-keys -t "$OPENCODE_PANE" "opencode" Enter

# Second window: tests, logs, git
UTILS_PANE=$(tmux new-window \
  -d -P -F '#{pane_id}' \
  -t "$SESSION" -n "utils" -c "$PROJECT_DIR")
tmux send-keys -t "$UTILS_PANE" "git log --oneline -10" Enter

exec tmux attach-session -t "$SESSION"
