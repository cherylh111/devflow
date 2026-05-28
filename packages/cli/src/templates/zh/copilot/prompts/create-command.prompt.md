---
description: "DevFlow Copilot 提示：创建新的 Copilot Prompt"
---

# 创建新的 Copilot Prompt

在 `.github/prompts/` 中创建新的 Copilot slash-command prompt 文件。

## 用法

```
/create-command <command-name> <description>
```

示例：

```
/create-command review-pr Check PR code changes against project guidelines
```

## 执行步骤

### 1. 解析输入

从用户输入中提取：
- Command 名称：必须是 kebab-case（示例：`review-pr`）
- 描述：一句话说明用途

### 2. 分析需求

分类 command 意图：
- 初始化
- 开发前检查
- 质量检查
- 会话记录
- 生成 / 自动化

### 3. 生成 Prompt 内容

创建简洁、可执行的 Markdown 内容。

简单 prompt 形态：

```markdown
Single clear instruction with expected output.
```

复杂 prompt 形态：

```markdown
# Prompt Title

Short purpose.

## Steps

### 1. Step One
Concrete action.

### 2. Step Two
Concrete action.

## Output

Expected output format.
```

### 4. 创建 Prompt 文件

写入文件：

- `.github/prompts/<command-name>.prompt.md`

如果文件已存在，比较内容，并且只有在用户要求覆盖时才更新。

### 5. 确认结果

输出：

```
[OK] Created Copilot Prompt: /<command-name>

File path:
- .github/prompts/<command-name>.prompt.md

Usage:
/<command-name>

Description:
<description>
```

## 内容质量指南

好的 prompt 特征：
1. 清晰简洁
2. 无需额外解释即可执行
3. 范围恰当
4. 必要时定义预期输出

避免：
1. 意图模糊（示例："optimize code"）
2. 指令过长且混合多个目标
3. 无理由重复已有 prompt 行为

## 命名约定

| Prompt 类型 | 前缀 | 示例 |
|------------|--------|---------|
| 会话启动 | `start` | `start` |
| 开发前 | `before-` | `before-dev` |
| 检查 | `check-` | `check` |
| 记录 | `record-` | `record-session` |
| 生成 | `generate-` | `generate-api-doc` |
| 更新 | `update-` | `update-changelog` |
| 其他 | 动词优先 | `review-code`, `sync-data` |
