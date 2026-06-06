#!/usr/bin/env python3
"""
Task progress recovery helpers.

Provides:
    cmd_progress_init     - Create or refresh task progress.json
    cmd_progress_set      - Update a whitelisted progress field
    cmd_progress_recover  - Print compact recovery context
    cmd_progress_status   - Print task/progress status, optionally as JSON
"""

from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

from .active_task import resolve_active_task
from .git import run_git
from .io import read_json, write_json
from .paths import FILE_TASK_JSON, get_repo_root
from .task_utils import resolve_task_dir


PROGRESS_FILE = "progress.json"
SCHEMA_VERSION = 1

PHASE_VALUES = {"planning", "implement", "check", "finish", "blocked"}
STEP_RE = re.compile(r"^\d+\.\d+$")

STRING_FIELDS = {"phase", "step", "summary", "resume_hint"}
LIST_FIELDS = {"completed_items", "pending_items"}
JSON_FIELDS = {"current_item", "last_validation"}
ALLOWED_FIELDS = STRING_FIELDS | LIST_FIELDS | JSON_FIELDS


def _utc_now() -> str:
    """Return an ISO-8601 UTC timestamp."""
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace(
        "+00:00", "Z"
    )


def _repo_relative(path: Path, repo_root: Path) -> str:
    """Return a repo-relative path when possible."""
    try:
        return path.relative_to(repo_root).as_posix()
    except ValueError:
        return str(path)


def _default_phase_step(task_dir: Path) -> tuple[str, str]:
    """Infer a conservative initial phase/step from task.json status."""
    task_data = read_json(task_dir / FILE_TASK_JSON)
    status = task_data.get("status") if isinstance(task_data, dict) else None
    if status == "planning":
        return "planning", "1.1"
    if status == "completed":
        return "finish", "3.5"
    return "implement", "2.1"


def default_progress(task_dir: Path) -> dict:
    """Build a default progress.json payload."""
    phase, step = _default_phase_step(task_dir)
    return {
        "schema_version": SCHEMA_VERSION,
        "phase": phase,
        "step": step,
        "summary": "",
        "resume_hint": "",
        "current_item": None,
        "completed_items": [],
        "pending_items": [],
        "last_validation": None,
        "updated_at": _utc_now(),
        "updated_by": "agent",
    }


def _progress_path(task_dir: Path) -> Path:
    return task_dir / PROGRESS_FILE


def _resolve_task_arg(task_arg: str | None, repo_root: Path) -> Path | None:
    """Resolve explicit task arg or current active task."""
    if task_arg:
        task_dir = resolve_task_dir(task_arg, repo_root)
    else:
        active = resolve_active_task(repo_root)
        if not active.task_path:
            print("Error: no active task; pass a task directory", file=sys.stderr)
            return None
        task_dir = repo_root / active.task_path

    if not task_dir.is_dir():
        print(f"Error: task directory not found: {task_arg or task_dir}", file=sys.stderr)
        return None
    if not (task_dir / FILE_TASK_JSON).is_file():
        print(f"Error: task.json not found: {task_dir}", file=sys.stderr)
        return None
    return task_dir


def _load_progress(task_dir: Path) -> tuple[dict | None, str | None]:
    """Load progress.json, returning (data, error). Missing is not an error."""
    path = _progress_path(task_dir)
    if not path.is_file():
        return None, None
    data = read_json(path)
    if not isinstance(data, dict):
        return None, f"Invalid {PROGRESS_FILE}"
    return data, None


def _merge_progress(task_dir: Path, existing: dict | None = None) -> dict:
    """Merge existing progress data into the current default schema."""
    merged = default_progress(task_dir)
    if existing:
        for field in ALLOWED_FIELDS:
            if field in existing:
                merged[field] = existing[field]
    merged["schema_version"] = SCHEMA_VERSION
    merged["updated_at"] = _utc_now()
    merged["updated_by"] = "agent"
    return merged


def _validate_field_value(field: str, value: object) -> str | None:
    """Return an error message if a progress field value is invalid."""
    if field not in ALLOWED_FIELDS:
        return f"unknown progress field: {field}"
    if field == "phase":
        if not isinstance(value, str) or value not in PHASE_VALUES:
            allowed = ", ".join(sorted(PHASE_VALUES))
            return f"invalid phase: {value!r}; expected one of: {allowed}"
    elif field == "step":
        if not isinstance(value, str) or not STEP_RE.match(value):
            return f"invalid step: {value!r}; expected workflow step id like 2.1"
    elif field in ("summary", "resume_hint"):
        if not isinstance(value, str):
            return f"{field} must be a string"
    elif field in LIST_FIELDS:
        if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
            return f"{field} must be a JSON array of strings"
    return None


