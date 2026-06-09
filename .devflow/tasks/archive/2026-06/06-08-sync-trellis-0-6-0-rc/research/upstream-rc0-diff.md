# Upstream Trellis 0.6.0-beta.22..0.6.0-rc.0 Diff Notes

## Source

- Local upstream checkout: `C:\Users\Admin\Desktop\AiWorker\Trellis`
- Compared tags: `v0.6.0-beta.22..v0.6.0-rc.0`
- Tag SHAs observed locally:
  - `v0.6.0-beta.22`: `714eab1b38d9e386b0e2179692494ef7481c29d9`
  - `v0.6.0-beta.23`: `9d63f90fb5beb2df39180c07cb260bca1db29da4`
  - `v0.6.0-rc.0`: `6869bc6fabea6b7ff4e05905d25741d2d7a2d2e9`
- `git fetch --tags origin` failed on 2026-06-08 because GitHub was unreachable from the machine. Use local tags unless network is later restored and tags are reconfirmed.

## Relevant Upstream Commits

- `7eabe64c fix(skills): correct spelling of bundled trellis-spec-bootstrap skill (#296)`
- `1d50a01b feat: add Reasonix (DeepSeek-Reasonix) platform support (#301)`
- `fix(cli): dispatch channel runtime agent definitions at init/update (#323)`
- `47882b13 feat(cli): refresh registry-backed spec templates (#324)`
- `3ac3cc14 feat(skills): bundle trellis-session-insight skill (auto-dispatched)`
- `f9ab7001 fix(agents): drop explicit mcp__exa__* tools from bundled agent defs (#302)`
- `4498dacf chore(release): add 0.6.0-beta.23 migration manifest`
- `b9916981 chore(release): add 0.6.0-rc.0 migration manifest`
- `6869bc6f 0.6.0-rc.0`

## Functional Deltas To Port

### Bundled Skill Rename

Upstream renames source templates from `trellis-spec-bootstarp` to `trellis-spec-bootstrap` and updates tests. DevFlow should rename to `devflow-spec-bootstrap`.

Migration manifest `0.6.0-beta.23.json` must preserve legacy installed typoed source paths as migration `from` values and write corrected `to` paths.

### Channel Runtime Agents

Upstream ships runtime files for channel workflows under `.trellis/agents/{check,implement}.md`. DevFlow should ship `.devflow/agents/{check,implement}.md` so channel-driven workflows can spawn `check` and `implement`.

### Registry-Backed Spec Templates

Upstream adds `packages/cli/src/utils/registry-config.ts` and updates init/update/template fetching so registry-backed spec templates can be persisted in config and refreshed through `update` with normal hash/conflict handling.

DevFlow translation points:

- Config comments and prose should reference `.devflow/spec`.
- Command examples should use `devflow`.
- Registry refresh must preserve existing update conflict semantics.

### Workflow Missing-Agent Warnings

Upstream adds `packages/cli/src/utils/agent-refs.ts` to discover workflow references to `.trellis/agents/<name>.md` or `channel spawn --agent <name>` and warn when files are missing. DevFlow should translate path matching to `.devflow/agents/<name>.md`.

### Reasonix Platform

Upstream adds Reasonix as a supported platform:

- `AITool`, `TemplateDir`, and `CliFlag` include `reasonix`.
- `AI_TOOLS.reasonix` uses config dir `.reasonix`.
- Platform templates live under `packages/cli/src/templates/reasonix/`.
- Tests cover template/configurator behavior.

### Session Insight Skill

Upstream bundles `trellis-session-insight` and auto-dispatches it. User approved including the DevFlow translation as `devflow-session-insight`.

DevFlow should avoid duplicating internal session-insight runtime behavior; the bundled skill should teach AI users how to use the existing memory/session insight capability.

### Agent MCP Tool Cleanup

Upstream removes explicit `mcp__exa__*` from bundled Claude-style implement/check agents because Claude Code can skip agent registration when explicit MCP tool names cannot resolve. Research agents keep external search capability through wildcard behavior where supported.

DevFlow should apply equivalent cleanup to:

- `packages/cli/src/templates/claude/agents/devflow-*.md`
- `packages/cli/src/templates/codebuddy/agents/devflow-*.md`
- `packages/cli/src/templates/cursor/agents/devflow-*.md`
- `packages/cli/src/templates/droid/droids/devflow-*.md`
- `packages/cli/src/templates/qoder/agents/devflow-*.md`
- matching localized templates if upstream changed them

OpenCode uses different permission syntax and should be checked separately rather than blindly edited.

### Release Manifests And Versions

Add:

- `packages/cli/src/migrations/manifests/0.6.0-beta.23.json`
- `packages/cli/src/migrations/manifests/0.6.0-rc.0.json`

Bump:

- `packages/cli/package.json`
- `packages/core/package.json`

Target version: `0.6.0-rc.0`.

## Upstream Deltas To Exclude

- Trellis `.trellis/tasks` active/archive task records.
- `docs-site` submodule pointer changes unless separately approved.
- Trellis README community QR/marketing asset changes unless DevFlow-specific docs review approves them.
- Trellis branding, package scopes, command names, and `.trellis/` paths.

## Initial DevFlow Gap Check

Observed before implementation:

- DevFlow has package version `0.6.0-beta.22`.
- DevFlow lacks `0.6.0-beta.23.json` and `0.6.0-rc.0.json`.
- DevFlow still has source/test references to `devflow-spec-bootstarp`.
- DevFlow lacks `packages/cli/src/configurators/reasonix.ts` and `packages/cli/src/templates/reasonix/`.
- DevFlow lacks `packages/cli/src/utils/agent-refs.ts`.
- DevFlow lacks `packages/cli/src/utils/registry-config.ts`.
- DevFlow has internal session-insight docs/runtime but lacks the bundled `devflow-session-insight` skill.
