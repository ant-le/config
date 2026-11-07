# Shared agent configuration

`AGENTS.md`, `skills/`, and `mcp.json` are the portable source. The Mac's
existing native symlinks continue to use this checkout. Its Codex TOML currently
matches `mcp.json`; Claude's matching definitions live in ignored account state.
The Hetzner task deliberately does not rewrite Mac symlinks or account state.
`claude/settings.json` contains the selected shared theme/instruction discovery
settings. Never publish Claude account state, OAuth tokens or Codex auth files.
`opencode/` contains only optional native configuration; custom plugins, commands,
and Neovim hooks have been removed. Select it with `OPENCODE_CONFIG_DIR` as
described in the [root README](../README.md). `t3/` is ignored Mac-specific state.

## Local T3 release review

[`t3-release-review`](skills/t3-release-review/SKILL.md) replaces the hourly release
automation with an on-demand review of Hetzner relevance, provider consistency,
and features worth trying. Invoke `$t3-release-review` locally; it reuses the
existing untracked review ledger and does not install or deploy updates.
Native local skill links follow the same convention described below. This skill
is not installed on Hetzner by `agents:apply`.

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

The `improve` coordinator produces interactive checkpoint reports in the T3 thread
from a bundled [template](skills/improve/assets/report-template.html): a one-line
verdict with outcome bullets, a headline comparison with a labeled progress plot,
and an original-to-final change overview whose headings expand. Reviewer
discussion stays in supporting evidence. Comparable numeric results get progress
charts; qualitative results stay categorical. Reports
are checkpoint snapshots, with a Markdown fallback when rendering is unavailable.
Standalone `model-council` returns assessments and synthesis without this reporting workflow.
See the [reporting contract](skills/improve/references/checkpoint-reports.md).

Examples in T3's composer:

```text
$model-council Compare these architecture options using the default council.
$improve Improve this page's visual hierarchy; use coordinator-build mode.
$improve Shorten this prompt without losing required fields; build-and-review with alternatives.
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

The Hetzner installer below still manages only `obsidian-markdown`; it does not
deploy these new skills. Do not run `agents:apply` to install them locally.

## Hetzner operator workflow

Status: installer prepared and locally validated on 2026-11-01; **not applied or
accepted live**. Use the reviewed published Git revision for server maintenance.
Read-only inspection found the deployed skill service, existing provider credential
files, and no user instruction/config files except Claude's regular state file.
A subsequent read-only server check confirmed both provider login-status commands
exit successfully. MCP OAuth and fresh-session acceptance remain pending.

The existing `~/.config` contains Git/GitHub/Anthropic machine state. Use
`/home/t3/projects/config` instead. Read-only server verification confirmed that existing Git credentials can access
this repository; no additional credentials are needed. Do not copy the Mac's
GitHub login, SSH keys, OAuth stores, or `.zshrc`.

After separately approving server maintenance, run as the T3 user outside the
provider command sandbox. First clone `https://github.com/ant-le/config.git`
with `--no-checkout` into `/home/t3/projects/config`, set a **non-cone sparse
checkout** selecting only `/mise.toml`, `/agents/AGENTS.md`, `/agents/mcp.json`,
`/agents/README.md`, `/agents/scripts/`, `/agents/skills/`, and
`/agents/claude/settings.json`, then check out the reviewed published revision.
Do not clone over an existing directory. Review the selected Git diff before
trusting or executing a new task revision. Keep provider sessions idle while
merging Claude state, which the provider can also write.

Routine approved maintenance:

```sh
git -C /home/t3/projects/config pull --ff-only
mise -C /home/t3/projects/config run agents:apply -- --check
mise -C /home/t3/projects/config run agents:apply
```

The current image has Python 3.11+ but **no mise**. Until mise is included through
an approved image release, use the exact task body without installing a runtime
on the PVC:

```sh
python3 /home/t3/projects/config/agents/scripts/apply.py --check
python3 /home/t3/projects/config/agents/scripts/apply.py
```

`--check`/`--dry-run` returns 0 when current, 1 for differences, 2 for errors.
It reads the service through its normal MCP interface (which acquires its normal
store lock) but does not save skills or write provider configuration. It checks
canonical skill content; it does not attest the generated mirrors or native
provider discovery. Applying retries the service save to repair mirrors.

## Merge and conflict rules

- A marked shared block is inserted into each provider's user instruction file.
  Text outside the block stays intact, including machine guidance. No absolute
  Mac import path is installed. Image-owned sandbox rules remain authoritative.
- Only missing Context7/Tavily URL definitions are added. Matching definitions
  are retained; conflicting definitions fail rather than replacing credentials,
  headers, custom options or unrelated MCP servers. Codex TOML is extended without
  reserializing other settings. Claude state stays a regular, singly linked file.
- Selected Claude settings merge recursively; conflicting values fail.
- `obsidian-markdown` is saved through the deployed `t3-skills` stdio MCP API.
  Reference Markdown is included in the instruction text with local anchor links;
  one inline exclamation-mark example is reworded to avoid the service's dynamic
  command sentinel. Both providers receive `t3-user-obsidian-markdown`. No generic
  copy or symlink touches generated files or authoritative records.
- `.local/state/agents-apply.json` records the last installed revision. Independent
  skill edits cause a conflict on the next source update. Reconcile those edits
  into Git deliberately; do not delete the record to force an overwrite.
- Symlinks/hard links, malformed config and changed files fail closed. Existing
  credentials, account fields, unrelated registrations, and T3 settings remain.
  Writes are atomic per file, not transactional across files: after a partial
  failure, inspect the reported path and retry. No automatic rollback of account
  state is attempted. Use an approved private backup before initial maintenance.

## Authentication and acceptance

After applying, authenticate Context7 and Tavily independently for **both**
providers using their supported OAuth/browser login in the Hetzner environment.
Do not export API keys or paste authorization URLs/tokens into transcripts.
Do not reauthenticate the provider accounts merely because MCP login is needed.
Use a private terminal/browser flow; remote OAuth callback handling must be
verified against the installed CLI, not assumed to work from a Mac callback.

Restart only idle agent sessions, without restarting the Pod. In fresh Hetzner
Codex and Claude sessions verify:

1. The shared personal preferences are loaded alongside the server policies.
2. `$t3-user-obsidian-markdown` is discovered and invoked, including a reference
   example; existing `t3-skills` tools still work.
3. An actual Context7 documentation query and Tavily search succeed in each
   provider. Health checks or listed registrations alone do not prove tool use.
4. Re-running the check reports no differences. Record any provider-side config
   additions that need deliberate reconciliation rather than weakening checks.

The existing skill service passed live acceptance through
[server PR #23](https://github.com/ant-le/server/pull/23#issuecomment-6559707199).
That evidence does not verify this new configuration or these OAuth connections.

## Local verification and publication scope

Run `mise run agents:test` (or its Python body). To also exercise the image-owned
skill service against disposable homes, set `T3_SKILLS_SOURCE` to the local
`container-images/t3code/skills_mcp.py` when running the tests. No real credentials
are read by the tests. Run `mise run check` for the full repository checks;
the obsolete Makefile has been removed.

Review the complete diff and untracked file list before publication. Shared agent
source, the minimal OpenCode configuration, root mise tasks, and desktop
configuration belong in Git. Private Claude/Codex account files, `agents/t3/`,
root `mise/`, and k3d runtime state are ignored. Do not force-add ignored files.
The Mac-specific `claude/CLAUDE.md` stays excluded from the Hetzner sparse checkout.
