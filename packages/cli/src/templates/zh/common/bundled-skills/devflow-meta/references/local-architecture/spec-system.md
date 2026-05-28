# 本地规范系统

`.devflow/spec/` 是用户项目专属的工程规范库。DevFlow 不是让 AI 记住约定，而是在正确时机注入相关规范，或要求 AI 阅读它们。

## 目录模型

常见单仓库结构：

```text
.devflow/spec/
├── backend/
│   ├── index.md
│   └── ...
├── frontend/
│   ├── index.md
│   └── ...
└── guides/
    ├── index.md
    └── ...
```

常见 monorepo 结构：

```text
.devflow/spec/
├── cli/
│   ├── backend/
│   │   ├── index.md
│   │   └── ...
│   └── unit-test/
│       ├── index.md
│       └── ...
├── docs-site/
│   └── docs/
│       ├── index.md
│       └── ...
└── guides/
    ├── index.md
    └── ...
```

`index.md` 是每个层级的入口。它应列出 Pre-Development Checklist 和 Quality Check。具体指南放在同一目录的其他 Markdown 文件中。

## 包配置

`.devflow/config.yaml` 可以声明包：

```yaml
packages:
  cli:
    path: packages/cli
  docs-site:
    path: docs-site
    type: submodule
default_package: cli
```

AI 可以运行：

```bash
python3 ./.devflow/scripts/get_context.py --mode packages
```

此命令会列出当前项目的包和规范层级。配置上下文 JSONL 时，以该输出为参考。

## 规范如何进入任务

任务进入实现前，如果任务除了任务产物外还需要规范或研究上下文，规划阶段可以将相关规范写入 `implement.jsonl` / `check.jsonl`：

```jsonl
{"file": ".devflow/spec/cli/backend/index.md", "reason": "CLI backend conventions"}
{"file": ".devflow/spec/cli/unit-test/conventions.md", "reason": "Test expectations"}
```

子代理或平台 prelude 会读取这些 JSONL 文件并加载引用的规范。在不支持子代理的平台上，AI 应按工作流直接读取相关规范。

## 规范应包含什么

规范应包含项目可执行的工程约定，而不是通用最佳实践：

- 文件应该放在哪里。
- 错误处理应如何表达。
- API、hooks 和命令的输入/输出契约。
- 被禁止的模式。
- 需要测试的场景。
- 项目特定陷阱及规避方式。

当 AI 在实现或调试期间学到新规则时，应更新 `.devflow/spec/`，而不是只在聊天中总结。

## 本地定制点

| 需求 | 编辑位置 |
| --- | --- |
| 添加新规范层级 | `.devflow/spec/<package>/<layer>/index.md` 和对应指南文件。 |
| 更改 monorepo 规范映射 | `.devflow/config.yaml` 中的 `packages` / `default_package` / `spec_scope`。 |
| 更改 AI 实现前读取哪些规范 | 任务的 `implement.jsonl`。 |
| 更改 AI 检查时读取哪些规范 | 任务的 `check.jsonl`。 |
| 更改规范应何时更新 | `.devflow/workflow.md` 中的 Phase 3.3 和 `devflow-update-spec` 技能。 |

## 边界

`.devflow/spec/` 是用户的项目规范，不是 DevFlow 内置模板的永久副本。AI 应鼓励用户根据实际项目代码更新它，而不是把 DevFlow 默认模板当作不可变文档。
