# Implementation Design

## Scope

This task implements the first adoption wave from `research/adoption-matrix.md`:

- add a DevFlow-native diagnosis skill
- improve planning decomposition guidance
- codify skill authoring rules

It deliberately does not implement every idea from the decision report.

## External Evidence

The external checkout at `C:\Users\Admin\Desktop\AiWorker\skills` provides source material:

- `skills/engineering/diagnose/SKILL.md`
- `skills/engineering/to-issues/SKILL.md`
- `skills/engineering/zoom-out/SKILL.md`
- `skills/engineering/prototype/SKILL.md`
- `skills/engineering/tdd/SKILL.md`

Only `diagnose` and `to-issues` are used directly in this implementation wave.

## DevFlow Mapping

### Diagnosis Skill

Implement as a common bundled skill:

- English template: `packages/cli/src/templates/common/bundled-skills/devflow-diagnose/SKILL.md`
- Chinese overlay: `packages/cli/src/templates/zh/common/bundled-skills/devflow-diagnose/SKILL.md`
- Dogfood shared skill: `.agents/skills/devflow-diagnose/SKILL.md`

No TypeScript registration should be needed. Bundled skills are discovered recursively by `getBundledSkillTemplates()` and installed by existing configurators.

The skill should:

- trigger on bug reports, broken/failing behavior, debugging requests, or performance regressions
- require a deterministic feedback loop where possible
- align with DevFlow task artifacts and specs
- tell agents to update `research/`, tests, and specs when findings are durable
- hand off to `devflow-break-loop` only after repeated failed fixes or after the fix needs retrospective capture

### Brainstorm Vertical Slicing

Update `packages/cli/src/templates/common/skills/brainstorm.md` and the local `.agents/skills/devflow-brainstorm/SKILL.md`.

The guidance should adapt the external `to-issues` idea to DevFlow:

- use parent tasks for source requirements and integration review
- use child tasks for independently verifiable vertical slices
- write dependencies in child artifacts, not implied by tree position
- prefer thin, demoable, end-to-end slices over layer-only slices

Chinese template parity should be updated in `packages/cli/src/templates/zh/common/skills/brainstorm.md`.

### Skill Authoring Spec

Add `.devflow/spec/devflow/backend/skill-authoring.md` and link it from `.devflow/spec/devflow/backend/index.md`.

This is dogfood project spec, not a generic placeholder template. It should describe executable contracts for built-in skill changes.

## Tests

Existing bundled-skill resolver and platform tests should be updated to expect `devflow-diagnose`.

Focused tests:

- `pnpm --filter @enpd/devflow test test/configurators/platforms.test.ts`
- `pnpm --filter @enpd/devflow test test/configurators/index.test.ts`

Broader checks:

- `pnpm lint`
- `pnpm typecheck`

## Risks

- Adding a new bundled skill without updating test constants could break configurator expectations.
- Updating only English templates would leave Chinese template output semantically stale.
- Duplicating workflow phase rules inside `devflow-diagnose` would create drift with `.devflow/workflow.md`.
- Touching generated local `.agents/skills/` without updating source templates would create dogfood/template divergence.
