# 更改本地规范结构

当用户想更改 AI 遵循的工程约定、添加新规范层级或调整 monorepo 包映射时，编辑 `.devflow/spec/` 和 `.devflow/config.yaml`。

## 先读取这些文件

1. `.devflow/config.yaml`
2. `.devflow/spec/`
3. `.devflow/workflow.md` planning artifact guidance and Phase 3.3
4. Current task `implement.jsonl` / `check.jsonl`

## 常见需求

| 需求 | 编辑位置 |
| --- | --- |
| 添加 backend/frontend/docs/test 规范层级 | `.devflow/spec/<layer>/` 或 `.devflow/spec/<package>/<layer>/` |
| 添加共享思考指南 | `.devflow/spec/guides/` |
| 调整 monorepo packages | `.devflow/config.yaml` 中的 `packages` |
| 更改默认 package | `.devflow/config.yaml` 中的 `default_package` |
| 控制 spec 扫描范围 | `.devflow/config.yaml` 中的 `spec_scope` |
| 让任务读取新 spec | 任务 `implement.jsonl` / `check.jsonl` |

## 添加 Spec 层级

单仓库示例：

```text
.devflow/spec/security/
├── index.md
└── auth.md
```

Monorepo 示例：

```text
.devflow/spec/webapp/security/
├── index.md
└── auth.md
```

`index.md` 应包括：

- 此层级适用于哪些代码。
- Pre-Development Checklist.
- Quality Check.
- 指向具体指南文件的链接。

## 更新上下文

添加 spec 并不意味着每个任务会自动读取它。当前任务必须在 JSONL 中引用它：

```bash
python3 ./.devflow/scripts/task.py add-context <task> implement ".devflow/spec/webapp/security/index.md" "Security conventions"
python3 ./.devflow/scripts/task.py add-context <task> check ".devflow/spec/webapp/security/index.md" "Security review rules"
```

## 更改 Monorepo Packages

`.devflow/config.yaml` 示例：

```yaml
packages:
  webapp:
    path: apps/web
  api:
    path: apps/api
default_package: webapp
```

编辑后运行：

```bash
python3 ./.devflow/scripts/get_context.py --mode packages
```

使用此输出确认 AI 能看到正确的 packages 和 spec 层级。

## 说明

- Specs 是用户项目约定，可以根据项目需要更改。
- 不要把临时任务信息放进 specs；临时信息应放在任务中。
- 不要只把长期约定放在 agents 或 commands 中；应保存在 specs 中。
- 更改 spec 结构后，检查现有任务 JSONL 文件是否仍指向存在的文件。
