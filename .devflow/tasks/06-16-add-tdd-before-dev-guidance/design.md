# Add TDD Guidance To Before-Dev Design

## Boundaries

This child updates planning/pre-development guidance only. It should not alter test runners, package scripts, or workflow phase routing.

## Template Surfaces

- `packages/cli/src/templates/common/skills/before-dev.md`
- `packages/cli/src/templates/zh/common/skills/before-dev.md`
- `.agents/skills/devflow-before-dev/SKILL.md`

## Content Shape

Add a compact section after context/spec loading guidance:

- suitability triggers;
- red-green-refactor loop;
- vertical-slice rule;
- public-interface testing rule;
- skip conditions;
- pointer to `.devflow/spec/<package>/unit-test/`.

## Compatibility

Common skill template changes require English, Chinese, and dogfood parity. This task should not require configurator code changes if single-file skill discovery already handles the modified templates.

## Rollback

Remove the TDD section from the three skill surfaces.
