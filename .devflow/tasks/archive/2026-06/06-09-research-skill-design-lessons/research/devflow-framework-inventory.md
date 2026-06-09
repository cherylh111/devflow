# DevFlow Framework Inventory

## Scope

This inventory summarizes DevFlow's current framework as inspected from local generated files, bundled skills, specs, and task records.

Local sources:

- `.devflow/workflow.md`
- `.agents/skills/devflow-brainstorm/SKILL.md`
- `.agents/skills/devflow-before-dev/SKILL.md`
- `.agents/skills/devflow-check/SKILL.md`
- `.agents/skills/devflow-break-loop/SKILL.md`
- `.agents/skills/devflow-update-spec/SKILL.md`
- `.agents/skills/devflow-meta/SKILL.md`
- `.agents/skills/devflow-meta/references/local-architecture/*.md`
- `.agents/skills/devflow-meta/references/platform-files/skills-and-commands.md`
- `.devflow/spec/devflow/backend/workflow-state-contract.md`
- `.devflow/spec/devflow/backend/task-progress.md`
- `.devflow/spec/wiki/session-insight/06-06-research-external-skills-patterns.md`

## Framework Shape

DevFlow is a persisted workflow and context-injection framework. It is not only a skill library.

Its main components are:

- workflow layer: `.devflow/workflow.md`
- task persistence layer: `.devflow/tasks/`
- spec and knowledge layer: `.devflow/spec/`
- workspace memory layer: `.devflow/workspace/`
- local script runtime: `.devflow/scripts/`
- platform integration layer: `.agents/skills/`, platform hooks, agents, commands, prompts, and workflows

## Strengths

### 1. Durable Lifecycle

DevFlow has a clear plan -> execute -> finish lifecycle. `task.py create` creates a planning task. `task.py start` is the transition into implementation. Completion and archive are explicit.

This is stronger than an ad hoc skill chain because phase state is persisted.

### 2. Start Gate And Planning Artifacts

Complex tasks must have `prd.md`, `design.md`, `implement.md`, and `task.json.meta.complex: true` before start. The start gate blocks placeholder PRDs and unresolved brainstorm headings.

This reduces accidental implementation before requirements are stable.

### 3. Spec Injection

DevFlow's principle is "specs injected, not remembered." Relevant coding conventions live in `.devflow/spec/`, and tasks can point implement/check agents to context through JSONL manifests.

This gives DevFlow a stronger long-term memory model than ordinary prompt instructions.

### 4. Cross-Platform Integration

DevFlow supports multiple AI surfaces by generating platform-specific hooks, skills, commands, prompts, agents, and shared `.agents/skills/` entries.

This matters because a borrowed skill design must work across platform differences.

### 5. Quality And Retrospective Loops

DevFlow has explicit skills for:

- requirement exploration
- pre-development spec loading
- quality checking
- repeated bug analysis
- spec updates
- session wrap-up

These are phase-oriented and persistence-oriented.

## Weaknesses Or Gaps Relative To Matt Pocock's Skills

### 1. Skills Are Larger Phase Entrypoints

DevFlow skills are mostly workflow phase gates. They are effective for lifecycle control but less precise as small thinking tools.

For example, there is `devflow-brainstorm` but no separate first-class skill for "zoom out from this design" or "prototype this risky assumption."

### 2. Cognitive Actions Are Embedded In Broader Skills

Debug analysis exists in `devflow-break-loop`, but pre-fix diagnosis is not separated as a smaller action. Code reuse and cross-layer thinking exist as guides, but they are not always triggerable as independent skills.

### 3. Some Guidance May Be Too Heavy For Small Questions

Because DevFlow emphasizes persistence and gates, it can feel heavy when the user wants one focused reasoning move.

### 4. Skill Design Rules Exist But Are Not A Central Spec

`devflow-meta` already says `SKILL.md` should be short and references should carry long content. This is good, but it is not yet surfaced as a single adoption policy for all bundled skills.

## Current DevFlow Design Principles To Preserve

- `.devflow/workflow.md` remains the lifecycle source of truth.
- Durable task artifacts beat chat-only conclusions.
- Specs and knowledge belong in `.devflow/spec/`, not in model memory.
- Platform-specific files must stay semantically aligned.
- `progress.json` is advisory and must not replace `task.json.status`.
- Start gates must prevent under-planned work from entering implementation.

## Current DevFlow Design Principles To Extend

- Add smaller cognitive skills where they improve precision.
- Make skill trigger descriptions stricter.
- Standardize short entry files plus references across bundled skills.
- Convert useful thinking guides into triggerable skills only when that improves routing.
- Add explicit adoption rules for when a new idea belongs in workflow, skill, command, prompt, task artifact, or spec.
