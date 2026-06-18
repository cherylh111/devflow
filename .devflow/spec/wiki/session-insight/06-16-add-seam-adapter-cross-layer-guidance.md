<spec-entry
  id="insight-20260618-221811-06-16-add-seam-adapter-cross-layer-guidance"
  type="session-insight"
  category="session"
  keywords="session-insight,finish-work,06-16-add-seam-adapter-cross-layer-guidance,devflow,diff"
  source="finish-work"
  date="2026-06-18"
  task="06-16-add-seam-adapter-cross-layer-guidance"
  package="devflow"
  branch="main"
  commits="36f179e"
  derived_from=".devflow/tasks/archive/2026-06/06-16-add-seam-adapter-cross-layer-guidance"
>

### Add seam adapter cross-layer guidance

#### Summary

Extended the cross-layer thinking guide with seam and adapter decision guidance, DevFlow-specific examples, and anti-pattern language for shallow wrappers. Validated with diff check, lint, and typecheck.

#### Task

- Path: `.devflow/tasks/archive/2026-06/06-16-add-seam-adapter-cross-layer-guidance`
- Title: Add seam adapter cross-layer guidance
- Why: Extend the cross-layer thinking guide with seam and adapter guidance so agents can identify where boundaries should absorb external volatility, format differences, and dependency-specific behavior.

#### Commits

- `36f179e`

#### Changed Files

- `.devflow/spec/guides/cross-layer-thinking-guide.md`
- `.devflow/tasks/06-16-add-seam-adapter-cross-layer-guidance/progress.json`
- `.devflow/tasks/06-16-add-seam-adapter-cross-layer-guidance/task.json`

#### Referenced Specs

- (No task spec references found.)

#### Review

- Reviewed by: (not recorded)

#### Key Decisions

- Extended the cross-layer thinking guide with seam and adapter decision guidance, DevFlow-specific examples, and anti-pattern language for shallow wrappers. Validated with diff c...
- ## Seam And Adapter Decisions
- Decision checks:
- | Case | Decision |
- The section includes good/base/bad examples or equivalent decision checks.

#### Pitfalls

- Avoid an adapter when the code is stable internal logic and the wrapper only
- Avoid production code changes.

#### Invariants

- When you add a seam, document the stable contract on the DevFlow side and keep
- Changing provider contracts.
- No generated template parity is required for local spec guide updates.
</spec-entry>
