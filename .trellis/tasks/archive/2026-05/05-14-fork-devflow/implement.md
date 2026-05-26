# Implementation Plan: Fork Trellis into devflow

## Phase 1: Copy Source

- [x] 1.1 Copy `packages/` directory from Trellis source to devflow
- [x] 1.2 Copy root config files: `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `pyrightconfig.json`, `.npmrc` (if exists)
- [x] 1.3 Copy `.husky/` directory
- [x] 1.4 Skip: `.git/`, `node_modules/`, `docs-site/`, `marketplace/`, `drafts/`, `assets/`, `README.md`, `LICENSE`, `COPYRIGHT`, `CONTRIBUTING*.md`

## Phase 2: Remove Unwanted Platforms

- [x] 2.1 Delete template directories: `packages/cli/src/templates/{cursor,opencode,codex,kilo,kiro,gemini,antigravity,windsurf,copilot,droid,pi}/`
- [x] 2.2 Delete configurator files: `packages/cli/src/configurators/{cursor,opencode,codex,kilo,kiro,gemini,antigravity,windsurf,copilot,droid,pi}.ts`
- [x] 2.3 Update `types/ai-tools.ts`: remove platform entries from AITool, TemplateDir, CliFlag types and AI_TOOLS registry
- [x] 2.4 Update `configurators/index.ts`: remove imports and PLATFORM_FUNCTIONS entries for deleted platforms
- [x] 2.5 Update `commands/init.ts`: remove CLI flags for deleted platforms
- [x] 2.6 Remove channel adapters for deleted platforms (if any exist in `commands/channel/adapters/`)

## Phase 3: Rename — Package Identity

- [x] 3.1 `packages/cli/package.json`: name → `@enpd/devflow`, bin → `devflow`/`dvf`, author → `ENPD`, remove repository/license
- [x] 3.2 `packages/core/package.json`: name → `@enpd/devflow-core`, author → `ENPD`, remove repository/license
- [x] 3.3 Root `package.json`: update filter names from `@mindfoldhq/trellis*` to `@enpd/devflow*`
- [x] 3.4 Update workspace dependency: `packages/cli/package.json` dep `@mindfoldhq/trellis-core` → `@enpd/devflow-core`

## Phase 4: Rename — Runtime Directory

- [x] 4.1 `packages/cli/src/constants/paths.ts`: `WORKFLOW: ".trellis"` → `".devflow"`
- [x] 4.2 Rename template source dir: `src/templates/trellis/` → `src/templates/devflow/`
- [x] 4.3 Update all imports referencing `templates/trellis/` → `templates/devflow/`
- [x] 4.4 Global replace in all `.ts` files: string literal `".trellis"` → `".devflow"` (careful: only path references)
- [x] 4.5 Global replace in template `.md`/`.py` files: `.trellis` → `.devflow`

## Phase 5: Rename — Branding Strings

- [x] 5.1 Replace `cmdRefPrefix` values: `"/trellis:"` → `"/devflow:"`, `"/trellis-"` → `"/devflow-"`
- [x] 5.2 Replace user-facing "Trellis" → "DevFlow" in banners, help text, descriptions
- [x] 5.3 Replace "trellis" → "devflow" in command/skill names, file paths (e.g., `.claude/commands/trellis/` → `.claude/commands/devflow/`)
- [x] 5.4 Replace `"mindfoldhq"` / `"mindfold-ai"` / `"Mindfold LLC"` → `"enpd"` / `"ENPD"`
- [x] 5.5 Remove all `trytrellis.app` URLs and Discord/GitHub badge links
- [x] 5.6 Update keywords in package.json files

## Phase 6: Rename — Python Scripts

- [x] 6.1 In `src/templates/devflow/scripts/`: replace all `.trellis` → `.devflow`
- [x] 6.2 Replace "trellis" references in Python docstrings/comments
- [x] 6.3 Delete any `__pycache__/` directories in templates

## Phase 7: Cleanup & Verify

- [x] 7.1 Delete `LICENSE`, `COPYRIGHT` files if copied
- [x] 7.2 Create minimal `README.md` for the project
- [x] 7.3 Run `grep -r "trellis\|mindfoldhq\|mindfold\|trytrellis" packages/` to verify no residual references
- [x] 7.4 Run `pnpm install` to verify dependency resolution
- [x] 7.5 Run `pnpm build` to verify TypeScript compilation
- [x] 7.6 Run `pnpm test` to check test status (some may need path updates)

## Validation Commands

```bash
# After all renames:
grep -ri "trellis" packages/ --include="*.ts" --include="*.md" --include="*.py" --include="*.json" | grep -v node_modules | grep -v ".trellis"
grep -ri "mindfoldhq\|mindfold-ai\|Mindfold LLC" packages/
pnpm install
pnpm build
pnpm test
```

## Rollback

Since this is a fresh copy into an empty directory, rollback = delete `packages/` and root config files, then re-copy from source.
