# 更改本地 Agents

当用户想更改 `devflow-research`、`devflow-implement` 或 `devflow-check` 行为时，编辑用户项目中的平台 agent 文件。

## 先读取这些文件

1. 目标平台 agent 目录
2. `.devflow/workflow.md` Phase 2 / research routing
3. 当前任务 `prd.md`
4. 当前任务 `implement.jsonl` / `check.jsonl`
5. 相关 hook 或 agent prelude

## 常见路径

| 平台 | 路径 |
| --- | --- |
| Claude Code | `.claude/agents/devflow-*.md` |
| Cursor | `.cursor/agents/devflow-*.md` |
| OpenCode | `.opencode/agents/devflow-*.md` |
| Codex | `.codex/agents/devflow-*.toml` |
| Kiro | `.kiro/agents/devflow-*.json` |
| Gemini CLI | `.gemini/agents/devflow-*.md` |
| Qoder | `.qoder/agents/devflow-*.md` |
| CodeBuddy | `.codebuddy/agents/devflow-*.md` |
| Factory Droid | `.factory/droids/devflow-*.md` |
| Pi Agent | `.pi/agents/devflow-*.md` |

以用户项目中的实际路径为准。

## 常见需求

| 需求 | 要编辑的 agent |
| --- | --- |
| 研究必须写文件，而不只是聊天回复 | `devflow-research` |
| 实现前必须读取某些本地 specs | `devflow-implement` + `implement.jsonl` 配置规则 |
| 检查期间必须运行特定命令 | `devflow-check` |
| Agent 不得修改某些目录 | 对应 agent 的写入边界说明 |
| Agent 输出格式必须固定 | 对应 agent 的最终/报告说明 |

## 修改原则

1. **保留角色边界**：research 调查并持久化；implement 编写实现；check 评审并修复。
2. **不要把项目 specs 硬编码进 agents**：长期 specs 属于 `.devflow/spec/`；agents 负责读取它们。
3. **明确读取顺序**：活动任务 -> PRD -> 信息 -> JSONL -> spec/research。
4. **明确写入边界**：哪些目录可以写，哪些不可以写。
5. **跨平台同步**：当用户配置了多个平台时，判断只改当前平台还是所有平台代理。

## Agent Pull 平台

如果 agent 文件包含“启动后读取任务/上下文”的 prelude，编辑时不要移除这些步骤。否则 agent 将只依赖聊天上下文工作，并绕过 DevFlow 的核心机制。

## Hook Push 平台

如果上下文由 hook 注入，agent 文件仍应保留职责边界。不要仅因为 hook 会注入上下文，就从 agent 中移除 PRD/spec 要求。
