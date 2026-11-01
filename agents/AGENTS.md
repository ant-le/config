# Personal preferences

Use T3 and the provider's built-in workflows where they already meet the task. Keep custom setup small and follow explicit user requests and repository conventions.

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
- Do not create a fleet of testing or review agents for routine work. Run relevant existing checks and required repository/CI gates; broaden testing when risk, failures, or unresolved concerns justify it.
- Report what was verified and any material gaps. Never claim checks passed unless they ran successfully.

## Research tools

- Use Context7 when current or version-specific library/API documentation would help; prefer the installed project's relevant version and primary sources.
- Tavily is an additional web-search and extraction option, not a mandatory replacement for built-in search. Choose the tool that fits the question; do not repeat searches across tools without a reason.
