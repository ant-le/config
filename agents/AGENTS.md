# Personal preferences

Use T3 and the provider's built-in workflows where they already meet the task. Keep custom setup small and follow explicit user requests and repository conventions.

- Push back when a request rests on a mistaken assumption, conflicts with a constraint, or would work against my goal. Explain why, suggest a workable alternative, and agree on the approach with me before proceeding.
- If my intent is unclear, my instructions conflict, or there are several plausible directions that would lead to meaningfully different results, ask me a focused question before choosing. Use your judgment on routine implementation details.

## Documentation

- Default to Obsidian-compatible Markdown for documentation, research notes, plans, and decisions; use the obsidian-markdown skill when relevant.
- Write focused notes with descriptive headings and useful links. Follow the vault's existing properties and index structure.
- Use wikilinks and embeds for vault notes; prefer standard relative Markdown links in shared repository documentation. Preserve existing formats and avoid plugin-dependent syntax unless requested.
- Keep ordinary chat replies concise. Do not create extra documentation files unless requested or useful to the task.

## Project tooling

- Prefer mise for project toolchains, runtime versions, development dependencies, environment setup, and repeatable tasks. Inspect existing mise.toml, .mise.toml, and task definitions before adding tooling.
- Use mise tasks and mise exec where appropriate. Keep application/library dependencies in their ecosystem's manifests and lockfiles; mise manages the toolchain and task entry points.
- Follow an established repository setup; do not migrate projects or introduce redundant managers without a concrete need or a user request.

## Testing

- Focus tests on important behavior, meaningful regressions, critical paths, and consequential edge cases. Choose the smallest useful verification for the risk and scope of the change.
- Not every feature or low-impact edit needs new tests. Avoid tests that merely mirror implementation, duplicate existing coverage, or inflate coverage percentages.
- When a new test is warranted, inspect a nearby test for the same behavior and reuse existing fixtures, providers and interaction patterns. Assert the meaningful outcome; avoid ambiguous text queries or new scaffolding that duplicates the existing harness.
- Do not create a fleet of testing or review agents for routine work. Run relevant existing checks and required repository/CI gates; broaden testing when risk, failures, or unresolved concerns justify it.
- Report what was verified and any material gaps. Never claim checks passed unless they ran successfully.

## Research tools

- Use Context7 when current or version-specific library/API documentation would help; prefer the installed project's relevant version and primary sources.
- Tavily is an additional web-search and extraction option, not a mandatory replacement for built-in search. Choose the tool that fits the question; do not repeat searches across tools without a reason.

## Development workflow

- Define a coherent outcome and its acceptance criteria before choosing review checkpoints. Small implementation steps or commits do not each need a council; honor the user's requested review configuration.
- Keep context useful: search and read relevant ranges, filter large tool responses, summarize passing checks with evidence references, and reuse unchanged evidence. Expand reads when correctness requires surrounding context. Keep one compact continuation record for long work rather than repeatedly copying its history.
- Resolve recurring terminology and behavior in the project's canonical documentation and existing shared helpers. Before adding recurring UI copy, find its existing semantic key and verify the action's behavior; reuse matching meanings rather than inventing local synonyms. Put only durable routing and operating rules in AGENTS.md; keep detailed procedures in skills.
- Use `development-retrospective` when asked to diagnose or improve the development process or reassess it after model changes. Apply authorized, reversible improvements, then evaluate real outcomes; preserve explicit research-only requests. Do not create recurring jobs or change model/reviewer settings implicitly.
