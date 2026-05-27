import type { Argument, Command, Help, Option } from "commander";

import { getTemplateLanguage } from "../templates/language.js";

const ZH_HELP_TEXT: Record<string, string> = {
  "AI-assisted development workflow framework for Cursor, Claude Code and more":
    "面向 Cursor、Claude Code 等工具的 AI 辅助开发工作流框架",
  "display help for command": "显示命令帮助",
  "output the version number": "输出版本号",
  "Initialize devflow in the current project": "在当前项目初始化 DevFlow",
  "Include Cursor commands": "包含 Cursor 命令",
  "Include Claude Code commands": "包含 Claude Code 命令",
  "Include OpenCode commands": "包含 OpenCode 命令",
  "Include Codex skills": "包含 Codex skill",
  "Include Kilo CLI commands": "包含 Kilo CLI 命令",
  "Include Kiro Code skills": "包含 Kiro Code skill",
  "Include Gemini CLI commands": "包含 Gemini CLI 命令",
  "Include Antigravity workflows": "包含 Antigravity 工作流",
  "Include Windsurf workflows": "包含 Windsurf 工作流",
  "Include Qoder commands": "包含 Qoder 命令",
  "Include CodeBuddy commands": "包含 CodeBuddy 命令",
  "Include GitHub Copilot hooks": "包含 GitHub Copilot hook",
  "Include Factory Droid commands": "包含 Factory Droid 命令",
  "Include Pi Agent extension assets": "包含 Pi Agent 扩展资源",
  "Template language: en or zh": "模板语言：en 或 zh",
  "Skip prompts and use defaults": "跳过提示并使用默认值",
  "Initialize developer identity with specified name": "使用指定名称初始化开发者身份",
  "Overwrite existing files without asking": "不询问，直接覆盖已有文件",
  "Skip existing files without asking": "不询问，跳过已有文件",
  "Force monorepo mode": "强制使用 monorepo 模式",
  "Skip monorepo detection": "跳过 monorepo 检测",
  "Use a remote spec template (e.g., electron-fullstack)":
    "使用远程 spec 模板（例如 electron-fullstack）",
  "Overwrite existing spec directory when using template":
    "使用模板时覆盖已有 spec 目录",
  "Only add missing files when using template": "使用模板时只添加缺失文件",
  "Use a custom template registry (e.g., gh:myorg/myrepo/specs)":
    "使用自定义模板 registry（例如 gh:myorg/myrepo/specs）",
  "Workflow template id for .devflow/workflow.md (default: native; e.g., tdd, channel-driven-subagent-dispatch)":
    ".devflow/workflow.md 的工作流模板 id（默认：native，例如 tdd、channel-driven-subagent-dispatch）",
  "Custom marketplace source for the --workflow lookup (e.g., gh:myorg/myrepo/marketplace)":
    "--workflow 查询使用的自定义 marketplace 来源（例如 gh:myorg/myrepo/marketplace）",
  "Update devflow configuration and commands to latest version":
    "将 DevFlow 配置和命令更新到最新版本",
  "Preview changes without applying them": "预览变更但不写入",
  "Overwrite all changed files without asking": "不询问，覆盖所有已变更文件",
  "Skip all changed files without asking": "不询问，跳过所有已变更文件",
  "Create .new copies for all changed files": "为所有已变更文件创建 .new 副本",
  "Allow downgrading to an older version": "允许降级到旧版本",
  "Apply pending file migrations (renames/deletions)":
    "应用待处理文件迁移（重命名/删除）",
  "Template language override: en or zh": "覆盖模板语言：en 或 zh",
  "Upgrade the global DevFlow CLI package": "升级全局 DevFlow CLI 包",
  "npm dist-tag or version to install (default follows current channel: latest, beta, or rc)":
    "要安装的 npm dist-tag 或版本（默认跟随当前通道：latest、beta 或 rc）",
  "Print the install command without running it": "只打印安装命令，不执行",
  "Remove all devflow files (managed platform files + .devflow/) from this project":
    "从当前项目移除所有 DevFlow 文件（受管平台文件和 .devflow/）",
  "Skip confirmation prompt": "跳过确认提示",
  "List what would be removed without changing anything":
    "只列出会移除的内容，不实际修改",
  "Search/recall AI conversation history across Claude Code, Codex, OpenCode (run 'devflow mem help' for subcommands and flags)":
    "搜索/召回 Claude Code、Codex、OpenCode 的 AI 会话历史（运行 'devflow mem help' 查看子命令和参数）",
  "subcommand and arguments (list|search|context|extract|projects|help)":
    "子命令和参数（list|search|context|extract|projects|help）",
  "List or switch the project's .devflow/workflow.md template (native, tdd, channel-driven-subagent-dispatch, or marketplace)":
    "列出或切换项目的 .devflow/workflow.md 模板（native、tdd、channel-driven-subagent-dispatch 或 marketplace）",
  "Workflow template id (e.g., native, tdd, channel-driven-subagent-dispatch)":
    "工作流模板 id（例如 native、tdd、channel-driven-subagent-dispatch）",
  "Custom marketplace source (e.g., gh:myorg/myrepo/marketplace)":
    "自定义 marketplace 来源（例如 gh:myorg/myrepo/marketplace）",
  "List available workflow templates and exit": "列出可用工作流模板并退出",
  "Overwrite a modified workflow.md without asking":
    "不询问，覆盖已修改的 workflow.md",
  "Write .devflow/workflow.md.new instead of replacing the active workflow":
    "写入 .devflow/workflow.md.new，而不替换当前工作流",

  "Capture, list, search, and inspect local DevFlow knowledge":
    "采集、列出、搜索和查看本地 DevFlow 知识",
  "Capture a reusable learning into .devflow/spec/guides/learnings.md":
    "将可复用经验记录到 .devflow/spec/guides/learnings.md",
  "Learning category": "经验分类",
  "Comma-separated keywords": "逗号分隔的关键词",
  "Source label": "来源标签",
  "Attach a task ref; use --task current to resolve active task":
    "关联任务引用；使用 --task current 解析当前任务",
  "Related package": "相关包",
  "Related layer": "相关层",
  "Confidence label": "置信度标签",
  "List/search row limit": "列表/搜索行数上限",
  "Load DevFlow spec knowledge by filters": "按过滤条件加载 DevFlow spec 知识",
  "List structured knowledge entries": "列出结构化知识条目",
  "Search specs, task artifacts, journals, and learning entries":
    "搜索 spec、任务产物、日志和经验条目",
  "Filter by category": "按分类过滤",
  "Filter by exact keyword": "按精确关键词过滤",
  "learning|knowhow|spec|task|journal|spec-entry|markdown":
    "learning|knowhow|spec|task|journal|spec-entry|markdown",
  "Filter knowhow tool specs": "过滤 knowhow tool spec",
  "Maximum rows": "最大行数",
  "Output JSON": "输出 JSON",
  "Load spec knowledge by package, layer, category, or keyword":
    "按包、层级、分类或关键词加载 spec 知识",
  "Show a knowledge entry by id": "按 id 查看知识条目",
  "Load one or more knowledge entries by id": "按 id 加载一个或多个知识条目",
  "Create a structured local knowledge entry under .devflow/spec/wiki":
    "在 .devflow/spec/wiki 下创建结构化本地知识条目",
  "Entry type, e.g. spec, learning, note": "条目类型，例如 spec、learning、note",
  "Kebab-case slug": "kebab-case slug",
  "Entry title": "条目标题",
  "Inline body text": "内联正文文本",
  "Read body text from a file": "从文件读取正文文本",
  "Entry category": "条目分类",
  "Entry status": "条目状态",
  "Parent knowledge id": "父级知识 id",
  "Comma-separated related ids": "逗号分隔的相关 id",
  "Update a structured local knowledge entry": "更新结构化本地知识条目",
  "New title": "新标题",
  "New body text": "新正文文本",
  "Read new body text from a file": "从文件读取新正文文本",
  "Delete a generated knowledge document or remove a structured entry":
    "删除生成的知识文档或移除结构化条目",
  "Append a structured <spec-entry> to a markdown knowledge container":
    "向 markdown 知识容器追加结构化 <spec-entry>",
  "Entry type": "条目类型",
  "Remove a structured <spec-entry> by id": "按 id 移除结构化 <spec-entry>",
  "Package spec directory name": "包级 spec 目录名",
  "Layer directory name, e.g. backend or frontend":
    "层级目录名，例如 backend 或 frontend",
  "Filter structured entries by category": "按分类过滤结构化条目",
  "Filter structured entries by exact keyword": "按精确关键词过滤结构化条目",
  "Include only tool-spec knowhow entries": "仅包含 tool-spec knowhow 条目",
  "Check malformed spec entries and duplicate ids": "检查格式错误的 spec 条目和重复 id",
  "Dump local knowledge graph forward links, backlinks, and unresolved wikilinks":
    "导出本地知识图谱的正向链接、反向链接和未解析 wikilink",
  "List knowledge documents with no incoming or outgoing graph links":
    "列出没有入站或出站图谱链接的知识文档",
  "List top knowledge graph hubs by incoming link count":
    "按入站链接数列出知识图谱核心节点",
  "Show documents linking to this knowledge id or title":
    "显示链接到此知识 id 或标题的文档",
  "Show documents this knowledge id or title links to":
    "显示此知识 id 或标题链接到的文档",
  "Show graph connectivity health score": "显示图谱连通性健康评分",
  "Suggest related links that would improve local knowledge graph connectivity":
    "建议可改善本地知识图谱连通性的相关链接",
  "Limit to collection, entry type, category, or document shape":
    "限制为集合、条目类型、分类或文档形态",
  "Minimum score from 0.0 to 1.0": "最小分数，范围 0.0 到 1.0",
  "Maximum suggestions": "最大建议数",
  "Apply suggested related metadata to structured spec-entry sources":
    "将建议的 related 元数据应用到结构化 spec-entry 源",
  "Write a markdown report; defaults to the active task research dir":
    "写入 markdown 报告；默认写入当前任务 research 目录",
  "Record a reusable meta-learning about this connection pass":
    "记录关于本次连接分析的可复用元经验",
  "Find knowledge graph cleanup issues and optionally remove broken related metadata":
    "查找知识图谱清理问题，并可选择移除损坏的 related 元数据",
  "Age threshold for stale draft entries": "过期草稿条目的天数阈值",
  "Remove broken related metadata from structured spec-entry sources":
    "从结构化 spec-entry 源移除损坏的 related 元数据",
  "Synthesize local knowledge into themes, gaps, and recommended actions":
    "将本地知识综合为主题、缺口和建议行动",
  "Only include entries updated within this many days":
    "仅包含最近指定天数内更新的条目",
  "brief|full": "brief|full",
  "Maximum primary themes before grouping overflow": "分组溢出前的最大主主题数",
  "Create structured knowledge-gap issue entries": "创建结构化知识缺口 issue 条目",
  "Record a reusable meta-learning about this digest":
    "记录关于本次摘要的可复用元经验",
  "Show local knowledge index statistics": "显示本地知识索引统计",
  "Initialize the local .devflow/spec knowledge scaffold":
    "初始化本地 .devflow/spec 知识脚手架",
  "List markdown spec files under .devflow/spec": "列出 .devflow/spec 下的 markdown spec 文件",
  "Show local spec knowledge status": "显示本地 spec 知识状态",
  "Append a structured spec entry to a .devflow/spec markdown file":
    "向 .devflow/spec markdown 文件追加结构化 spec 条目",
  "Target markdown path under .devflow/spec": ".devflow/spec 下的目标 markdown 路径",
  "Spec markdown filename": "Spec markdown 文件名",
  "Create, list, search, and load reusable knowhow entries":
    "创建、列出、搜索和加载可复用 knowhow 条目",
  "Create a reusable knowhow entry": "创建可复用 knowhow 条目",
  "session|tip|template|recipe|reference|decision|asset|blueprint|document":
    "session|tip|template|recipe|reference|decision|asset|blueprint|document",
  "Kebab-case slug; generated from type, time, and title when omitted":
    "kebab-case slug；省略时根据类型、时间和标题生成",
  "Programming language for template entries": "模板条目的编程语言",
  "Original source reference for reference entries": "reference 条目的原始来源引用",
  "Decision status: proposed|accepted|superseded":
    "决策状态：proposed|accepted|superseded",
  "Asset subtype for asset entries": "asset 条目的子类型",
  "Comma-separated code paths for asset or blueprint entries":
    "asset 或 blueprint 条目的逗号分隔代码路径",
  "Mark this knowhow entry as a tool spec": "将此 knowhow 条目标记为 tool spec",
  "Consumer/spec category for tool discovery": "用于工具发现的 consumer/spec 分类",
  "Comma-separated related knowledge ids": "逗号分隔的相关知识 id",
  "List knowhow entries": "列出 knowhow 条目",
  "Filter by knowhow subtype": "按 knowhow 子类型过滤",
  "Search knowhow entries": "搜索 knowhow 条目",
  "View a knowhow entry": "查看 knowhow 条目",

  "Multi-agent collaboration runtime — spawn / coordinate / interrupt worker agents through a shared event log":
    "多 Agent 协作运行时：通过共享事件日志启动、协调和中断 worker agent",
  "Create a new channel (collaboration session)": "创建新 channel（协作会话）",
  "channel scope: project | global": "channel 作用域：project | global",
  "channel type: chat | forum": "channel 类型：chat | forum",
  "associated DevFlow task directory": "关联的 DevFlow 任务目录",
  "project slug": "项目 slug",
  "comma-separated labels": "逗号分隔的标签",
  "stable channel description": "稳定的 channel 描述",
  "absolute file path attached as channel context (repeatable)":
    "作为 channel context 附加的绝对文件路径（可重复）",
  "raw channel context text (repeatable)": "原始 channel context 文本（可重复）",
  "[deprecated alias for --context-file] absolute file path (repeatable)":
    "[已弃用的 --context-file 别名] 绝对文件路径（可重复）",
  "[deprecated alias for --context-raw] raw context text (repeatable)":
    "[已弃用的 --context-raw 别名] 原始 context 文本（可重复）",
  "working directory recorded in the create event": "记录到 create 事件中的工作目录",
  "agent name recorded as the creator": "记录为创建者的 agent 名称",
  "overwrite existing channel with the same name": "覆盖同名已有 channel",
  "mark as ephemeral — hidden from `channel list` by default and cleanable via `channel prune --ephemeral`":
    "标记为临时 channel：默认从 `channel list` 隐藏，可通过 `channel prune --ephemeral` 清理",
  "Send a message into the channel": "向 channel 发送消息",
  "agent name sending": "发送消息的 agent 名称",
  "comma-separated target agents (default: broadcast)": "逗号分隔的目标 agent（默认广播）",
  "read message body from stdin": "从 stdin 读取消息正文",
  "read message body from file": "从文件读取消息正文",
  "targeted delivery validation: appendOnly | requireKnownWorker | requireRunningWorker":
    "定向投递校验：appendOnly | requireKnownWorker | requireRunningWorker",
  "inline text body (otherwise use --stdin / --text-file)":
    "内联文本正文（否则使用 --stdin / --text-file）",
  "Block until an event matching the filter arrives, or timeout":
    "阻塞直到匹配过滤条件的事件到达或超时",
  "agent name waiting": "等待事件的 agent 名称",
  "max wait (e.g. 30s, 2m, 1h)": "最大等待时间（例如 30s、2m、1h）",
  "only wake on events from these agents (CSV)": "仅被这些 agent 的事件唤醒（CSV）",
  "only wake on these event kinds (CSV, OR semantics)":
    "仅被这些事件类型唤醒（CSV，OR 语义）",
  "only wake on this thread key": "仅被此 thread key 唤醒",
  "only wake on this thread action": "仅被此 thread action 唤醒",
  "only wake on events targeted to this name (default: own agent)":
    "仅被投递给此名称的事件唤醒（默认：自身 agent）",
  "also wake on progress events": "也被 progress 事件唤醒",
  "wait until each agent in --from has produced a matching event (default: first match wins)":
    "等待 --from 中每个 agent 都产生匹配事件（默认：首个匹配即返回）",
  "Interrupt a worker turn and send a replacement instruction":
    "中断 worker 回合并发送替代指令",
  "agent name requesting the interrupt": "请求中断的 agent 名称",
  "target worker name": "目标 worker 名称",
  "read interrupt message body from stdin": "从 stdin 读取中断消息正文",
  "read interrupt message body from file": "从文件读取中断消息正文",
  "inline interrupt message (otherwise use --stdin / --text-file)":
    "内联中断消息（否则使用 --stdin / --text-file）",
  "Register a worker (claude/codex) into the channel — the worker stays idle until the first `channel send --to <worker>` arrives":
    "将 worker（claude/codex）注册到 channel；worker 会保持空闲，直到第一个 `channel send --to <worker>` 到达",
  "load .devflow/agents/<name>.md (sets default --provider / --model / system prompt)":
    "加载 .devflow/agents/<name>.md（设置默认 --provider / --model / system prompt）",
  "worker provider: claude | codex (overrides agent)":
    "worker provider：claude | codex（覆盖 agent）",
  "worker name in the channel (default: <agent-name> if --agent is set)":
    "channel 中的 worker 名称（设置 --agent 时默认使用 <agent-name>）",
  "worker working directory (default: process cwd)": "worker 工作目录（默认：process cwd）",
  "model override": "覆盖模型",
  "resume an existing session/thread id": "恢复已有 session/thread id",
  "auto-kill worker after this duration (e.g. 30m, 1h, 7200s)":
    "超过此时长后自动终止 worker（例如 30m、1h、7200s）",
  "emit supervisor_warning before timeout (default 5m; 0ms disables)":
    "超时前发送 supervisor_warning（默认 5m；0ms 禁用）",
  "include a file's content as context in the worker's system prompt (glob supported, repeatable)":
    "将文件内容作为 context 加入 worker system prompt（支持 glob，可重复）",
  "parse a DevFlow jsonl manifest ({file, reason} per line) and include each referenced file (repeatable)":
    "解析 DevFlow jsonl manifest（每行 {file, reason}）并加入引用文件（可重复）",
  "identity recorded as the spawn author (defaults to DEVFLOW_CHANNEL_AS env or 'main')":
    "记录为 spawn 作者的身份（默认 DEVFLOW_CHANNEL_AS 环境变量或 'main'）",
  "worker inbox delivery policy: explicitOnly | broadcastAndExplicit (default explicitOnly)":
    "worker inbox 投递策略：explicitOnly | broadcastAndExplicit（默认 explicitOnly）",
  "OOM-guard idle-cleanup TTL for this worker (default 5m; 0 disables)":
    "此 worker 的 OOM 保护空闲清理 TTL（默认 5m；0 禁用）",
  "spawn-time live-worker budget for this project/scope (default 6; 0 disables)":
    "此项目/作用域的 spawn 时 live worker 预算（默认 6；0 禁用）",
  "One-shot: create ephemeral channel, spawn worker, send prompt, wait done, print final answer, cleanup":
    "一次性运行：创建临时 channel、启动 worker、发送 prompt、等待完成、打印最终回答并清理",
  "load .devflow/agents/<name>.md (sets default --provider / --as / system prompt)":
    "加载 .devflow/agents/<name>.md（设置默认 --provider / --as / system prompt）",
  "worker name (default: agent name if --agent set)":
    "worker 名称（设置 --agent 时默认使用 agent 名称）",
  "worker working directory": "worker 工作目录",
  "include a file as context (glob supported, repeatable)":
    "将文件作为 context 加入（支持 glob，可重复）",
  "parse a DevFlow jsonl manifest and include each referenced file (repeatable)":
    "解析 DevFlow jsonl manifest 并加入每个引用文件（可重复）",
  "inline prompt text": "内联 prompt 文本",
  "read prompt body from file": "从文件读取 prompt 正文",
  "read prompt body from stdin": "从 stdin 读取 prompt 正文",
  "max time to wait for done (e.g. 30s, 5m, 1h; default 5m)":
    "等待完成的最长时间（例如 30s、5m、1h；默认 5m）",
  "Kill workers and delete a channel directory entirely":
    "终止 worker 并完整删除 channel 目录",
  "Bulk-remove channels by criteria (defaults to dry-run preview)":
    "按条件批量移除 channel（默认预览，不删除）",
  "remove all channels (except live ones and --keep)":
    "移除所有 channel（live channel 和 --keep 除外）",
  "remove channels with no activity (only create event)":
    "移除无活动 channel（只有 create 事件）",
  "remove channels whose last event is older than this (e.g. 1h, 7d)":
    "移除最后事件早于指定时长的 channel（例如 1h、7d）",
  "remove only channels marked `--ephemeral` at create time":
    "仅移除创建时标记为 `--ephemeral` 的 channel",
  "actually delete (default is dry-run)": "实际删除（默认只预览）",
  "show what would be removed without deleting": "显示将移除的内容但不删除",
  "comma-separated channel names to keep regardless": "始终保留的逗号分隔 channel 名称",
  "List channels in ~/.devflow/channels/ with worker / activity summary":
    "列出 ~/.devflow/channels/ 中的 channel 及 worker/活动摘要",
  "emit JSON instead of a formatted table": "输出 JSON 而不是格式化表格",
  "filter channels whose `task` field contains this substring":
    "过滤 `task` 字段包含此子串的 channel",
  "include ephemeral channels (default: hide channels marked ephemeral)":
    "包含临时 channel（默认隐藏标记为 ephemeral 的 channel）",
  "scan every project bucket (default: only the current cwd's project)":
    "扫描每个项目 bucket（默认只扫描当前 cwd 项目）",
  "View messages and events in the channel": "查看 channel 中的消息和事件",
  "print raw JSON (one event per line)": "打印原始 JSON（每行一个事件）",
  "stream new events as they arrive (Ctrl-C to stop)":
    "流式输出新到达事件（Ctrl-C 停止）",
  "show only the last N matching events": "仅显示最后 N 个匹配事件",
  "only events with seq > N": "仅显示 seq > N 的事件",
  "filter by event kind (e.g. message, done, killed)":
    "按事件类型过滤（例如 message、done、killed）",
  "filter by author (CSV)": "按作者过滤（CSV）",
  "filter by routing target": "按路由目标过滤",
  "filter by thread key": "按 thread key 过滤",
  "filter by thread action": "按 thread action 过滤",
  "hide progress events (tool calls, deltas)": "隐藏 progress 事件（tool call、delta）",
  "Stop a worker in the channel (SIGTERM, or SIGKILL with --force)":
    "停止 channel 中的 worker（SIGTERM，或使用 --force 发送 SIGKILL）",
  "worker agent name": "worker agent 名称",
  "skip graceful shutdown, send SIGKILL immediately":
    "跳过优雅关闭，立即发送 SIGKILL",
  "Append a structured thread event to a forum channel":
    "向 forum channel 追加结构化 thread 事件",
  "agent name posting": "发帖 agent 名称",
  "thread key (required except opened)": "thread key（opened 以外必填）",
  "thread title": "thread 标题",
  "event body": "事件正文",
  "read event body from stdin": "从 stdin 读取事件正文",
  "read event body from file": "从文件读取事件正文",
  "stable thread description": "稳定的 thread 描述",
  "thread status": "thread 状态",
  "replace thread labels": "替换 thread 标签",
  "replace thread assignees": "替换 thread assignee",
  "thread summary": "thread 摘要",
  "absolute file path attached as thread context (repeatable)":
    "作为 thread context 附加的绝对文件路径（可重复）",
  "raw thread context text (repeatable)": "原始 thread context 文本（可重复）",
  "List threads in a forum channel": "列出 forum channel 中的 thread",
  "filter by thread status": "按 thread 状态过滤",
  "print raw reduced thread JSON": "打印原始 reduced thread JSON",
  "Show or mutate one thread timeline": "查看或修改一个 thread timeline",
  "channel name": "channel 名称",
  "thread key": "thread key",
  "print raw thread events": "打印原始 thread 事件",
  "Rename a thread inside a forum channel": "重命名 forum channel 中的 thread",
  "agent name": "agent 名称",
  "Manage channel-level or thread-level context entries":
    "管理 channel 级或 thread 级 context 条目",
  "mutate thread-level context instead of channel-level":
    "修改 thread 级 context，而不是 channel 级 context",
  "absolute file path (repeatable)": "绝对文件路径（可重复）",
  "raw text entry (repeatable)": "原始文本条目（可重复）",
  "Add context entries": "添加 context 条目",
  "Delete context entries": "删除 context 条目",
  "List projected current context entries": "列出投影后的当前 context 条目",
  "show thread-level context instead of channel-level":
    "显示 thread 级 context，而不是 channel 级 context",
  "print one context entry JSON per line": "每行打印一个 context 条目 JSON",
  "Set or clear the channel display title": "设置或清除 channel 显示标题",
  "Set the channel display title": "设置 channel 显示标题",
  "display title": "显示标题",
  "Clear the channel display title": "清除 channel 显示标题",
  "[internal] supervisor process entry point — do not invoke directly":
    "[内部] supervisor 进程入口，请勿直接调用",
  "[dev] Run a recorded trace through the parser and print events":
    "[开发] 用 parser 运行已记录 trace 并打印事件",
};

