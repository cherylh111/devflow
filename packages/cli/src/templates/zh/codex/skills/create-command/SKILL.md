---
name: create-command
description: "按正确命名约定和结构搭建新的 skill 文件。分析需求以确定 skill 类型并生成合适内容。添加新的开发者工作流 skill、创建自定义 skill 或扩展 DevFlow skill 集时使用。"
---

# 创建新 Skill

根据用户需求，在 `.agents/skills/<skill-name>/SKILL.md` 中创建新的 Codex skill。

## 用法

```bash
$create-command <skill-name> <description>
```

**示例**：
```bash
$create-command review-pr Check PR code changes against project guidelines
```

## 执行步骤

### 1. 解析输入

从用户输入中提取：
- **Skill 名称**：使用 kebab-case（例如 `review-pr`）
- **描述**：该 skill 应完成什么

### 2. 分析需求

根据描述确定 skill 类型：
- **初始化**：读取文档，建立上下文
- **开发前**：读取指南，检查依赖
- **代码检查**：验证代码质量和指南合规性
- **记录**：记录进度、问题、结构变更
- **生成**：生成文档或代码模板

### 3. 生成 Skill 内容

最小 `SKILL.md` 结构：

```markdown
---
name: <skill-name>
description: "<description>"
---

# <Skill Title>

<Instructions for when and how to use this skill>
```

### 4. 创建文件

创建：
- `.agents/skills/<skill-name>/SKILL.md`

### 5. 确认创建

输出结果：

```text
[OK] Created Skill: <skill-name>

File path:
- .agents/skills/<skill-name>/SKILL.md

Usage:
- Trigger directly with $<skill-name>
- Or open /skills and select it

Description:
<description>
```

## Skill 内容指南

### [OK] 好的 skill 内容

1. **清晰简洁**：能立即理解
2. **可执行**：AI 可直接按步骤执行
3. **范围明确**：清楚说明做什么和不做什么
4. **有输出**：必要时指定预期输出格式

### [X] 避免

1. **过于模糊**：例如 "optimize code"
2. **过于复杂**：单个 skill 不应超过 100 行
3. **重复功能**：先检查是否已有类似 skill

## 命名约定

| Skill 类型 | 前缀 | 示例 |
|------------|--------|---------|
| 会话启动 | `start` | `start` |
| 开发前 | `before-` | `before-dev` |
| 检查 | `check-` | `check` |
| 记录 | `record-` | `record-session` |
| 生成 | `generate-` | `generate-api-doc` |
| 更新 | `update-` | `update-changelog` |
| 其他 | 动词优先 | `review-code`, `sync-data` |
