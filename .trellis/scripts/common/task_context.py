#!/usr/bin/env python3
"""
Task JSONL context management.

Provides:
    cmd_add_context   - Add entry to JSONL context file
    cmd_validate      - Validate JSONL context files
    cmd_list_context  - List JSONL context entries

Context JSONL supports:
    {"file": ".trellis/spec/backend/index.md", "reason": "..."}
    {"file": ".trellis/spec/backend/", "type": "directory", "reason": "..."}
    {"knowledge": "DFL-20260526-example", "type": "knowledge", "reason": "..."}
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from .log import Colors, colored
from .paths import DIR_SPEC, DIR_TASKS, DIR_WORKFLOW, DIR_WORKSPACE, get_repo_root
from .task_utils import resolve_task_dir


def cmd_add_context(args: argparse.Namespace) -> int:
    """Add a file, directory, or knowledge entry to a JSONL context file."""
    repo_root = get_repo_root()
    target_dir = resolve_task_dir(args.dir, repo_root)

    jsonl_name = args.file
    target = args.path
    reason = args.reason or "Added manually"

    if not target_dir.is_dir():
        print(colored(f"Error: Directory not found: {target_dir}", Colors.RED))
        return 1

    if not jsonl_name.endswith(".jsonl"):
        jsonl_name = f"{jsonl_name}.jsonl"

    entry = _context_entry_for_target(repo_root, target, reason)
    if entry is None:
        print(colored(f"Error: Path or knowledge entry not found: {target}", Colors.RED))
        print("Hint: use a file path, directory path, or knowledge:<id> / wiki:<id>.")
        return 1

    jsonl_file = target_dir / jsonl_name
    entry_type = str(entry.get("type", "file"))
    dedupe_value = str(entry.get("file") or entry.get("knowledge") or "")

    if dedupe_value and jsonl_file.is_file():
        content = jsonl_file.read_text(encoding="utf-8")
        if f'"{dedupe_value}"' in content:
            print(colored(f"Warning: Entry already exists for {dedupe_value}", Colors.YELLOW))
            return 0

    with jsonl_file.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    print(colored(f"Added {entry_type}: {dedupe_value}", Colors.GREEN))
    return 0


def _context_entry_for_target(repo_root: Path, target: str, reason: str) -> dict | None:
    if target.startswith("knowledge:") or target.startswith("wiki:"):
        knowledge_id = target.split(":", 1)[1].strip()
        if not knowledge_id or not _knowledge_entry_exists(repo_root, knowledge_id):
            return None
        return {"knowledge": knowledge_id, "type": "knowledge", "reason": reason}

    path = target
    full_path = repo_root / path
    if full_path.is_dir():
        if not path.endswith("/"):
            path = f"{path}/"
        return {"file": path, "type": "directory", "reason": reason}
    if full_path.is_file():
        return {"file": path, "reason": reason}
    return None


def _knowledge_scan_roots(repo_root: Path) -> list[Path]:
    workflow_dir = repo_root / DIR_WORKFLOW
    return [
        workflow_dir / DIR_SPEC,
        workflow_dir / DIR_TASKS,
        workflow_dir / DIR_WORKSPACE,
    ]


def _knowledge_entry_exists(repo_root: Path, knowledge_id: str) -> bool:
    for root in _knowledge_scan_roots(repo_root):
        if not root.is_dir():
            continue
        for file_path in root.rglob("*.md"):
            try:
                content = file_path.read_text(encoding="utf-8")
            except (OSError, UnicodeDecodeError):
                continue
            if f'id="{knowledge_id}"' in content or f"id='{knowledge_id}'" in content:
                return True
            try:
                relative_path = file_path.relative_to(repo_root).as_posix()
            except ValueError:
                relative_path = str(file_path)
            if f"file:{relative_path}" == knowledge_id:
                return True
    return False


def _knowledge_id_from_entry(data: dict) -> str | None:
    knowledge_id = data.get("knowledge") or data.get("wiki")
    if data.get("type") == "knowledge" and not knowledge_id:
        knowledge_id = data.get("id")
    return str(knowledge_id) if knowledge_id else None


def cmd_validate(args: argparse.Namespace) -> int:
    """Validate JSONL context files."""
    repo_root = get_repo_root()
    target_dir = resolve_task_dir(args.dir, repo_root)

    if not target_dir.is_dir():
        print(colored("Error: task directory required", Colors.RED))
        return 1

    print(colored("=== Validating Context Files ===", Colors.BLUE))
    print(f"Target dir: {target_dir}")
    print()

    total_errors = 0
    for jsonl_name in ["implement.jsonl", "check.jsonl"]:
        jsonl_file = target_dir / jsonl_name
        total_errors += _validate_jsonl(jsonl_file, repo_root)

    print()
    if total_errors == 0:
        print(colored("OK All validations passed", Colors.GREEN))
        return 0

    print(colored(f"Validation failed ({total_errors} errors)", Colors.RED))
    return 1


def _validate_jsonl(jsonl_file: Path, repo_root: Path) -> int:
    """Validate a single JSONL file."""
    file_name = jsonl_file.name
    errors = 0

    if not jsonl_file.is_file():
        print(f"  {colored(f'{file_name}: not found (skipped)', Colors.YELLOW)}")
        return 0

    real_entries = 0
    for line_num, line in enumerate(jsonl_file.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip():
            continue

        try:
            data = json.loads(line)
        except json.JSONDecodeError:
            print(f"  {colored(f'{file_name}:{line_num}: Invalid JSON', Colors.RED)}")
            errors += 1
            continue

        file_path = data.get("file")
        knowledge_id = _knowledge_id_from_entry(data)
        entry_type = data.get("type", "file")

        if knowledge_id:
            real_entries += 1
            if not _knowledge_entry_exists(repo_root, str(knowledge_id)):
                print(f"  {colored(f'{file_name}:{line_num}: Knowledge entry not found: {knowledge_id}', Colors.RED)}")
                errors += 1
            continue

        if not file_path:
            continue

        real_entries += 1
        full_path = repo_root / file_path
        if entry_type == "directory":
            if not full_path.is_dir():
                print(f"  {colored(f'{file_name}:{line_num}: Directory not found: {file_path}', Colors.RED)}")
                errors += 1
        elif not full_path.is_file():
            print(f"  {colored(f'{file_name}:{line_num}: File not found: {file_path}', Colors.RED)}")
            errors += 1

    if errors == 0:
        print(f"  {colored(f'{file_name}: OK ({real_entries} entries)', Colors.GREEN)}")
    else:
        print(f"  {colored(f'{file_name}: FAILED ({errors} errors)', Colors.RED)}")

    return errors


def cmd_list_context(args: argparse.Namespace) -> int:
    """List JSONL context entries."""
    repo_root = get_repo_root()
    target_dir = resolve_task_dir(args.dir, repo_root)

    if not target_dir.is_dir():
        print(colored("Error: task directory required", Colors.RED))
        return 1

    print(colored("=== Context Files ===", Colors.BLUE))
    print()

    for jsonl_name in ["implement.jsonl", "check.jsonl"]:
        jsonl_file = target_dir / jsonl_name
        if not jsonl_file.is_file():
            continue

        print(colored(f"[{jsonl_name}]", Colors.CYAN))

        count = 0
        seed_only = True
        for line in jsonl_file.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue

            try:
                data = json.loads(line)
            except json.JSONDecodeError:
                continue

            file_path = data.get("file")
            knowledge_id = _knowledge_id_from_entry(data)
            if not file_path and not knowledge_id:
                continue
            seed_only = False

            count += 1
            entry_type = data.get("type", "file")
            reason = data.get("reason", "-")

            if knowledge_id:
                print(f"  {colored(f'{count}.', Colors.GREEN)} [KNOWLEDGE] {knowledge_id}")
            elif entry_type == "directory":
                print(f"  {colored(f'{count}.', Colors.GREEN)} [DIR] {file_path}")
            else:
                print(f"  {colored(f'{count}.', Colors.GREEN)} {file_path}")
            print(f"     {colored('->', Colors.YELLOW)} {reason}")

        if seed_only:
            print(f"  {colored('(no curated entries yet - only seed row)', Colors.YELLOW)}")

        print()

    return 0
