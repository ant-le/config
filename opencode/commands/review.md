---
description: Review the current change in a fresh read-only reviewer, findings ordered by severity.
agent: reviewer
subagent: true
---

Review the current change in a fresh, read-only context.

1. Inspect the working tree: `git status`, `git diff`, and `git diff --cached`.
2. For each changed region, inspect the surrounding implementation and any relevant
   tests, not just the diff lines.
3. Look for correctness and regression bugs, security issues, reliability problems,
   and missing or inadequate tests.
4. Report findings ordered by severity, each with a file:line reference and a
   concrete failure scenario (the inputs or conditions that trigger it).

Do not modify any files. If one bounded semantic judgment is needed (for example,
whether a behavior matches a stated requirement), gather concrete evidence first and
use a Jev tool; otherwise reason directly and report.
