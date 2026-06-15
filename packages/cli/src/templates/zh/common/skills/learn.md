当任务产生了可复用知识，且这些知识应在对话压缩后继续可用时，使用此 skill。

DevFlow 会把轻量学习内容以 `<spec-entry>` block 形式存入 `.devflow/spec/guides/learnings.md`。已安装项目使用本地 Python 脚本完成常规知识捕获、搜索和加载；全局 `devflow` CLI 只在需要这里未列出的高级维护命令时使用。

## 捕获

对于以后有用、但尚不足以成为强制编码规则的观察，使用已安装的 Python 脚本记录。

```bash
python3 ./.devflow/scripts/knowledge.py learn "<insight>" --category learning --keywords keyword1,keyword2 --task current
python3 ./.devflow/scripts/knowledge.py learn "<small useful note>" --category tip --keywords keyword1,keyword2
python3 ./.devflow/scripts/knowledge.py list --keyword keyword1
python3 ./.devflow/scripts/knowledge.py search "<query>"
python3 ./.devflow/scripts/knowledge.py show <id>
```

适合记录的内容：

- 实现或调试期间发现的坑
- 反复出现的工作流决策
- 后续应能搜索到的项目特定注意事项
- 尚不适合进入更严格 package/layer spec 的精简经验
- 应进入特定 `.devflow/spec/` markdown 文件的硬性实现或评审规则
- 应进入结构化知识的较长 recipe、reference、decision、template、asset 或 session handoff

**项目特定领域术语**：当捕获具有项目特定含义的术语时，考虑改为更新 `.devflow/spec/wiki/domain-vocabulary.md`：

- 检查术语是否已存在
- 如果是新术语，使用以下格式添加：`**术语**: 定义。 _避免_: 同义词`
- 只添加项目特定术语，不添加通用编程概念
- 示例："订单"（领域概念）vs "函数"（通用概念）

**架构决策**：当捕获架构经验时，检查是否通过 ADR 3-condition 过滤器：

1. 难以逆转？（改变需要 > 1 周）
2. 缺乏上下文会令人惊讶？（未来读者会疑惑为什么）
3. 真实权衡的结果？（存在真实的替代方案）

如果三个条件都满足，在 `docs/adr/NNNN-slug.md` 中创建 ADR，而不仅仅是添加到 learnings。

如果学习内容是 agent 在实现期间必须遵守的硬性约定，使用 `devflow-update-spec` 或直接编辑相关 `.devflow/spec/` guide。本地脚本用于可复用知识条目，不用于大范围改写 spec。

## 查询

依赖记忆前先使用这些命令：

```bash
python3 ./.devflow/scripts/knowledge.py list --keyword <word>
python3 ./.devflow/scripts/knowledge.py search "<query>"
python3 ./.devflow/scripts/knowledge.py show <id>
python3 ./.devflow/scripts/knowledge.py load <id>
python3 ./.devflow/scripts/knowledge.py health
python3 ./.devflow/scripts/knowledge.py stats
python3 ./.devflow/scripts/knowledge.py list --type knowhow
python3 ./.devflow/scripts/knowledge.py search "<query>" --type knowhow
```

优先做聚焦搜索，而不是把整份文件加载进上下文。当条目格式错误或重复 ID 可能导致搜索结果缺失时，使用 `health`。高级 wiki CRUD、graph connection、cleanup、digest 和 spec-add 操作是仅 CLI 提供的维护界面；只有在已安装 Python 脚本不够用时才谨慎使用。

## 注入任务

当某个搜索结果是 implementation 或 check sub-agent 的必需上下文时，把 entry id 加入任务 JSONL manifest，而不是复制整份 markdown 文件：

```bash
python3 ./.devflow/scripts/knowledge.py search "<query>"
python3 ./.devflow/scripts/knowledge.py load <id>
python3 ./.devflow/scripts/task.py add-context "$TASK_DIR" implement "knowledge:<id>" "<reason>"
python3 ./.devflow/scripts/task.py add-context "$TASK_DIR" check "knowledge:<id>" "<reason>"
```

当选中的条目来自 wiki knowledge 时，可以使用 `wiki:<id>` 作为等价简写。基于 hook 的平台会自动注入这些条目；pull-based 平台继续前必须对每个 JSONL knowledge entry 运行 `python3 ./.devflow/scripts/knowledge.py load <id>`。
