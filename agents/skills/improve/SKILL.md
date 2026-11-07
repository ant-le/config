---
name: improve
description: Runs bounded, evidence-based iterative improvement of a chosen aspect of an artifact or behavior, using explicit metrics and a model council. Use when asked to improve, iterate on, optimize, hill-climb or measurably refine something, or for council-assisted improvement; not for ordinary one-off edits.
---

# Improve

Improve the selected aspect of an artifact or behavior with evidence proportional to the claim. This is a practical workflow, not a claim of statistical validation or mathematical convergence.

Use the companion `model-council` skill for membership, task contracts and orchestration. Load it by its available skill name, or resolve [its entrypoint](../model-council/SKILL.md) from this skill's real source directory. If it is unavailable, report the missing dependency before claiming or launching council work. Do not copy its profile into this skill.

The improvement coordinator applies that skill directly for each `plan`, `build` or `review` stage; do not delegate an extra agent merely to orchestrate the council. Supply the stage brief from this run and record what the council returns (resolved configuration, stage status, per-seat results, aggregates, gaps and calls used). This skill keeps ownership of baseline measurement, integration, retain/reject decisions, budget, iteration and reporting. An incomplete council remains incomplete; do not infer acceptance from a subset of replies.

## Workflow

1. **Frame.** Infer target, audience, aspect to optimize, allowed changes, must-preserve properties and a worthwhile improvement. State the working interpretation briefly. Ask only about consequential ambiguity. Establish the mode and budget below; there is no mandatory confirmation form.
2. **Define evaluation.** Read [metrics](references/metrics.md). Choose direct measurements, anchored ratings, qualitative observations or an explicit combination. Record definitions, baseline procedure, targets, direction and guardrails before any comparison. Prefer outcomes to proxy activity counts, and do not manufacture precision. Ask the user for calibration only as that reference describes; do not start dependent optimization until required input arrives.
3. **Establish baseline.** Preserve the current version and gather the smallest relevant evidence, using existing repository/mise checks. Record environment, model and settings where they matter. Identify whether model work means prompt, config, routing or model selection, or an available training pipeline. The baseline is the first retained best.
4. **Build.** Start from evidence: state the suspected cause of the gap, drawn from baseline results or observed failures, and the change expected to address it. Record both with the candidate. In `coordinator-build`, the coordinator produces the candidate; in council-building modes, all configured council seats work through `model-council` as alternatives or complementary owners, and the coordinator integrates and checks the result. Keep the retained best recoverable.
5. **Evaluate.** Compare the candidate with the retained best under the same evaluation version and comparable conditions. Collect actual values for defined measurements or anchored ratings; for qualitative criteria, report evidence-backed observations without inventing scores. Separate introduced regressions from baseline defects or invalid checks. Freeze target and evidence before council review. Reviewers get fresh context; authoring never counts as independent review.
6. **Decide and correct.** Retain the candidate only if it beats the retained best by a worthwhile margin, or makes a tradeoff the user has accepted, with every guardrail satisfied; otherwise keep the retained best. Use the council's reviewer weights and aggregates unchanged; criterion importance is a separate task choice. A new consequential tradeoff needs calibration under the metrics reference, and the candidate stays provisional until it is settled. Fix substantiated findings with the smallest useful in-scope correction, including misleading claims and tests that miss the consequential regression; a nonblocking label alone is no reason to defer, and every deferral gets a reason. If the rubric or method changes, version it and re-evaluate the baseline and compared candidates.
7. **Stop or repeat within budget.** Stop at sufficient outcome, marginal expected benefit, repeated no-progress, an unresolved consequential tradeoff, budget exhaustion or a user stop. A material change after review needs a fresh checkpoint to claim review of that version; if review budget is exhausted, keep the best supported version or label the changed version unreviewed. Revert only skill-owned changes, preserving user edits.
8. **Report.** After each completed round and at final handoff, render a [checkpoint report](references/checkpoint-reports.md) from the [report template](assets/report-template.html); reuse an unchanged final checkpoint. The report compares the frozen original with the delivered version, while decisions use the retained-best comparison from step 6. Distinguish a retained partial gain from achieving the user's goal.

## Mode and budget

- `coordinator-build` (default): coordinator builds; the full council reviews candidate checkpoints.
- `build-and-review`: all configured council seats build; fresh instances of every seat review the selected or integrated candidate.
- `build-only`: all configured seats build; coordinator and task checks evaluate. Explicitly report that no independent council review occurred.

Building arrangement is `alternatives` for competing solutions or `complementary` for clearly separable components. Follow an explicit choice; otherwise select and state the arrangement. All configured seats participate in a council build. Do not confuse division of labor with independent solutions from every seat.

Honor explicit user budgets and requested planning or final review stages. Otherwise default to one initial candidate round and at most one correction round, with one full council review per round when the mode includes review. In build modes, the initial round uses one builder per configured seat; corrections use the coordinator unless the user requests another council build. One alternatives round can produce one candidate per configured seat; review the selected candidate or a bounded common comparison, not an unannounced review fan-out. Reserve review resources before building. A planning council is optional unless requested.

A round is a distinct reviewed candidate. Turns that only collect reviews, unchanged reruns, deliberately weakened candidates and filler edits are not rounds. For an explicitly requested multi-round test, use an artifact with at least two worthwhile successive changes and declare the checkpoints and review budget up front. If no worthwhile second change remains, say the multi-round path was not exercised.

Use the council's default of one retry per stage unless the user specifies otherwise, and include it when disclosing the call budget. Count every builder, reviewer and retry call. Disclose the chosen bound; do not invent monetary limits without usage or pricing data. If resources cannot cover all configured seats, explain the constraint rather than quietly shrinking the council or switching models. Cheap mechanical checks need no extra council, and an unchanged final reviewed target needs no duplicate sign-off.

## Evidence and state

Use the council's frozen target and evidence conventions, including staging evidence where every seat can read it. The coordinator owns the [run record](references/run-record.md); read it when starting, persisting or resuming a run. Keep reviews attached to the exact reviewed targets. The thread holds the record by default; add a compact Markdown checkpoint only when retrieval, portability or project conventions require it, and save raw evidence only where no durable copy exists.

On resume, read the referenced records and verify content and environment identity before reusing evidence. If interrupted before a complete council checkpoint, cancel outstanding work when ending the run, name completed and missing seats, and do not claim council acceptance. An unreviewed improvement may still be delivered honestly with its actual checks and limitations.
