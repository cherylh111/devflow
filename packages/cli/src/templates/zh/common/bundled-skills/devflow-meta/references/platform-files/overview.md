# 平台文件概览

DevFlow 将同一套本地架构连接到不同 AI 工具。`.devflow/` 存储共享运行时；平台目录存储适配器文件，定义每个 AI 工具如何进入 DevFlow。

本地 AI 修改 DevFlow 时，应先区分两类文件：

- **共享文件**：`.devflow/workflow.md`、`.devflow/tasks/`、`.devflow/spec/`、`.devflow/scripts/`。
- **平台文件**：`.claude/`、`.codex/`、`.cursor/`、`.opencode/`、`.kiro/`、`.gemini/`、`.qoder/`、`.codebuddy/`、`.github/`、`.factory/`、`.pi/`、`.kilocode/`、`.agent/`、`.windsurf/` 以及类似目录。

平台文件不存储业务状态。它们让对应 AI 工具读取 DevFlow 状态、调用 DevFlow 脚本，并加载 DevFlow skills/agents/hooks。

## 平台文件类别

| 类别 | 常见路径 | 用途 |
| --- | --- | --- |
| settings/config | `.claude/settings.json`, `.codex/hooks.json`, `.qoder/settings.json` | 注册 hooks、plugins、extensions 或平台行为。 |
| hooks/plugins/extensions | `.claude/hooks/`, `.opencode/plugins/`, `.pi/extensions/` | 在会话开始、用户输入、代理启动、shell 执行及类似事件中注入上下文。 |
| agents | `.claude/agents/`, `.codex/agents/`, `.kiro/agents/` | 定义 `devflow-research`、`devflow-implement` 和 `devflow-check`。 |
| skills | `.claude/skills/`, `.agents/skills/`, `.qoder/skills/` | 可自动触发或按需读取的能力说明。 |
| commands/prompts/workflows | `.cursor/commands/`, `.github/prompts/`, `.windsurf/workflows/` | 用户显式调用的入口点。 |

## 三种平台集成模式

### 1. Hook / Extension 驱动

这些平台可以在特定事件触发脚本或插件，并主动向 AI 注入 DevFlow 上下文。

常见能力：

- 会话开始时注入 `.devflow/` 概览。
- 每个用户回合的 workflow-state 提示。
- 子代理启动时注入 PRD/spec/research。
- shell 命令继承会话身份。

若要更改“AI 何时知道什么”，先检查 hooks/plugins/extensions 和 settings。

### 2. Agent Prelude / 拉取式

一些平台无法可靠地让 hooks 重写子代理提示，因此代理文件本身会指示代理在启动后读取活动任务、PRD 和 JSONL 上下文。

若要更改子代理如何加载上下文，检查代理文件本身。

### 3. 主会话工作流

一些平台没有 DevFlow 子代理或 hook 能力。它们依靠 workflows/skills/commands 引导主会话 AI 读取文件、运行脚本并推进任务。

若要更改行为，检查平台 workflows/skills/commands 和 `.devflow/workflow.md`。

## 本地修改顺序

当用户要求为某个平台定制行为时，AI 应按此顺序检查文件：

1. 阅读 `.devflow/workflow.md` 确认共享流程。
2. 阅读目标平台的 settings/config，查看注册了哪些 hooks/agents/skills/commands。
3. 阅读目标平台的 agents/skills/commands/hooks。
4. 修改最接近用户需求的本地文件。
5. 如果变更影响共享流程，同步 `.devflow/workflow.md` 或 `.devflow/spec/`。

不要只修改平台文件而忘记共享工作流。也不要只修改 `.devflow/workflow.md`，却忘记平台入口点可能仍包含旧描述。
