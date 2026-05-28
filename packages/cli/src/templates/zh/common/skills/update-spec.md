# 更新代码规范 - 捕获可执行契约

当你从调试、实现或讨论中学到有价值的内容时，使用此流程更新相关代码规范文档。

**时机**：完成任务、修复 bug 或发现新模式之后

---

## 代码规范优先规则（关键）

在本项目中，实现工作的 "spec" 指 **代码规范**：
- 可执行契约（不是只有原则的文本）
- 具体签名、payload 字段、环境变量 key 和边界行为
- 可测试的验证/错误行为

如果变更触及基础设施或跨层契约，必须达到代码规范深度。

### 强制触发条件

当变更包含以下任一项时，应用代码规范深度：
- 新增/变更命令或 API 签名
- 跨层请求/响应契约变更
- 数据库 schema/migration 变更
- 基础设施集成（存储、队列、缓存、密钥、环境变量接线）

### 强制输出（7 个章节）

对触发的任务，包含以下所有章节：
1. Scope / Trigger
2. Signatures (command/API/DB)
3. Contracts (request/response/env)
4. Validation & Error Matrix
5. Good/Base/Bad Cases
6. Tests Required (with assertion points)
7. Wrong vs Correct (at least one pair)

---

## 何时更新代码规范

| 触发 | 示例 | 目标规范 |
|---------|---------|-------------|
| **实现了功能** | 添加了新集成或模块 | 相关规范文件 |
| **做出设计决策** | 选择可扩展模式而不是简单方案 | 相关规范 + "Design Decisions" 章节 |
| **修复了 bug** | 发现错误处理中的细微问题 | 相关规范（例如错误处理文档） |
| **发现了模式** | 找到更好的代码组织方式 | 相关规范文件 |
| **遇到陷阱** | 学到 X 必须先于 Y 完成 | 相关规范 + "Common Mistakes" 章节 |
| **建立了约定** | 团队同意命名模式 | 质量指南 |
| **新的思考触发器** | "做 Y 前别忘了检查 X" | `guides/*.md`（作为清单项） |

**关键认识**：代码规范更新不只用于问题。每次功能实现都包含未来 AI/开发者安全执行所需的设计决策和契约。

---

## 规范结构概览

```
.devflow/spec/
├── <layer>/           # Per-layer coding standards (e.g., backend/, frontend/, api/)
│   ├── index.md       # Overview and links
│   └── *.md           # Topic-specific guidelines
└── guides/            # Thinking checklists (NOT coding specs!)
    ├── index.md       # Guide index
    └── *.md           # Topic-specific guides
```

### 关键：代码规范 vs 指南 - 理解差异

| 类型 | 位置 | 用途 | 内容风格 |
|------|----------|---------|---------------|
| **代码规范** | `<layer>/*.md` | 告诉 AI “如何安全实现” | 签名、契约、矩阵、案例、测试点 |
| **指南** | `guides/*.md` | 帮助 AI “需要思考什么” | 清单、问题、指向规范的链接 |

**决策规则**：问自己：

- “这是**如何编写**代码” -> 放入规范层目录
- “这是编写前**要考虑什么**” -> 放入 `guides/`

**示例**：

| 学到的内容 | 错误位置 | 正确位置 |
|----------|----------------|------------------|
| “此任务使用 API X，不要用 API Y” | ❌ `guides/`（对思考指南过于具体） | ✅ 相关规范文件（具体约定） |
| “做 Y 时记得检查 X” | ❌ 规范文件（对规范过于抽象） | ✅ `guides/`（思考清单） |

**指南应是指向规范的短清单**，不要重复详细规则。

---

## 更新流程

### 步骤 1：识别你学到了什么

回答这些问题：

1. **你学到了什么？**（要具体）
2. **为什么重要？**（它预防什么问题？）
3. **它属于哪里？**（哪个规范文件？）

### 步骤 2：分类更新类型

| 类型 | 描述 | 动作 |
|------|-------------|--------|
| **设计决策** | 为什么选择方案 X 而不是 Y | 添加到 "Design Decisions" 章节 |
| **项目约定** | 本项目如何做 X | 添加到相关章节并附示例 |
| **新模式** | 发现的可复用做法 | 添加到 "Patterns" 章节 |
| **禁用模式** | 会导致问题的做法 | 添加到 "Anti-patterns" 或 "Don't" 章节 |
| **常见错误** | 容易犯的错误 | 添加到 "Common Mistakes" 章节 |
| **约定** | 已达成一致的标准 | 添加到相关章节 |
| **陷阱** | 非显而易见的行为 | 添加 warning callout |

