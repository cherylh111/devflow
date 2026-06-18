Read the relevant development guidelines before starting your task.

Execute these steps:

1. **Read current task artifacts**:
   - `prd.md` for requirements and acceptance criteria
   - `design.md` if present for technical design
   - `implement.md` if present for execution order and validation plan

2. **Discover packages and their spec layers**:
   ```bash
   python3 ./.devflow/scripts/get_context.py --mode packages
   ```

3. **Identify which specs apply** to your task based on:
   - Which package you're modifying (e.g., `cli/`, `docs-site/`)
   - What type of work (backend, frontend, unit-test, docs, etc.)
   - Any spec/research paths referenced by the task artifacts
   - Any relevant structured knowledge found by focused search:
     ```bash
     python3 ./.devflow/scripts/knowledge.py search "<task topic>"
     python3 ./.devflow/scripts/knowledge.py load <id>
     ```

4. **Read the spec index** for each relevant module:
   ```bash
   cat .devflow/spec/<package>/<layer>/index.md
   ```
   Follow the **"Pre-Development Checklist"** section in the index.

5. **Read the specific guideline files** listed in the Pre-Development Checklist that are relevant to your task. The index is NOT the goal — it points you to the actual guideline files (e.g., `error-handling.md`, `conventions.md`, `mock-strategies.md`). Read those files to understand the coding standards and patterns.

6. **Always read shared guides**:
   ```bash
   cat .devflow/spec/guides/index.md
   ```

7. **Consider optional TDD path** for behavior-changing work:
   - Use test-first when the task changes public behavior, APIs, command output,
     parser/validator behavior, complex business logic, or refactors that must
     preserve existing behavior.
   - Read the relevant `.devflow/spec/<package>/unit-test/` guidance for concrete
     test conventions before writing tests.
   - Prefer a vertical red-green-refactor loop: write one behavior test through a
     public interface, add the minimal implementation, refactor, then repeat.
   - Do not test private implementation details just to force TDD.
   - Skip TDD for documentation-only work, exploratory prototypes, mechanical
     renames, generated-output churn, or changes where no stable behavior is known yet.

8. If a loaded knowledge entry is required for this task and sub-agents will run later, add it to the task context manifest:
   ```bash
   python3 ./.devflow/scripts/task.py add-context "$TASK_DIR" implement "knowledge:<id>" "<reason>"
   python3 ./.devflow/scripts/task.py add-context "$TASK_DIR" check "knowledge:<id>" "<reason>"
   ```

9. Understand the coding standards and patterns you need to follow, then proceed with your development plan.

This step is **mandatory** before writing any code.