export function localizeHelpText(text: string): string {
  if (getTemplateLanguage() !== "zh") return text;
  return ZH_HELP_TEXT[text] ?? text;
}

export function applyCommanderLocalization(command: Command): void {
  if (getTemplateLanguage() !== "zh") return;
  localizeCommand(command);
}

function localizeCommand(command: Command): void {
  const description = command.description();
  if (description) command.description(localizeHelpText(description));

  localizeOptions(command.options);
  localizeArguments(command.registeredArguments);

  if (command.name() !== "mem") {
    command.helpOption("-h, --help", localizeHelpText("display help for command"));
  }
  command.configureHelp({ formatHelp: formatChineseHelp });

  for (const child of command.commands) {
    localizeCommand(child);
  }
}

function localizeOptions(options: readonly Option[]): void {
  for (const option of options) {
    option.description = localizeHelpText(option.description);
  }
}

function formatChineseHelp(cmd: Command, helper: Help): string {
  const termWidth = helper.padWidth(cmd, helper);
  const helpWidth = helper.helpWidth ?? 80;
  const itemIndentWidth = 2;
  const itemSeparatorWidth = 2;

  function formatItem(term: string, description: string): string {
    if (description) {
      const fullText = `${term.padEnd(termWidth + itemSeparatorWidth)}${description}`;
      return helper.wrap(
        fullText,
        helpWidth - itemIndentWidth,
        termWidth + itemSeparatorWidth,
      );
    }
    return term;
  }

  function formatList(textArray: string[]): string {
    return textArray.join("\n").replace(/^/gm, " ".repeat(itemIndentWidth));
  }

  let output = [`用法：${helper.commandUsage(cmd)}`, ""];

  const commandDescription = helper.commandDescription(cmd);
  if (commandDescription.length > 0) {
    output = output.concat([helper.wrap(commandDescription, helpWidth, 0), ""]);
  }

  const argumentList = helper.visibleArguments(cmd).map((argument) =>
    formatItem(
      helper.argumentTerm(argument),
      helper.argumentDescription(argument),
    ),
  );
  if (argumentList.length > 0) {
    output = output.concat(["参数：", formatList(argumentList), ""]);
  }

  const optionList = helper.visibleOptions(cmd).map((option) =>
    formatItem(helper.optionTerm(option), helper.optionDescription(option)),
  );
  if (optionList.length > 0) {
    output = output.concat(["选项：", formatList(optionList), ""]);
  }

  if (helper.showGlobalOptions) {
    const globalOptionList = helper.visibleGlobalOptions(cmd).map((option) =>
      formatItem(helper.optionTerm(option), helper.optionDescription(option)),
    );
    if (globalOptionList.length > 0) {
      output = output.concat(["全局选项：", formatList(globalOptionList), ""]);
    }
  }

  const commandList = helper.visibleCommands(cmd).map((child) =>
    formatItem(
      helper.subcommandTerm(child),
      helper.subcommandDescription(child),
    ),
  );
  if (commandList.length > 0) {
    output = output.concat(["命令：", formatList(commandList), ""]);
  }

  return output.join("\n");
}

function localizeArguments(args: readonly Argument[]): void {
  for (const arg of args) {
    arg.description = localizeHelpText(arg.description);
  }
}
