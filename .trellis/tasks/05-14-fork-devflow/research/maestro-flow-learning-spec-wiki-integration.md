# Maestro-Flow 学习 / Spec / Wiki 集成到 DevFlow 的迁移研究

日期：2026-05-25

## 目标

研究 `https://github.com/catlog22/maestro-flow` 中学习、spec、wiki 知识体系的实现方式，并提出一个可以迁移集成到 DevFlow 的务实方案，同时不破坏 DevFlow 当前继承自 Trellis 的任务工作流。

本文是方案研究文档，不是实现补丁。

## 证据来源

本次检查的一手证据：

- Maestro-Flow 仓库根目录 GitHub Contents API：
  `https://api.github.com/repos/catlog22/maestro-flow/contents/`
- Maestro-Flow 递归文件树 GitHub Git Trees API：
  `https://api.github.com/repos/catlog22/maestro-flow/git/trees/master?recursive=1`
- Maestro-Flow README：
  `https://raw.githubusercontent.com/catlog22/maestro-flow/master/README.zh-CN.md`
- Maestro-Flow 学习工作流：
  `https://raw.githubusercontent.com/catlog22/maestro-flow/master/workflows/learn.md`
- Maestro-Flow spec 加载工作流：
  `https://raw.githubusercontent.com/catlog22/maestro-flow/master/workflows/specs-load.md`
- Maestro-Flow wiki 管理工作流：
  `https://raw.githubusercontent.com/catlog22/maestro-flow/master/workflows/wiki-manage.md`
- Maestro-Flow 学习工具指南：
  `https://raw.githubusercontent.com/catlog22/maestro-flow/master/guide/learn-tools-guide.md`
- DevFlow 本地源码：
  - `packages/cli/src/cli/index.ts`
  - `packages/cli/src/utils/template-fetcher.ts`
  - `packages/cli/src/utils/template-hash.ts`
  - `packages/cli/src/templates/devflow/workflow.md`
  - `.trellis/workflow.md`

网络限制说明：

- 本机执行 `git clone --depth 1` 克隆 Maestro-Flow 时出现超时 / 连接重置。
- GitHub API 和部分 raw 文件下载成功，因此本研究以这些来源作为较强证据。
- 部分 raw 文件在本次会话中无法稳定访问，尤其是 `guide/spec-system-guide.md`。因此，关于 spec hook 内部实现的结论主要来自递归文件树和已成功下载的工作流文件，而不是完整本地 clone。

## DevFlow 当前基线

DevFlow 当前仍然是 Trellis 风格的项目工作流：

- 运行时数据位于 `.devflow/`。
- `devflow init` 后，项目编码规范位于 `.devflow/spec/`。
- 任务状态位于 `.devflow/tasks/`，包含 PRD、design、implement、check 等任务产物。
- 会话日志位于 `.devflow/workspace/<developer>/`。
- `get_context.py --mode packages` 负责发现 package 和 spec layer。
- `devflow-before-dev` 在编辑前加载相关 spec。
- `devflow-update-spec` 把新发现的项目约定写回 `.devflow/spec/`。
- `devflow init --template` 可以把远程 spec 模板下载到 `.devflow/spec/`。
- `template-hash.ts` 明确把 `.devflow/spec/`、`tasks/`、`workspace/` 排除在模板 hash 跟踪之外，意味着这些目录下的知识被视为项目自有数据。

当前重要限制：

- DevFlow 目前没有一等的 `devflow spec`、`devflow learn` 或 `devflow wiki` 命令组。
- DevFlow 有 `devflow mem` 用于搜索 AI 对话历史，也有 `devflow channel` 用于 agent 协作，但二者都不是覆盖 `.devflow/spec/`、任务产物和 journal 的项目知识图谱。
- DevFlow 的远程模板下载器虽然有 `skill` 和 `command` 的通用安装路径，但 `downloadTemplateById()` 当前会拒绝非 `spec` 类型模板。如果未来把 Maestro 风格的知识命令打包成 registry 扩展，这一点需要处理。