### 步骤 3：读取目标代码规范

编辑前，读取当前代码规范以便：
- 理解现有结构
- 避免重复内容
- 找到适合更新的位置

```bash
cat .devflow/spec/<category>/<file>.md
```

### 步骤 4：执行更新

遵循这些原则：

1. **具体**：包含具体示例，而不只是抽象规则
2. **解释原因**：说明这会预防什么问题
3. **展示契约**：添加签名、payload 字段和错误行为
4. **展示代码**：为关键模式添加代码片段
5. **保持简短**：每个章节只讲一个概念

### 步骤 5：更新索引（如需要）

如果添加了新章节或代码规范状态发生变化，更新该分类的 `index.md`。

---

## 更新模板

### 基础设施/跨层工作的强制模板

```markdown
## Scenario: <name>

### 1. Scope / Trigger
- Trigger: <why this requires code-spec depth>

### 2. Signatures
- Backend command/API/DB signature(s)

### 3. Contracts
- Request fields (name, type, constraints)
- Response fields (name, type, constraints)
- Environment keys (required/optional)

### 4. Validation & Error Matrix
- <condition> -> <error>

### 5. Good/Base/Bad Cases
- Good: ...
- Base: ...
- Bad: ...

### 6. Tests Required
- Unit/Integration/E2E with assertion points

### 7. Wrong vs Correct
#### Wrong
...
#### Correct
...
```

### 添加设计决策

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

### 添加项目约定

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

### 添加新模式

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

### 添加禁用模式

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

### 添加常见错误

```markdown
### Common Mistake: Description

**Symptom**: What goes wrong

**Cause**: Why this happens

**Fix**: How to correct it

**Prevention**: How to avoid it in the future
```

### 添加陷阱

```markdown
> **Warning**: Brief description of the non-obvious behavior.
>
> Details about when this happens and how to handle it.
```

---

## 交互模式

如果不确定要更新什么，回答这些提示：

1. **你刚完成了什么？**
   - [ ] 修复 bug
   - [ ] 实现功能
   - [ ] 重构代码
   - [ ] 讨论方案

2. **你学到或决定了什么？**
   - 设计决策（为什么选择 X 而不是 Y）
   - 项目约定（我们如何做 X）
   - 非显而易见行为（陷阱）
   - 更好的做法（模式）

3. **未来 AI/开发者需要知道吗？**
   - 为了理解代码如何工作 -> 是，更新规范
   - 为了维护或扩展功能 -> 是，更新规范
   - 为了避免重复犯错 -> 是，更新规范
   - 纯一次性实现细节 -> 可以跳过

4. **它关联哪个区域？**
   - [ ] 后端代码
   - [ ] 前端代码
   - [ ] 跨层数据流
   - [ ] 代码组织/复用
   - [ ] 质量/测试

---

## 质量清单

完成代码规范更新前：

- [ ] 内容是否具体且可执行？
- [ ] 是否包含代码示例？
- [ ] 是否解释了原因，而不只是说明内容？
- [ ] 是否包含可执行签名/契约？
- [ ] 是否包含验证和错误矩阵？
- [ ] 是否包含 Good/Base/Bad 案例？
- [ ] 是否包含带断言点的必需测试？
- [ ] 是否放在正确的代码规范文件中？
- [ ] 是否重复已有内容？
- [ ] 新团队成员能否理解？

---

## 与其他命令的关系

```
Development Flow:
  Learn something → {{CMD_REF:update-spec}} → Knowledge captured
       ↑                                  ↓
  {{CMD_REF:break-loop}} ←──────────────────── Future sessions benefit
  (deep bug analysis)
```

- `{{CMD_REF:break-loop}}` - 深入分析 bug，通常会揭示需要更新的规范
- `{{CMD_REF:update-spec}}` - 实际执行更新
- `{{CMD_REF:finish-work}}` - 提醒你检查是否需要更新规范

---

## 核心理念

> **代码规范是活文档。每次调试、每个“顿悟”时刻，都是让实现契约更清晰的机会。**

目标是形成**组织记忆**：
- 一个人学到的内容，所有人都能受益
- AI 在一个会话中学到的内容，会延续到未来会话
- 错误会变成有文档记录的护栏
