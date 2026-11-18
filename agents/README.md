# Shared agent configuration

`AGENTS.md`, `skills/`, and `mcp.json` are the portable source. The Mac's
existing native symlinks continue to use this checkout. Its Codex TOML currently
matches `mcp.json`; Claude's matching definitions live in ignored account state.
Native configuration setup keeps each host's account state separate.
`claude/settings.json` contains the selected shared theme/instruction discovery
settings. Never publish Claude account state, OAuth tokens or Codex auth files.
`opencode/` contains only optional native configuration; custom plugins, commands,
and Neovim hooks have been removed. Select it with `OPENCODE_CONFIG_DIR` as
described in the [root README](../README.md). `t3/` is ignored Mac-specific state.

## Local T3 release review

[`t3-release-review`](skills/t3-release-review/SKILL.md) provides an on-demand
review of Hetzner relevance, provider consistency,
and features worth trying. Invoke `$t3-release-review` locally; it reuses the
existing untracked review ledger and does not install or deploy updates.
Native local skill links follow the convention below. This Mac-local skill is
not installed on coding.

## Local council and improvement skills

[`model-council`](skills/model-council/SKILL.md) supplies the reusable four-family
team and orchestration contract. [`improve`](skills/improve/SKILL.md) supplies
metrics and bounded iteration, with `coordinator-build`, `build-and-review`, and
`build-only` modes. `model-council` works independently; install it alongside
`improve` when using the improvement workflow. Their
[single expert council configuration](skills/model-council/profiles/default.json) holds exact
models, high reasoning settings and reviewer weights independently of either workflow.
Astra and Opus each have 30% rating weight, Muse Wonder 25%, and Gemini 15%.
This preserves the existing seats’ relative user-preference weights while assigning
Muse Wonder an equal-seat share.
Explicit run-only overrides leave saved defaults unchanged. Evidence and hard
constraints are not weighted votes. `improve` asks for human calibration only when
objectives, subjective criteria or consequential tradeoffs need clarification.

For comparative measurements or requested visuals, the `improve` coordinator produces interactive checkpoint reports in the T3 thread
from a bundled [template](skills/improve/assets/report-template.html): a one-line
verdict with outcome bullets, a headline comparison with a labeled progress plot,
and an original-to-final change overview whose headings expand. Reviewer
discussion stays in supporting evidence. Comparable numeric results get progress
charts; qualitative results stay categorical. Reports
are checkpoint snapshots, with a Markdown fallback when rendering is unavailable.
Standalone `model-council` returns assessments and synthesis without this reporting workflow.
See the [reporting contract](skills/improve/references/checkpoint-reports.md).
Simple qualitative rounds use a concise text checkpoint rather than a mandatory
interactive report.

[`development-retrospective`](skills/development-retrospective/SKILL.md) diagnoses
slow or frustrating development from actual thread, diff, review and timing
evidence. It proposes or applies bounded workflow changes within the user's scope,
and refreshes official provider guidance when model changes matter. It does not
automatically launch a council, run extra suites or schedule monitoring. Existing
model settings, reviewer choices and correctness requirements remain explicit.

Examples in T3's composer:

```text
$model-council Compare these architecture options using the default council.
$improve Improve this page's visual hierarchy; use coordinator-build mode.
$improve Shorten this prompt without losing required fields; build-and-review with alternatives.
$development-retrospective Investigate this slow thread and improve the development workflow.
$development-retrospective Reassess our workflow for a new model; research and propose changes only.
```

Use native local skill links to this source, following the existing Obsidian
skill convention. Codex uses `~/.agents/skills`, Claude `~/.claude/skills`, and
Antigravity `~/.gemini/config/skills`. Restart an idle T3 agent session to refresh
discovery. These are skill files and a profile interpreted by the coordinator,
not a new T3 settings schema or background service. See the
[authoring and model rationale](skills/model-council/references/authoring-basis.md).

