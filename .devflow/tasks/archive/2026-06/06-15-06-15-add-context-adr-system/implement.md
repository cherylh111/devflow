# Implementation Plan

## Overview

Implement CONTEXT.md/ADR documentation system through template creation, skill updates, and session start integration. No complex technical design required - primarily file creation and text updates.

## Implementation Checklist

### Phase 1: Create Template Files

#### 1.1 Domain Vocabulary Templates

**English**:
- [ ] Create `packages/cli/src/templates/markdown/spec/wiki/domain-vocabulary.md.txt`
  - Include format guide (term name, definition, `_Avoid_:` field)
  - Include admission criteria (✅ project-specific, ❌ general programming)
  - Include 2-3 example terms (Order, Invoice, Event)
  - Include anti-bloat guidance

**Validation**: Read the file and verify format matches Skills CONTEXT.md style.

**Chinese**:
- [ ] Create `packages/cli/src/templates/zh/markdown/spec/wiki/domain-vocabulary.md.txt`
  - Translate English template
  - Ensure examples are culturally appropriate

**Validation**: Compare structure with English version (headings match, examples present).

#### 1.2 ADR Templates

**English**:
- [ ] Create `packages/cli/src/templates/markdown/docs/adr/_template.md.txt`
  - Minimal format: title, 1-3 sentence body
  - Optional sections: Status, Considered Options, Consequences
  - Include 3-condition admission guide

- [ ] Create `packages/cli/src/templates/markdown/docs/adr/0001-example.md.txt`
  - Realistic example (not DevFlow-specific)
  - Demonstrates all sections
  - Passes 3-condition filter

**Validation**: 
```bash
cat packages/cli/src/templates/markdown/docs/adr/_template.md.txt
cat packages/cli/src/templates/markdown/docs/adr/0001-example.md.txt
```

**Chinese**:
- [ ] Create `packages/cli/src/templates/zh/markdown/docs/adr/_template.md.txt`
- [ ] Create `packages/cli/src/templates/zh/markdown/docs/adr/0001-example.md.txt`

**Validation**: Compare with English versions.

### Phase 2: Update Skills

#### 2.1 devflow-brainstorm

**English** (`packages/cli/src/templates/common/skills/brainstorm.md`):
- [ ] Add vocabulary loading step in "Planning Flow" section:
  ```markdown
  1. Load domain vocabulary if it exists:
     ```bash
     cat .devflow/spec/wiki/domain-vocabulary.md 2>/dev/null
     ```
  2. Capture the user's request...
  ```

- [ ] Add ADR check in "Artifact Rules" or new "Decision Capture" section:
  ```markdown
  When a design decision is made, apply the 3-condition ADR filter:
  1. Hard to reverse? (changing would take significant effort)
  2. Surprising without context? (future readers would wonder why)
  3. Result of real trade-off? (genuine alternatives existed)
  
  If all three: create ADR in `docs/adr/NNNN-slug.md`
  ```

**Validation**: 
```bash
grep -i "vocabulary\|ADR" packages/cli/src/templates/common/skills/brainstorm.md
```

**Chinese** (`packages/cli/src/templates/zh/common/skills/brainstorm.md`):
- [ ] Add equivalent vocabulary loading step (Chinese)
- [ ] Add equivalent ADR 3-condition check (Chinese)

**Validation**: Compare structure with English version.

#### 2.2 devflow-learn

**English** (`packages/cli/src/templates/common/skills/learn.md`):
- [ ] Add vocabulary update prompt:
  ```markdown
  When capturing project-specific domain terms:
  - Check if the term already exists in `.devflow/spec/wiki/domain-vocabulary.md`
  - If new, add using the format: **Term**: definition. _Avoid_: synonyms
  - Only add project-specific terms, not general programming concepts
  ```

- [ ] Add ADR creation prompt:
  ```markdown
  When capturing architecture lessons, check if they pass the ADR 3-condition filter.
  If yes, create an ADR in `docs/adr/` instead of only adding to spec.
  ```

**Validation**:
```bash
grep -i "vocabulary\|ADR" packages/cli/src/templates/common/skills/learn.md
```

**Chinese** (`packages/cli/src/templates/zh/common/skills/learn.md`):
- [ ] Add equivalent vocabulary update prompt (Chinese)
- [ ] Add equivalent ADR creation prompt (Chinese)

**Validation**: Compare with English version.

### Phase 3: Update Session Start Hook

**File**: `packages/cli/src/templates/shared-hooks/session-start.py`

- [ ] Locate the `<guidelines>` output section (around line 843-860)

- [ ] Add vocabulary and ADR paths after the spec indexes list:

```python
output.write(
    "Discover more via: "
    "`python3 ./.devflow/scripts/get_context.py --mode packages`\n"
)

# Add this block:
vocab_file = devflow_dir / "spec" / "wiki" / "domain-vocabulary.md"
adr_dir_framework = devflow_dir / "spec" / "adr"
adr_dir_project = project_dir / "docs" / "adr"

output.write("\n## Available documentation\n")
if vocab_file.exists():
    output.write("- Domain vocabulary: .devflow/spec/wiki/domain-vocabulary.md\n")
if adr_dir_framework.exists() and any(adr_dir_framework.glob("*.md")):
    output.write("- DevFlow ADRs: .devflow/spec/adr/\n")
if adr_dir_project.exists() and any(adr_dir_project.glob("*.md")):
    output.write("- Project ADRs: docs/adr/\n")

output.write("</guidelines>\n\n")
```

**Validation**:
```bash
# Start a test session and check output contains the new paths
python packages/cli/src/templates/shared-hooks/session-start.py <<< '{}'
```

### Phase 4: Create Local Dogfood Files

Create example files in this DevFlow repository for immediate use:

- [ ] Create `.devflow/spec/adr/.gitkeep` (reserve directory)
- [ ] Create `.devflow/spec/wiki/domain-vocabulary.md` with DevFlow-specific terms
  - Example: **Task**, **Spec**, **Phase**, **Hook**
  
**Validation**: Read the created files.

### Phase 5: Documentation

- [ ] Update relevant README or docs to explain:
  - When to use domain vocabulary vs session-insight vs spec
  - ADR 3-condition admission criteria
  - File locations and formats

**Suggested location**: `.devflow/spec/guides/documentation-system.md` or append to existing guide.

**Validation**: Read the documentation and check it covers all three systems.

## Validation Commands

After all changes:

```bash
# Check all template files exist
find packages/cli/src/templates -path "*/markdown/*vocabulary*" -o -path "*/markdown/*adr*"
find packages/cli/src/templates/zh -path "*/markdown/*vocabulary*" -o -path "*/markdown/*adr*"

# Check skills were updated
grep -l "vocabulary\|ADR" packages/cli/src/templates/common/skills/brainstorm.md
grep -l "vocabulary\|ADR" packages/cli/src/templates/common/skills/learn.md
grep -l "vocabulary\|ADR" packages/cli/src/templates/zh/common/skills/brainstorm.md
grep -l "vocabulary\|ADR" packages/cli/src/templates/zh/common/skills/learn.md

# Check session-start.py was updated
grep "domain-vocabulary\|ADR" packages/cli/src/templates/shared-hooks/session-start.py

# Run tests
cd packages/cli && npm test
```

## Rollback Points

- After Phase 1: Templates created, can be removed without affecting runtime
- After Phase 2: Skills updated, can be reverted without breaking existing workflows
- After Phase 3: Session start updated, revert if output format breaks

## Notes

- No breaking changes - all additions are additive
- Lazy creation pattern - files only appear when needed
- Backwards compatible - projects without vocabulary/ADR work unchanged