## Maestro-Flow 知识模型

### 学习

Maestro-Flow 把深度学习工作流和原子化学习捕获分开：

- `learn-*` 命令是交互式 / 深度学习工具：
  - `learn-retro`
  - `learn-follow`
  - `learn-decompose`
  - `learn-investigate`
  - `learn-second-opinion`
- `manage-learn` 是低摩擦的 capture / list / search / show 工作流。
- 学习洞察会追加写入 `.workflow/specs/learnings.md`。
- 每条洞察都是一个闭合的 `<spec-entry>` 块，带有 `category`、`keywords`、`date`、`id`、`source` 等属性。
- `workflows/learn.md` 说明 `learnings.md` 会由 WikiIndexer 自动索引。
- `learn-tools-guide.md` 说明深度学习工具还会把富报告写到 `.workflow/knowhow/`，而可复用的沉淀洞察会进入 `specs/learnings.md`。

关键设计点：

- 学习不是独立的 memory 孤岛。它被写成 spec 兼容的 entry，然后通过 wiki search/list 暴露出来。这是最值得优先迁移的部分。

### Spec

Maestro-Flow 的 spec 系统比当前 DevFlow 更接近“知识数据库”：

- `workflows/specs-load.md` 支持 scope：
  - `project`
  - `global`
  - `team`
  - `personal`
- 它支持 category：
  - `coding`
  - `arch`
  - `test`
  - `review`
  - `debug`
  - `quality`
  - `learning`
  - `ui`
- 每个 category 映射到一个主 markdown 文件。例如，`learnings.md` 映射到 `learning`。
- 递归文件树显示有配套实现和测试：
  - `src/tools/spec-entry-parser.ts`
  - `src/tools/spec-keyword-index.ts`
  - `src/tools/spec-loader.ts`
  - `src/tools/spec-writer.ts`
  - `src/hooks/keyword-spec-injector.ts`
  - `src/hooks/plugins/spec-injection-plugin.ts`
  - `src/hooks/guards/spec-validator.ts`

关键设计点：

- Maestro 的 spec 系统以 category / scope 为核心。
- DevFlow 当前 spec 系统以 package / layer / task 为核心。
- 直接照搬会和 DevFlow 的工作流冲突。更合适的路线是做兼容适配，而不是替换 `.devflow/spec/`。

### Wiki

Maestro-Flow 把 wiki 作为项目知识的读取、搜索和图谱投影层：

- README 描述了一个支持 BM25 搜索、反向链接遍历和健康评分的 wiki 知识图谱。
- `workflows/wiki-manage.md` 提供：
  - health dashboard
  - search
  - cleanup
  - stats
- 它区分 `spec`、`knowhow`、`note`、`issue` 等 entry 类型。
- 它区分两类维护操作：
  - `wiki-connect` 修复 / 增补现有 entry 之间的链接。
  - `manage-wiki cleanup --fix` 处理坏链接、真正残留的孤儿条目、陈旧条目和空 body。
- 递归文件树显示实现位于：
  - `dashboard/src/server/wiki/search.ts`
  - `dashboard/src/server/wiki/wiki-indexer.ts`
  - `dashboard/src/server/wiki/spec-entry-parser.ts`
  - `dashboard/src/server/wiki/graph-analysis.ts`
  - `dashboard/src/server/wiki/writer.ts`
  - `src/commands/wiki.ts`

关键设计点：

- Wiki 是基于文件的索引 / 投影层，不是 canonical store。
- canonical data 仍然是工作流目录里的 markdown / jsonl 文件。这和 DevFlow 现有的文件型任务产物偏好一致。

## 应该迁移什么

推荐迁移优先级：

1. 先迁移 learning capture 的数据模型。
2. 在 DevFlow 文件上增加轻量本地 wiki index/search。
3. 扩展 DevFlow spec 加载能力，支持 metadata/category filter。
4. 更丰富的 dashboard / MCP / graph 操作放到后续再考虑。

不要原样迁移：

