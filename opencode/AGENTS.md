# MCP Servers

- When you need to search docs, use `context7` tools.

# Jev semantic decisions

Three global read-only tools make bounded semantic judgments: `jev_choice`,
`jev_noul`, and `jev_score`. Use the `jev` skill for when and how to call them.

- Send all `state`, questions, options, and rubric levels to Jev in English;
  preserve code, identifiers, filenames, commands, and error messages exactly.
- Never print, persist, or manage `TYPESAFE_API_KEY`.

# Workflow

- Use plan mode before implementation when a request is ambiguous or spans multiple files.
- Delegate read-only exploration and research to subagents when useful.
- Keep context and cost bounded: use built-in `explore` for substantial independent investigation and `general` for bounded multi-step tasks. They need no custom agent files, but must be enabled and permitted by the project. Use the existing source `reviewer` for fresh read-only code review when available; if a project reserves that ID for another role, follow its routing instead (this application tracker uses restricted `general` for source review). Keep trivial lookups local; delegation itself costs tokens and is not automatically cheaper.
- Give each worker one bounded question, relevant source paths, constraints and an output budget (normally at most 800 words). Do not send the whole conversation, private records, credentials or unrelated file dumps.
- Use background workers only for independent work; do not duplicate their investigation or poll for progress. Incorporate their concise findings rather than replaying their tool logs. Use a deliberate handoff with decisions, paths and verification results before the parent context becomes unwieldy.
- Prefer a small number of focused workers over recursive delegation. Respect project restrictions; never use global workers to bypass a project's private-data or runtime boundary. Built-in `general` normally has broad tool access: a read-only request alone is not a permission sandbox. Use enforced read-only roles for independent reviews. Subagents without a model override inherit the parent's model; do not silently switch providers or assume a cheaper model. Only use IDs in the available catalog, not invented agent names.
- Use `/verify` before claiming completion, `/review` for an independent read-only
  review in a fresh context, and `/handoff` for intentional session or model transitions.
- Preserve unrelated worktree changes unless the user explicitly asks to modify them.

# Worktrees

- Parallel read-only work (explore, review, research) may share the checkout.
- Parallel writing must use separate worktrees: never run concurrent writing agents
  against the same worktree.
- Use OpenCode's native worktree support rather than an external orchestration framework.

# Verification

Do not claim an implementation is complete until the strongest reasonably available
deterministic verification has been executed.

- Deterministic verification is tests, the compiler and type checker, the linter, the
  formatter, or an explicit command. Prefer it whenever execution can decide the question.
- Semantic verification is Jev, for one bounded judgment that deterministic checks
  cannot settle. See the `jev` skill.
- Reasoning and diagnosis are the LLM's job: understanding, design, and debugging.

Use `/verify` as the completion gate. If a `Makefile` provides a `check` target, run
`make check`; otherwise run the formatter, linter, type checker, and tests directly.
Report the exact commands run and their results. Do not report success when any
deterministic check fails.
