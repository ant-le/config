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
SESSION_CREATED=0

cleanup_session() {
  if (( SESSION_CREATED )); then
    tmux kill-session -t "$SESSION" 2>/dev/null || true
  fi
}

trap cleanup_session ERR
trap 'cleanup_session; exit 1' INT TERM

attach_session() {
  SESSION_CREATED=0
  trap - ERR INT TERM
  if [[ -n ${TMUX:-} ]]; then
    exec tmux switch-client -t "$SESSION"
  fi
  exec tmux attach-session -t "$SESSION"
}

# Reattach if session already exists
if tmux has-session -t "$SESSION" 2>/dev/null; then
  attach_session
fi

MAIN_PANE=$(tmux new-session \
  -d -P -F '#{pane_id}' \
  -s "$SESSION" -n "dev" -c "$PROJECT_DIR")
SESSION_CREATED=1

# Main pane: Neovim
tmux select-pane -t "$MAIN_PANE" -T "nvim"
tmux send-keys -t "$MAIN_PANE" nvim Space . Enter

# Right pane: OpenCode
tmux set-environment -t "$SESSION" EDITOR nvim
tmux set-environment -t "$SESSION" VISUAL nvim
OPENCODE_PANE=$(tmux split-window \
  -h -P -F '#{pane_id}' \
  -t "$MAIN_PANE" -c "$PROJECT_DIR")
tmux select-pane -t "$OPENCODE_PANE" -T "opencode"
tmux send-keys -t "$OPENCODE_PANE" opencode Space --port Enter
tmux resize-pane -t "$MAIN_PANE" -x '65%'

# Second window: tests, logs, git
UTILS_PANE=$(tmux new-window \
  -d -P -F '#{pane_id}' \
  -t "$SESSION" -n "utils" -c "$PROJECT_DIR")
tmux send-keys -t "$UTILS_PANE" "git log --oneline -10" Enter

attach_session
