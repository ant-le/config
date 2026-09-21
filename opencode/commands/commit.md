---
description: Stage the intended changes and create one conventional commit.
agent: build
---

Create one conventional commit for the current work.

1. Inspect the repository state: `git status`, `git diff`, `git diff --cached`,
   and `git log --oneline -5` to match the project's commit style.
2. Stage only the files that belong to this change. Do not stage unrelated
   worktree changes; list them and leave them alone.
3. Write a conventional-commit message: `type(scope): summary` where `type` is
   one of `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `build`,
   or `ci`. Keep the summary imperative and under 72 characters.
4. Add a body only when it explains *why*, not *what*. Never invent a rationale.
5. Commit once. Do not amend, rebase, force-push, or tag unless explicitly asked.

If `$ARGUMENTS` is provided, treat it as the intended scope or subject of the
commit and reconcile it with the actual staged diff. If the diff and the
requested subject disagree, stop and report the discrepancy instead of
committing.

Report the exact `git commit` command run, the final message, and the commit
hash. Never claim success when the commit fails.
