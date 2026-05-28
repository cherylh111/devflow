---
name: update-spec
description: "在实现、调试或设计决策之后，将可执行契约和编码知识捕获到 .devflow/spec/ 文档中。对基础设施和跨层变更强制代码规范深度，包含签名、契约、验证矩阵和测试点等必需章节。实现功能、修复 bug、做出设计决策、发现新模式或跨层契约变化时使用。"
---

# 更新代码规范 - 捕获可执行契约

当你从调试、实现或讨论中学到有价值的内容时，使用此 skill 更新相关代码规范文档。

**时机**：完成任务、修复 bug 或发现新模式之后。

---

## 代码规范优先规则（关键）

在本项目中，实现工作的 "spec" 指 **code-spec**：
- 可执行契约（不是只有原则性文字）。
- 具体 signatures、payload fields、env keys 和边界行为。
- 可测试的 validation/error 行为。

如果变更触及基础设施或跨层契约，必须达到 code-spec 深度。

基础设施/跨层 specs 的必需章节：
1. Scope / Trigger
2. Signatures（command/API/DB）
3. Contracts（request/response/env）
4. Validation & Error Matrix
5. Good/Base/Bad Cases
6. Tests Required（含 assertion points）
7. Wrong vs Correct（至少一组）

---

## 何时更新 Code-Specs

| 触发条件 | 示例 | 目标 Spec |
|---------|---------|-------------|
| **实现了功能** | 添加基于 giget 的模板下载 | 相关 `backend/` 或 `frontend/` 文件 |
| **做出设计决策** | 使用 type 字段 + 映射表提升可扩展性 | 相关 code-spec + "Design Decisions" 章节 |
| **修复了 bug** | 发现错误处理中的细微问题 | `backend/error-handling.md` |
| **发现了模式** | 找到更好的代码组织方式 | 相关 `backend/` 或 `frontend/` 文件 |
| **踩到坑** | 学到 X 必须先于 Y 完成 | 相关 code-spec + "Common Mistakes" 章节 |
| **建立了约定** | 团队约定命名模式 | `quality-guidelines.md` |
| **新的思考触发器** | “做 Y 前别忘了检查 X” | `guides/*.md`（作为检查项，而非详细规则） |

**关键洞察**：Code-spec 更新不只服务于问题修复。每次功能实现都包含未来 AI/开发者安全执行所需的设计决策和契约。

---

## Spec 结构概览

```
.devflow/spec/
├── backend/           # 后端编码标准
│   ├── index.md       # 概览和链接
│   └── *.md           # 主题专属指南
├── frontend/          # 前端编码标准
│   ├── index.md       # 概览和链接
│   └── *.md           # 主题专属指南
└── guides/            # 思考检查清单（不是编码 specs！）
    ├── index.md       # 指南索引
    └── *.md           # 主题专属指南
```

### 关键：Code-Spec vs Guide - 区分清楚

| 类型 | 位置 | 目的 | 内容风格 |
|------|----------|---------|---------------|
| **Code-Spec** | `backend/*.md`, `frontend/*.md` | 告诉 AI “如何安全实现” | Signatures、contracts、matrices、cases、test points |
| **Guide** | `guides/*.md` | 帮 AI 判断“该思考什么” | 检查清单、问题、指向 specs 的链接 |

**决策规则**：问自己：

- “这是**如何写**代码” → 放入 `backend/` 或 `frontend/`。
- “这是写之前**要考虑什么**” → 放入 `guides/`。

**示例**：

| Learning | Wrong Location | Correct Location |
|----------|----------------|------------------|
| "Use `reconfigure()` not `TextIOWrapper` for Windows stdout" | ❌ `guides/cross-platform-thinking-guide.md` | ✅ `backend/script-conventions.md` |
| "Remember to check encoding when writing cross-platform code" | ❌ `backend/script-conventions.md` | ✅ `guides/cross-platform-thinking-guide.md` |

**Guides 应该是指向 specs 的简短检查清单**，而不是复制详细规则。

---

## 更新流程

### 步骤 1：识别你学到了什么

回答这些问题：

1. **你学到了什么？**（要具体）
2. **为什么重要？**（它预防什么问题？）
3. **它应该放在哪里？**（哪个 spec 文件？）

### 步骤 2：分类更新类型

| 类型 | 描述 | 动作 |
|------|-------------|--------|
| **Design Decision** | 为什么选择方案 X 而不是 Y | 加到 "Design Decisions" 章节 |
| **Project Convention** | 本项目如何做 X | 加到相关章节并附示例 |
| **New Pattern** | 发现的可复用方法 | 加到 "Patterns" 章节 |
| **Forbidden Pattern** | 会引发问题的做法 | 加到 "Anti-patterns" 或 "Don't" 章节 |
| **Common Mistake** | 容易犯的错误 | 加到 "Common Mistakes" 章节 |
| **Convention** | 已达成一致的标准 | 加到相关章节 |
| **Gotcha** | 非显而易见的行为 | 添加 warning callout |

