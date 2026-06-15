# DevFlow

DevFlow 是一个面向 AI 辅助开发的工作流框架，适合希望让代理开发过程可规划、可回放、可审查，并能在不同 AI 工具之间复用的团队。

它会在项目内安装一套本地 `.devflow/` 系统，提供：

- 面向任务的规划和执行产物
- 可按需加载的项目规范、Wiki 和知识库
- 面向受支持 AI 工具的 workflow-state hooks 和 skills
- 项目级 trace 历史，以及自动提取的会话洞察
- 基于追加式事件日志的多代理 channel 协作
- 用于 channel 和 task 基础能力的 Core SDK

## 包

| 包 | 用途 |
| --- | --- |
| `@enpd/devflow` | CLI、项目模板、平台配置器、工作流脚本、知识命令和 channel 命令。 |
| `@enpd/devflow-core` | Node SDK，提供 CLI 和下游服务使用的 channel 与 task 领域基础能力。 |

## 环境要求

- Node.js `>=18.17.0`
- `pnpm`
- Python 3，用于生成的 `.devflow/scripts/*.py`
- Git，用于任务归档、开发日志、trace 和自动提交流程

## 安装

在本仓库中进行本地开发：

```bash
pnpm install
pnpm build
```

在使用 DevFlow 的项目中安装 CLI：

```bash
npm install -g @enpd/devflow
```

CLI 二进制命令同时提供 `devflow` 和 `dvf`。

## 初始化项目

在要接入 DevFlow 的项目根目录运行：

```bash
devflow init --codex --claude --cursor
```

按实际使用的 AI 工具选择平台参数：

- `--claude`
- `--cursor`
- `--opencode`
- `--codex`
- `--kilo`
- `--kiro`
- `--gemini`
- `--antigravity`
- `--windsurf`
- `--qoder`
- `--codebuddy`
- `--copilot`
- `--droid`
- `--pi`

常用初始化选项：

```bash
devflow init -y
devflow init --monorepo
devflow init --template electron-fullstack
devflow init --registry gh:myorg/myrepo/specs
```

初始化会创建 `.devflow/`，并为选中的平台生成对应的 hooks、skills、commands、prompts 或 workflows。

## 工作流模型

生成的 `.devflow/workflow.md` 是代理行为的本地事实来源。

默认流程：

1. 规划：分类用户请求，只在获得同意后创建任务；编写 `prd.md`，复杂任务再补充 `design.md` 和 `implement.md`。
2. 执行：基于已确认的产物和相关规范实现。
3. 检查：执行质量审查、lint、type-check 和测试。
4. 沉淀知识：当任务产生可复用经验时，更新 spec、wiki 或 learned knowledge。
5. 先提交实际工作，再进入收尾记录。
6. 收尾：归档任务并记录本次会话。

生成的 hooks 会注入紧凑的 workflow-state 面包屑，让代理知道当前处于哪个阶段。支持 sub-agent 的平台使用任务 JSONL 清单加载 spec 和 research 上下文；inline 平台则直接读取任务产物和规范。

## 任务系统

每个任务位于 `.devflow/tasks/{MM-DD-name}/`，可以包含：

- `task.json`
- `prd.md`
- 可选的 `design.md`
- 可选的 `implement.md`
- 可选的 `research/`
- `implement.jsonl`
- `check.jsonl`

在已接入 DevFlow 的项目中常用的任务命令：

```bash
python3 ./.devflow/scripts/task.py create "Add login" --slug add-login
python3 ./.devflow/scripts/task.py start add-login
python3 ./.devflow/scripts/task.py current --source
python3 ./.devflow/scripts/task.py add-context add-login implement ".devflow/spec/backend/index.md" "Backend rules"
python3 ./.devflow/scripts/task.py validate add-login
python3 ./.devflow/scripts/task.py archive add-login
```

任务支持父子关系和会话级 active task 状态，因此多个 AI 会话可以并行工作，而不会互相覆盖当前任务。

## 规范、Wiki 和知识

`.devflow/spec/` 存放项目专属的工程规则和可复用知识。它属于项目本身，应该随着团队经验持续演进。

常用命令：

```bash
devflow spec init
devflow spec list --layer guides
devflow spec add --layer backend --file quality-guidelines.md --title "Rule" --body "Body"

devflow knowledge learn "Insight to remember" --keywords auth,debug --task current
devflow wiki search auth
devflow wiki load <id>
devflow wiki connect --dry-run --report
devflow wiki cleanup --report
devflow wiki digest auth --report
devflow knowhow add --type recipe --title "Auth setup" --body "..."
```

