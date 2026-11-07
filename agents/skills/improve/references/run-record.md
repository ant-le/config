# Coordinator run record

The `improve` coordinator keeps one compact structured record in the thread, alongside the brief and evidence references. Read this reference when starting, persisting or resuming a run. Persist the record only under the council's record-and-resume rules. Checkpoint reports are generated from it; see [checkpoint reports](checkpoint-reports.md).

## Fields

Use these fields as a common vocabulary. Omit what does not apply.

Always:

- `run_id`, `objective`, `checkpoint_id`, and `run_status` (`running`, `complete`, `incomplete`, or `stopped`).
- `evaluations`: `evaluation_version`, criterion definitions, units, rating anchors, direction, guardrails, and relevant case/environment references. This identifies comparable evaluations separately from `brief_version`.
- `candidates`: `target_id`, display label, round, `parent_target_ids`, artifact/evidence references, the hypothesis and change summary, and `evaluation_version`. An integrated candidate can have multiple parents. A baseline has none.
- `decisions`: candidate ID, round, the retained-best target it was compared against, outcome (`retain`, `revise`, `reject`, or `inconclusive`), reason, adopted/rejected/deferred findings, material dissent, and the review/check references supporting that decision.
- `final_changes`: meaningful net changes between the frozen original and delivered final version. Each entry has a descriptive heading, a one-line effect, original behavior/content, final behavior/content, verification/limitations and evidence references. Derive this from the actual endpoints. Exclude abandoned or reverted intermediate changes, and do not attribute pre-existing user edits to this run.
- `retained_target_id`, remaining call budget, and next action.

When a council stage ran:

- `council_configuration`: profile name/version, resolved seat IDs/models/settings, reviewer weights, weight basis, explicit overrides and their provenance. Keep historical snapshots when a later run or round changes configuration.
- `executions`: stage, round, seat ID, actual provider/model/options, task ID, returned thread link, attempt number, and observed execution status. Retries remain separate attempts; they do not create extra independent reviewers.
- `reviews`: execution reference, `target_id`, `brief_version`, `evaluation_version`, and the validated review object or a durable reference to it. For a multi-candidate return, associate each nested review with its candidate and preserve the overall recommendation.
- `rating_aggregates`: council-returned per-criterion values, coverage, weighting version and sensitivity. Retain the individual values and do not recompute them with different reviewer weights.
- `reviewer_summaries`: for each seat and reviewed candidate, a plain-language verdict, main supported finding, main concern, and coordinator response (changed, verified, deferred or disputed, with a reason). Keep these traceable to the source review and decision, not invented paraphrases of consensus.

When applicable:

- `rounds`: ordered improvement checkpoints, each with candidate IDs, parent IDs, source conversation run IDs, change summary and stopping/continuation reason. Conversation turns that only collect reviews belong to the same round; they are not new candidate versions.
- `calibration`: human input when needed, the criteria/anchors/tradeoffs it established and evaluation version; otherwise the established objective/preferences used without a new question.
- `checks`: candidate ID, check name, actual result and evidence reference. Keep coordinator checks separate from reviewer judgments.

## Integrity

Use the criterion IDs from the brief consistently. Resolve harmless label variations explicitly; do not silently equate different criteria. Preserve source returns, missing values and evidence limitations. Actual execution metadata comes from orchestration results, not a reviewer's self-description.

A changed artifact gets a new target ID and links to its predecessor. Reviews remain attached to the exact reviewed target; an edit does not inherit its parent's review status. For planning or build-only stages, record proposals or artifacts and actual checks without inventing reviewer assessments.
