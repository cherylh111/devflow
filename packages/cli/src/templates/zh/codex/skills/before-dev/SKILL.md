---
name: before-dev
description: "在实现开始前发现并注入 .devflow/spec/ 中的项目编码规范。读取目标 package 的 spec indexes、pre-development checklists 和 shared thinking guides。用于开始新编码任务、写代码前、切换到不同 package，或需要刷新项目约定和标准时。"
---

开始任务前，先读取相关开发规范。

执行这些步骤：

1. **读取当前任务产物**：
   - `prd.md`：需求和验收标准
   - `design.md`：如存在，读取技术设计
   - `implement.md`：如存在，读取执行顺序和验证计划

2. **发现 packages 和对应 spec layers**：
   ```bash
   python3 ./.devflow/scripts/get_context.py --mode packages
   ```

3. **判断哪些 specs 适用于本任务**，依据包括：
   - 正在修改哪个 package（例如 `cli/`、`docs-site/`）
   - 工作类型（backend、frontend、unit-test、docs 等）
   - 任务产物中引用的任何 spec/research 路径

4. **读取每个相关模块的 spec index**：
   ```bash
   cat .devflow/spec/<package>/<layer>/index.md
   ```
   按 index 中的 **"Pre-Development Checklist"** 执行。

5. **读取 Pre-Development Checklist 中列出的、与任务相关的具体 guideline files**。index 不是目标，它指向真正的规范文件（例如 `error-handling.md`、`conventions.md`、`mock-strategies.md`）。读取这些文件以理解编码标准和模式。

6. **始终读取 shared guides**：
   ```bash
   cat .devflow/spec/guides/index.md
   ```

7. 理解必须遵守的编码标准和模式，然后继续执行开发计划。

写任何代码前，本步骤都是**强制要求**。
