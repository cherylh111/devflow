# Built-In Skill Authoring

## Scope

Use this spec when adding or modifying DevFlow built-in skills, common workflow skills, or bundled multi-file skills under `packages/cli/src/templates/common/`.

This applies to:

- single-file workflow skills in `packages/cli/src/templates/common/skills/*.md`
- bundled skills in `packages/cli/src/templates/common/bundled-skills/<skill-name>/`
- localized overlays under `packages/cli/src/templates/zh/common/`
- dogfood shared skills under `.agents/skills/`

## Skill Types

| Type | Source | Use For |
| --- | --- | --- |
| Common workflow skill | `packages/cli/src/templates/common/skills/*.md` | Phase-linked workflow behavior such as brainstorm, before-dev, check, break-loop, update-spec. |
| Bundled skill | `packages/cli/src/templates/common/bundled-skills/<skill-name>/` | Built-in skills that need `SKILL.md` plus references, examples, or assets. |
| Platform-specific skill | `packages/cli/src/templates/<platform>/skills/` | Platform-only capabilities or syntax that cannot be shared. |
| Dogfood skill | `.agents/skills/` or platform local skill dirs | The repository's currently installed local AI-facing copy. |

## Contracts

### 1. `SKILL.md` Is A Router

`SKILL.md` must stay focused on:

- when to use the skill
- what file or reference to read first
- what action sequence to follow
- what not to do

Long explanations, examples, and background belong in `references/` for bundled skills.

### 1.1 SKILL.md Length Target

Keep `SKILL.md` under 100 lines when possible. Shorter files are easier to route,
scan, and maintain.

If the file grows past that target, move detail into `references/` instead of
expanding the main file:

- longer explanations -> `references/<topic>.md`
- examples -> `references/examples.md`
- background or edge cases -> separate reference files

Exception: a workflow checklist may exceed the target when every step is essential
to safe use of the skill.

### 2. Frontmatter Description Must Be Trigger-Specific

The description is the main routing signal the agent sees when deciding whether
to load a skill. It must name the concrete user intent or work state that should
trigger the skill.

Good descriptions make the skill discoverable for the right task and invisible
for unrelated work.

Good:

```yaml
description: "Run a disciplined pre-fix diagnosis loop for bugs, failing tests, broken behavior, errors, crashes, flaky behavior, or performance regressions in a DevFlow-managed project."
```

Bad:

```yaml
description: "Helpful engineering skill."
```

Vague descriptions create accidental triggers. Overly narrow descriptions make the skill effectively unreachable.

### 2.1 Use Utility Scripts For Deterministic Work

Add scripts to a bundled skill when the work is better expressed as executable
logic than repeated natural language:

- deterministic operations that should always produce the same output
- repeated generation that would otherwise be rewritten in the prompt every time
- explicit error handling or validation with concrete failure messages

Use scripts for helpers such as parsing, validation, formatting, or file
collection when they are stable and reusable.

Do not add scripts when the task is primarily project-specific judgment,
single-use orchestration, or a one-off example better kept in `SKILL.md`.

Scripts should live under `<skill-name>/scripts/` and be referenced from
`SKILL.md`.

### 3. Do Not Duplicate Workflow Truth

`.devflow/workflow.md` owns phase routing, lifecycle gates, and workflow-state breadcrumb text. Skills may point to workflow files or task artifacts, but they must not maintain a second copy of the full workflow.

When a skill changes phase semantics, update `.devflow/workflow.md` and the workflow-state contract as needed.

### 4. Durable Conventions Belong In Specs

Skills trigger actions. Specs store durable engineering contracts.

Put reusable conventions, validation matrices, command contracts, and prevention rules in `.devflow/spec/`. A skill may instruct the agent to read or update those specs, but the skill itself should not become the only long-term source of an implementation rule.

### 5. Keep Shared Skill Content Platform-Neutral

Shared `.agents/skills/` content must avoid platform-only command syntax. Use common DevFlow script commands or neutral command references.

Platform-specific command syntax belongs in platform-specific templates.

### 6. Maintain Localization Parity

When adding a bundled skill or changing shared workflow skill behavior, update the Chinese overlay if the corresponding template exists under `packages/cli/src/templates/zh/common/`.

The localized file should preserve the same frontmatter fields and broad section structure.

## Built-In Bundled Skill Checklist

When adding a bundled skill:

- [ ] Add `packages/cli/src/templates/common/bundled-skills/<skill-name>/SKILL.md`.
- [ ] Add `packages/cli/src/templates/zh/common/bundled-skills/<skill-name>/SKILL.md` when localized templates are maintained.
- [ ] Add or update dogfood `.agents/skills/<skill-name>/SKILL.md` when this repository should use the skill immediately.
- [ ] Ensure `SKILL.md` owns valid YAML frontmatter.
- [ ] Do not manually register the skill in one configurator unless directory discovery cannot handle it.
- [ ] Update tests that enumerate expected bundled skill names.
- [ ] Run focused configurator tests that verify write/collect parity.

## Validation

Focused checks for built-in skill changes:

```bash
pnpm --filter @enpd/devflow test test/configurators/platforms.test.ts
pnpm --filter @enpd/devflow test test/configurators/index.test.ts
```

Run broader checks when the change touches shared template loading logic:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

## Wrong vs Correct

### Wrong: Full Lifecycle Copied Into A Skill

```markdown
# My Skill

Phase 1 is ...
Phase 2 is ...
Phase 3 is ...
Use these status transitions instead of workflow.md ...
```

This creates a second workflow authority that will drift.

### Correct: Skill Points To Workflow And Owns One Action

```markdown
# DevFlow Diagnose

Use this before fixing a bug. Resolve the current task, read task artifacts,
build a feedback loop, reproduce, hypothesize, instrument, fix, verify, then
record durable lessons in specs when needed.
```

The skill owns the diagnostic action. `.devflow/workflow.md` still owns the lifecycle.
