# Investigating a development loop

## Evidence path

Start with the user's named thread, the actual diff/PR metadata, applicable
instructions and existing command reports. Verify the implementation checkout and
revision separately from the coordinator's bound workspace. A stale local checkout
cannot establish what the working agent changed.

Sample a few complete cycles that include initial work, checks, review findings,
corrections and delivery. Include a troublesome cycle and a routine one when
available. Expand the sample only when the diagnosis depends on it. Avoid printing
the whole history: filter response fields and retain evidence identifiers.

## Questions that change the recommendation

- **Scope:** Is each checkpoint a complete outcome or an arbitrary component?
  Inspect production, test, generated and catalogue changes separately. A small
  behavior change can have many generated lines; file count is not complexity.
- **Instructions:** Is a costly action required, explicitly overridden, or merely
  habitual? Distinguish an actual contradiction from a scoped user exception.
  Resolve duplication at its authoritative source instead of adding another rule.
- **Workspace:** Is the bound checkout the actual implementation? Is repeated
  archive preparation compensating for an avoidable mismatch? Preserve immutable
  evidence when the binding cannot change within the authorized task.
- **Documentation and wording:** Do instructions, canonical specifications and
  recurring product terms agree? Sample the affected UI wording and shared helpers
  against their documented meanings. Resolve conflicting definitions at their
  common source; do not turn the retrospective into an unrelated copy rewrite.
- **Verification:** Separate test writing and fixture debugging from command
  runtime. For each rerun ask what changed, what failed or what concern remained.
  Repeated query, fixture or modal-setup failures call for reusing an existing
  successful interaction pattern, not automatically adding more tests or helpers.
  Preserve fresh database/process checks where correctness requires them.
- **Reviews:** Track actionable defects, acceptance gaps, optional preferences and
  overlaps. Count unique consequential findings, not comments or approvals. Check
  whether corrections were verified and whether later defects escaped.
- **Context:** Inspect representative source reads, tool responses, command output,
  delegate returns and repeated briefs. Prefer native token/event metadata. T3
  projection truncation is not proof that native model input was truncated.
  Run counts, checkpoints and activity items are not compaction counts.
- **Delivery:** Is the agent repeatedly reconstructing state or preparing the same
  evidence? Does optional polish continually change the completion condition?
  Distinguish review preparation from reviewer runtime, and check whether existing
  freeze helpers and consolidated updates would remove repeated work.

## Small evidence record

For each consequential finding retain: observation, source reference and revision,
interpretation, proposed change, and limitation. Keep a short current-state record:
checkout/revision, outcome, done/remaining work, decisions, unresolved findings,
checks and artifact references. Retrieve deeper evidence when needed rather than
repeating it after every result.

Useful fixes often combine coherent review batches, canonical terminology,
shared helpers for identical semantics, concise reviewer returns and targeted
verification. Do not prescribe all of them for every project or treat shorter
output as success when it hides essential errors or evidence.
