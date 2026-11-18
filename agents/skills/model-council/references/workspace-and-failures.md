# Workspace access and provider failures

Use T3's workspace support before changing provider settings or installing wrappers. These checks apply to every council provider; native tools may enforce different boundaries.

## Bind the exact target

Read the coordinator's T3 thread metadata and verify its workspace against the frozen candidate. For a root thread, resolve the project root when the worktree field is null. Naming another checkout in the prompt does not grant native-tool access to it.

Resolve the binding once before substantive work and reuse its verified identity
until the checkout or target changes. When starting an authorized new development
thread, bind it to the intended checkout through T3. Avoid designing every review
around an accidentally stale root. If the active thread cannot be rebound, preserve
one immutable accessible manifest and source artifact; report the limitation
without repeatedly reconstructing the same archive or explaining the mismatch.

- Shared delegation uses the coordinator's bound checkout. Use it when that is the intended candidate and reviewers will not mutate it.
- T3-managed `isolation: "worktree"` starts from the parent's commit and excludes uncommitted files. Check the expected commit before launching; preserve any required dirty changes as an immutable, accessible patch/evidence artifact.
- If the candidate is in another worktree, use T3's supported workspace binding. The UI offers **New thread in this worktree**. Do not create a top-level coordinator unless the user requests a new thread; explain the binding limitation when the current thread cannot access the candidate.

Include this small check inside the substantive review, not as an extra model call:

```text
Before review, report your bound workspace and git HEAD; compare HEAD with
<expected SHA>. Open <one relevant target file> with your native file reader
and confirm its expected content/range. If identity or essential access fails,
return that limitation and stop. Do not switch targets, broaden permissions,
or repeatedly work around native denials with shell reads. Otherwise continue
the review. Do not edit files or start delegates.
```

Adapt identity checks for a frozen patch or non-code artifact. Read access to one file proves that path, not access to every image or external evidence item. Resolve attachments through supported attachment mechanisms and preserve any remaining coverage gaps.

## Read and report efficiently

Request a concise verdict and prioritized, actionable findings with file/line or artifact evidence and limitations. Keep important findings even when there are many; avoid repeating the brief and narrating every tool call. Use focused native range reads where supported and expand them when surrounding context matters. Repeat a read when new evidence or a tool limitation warrants it, not merely because a timeline preview is shortened.

Keep T3's displayed/retained tool projection separate from the native result received by the model. A truncation marker in the timeline alone does not establish missing model input. Confirm that claim in the native tool result before changing chunk sizes or display limits.

## Bound failure recovery

A native read denial is an access/configuration failure; a backend 502 is a provider failure. Neither is a finding against the candidate. A reviewer that finishes with missing evidence has limited coverage; a provider turn ending without a review is an incomplete seat.

Use T3's terminal status, pending requests and available error evidence. Do not poll running delegates or invent timers. Follow their returned continuation instructions. A slow run with active progress is still working. After a confirmed transient failure, use the existing stage retry allowance and the same target/model/settings; cancel an obsolete active task before replacement. A quota reset or authentication problem needs its own recovery, not repeated requests. Replaying mutating work requires checking what already completed.

Provider runtime bugs require a separately validated T3/runtime change. Prompt instructions cannot repair error parsing, a silent ACP transport or Google's backend. Avoid broad filesystem grants, automatic model downgrades and unqualified runtime updates as general remedies.

## Compare runtimes honestly

At collection, retain T3 task/run identifiers, returned links, actual provider/model/options, frozen target and brief version, terminal outcome, and available request/start/completion timestamps. Keep queue/start delay separate from execution and total user wait. Record access failures and backend errors when observed; don't label all unaccounted wall time as reasoning. Use native tool metadata for repeated reads when available and retain only the relevant evidence, not private reasoning transcripts.

Compare equivalent workload, settings and completion/coverage. Report failed/cancelled runs separately and include retry cost in total waiting time. One successful access probe validates the binding; it does not establish a sustained latency improvement or comparative model quality.
