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

Coding runs native T3 as the non-admin `t3` user, outside Kubernetes. Its portable
config checkout is **`/srv/agent-config`**, under a parent the rootless container
account cannot modify. Coding agents may edit this checkout. Its repository key
is read-only; publishing config changes uses an explicitly authorized GitHub
write credential or the Mac checkout. Never clone over the server's entire
~/.config or copy Mac OAuth stores, trust records or T3 state.

The [server operating guide](https://github.com/ant-le/server/blob/main/docs/t3code.md)
is authoritative for deployed versions and acceptance. Full access is available;
there is no Auto ceiling or provider launch lock. All four CLIs are vendor-native;
mise manages project runtimes and tasks. Muse stays enabled. Full access is the
coding host's default; Claude's native Bash sandbox is a separate user setting.
Muse offers only Supervised and Full access; Antigravity can still ask native
questions in Full access.

### Routine configuration sync

Keep affected sessions idle when replacing linked executable skill content.
Review both local changes and the exact published revision; never force-reset or
clean an agent's edits. Run as `t3` on coding (the Mac uses this repo's own path):

```sh
(
  set -eu
  cd /srv/agent-config
  test -z "$(git status --porcelain=v1 --untracked-files=all)" || {
    echo 'Stop: config checkout has local changes' >&2; exit 1;
  }
  git fetch origin
  git log --oneline HEAD..origin/main -- agents
  git diff HEAD..origin/main -- agents
  git rev-parse origin/main
)
```

After reviewing the diff, merge its exact printed commit:

```sh
(
  set -eu
  cd /srv/agent-config
  reviewed_commit=REPLACE_WITH_REVIEWED_COMMIT
  reviewed_commit="$(git rev-parse --verify "$reviewed_commit^{commit}")"
  test -z "$(git status --porcelain=v1 --untracked-files=all)"
  git merge --ff-only "$reviewed_commit"
  test "$(git rev-parse HEAD)" = "$reviewed_commit"
  test -z "$(git status --porcelain=v1 --untracked-files=all)"
)
```

Existing native links follow the checkout; no copy/apply step is needed. Add
links for newly selected complete bundles explicitly. No background pull or live
rsync is configured. The original bootstrap snapshot remains in a named stash;
initial reconciliation is complete, so it is not part of routine updates.

### Native setup checklist

- Link the shared instructions and full skill bundles from this checkout.
  Codex/Muse discover ~/.agents/skills; Claude uses ~/.claude/skills;
  Antigravity uses ~/.gemini/config/skills. Muse's personal file is
  ~/.config/muse/AGENTS.md. On Linux, link Claude directly to agents/AGENTS.md;
  the Mac's CLAUDE.md import path is not portable.
- T3's isolated Antigravity ACP profile needs its own GEMINI.md link and
  config/mcp_config.json. T3 supplies its skill link; terminal configuration
  does not automatically populate the other two. Preserve unrelated state and
  use `serverUrl` where the shared template uses `url`.
- [mcp.json](mcp.json) supplies portable OAuth URL templates. Coding uses the
  direct Context7 /mcp endpoint with a private Authorization header, and a
  private header for Tavily too. Preserve these host-specific overrides when
  updating definitions. Never put keys, auth-bearing files or full homes in Git
  or service.env. Private native settings are mode 0600.
- Verify actual instruction discovery and an asset-bearing skill in each
  provider, plus native Context7 and Tavily calls. Model listings and file
  presence alone are not acceptance. Restart idle sessions after updates.
- Configure Git author identity and a per-repository SSH public-key selector
  through the server checklist. Git transport and T3's saved GitHub API token
  serve different operations. Neither requires an account-wide `gh` login on
  coding.

`mise run check:config` validates publishable JSON/TOML on the Mac; the full
`mise run check` also checks Neovim/tmux and whitespace. Neither establishes
provider acceptance or deploys config. Review the full diff and untracked files
before publication; keep private provider/T3 state outside Git.
