# Initial Comparison: Matt Pocock Skills And DevFlow

## Sources Consulted

External:

- Matt Pocock skills repository: https://github.com/mattpocock/skills
- Skills directory: https://github.com/mattpocock/skills/tree/main/skills
- Representative raw skill paths considered for follow-up inventory:
  - `skills/engineering/diagnose/SKILL.md`
  - `skills/engineering/to-prd/SKILL.md`
  - `skills/engineering/prototype/SKILL.md`
  - `skills/engineering/zoom-out/SKILL.md`
  - `skills/engineering/improve-codebase-architecture/SKILL.md`

Local:

- `.devflow/workflow.md`
- `.agents/skills/devflow-brainstorm/SKILL.md`
- `.agents/skills/devflow-before-dev/SKILL.md`
- `.agents/skills/devflow-check/SKILL.md`
- `.agents/skills/devflow-break-loop/SKILL.md`
- `.agents/skills/devflow-update-spec/SKILL.md`
- `.agents/skills/devflow-meta/SKILL.md`
- `.agents/skills/devflow-meta/references/local-architecture/*.md`
- `.agents/skills/devflow-meta/references/customize-local/change-skills-or-commands.md`
- `.devflow/spec/wiki/session-insight/06-06-research-external-skills-patterns.md`

## External Framework Observations

Matt Pocock's skills framework appears optimized for small, reusable AI work patterns:

- Skills are organized by use case and loaded through `SKILL.md` frontmatter descriptions.
- The useful unit is a cognitive action, such as diagnosing, converting to PRD, prototyping, zooming out, or improving architecture.
- The design favors composability over a single mandatory lifecycle.
- Some skills encode feedback loops, such as diagnose/reproduce/fix/verify, or PRD/issue decomposition.
- The repository-level context pattern is useful for shared vocabulary and assumptions.

The external design is strongest when the user needs a sharp thinking tool. It is weaker as a complete task lifecycle because it does not inherently provide DevFlow's persisted task directory, start gate, spec injection, archive flow, or cross-platform runtime state.

## DevFlow Observations

DevFlow is optimized for durable task execution:

- `.devflow/workflow.md` defines the authoritative lifecycle and state-specific instructions.
- Task directories persist `prd.md`, optional `design.md`, optional `implement.md`, research, context JSONL, and metadata.
- Spec injection and local context loading are explicit; AI is told to read project specs rather than remember conventions.
- Quality gates are built into the phase model: plan, implement, check, update spec, commit, finish.
- The platform model supports multiple AI tools through generated hooks, agents, skills, commands, prompts, and shared `.agents/skills/`.

DevFlow is strongest when work must be reliable across sessions, tools, and implementation phases. It is heavier than a small skill library when the user only needs one thinking action.

## Early Adoption Matrix

| Candidate idea | Decision | Rationale | Possible DevFlow mapping |
| --- | --- | --- | --- |
| Small cognitive skills such as diagnose, zoom-out, prototype, and grill | Adapt | Valuable for precision, but must not bypass DevFlow task gates. | Add or revise `.agents/skills/devflow-*` and platform templates. |
| Repository context / vocabulary document | Adapt | Useful, but DevFlow already has `.devflow/spec/` and wiki-style entries. | Add a spec/wiki convention for project vocabulary or decision context. |
| `SKILL.md` as short router with longer `references/` | Adopt directly | DevFlow meta already recommends this; standardize it across bundled skills. | Review `.agents/skills/*/SKILL.md` and template bundled skills. |
| PRD-to-issues / vertical slice decomposition | Adapt | DevFlow has parent/child tasks; external approach can improve intake and slicing. | Add guidance to brainstorm or a new planning skill. |
| Triage labels and issue tracker setup | Defer | Useful for GitHub issue workflows but not core to DevFlow task directories. | Optional integration task only if product scope includes external issue trackers. |
| Full external workflow replacement | Reject | Would duplicate or weaken DevFlow's lifecycle, spec injection, and persistence. | Keep `.devflow/workflow.md` as source of truth. |

## Initial Recommendation

DevFlow should not copy the external framework wholesale. It should borrow the skill design philosophy:

- small, scenario-specific skills;
- clear trigger descriptions;
- short `SKILL.md` entry points with references loaded on demand;
- explicit vocabulary/context artifacts;
- repeatable thinking loops for diagnosis, prototyping, and planning.

The recommended direction is to keep DevFlow's task lifecycle and persistence model, then add smaller cognitive skills that plug into Phase 1 planning or Phase 2/3 debugging/checking.

## Gaps For Deeper Research

- Build a complete inventory of external skills and group them by purpose.
- Verify each candidate skill's exact instructions against the source repository.
- Compare against DevFlow's templates under `packages/cli/src/templates/**`, not only local generated `.agents/skills/`.
- Identify which recommendations should become spec updates versus code/template changes.
