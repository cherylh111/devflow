# Add Seam Adapter Cross-Layer Guidance

## Goal

Extend the cross-layer thinking guide with seam and adapter guidance so agents can identify where boundaries should absorb external volatility, format differences, and dependency-specific behavior.

## Background

The archived `06-13-research-skills-improvements` report lists Seam/Adapter as a P1 improvement. DevFlow already has a cross-layer thinking guide; this task should add targeted guidance there rather than create a new workflow skill.

## Requirements

- Update `.devflow/spec/guides/cross-layer-thinking-guide.md`.
- Explain when to introduce a seam or adapter.
- Warn against premature adapter layers around stable internal code.
- Include DevFlow-relevant examples such as platform adapters, registry backends, template rendering, hook payloads, and CLI/provider differences.
- Link the guidance to existing cross-layer data-flow checks.
- Avoid production code changes.

## Acceptance Criteria

- [ ] Cross-layer guide includes a seam/adapter section.
- [ ] The section includes good/base/bad examples or equivalent decision checks.
- [ ] The guidance distinguishes external volatility from internal convenience wrappers.
- [ ] No production TypeScript/Python code changes are made.

## Out Of Scope

- Refactoring existing adapters.
- Adding new platform abstractions.
- Changing provider contracts.
