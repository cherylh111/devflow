---
name: devflow-prototype
description: "在提交实现前构建一次性原型来回答设计问题。用于 DevFlow 规划或研究期间，当可行性不确定、状态模型需要验证、UI 方案需要比较，或用户要求 prototype、mock it up、try a few designs 时。"
---

# DevFlow 原型

原型是用来回答问题的一次性代码。问题决定原型形态。

## 前置条件

只在 Phase 1 规划或研究中使用这个 skill。如果实现已经开始，先针对具体子问题回到规划再做原型。

先解析活动任务：

```bash
{{PYTHON_CMD}} ./.devflow/scripts/task.py current --source
```

读取任务 `prd.md`，再读取存在的 `design.md`、`implement.md` 和 `research/` notes。

如果代码检查、现有测试或简短设计说明已经能回答问题，不要做原型。

## 选择分支

根据问题选择原型形态：

- 逻辑问题：使用 [LOGIC.md](LOGIC.md) 处理状态机、解析器、算法、生命周期规则或边界情况。
- UI 问题：使用 [UI.md](UI.md) 比较布局、交互或多个视觉方案。

如果问题模糊，默认跟随周围代码：backend 或 CLI 模块使用逻辑分支；页面和组件使用 UI 分支。把这个假设写进 findings。

## 构建规则

1. 明确把工作命名为原型。
2. 放在生产路径之外，或靠近被探索代码并加上明确原型标记。
3. 提供一个项目原生命令来运行。
4. 默认把状态保存在内存中，除非持久化正是问题。
5. 跳过打磨：不写大范围测试、不抽象、不做生产级错误处理。
6. 每次操作或交互后展示相关完整状态。

## 捕获发现

离开原型前写下可持久保存的答案：

基于这个 skill 的 `prototype-findings-template.md` 创建 `.devflow/tasks/TASK_DIR/research/prototype-SLUG-findings.md`。

填写：

- 正在回答的问题；
- 收集到的证据；
- 哪些有效、哪些失败，以及原因；
- 真实实现要采用的决策；
- 原型代码已删除、临时保留或已重写。

默认只有答案值得保留。

## 清理决策

结束会话前，做出一个明确决策：

- 删除原型代码。
- 临时保留，并在旁边添加 `PROTOTYPE-DELETE-ME.md`，写明截止日期和负责人。
- 在 Phase 2 中用正常测试、错误处理和 specs 正式重写已验证方案。

不要让原型代码悄悄变成生产代码。
