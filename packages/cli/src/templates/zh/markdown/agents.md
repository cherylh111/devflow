<!-- DEVFLOW:START -->
# Trellis 使用说明

这些说明提供给在本项目中工作的 AI assistant。

本项目由 DevFlow 管理。你需要的工作知识位于 `.devflow/`：

- `.devflow/workflow.md` - 开发阶段、任务创建时机、skill 路由
- `.devflow/spec/` - 按 package 和 layer 组织的编码规范，写代码前必须读取
- `.devflow/workspace/` - 每个开发者的 journal 和会话记录
- `.devflow/tasks/` - 活跃和归档任务，包含 PRD、research、jsonl context

如果当前平台提供 DevFlow 命令，例如 `/devflow:finish-work` 或 `/devflow:continue`，优先使用命令，不要手动重复步骤。并非每个平台都会暴露所有命令。

如果你使用 Codex 或其他支持 agent 的工具，项目级辅助文件也可能位于：

- `.agents/skills/` - 可复用 DevFlow skills
- `.codex/agents/` - 可选自定义 subagents

由 DevFlow 管理。此块外的编辑会保留；此块内的内容可能在未来 `devflow update` 时被覆盖。

<!-- DEVFLOW:END -->
