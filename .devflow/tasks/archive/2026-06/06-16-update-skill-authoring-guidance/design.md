# Update Skill Authoring Guidance Design

## Boundaries

This task changes only the backend skill-authoring spec. It should not modify skill templates unless the spec update exposes a direct contradiction that must be corrected.

## Target File

- `.devflow/spec/devflow/backend/skill-authoring.md`

## Content Shape

Add or refine sections for:

- SKILL.md length target;
- using references for long content;
- utility scripts in bundled skills;
- description as trigger/routing surface.

## Compatibility

The guidance must remain compatible with existing bundled skill structure under `packages/cli/src/templates/common/bundled-skills/<name>/`.

## Rollback

Revert the spec additions.
