# Add devflow-prototype Bundled Skill Design

## Boundaries

This child task owns the bundled skill and the minimal workflow guidance needed to make agents discover it. It should not change DevFlow task state, phase ordering, or implementation/check delegation.

## Template Surfaces

Primary source:

- `packages/cli/src/templates/common/bundled-skills/devflow-prototype/`

Localized template:

- `packages/cli/src/templates/zh/common/bundled-skills/devflow-prototype/`

Local dogfood copy:

- `.agents/skills/devflow-prototype/`

Related guidance:

- `packages/cli/src/templates/common/skills/brainstorm.md`
- `packages/cli/src/templates/zh/common/skills/brainstorm.md`
- `.agents/skills/devflow-brainstorm/SKILL.md`

## Skill Shape

`SKILL.md` should be a router:

- state that the skill is for planning/research prototypes only;
- resolve the active task and write findings into that task's `research/` directory;
- choose between logic and UI branches;
- enforce throwaway naming, one-command execution, no persistence by default, and full state visibility;
- require a final delete/keep/rewrite decision.

Longer guidance belongs in references:

- `LOGIC.md`: terminal or small harness patterns for state machines, algorithms, parser flows, and boundary cases.
- `UI.md`: single-route multi-variant UI exploration, search-param switching, and visual comparison patterns.
- `prototype-findings-template.md`: durable findings format.

## Data Flow

1. Agent identifies a high-risk planning question that repository inspection cannot answer.
2. Agent invokes `devflow-prototype`.
3. Prototype code is created outside production paths or clearly marked as throwaway near the code under exploration.
4. Agent runs one project-native command to exercise the prototype.
5. Agent writes findings to `research/prototype-<slug>-findings.md` in the active task.
6. Agent either deletes the prototype or marks temporary retention with `PROTOTYPE-DELETE-ME.md`.
7. Any production implementation happens later in Phase 2 as a rewrite with normal tests and quality requirements.

## Compatibility

Existing bundled-skill discovery should pick up the new directory recursively. The implementation should not add manual per-platform registrations unless tests prove discovery is insufficient.

Chinese template parity should preserve the same frontmatter fields and section structure while using localized prose.

## Trade-Offs

Keeping `devflow-check` marker detection out of this child keeps the implementation focused on skill availability and planning guidance. The trade-off is that retained prototype cleanup relies on skill instructions until a later hardening task adds automated checks.

## Rollback

Rollback is straightforward: remove the new `devflow-prototype` template directories, remove brainstorm references to the skill, remove test expectations for the new bundled skill, and remove the local dogfood copy.
