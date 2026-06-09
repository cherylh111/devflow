# 规范任务规划

默认执行模型使用单个代理。代理可以创建 DevFlow tasks 以便追踪，但该技能不应要求特定平台、CLI 或并行 worker 模型。

## 拆分方式

围绕真实所有权边界创建规范工作单元：

- 当某个包有自己的约定时，以一个包为单位。
- 当同一个包有不同 frontend、backend、CLI、worker 或 shared-library 规则时，以一个层级为单位。
- 当某个模式跨越多个包且不由单一层级拥有时，写一个横切 guide。

避免人为拆分。小型 library 通常只需要一次聚焦的规范梳理，而不是多个任务。

## 任务形状

当 DevFlow task 有用时，编写包含这些章节的简洁 PRD：

```markdown
# Fill <package-or-layer> DevFlow Specs

## Goal
Write project-specific `.devflow/spec/` guidance for <scope>.

## Scope
- Spec directory:
- Source directories to inspect:
- Tests to inspect:
- Out of scope:

## Architecture Context
Summarize the concrete findings from repository analysis.

## Files To Create Or Update
- `.devflow/spec/.../index.md`
- `.devflow/spec/.../<topic>.md`

## Rules
- Adapt the spec file set to the real codebase.
- Use real source examples with file paths.
- Remove template-only sections that do not apply.
- Do not modify product source code unless the task explicitly asks for it.

## Acceptance Criteria
- [ ] Specs contain concrete examples and anti-patterns from the repository.
- [ ] No placeholder text remains.
- [ ] Index files match the final spec files.
- [ ] Claims are backed by source files, tests, or project docs.
```

## 可选辅助代理

如果宿主支持 subagents，辅助代理可以检查独立包或运行验证。它们是可选的。主代理仍负责集成和最终质量。

辅助任务必须有清晰所有权：

- 只读研究任务可以检查分配范围所需的任何源码。
- 写入任务应拥有互不重叠的 spec 目录。
- 验证任务应检查占位符移除、失效链接和一致性。

不要在技能中编码辅助代理名称、供应商专属命令或平台专属路由。只写必要工作和验收标准。

