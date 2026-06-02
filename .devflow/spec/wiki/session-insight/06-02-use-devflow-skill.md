<spec-entry
  id="insight-20260602-223010-06-02-use-devflow-skill"
  type="session-insight"
  category="session"
  keywords="session-insight,finish-work,06-02-use-devflow-skill,devflow,diff"
  source="finish-work"
  date="2026-06-02"
  task="06-02-use-devflow-skill"
  package="devflow"
  branch="main"
  commits="79d8174,d20c464"
  derived_from=".devflow/tasks/archive/2026-06/06-02-use-devflow-skill"
>

### Add devflow-use bundled skill

#### Summary

Added the built-in devflow-use skill in English and Chinese templates, updated init/configurator tests for installation and hash tracking, and documented the bundled skill naming convention.

#### Task

- Path: `.devflow/tasks/archive/2026-06/06-02-use-devflow-skill`
- Title: Use DevFlow built-in skill
- Why: Ship a built-in `devflow-use` skill that teaches developers and AI coding agents how to use DevFlow effectively during software development. The skill should be installed from DevFlow's bundled templates so new or updated projects can us...

#### Commits

- `79d8174`
- `d20c464`

#### Changed Files

- `.devflow/spec/devflow/backend/configurator-shared.md`
- `.devflow/tasks/06-02-use-devflow-skill/check.jsonl`
- `.devflow/tasks/06-02-use-devflow-skill/design.md`
- `.devflow/tasks/06-02-use-devflow-skill/implement.jsonl`
- `.devflow/tasks/06-02-use-devflow-skill/implement.md`
- `.devflow/tasks/06-02-use-devflow-skill/prd.md`
- `.devflow/tasks/06-02-use-devflow-skill/task.json`
- `packages/cli/src/templates/common/bundled-skills/devflow-use/SKILL.md`
- `packages/cli/src/templates/zh/common/bundled-skills/devflow-use/SKILL.md`
- `packages/cli/test/commands/init.integration.test.ts`
- `packages/cli/test/configurators/platforms.test.ts`

#### Referenced Specs

- (No task spec references found.)

#### Review

- Reviewed by: (not recorded)

#### Key Decisions

- Inspect the repository before asking questions. Ask only for product intent, risk tolerance, or scope decisions the codebase cannot answer.
- Ask one high-value question at a time, with a recommended answer and trade-off.
- Put task-specific decisions in the task artifacts.
- The user wants a DevFlow usage skill, clarified that it belongs to the built-in template skill set, and chose the final name `devflow-use` to keep built-in skill naming consistent.

#### Pitfalls

- Fix failures before moving to finish work.
- The English template is the canonical source. The Chinese overlay should keep the same broad section structure and frontmatter fields so localized init output has equivalent beh...

#### Invariants

- `.devflow/spec/` stores coding conventions that must be read before edits.
- Use `devflow-before-dev` when available. In inline modes, the main agent edits directly. In agent-dispatch modes, implementation and check agents must receive the active task pa...
- `configurators/shared.ts:resolveBundledSkills` — resolves multi-file built-in skills (currently `devflow-meta`) into `ResolvedSkillFile[]`. Each entry has a POSIX-relative path ...
- `configurators/shared.ts:resolveBundledSkills` — resolves multi-file built-in skills discovered under `templates/common/bundled-skills/<skill-name>/` into `ResolvedSkillFile[]`....
- Bundled skills already own frontmatter.** `wrapWithSkillFrontmatter` must not be applied to `resolveBundledSkills` output. `writeSkills` and `collectSkillTemplates` accept bundl...
- No new TypeScript registration should be required because `getBundledSkillTemplates()` discovers directories below `common/bundled-skills/` recursively. The existing configurato...
</spec-entry>
