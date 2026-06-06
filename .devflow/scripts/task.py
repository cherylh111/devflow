#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Task Management Script.

Usage:
    python task.py create "<title>" [--slug <name>] [--assignee <dev>] [--priority P0|P1|P2|P3] [--parent <dir>] [--package <pkg>]
    python task.py add-context <dir> <file> <path> [reason] # Add jsonl entry
    python task.py validate <dir>              # Validate jsonl files
    python task.py list-context <dir>          # List jsonl entries
    python task.py start <dir>                 # Set active task
    python task.py current [--source]          # Show active task
    python task.py finish                      # Clear active task
    python task.py set-branch <dir> <branch>   # Set git branch
    python task.py set-base-branch <dir> <branch>  # Set PR target branch
    python task.py set-scope <dir> <scope>     # Set scope for PR title
    python task.py archive <task-dir>          # Archive completed task
    python task.py list                        # List active tasks
    python task.py list-archive [month]        # List archived tasks
    python task.py add-subtask <parent-dir> <child-dir>     # Link child to parent
    python task.py remove-subtask <parent-dir> <child-dir>  # Unlink child from parent
    python task.py progress <subcommand>       # Manage task progress recovery
"""

from __future__ import annotations

import argparse
import builtins
import re
import sys
from pathlib import Path

from common.log import Colors, colored
from common.paths import (
    DIR_WORKFLOW,
    DIR_TASKS,
    FILE_TASK_JSON,
    get_repo_root,
    get_developer,
    get_tasks_dir,
    get_current_task,
)
from common.active_task import (
    clear_active_task,
    resolve_active_task,
    resolve_context_key,
    set_active_task,
)
from common.io import read_json, write_json
from common.task_utils import resolve_task_dir, run_task_hooks
from common.tasks import iter_active_tasks, children_progress
from common.devflow_config import tr as _tr


_ORIGINAL_PRINT = builtins.print


def _zh_text(value: str) -> str:
    replacements = {
        "Task Management Script": "任务管理脚本",
        "Usage:": "用法：",
        "Monorepo options:": "Monorepo 选项：",
        "List options:": "列表选项：",
        "Examples:": "示例：",
        "Commands": "命令",
        "Create new task": "创建新任务",
        "Task title": "任务标题",
        "Task slug": "任务 slug",
        "Assignee developer": "负责人",
        "Task description": "任务描述",
        "Parent task directory (establishes subtask link)": "父任务目录（建立子任务关联）",
        "Package name for monorepo projects": "Monorepo 项目中的 package 名称",
        "Add context entry": "添加上下文条目",
        "Task directory": "任务目录",
        "JSONL file (implement|check)": "JSONL 文件（implement|check）",
        "File path to add": "要添加的文件路径",
        "Reason for adding": "添加原因",
        "Validate context files": "验证上下文文件",
        "List context entries": "列出上下文条目",
        "Set active task": "设置活动任务",
        "Show active task": "显示活动任务",
        "Show active task source": "显示活动任务来源",
        "Clear active task": "清除活动任务",
        "Set git branch": "设置 git 分支",
        "Branch name": "分支名",
        "Set PR target branch": "设置 PR 目标分支",
        "Base branch name (PR target)": "基准分支名（PR 目标）",
        "Set scope": "设置 scope",
        "Scope name": "scope 名称",
        "Archive task": "归档任务",
        "Task directory or name": "任务目录或名称",
        "Skip auto git commit after archive": "归档后跳过自动 git 提交",
        "List tasks": "列出任务",
        "My tasks only": "只显示我的任务",
        "Filter by status": "按状态过滤",
        "Link child task to parent": "将子任务关联到父任务",
        "Parent task directory": "父任务目录",
        "Child task directory": "子任务目录",
        "Unlink child task from parent": "取消父子任务关联",
        "List archived tasks": "列出已归档任务",
        "Month (YYYY-MM)": "月份（YYYY-MM）",
        "Error: task directory or name required": "错误：必须提供任务目录或名称",
        "Error: Failed to set current task": "错误：设置当前任务失败",
        "No current task set": "当前未设置任务",
        "All active tasks:": "所有活动任务：",
        "Archived tasks:": "已归档任务：",
        "State: stale": "状态：已失效",
        "The hook will now inject context from this task's jsonl files.": "Hook 现在会从该任务的 jsonl 文件注入上下文。",
    }
    for en, zh in replacements.items():
        value = value.replace(en, zh)
    dynamic_prefixes = [
        ("Error: Task not found: ", "错误：未找到任务："),
        ("Hint: Use task name", "提示：可使用任务名称"),
        ("Current task set to: ", "当前任务已设为："),
        ("Cleared current task (was: ", "已清除当前任务（原为："),
        ("Current task: ", "当前任务："),
        ("Source: ", "来源："),
        ("My tasks (assignee: ", "我的任务（负责人："),
        ("Total: ", "总计："),
        ("No archives for ", "没有归档："),
    ]
    for en, zh in dynamic_prefixes:
        if value.startswith(en):
            value = zh + value[len(en):]
    return value


def _install_output_localization() -> None:
    try:
        repo_root = get_repo_root()
    except Exception:
        repo_root = None
    if _tr("en", "zh", repo_root) != "zh":
        return

    argparse_labels = {
        "usage: ": "用法：",
        "positional arguments": "位置参数",
        "options": "选项",
        "optional arguments": "可选参数",
        "show this help message and exit": "显示此帮助信息并退出",
    }
    argparse._ = lambda text: argparse_labels.get(text, text)  # type: ignore[attr-defined]

    def localized_print(*args, **kwargs):
        localized_args = tuple(_zh_text(arg) if isinstance(arg, str) else arg for arg in args)
        _ORIGINAL_PRINT(*localized_args, **kwargs)

    builtins.print = localized_print


def _h(en: str, zh: str) -> str:
    try:
        repo_root = get_repo_root()
    except Exception:
        repo_root = None
    return _tr(en, zh, repo_root)


def _meta_flag(data: dict, key: str) -> bool:
    meta = data.get("meta")
    return isinstance(meta, dict) and meta.get(key) is True


def _is_placeholder_prd(content: str) -> bool:
    return "TBD." in content and "- TBD" in content and "- [ ] TBD" in content


_TEMPORARY_PRD_HEADINGS = (
    "What I already know",
    "What we know",
    "Assumptions",
    "Open Questions",
    "Questions",
    "Brainstorm Notes",
    "Discovery Notes",
    "Scratchpad",
    "Raw Notes",
)
_TEMPORARY_PRD_HEADING_RE = re.compile(
    r"^\s{0,3}#{2,3}\s+("
    + "|".join(re.escape(heading) for heading in _TEMPORARY_PRD_HEADINGS)
    + r")\s*#*\s*$",
    re.IGNORECASE,
)
_PLACEHOLDER_BULLET_RE = re.compile(
    r"^\s*[-*+]\s+(?:\[[ xX]\]\s+)?(?:TBD\.?|TODO)\s*$",
    re.IGNORECASE,
)


def _validate_prd_convergence(content: str) -> list[str]:
    errors: list[str] = []
    for line_num, line in enumerate(content.splitlines(), start=1):
        heading_match = _TEMPORARY_PRD_HEADING_RE.match(line)
        if heading_match:
            heading = heading_match.group(1)
            errors.append(
                f"prd.md contains unresolved brainstorm heading at line {line_num}: {heading}"
            )
            continue

        if _PLACEHOLDER_BULLET_RE.match(line):
            errors.append(
                f"prd.md contains unresolved placeholder bullet at line {line_num}: "
                f"{line.strip()}"
            )
    return errors


def _validate_start_gate(task_dir: Path, task_json_path: Path) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    if not task_json_path.is_file():
        return [f"Missing {FILE_TASK_JSON}"], warnings

    data = read_json(task_json_path)
    if not isinstance(data, dict):
        return [f"Invalid {FILE_TASK_JSON}"], warnings

    prd_path = task_dir / "prd.md"
    if not prd_path.is_file():
        errors.append("Missing prd.md")
    else:
        prd_content = prd_path.read_text(encoding="utf-8")
        if not prd_content.strip():
            errors.append("prd.md is empty")
        elif _is_placeholder_prd(prd_content):
            errors.append("prd.md still contains the default TBD placeholder")
        else:
            errors.extend(_validate_prd_convergence(prd_content))

    if _meta_flag(data, "complex"):
        for artifact_name in ("design.md", "implement.md"):
            artifact_path = task_dir / artifact_name
            if not artifact_path.is_file():
                errors.append(f"Complex task is missing {artifact_name}")
            elif not artifact_path.read_text(encoding="utf-8").strip():
                errors.append(f"Complex task has empty {artifact_name}")

    if _meta_flag(data, "requires_subagent_context"):
        for jsonl_name in ("implement.jsonl", "check.jsonl"):
            entry_count, jsonl_errors = jsonl_curated_entry_count(task_dir / jsonl_name)
            errors.extend(jsonl_errors)
            if entry_count == 0:
                errors.append(
                    f"{jsonl_name} has no curated context entries "
                    "(seed _example rows do not count)"
                )

    return errors, warnings

# Import command handlers from split modules (also re-exports for plan.py compatibility)
from common.task_store import (
    cmd_create,
    cmd_archive,
    cmd_set_branch,
    cmd_set_base_branch,
    cmd_set_scope,
    cmd_add_subtask,
    cmd_remove_subtask,
)
from common.task_context import (
    cmd_add_context,
    cmd_validate,
    cmd_list_context,
)
from common.task_progress import cmd_progress, jsonl_curated_entry_count


# =============================================================================
# Command: start / finish
# =============================================================================

def cmd_start(args: argparse.Namespace) -> int:
    """Set active task."""
    repo_root = get_repo_root()
    task_input = args.dir

    if not task_input:
        print(colored("Error: task directory or name required", Colors.RED))
        return 1

    # Resolve task directory (supports task name, relative path, or absolute path)
    full_path = resolve_task_dir(task_input, repo_root)

    if not full_path.is_dir():
        print(colored(f"Error: Task not found: {task_input}", Colors.RED))
        print("Hint: Use task name (e.g., 'my-task') or full path (e.g., '.devflow/tasks/01-31-my-task')")
        return 1

    # Convert to relative path for storage
    try:
        task_dir = full_path.relative_to(repo_root).as_posix()
    except ValueError:
        task_dir = str(full_path)

    task_json_path = full_path / FILE_TASK_JSON
    gate_errors, gate_warnings = _validate_start_gate(full_path, task_json_path)
    for warning in gate_warnings:
        print(colored(f"Warning: {warning}", Colors.YELLOW), file=sys.stderr)
    if gate_errors:
        if not getattr(args, "force", False):
            print(colored("Error: Start gate validation failed", Colors.RED), file=sys.stderr)
            for error in gate_errors:
                print(f"  - {error}", file=sys.stderr)
            print("Use --force to bypass this gate intentionally.", file=sys.stderr)
            return 1

        print(colored("Warning: bypassing start gate validation with --force", Colors.YELLOW), file=sys.stderr)
        for error in gate_errors:
            print(f"  - {error}", file=sys.stderr)

    if not resolve_context_key():
        # Degraded mode: no session identity available.
        # Hook didn't inject DEVFLOW_CONTEXT_ID (common on Windows + Claude Code,
        # --continue resume path, fork distribution, hooks disabled, etc.). Skip
        # per-session pointer write; AI continues based on conversation context.
        print(colored(
            "ℹ Session identity not available; active-task pointer not persisted "
            "this session (degraded mode). AI continues based on conversation context.",
            Colors.YELLOW,
        ))
        print(colored(
            "Hint: run inside an AI IDE/session that exposes session identity, "
            "or set DEVFLOW_CONTEXT_ID before running task.py start.",
            Colors.YELLOW,
        ))

        # Still flip task.json status: planning → in_progress so downstream phases proceed.
        if task_json_path.is_file():
            data = read_json(task_json_path)
            if data and data.get("status") == "planning":
                data["status"] = "in_progress"
                if write_json(task_json_path, data):
                    print(colored("✓ Status: planning → in_progress (degraded)", Colors.GREEN))
            run_task_hooks("after_start", task_json_path, repo_root)
        return 0

    active = set_active_task(task_dir, repo_root)
    if active:
        print(colored(f"✓ Current task set to: {task_dir}", Colors.GREEN))
        print(f"Source: {active.source}")

        if task_json_path.is_file():
            data = read_json(task_json_path)
            if data and data.get("status") == "planning":
                data["status"] = "in_progress"
                if write_json(task_json_path, data):
                    print(colored("✓ Status: planning → in_progress", Colors.GREEN))

        print()
        print(colored("The hook will now inject context from this task's jsonl files.", Colors.BLUE))

        run_task_hooks("after_start", task_json_path, repo_root)
        return 0
    else:
        print(colored("Error: Failed to set current task", Colors.RED))
        return 1


def cmd_finish(args: argparse.Namespace) -> int:
    """Clear active task."""
    repo_root = get_repo_root()
    active = clear_active_task(repo_root)
    current = active.task_path

    if not current:
        print(colored("No current task set", Colors.YELLOW))
        return 0

    # Resolve task.json path before clearing
    task_json_path = repo_root / current / FILE_TASK_JSON

    print(colored(f"✓ Cleared current task (was: {current})", Colors.GREEN))
    print(f"Source: {active.source}")

    if task_json_path.is_file():
        run_task_hooks("after_finish", task_json_path, repo_root)
    return 0


def cmd_current(args: argparse.Namespace) -> int:
    """Show active task."""
    repo_root = get_repo_root()
    active = resolve_active_task(repo_root)

    if args.source:
        print(f"Current task: {active.task_path or '(none)'}")
        print(f"Source: {active.source}")
        if active.stale:
            print("State: stale")
        return 0 if active.task_path else 1

    if active.task_path:
        print(active.task_path)
        return 0

    return 1


# =============================================================================
# Command: list
# =============================================================================

def cmd_list(args: argparse.Namespace) -> int:
    """List active tasks."""
    repo_root = get_repo_root()
    tasks_dir = get_tasks_dir(repo_root)
    current_task = get_current_task(repo_root)
    developer = get_developer(repo_root)
    filter_mine = args.mine
    filter_status = args.status

    if filter_mine:
        if not developer:
            print(colored("Error: No developer set. Run init_developer.py first", Colors.RED), file=sys.stderr)
            return 1
        print(colored(f"My tasks (assignee: {developer}):", Colors.BLUE))
    else:
        print(colored("All active tasks:", Colors.BLUE))
    print()

    # Single pass: collect all tasks via shared iterator
    all_tasks = {t.dir_name: t for t in iter_active_tasks(tasks_dir)}
    all_statuses = {name: t.status for name, t in all_tasks.items()}

    # Display tasks hierarchically
    count = 0

    def _print_task(dir_name: str, indent: int = 0) -> None:
        nonlocal count
        t = all_tasks[dir_name]

        # Apply --mine filter
        if filter_mine and (t.assignee or "-") != developer:
            return

        # Apply --status filter
        if filter_status and t.status != filter_status:
            return

        relative_path = f"{DIR_WORKFLOW}/{DIR_TASKS}/{dir_name}"
        marker = ""
        if relative_path == current_task:
            marker = f" {colored('<- current', Colors.GREEN)}"

        # Children progress
        progress = children_progress(t.children, all_statuses)

        # Package tag
        pkg_tag = f" @{t.package}" if t.package else ""

        prefix = "  " * indent + "  - "

        if filter_mine:
            print(f"{prefix}{dir_name}/ ({t.status}){pkg_tag}{progress}{marker}")
        else:
            print(f"{prefix}{dir_name}/ ({t.status}){pkg_tag}{progress} [{colored(t.assignee or '-', Colors.CYAN)}]{marker}")
        count += 1

        # Print children indented
        for child_name in t.children:
            if child_name in all_tasks:
                _print_task(child_name, indent + 1)

    # Display only top-level tasks (those without a parent)
    for dir_name in sorted(all_tasks.keys()):
        if not all_tasks[dir_name].parent:
            _print_task(dir_name)

    if count == 0:
        if filter_mine:
            print("  (no tasks assigned to you)")
        else:
            print("  (no active tasks)")

    print()
    print(f"Total: {count} task(s)")
    return 0


# =============================================================================
# Command: list-archive
# =============================================================================

def cmd_list_archive(args: argparse.Namespace) -> int:
    """List archived tasks."""
    repo_root = get_repo_root()
    tasks_dir = get_tasks_dir(repo_root)
    archive_dir = tasks_dir / "archive"
    month = args.month

    print(colored("Archived tasks:", Colors.BLUE))
    print()

    if month:
        month_dir = archive_dir / month
        if month_dir.is_dir():
            print(f"[{month}]")
            for d in sorted(month_dir.iterdir()):
                if d.is_dir():
                    print(f"  - {d.name}/")
        else:
            print(f"  No archives for {month}")
    else:
        if archive_dir.is_dir():
            for month_dir in sorted(archive_dir.iterdir()):
                if month_dir.is_dir():
                    month_name = month_dir.name
                    count = sum(1 for d in month_dir.iterdir() if d.is_dir())
                    print(f"[{month_name}] - {count} task(s)")

    return 0


# =============================================================================
# Help
# =============================================================================

def show_usage() -> None:
    """Show usage help."""
    print("""Task Management Script