知识条目使用 Markdown 内的结构化 `<spec-entry>` 块，因此既适合作为文档阅读，也能被搜索和关联。

### Domain Vocabulary

`.devflow/spec/wiki/domain-vocabulary.md` 是项目特定术语的运行时词汇表。在需求探索和设计阶段按需加载，用于保持术语一致性。

格式：`**Term**: definition. _Avoid_: synonyms`

仅添加项目特定术语（如领域概念），不添加通用编程术语。

### Architecture Decision Records (ADR)

`docs/adr/` 存放架构决策记录。DevFlow 提供 ADR 模板和示例，使用 3-condition 过滤器判断决策是否值得记录：

1. 难以逆转（改变需要 > 1 周）
2. 缺乏上下文会令人惊讶
3. 真实权衡的结果

ADR 使用极简格式：1-3 句话描述背景、决策和原因。可选章节包括状态、考虑的选项和后果。

## Trace 和会话洞察

DevFlow 区分个人会话日志和项目级历史：

- Journal：每位开发者自己的会话叙事，位于 `.devflow/workspace/<developer>/`。
- Trace：跨任务、跨开发者的事件历史，位于 `.devflow/agent-traces/trace.jsonl`。
- Session insight：finish-work 时自动提取的重点洞察，写入 `.devflow/spec/wiki/session-insight/`。

当 `task.py archive` 运行时，DevFlow 会追加一个可回放的 trace 事件，记录：

- 任务路径和标题
- 任务存在的原因
- 引用过的 specs
- 可用时的审查元数据
- 相关文件
- 可用时的 commits 和 changed files

当 `add_session.py` 记录 finish-work 日志时，DevFlow 会为本次 finish-work 归档的每个任务创建一个 session-insight wiki 条目。洞察提取器会读取任务产物、已记录的 commit diff、变更文件和日志摘要，用来捕捉关键决策、坑点和不变量，而不依赖开发者手动记忆知识更新。

## Channel 运行时

`devflow channel` 提供基于追加式事件日志的多代理协作运行时。

常用命令：

```bash
devflow channel create review --type threads --task .devflow/tasks/05-26-demo
devflow channel send review --as main --to checker "Please review the task."
devflow channel wait review --as main --from checker --tag final_answer --timeout 5m
devflow channel messages review --last 20
devflow channel spawn review --provider codex --as checker --jsonl .devflow/tasks/05-26-demo/check.jsonl
devflow channel run --provider codex --message "Summarize this repository"
```

Thread channels 还支持结构化 thread 事件、thread context、channel context、标题、剪枝和 worker 生命周期管理。

## Core SDK

`@enpd/devflow-core` 为 Node 使用方导出 channel 和 task 基础能力。

Channel 导出包括：

- 事件 schema 和 type guards
- channel metadata reducers
- thread reducers 和 timeline helpers
- create、send、post、read、watch、context APIs

Task 导出包括：

- 标准 task record schema
- task record 读写 helpers
- task 目录校验
- task phase 推断

示例：

```ts
import { createChannel, sendMessage, inferTaskPhase } from "@enpd/devflow-core";
```

## 更新或移除 DevFlow

更新生成的项目文件：

```bash
devflow update
devflow update --dry-run
devflow update --migrate
```

升级全局 CLI：

```bash
devflow upgrade
devflow upgrade --tag beta
```

从项目中移除 DevFlow 管理的文件：

```bash
devflow uninstall --dry-run
devflow uninstall -y
```

## 开发

仓库内常用命令：

```bash
pnpm build
pnpm test
pnpm lint
pnpm typecheck
pnpm --filter @enpd/devflow test
pnpm --filter @enpd/devflow-core test
```

发布辅助命令：

```bash
pnpm release:check
pnpm release:plan
pnpm release:beta
pnpm release:rc
pnpm release
```

发布 CLI 包之前，`packages/cli` 需要根目录存在 `README.md` 和 `LICENSE`，这样 `prepublishOnly` 才能把它们复制到包目录。

## 仓库结构

```text
packages/
  cli/    CLI、模板、平台配置器、命令和生成的工作流脚本
  core/   Core channel 和 task SDK

.devflow/ 项目本地开发工作流
.agents/  本地 Codex/DevFlow skills
```

## 设计原则

- 先规划，再编码。
- 把项目规则写进文件，而不是留在记忆里。
- 让任务历史可回放。
- 把知识当作一等产物。
- 保持生成的工作流文件可更新。
- 在更新过程中保护用户本地修改。