def _parse_value(field: str, raw_value: str) -> tuple[object, str | None]:
    """Parse CLI field value according to field type."""
    if field in LIST_FIELDS:
        try:
            return json.loads(raw_value), None
        except json.JSONDecodeError:
            return None, f"{field} must be valid JSON"
    if field in JSON_FIELDS:
        stripped = raw_value.strip()
        if stripped == "null":
            return None, None
        if stripped.startswith(("{", "[", '"')) or stripped in ("true", "false"):
            try:
                return json.loads(stripped), None
            except json.JSONDecodeError:
                return None, f"{field} must be valid JSON or a plain string"
        return raw_value, None
    return raw_value, None


def jsonl_curated_entry_count(jsonl_file: Path) -> tuple[int, list[str]]:
    """Count curated context entries in a JSONL manifest."""
    if not jsonl_file.is_file():
        return 0, [f"{jsonl_file.name}: not found"]

    errors: list[str] = []
    count = 0
    for line_num, line in enumerate(jsonl_file.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip():
            continue
        try:
            data = json.loads(line)
        except json.JSONDecodeError:
            errors.append(f"{jsonl_file.name}:{line_num}: invalid JSON")
            continue

        if data.get("file") or data.get("knowledge") or data.get("wiki"):
            count += 1
            continue
        if data.get("type") == "knowledge" and data.get("id"):
            count += 1

    return count, errors


def _jsonl_status(task_dir: Path, name: str) -> dict:
    """Build status for a task JSONL manifest."""
    path = task_dir / name
    if not path.is_file():
        return {"exists": False, "curated_entries": 0, "errors": []}
    count, errors = jsonl_curated_entry_count(path)
    return {"exists": True, "curated_entries": count, "errors": errors}


def _artifact_status(task_dir: Path) -> dict:
    """Return task artifact presence summary."""
    return {
        "prd": (task_dir / "prd.md").is_file(),
        "design": (task_dir / "design.md").is_file(),
        "implement": (task_dir / "implement.md").is_file(),
        "research": (task_dir / "research").is_dir(),
        "implement_jsonl": _jsonl_status(task_dir, "implement.jsonl"),
        "check_jsonl": _jsonl_status(task_dir, "check.jsonl"),
    }


def _git_dirty_summary(repo_root: Path) -> dict:
    """Return a compact git dirty summary."""
    rc, stdout, stderr = run_git(["status", "--short"], cwd=repo_root)
    if rc != 0:
        return {"available": False, "summary": stderr.strip() or "git status failed"}
    lines = [line for line in stdout.splitlines() if line.strip()]
    return {
        "available": True,
        "is_clean": not lines,
        "summary": "clean" if not lines else "\n".join(lines[:20]),
        "truncated": len(lines) > 20,
    }


def _next_action(status: str, artifacts: dict, progress: dict | None) -> str:
    """Infer the next workflow action from status, artifacts, and progress."""
    if progress and isinstance(progress.get("resume_hint"), str) and progress["resume_hint"].strip():
        return f"Resume hint: {progress['resume_hint'].strip()}"

    if status == "planning":
        if not artifacts["prd"]:
            return "Next workflow step: 1.1 requirement exploration (create prd.md)."
        if not artifacts["design"] or not artifacts["implement"]:
            return "Next workflow step: 1.1 requirement exploration (finish complex planning artifacts) or 1.4 for lightweight tasks."
        return "Next workflow step: 1.4 activation review before task.py start."

    if status == "in_progress":
        if progress and isinstance(progress.get("step"), str):
            return f"Resume workflow step {progress['step']}."
        return "Next workflow step: 2.1 implementation."

    if status == "completed":
        return "Task is completed; archive flow should normally already have moved it."

    return "Refer to .devflow/workflow.md for current step."


def build_recovery_context(task_dir: Path, repo_root: Path) -> dict:
    """Build a compact recovery context for a task."""
    task_data = read_json(task_dir / FILE_TASK_JSON)
    if not isinstance(task_data, dict):
        task_data = {}
    progress, progress_error = _load_progress(task_dir)
    artifacts = _artifact_status(task_dir)
    status = str(task_data.get("status") or "unknown")
    return {
        "task": _repo_relative(task_dir, repo_root),
        "status": status,
        "progress_file": {
            "exists": _progress_path(task_dir).is_file(),
            "path": _repo_relative(_progress_path(task_dir), repo_root),
            "error": progress_error,
        },
        "progress": progress,
        "artifacts": artifacts,
        "git": _git_dirty_summary(repo_root),
        "next_action": _next_action(status, artifacts, progress),
    }


def _print_recovery_text(context: dict) -> None:
    """Print a human-readable recovery context."""
    print("Task Progress Recovery")
    print(f"Task: {context['task']}")
    print(f"Status: {context['status']}")

    progress_file = context["progress_file"]
    if progress_file["exists"]:
        print(f"Progress file: {progress_file['path']}")
    else:
        print(f"Progress file: missing ({progress_file['path']})")
        print("Hint: run `task.py progress init <task>` to create it.")
    if progress_file.get("error"):
        print(f"Progress error: {progress_file['error']}")

    progress = context.get("progress")
    if progress:
        print(
            "Progress: "
            f"phase={progress.get('phase')} "
            f"step={progress.get('step')} "
            f"current_item={progress.get('current_item')!r}"
        )
        if progress.get("summary"):
            print(f"Summary: {progress['summary']}")
        if progress.get("last_validation"):
            print(f"Last validation: {progress['last_validation']}")

    artifacts = context["artifacts"]
    print(
        "Artifacts: "
        f"prd={artifacts['prd']} "
        f"design={artifacts['design']} "
        f"implement={artifacts['implement']} "
        f"research={artifacts['research']}"
    )
    print(
        "JSONL: "
        f"implement={artifacts['implement_jsonl']['curated_entries']} curated "
        f"check={artifacts['check_jsonl']['curated_entries']} curated"
    )

    git = context["git"]
    print(f"Git: {git['summary']}")
    print(f"Next: {context['next_action']}")


def cmd_progress_init(args) -> int:
    """Create or refresh a task progress.json file."""
    repo_root = get_repo_root()
    task_dir = _resolve_task_arg(args.dir, repo_root)
    if task_dir is None:
        return 1
    existing, error = _load_progress(task_dir)
    if error:
        print(f"Error: {error}", file=sys.stderr)
        return 1
    data = _merge_progress(task_dir, existing)
    if not write_json(_progress_path(task_dir), data):
        print(f"Error: failed to write {PROGRESS_FILE}", file=sys.stderr)
        return 1
    print(_repo_relative(_progress_path(task_dir), repo_root))
    return 0


def cmd_progress_set(args) -> int:
    """Set a whitelisted progress field."""
    repo_root = get_repo_root()
    task_dir = _resolve_task_arg(args.dir, repo_root)
    if task_dir is None:
        return 1
    field = args.field
    value, parse_error = _parse_value(field, args.value)
    if parse_error:
        print(f"Error: {parse_error}", file=sys.stderr)
        return 1
    validation_error = _validate_field_value(field, value)
    if validation_error:
        print(f"Error: {validation_error}", file=sys.stderr)
        return 1

    existing, error = _load_progress(task_dir)
    if error:
        print(f"Error: {error}", file=sys.stderr)
        return 1
    data = _merge_progress(task_dir, existing)
    data[field] = value
    data["updated_at"] = _utc_now()
    data["updated_by"] = "agent"
    if not write_json(_progress_path(task_dir), data):
        print(f"Error: failed to write {PROGRESS_FILE}", file=sys.stderr)
        return 1
    print(f"{field}={json.dumps(value, ensure_ascii=False)}")
    return 0


def cmd_progress_recover(args) -> int:
    """Print compact recovery context."""
    repo_root = get_repo_root()
    task_dir = _resolve_task_arg(getattr(args, "dir", None), repo_root)
    if task_dir is None:
        return 1
    context = build_recovery_context(task_dir, repo_root)
    _print_recovery_text(context)
    return 0


def cmd_progress_status(args) -> int:
    """Print task progress status."""
    repo_root = get_repo_root()
    task_dir = _resolve_task_arg(getattr(args, "dir", None), repo_root)
    if task_dir is None:
        return 1
    context = build_recovery_context(task_dir, repo_root)
    if getattr(args, "json", False):
        print(json.dumps(context, indent=2, ensure_ascii=False))
    else:
        _print_recovery_text(context)
    return 0


def cmd_progress(args) -> int:
    """Dispatch task.py progress subcommands."""
    subcommand = getattr(args, "progress_command", None)
    if subcommand == "init":
        return cmd_progress_init(args)
    if subcommand == "set":
        return cmd_progress_set(args)
    if subcommand == "recover":
        return cmd_progress_recover(args)
    if subcommand == "status":
        return cmd_progress_status(args)
    print("Error: progress subcommand required", file=sys.stderr)
    return 2
