---
name: jev
description: Use when a task needs one bounded semantic judgment: classification, a finite choice, yes/no probabilistic verification, ordered qualitative scoring, or a decision gate. Triggers on Jev tools jev_choice, jev_noul, jev_score and on "should we", "which one", "does this satisfy", "rate this".
---

# Jev semantic decisions

Jev is a System One model exposed through three global OpenCode tools. It returns
fast, calibrated, structured judgments. It complements the LLM: the LLM does the
work, Jev makes one bounded decision when asked.

## Tools

| Tool | Use for |
| --- | --- |
| `jev_choice` | Pick one option from an explicit finite set (classification, strategy, tool/skill). |
| `jev_noul` | One yes/no proposition with a probability (verification, gating, semantic checks). |
| `jev_score` | Score a state against an ordered qualitative rubric. |

Call the tool that matches the judgment. Do not wrap one judgment in another.

## When to call Jev

```
Can this be checked deterministically?
        │
       yes  →  compiler / test / lint / command
        │
        no
        ▼
Is this a bounded semantic judgment?
        │
       yes  →  Jev
        │
        no
        ▼
LLM reasoning
```

Do not call Jev merely because it is available. If a test, compiler, linter, or shell
command can decide the question, run it instead. If the question is broad or
open-ended, reason about it directly.

## Good Jev calls

- Does the implementation satisfy this requirement?
- Does the evidence support this root-cause hypothesis?
- Which of these explicitly defined alternatives best matches the stated constraints?
- How strongly does this evidence support conclusion X?

Bounded classification, yes/no probabilistic verification, ordered qualitative
scoring, and decision gates are also good fits.

## Bad Jev calls

- How should I implement this?
- Find the bug.
- Design this architecture.
- What should I do next?
- Review this entire repository.

Also avoid: generating code or prose, open-ended reasoning, multi-step debugging,
arithmetic or date/time ordering, deterministic computations, questions whose relevant
state is not yet understood, and feeding large amounts of irrelevant context into a
decision.

## English-only internal prompting

All semantic content sent to Jev must be in English, regardless of the user's
language: `state`, questions, option/criteria descriptions, and rubric levels.

When the task is in German or another language, translate only the semantic
information required for the decision into English. Preserve exactly, without
translation: code, identifiers, filenames, API names, commands, technical
constants, quoted literals, and error messages when exact wording matters.

Do not force the user-facing answer into English. Only the internal Jev call
uses English.

## Division of responsibility

```
LLM:
- understand the problem
- gather relevant evidence
- perform multi-step reasoning
- write/change code
- debug
- design

Jev:
- make one bounded semantic judgment
```

A Jev call normally has minimal sufficient state, one atomic question, and
clear alternatives or a rubric. Prefer several small, well-defined Jev calls
over one vague multi-part judgment. Do not ask Jev to rescue poorly understood
context: if you cannot formulate a clear bounded question, reason and
investigate first, then ask Jev.

Do not escalate to a more capable generative LLM merely because a high-quality
bounded classification or verification decision is needed, if the current agent
can formulate a good Jev call. That is exactly what Jev is for.

## Runtime

- Model: `jev-1.13.0` (pinned in the tool).
- Requires `TYPESAFE_API_KEY` in the process environment. If it is missing, the
  tool fails with a clear error; do not attempt to supply or persist the key.
