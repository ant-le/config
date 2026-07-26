# MCP Servers

- When you need to search docs, use `context7` tools.

# Workflow

- Use plan mode before implementation when a request is ambiguous or spans multiple files.
- Delegate read-only exploration, research, and review to subagents when useful.
- Do not run concurrent writing agents against the same worktree.
- Preserve unrelated worktree changes unless the user explicitly asks to modify them.

# Verification

Before completing an implementation task, use the repository's documented verification command. If a `Makefile` provides a `check` target, run `make check`; otherwise run the relevant formatter, linter, type checker, and tests directly.
Do not report success when any check fails.
