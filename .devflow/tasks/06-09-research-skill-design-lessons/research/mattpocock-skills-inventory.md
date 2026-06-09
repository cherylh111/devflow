# Matt Pocock Skills Inventory

## Scope

This inventory summarizes the design patterns visible in Matt Pocock's `skills` repository for comparison with DevFlow. It focuses on architecture and workflow ideas, not line-by-line copying.

Sources:

- Repository: https://github.com/mattpocock/skills
- Skills directory: https://github.com/mattpocock/skills/tree/main/skills
- Representative skill pages:
  - https://github.com/mattpocock/skills/blob/main/skills/engineering/diagnose/SKILL.md
  - https://github.com/mattpocock/skills/blob/main/skills/engineering/tdd/SKILL.md
  - https://github.com/mattpocock/skills/blob/main/skills/engineering/to-prd/SKILL.md
  - https://github.com/mattpocock/skills/blob/main/skills/engineering/to-issues/SKILL.md
  - https://github.com/mattpocock/skills/blob/main/skills/engineering/prototype/SKILL.md
  - https://github.com/mattpocock/skills/blob/main/skills/engineering/grill-with-docs/SKILL.md
  - https://github.com/mattpocock/skills/blob/main/skills/engineering/zoom-out/SKILL.md
  - https://github.com/mattpocock/skills/blob/main/skills/engineering/improve-codebase-architecture/SKILL.md

## Framework Shape

The framework is a library of small skills grouped by intent. It does not appear to be a single mandatory project lifecycle. The main design unit is a reusable cognitive or engineering action:

- diagnose a problem
- practice TDD
- transform ambiguous work into a PRD
- split work into issues
- prototype quickly
- interrogate docs or context
- zoom out from local implementation detail
- improve codebase architecture

This is a skill-library model rather than a task-runtime model.

## Strengths

### 1. Small Action-Oriented Skills

Skills are narrow enough that a model can select one for a specific moment. This lowers ambiguity compared with one broad "do engineering well" instruction.

The strongest examples are:

- `diagnose`: useful before repeated fixing.
- `tdd`: useful when behavior can be expressed with tests.
- `to-prd`: useful when a request is unclear.
- `to-issues`: useful when a plan must become implementation slices.
- `zoom-out`: useful when local reasoning may miss broader architecture.

### 2. Clear Trigger Semantics

Each skill uses `SKILL.md` as the entry point. The important idea is not only the file name, but the trigger contract: a skill should say when to use it, not just what it contains.

This directly matches DevFlow's existing skill metadata model.

### 3. Cognitive Loops

Several skills encode loops rather than static advice:

- reproduce -> isolate -> fix -> verify
- red -> green -> refactor
- clarify -> structure -> slice
- inspect docs -> challenge assumptions -> resolve

These loops are valuable because they reduce model drift during ambiguous work.

### 4. Prototype Permission

The prototype pattern is useful because it explicitly separates learning code from production code. This can prevent over-design when a task contains uncertain feasibility.

### 5. Vertical Slicing

The PRD-to-issues pattern encourages breaking work into independently understandable units. This maps well to DevFlow parent/child tasks if adapted carefully.

## Weaknesses Or Gaps Relative To DevFlow

### 1. No Native Task Persistence Contract

The framework's skills are instructions. They do not by themselves define a durable task directory with `prd.md`, `design.md`, `implement.md`, research files, metadata, context manifests, archive state, and session recovery.

### 2. No Central Lifecycle Gate

Small skills can be composed, but the framework does not enforce a single lifecycle like DevFlow's plan -> execute -> finish flow.

### 3. Risk Of Skill Proliferation

A large skill library can become noisy if trigger descriptions overlap. DevFlow would need strict naming and trigger conventions before importing many small skills.

### 4. Project Memory Is Less Structured

Repository context and ADR-style ideas are valuable, but DevFlow already has richer task/spec/workspace persistence. Copying another memory layer would create duplicate truth unless it is mapped into `.devflow/spec/` or `.devflow/tasks/`.

## Design Ideas Worth Borrowing

- Small cognitive skills.
- Specific trigger descriptions.
- Short `SKILL.md` plus optional references.
- Diagnostic and TDD feedback loops.
- Prototype-as-learning workflow.
- PRD-to-slice decomposition.
- A vocabulary/context artifact, if mapped into DevFlow's existing spec/wiki system.

## Design Ideas To Avoid Copying Directly

- A standalone issue tracker model that competes with `.devflow/tasks/`.
- A broad set of overlapping skills without trigger discipline.
- Putting durable conventions inside skills when they belong in `.devflow/spec/`.
- Replacing DevFlow lifecycle gates with optional ad hoc skill chains.
