开始写代码前，先读取和本任务相关的开发规范。

执行步骤：

1. **读取当前任务产物**：
   - `prd.md`：需求和验收标准
   - `design.md`：如存在，读取技术设计
   - `implement.md`：如存在，读取执行顺序和验证计划

2. **发现 packages 和 spec layers**：
   ```bash
   python3 ./.devflow/scripts/get_context.py --mode packages
   ```

3. **判断哪些规范适用**，依据包括：
   - 正在修改哪个 package
   - 工作类型（backend、frontend、unit-test、docs 等）
   - 任务产物中引用的 spec/research 路径
   - 聚焦搜索找到的结构化知识：
     ```bash
     python3 ./.devflow/scripts/knowledge.py search "<task topic>"
     python3 ./.devflow/scripts/knowledge.py load <id>
     ```

4. **读取相关模块的 spec index**：
   ```bash
   cat .devflow/spec/<package>/<layer>/index.md
   ```
   按 index 中的 **Pre-Development Checklist** 执行。

5. **读取 checklist 指向的具体规范文件**。index 不是目标，它只是索引。真正的规则通常在 `error-handling.md`、`conventions.md`、`mock-strategies.md` 等文件中。

6. **始终读取 shared guides**：
   ```bash
   cat .devflow/spec/guides/index.md
   ```

7. **为行为变更考虑可选 TDD 路径**：
   - 当任务改变公共行为、API、命令输出、parser/validator 行为、复杂业务逻辑，
     或必须保持既有行为的重构时，使用 test-first。
   - 写测试前，读取相关 `.devflow/spec/<package>/unit-test/` 指南，
     以该 package 的具体测试约定为准。
   - 优先使用垂直 red-green-refactor 循环：先通过公共接口写一个行为测试，
     再添加最小实现，重构，然后重复。
   - 不要为了强行 TDD
     而测试私有实现细节。
   - 对 documentation-only、探索性 prototype、机械重命名、generated-output churn，
     或尚无稳定行为可测的变更，跳过 TDD。

8. 如果某条 knowledge entry 是本任务必需上下文，且后续会运行 sub-agent，把它加入任务上下文清单：
   ```bash
   python3 ./.devflow/scripts/task.py add-context "$TASK_DIR" implement "knowledge:<id>" "<reason>"
   python3 ./.devflow/scripts/task.py add-context "$TASK_DIR" check "knowledge:<id>" "<reason>"
   ```

9. 理解必须遵守的编码标准和项目模式，然后再开始开发。

本步骤在写代码前是强制要求。
