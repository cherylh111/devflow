# 本地工作区记忆系统

`.devflow/workspace/` 存储跨会话记忆。它的用途是让 AI 和人类了解不同窗口、不同日期之前发生过什么。

## 目录结构

```text
.devflow/workspace/
├── index.md
└── <developer>/
    ├── index.md
    ├── journal-1.md
    └── journal-2.md
```

| 文件 | 用途 |
| --- | --- |
| `.devflow/.developer` | 当前开发者身份。 |
| `.devflow/workspace/index.md` | 全局工作区概览。 |
| `.devflow/workspace/<developer>/index.md` | 某个开发者的会话索引。 |
| `.devflow/workspace/<developer>/journal-N.md` | 会话日志。 |

## 开发者身份

首次运行：

```bash
python3 ./.devflow/scripts/init_developer.py <name>
```

这会创建 `.devflow/.developer` 和对应工作区目录。AI 不应随意更改开发者身份；如果身份错误，先确认当前是谁在使用项目。

## 日志

`journal-N.md` 记录每个会话中已完成或部分完成的工作。默认情况下，每个日志约容纳 2000 行；超过后轮转到下一个文件。

记录会话的常用命令：

```bash
python3 ./.devflow/scripts/add_session.py \
  --title "Session title" \
  --summary "What changed" \
  --commit "abc1234"
```

没有提交的规划或评审工作也可以用 `--no-commit` 或空提交值记录。

## 工作区记忆与任务的关系

| 系统 | 存储内容 |
| --- | --- |
| `.devflow/tasks/` | 特定任务的需求、设计、研究和状态。 |
| `.devflow/workspace/` | 跨任务、跨会话的工作记录。 |
| `.devflow/spec/` | 作为长期约定保留的工程知识。 |

如果信息只对当前任务有用，把它放进任务目录。  
如果信息描述当前会话发生了什么，把它放进工作区日志。  
如果信息在未来每次写代码时都应遵循，把它放进规范。

## 本地定制点

| 需求 | 编辑位置 |
| --- | --- |
| 更改最大日志行数 | `.devflow/config.yaml` 中的 `max_journal_lines`。 |
| 更改会话自动提交消息 | `.devflow/config.yaml` 中的 `session_commit_message`。 |
| 更改会话内容格式 | `.devflow/scripts/add_session.py`。 |
| 更改工作区在上下文中的展示方式 | `.devflow/scripts/common/session_context.py`。 |

## AI 使用规则

AI 不应把工作区当作唯一事实来源。恢复任务时，先读当前任务，再用工作区了解背景。任务完成后，在工作区记录重要过程笔记；如果出现长期规则，则更新规范。
