# DevFlow Knowledge Stats Parity

## Maestro Requirement

Maestro `wiki-manage stats` reports more than raw entry counts. It includes:

- type distribution
- top tags
- category distribution
- connectivity averages and max hub
- growth by week

## DevFlow Adaptation

`devflow wiki stats` now preserves the existing count fields and adds:

- `connectivity.nodes`
- `connectivity.links`
- `connectivity.brokenLinks`
- `connectivity.orphans`
- `connectivity.averageInDegree`
- `connectivity.averageOutDegree`
- `connectivity.maxHub`
- `growth.entriesByWeek`

The graph values reuse the existing local knowledge graph helpers so link
semantics stay consistent with `wiki graph`, `wiki hubs`, `wiki orphans`, and
`wiki graph-health`.

## Validation

- Unit regression covers linked entries, an orphan, max hub, average degree, and
  ISO week growth buckets.
- Compiled CLI smoke verifies `devflow wiki stats --json` exposes the same
  values from a temporary `.devflow/spec` knowledge graph.