- Maestro 完整的 `.workflow/` 生命周期引擎。DevFlow 已经有自己的任务 phase、PRD/design/implement 产物和 active task routing。
- Maestro 完整 dashboard。它体量大，并依赖不同的项目模型。
- Maestro 完整多 agent 命令目录。当前 devflow fork 已经有意保留更小的平台 / 模板表面。

## 建议的 DevFlow 目标模型

### 存储布局

保留 DevFlow 当前 canonical 目录：

```text
.devflow/
  spec/
    guides/
      learnings.md          # 新增，append-only 的项目级学习条目
      wiki-index.md         # 后续可选的生成型 / 人类可读索引
    <package>/<layer>/
      *.md                  # 现有 package/layer specs
  tasks/
    <task>/
      research/
      prd.md
      design.md
      implement.md
  workspace/
    <developer>/
      journal-*.md
```

MVP 阶段不要引入 `.devflow/knowhow/`。富报告可以先写到 active task 的 `research/` 目录，或 `.devflow/workspace/<dev>/`。等 DevFlow 对新的知识目录有明确保留策略后，再考虑独立 knowhow 目录。

理由：

- `.devflow/spec/`、`.devflow/tasks/`、`.devflow/workspace/` 已经被排除在模板 hash 跟踪之外。
- `trellis-before-dev` 已经总是读取 shared guides，因此 `.devflow/spec/guides/learnings.md` 是自然的项目级位置。
- 把 learning 存在 spec 体系里，可以避免新增一个必须手动记住的 AI context 来源。

### 条目格式

复用 Maestro 的 `<spec-entry>` 形状，但定义 DevFlow 自己拥有的子集：

```markdown
<spec-entry
  id="DFL-20260525-a1b2c3d4"
  type="learning"
  category="gotcha"
  keywords="windows,encoding,hook"
  source="manual"
  task="05-14-fork-devflow"
  date="2026-05-25"
>

### Windows hook 输出需要显式 UTF-8 处理

简短正文，包含证据、影响和建议规则。

</spec-entry>
```

必需属性：

- `id`
- `type`
- `category`
- `keywords`
- `source`
- `date`

DevFlow 可选属性：

- `task`
- `package`
- `layer`
- `confidence`
- `derived_from`

为什么保留 `<spec-entry>`：

- 它已经在 Maestro-Flow 中被验证过，并且容易解析。
- 它可以和普通 markdown 文件共存。
- 它允许未来 wiki/spec loader 抽取结构化 entry，而不需要接管整个文件格式。

### CLI 表面

先增加一个 CLI group：

```bash
devflow knowledge learn "<insight>" [--category <name>] [--keywords a,b] [--task current]
devflow knowledge list [--category <name>] [--keyword <word>] [--limit 20]
devflow knowledge search "<query>" [--type learning|spec|task|journal]
devflow knowledge show <id>
devflow knowledge health
```

MVP 之后再考虑 alias：

```bash
devflow learn ...
devflow wiki ...
devflow spec ...
```

为什么先做一个 `knowledge` group：

- 避免同时增加三个半成品顶层命令组。
- 让 store、parser、search index 先在一个 API 后面稳定下来。
- 保持 “wiki” 作为投影概念，而不是另一个 canonical write path。

### Skill 表面

等 CLI store 存在后，再增加 DevFlow skills：

- `devflow-learn`：围绕 `devflow knowledge learn/list/search/show` 的薄封装。
- `devflow-spec-load`：按 package/layer/category 加载 `.devflow/spec/`。
- `devflow-wiki`：基于本地 knowledge index 做 search/health。

第一版实现不要依赖宿主特定的 slash command。DevFlow 当前支持多个平台，并且这个 fork 已经有意移除部分平台。CLI / runtime scripts 应该拥有行为，平台 command / skill 只做 wrapper。

## 集成架构

### 数据流

学习捕获：

```text
User / AI insight
  -> devflow knowledge learn
  -> normalize category/keywords/task/package metadata
  -> append <spec-entry> to .devflow/spec/guides/learnings.md
  -> optional index refresh
  -> confirmation with ID and follow-up commands
```

