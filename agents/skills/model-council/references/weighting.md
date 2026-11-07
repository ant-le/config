# Reviewer weights and configuration

Use the one expert configuration in `profiles/default.json`. Its seat IDs identify the configured independent reviewers; `review_weight` controls influence only when aggregating comparable subjective ratings. `weight_basis: user_preference` means the defaults express the user's trust preference, not benchmarked reliability. Reasoning effort, reviewer weight and criterion importance are separate concepts.

## Resolve and freeze

- Precedence is an explicit user override, then the saved configuration. Accept an explicit mapping or unambiguous instruction such as equal weights. Resolve the complete mapping across all seats; if a partial request leaves the distribution ambiguous, ask rather than guessing. Require finite positive weights summing to 1 (allow normal floating-point tolerance). A smaller weight never removes a seat's participation or evidence requirements.
- State and record the profile name/version, resolved targets/options, complete weights, basis and override provenance before reviewing candidates. A per-run override does not edit the saved configuration. Never tune weights to favor an already-seen answer, the coordinator's preferred candidate, or a self-reported confidence value.
- Persisted model, effort or weight changes require an explicit request and a new configuration version. Freeze the resolved configuration for a comparison round. If an authorized change affects a later comparison, record a new configuration snapshot and re-evaluate affected judgments as needed; do not present incompatible aggregates as progress. Existing raw ratings may be reaggregated for an explicit weight-only change, but label that as reaggregation, not new review evidence.
- Reviewers receive the same substantive criteria and produce independent raw judgments. Weight arithmetic belongs to the coordinator; do not tell a seat to defer to a higher-weight model. Builder identity and reviewer weight never confer preference on an authored artifact.

## Aggregate ratings, not evidence

For each candidate and criterion, compute `weighted_value = sum(review_weight_i * rating_i)` only when every configured seat supplied a valid numeric rating on the same anchored scale, target, brief version and evaluation conditions. For ordinal ratings, explicitly disclose the equal-spacing assumption. Preserve individual ratings and their spread. Aggregate baseline and candidate separately; a delta requires both under compatible conditions.

If a seat fails, returns an invalid object or lacks required evidence, the council remains incomplete or has limited coverage under the task contract. Missing/noncomparable ratings make that criterion's weighted value null; never substitute zero or silently redistribute weight. A complete qualitative review can legitimately have no numeric aggregate.

Keep measurements attached to their actual checks and samples; repeated citations of one measurement are not independent trials. Do not weight test outcomes, verified facts, finding counts, categorical retain/revise decisions or model confidence. For qualitative planning/review, synthesize the evidence and tradeoffs without a weighted vote. Verified consequential objections from any seat must be addressed or explicitly left unresolved; failed hard constraints cannot be averaged away.

When weighted ratings drive a candidate selection, check whether a modest change in reviewer weights changes the recommendation. Unless the brief specifies another sensitivity check, transfer 0.05 weight between each pair of seats in both directions, retaining positive weights and the same criterion policy. Report a reversal or tie as weight-sensitive, show the affected alternatives, and do not hide it behind a single winner. The calling workflow can seek human judgment on the consequential tradeoff. Sensitivity calculations use existing ratings and need no extra council calls.

Reviewer weighting does not choose the relative importance of criteria. Return per-criterion summaries; combine criteria only when the brief supplies a separate, explicit policy. Agreement or a high weighted score is not a probability of correctness or proof of optimality.

## Return to the caller

Include `resolved_configuration` with profile name/version, seat IDs, actual models/settings, weights, basis and overrides alongside the stage result. Include `rating_aggregates` only where ratings apply: candidate/criterion IDs, unit, individual values by seat, weighted baseline/candidate values or null, coverage and missing reasons, and sensitivity findings when selection depends on weighting. The caller retains this configuration and these results unchanged when making its decision or presenting them.
