---
name: development-retrospective
description: Diagnose and improve an agent-assisted development workflow from thread, diff, review and timing evidence. Use for on-demand reviews of recent T3 threads within or across projects, or when the user reports slow or frustrating development, excessive compaction, testing or review churn, or requests reassessment after model changes. Not for ordinary feature implementation, code review or automatic monitoring.
---

# Development retrospective

Turn observed development friction into concrete changes to working practices,
instructions, skills or tooling. Keep the investigation smaller than the problem.
One coordinator is the default; this skill does not automatically launch a council.

For “review recent work” requests, use the [T3 thread survey](references/thread-survey.md). A survey returns findings in the current conversation. Use the investigation below for a particular problem or an authorized change.

## Diagnose and act

1. Establish the user's complaint, desired outcome and allowed scope. Preserve
   research-only requests; when changes are authorized, implement the useful
   reversible changes rather than stopping at a benchmark plan. Do not silently
   change models, effort, reviewer membership, correctness gates or permissions.
2. Read applicable project instructions and identify the actual working checkout,
   source revisions and relevant thread. Follow [investigation](references/investigation.md)
   to sample complete development cycles, including corrections. Use existing
   evidence first; expand only to resolve a consequential uncertainty.
3. Separate observed facts, plausible causes and missing measurements. Inspect
   both runtime and work generated: repeated discovery, tiny review checkpoints,
   instruction conflicts, test authoring, duplicate checks, context growth and
   review corrections. Do not blame compaction or test execution from wall time alone.
4. Propose or apply a bounded set of concrete changes, each with evidence, expected
   benefit, preservation constraints and a way to undo it. Prefer fixing the common
   cause. Put durable routing in AGENTS.md, domain meaning in project documentation,
   executable behavior in code, reusable procedures in skills and environment
   settings in native provider/T3 configuration. Avoid overlapping instructions.
5. When model behavior or a model update matters, read
   [provider guidance](references/provider-guidance.md), refresh the relevant
   official source and compare it with the actual harness. Do not infer effective
   context limits or supported features from an API model card alone.
   Use the same reference for a documentation and instruction audit.
6. Validate changed instructions for consistency, links and discovery; validate
   executable changes with the project's appropriate checks. Use
   [measurement](references/measurement.md) to observe subsequent real work.
   Missing historical telemetry does not prevent well-supported improvements;
   it limits causal and speedup claims.
7. Report the diagnosis, concrete changes or proposed diff, evidence, remaining
   uncertainty and next evaluation point. Retain/revise/remove guidance based on
   observed outcomes. Keep one compact decision record with evidence references
   in the existing thread/PR system; do not create a second progress ledger.

## Boundaries and stopping

Default to one investigation and correction pass. Stop when the actionable causes
are addressed within scope and appropriate validation is complete, or identify the
specific external dependency that prevents completion. Do not keep researching to
fill a checklist or wait for future samples before handing back completed changes.

Use `model-council` only when requested or required by applicable instructions;
use `improve` when the user wants a bounded iterative candidate comparison. Neither
is a prerequisite for this skill. Do not delegate the orchestration itself or
recursively run retrospectives on the retrospective.

Never start schedules, background monitoring, extra full-suite repetitions, cache
clearing or model sweeps solely because this skill was invoked. Preserve raw
evidence by reference where possible; avoid retaining private research, credentials
or reasoning transcripts. Measure task success and rework as well as speed.
