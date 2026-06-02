# Use DevFlow Built-In Skill Design

## Architecture

Add `devflow-use` as a common bundled skill:

- English source: `packages/cli/src/templates/common/bundled-skills/devflow-use/SKILL.md`
- Chinese overlay: `packages/cli/src/templates/zh/common/bundled-skills/devflow-use/SKILL.md`
- Installed path: `.agents/skills/devflow-use/SKILL.md` or the platform-specific bundled-skill root used by each configurator.

No new TypeScript registration should be required because `getBundledSkillTemplates()` discovers directories below `common/bundled-skills/` recursively. The existing configurator path should continue to resolve, write, and hash-track bundled skills through `resolveBundledSkills()`, `writeSkills()`, and `collectSkillTemplates()`.

## Skill Contract

The skill should trigger when a user or agent asks how to use DevFlow, wants a DevFlow workflow guide, needs best practices for DevFlow-managed development, or is unsure which DevFlow phase/skill/command to use.

The body should guide the agent through practical operating rules rather than re-stating all of `.devflow/workflow.md`. It should direct agents to read local DevFlow context first and treat `.devflow/workflow.md`, `.devflow/spec/`, and task artifacts as authoritative.

## Localization

The English template is the canonical source. The Chinese overlay should keep the same broad section structure and frontmatter fields so localized init output has equivalent behavior. Avoid placeholders unless needed; this keeps language parity simple and avoids platform-specific rendering differences.

## Tests

Add focused tests for:

- bundled skill resolver includes `devflow-use/SKILL.md`
- init installs and hash-tracks `.agents/skills/devflow-use/SKILL.md`

Existing platform write/collect parity tests should also catch missing update-path tracking if the new bundled skill is not collected.

## Risks

- A bundled skill without valid frontmatter may install but fail to trigger in AI clients.
- Adding only the English template would leave Chinese init output incomplete.
- Manually registering the skill in one configurator would risk init/update drift; directory discovery is the safer path.
