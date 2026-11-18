# Evaluating development workflow changes

Read when development latency, context use, review churn or agent effectiveness is
the optimization target. Start from existing evidence and the user's frustration;
measurement should assess concrete improvements, not postpone well-supported fixes.

- Define a completed outcome and its correctness/acceptance guardrails. Prefer
  minutes per comparable outcome to minutes per file, test counts or PR counts.
- Record source revision, task scope/risk, machine, provider/model/settings and
  effective instructions. Keep required checks and explicit user exceptions visible.
- Separate implementation/investigation, actual command execution, review turnaround
  and correction/delivery intervals. Overlapping wall time is not additive. A
  timestamp saying tests passed does not measure how long tests ran.
- Use existing native task reports and thread metadata. Record context tokens and
  compaction events only when the harness exposes them; text length and repeated
  reads are diagnostic proxies, not token usage or compaction counts.
- Track consequential review findings, later regressions and user intervention
  alongside duration. An early failure or missed requirement is not a speed gain.
- Apply bounded authorized changes and observe subsequent comparable real tasks.
  Change one variable when testing causality matters; a combined workflow repair
  can be useful, but its results cannot isolate each change's effect. Small samples
  support directional decisions, not a promised speedup or proof of equal quality.
- Compare models/effort only when requested or authorized. Refresh official guidance
  and record actual harness settings; API capacity is not effective session capacity.
- Keep evidence in the existing PR/thread/local report locations. Do not introduce
  a framework, scheduler, extra full-suite runs or cache clearing just to collect
  timings. Revisit, simplify or remove guidance that does not improve outcomes.
