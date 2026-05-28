# 本地 DevFlow 架构概览

`devflow-meta` 面向已经运行过 `devflow init` 的用户项目。用户机器上通常只有通过 npm 安装的 `devflow` 命令，以及项目内生成的 DevFlow 文件；未必有 DevFlow CLI 源码。

因此，当 AI 使用此技能时，默认定制目标是用户项目内的本地文件：

- `.devflow/`：工作流、任务、规范、记忆、脚本和运行时状态。
- 平台目录：`.claude/`、`.codex/`、`.cursor/`、`.opencode/`、`.kiro/`、`.gemini/`、`.qoder/`、`.codebuddy/`、`.github/`、`.factory/`、`.pi/`、`.kilocode/`、`.agent/`、`.windsurf/` 以及类似目录。
- 共享技能层：`.agents/skills/`。

不要默认引导用户 fork DevFlow CLI 仓库。只有当用户明确表示要修改 DevFlow 上游源码、发布 npm 包或贡献 PR 时，才把上游源码当作操作目标。

## 本地系统模型

DevFlow 在用户项目内提供三层：

1. **工作流层**：`.devflow/workflow.md` 定义阶段、路由、下一步动作和提示块。
2. **持久化层**：`.devflow/tasks/`、`.devflow/spec/` 和 `.devflow/workspace/` 存储任务、规范和会话记忆。
3. **平台集成层**：平台目录中的 hooks、settings、agents、skills、commands、prompts 和 workflows 将 DevFlow 工作流连接到不同 AI 工具。

这三层都位于用户项目内部，因此 AI 可以直接读取和修改它们。

## 核心路径

| 路径 | 用途 |
| --- | --- |
| `.devflow/workflow.md` | 工作流阶段、技能路由和 workflow-state 提示块。 |
| `.devflow/config.yaml` | 项目配置、任务生命周期 hooks、monorepo 包配置和日志配置。 |
| `.devflow/spec/` | 用户项目专属的编码约定和思考指南。 |
| `.devflow/tasks/` | 每个任务的 PRD、技术说明、研究文件和 JSONL 上下文。 |
| `.devflow/workspace/` | 每个开发者的日志和跨会话记忆。 |
| `.devflow/scripts/` | 命令、hooks 和上下文注入使用的本地 Python 运行时。 |
| `.devflow/.runtime/` | 会话级运行时状态，例如当前任务指针。 |
| `.devflow/.template-hashes.json` | DevFlow 管理文件的模板哈希，update 用它判断本地文件是否被用户修改。 |

## AI 定制原则

1. **先找到本地事实来源**：不要凭记忆编辑。先阅读 `.devflow/workflow.md`、`.devflow/config.yaml`、相关平台目录和相关任务文件。
2. **编辑用户项目，而不是 npm 包缓存**：修改项目内生成的文件，不要改 `node_modules` 或全局 npm 安装目录。
3. **让平台文件与 `.devflow/` 保持一致**：如果工作流路由变化，也要检查平台技能或命令是否仍描述同一流程。
4. **把项目专属规则放进 `.devflow/spec/` 或本地技能**：不要把团队约定写进 `devflow-meta`。
5. **保留用户改动**：如果文件已被本地修改，就基于当前内容工作，不要用默认模板覆盖它。

## 如何使用此目录

- 若要了解 init 后存在哪些文件，阅读 `generated-files.md`。
- 若要更改阶段、路由或下一步动作，阅读 `workflow.md`。
- 若要更改任务模型、JSONL 上下文或活动任务行为，阅读 `task-system.md`。
- 若要更改编码约定注入，阅读 `spec-system.md`。
- 若要了解日志和跨会话记忆，阅读 `workspace-memory.md`。
- 若要更改 hooks 或子代理上下文加载，阅读 `context-injection.md`。