知识搜索：

```text
.devflow/spec/**/*.md
.devflow/tasks/**/*.md
.devflow/workspace/**/journal-*.md
  -> scanner
  -> document/entry projection
  -> in-memory BM25-like ranking for MVP
  -> result list with file path, type, title, score, snippet
```

Spec 加载：

```text
task context + package/layer selection
  -> existing get_context.py package/spec discovery
  -> optional category/keyword filter
  -> selected markdown files and extracted <spec-entry> blocks
  -> skill/agent prompt context
```

### 实现位置

推荐初始代码位置：

- `packages/cli/src/commands/knowledge/`
- `packages/cli/src/commands/knowledge/store.ts`
- `packages/cli/src/commands/knowledge/spec-entry.ts`
- `packages/cli/src/commands/knowledge/search.ts`
- `packages/cli/src/commands/knowledge/index.ts`
- 测试放在 `packages/cli/test/commands/knowledge*.test.ts`

理由：

- DevFlow 已经有 TypeScript CLI 基础设施。
- CLI 可以用 Vitest 测试，不需要启动宿主 agent。
- runtime Python scripts 应继续聚焦 task/session context。除非后续 `get_context.py` 需要暴露 knowledge summary，否则不应先把这块逻辑塞进 Python runtime。

CLI MVP 之后的模板变更：

- `init` 时增加 `.devflow/spec/guides/learnings.md` scaffold。
- 在 `.devflow/spec/guides/index.md` 中增加说明。
- 在 `workflow.md` 的 Phase 3 增加提醒：当任务产生了可复用知识、但它还不是稳定编码规则时，可以记录 learning entry。

### Parser 规则

从保守 parser 开始：

- 只解析闭合的 `<spec-entry ...> ... </spec-entry>` 块。
- 属性值必须带引号。
- 未知属性保留。
- malformed block 在 `health` 中发出 warning，但不要让 search 失败。
- body markdown 原样保留。
- ID 在被扫描项目中必须唯一；重复 ID 是 health warning。

避免：

- 把 YAML frontmatter 作为唯一 metadata 形状。DevFlow spec 文件已经大量使用普通 markdown，嵌入式 entry 更少打扰。
- MVP 阶段引入数据库。文件型数据更容易检查、diff，也更容易在 `devflow update` 中保留。

### 搜索规则

MVP search 可以保持本地、轻依赖：

- 对 title/body/keywords/path 做 tokenization。
- exact keyword match 的权重高于 body term。
- 当 query 命中 metadata 时，提升 `<spec-entry>` match 相对 whole-file match 的权重。
- 尽可能返回 file path 和 line number。

后续再做：

- 如果搜索质量确实重要，再引入真正的 BM25 实现。
- 基于 markdown links 和 `related` metadata 增加 backlink graph。
- 只有在测量到性能问题后，才加入生成型 `.devflow/.runtime/knowledge-index.json` cache。

## Maestro-Flow 概念到 DevFlow 的映射

| Maestro-Flow | DevFlow 目标 | 说明 |
| --- | --- | --- |
| `.workflow/specs/learnings.md` | `.devflow/spec/guides/learnings.md` | 保留 append-only learning store；目录改到 DevFlow spec root。 |
| `.workflow/knowhow/KNW-*.md` | 先放 active task 的 `research/` | MVP 避免新增 retention directory。 |
| `<spec-entry>` | 同一标签，DevFlow 子集 | 最好的兼容点。 |
| `manage-learn` | `devflow knowledge learn` + `devflow-learn` skill | CLI 拥有行为，skill 做封装。 |
| `spec load --scope --category` | 后续 `devflow knowledge/spec load --package --layer --category` | DevFlow 应保持 package/layer 优先。 |
| `WikiIndexer` | 本地 scanner/search projection | 针对 DevFlow 文件建索引，不新增 canonical store。 |
| `wiki-connect` | 后续 `devflow knowledge connect` | 非 MVP；需要先定义 link metadata policy。 |
| `manage-wiki health` | `devflow knowledge health` | 对 malformed entries / duplicate IDs 很有早期价值。 |

