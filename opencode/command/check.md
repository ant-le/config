---
description: Run the project's normal formatter, linter, type checker, and tests.
agent: build
---

Discover and execute the repository's standard verification commands:

1. Run the formatter (`make format`, `ruff format`, or equivalent).
2. Run the linter (`make lint`, `ruff check`, or equivalent).
3. Run the type checker (`mypy`, `pyright`, or equivalent).
4. Run tests (`make test`, `pytest`, or equivalent).

If a `Makefile` exists with a `check` target, run `make check` instead of individual steps.

Report any failures with file:line references.
