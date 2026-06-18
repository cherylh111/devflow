<spec-entry
  id="insight-20260618-121501-06-16-add-module-depth-thinking-guide"
  type="session-insight"
  category="session"
  keywords="session-insight,finish-work,06-16-add-module-depth-thinking-guide,devflow,diff"
  source="finish-work"
  date="2026-06-18"
  task="06-16-add-module-depth-thinking-guide"
  package="devflow"
  branch="main"
  commits="9968ad0"
  derived_from=".devflow/tasks/archive/2026-06/06-16-add-module-depth-thinking-guide"
>

### Add module depth thinking guide

#### Summary

Added a module-depth thinking guide, registered it in the shared thinking guide index, and validated the documentation-only change with diff check, lint, typecheck, and tests.

#### Task

- Path: `.devflow/tasks/archive/2026-06/06-16-add-module-depth-thinking-guide`
- Title: Add module depth thinking guide
- Why: Add a DevFlow thinking guide that helps agents evaluate module depth, abstraction boundaries, and whether code organization reduces real complexity.

#### Commits

- `9968ad0`

#### Changed Files

- `.devflow/spec/guides/index.md`
- `.devflow/spec/guides/module-depth-thinking-guide.md`
- `.devflow/tasks/06-16-add-module-depth-thinking-guide/progress.json`
- `.devflow/tasks/06-16-add-module-depth-thinking-guide/task.json`

#### Referenced Specs

- (No task spec references found.)

#### Review

- Reviewed by: (not recorded)

#### Key Decisions

- The guide explicitly points to the existing code reuse guide for deletion-test decisions.
- The guide should remain short and decision-oriented:

#### Pitfalls

- too generic for the problem it solves
- Cover when to deepen a module, when to avoid abstraction, and how to evaluate interface size versus implementation complexity.

#### Invariants

- leaky abstractions where callers must know internal details anyway
- logic duplicated across callers because the module never grew enough depth
- Keep the guide as a checklist/thinking aid, not a code-spec with implementation contracts.
</spec-entry>
