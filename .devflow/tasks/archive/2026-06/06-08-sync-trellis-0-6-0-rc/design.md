# Design: Sync Upstream Trellis 0.6.0-rc.0

## Scope

Port Trellis changes from `v0.6.0-beta.22` through `v0.6.0-rc.0` into DevFlow. This is a translation sync, not a direct copy: names, paths, packages, generated artifacts, and prose must stay DevFlow-specific.

## Mapping Rules

| Trellis upstream | DevFlow target |
| --- | --- |
| `trellis` command | `devflow` command |
| `tl` bin | `dvf` bin |
| `.trellis/` | `.devflow/` |
| `@mindfoldhq/trellis` | `@enpd/devflow` |
| `@mindfoldhq/trellis-core` | `@enpd/devflow-core` |
| `Trellis` prose | `DevFlow` prose |
| `trellis-spec-bootstrap` | `devflow-spec-bootstrap` |
| `trellis-session-insight` | `devflow-session-insight` |
| `.trellis/agents/<name>.md` | `.devflow/agents/<name>.md` |

## Architecture And Boundaries

### Platform Registry

Reasonix should follow the existing platform-registry model in `packages/cli/src/types/ai-tools.ts` and `packages/cli/src/configurators/index.ts`.

Expected DevFlow additions:

- `reasonix` in `AITool`, `TemplateDir`, and `CliFlag`.
- `AI_TOOLS.reasonix` with config directory `.reasonix`.
- Reasonix templates under `packages/cli/src/templates/reasonix/`.
- Platform collection/configuration entry in `PLATFORM_FUNCTIONS`.
- Tests covering registry presence, generated paths, and template output.

### Channel Runtime Agents

Upstream now ships `.trellis/agents/{check,implement}.md` during init/update. DevFlow should ship `.devflow/agents/{check,implement}.md` from translated templates so channel-driven workflows can spawn runtime agents without "Agent not found" failures.

The update path must preserve normal manifest hash tracking and conflict handling.

### Registry-Backed Spec Templates

Upstream adds `registry-config.ts` and update/init support for refreshing spec templates from a persisted registry source/template config. DevFlow should translate YAML comments and paths to `.devflow/spec`.

Design constraints:

- Use structured helpers from upstream where possible.
- Preserve existing `devflow update` conflict behavior.
- Keep local user edits protected by manifest hashing.
- Tests should cover read/write config behavior and update refresh behavior.

### Workflow Missing-Agent Warning

Upstream adds `agent-refs.ts` to inspect workflow bodies for referenced channel agents and warn when the corresponding runtime files are missing. DevFlow should translate patterns from `.trellis/agents/` to `.devflow/agents/`.

This is a warning only; it should not block workflow selection.

### Bundled Skill Rename

Source templates should rename:

- `packages/cli/src/templates/common/bundled-skills/devflow-spec-bootstarp/`
- `packages/cli/src/templates/zh/common/bundled-skills/devflow-spec-bootstarp/`

to:

- `devflow-spec-bootstrap/`

Migration manifests should rename installed legacy directories across all relevant platform skill roots. Historical manifests that describe already-shipped typoed versions should remain historically accurate unless upstream changed them.

### Session Insight Bundled Skill

Translate upstream `trellis-session-insight` to `devflow-session-insight` and install it through the same bundled skill dispatch path as other common skills. The skill should complement, not replace, DevFlow's existing internal session-insight runtime and docs.

### Agent Tool Cleanup

Apply upstream bug fix that removes explicit `mcp__exa__*` tools from bundled Claude-style implement/check agent definitions. Research agents should keep external search access using the upstream-supported wildcard approach where the platform supports it. OpenCode permission files should remain in their platform-specific syntax.

### Release Manifests And Versions

Add DevFlow-translated manifests:

- `0.6.0-beta.23.json`
- `0.6.0-rc.0.json`

Then bump both packages to `0.6.0-rc.0`.

## Compatibility And Migration

- Users with installed typoed `devflow-spec-bootstarp` skill directories should be migrated to `devflow-spec-bootstrap` with `rename-dir` operations.
- Users without a platform-specific skill root should not fail migration.
- Users without Exa MCP should still get implement/check agent registration after update.
- Users with registry-backed specs should get refresh behavior through `devflow update`; users without registry config should see no behavior change.

## Risks

- The upstream diff includes main-branch and docs-site changes that are not all relevant to DevFlow; copying wholesale would import Trellis task history and branding.
- The bundled skill rename touches source templates, generated outputs, tests, and migrations; partial updates can leave install/update inconsistent.
- Registry-backed spec refresh touches update conflict behavior, which has high user-data risk.
- Reasonix adds a platform across registry, templates, tests, and CLI flags; missing one entry can make init/update inconsistent.
- Agent tool cleanup is platform-sensitive; removing the wrong tools from research agents could reduce intended capability.
