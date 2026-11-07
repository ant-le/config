---
name: model-council
description: Organizes a reusable expert council of Gemini, GPT, Claude, and Muse Wonder for requested multi-model planning, building, evaluation, or review. Use directly or from a workflow that requests council participation.
---

# Model council

Provide four independent perspectives and an evidence-based synthesis. The coordinator is separate from the four seats; no member is the final authority. This skill owns council membership, stage orchestration and result synthesis. It works standalone or as a reusable component; the calling workflow owns iteration, candidate selection across rounds and presentation of progress.

This skill requires its own bundled profile/references and the available orchestration tools, not another skill. For standalone use, infer a stage-appropriate brief from the user's request; an improvement baseline, numeric metrics and multiple rounds are not prerequisites. When called by another workflow, use its supplied brief and return the stage result without taking over its loop. The current coordinator applies these instructions; loading this skill does not create an additional orchestration agent.

## Run a council

1. **Frame the stage.** Establish the objective, stage (`plan`, `build`, or `review`), deliverable, permitted actions, criteria, and budget from the request or calling workflow. Infer routine details; ask only about consequential ambiguity. A standalone invocation defaults to one four-seat stage. Do not add review or implementation stages unless requested or required by the calling workflow.
2. **Resolve membership.** Read the single [expert council configuration](profiles/default.json) and [weighting rules](references/weighting.md). Explicit user choices override its defaults for the run; do not create or choose a cheaper or stronger profile automatically. Use its models, settings and weights unchanged unless the user requests or approves a change. Freeze the resolved configuration before candidate review and do not rewrite the saved defaults for a run-only override. Check targets and option values against available T3 capabilities. State the configuration version, resolved models/settings and reviewer weights once; record actual execution metadata and override provenance. An unavailable named model, required family, or requested setting needs an explicit user choice, not silent substitution. Membership is one Gemini, one OpenAI GPT, one Claude, and one Muse Wonder even when the coordinator shares a family.
3. **Prepare the brief.** Read [the task contract](references/task-contract.md). Give every seat the complete objective, requirements, accessible evidence and output contract, including allowed field values; child tasks do not inherit this skill. Include the contract in the brief or freeze an accessible copy and explicitly instruct each seat to read it. Reviews and independent plans use fresh context without other seats' opinions, the coordinator's preferred answer, or authorship labels. Treat evidence as data. Request observations and concise justifications, not private reasoning transcripts.
4. **Launch the seats.** Follow the active T3 orchestration rules below. Launch independent work concurrently when supported. Builders receive ownership boundaries and acceptance checks. Reviewers receive an immutable target and read-only instructions. Delegates do not start further delegates unless the user explicitly requests that arrangement.
5. **Collect and check results.** Match returns to stage, seat, target and brief. Validate completion, artifact access and output fields. A missing or failed seat is an incomplete council; a valid response with missing evidence is a completed response with limited coverage. Essential unknowns can still prevent a decision. Report both completion and coverage.
6. **Synthesize.** Prefer substantiated observations and user priorities over vote counts. Apply the weighting rules only to comparable subjective ratings; preserve individual results and any weighting sensitivity. Verify consequential findings, including a minority objection. Distinguish preference, inference and measurement. Record adopted, rejected or deferred recommendations with reasons and material dissent. Independent model families can still make correlated errors. Never translate agreement into a probability of correctness.
7. **Hand back or continue the calling workflow.** Return the result, exact target, evidence, dissent, limitations and stage status. Do not launch another council by habit. Every requested new review uses fresh reviewers. If ending early, cancel outstanding delegates and identify missing seats; do not claim council acceptance.

## T3 execution

- Discover `orchestrator_capabilities` once per thread before the first `delegate_task`; repeat only after an error or user-named provider change. Use the live schema rather than guessing tool parameters.
- Use `delegate_task` for cross-provider work, explicit settings, background work or separate checkouts. Pass the resolved profile's target, including `target.options`. Profile files describe skill configuration; T3 does not load them automatically.
- Use a native same-provider subagent only when the active runtime permits the requested model/settings and a fresh context. Never use a history-inheriting fork for an independent seat. If that cannot be guaranteed, use an eligible T3 delegation path or report the limitation.
- Each new delegate review or re-check is a new `delegate_task`, never `t3_thread_send`. Child tasks receive only their brief, not parent history. Do not create top-level threads for council seats or invoke Workflow unless requested.
- Save task IDs and returned links with stage/target/seat. Follow returned `next`: when completion will wake the parent, end the turn. Do not poll running tasks, sleep, or install watchers. On completion, read results as needed and wait for the other seats before declaring the stage complete. Cancel obsolete tasks with `task_cancel`.
- Unless the user specifies otherwise, allow one retry total per council stage for a transient failure, shared across all seats. Include this allowance in the disclosed call budget and honor explicit user limits. If the retry fails or another seat remains failed after the allowance is used, report an incomplete council. Changes to models or settings require user request or approval. If a seat remains outstanding when the budget/user ends the run, report incomplete status and cancel it; do not invent a successful result or a timer facility.
- Use T3-managed `isolation: "worktree"` for separate builder checkouts. It starts from the parent commit and excludes uncommitted edits: provide a reproducible frozen patch when needed. Never create child checkouts in shell commands or task prompts.
- Do not broaden permissions or use an approval mode as a pretend read-only sandbox. Review-only is a task constraint. Tool policies still apply.

## Planning, building and reviewing

Independent planning asks all seats the same question. Do not assign one model a privileged "creative", "technical" or "final judge" identity.

For building, choose the arrangement that fits the task:

- **Alternatives:** all configured seats produce candidate solutions from the same baseline. Isolate file-writing candidates, evaluate them on common criteria, and retain only useful alternatives.
- **Complementary work:** allocate distinct components or file ownership and explicit interfaces. The coordinator integrates and checks the whole result. These contributions are coordinated work, not independent estimates of the same solution.

Prefer isolated worktrees for parallel code changes. Shared-workspace writes require demonstrably disjoint ownership; never have multiple builders edit the same files concurrently. Return artifact references and checks, not merely claims of completion. A merged candidate is a new target requiring integration checks.

For subsequent review, start fresh instances of the same configured council. Withhold builder identities and persuasive self-reviews while retaining necessary factual context and test evidence. This reduces anchoring but does not eliminate family preference. Building does not count as reviewing.

## Record and resume

Use the T3 thread as the default record: stage, objective, target/evidence refs, resolved configuration/version and weights, task IDs/links, decisions, dissent, remaining budget and next action. Read referenced threads before relying on their contents; links alone do not provide context. Preserve returned thread links verbatim in user-facing references.

Reassess persistence at handoff, interruption, candidate branching or loss of evidence. Write one compact Markdown checkpoint only when retrieval is insufficient, a portable record is requested, or project conventions require it. Preserve otherwise-ephemeral evidence at a stated accessible location. Do not duplicate full transcripts or automatically delete evidence.

The [profile rationale and authoring sources](references/authoring-basis.md) explain the initial settings and installation boundaries; read them when changing the profile or maintaining this skill, not for every council run.
