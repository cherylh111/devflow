---
description: "DevFlow Copilot prompt: check.prompt"
---

# 代码质量检查

对最近写入的代码做完整质量验证，覆盖 spec 合规、跨层安全和提交前检查。

---

## 第 1 步：确认改动范围

```bash
git diff --name-only HEAD
git status
```

## 第 2 步：读取任务产物和适用规范

按顺序读取当前任务产物：

- `prd.md`
- `design.md`（如存在）
- `implement.md`（如存在）

```bash
python3 ./.devflow/scripts/get_context.py --mode packages
```

对每个变更涉及的 package/layer，读取 spec index 并执行其中的 **Quality Check** 部分：

```bash
cat .devflow/spec/<package>/<layer>/index.md
```

读取 index 指向的具体规范文件；index 只是入口，不是目标。

## 第 3 步：运行项目检查

运行项目的 lint、type-check 和 test 命令。任何失败都要先修复再继续。

## 第 4 步：按清单复核

### 代码质量

- [ ] Linter 是否通过？
- [ ] Type checker 是否通过？
- [ ] Tests 是否通过？
- [ ] 是否没有遗留调试日志？
- [ ] 是否没有压制 warning 或绕过类型安全？

### 测试覆盖

- [ ] 新函数是否有单元测试？
- [ ] bug fix 是否有回归测试？
- [ ] 行为变化是否更新了现有测试？

### Spec 同步

- [ ] `.devflow/spec/` 是否需要更新？例如新模式、约定或经验教训。

如果修复了 bug 或发现了不明显的规则，判断是否应写入 spec，避免未来重复踩坑。

## 第 5 步：跨层检查（如适用）

如果改动只在单层内，跳过本步。

### 数据流

- [ ] 读取链路是否正确：Storage -> Service -> API -> UI
- [ ] 写入链路是否正确：UI -> API -> Service -> Storage
- [ ] 类型或 schema 是否正确跨层传递？
- [ ] 错误是否正确传播给调用方？

### 代码复用

- [ ] 创建新工具或修改常量前，是否搜索过已有实现？
  ```bash
  grep -r "pattern" src/
  ```
- [ ] 两处以上定义同一概念时，是否抽到共享常量？
- [ ] 批量修改后，是否搜索确认所有位置都已更新？

### 导入和依赖

- [ ] 新文件的 import path 是否正确？
- [ ] 是否没有循环依赖？

### 同层一致性

- [ ] 同一概念在同层其他位置是否保持一致？

---

## 第 6 步：报告并修复

报告发现的问题并直接修复。修复后重新运行项目检查。
