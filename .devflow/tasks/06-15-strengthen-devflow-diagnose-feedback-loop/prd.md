# Strengthen DevFlow Diagnose Feedback Loop

## Goal

Strengthen `devflow-diagnose` so bug-fix work starts from a fast, sharp, and repeatable feedback loop, with explicit guidance for loop optimization, flaky bugs, and cases where no useful loop can be created.

## Background

The archived `06-13-research-skills-improvements` report marked feedback loop strengthening as P0. Current repository inspection confirms the existing diagnose skill already requires a feedback loop, but the guidance is brief:

- `packages/cli/src/templates/common/bundled-skills/devflow-diagnose/SKILL.md` has `## Build A Feedback Loop`.
- It lists several loop types, including stress loops for flaky or timing-dependent failures.
- It says to refine the loop until it is fast, sharp, and repeatable.
- It does not yet include a dedicated loop-optimization section, detailed non-deterministic bug strategy, or a hard stop phrased as "do not proceed to hypothesize" when no useful loop exists.
- The same content is mirrored in `packages/cli/src/templates/zh/common/bundled-skills/devflow-diagnose/SKILL.md` and `.agents/skills/devflow-diagnose/SKILL.md`.

## Requirements

- Update the English bundled `devflow-diagnose` skill with:
  - a short "iterate on the loop itself" section;
  - faster / sharper / more deterministic loop checks;
  - non-deterministic bug guidance focused on raising reproduction rate;
  - a stronger stop condition when no useful loop exists;
  - optional additional loop strategies such as property/fuzz loops, bisection harnesses, and HITL scripts where concise.
- Update the Chinese bundled skill with equivalent behavior, not a loose summary.
- Update the local dogfood `.agents/skills/devflow-diagnose/SKILL.md` to match the English source.
- Preserve `devflow-diagnose` as a pre-fix diagnosis skill; do not merge it into `devflow-break-loop`.
- Keep the skill concise enough to remain practical as a loaded skill.

## Acceptance Criteria

- [ ] English bundled `devflow-diagnose` includes loop optimization guidance.
- [ ] English bundled `devflow-diagnose` includes non-deterministic/flaky bug guidance beyond a single stress-loop bullet.
- [ ] English bundled `devflow-diagnose` clearly stops speculation when no useful loop exists and directs the agent to record attempts and ask for an artifact, access, or instrumentation permission.
- [ ] Chinese bundled `devflow-diagnose` is updated with equivalent guidance.
- [ ] Local dogfood `devflow-diagnose` is updated in sync with the English source.
- [ ] Validation includes targeted repository searches and relevant template/configurator tests if available.

## Out Of Scope

- Creating a new debugging skill.
- Changing task lifecycle state transitions.
- Adding long debugging theory references that make the skill hard to load.
