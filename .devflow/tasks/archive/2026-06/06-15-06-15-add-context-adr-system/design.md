# Technical Design

## Overview

This task adds documentation infrastructure (templates + integration points) for domain vocabulary and ADR systems. **No complex technical design required** - primarily file creation and text insertion.

## Architecture

### Components

1. **Template Files** - Static Markdown templates in `packages/cli/src/templates/`
   - No runtime parsing or validation
   - Copied during `devflow init` or created manually by users

2. **Skill Integration** - Text prompts in existing skills
   - `devflow-brainstorm` reads vocabulary file at planning start
   - `devflow-learn` prompts for vocabulary/ADR updates
   - No new code logic, only instructional text

3. **Session Start Hook** - Path listing in `<guidelines>` block
   - Conditionally lists paths if files exist
   - No content injection (按需加载策略)

### Data Flow

```
Session Start
  └─> Check if .devflow/spec/wiki/domain-vocabulary.md exists
      └─> If yes: add path to <guidelines> output
      
devflow-brainstorm
  └─> Read domain-vocabulary.md (if exists)
  └─> Use terms during planning
  └─> Prompt for ADR when design decision passes 3-condition filter

devflow-learn
  └─> Prompt to update vocabulary when capturing project-specific terms
  └─> Prompt to create ADR when capturing architecture lessons
```

### File Structure

```
packages/cli/src/templates/
├── markdown/
│   ├── spec/wiki/domain-vocabulary.md.txt     (new)
│   └── docs/adr/
│       ├── _template.md.txt                    (new)
│       └── 0001-example.md.txt                 (new)
├── zh/markdown/                                (new, mirror structure)
│   ├── spec/wiki/domain-vocabulary.md.txt
│   └── docs/adr/
│       ├── _template.md.txt
│       └── 0001-example.md.txt
├── common/skills/
│   ├── brainstorm.md                           (modified)
│   └── learn.md                                (modified)
├── zh/common/skills/
│   ├── brainstorm.md                           (modified)
│   └── learn.md                                (modified)
└── shared-hooks/
    └── session-start.py                        (modified)
```

### User Project Structure

```
project/
├── .devflow/
│   └── spec/
│       ├── adr/                                (reserved, empty)
│       └── wiki/
│           └── domain-vocabulary.md            (optional, user-created)
└── docs/
    └── adr/                                    (optional, user-created)
        ├── _template.md
        ├── 0001-example.md
        └── 0002-user-decision.md
```

## Integration Points

### Session Start Hook

**File**: `packages/cli/src/templates/shared-hooks/session-start.py`

**Location**: After spec indexes list in `<guidelines>` block (around line 859)

**Logic**:
```python
vocab_file = devflow_dir / "spec" / "wiki" / "domain-vocabulary.md"
if vocab_file.exists():
    output.write("- Domain vocabulary: .devflow/spec/wiki/domain-vocabulary.md\n")
```

**Impact**: Zero breaking changes, purely additive.

### Skill Updates

**Files**: 
- `packages/cli/src/templates/common/skills/brainstorm.md`
- `packages/cli/src/templates/zh/common/skills/brainstorm.md`

**Location**: In "Planning Flow" section, before step 1

**Addition**:
```markdown
0. Load domain vocabulary if it exists:
   ```bash
   cat .devflow/spec/wiki/domain-vocabulary.md 2>/dev/null
   ```
```

**Impact**: Optional - if file doesn't exist, skill proceeds normally.

## Compatibility

### Backwards Compatibility

✅ **Fully backwards compatible**:
- Existing projects without vocabulary/ADR work unchanged
- All integrations are conditional (check file existence first)
- No breaking changes to existing workflows

### Migration

❌ **No migration needed** - new feature, additive only

## Operational Considerations

### Performance

- Session start: +1 file existence check (~1ms)
- Skill execution: +1 optional file read (~10ms if file exists)
- Negligible performance impact

### Monitoring

No monitoring needed - static templates and optional file reads.

### Rollback

Can be fully reverted by:
1. Removing template files
2. Reverting skill text changes
3. Reverting session-start.py changes

No data loss - user-created vocabulary/ADR files remain intact.

## Trade-offs

### Chosen: 按需加载 (On-demand loading)

**Pros**:
- Zero context pollution
- Phase-aware (only loads during planning)
- Aligns with existing DevFlow pattern

**Cons**:
- Skills must remember to load vocabulary
- Not immediately visible in all phases

**Alternative rejected**: Auto-inject in session start
- Would pollute context in implementation/finish phases
- Wastes tokens when vocabulary not needed

### Chosen: 单文件 MVP (Single-file MVP)

**Pros**:
- Simple to implement and use
- Sufficient for most projects
- Clear extension path (per-package structure)

**Cons**:
- Very large monorepos might need splitting

**Alternative rejected**: Multi-context from day 1
- Premature complexity
- No evidence of need yet

## Security Considerations

None - all files are static templates or user-created documentation.

## Testing Strategy

**Template verification**:
- Check files exist at expected paths
- Verify format consistency (English vs Chinese)

**Integration verification**:
- Run session-start.py and check output contains paths
- Grep skills for vocabulary/ADR mentions
- Manual test: create vocabulary file, run brainstorm, verify it loads

**No unit tests needed** - pure text/template changes.
