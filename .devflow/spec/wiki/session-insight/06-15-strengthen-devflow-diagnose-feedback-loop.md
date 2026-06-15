<spec-entry
  id="insight-20260615-135626-06-15-strengthen-devflow-diagnose-feedback-loop"
  type="session-insight"
  category="session"
  keywords="session-insight,finish-work,06-15-strengthen-devflow-diagnose-feedback-loop,devflow,diff"
  source="finish-work"
  date="2026-06-15"
  task="06-15-strengthen-devflow-diagnose-feedback-loop"
  package="devflow"
  branch="main"
  commits="b7a058d"
  derived_from=".devflow/tasks/archive/2026-06/06-15-strengthen-devflow-diagnose-feedback-loop"
>

### Strengthen devflow-diagnose feedback loop

#### Summary

Added loop optimization, non-deterministic bug handling, and hard stop guidance to devflow-diagnose skill (English/Chinese/local). Helps agents build better feedback loops before fixing bugs.

#### Task

- Path: `.devflow/tasks/archive/2026-06/06-15-strengthen-devflow-diagnose-feedback-loop`
- Title: Strengthen devflow diagnose feedback loop
- Why: Strengthen `devflow-diagnose` so bug-fix work starts from a fast, sharp, and repeatable feedback loop, with explicit guidance for loop optimization, flaky bugs, and cases where no useful loop can be created.

#### Commits

- `b7a058d`

#### Changed Files

- `.agents/skills/devflow-diagnose/SKILL.md`
- `packages/cli/src/templates/common/bundled-skills/devflow-diagnose/SKILL.md`
- `packages/cli/src/templates/zh/common/bundled-skills/devflow-diagnose/SKILL.md`

#### Referenced Specs

- (No task spec references found.)

#### Review

- Reviewed by: (not recorded)

#### Key Decisions

- (No explicit markers found.)

#### Pitfalls

- Added loop optimization, non-deterministic bug handling, and hard stop guidance to devflow-diagnose skill (English/Chinese/local). Helps agents build better feedback loops befor...
- Sharper**: Does the loop isolate one symptom, or does it conflate multiple failures?
- A slow or noisy loop wastes debugging time. Spend minutes improving the loop to save hours on fixes.
- ### Non-Deterministic Bugs
- For flaky, timing-dependent, or probabilistic failures:
- Do not attempt a fix until the loop reproduces the failure reliably enough to verify the fix.

#### Invariants

- (No explicit markers found.)
</spec-entry>