Usage:
  python task.py create <title>                     Create new task directory
  python task.py create <title> --package <pkg>     Create task for a specific package
  python task.py create <title> --parent <dir>      Create task as child of parent
  python task.py add-context <dir> <jsonl> <path> [reason]  Add entry to jsonl
  python task.py validate <dir>                     Validate jsonl files
  python task.py list-context <dir>                 List jsonl entries
  python task.py start <dir>                        Set active task
  python task.py current [--source]                 Show active task
  python task.py finish                             Clear active task
  python task.py set-branch <dir> <branch>          Set git branch
  python task.py set-base-branch <dir> <branch>     Set PR target branch
  python task.py set-scope <dir> <scope>            Set scope for PR title
  python task.py archive <task-dir>                 Archive completed task
  python task.py add-subtask <parent> <child>       Link child task to parent
  python task.py remove-subtask <parent> <child>    Unlink child from parent
  python task.py progress init <task-dir>           Create or refresh progress.json
  python task.py progress set <task-dir> <field> <value>  Update progress field
  python task.py progress recover [task-dir]        Print compact recovery context
  python task.py progress status [task-dir] [--json]  Print progress status
  python task.py list [--mine] [--status <status>]  List tasks
  python task.py list-archive [YYYY-MM]             List archived tasks

