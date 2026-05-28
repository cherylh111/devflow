---
name: integrate-skill
description: "将外部 skill 适配为 .devflow/spec/ 中的项目专属开发指南。创建指南章节、带 .template 后缀的代码示例模板，并更新 spec 索引。集成外部 skill、把新 skill 的模式加入项目约定，或将第三方 skill 最佳实践纳入 .devflow/spec/ 文档时使用。"
---

# 将 Skill 集成到项目指南

将可复用 skill 适配并集成到项目开发指南中（不是直接集成到项目代码中）。

## 用法

```
$integrate-skill <skill-name>
```

**示例**：
```
$integrate-skill frontend-design
$integrate-skill mcp-builder
```

## 核心原则

> [!] **重要**：skill 集成的目标是更新**开发指南**，而不是直接生成项目代码。
>
> - 指南内容 -> 写入 `.devflow/spec/{target}/doc.md`
> - 代码示例 -> 放到 `.devflow/spec/{target}/examples/skills/<skill-name>/`
> - 示例文件 -> 使用 `.template` 后缀（例如 `component.tsx.template`），避免 IDE 报错
>
> `{target}` 是 `frontend` 或 `backend`，由 skill 类型决定。

## 执行步骤

### 1. 读取 Skill 内容

定位并读取 skill 指令：
- `.agents/skills/<skill-name>/SKILL.md` in the repository
- Skill list in `AGENTS.md` (when available in current context)

如果找不到该 skill，询问用户 source path 或 repository。

### 2. 确定集成目标

根据 skill 类型判断要更新哪些指南：

| Skill 类别 | 集成目标 |
|----------------|-------------------|
| UI/Frontend (`frontend-design`, `web-artifacts-builder`) | `.devflow/spec/frontend/` |
| Backend/API (`mcp-builder`) | `.devflow/spec/backend/` |
| Documentation (`doc-coauthoring`, `docx`, `pdf`) | `.devflow/` or create dedicated guidelines |
| Testing (`webapp-testing`) | `.devflow/spec/frontend/` (E2E) |

### 3. 分析 Skill 内容

从 skill 中提取：
- **核心概念**：skill 如何工作及关键概念。
- **最佳实践**：推荐方法。
- **代码模式**：可复用代码模板。
- **注意事项**：常见问题和解决方案。

### 4. 执行集成

#### 4.1 更新指南文档

向对应 `doc.md` 添加新章节：

```markdown
@@@section:skill-<skill-name>
## # <Skill Name> Integration Guide

### Overview
[Core functionality and use cases of the skill]

### Project Adaptation
[How to use this skill in the current project]

### Usage Steps
1. [Step 1]
2. [Step 2]

### Caveats
- [Project-specific constraints]
- [Differences from default behavior]

### Reference Examples
See `examples/skills/<skill-name>/`

@@@/section:skill-<skill-name>
```

#### 4.2 创建示例目录（如果存在代码示例）

```bash
# 目录结构（{target} = frontend 或 backend）
.devflow/spec/{target}/
|-- doc.md                      # 添加 skill 相关章节
|-- index.md                    # 更新索引
+-- examples/
    +-- skills/
        +-- <skill-name>/
            |-- README.md               # 示例文档
            |-- example-1.ts.template   # 代码示例（使用 .template 后缀）
            +-- example-2.tsx.template
```

**文件命名约定**：
- 代码文件：`<name>.<ext>.template`（例如 `component.tsx.template`）
- 配置文件：`<name>.config.template`（例如 `tailwind.config.template`）
- 文档：`README.md`（普通后缀）

#### 4.3 更新索引文件

添加到 `index.md` 的 Quick Navigation 表：

```markdown
| <Skill-related task> | <Section name> | `skill-<skill-name>` |
```

### 5. 生成集成报告

---

## Skill Integration Report: `<skill-name>`

### # Overview
- **Skill description**: [Functionality description]
- **Integration target**: `.devflow/spec/{target}/`

### # Tech Stack Compatibility

| Skill Requirement | Project Status | Compatibility |
|-------------------|----------------|---------------|
| [Tech 1] | [Project tech] | [OK]/[!]/[X] |

### # Integration Locations

| Type | Path |
|------|------|
| Guidelines doc | `.devflow/spec/{target}/doc.md` (section: `skill-<name>`) |
| Code examples | `.devflow/spec/{target}/examples/skills/<name>/` |
| Index update | `.devflow/spec/{target}/index.md` |

> `{target}` = `frontend` 或 `backend`

### # Dependencies (if needed)

```bash
# Install required dependencies (adjust for your package manager)
npm install <package>
# or
pnpm add <package>
# or
yarn add <package>
```

### [OK] Completed Changes

- [ ] Added `@@@section:skill-<name>` section to `doc.md`
- [ ] Added index entry to `index.md`
- [ ] Created example files in `examples/skills/<name>/`
- [ ] Example files use `.template` suffix

### # Related Guidelines

- [Existing related section IDs]

---

## 6. 可选：创建使用入口 Skill

如果该 skill 经常使用，创建一个快捷 skill：

```bash
$create-command use-<skill-name> Use <skill-name> skill following project guidelines
```

## Common Skill Integration Reference

| Skill | Integration Target | Examples Directory |
|-------|-------------------|-------------------|
| `frontend-design` | `frontend` | `examples/skills/frontend-design/` |
| `mcp-builder` | `backend` | `examples/skills/mcp-builder/` |
| `webapp-testing` | `frontend` | `examples/skills/webapp-testing/` |
| `doc-coauthoring` | `.devflow/` | N/A (documentation workflow only) |

## Example: Integrating `mcp-builder` Skill

### Directory Structure

```
.devflow/spec/backend/
|-- doc.md                           # Add MCP section
|-- index.md                         # Add index entry
+-- examples/
    +-- skills/
        +-- mcp-builder/
            |-- README.md
            |-- server.ts.template
            |-- tools.ts.template
            +-- types.ts.template
```

### New Section in doc.md

```markdown
@@@section:skill-mcp-builder
## # MCP Server Development Guide

### Overview
Create LLM-callable tool services using MCP (Model Context Protocol).

### Project Adaptation
- Place services in a dedicated directory
- Follow existing TypeScript and type definition conventions
- Use project's logging system

### Reference Examples
See `examples/skills/mcp-builder/`

@@@/section:skill-mcp-builder
```