## 分阶段计划

### Phase 1：学习存储 MVP

交付物：

- 只针对学习条目的 `devflow knowledge learn/list/show/search`。
- `spec-entry` parser 和 writer。
- `.devflow/spec/guides/learnings.md` init scaffold。
- 测试 append、duplicate IDs、malformed blocks、keyword/category filters 和 Windows path normalization。

验收标准：

- 用户可以在 DevFlow project 内捕获一条 learning。
- entry 会出现在 `.devflow/spec/guides/learnings.md`。
- `list`、`show`、`search` 不依赖宿主特定命令即可取回该 entry。
- `devflow update` 不会覆盖用户 learning entries。

### Phase 2：Spec 元数据加载

交付物：

- 给 DevFlow spec docs 增加可选的 `category` metadata 约定。
- 增加 package/layer/category/keyword filters 的 loader 支持。
- 更新 `devflow-before-dev` 和 `devflow-check` 指南：只在相关时加载 `learnings.md`，不要在每个 trivial task 中盲目加载。

验收标准：

- spec context 可以按 package/layer 和 category 选择。
- 当 learning entries 带有相关 package/layer/keywords 时，可以影响 implementation/check。
- 现有 `.devflow/spec/backend` 和 `.devflow/spec/frontend` 文档仍然有效。

### Phase 3：Wiki 投影

交付物：

- `devflow knowledge search` 覆盖 spec、task artifacts 和 journals。
- `devflow knowledge health` 检查 malformed entries、duplicate IDs、empty docs 和 broken local markdown links。
- 给 agent 使用的可选 `--json` 输出。

验收标准：

- 搜索结果引用 file path 和 snippet。
- health command 默认只读。
- 正确性不依赖生成型 cache。

### Phase 4：链接图谱 / 自动连接

交付物：

- 为 entries 定义 `related` metadata 约定。
- `devflow knowledge connect --dry-run` 用于建议链接。
- 只有当 dry-run 输出稳定、且测试覆盖写行为后，才增加 `--fix`。

验收标准：

- link suggestions 是确定性的。
- broken link cleanup 永远不删除内容；只有在显式 `--fix` 后才移除 / 标记无效 metadata。

## 风险

- Context bloat：盲目把所有 learnings 注入每个任务会降低 agent 效果。缓解：使用 category/keyword/package filters，并保持默认 `before-dev` 行为聚焦显式相关 spec 文件。
- Format drift：如果 DevFlow 采用 `<spec-entry>` 后又随意扩展属性，search 和 loader 会形成多个私有 contract。缓解：由一个 parser module 拥有格式。
- Update safety：生成型 scaffold 不能覆盖用户 learning/spec 数据。缓解：存放在 `.devflow/spec/` 下，该目录已排除于模板 hash 更新；并增加回归测试。
- Scope conflict：Maestro 有 global/team/personal spec scopes；DevFlow 有 package/layer scopes。缓解：保持 package/layer 优先；只有出现明确需求后再加 personal scope。
- Overmigration：导入 Maestro dashboard/MCP/wiki server 会让 DevFlow 超出当前 fork 意图太多。缓解：先迁移文件格式和小型 CLI projection。

## 推荐下一步任务

创建一个子任务：

`Implement DevFlow knowledge learn MVP`

建议 PRD 验收标准：

- 增加 `devflow knowledge learn/list/show/search`。
- entry 存储到 `.devflow/spec/guides/learnings.md`。
- parse/write `<spec-entry>` blocks。
- 增加 append/list/search/show 和 update preservation 测试。
- 增加 `learnings.md` template scaffold。
- 暂不实现 graph links、dashboard、global/team/personal scopes。

这个下一步任务足够小，可以端到端验证，并能建立 spec 和 wiki 功能后续所需的核心存储 contract。
