# Decision Report: Skill Design Lessons For DevFlow

## Executive Decision

DevFlow should not copy Matt Pocock's skills framework wholesale.

DevFlow should absorb its strongest design philosophy: small, sharply triggered cognitive skills that help the model perform one class of reasoning well. Those skills should plug into DevFlow's existing lifecycle rather than replace it.

The recommended target architecture is:

- Keep `.devflow/workflow.md` as the source of truth for lifecycle and state transitions.
- Keep `.devflow/tasks/` as the durable work container.
- Keep `.devflow/spec/` as the durable convention and contract store.
- Add a small number of cognitive skills that improve planning, diagnosis, prototyping, and design review.
- Standardize skill anatomy: concise `SKILL.md`, precise frontmatter description, longer references only when needed.

## Decision Matrix

| Idea | Decision | Priority | Why | DevFlow mapping |
| --- | --- | --- | --- | --- |
| Short `SKILL.md` as router, longer `references/` for detail | Adopt directly | P0 | DevFlow already uses this in `devflow-meta`; formalizing it lowers skill maintenance cost. | Add/strengthen a bundled-skill authoring spec; review `.agents/skills/*`. |
| Precise frontmatter trigger descriptions | Adopt directly | P0 | Mis-triggered skills create bad routing. Specific descriptions are low-risk and high leverage. | Skill template/spec update; possible lint/check convention. |
| Small cognitive skills | Adapt | P0 | Valuable, but must not bypass Phase 1/2/3 gates. | Add focused skills such as `devflow-diagnose`, `devflow-zoom-out`, `devflow-prototype`, or integrate them into existing phase skills. |
| Diagnose loop before repeated fixing | Adapt | P0 | DevFlow has `break-loop` after repeated debugging; a pre-fix diagnosis skill would prevent more loops earlier. | New `devflow-diagnose` skill or a front section in `devflow-break-loop`. |
| PRD-to-issues / vertical slicing | Adapt | P0 | DevFlow already supports parent/child tasks; external slicing patterns can make task decomposition sharper. | Improve `devflow-brainstorm` and parent/child task guidance. |
| TDD loop | Adapt | P1 | Useful for behavior changes, but not every DevFlow task is code or test-first friendly. | Optional skill or `before-dev`/unit-test spec trigger for testable behavior work. |
| Prototype-first workflow | Adapt | P1 | Useful for feasibility risk, but must keep prototype code from becoming production by accident. | New planning-mode skill with explicit throwaway/commit boundary. |
| Zoom-out architecture review | Adapt | P1 | Helps avoid local optimization and design drift. | New skill or expansion of thinking guides into triggerable checks. |
| Grill-with-docs / challenge assumptions | Adapt | P1 | Good for API/docs-heavy work; should persist conclusions in research files. | Research/planning helper skill that writes findings into task `research/`. |
| Repository vocabulary/context artifact | Adapt | P1 | Useful, but DevFlow already has spec/wiki/session insight. Avoid another context file competing with specs. | Add a `.devflow/spec/wiki` or guide convention for vocabulary and domain context. |
| External issue tracker setup / labels | Defer | P2 | Helpful only if DevFlow product scope expands into GitHub/Linear issue synchronization. | Optional integration task, not core framework change. |
| Replace DevFlow lifecycle with ad hoc skill chains | Reject | P0 reject | Would weaken durable state, start gates, and spec injection. | No action. |
| Store durable conventions primarily in skills | Reject | P0 reject | Skills are entry points; long-term implementation rules belong in specs. | Keep conventions in `.devflow/spec/`; skills may point to specs. |

## Recommended Roadmap

### Short Term

1. Standardize skill authoring rules.
   - `SKILL.md` must stay short.
   - Description must say when to use the skill.
   - Long explanations belong in `references/`.
   - A skill should not duplicate `.devflow/workflow.md` lifecycle truth.

2. Add a diagnosis pattern before bug fixing.
   - Either create `devflow-diagnose` or split the pre-fix part out of `devflow-break-loop`.
   - The skill should emphasize reproduction, isolation, hypothesis, focused fix, and verification.

3. Improve `devflow-brainstorm` with explicit vertical-slice decomposition.
   - Map "to issues" into DevFlow parent/child tasks.
   - Require each child to have independent acceptance criteria.

### Medium Term

4. Add `devflow-prototype` for feasibility work.
   - It must run in planning/research mode.
   - It must require a decision about whether prototype code is discarded, rewritten, or promoted.

5. Add `devflow-zoom-out` or turn the existing thinking guides into better triggerable skills.
   - Use when changes affect architecture, task boundaries, or multiple layers.
   - Findings should update `design.md`, `research/`, or specs.

6. Add a project vocabulary/context convention.
   - Prefer `.devflow/spec/wiki/` or a dedicated spec guide.
   - Do not create a parallel unmanaged `CONTEXT.md` unless a project explicitly wants one.

### Deferred

7. External issue tracker label setup.
   - Defer until there is a concrete product requirement for GitHub/Linear/Jira integration.

8. TDD skill as a first-class bundled skill.
   - Useful, but lower priority than diagnosis and planning because DevFlow already has test specs and check gates.

## Key Trade-Offs

### Granularity vs Routing Noise

Small skills improve precision, but too many overlapping skills make routing worse. DevFlow should add a few high-confidence cognitive skills first, then measure whether they improve outcomes.

### Lifecycle Control vs Flexibility

Matt Pocock-style skills are flexible. DevFlow's value is lifecycle control. Borrowing must happen inside DevFlow's phase model.

### Specs vs Skills

Skills should trigger actions. Specs should store conventions. If a borrowed idea becomes a lasting engineering rule, it belongs in `.devflow/spec/`, not only in a skill.

### Research vs Implementation

This decision report recommends follow-up implementation tasks, but this task should remain research-only unless the user explicitly approves implementation.

## What DevFlow Should Not Do

- Do not replace `.devflow/tasks/` with external issue decomposition.
- Do not add a broad set of external skills at once.
- Do not duplicate workflow-state rules inside every skill.
- Do not make `progress.json` or skill-local state compete with `task.json.status`.
- Do not let prototype code silently become production implementation.

## Final Recommendation

Adopt the skill design philosophy, not the full framework.

DevFlow's strongest architecture is its durable workflow, task, spec, and platform integration model. Matt Pocock's strongest contribution is the shape of small, focused skills that make models reason better at specific moments. The correct synthesis is a hybrid:

- DevFlow owns lifecycle and persistence.
- Small skills own focused cognitive moves.
- Specs own durable engineering contracts.
- Research artifacts own external findings and decisions.

The highest-confidence next implementation work is:

1. Standardize bundled skill authoring rules.
2. Add or refactor a pre-fix diagnosis skill.
3. Improve planning decomposition around vertical slices and parent/child tasks.
