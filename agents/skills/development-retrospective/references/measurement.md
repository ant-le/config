# Measuring the effect

Use existing native timing reports and thread/PR events. Collect only measurements
that can affect a decision. For a development loop, a compact set is:

| Measurement | Interpretation |
| --- | --- |
| Time to completed outcome | Compare similar scope and risk; retain queue/wait intervals and disclose overlap. |
| Check execution and reruns | Use actual command timing; classify each rerun by fix, failure, changed input or unresolved concern. |
| Review turnaround and yield | Record unique consequential findings, overlapping findings, fixes and escaped defects. |
| Context and recovery | Use observed tokens, compaction events/duration and repeated reads where exposed; label character counts as proxies. |
| Quality and intervention | Record acceptance failures, rework and required user corrections, not just faster completion. |

Record revision, clean/dirty state, effective instructions, model/provider/settings,
machine and selection/worker settings where relevant. Do not compare early failures
with successful latency or sum parallel task durations as total waiting time.

Start from the smallest credible historical baseline. Apply authorized changes and
observe the next few comparable real outcomes; report the sample size and scope
differences. A combined workflow repair can be worthwhile without isolating each
factor. For a causal claim, vary one factor on comparable work; for model quality
claims, use representative cases including consequential failure boundaries and
holdout cases where warranted. Do not replay paid/mutating work without authorization.

Keep pass/fail guardrails visible. Reject a speed gain that leaves required work
unfinished. A small sample with no regression does not establish equal quality.
Do not invent a target percentage or infer token use from words/characters without
labelling it an estimate. No extra framework or telemetry service is required.

At the next requested retrospective or available outcome, record whether to keep,
revise or remove each change and why. Do not schedule that follow-up automatically.

For a documentation pilot, inspect a few comparable real changes for missed
specs or checks in review, repeated source discovery and structural failures
caught before review. Use the existing task report to measure any added check.
Treat absent failures in a small sample as limited evidence. If a controlled
comparison is authorized and useful, replay the same task from the same
snapshot and model while varying one instruction. Keep result quality and
required verification visible alongside time, tool calls and cost.

## Initial case: openInvest, 2026-11-17

The inspected eight localization PRs (#230–#237) each touched 6–13 files and
repeated council/delivery cycles. One recovery slice's 43-test executions took
4.33s and 4.31s; its saved passing log was 268 bytes. Three reviewer returns totalled
15,031 characters; one multi-file source-read projection exceeded 20,000 characters.
These observations motivated batching and bounded-output changes, not a claim that
tests or reviews caused all session latency. Actual compaction cost was unavailable.
The timestamps used for the earlier phase estimate came from progress messages,
not exact merge events; do not reuse them as precise execution telemetry.

Source: [original development thread](t3-thread://v2/87ebc219-a086-4d75-8687-2b50775c2eda/2cefd984-d413-4c6a-b300-5c5ad6ad4265),
[sample recovery PR](https://github.com/ant-le/openInvest/pull/237).
Read those sources before relying on the case; it is an example, not a benchmark
for other projects, models or later revisions.
