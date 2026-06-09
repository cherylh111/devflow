---
name: devflow-diagnose
description: "在 DevFlow 管理的项目中，对 bug、失败测试、异常行为、错误、崩溃、偶发问题或性能回退执行修复前诊断循环。用于根因尚未被证据证明、但准备改代码之前。"
---

# DevFlow 诊断

在修 bug 之前使用这个 skill，除非根因和修复方案已经有现成证据证明。目标是建立一个快速、确定性的反馈循环，让修复可以被验证，而不是先靠猜测改代码。

这个 skill 与 `devflow-break-loop` 互补：修复前和修复过程中使用 `devflow-diagnose`；当已经多次修复失败，或最终经验需要沉淀为复盘时，再使用 `devflow-break-loop`。

## 对齐任务

1. 解析当前任务：
   ```bash
   {{PYTHON_CMD}} ./.devflow/scripts/task.py current --source
   ```
2. 读取 `prd.md`，再读取存在的 `design.md` 和 `implement.md`。
3. 如果任务中已有调试证据，读取相关 `research/` 笔记。
4. 修改前加载相关 specs；可用时使用 `devflow-before-dev`。

如果没有活动任务，而且这不是一个可以直接回答的小问题，先回到 DevFlow planning，再改代码。

## 建立反馈循环

不要从猜测式修改开始。先创建或找到一个能复现用户可见症状的 pass/fail 循环。

大致按这个顺序尝试：

- 在真实 bug seam 上写失败的 unit 或 integration test
- 带 fixture 输入并断言 stdout/stderr/files 的 CLI 命令
- 针对相关服务的 HTTP 或 API 脚本
- UI 行为用 Playwright 或浏览器自动化
- 回放捕获的 trace、payload、event log 或 fixture
- 围绕最小真实代码路径写一次性 harness
- 对偶发或时序问题使用 stress loop
- 对比旧/新版本、配置或输入的 differential loop

持续改进这个循环，直到它足够快速、清晰、可重复，可以指导修复。如果无法建立有用循环，把尝试过的方法写入任务 `research/` 目录，并向用户请求捕获物、环境访问权限，或添加临时 instrumentation 的许可。

## 复现

运行反馈循环并确认：

- 它展示的是用户报告的同一个失败，而不是相邻问题
- 失败可重复，或对偶发问题来说复现率足够调试
- 症状被具体捕获：错误文本、错误输出、耗时、trace 或状态 diff

不要修了附近另一个问题就宣布完成。

## 提出假设

在测试修复前，列出 3 到 5 个有排序、可证伪的假设。

每个假设都要写清预测：

- 如果这是根因，哪个 probe 应该发生变化？
- 如果这不是根因，什么结果应该保持不变？

当改动有风险，或用户可能有领域知识时，先简短展示假设排序。用户暂时不在时，不要无限等待。

## 加仪表

一次只验证一个假设。

- 优先使用 debugger、REPL、定向断言或窄范围日志，不要“大量打印再 grep”。
- 临时日志使用唯一前缀，例如 `[DEBUG-<short-id>]`。
- 性能回退要先测量再修复：timing harness、profiler、query plan 或可比较 baseline。

除非任务明确决定保留为生产观测，否则 instrumentation 都应是临时的。

## 修复和测试

如果存在正确的回归测试 seam：

1. 把最小复现转成失败的 regression test。
2. 确认它先失败。
3. 应用满足假设的最小修复。
4. 确认 regression test 通过。
5. 重新运行原始反馈循环。

如果没有正确的回归 seam，把它作为发现记录下来。这可能说明存在架构缺口，需要写入 `design.md`、`research/` 或后续任务。

## 清理并沉淀知识

报告完成前：

- 重新运行原始循环，确认症状消失
- 重新运行相关 tests/checks
- 删除所有临时 `[DEBUG-...]` 日志和一次性 harness
- 在任务记录或最终回复中写清被证明的根因
- 当修复揭示可复用规则、契约或预防机制时，更新 `.devflow/spec/`
- 如果任务经历了多次失败修复，或产生了更广泛的预防经验，使用 `devflow-break-loop`

