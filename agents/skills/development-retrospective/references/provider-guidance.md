# Provider guidance and future model changes

Use official sources when model behavior or harness configuration is relevant.
Read the pertinent page rather than relying on search snippets. Record the source
URL, date checked, exact model/version and execution surface. Recheck time-sensitive
claims on a later invocation; these links are starting points, not pinned defaults.

## Source map

- [OpenAI development best practices](https://learn.chatgpt.com/guides/best-practices):
  task framing, durable AGENTS.md guidance and reusable skills.
- [OpenAI model guide](https://developers.openai.com/api/docs/guides/latest-model):
  select the requested model; inspect effort, verification behavior and compatibility.
- [GPT-6 Astra model card](https://developers.openai.com/api/docs/models/gpt-6-astra):
  model-specific API limits; not proof of a client's configured context budget.
- [Claude Code best practices](https://code.claude.com/docs/en/best-practices):
  instructions, short subagent returns, context and usage.
- [Opus 5.5 prompting](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5):
  effort calibration, long tasks and elapsed-time signals.
- [Fable 5.2 prompting](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-2):
  effort, completion behavior, subagents and prompt-prefix constraints.
- [Claude instruction surfaces](https://claude.com/resources/articles/steering-claude-code-skills-hooks-rules-subagents-and-more):
  where persistent conventions and procedural workflows belong.

These pages were consulted for the initial design on 2026-11-17. For other providers
or successor models, use their current official model and harness documentation.
Do not silently substitute a different model because the old URL redirects.

## Repository documentation and instructions

First-party guidance checked 2026-11-18:

- [Claude Code best practices](https://code.claude.com/docs/en/best-practices)
  distinguishes concise instructions from enforceable constraints. Document
  project knowledge the agent cannot infer, give it an exact check, and enforce
  true invariants through tools or configuration.
- [Anthropic's March 2026 harness report](https://www.anthropic.com/research/harness-design-long-running-apps)
  shows how changes in model behavior let the team remove previously useful
  scaffolding. Treat a harness component as a hypothesis worth retesting.
- [OpenAI's repository harness report](https://openai.com/index/harness-engineering/)
  describes short instructions that link into versioned docs and mechanical
  checks for structural drift. Its [September guidance](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra)
  favors loading only task-relevant detail. Its [October maintenance report](https://developers.openai.com/blog/maintaining-software-with-the-gpt-6-family)
  proposes a same-snapshot, same-model replay to test one instruction change.

Use these as field guidance. Measurements from one provider or repository do
not establish local productivity gains. A [September 2026 empirical revision](https://arxiv.org/abs/2602.11988v3)
found no general task-success benefit from repository context files and higher
inference cost in its sample.

Keep one short instruction entry point and link to canonical policy and specs.
Start with a consequential task and trace its requirement, contract, code entry
point and runnable check. Reuse work items and PR evidence. Automate structural
failures that the project has observed, such as broken links or duplicate IDs,
through its existing command surface. Use domain tests and review for semantic
correctness. Treat Obsidian as a useful view over portable Markdown when the
same repository serves multiple editors or agents. Retain richer vault syntax
for notes whose audience and tooling support it. See
[Obsidian's link interoperability guidance](https://obsidian.md/help/links).

## From guidance to a project change

1. Match the observed problem to a specific recommendation. A capability benchmark
   or large context window does not establish an appropriate review-batch size.
2. Inspect the actual provider/harness capabilities before suggesting settings.
   Distinguish API options from T3/native client options. Use available built-in
   workflows before adding hooks, wrappers or custom orchestration.
3. Remove obsolete or duplicative instructions when evidence supports it; do not
   keep appending model-specific prescriptions to always-loaded guidance.
4. Treat model/effort/reviewer changes as explicit configuration choices. Preserve
   the user's established choices unless the task authorizes changing them.
5. Validate candidate changes on relevant work, recording quality, time and context
   effects. Provider benchmarks motivate a trial; they do not prove local gains.

Prefer outcome, constraints and completion criteria over micromanaging every tool
call. Keep source-specific details in this reference or the relevant run evidence,
not in every project prompt. Refresh this map when a requested reassessment finds
a stale source; no background update schedule is implied.
