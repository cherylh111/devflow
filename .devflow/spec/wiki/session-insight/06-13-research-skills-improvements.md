<spec-entry
  id="insight-20260613-213351-06-13-research-skills-improvements"
  type="session-insight"
  category="session"
  keywords="session-insight,finish-work,06-13-research-skills-improvements,devflow,diff,spec"
  source="finish-work"
  date="2026-06-13"
  task="06-13-research-skills-improvements"
  package="devflow"
  branch="main"
  commits="ddac45c"
  derived_from=".devflow/tasks/archive/2026-06/06-13-research-skills-improvements"
>

### Skills project deep research and improvement roadmap

#### Summary

Completed comprehensive analysis of 18 patterns from skills project not yet adopted by DevFlow. Identified critical template sync issue (Evidence-first), designed CONTEXT.md/ADR system, and created 4-batch implementation roadmap with 15 prioritized improvements (P0: 3, P1: 7, P2: 5). Delivered 2031-line research report with detailed specs for 6 new skills/guides.

#### Task

- Path: `.devflow/tasks/archive/2026-06/06-13-research-skills-improvements`
- Title: 研究 skills 项目并提取可改进部分
- Why: 在 06-09 研究基础上深入分析 skills 项目中 DevFlow 尚未吸收的思想和模式，产出按优先级排序的改进建议报告。

#### Commits

- `ddac45c`

#### Changed Files

- `.devflow/tasks/06-13-research-skills-improvements/check.jsonl`
- `.devflow/tasks/06-13-research-skills-improvements/design.md`
- `.devflow/tasks/06-13-research-skills-improvements/implement.jsonl`
- `.devflow/tasks/06-13-research-skills-improvements/implement.md`
- `.devflow/tasks/06-13-research-skills-improvements/prd.md`
- `.devflow/tasks/06-13-research-skills-improvements/progress.json`
- `.devflow/tasks/06-13-research-skills-improvements/research/skills-analysis.md`
- `.devflow/tasks/06-13-research-skills-improvements/task.json`

#### Referenced Specs

- `.devflow/spec/devflow/backend/skill-authoring.md`
- `.devflow/spec/guides/index.md`

#### Review

- Reviewed by: (not recorded)

#### Key Decisions

- {1-3 sentences: context, decision, why.}
- The result of a real trade-off** - 存在真实替代方案并出于特定原因选择
- When a design decision is made during brainstorming, ask:
- Result of real trade-off? (genuine alternatives existed)
- > "It must run in planning/research mode. It must require a decision about whether prototype code is discarded, rewritten, or promoted."
- Decision: which approach to use in real implementation

#### Pitfalls

- 膨胀控制：只记录项目特定术语、1-2 句定义、_Avoid_ 字段、按 domain 拆分
- 缺少非确定性 bug 处理策略和硬性门槛
- Be opinionated** - 选择最佳术语，列出 `_Avoid_` 字段禁止的同义词
- `_Avoid_` 字段防止术语膨胀
- _Avoid_: Purchase, transaction, cart
- _Avoid_: Bill, payment request

#### Invariants

- {"file": ".devflow/spec/devflow/backend/skill-authoring.md", "reason": "Skill authoring conventions — verify report recommendations align with DevFlow skill contracts"}
- > "It must run in planning/research mode. It must require a decision about whether prototype code is discarded, rewritten, or promoted."
- description: "Build a throwaway prototype to answer a design question before committing to implementation. Routes between logic (state machine validation) and UI (design variati...
- Throwaway from day one** - Name it clearly as a prototype. Locate it near the real code it's exploring, but never in production paths.
- One command to run** - Use the project's existing task runner. The user must be able to start it without thinking.
- Never let prototype code silently become production**. If the prototype validated an approach, rewrite it properly in Phase 2 with tests, error handling, and specs.
</spec-entry>
