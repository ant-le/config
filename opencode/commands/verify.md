---
description: Verify a change with the strongest deterministic checks available, then optional Jev semantic gates.
agent: build
---

Verify the current change. Do not claim the implementation is complete until the
strongest reasonably available deterministic verification has been executed.

1. Inspect the repository to discover the real toolchain. Do not assume it:
   - Build and test configuration: `Makefile` targets, `package.json` scripts,
     `pyproject.toml`, `Cargo.toml`, `go.mod`, and CI workflow files.
   - The formatting, lint, typecheck, and test commands the repository actually defines.

2. Run the applicable deterministic chain in order, diagnosing on the first failure:
   - format (the repository's formatter; OpenCode's native formatter is enabled globally)
   - lint / static analysis
   - typecheck
   - targeted tests for the changed code
   - the broader test suite when the blast radius justifies it

3. Inspect `git status` and the full diff. Confirm only intended files changed and
   that no unrelated or generated files were modified.

4. If, and only if, a requirement is not fully represented by deterministic checks,
   add one bounded semantic gate with Jev:
   - state: the requirement as stated, the relevant implemented behavior, and the
     concrete evidence already gathered.
   - question: one atomic yes/no proposition, for example "Does the described
     implementation enforce the stated requirement across the identified execution paths?"
   - call `jev_noul` (or `jev_choice`/`jev_score` for a finite set or ordered rubric).
   - treat the result as supporting evidence, not proof, and report the probability.

5. Report evidence, not assertions:
   - exact commands run and their results
   - which checks passed, failed, or were unavailable, and why
   - the Jev question, state, and returned probability when used
   - every claim that remains unverified

If a `Makefile` provides a `check` target, run `make check`; otherwise run the
formatter, linter, type checker, and tests directly. Never report success when any
deterministic check fails.
