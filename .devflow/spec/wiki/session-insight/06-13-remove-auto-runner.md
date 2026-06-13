<spec-entry
  id="insight-20260613-120648-06-13-remove-auto-runner"
  type="session-insight"
  category="session"
  keywords="session-insight,finish-work,06-13-remove-auto-runner,devflow,diff"
  source="finish-work"
  date="2026-06-13"
  task="06-13-remove-auto-runner"
  package="devflow"
  branch="main"
  commits="f1e5b16"
  derived_from=".devflow/tasks/archive/2026-06/06-13-remove-auto-runner"
>

### Remove Auto runner implementation

#### Summary

Removed the Auto runner command and skill from CLI templates, shared configurator metadata, generated local copies, template hash tracking, and README documentation. Verified the CLI with lint, typecheck, full test suite, and repository searches showing Auto runner references only in archived task records.

#### Task

- Path: `.devflow/tasks/archive/2026-06/06-13-remove-auto-runner`
- Title: Remove Auto runner implementation
- Why: Remove the Auto runner fast-path implementation from DevFlow so new and updated projects no longer receive an `auto-run` command or skill, and this repository no longer advertises or carries the generated Auto runner files.

#### Commits

- `f1e5b16`

#### Changed Files

- `.agents/skills/devflow-auto-run/SKILL.md`
- `.claude/commands/devflow/auto-run.md`
- `.codebuddy/commands/devflow/auto-run.md`
- `.devflow/.template-hashes.json`
- `README.md`
- `packages/cli/src/configurators/shared.ts`
- `packages/cli/src/templates/common/commands/auto-run.md`
- `packages/cli/src/templates/zh/common/commands/auto-run.md`

#### Referenced Specs

- (No task spec references found.)

#### Review

- Reviewed by: (not recorded)

#### Key Decisions

- description: "Run the approved ready-task queue through the normal DevFlow workflow without requiring manual phase commands between steps. Use only after the user approves the q...
- This command is an AI-driven runner, not a background daemon. You still perform the actual implementation, checks, knowledge review, commit, archive, and journal steps in the cu...
- requirements are already discussed; no open product decision is visible
- en: "Run the approved ready-task queue through the normal DevFlow workflow without requiring manual phase commands between steps. Use only after the user approves the queue and ...

#### Pitfalls

- description: "Run the approved ready-task queue through the normal DevFlow workflow without requiring manual phase commands between steps. Use only after the user approves the q...
- en: "Run the approved ready-task queue through the normal DevFlow workflow without requiring manual phase commands between steps. Use only after the user approves the queue and ...

#### Invariants

- Do not skip the dirty-file classification. Do not commit unrecognized user changes. Present the batched commit plan and get the required one-shot confirmation before running `gi...
</spec-entry>