### 步骤 3：读取目标 Code-Spec

编辑前读取当前 code-spec，以便：
- 理解现有结构。
- 避免重复内容。
- 找到适合更新的位置。

```bash
cat .devflow/spec/<category>/<file>.md
```

### 步骤 4：执行更新

遵循以下原则：

1. **具体**：包含具体示例，不只写抽象规则。
2. **解释原因**：说明它预防什么问题。
3. **展示契约**：加入 signatures、payload fields 和错误行为。
4. **展示代码**：为关键模式加入代码片段。
5. **保持简短**：每个 section 只讲一个概念。

### 步骤 5：更新索引（如需要）

如果添加了新章节，或 code-spec 状态发生变化，更新该类别的 `index.md`。

---

## Update Templates

### Mandatory Template for Infra/Cross-Layer Work

```markdown
## Scenario: <name>

### 1. Scope / Trigger
- Trigger: <why this requires code-spec depth>

### 2. Signatures
### 3. Contracts
### 4. Validation & Error Matrix
### 5. Good/Base/Bad Cases
### 6. Tests Required
### 7. Wrong vs Correct
#### Wrong
...
#### Correct
...
```

### Adding a Design Decision

```markdown
### Design Decision: [Decision Name]

**Context**: What problem were we solving?

**Options Considered**:
1. Option A - brief description
2. Option B - brief description

**Decision**: We chose Option X because...

**Example**:
\`\`\`typescript
// How it's implemented
code example
\`\`\`

**Extensibility**: How to extend this in the future...
```

### Adding a Project Convention

```markdown
### Convention: [Convention Name]

**What**: Brief description of the convention.

**Why**: Why we do it this way in this project.

**Example**:
\`\`\`typescript
// How to follow this convention
code example
\`\`\`

**Related**: Links to related conventions or specs.
```

### Adding a New Pattern

```markdown
### Pattern Name

**Problem**: What problem does this solve?

**Solution**: Brief description of the approach.

**Example**:
\`\`\`
// Good
code example

// Bad
code example
\`\`\`

**Why**: Explanation of why this works better.
```

### Adding a Forbidden Pattern

```markdown
### Don't: Pattern Name

**Problem**:
\`\`\`
// Don't do this
bad code example
\`\`\`

**Why it's bad**: Explanation of the issue.

**Instead**:
\`\`\`
// Do this instead
good code example
\`\`\`
```

### Adding a Common Mistake

```markdown
### Common Mistake: Description

**Symptom**: What goes wrong

**Cause**: Why this happens

**Fix**: How to correct it

**Prevention**: How to avoid it in the future
```

### Adding a Gotcha

```markdown
> **Warning**: Brief description of the non-obvious behavior.
>
> Details about when this happens and how to handle it.
```

---

## Interactive Mode

如果不确定要更新什么，回答这些提示：

1. **What did you just finish?**
   - [ ] Fixed a bug
   - [ ] Implemented a feature
   - [ ] Refactored code
   - [ ] Had a discussion about approach

2. **What did you learn or decide?**
   - Design decision (why X over Y)
   - Project convention (how we do X)
   - Non-obvious behavior (gotcha)
   - Better approach (pattern)

3. **Would future AI/developers need to know this?**
   - To understand how the code works → Yes, update spec
   - To maintain or extend the feature → Yes, update spec
   - To avoid repeating mistakes → Yes, update spec
   - Purely one-off implementation detail → Maybe skip

4. **Which area does it relate to?**
   - [ ] Backend code
   - [ ] Frontend code
   - [ ] Cross-layer data flow
   - [ ] Code organization/reuse
   - [ ] Quality/testing

---

## Quality Checklist

完成 code-spec 更新前：

- [ ] Is the content specific and actionable?
- [ ] Did you include a code example?
- [ ] Did you explain WHY, not just WHAT?
- [ ] Did you include executable signatures/contracts?
- [ ] Did you include validation and error matrix?
- [ ] Did you include Good/Base/Bad cases?
- [ ] Did you include required tests with assertion points?
- [ ] Is it in the right code-spec file?
- [ ] Does it duplicate existing content?
- [ ] Would a new team member understand it?

---

## Relationship to Other Commands

```
Development Flow:
  Learn something → $update-spec → Knowledge captured
       ↑                                  ↓
  $break-loop ←──────────────────── Future sessions benefit
  (deep bug analysis)
```

- `$break-loop` - Analyzes bugs deeply, often reveals spec updates needed
- `$update-spec` - Actually makes the updates (this skill)
- `$finish-work` - Reminds you to check if specs need updates

---

## Core Philosophy

> **Code-specs 是活文档。每次调试、每个“恍然大悟”的时刻，都是让实现契约更清晰的机会。**

目标是形成**组织记忆**：
- 一个人学到的东西，所有人都能受益。
- AI 在一次会话中学到的东西，会持久化到未来会话。
- 错误会变成文档化的护栏。