Monorepo options:
  --package <pkg>      Package name (validated against config.yaml packages)

List options:
  --mine, -m           Show only tasks assigned to current developer
  --status, -s <s>     Filter by status (planning, in_progress, review, completed)

Examples:
  python task.py create "Add login feature" --slug add-login
  python task.py create "Add login feature" --slug add-login --package cli
  python task.py create "Child task" --slug child --parent .devflow/tasks/01-21-parent
  python task.py add-context <dir> implement .devflow/spec/cli/backend/auth.md "Auth guidelines"
  python task.py set-branch <dir> task/add-login
  python task.py start .devflow/tasks/01-21-add-login
  python task.py start .devflow/tasks/01-21-add-login --force
  python task.py current --source
  python task.py finish
  python task.py archive add-login
  python task.py add-subtask parent-task child-task  # Link existing tasks
  python task.py remove-subtask parent-task child-task
  python task.py progress init .devflow/tasks/01-21-add-login
  python task.py progress set .devflow/tasks/01-21-add-login step 2.2
  python task.py progress recover
  python task.py list                               # List all active tasks
  python task.py list --mine                        # List my tasks only
  python task.py list --mine --status in_progress   # List my in-progress tasks
""")


# =============================================================================
# Main Entry
# =============================================================================

def main() -> int:
    """CLI entry point."""
    _install_output_localization()

    # Deprecation guard: `init-context` was removed in v0.5.0-beta.12.
    # Detect early so argparse doesn't mask the real reason with a generic
    # "invalid choice" error.
    if len(sys.argv) >= 2 and sys.argv[1] == "init-context":
        print(
            colored(
                "Error: `task.py init-context` was removed in v0.5.0-beta.12.",
                Colors.RED,
            ),
            file=sys.stderr,
        )
        print(
            "implement.jsonl / check.jsonl are now seeded on `task.py create` for",
            file=sys.stderr,
        )
        print(
            "sub-agent-capable platforms and curated by the AI during planning when needed.",
            file=sys.stderr,
        )
        print("See .devflow/workflow.md planning artifact guidance or run:", file=sys.stderr)
        print(
            "  python ./.devflow/scripts/get_context.py --mode phase --step 1",
            file=sys.stderr,
        )
        print(
            "Use `task.py add-context <dir> implement|check <path> <reason>` to append entries.",
            file=sys.stderr,
        )
        return 2

    parser = argparse.ArgumentParser(
        description=_h("Task Management Script", "任务管理脚本"),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    subparsers = parser.add_subparsers(dest="command", help=_h("Commands", "命令"))

    # create
    p_create = subparsers.add_parser("create", help=_h("Create new task", "创建新任务"))
    p_create.add_argument("title", help=_h("Task title", "任务标题"))
    p_create.add_argument("--slug", "-s", help=_h("Task slug", "任务 slug"))
    p_create.add_argument("--assignee", "-a", help=_h("Assignee developer", "负责人"))
    p_create.add_argument("--priority", "-p", default="P2", help=_h("Priority (P0-P3)", "优先级（P0-P3）"))
    p_create.add_argument("--description", "-d", help=_h("Task description", "任务描述"))
    p_create.add_argument("--parent", help=_h("Parent task directory (establishes subtask link)", "父任务目录（建立子任务关联）"))
    p_create.add_argument("--package", help=_h("Package name for monorepo projects", "Monorepo 项目中的 package 名称"))

    # add-context
    p_add = subparsers.add_parser("add-context", help=_h("Add context entry", "添加上下文条目"))
    p_add.add_argument("dir", help=_h("Task directory", "任务目录"))
    p_add.add_argument("file", help=_h("JSONL file (implement|check)", "JSONL 文件（implement|check）"))
    p_add.add_argument("path", help=_h("File path to add", "要添加的文件路径"))
    p_add.add_argument("reason", nargs="?", help=_h("Reason for adding", "添加原因"))

    # validate
    p_validate = subparsers.add_parser("validate", help=_h("Validate context files", "验证上下文文件"))
    p_validate.add_argument("dir", help=_h("Task directory", "任务目录"))

    # list-context
    p_listctx = subparsers.add_parser("list-context", help=_h("List context entries", "列出上下文条目"))
    p_listctx.add_argument("dir", help=_h("Task directory", "任务目录"))

    # start
    p_start = subparsers.add_parser("start", help=_h("Set active task", "设置活动任务"))
    p_start.add_argument("dir", help=_h("Task directory", "任务目录"))
    p_start.add_argument("--force", action="store_true", help=_h("Bypass start gate validation errors", "绕过 start gate 校验错误"))

    # current
    p_current = subparsers.add_parser("current", help=_h("Show active task", "显示活动任务"))
    p_current.add_argument("--source", action="store_true",
                           help=_h("Show active task source", "显示活动任务来源"))

    # finish
    subparsers.add_parser("finish", help=_h("Clear active task", "清除活动任务"))

    # set-branch
    p_branch = subparsers.add_parser("set-branch", help=_h("Set git branch", "设置 git 分支"))
    p_branch.add_argument("dir", help=_h("Task directory", "任务目录"))
    p_branch.add_argument("branch", help=_h("Branch name", "分支名"))

    # set-base-branch
    p_base = subparsers.add_parser("set-base-branch", help=_h("Set PR target branch", "设置 PR 目标分支"))
    p_base.add_argument("dir", help=_h("Task directory", "任务目录"))
    p_base.add_argument("base_branch", help=_h("Base branch name (PR target)", "基准分支名（PR 目标）"))

    # set-scope
    p_scope = subparsers.add_parser("set-scope", help=_h("Set scope", "设置 scope"))
    p_scope.add_argument("dir", help=_h("Task directory", "任务目录"))
    p_scope.add_argument("scope", help=_h("Scope name", "scope 名称"))

    # archive
    p_archive = subparsers.add_parser("archive", help=_h("Archive task", "归档任务"))
    p_archive.add_argument("name", help=_h("Task directory or name", "任务目录或名称"))
    p_archive.add_argument("--no-commit", action="store_true", help=_h("Skip auto git commit after archive", "归档后跳过自动 git 提交"))

    # list
    p_list = subparsers.add_parser("list", help=_h("List tasks", "列出任务"))
    p_list.add_argument("--mine", "-m", action="store_true", help=_h("My tasks only", "只显示我的任务"))
    p_list.add_argument("--status", "-s", help=_h("Filter by status", "按状态过滤"))

    # add-subtask
    p_addsub = subparsers.add_parser("add-subtask", help=_h("Link child task to parent", "将子任务关联到父任务"))
    p_addsub.add_argument("parent_dir", help=_h("Parent task directory", "父任务目录"))
    p_addsub.add_argument("child_dir", help=_h("Child task directory", "子任务目录"))

    # remove-subtask
    p_rmsub = subparsers.add_parser("remove-subtask", help=_h("Unlink child task from parent", "取消父子任务关联"))
    p_rmsub.add_argument("parent_dir", help=_h("Parent task directory", "父任务目录"))
    p_rmsub.add_argument("child_dir", help=_h("Child task directory", "子任务目录"))

    # progress
    p_progress = subparsers.add_parser("progress", help=_h("Manage task progress recovery", "管理任务进度恢复"))
    progress_subparsers = p_progress.add_subparsers(dest="progress_command")

    p_progress_init = progress_subparsers.add_parser("init", help=_h("Create or refresh progress.json", "创建或刷新 progress.json"))
    p_progress_init.add_argument("dir", help=_h("Task directory", "任务目录"))

    p_progress_set = progress_subparsers.add_parser("set", help=_h("Update progress field", "更新进度字段"))
    p_progress_set.add_argument("dir", help=_h("Task directory", "任务目录"))
    p_progress_set.add_argument("field", help=_h("Progress field", "进度字段"))
    p_progress_set.add_argument("value", help=_h("Progress field value", "进度字段值"))

    p_progress_recover = progress_subparsers.add_parser("recover", help=_h("Print compact recovery context", "输出紧凑恢复上下文"))
    p_progress_recover.add_argument("dir", nargs="?", help=_h("Task directory", "任务目录"))

    p_progress_status = progress_subparsers.add_parser("status", help=_h("Print progress status", "输出进度状态"))
    p_progress_status.add_argument("dir", nargs="?", help=_h("Task directory", "任务目录"))
    p_progress_status.add_argument("--json", action="store_true", help=_h("Print JSON", "输出 JSON"))

    # list-archive
    p_listarch = subparsers.add_parser("list-archive", help=_h("List archived tasks", "列出已归档任务"))
    p_listarch.add_argument("month", nargs="?", help=_h("Month (YYYY-MM)", "月份（YYYY-MM）"))

    args = parser.parse_args()

    if not args.command:
        show_usage()
        return 1

    commands = {
        "create": cmd_create,
        "add-context": cmd_add_context,
        "validate": cmd_validate,
        "list-context": cmd_list_context,
        "start": cmd_start,
        "current": cmd_current,
        "finish": cmd_finish,
        "set-branch": cmd_set_branch,
        "set-base-branch": cmd_set_base_branch,
        "set-scope": cmd_set_scope,
        "archive": cmd_archive,
        "add-subtask": cmd_add_subtask,
        "remove-subtask": cmd_remove_subtask,
        "progress": cmd_progress,
        "list": cmd_list,
        "list-archive": cmd_list_archive,
    }

    if args.command in commands:
        return commands[args.command](args)
    else:
        show_usage()
        return 1


if __name__ == "__main__":
    sys.exit(main())
