# Expert council configuration and authoring basis

Updated 2026-11-07. This is a maintained rationale, not instructions to repeat research on every invocation. Exact model availability and option keys come from T3's runtime capabilities; official API defaults need not equal harness defaults.

## Single expert council

The [configuration](../profiles/default.json) is version 3, named `expert`; the existing filename remains the default entrypoint. It replaces the initial lower-effort configuration. There is no separate everyday or budget council.

| Family | T3 provider | Model | Explicit T3 option | Review weight |
| --- | --- | --- | --- | --- |
| Google | `antigravity` | `gemini-4-argon` | `thinking_level: high` | 0.15 |
| Anthropic | `claudeAgent` | `claude-opus-5-5` | `effort: high` | 0.30 |
| OpenAI | `codex` | `gpt-6-astra` | `reasoningEffort: high` | 0.30 |
| Muse | `muse` | `muse-wonder-1.0` | `reasoningEffort: high` | 0.25 |

These choices implement the user's preference for one consistently capable council and greater rating influence for Astra and Opus. Version 3 adds Muse Wonder at the user's request with explicit high reasoning. The requested reweighting assigns the new seat an equal-seat share of 25% and proportionally scales the existing 20:40:40 distribution to 15:30:30, preserving its relative preferences. This allocation is a coordinator choice under the user's reweighting request, not an explicit numeric mapping supplied by the user. Muse's exact model ID and high reasoning option were confirmed in T3's live capability response; the existing seats retain their previously confirmed targets/options. High effort is an explicit configuration choice, not evidence of optimality; similarly named settings do not imply equal compute. The weights are user preferences, not measured accuracy or calibrated probabilities.

Use the configuration unchanged unless the user requests or approves an override. Run-only overrides do not change this file. A persisted model, setting or weight change increments the configuration version; a replacement model does not inherit a claim of measured reliability. Provider instance IDs are installation-specific: resolve capabilities on the actual machine and report unavailable choices rather than silently substituting. Leave unrelated service-tier/fast-mode options to existing configuration and record effective values when available.

[Weighting rules](weighting.md) define rating aggregation and its limits. Human collaboration about task goals and rubrics belongs to the calling workflow; no human-calibration or visualization skill is required to use the council independently.

## How current guidance shaped these skills

- **OpenAI:** narrow discovery descriptions, progressive disclosure and outcome-oriented guidance avoid loading irrelevant instructions or over-prescribing capable models. This motivates the two focused entrypoints and selective references. [Rethinking skills and prompts for GPT-6 Astra](https://learn.chatgpt.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra), [Build skills](https://learn.chatgpt.com/docs/build-skills)
- **Anthropic:** concise skill instructions with clear activation and concrete examples; let the model solve open-ended work while specifying fragile operational boundaries. Current thinking models should return short explanations, not prompted internal reasoning transcripts. [Skill authoring](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices), [Prompting guidance](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- **Google:** clearly delimit task/context and define output expectations; use focused skill bodies and load supporting material as needed. Gemini CLI skill guidance is authoring guidance, not proof of Antigravity discovery behavior. [Prompt design](https://aistudio.google.com/docs/prompting-strategies), [Skill best practices](https://geminicli.com/docs/cli/skills-best-practices/), [Creating skills](https://geminicli.com/docs/cli/creating-skills/)

The operational sequence describes handoffs and decision points, not prescribed hidden reasoning. No prompt asks members to agree, adopt a superior model's verdict, produce arbitrary confidence probabilities, or run unbounded critique loops.

## T3 integration and local discovery

T3's public repository documentation describes provider-native skills rather than a separate universal skill authoring format. Skills are selected with `$` or the slash menu; after changes, restart the agent session to reload setup. [Composer documentation](https://github.com/pingdotgg/t3code/blob/main/docs/user/composer.md#commands-and-skills)

Claude reads its configured skills directory and project `.claude/skills`. Antigravity reads project `.agents/skills` (with documented precedence for other locations), and global `~/.gemini/config/skills` or `~/.gemini/antigravity-cli/skills`; it does not read global `~/.agents/skills`. Native formats and actual provider configuration govern discovery. [Claude integration](https://github.com/pingdotgg/t3code/blob/main/docs/user/providers-claude.md#skills), [Antigravity integration](https://github.com/pingdotgg/t3code/blob/main/docs/user/providers-antigravity.md#skills-and-attachments)

This repository keeps source under `agents/skills/`. Local discovery links follow the existing convention: Codex through `~/.agents/skills`, Claude through `~/.claude/skills`, Antigravity through `~/.gemini/config/skills`. `model-council` can be installed alone; `improve` requires it. Do not modify generated T3-managed mirrors or account state. Remote Hetzner application is a separate operation; its current installer only manages the existing Obsidian skill.

## Evaluation research

The workflow borrows failure-informed revision from [GEPA](https://arxiv.org/abs/2507.19457), independent diverse judgments from [PoLL](https://arxiv.org/abs/2404.18796), bias precautions from [MT-Bench](https://arxiv.org/abs/2306.05685), and outcome/trace separation from [Anthropic's agent-evaluation guide](https://www.anthropic.com/research/demystifying-evals-for-ai-agents). [Correlated judge errors](https://arxiv.org/abs/2605.29800) caution against treating a panel as independent statistical votes. These papers do not validate this particular profile or prove a practical UI rating predicts user outcomes.