Muse Code also discovers the shared `~/.agents/skills` links directly; no skill
import or duplicate installation is needed. Its native personal instructions at
`~/.config/muse/AGENTS.md` are a local symlink to this checkout's `AGENTS.md`
(`$XDG_CONFIG_HOME/muse/AGENTS.md` with a custom XDG config home). Create that link
only when the destination is absent; preserve existing personal instructions.
Muse's `/rules` command confirms the native file loads, and
`muse skills list --source user --json` checks skill discovery and activation.
Verified locally with Muse Code 1.4.14: all four shared skills are enabled with
no diagnostics. Native Muse instructions take precedence over its foreign
personal-rule fallback; this avoids relying on Claude's `@` import wrapper.
Project instructions and skills still require a trusted workspace. See Muse's
[configuration](https://dev.meta.ai/docs/muse-code/configuration) and
[skill discovery](https://dev.meta.ai/docs/muse-code/extending) documentation.
The root `muse/` directory stays ignored, including credentials, trust records,
settings, locks and this machine's instruction symlink.

## Native coding host workflow

The Hetzner host now runs native T3 as `t3`, outside Kubernetes. The server
checkout is **`/srv/projects/config`**, using a read-only repo deploy key and a
sparse checkout of portable agent files. Do not clone over the server's ~/.config
or copy Mac credentials, OAuth stores, trust records or service state.

Use the native checklist below for initial setup and explicit Git sync for
routine updates. No custom configuration writer is maintained.
The [server runtime documentation](https://github.com/ant-le/server/blob/main/docs/t3code.md)
records deployed infrastructure evidence; source, publication and live acceptance
are separate stages.

### Current snapshot and first reconciliation

At the November 19 review, the server checkout was main@4cacae2 with copied,
unpublished portable changes and an untracked development-retrospective skill.
The Mac also has unpublished portable edits. The installed snapshot is therefore
not reproducible from a published commit yet. Preserve both worktrees.

Keep affected provider sessions idle for this first reconciliation: stashing
untracked linked skill files temporarily removes their content.

1. Review and publish the intended portable files from the Mac, including full
   skill bundles. Preserve unrelated Neovim/desktop edits and existing model and
   reviewer choices.
2. Fetch origin on coding. Compare its dirty tracked files and untracked skill
   files with the published revision, byte for byte where needed. Stop on any
   unresolved difference; never force-reset or clean the worktree.
3. Preserve the bootstrap snapshot with a specifically named `git stash push -u`,
   fast-forward to the verified revision, then verify every intended file remains.
   Do not pop an identical old snapshot over the published tree. Drop only that
   specific stash after proving it is redundant; otherwise retain it.
4. Confirm clean Git status and record the installed commit before routine sync.

### Routine configuration sync

Run as `t3`, with affected provider sessions idle:

First fetch and inspect the proposed revision; this block stops on a dirty tree:

```sh
(
  set -eu
  cd /srv/projects/config
  test -z "$(git status --porcelain=v1 --untracked-files=all)" || {
    echo 'Stop: config checkout has local changes' >&2; exit 1;
  }
  git fetch origin
  git log --oneline HEAD..origin/main -- agents
  git diff HEAD..origin/main -- agents
  git rev-parse origin/main
)
```

After reviewing the diff, use its exact printed commit below. Run this in each
clean checkout being updated; on the Mac use its config-repository directory.
Do not replace the target with a branch that may move after review.

```sh
(
  set -eu
  cd /srv/projects/config
  reviewed_commit=REPLACE_WITH_REVIEWED_COMMIT
  reviewed_commit="$(git rev-parse --verify "$reviewed_commit^{commit}")"
  test -z "$(git status --porcelain=v1 --untracked-files=all)" || {
    echo 'Stop: config checkout has local changes' >&2; exit 1;
  }
  git merge --ff-only "$reviewed_commit"
  test "$(git rev-parse HEAD)" = "$reviewed_commit"
  test -z "$(git status --porcelain=v1 --untracked-files=all)"
)
```

Review scripts/assets before the merge activates their linked content. Existing
links follow the checkout automatically; no installer/apply step is needed for
routine skill edits. Add links explicitly for a newly selected skill and start
fresh idle agent sessions to verify discovery. No background pull, live rsync or
shared writable home directory is configured.

### Native setup checklist

- Link the shared personal instructions and selected complete skill directories
  into each provider's effective native config home. Codex/Muse use ~/.agents/skills,
  Claude uses ~/.claude/skills and Antigravity uses ~/.gemini/config/skills.
  Existing links on coding point into this checkout. Preserve unrelated files.
- T3 can create isolated instance profiles. Its Antigravity profile links skills,
  but the normal terminal GEMINI.md and MCP registrations did not follow it.
  Verify the actual instruction/config home for each managed instance; do not
  assume a terminal login/configuration is also the T3 instance's configuration.
- Register the definitions in [mcp.json](mcp.json) using each provider's native MCP
  commands/configuration. Preserve unrelated servers and OAuth/account fields.
  Translate Antigravity remote URLs to `serverUrl`; other providers use `url`.
  The T3 ACP instance's config/mcp_config.json needs its own definitions. Setting
  GEMINI_HOME on `agy mcp add` did not target that profile in the inspected build.
  Do not link the entire terminal settings/auth store into the instance.
- Link shared instructions into the effective native personal-instruction file.
  The inspected T3 Antigravity profile had no GEMINI.md; verify it loads in a real
  session after setup. Do not copy provider OAuth credentials between homes.
- Check that skills can read bundled scripts/assets under the provider's actual
  sandbox. Broad ~/.claude denials currently need verification; skill symlinks
  alone are not acceptance. Preserve credential exclusions while fixing skill
  paths. Full access follows the selected native provider mode, not a promised
  all-provider credential boundary.
- Authenticate MCP integrations separately per host/provider. Verify one real
  Context7 query and Tavily search where intended. URL registrations and health
  listings alone do not prove authenticated tool calls.

Keep machine-specific paths in host setup rather than portable skill text. Agent
CLI installation uses vendor-native tooling for all four providers, with T3
controlling execution; mise remains available for
project runtimes, environment and tasks. The revised server plan removes the Auto
ceiling and launch locks; do not describe the currently capped host as migrated
until that policy and provider setup have actually changed.

### Drift checks and validation

The smallest useful check verifies a clean published source revision, native
links resolving into the checkout, and expected MCP names in each real instance.
Use native provider inspection and actual skill/MCP calls before adding a checker
or configuration writer. Registration is separate from authentication.

`mise run check:config` validates publishable JSON/TOML. The full
`mise run check` also loads Neovim/tmux and checks whitespace. These checks do
not establish native provider acceptance, publish or deploy configuration.

Before publication, inspect the full diff and untracked file list. Keep private
Claude/Codex state, ignored agent/T3/mise directories and credentials out of Git.
Publish intended portable changes explicitly, preserving unrelated work.
