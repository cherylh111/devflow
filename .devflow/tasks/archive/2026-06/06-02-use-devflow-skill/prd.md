# Use DevFlow built-in skill

## Goal

Ship a built-in `devflow-use` skill that teaches developers and AI coding agents how to use DevFlow effectively during software development. The skill should be installed from DevFlow's bundled templates so new or updated projects can use it as a best-practice guide.

## Confirmed Facts

- The user wants a DevFlow usage skill, clarified that it belongs to the built-in template skill set, and chose the final name `devflow-use` to keep built-in skill naming consistent.
- Built-in multi-file skills live under `packages/cli/src/templates/common/bundled-skills/<skill-name>/`.
- `packages/cli/src/templates/common/index.ts` recursively discovers bundled skills, so adding a new bundled skill directory is the primary wiring step.
- Bundled skills own their own `SKILL.md` frontmatter and are installed through `resolveBundledSkills()`.
- English templates have matching Chinese overlays under `packages/cli/src/templates/zh/common/bundled-skills/` when localized output is expected.
- Init/update hash tracking is driven by `writeSkills()` and `collectSkillTemplates()` receiving the same bundled skill file list.

## Requirements

- Add an English built-in skill at `common/bundled-skills/devflow-use/SKILL.md`.
- Add a Chinese localized overlay for the same skill path.
- The skill must explain DevFlow best practices for normal development work:
  - session start/context loading
  - task creation and planning
  - implementation after task activation
  - spec/context loading before code changes
  - quality checks before commits
  - spec updates and finish-work/archive/journal flow
  - when not to use DevFlow or when to use a lightweight flow
- The skill must be concise enough for practical skill loading, with no extra README or nonessential artifacts.
- The skill must install as `.agents/skills/devflow-use/SKILL.md` for platforms that install bundled skills.
- Template hash tracking must include `.agents/skills/devflow-use/SKILL.md` on init.
- Tests must cover bundled skill collection and init-time installation/tracking.

## Acceptance Criteria

- [x] `packages/cli/src/templates/common/bundled-skills/devflow-use/SKILL.md` exists with valid skill frontmatter.
- [x] `packages/cli/src/templates/zh/common/bundled-skills/devflow-use/SKILL.md` exists and mirrors the English template structure.
- [x] `resolveBundledSkills()` includes `devflow-use/SKILL.md`.
- [x] `devflow init --codex -y` installs `.agents/skills/devflow-use/SKILL.md`.
- [x] The init template hash file tracks `.agents/skills/devflow-use/SKILL.md`.
- [x] Relevant focused tests pass.

## Out of Scope

- No new CLI flag or marketplace registry behavior.
- No personal `$CODEX_HOME/skills` installation.
- No migration manifest or release changelog in this task.

## Open Questions

- None blocking. The final bundled skill name is `devflow-use`.
