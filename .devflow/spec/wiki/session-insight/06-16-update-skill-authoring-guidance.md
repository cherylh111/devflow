<spec-entry
  id="insight-20260618-102908-06-16-update-skill-authoring-guidance"
  type="session-insight"
  category="session"
  keywords="session-insight,finish-work,06-16-update-skill-authoring-guidance,devflow,diff"
  source="finish-work"
  date="2026-06-18"
  task="06-16-update-skill-authoring-guidance"
  package="devflow"
  branch="main"
  commits="135f24a"
  derived_from=".devflow/tasks/archive/2026-06/06-16-update-skill-authoring-guidance"
>

### Update skill authoring guidance

#### Summary

Updated the built-in skill authoring spec with SKILL.md length guidance, utility script criteria, and trigger-specific description guidance. Validated with diff check, lint, typecheck, and tests.

#### Task

- Path: `.devflow/tasks/archive/2026-06/06-16-update-skill-authoring-guidance`
- Title: Update skill authoring guidance
- Why: Strengthen DevFlow's built-in skill authoring spec with practical guidance for SKILL.md length targets, deterministic utility scripts, and description routing quality.

#### Commits

- `135f24a`

#### Changed Files

- `.devflow/spec/devflow/backend/skill-authoring.md`
- `.devflow/tasks/06-16-update-skill-authoring-guidance/check.jsonl`
- `.devflow/tasks/06-16-update-skill-authoring-guidance/design.md`
- `.devflow/tasks/06-16-update-skill-authoring-guidance/implement.jsonl`
- `.devflow/tasks/06-16-update-skill-authoring-guidance/implement.md`
- `.devflow/tasks/06-16-update-skill-authoring-guidance/prd.md`
- `.devflow/tasks/06-16-update-skill-authoring-guidance/progress.json`
- `.devflow/tasks/06-16-update-skill-authoring-guidance/task.json`

#### Referenced Specs

- (No task spec references found.)

#### Review

- Reviewed by: (not recorded)

#### Key Decisions

- (No explicit markers found.)

#### Pitfalls

- explicit error handling or validation with concrete failure messages
- Avoid making the 100-line target sound like a hard failing rule. It is a guideline with documented exceptions.
- Avoid changing runtime template loading or bundled skill directory mechanics.

#### Invariants

- The description must name the concrete user intent or work state that should trigger the skill.
- to load a skill. It must name the concrete user intent or work state that should
- deterministic operations that should always produce the same output
- This task changes only the backend skill-authoring spec. It should not modify skill templates unless the spec update exposes a direct contradiction that must be corrected.
- The guidance must remain compatible with existing bundled skill structure under `packages/cli/src/templates/common/bundled-skills/<name>/`.
</spec-entry>
