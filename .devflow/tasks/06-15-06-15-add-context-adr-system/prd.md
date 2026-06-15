# Add CONTEXT.md/ADR Documentation System

## Goal

Add two complementary documentation systems to DevFlow based on the 06-13 research findings:

1. **Domain vocabulary system** - Runtime glossary for project-specific terms
2. **ADR (Architecture Decision Record) system** - Minimal, high-signal architecture decision records

## Background

The 06-13 research report identified that DevFlow lacks structured mechanisms for capturing:

- **Project-specific domain terms** - Currently scattered across specs, session insights, and commit messages
- **Architecture decisions** - Currently mixed into `design.md` files that get archived, making them hard to find

Skills project uses CONTEXT.md + ADR system with clear separation:
- CONTEXT.md = runtime vocabulary (what terms mean)
- ADR = architecture decisions (why we chose X over Y)

## Requirements

### Domain Vocabulary System

**Location**: `.devflow/spec/wiki/domain-vocabulary.md`

- Single file for project-specific terms (not general programming concepts)
- Format borrowed from Skills:
  - Term name as `**Term**:` heading
  - 1-2 sentence definition ("is what", not "does what")
  - `_Avoid_:` field listing synonyms to prevent term sprawl
  - Grouped by domain using `##` headings when natural clustering exists
- Lazy creation (don't create empty file during `devflow init`)
- Inline updates (capture terms as they're resolved, not batched)

**Anti-bloat mechanisms**:
- Template top includes clear admission criteria (✅ project-specific, ❌ general programming)
- Mandatory `_Avoid_:` field for each term
- Skills update reactively (only when term confusion occurs), not proactively

**Integration** (按需加载，不污染 context):
- Session start `<guidelines>` lists vocabulary path (not content)
- `devflow-brainstorm` reads vocabulary at start of planning
- `devflow-learn` suggests vocabulary updates when capturing project-specific terms

### ADR System

**Two-layer structure**:

1. **`.devflow/spec/adr/`** - Reserved for DevFlow framework's own architecture decisions
   - Audience: DevFlow contributors, deep customizers
   - **Not populated in this task** - future enhancement when framework decisions warrant recording
   
2. **`docs/adr/`** - User project architecture decisions (primary focus)
   - Audience: project team members
   - Examples: why monorepo, why domain events over REST
   - Sequential numbering: `0001-slug.md`, `0002-slug.md`
   - **Provide template and one example ADR** to demonstrate format

**Format** (minimal template from Skills):

```markdown
# {Short title}

{1-3 sentences: context, decision, why.}
```

Optional sections only when they add value:
- Status (proposed/accepted/deprecated/superseded by ADR-NNNN)
- Considered Options
- Consequences

**Three-condition admission criteria** (all must be true):

1. **Hard to reverse** - Changing would take significant effort
2. **Surprising without context** - Future readers would wonder "why this way?"
3. **Result of real trade-off** - Genuine alternatives existed

**Integration**:
- `devflow-brainstorm` should prompt for ADR creation when design decisions pass the 3-condition filter
- `devflow-learn` should suggest ADR creation when capturing architecture lessons

### Templates

Create template files in `packages/cli/src/templates/`:

**English**:
- `markdown/spec/wiki/domain-vocabulary.md.txt` - Vocabulary template with format guide and examples
- `markdown/docs/adr/_template.md.txt` - ADR minimal template
- `markdown/docs/adr/0001-example.md.txt` - Example ADR demonstrating format and 3-condition admission

**Chinese** (必须提供，保持体系一致):
- `zh/markdown/spec/wiki/domain-vocabulary.md.txt`
- `zh/markdown/docs/adr/_template.md.txt`
- `zh/markdown/docs/adr/0001-example.md.txt`

### Skills Updates

Update bundled skills to reference the new systems (both English and Chinese versions):

**`devflow-brainstorm`**:
- Load domain vocabulary at planning start (if exists)
- Add ADR 3-condition check prompt when design decisions are made
- Guide: "Hard to reverse? Surprising? Real trade-off? → Create ADR in docs/adr/"

**`devflow-learn`**:
- Prompt to update vocabulary when project-specific terms are clarified
- Prompt to create ADR when architecture lessons pass 3-condition filter
- Reference vocabulary admission criteria (project-specific, not general concepts)

## Acceptance Criteria

- [ ] `.devflow/spec/wiki/domain-vocabulary.md` template exists with Skills-style format and anti-bloat guidance (English + Chinese)
- [ ] `.devflow/spec/adr/` directory created (empty, reserved for future framework ADRs)
- [ ] `docs/adr/` contains `_template.md` and `0001-example.md` demonstrating the format (English + Chinese)
- [ ] Template files in `packages/cli/src/templates/markdown/` and `zh/markdown/` for vocabulary and ADR
- [ ] `devflow-brainstorm` skill loads vocabulary at planning start (English + Chinese versions)
- [ ] `devflow-brainstorm` skill mentions ADR 3-condition check when design decisions are made (English + Chinese versions)
- [ ] `devflow-learn` skill mentions vocabulary and ADR update prompts (English + Chinese versions)
- [ ] Session start `<guidelines>` lists vocabulary and ADR paths (shared-hooks/session-start.py)
- [ ] Documentation explains when to use vocabulary vs ADR vs session-insight

## Out Of Scope

- Automated CONTEXT.md generation from code
- ADR tooling for status transitions or linking
- Multi-context CONTEXT-MAP.md support (single vocabulary file sufficient; future can use per-package `.devflow/spec/<package>/domain-vocabulary.md` aligned with existing spec structure)
- Content injection in session-start.py (按需加载策略，避免 context 污染)
- Deep integration into all skills (only brainstorm and learn need updates)
- Vocabulary size monitoring and auto-warnings (防膨胀靠模板准入标准和技能提示)
- DevFlow framework ADRs (`.devflow/spec/adr/` reserved but not populated)

## Key Decisions

1. **按需加载策略** - Session start 不注入 vocabulary 内容，避免 context 污染。Skills 在需要时显式加载。
2. **单文件 MVP** - 单个 `domain-vocabulary.md` 文件，通过 `##` 分组。未来可扩展到 per-package 结构。
3. **防膨胀机制** - 模板准入标准 + 强制 `_Avoid_:` 字段 + reactive 更新提示（仅在术语冲突时更新）。
4. **ADR 3-condition 过滤** - 所有 ADR 必须同时满足：hard to reverse + surprising + real trade-off。
5. **中文模板必须** - 保持与现有 DevFlow 模板体系一致性。
