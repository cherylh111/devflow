# Design: Fork Trellis into devflow

## Architecture Overview

The fork is a full copy of the Trellis monorepo source into the devflow working directory, followed by systematic renaming. The monorepo structure (pnpm workspace with `packages/cli` + `packages/core`) is preserved.

## Rename Mapping

| Layer | From | To |
|-------|------|----|
| npm scope | `@mindfoldhq/trellis` | `@enpd/devflow` |
| npm core | `@mindfoldhq/trellis-core` | `@enpd/devflow-core` |
| bin (full) | `trellis` | `devflow` |
| bin (short) | `tl` | `dvf` |
| runtime dir | `.trellis` | `.devflow` |
| author | `Mindfold LLC` | `ENPD` |
| product name | `Trellis` | `DevFlow` |
| product name (lower) | `trellis` | `devflow` |

## Key Rename Points

### Centralized (change once, propagates)

1. `packages/cli/src/constants/paths.ts` — `DIR_NAMES.WORKFLOW: ".trellis"` → `".devflow"`
2. `packages/cli/package.json` — name, bin, description, author, repository
3. `packages/core/package.json` — name, description, author, repository
4. Root `package.json` — script filter names

### Distributed (grep + replace)

1. String literal `".trellis"` in templates, configurators, Python scripts
2. String `"trellis"` in template content (commands, skills, agents, workflow.md)
3. `"Trellis"` in user-facing text (banner, help, README)
4. `"mindfoldhq"` / `"mindfold-ai"` / `"Mindfold"` in all files
5. `"trytrellis.app"` URLs — remove entirely
6. `cmdRefPrefix: "/trellis:"` and `"/trellis-"` → `"/devflow:"` and `"/devflow-"`

### Platform Removal

Delete configurators and template directories for: cursor, opencode, codex, kilo, kiro, gemini, antigravity, windsurf, copilot, droid, pi.

Remove their entries from:
- `types/ai-tools.ts` (AITool type, TemplateDir type, CliFlag type, AI_TOOLS registry)
- `configurators/index.ts` (imports, PLATFORM_FUNCTIONS entries)
- `commands/init.ts` (CLI flags)
- Template imports

### Python Scripts (`.devflow/scripts/`)

The runtime Python scripts reference `.trellis` in path constants. These live in `packages/cli/src/templates/trellis/` and get copied during `devflow init`. Rename:
- All `".trellis"` path references → `".devflow"`
- The template directory itself: `src/templates/trellis/` → `src/templates/devflow/`

### AGENTS.md Template

The generated `AGENTS.md` references "Trellis" and `.trellis/`. Update to "DevFlow" and `.devflow/`.

## Compatibility Notes

- No upstream sync planned — this is a permanent fork
- Channel feature preserved as-is (just rename branding in user-facing strings)
- Tests will need path constant updates but logic stays the same

## Risks

- Template files contain many hardcoded `.trellis` references in markdown content — need thorough grep verification
- Some test fixtures may reference old paths
- Python `__pycache__` files will be stale after rename — delete them
