---
description: Review the current Git diff for correctness, security, and style issues.
agent: review
subtask: true
---

Review the current Git diff (`git diff` and `git diff --cached`).

Analyse every changed line for:

- Correctness bugs (logic errors, race conditions, edge cases)
- Security vulnerabilities (injection, auth bypass, secret exposure)
- Maintainability (complexity, dead code, missing error handling)
- Style violations (inconsistent with surrounding code)

Report findings with file:line references. Do not modify any files.
