#!/usr/bin/env python3
"""
Project trace and session-insight helpers.

Trace is a project-level append-only activity stream. It complements the
per-developer journal by recording task lifecycle events in a replayable JSONL
file under .devflow/agent-traces/.

Session insight is the automatic synthesis layer written during finish-work.
It extracts deterministic highlights from task artifacts, commit diffs, and the
session summary, then stores them as structured wiki knowledge.
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .git import run_git
from .io import read_json
from .paths import (
    DIR_ARCHIVE,
    DIR_SPEC,
    DIR_TASKS,
    DIR_WORKFLOW,
    FILE_TASK_JSON,
    get_developer,
)


TRACE_RELATIVE_PATH = f"{DIR_WORKFLOW}/agent-traces/trace.jsonl"
SESSION_INSIGHT_ROOT = f"{DIR_WORKFLOW}/{DIR_SPEC}/wiki/session-insight"


def record_task_archived(
    repo_root: Path,
    task_dir: Path,
    archive_dest: Path,
) -> None:
    """Record a task archive event in the project trace."""
    task_data = _read_task_json(archive_dest)
    task_ref = _relative(repo_root, archive_dest)
    specs = collect_task_spec_refs(archive_dest)
    commits = _task_commits(task_data)
    event = {
        "event": "task_archived",
        "timestamp": _now_iso(),
        "actor": get_developer(repo_root),
        "task": task_ref,
        "task_name": task_dir.name,
        "title": task_data.get("title") or task_dir.name,
        "why": _task_goal(archive_dest),
        "commits": commits,
        "changed_files": collect_commit_files(repo_root, commits),
        "referenced_specs": specs,
        "reviewed_by": _reviewers(task_data),
        "related_files": _string_list(task_data.get("relatedFiles")),
        "archived_to": task_ref,
    }
    append_trace_event(repo_root, event)


def record_session_insight(
    repo_root: Path,
    title: str,
    summary: str,
    commit: str,
    extra_content: str,
    task_ref: str | None = None,
    branch: str | None = None,
    package: str | None = None,
) -> list[str]:
    """Write structured session-insight wiki entries and trace events.

    Returns repo-relative paths of created insight documents. When finish-work
    archived multiple tasks before the journal step, each archived task gets its
    own insight entry.
    """
    commits = _commit_list(commit)
    changed_files = collect_commit_files(repo_root, commits)
    task_dirs = _session_task_dirs(repo_root, task_ref)

    if not any([summary.strip(), extra_content.strip(), commits, task_dirs]):
        return []

    task_paths = [_relative(repo_root, task_dir) for task_dir in task_dirs]
    referenced_specs = sorted({
        ref
        for task_dir in task_dirs
        for ref in collect_task_spec_refs(task_dir)
    })

    append_trace_event(repo_root, {
        "event": "session_recorded",
        "timestamp": _now_iso(),
        "actor": get_developer(repo_root),
        "title": title,
        "summary": summary.strip(),
        "tasks": task_paths,
        "task": task_paths[0] if len(task_paths) == 1 else None,
        "task_names": [task_dir.name for task_dir in task_dirs],
        "commits": commits,
        "changed_files": changed_files,
        "referenced_specs": referenced_specs,
        "branch": branch,
        "package": package,
    })

    insight_paths: list[str] = []
    for task_dir in task_dirs or [None]:
        task_data = _read_task_json(task_dir) if task_dir else {}
        task_name = task_dir.name if task_dir else None
        task_path = _relative(repo_root, task_dir) if task_dir else None
        task_specs = collect_task_spec_refs(task_dir) if task_dir else []
        highlights = extract_session_highlights(
            task_dir=task_dir,
            summary=summary,
            extra_content=extra_content,
            diff_text=collect_commit_diff_text(repo_root, commits),
        )
        insight_id = _unique_insight_id(repo_root, task_name or title)
        insight_path = _unique_insight_path(repo_root, task_name or title)

        attrs = {
            "id": insight_id,
            "type": "session-insight",
            "category": "session",
            "keywords": ",".join(_keywords(task_name, package, changed_files, task_specs)),
            "source": "finish-work",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "task": task_name,
            "package": package,
            "branch": branch,
            "commits": ",".join(commits) if commits else None,
            "derived_from": task_path,
        }
        body = _render_session_insight_body(
            title=title,
            summary=summary,
            task_dir=task_dir,
            task_path=task_path,
            task_data=task_data,
            commits=commits,
            changed_files=changed_files,
            referenced_specs=task_specs,
            reviewers=_reviewers(task_data),
            highlights=highlights,
        )

        insight_path.parent.mkdir(parents=True, exist_ok=True)
        insight_path.write_text(_serialize_spec_entry(attrs, body), encoding="utf-8")
        relative_path = _relative(repo_root, insight_path)
        insight_paths.append(relative_path)

        append_trace_event(repo_root, {
            "event": "session_insight_created",
            "timestamp": _now_iso(),
            "actor": get_developer(repo_root),
            "task": task_path,
            "task_name": task_name,
            "why": _task_goal(task_dir) if task_dir else None,
            "changed_files": changed_files,
            "referenced_specs": task_specs,
            "reviewed_by": _reviewers(task_data),
            "insight": relative_path,
            "insight_id": insight_id,
            "derived_from": {
                "prd": f"{task_path}/prd.md" if task_path else None,
                "commits": commits,
                "journal_summary": title,
            },
        })

    return insight_paths


def append_trace_event(repo_root: Path, event: dict[str, Any]) -> None:
    """Append a JSON event to .devflow/agent-traces/trace.jsonl."""
    trace_path = repo_root / TRACE_RELATIVE_PATH
    trace_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "schema": "devflow.trace.v1",
        **{key: value for key, value in event.items() if value not in (None, [], {})},
    }
    with trace_path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(payload, ensure_ascii=False, sort_keys=True) + "\n")


def collect_commit_files(repo_root: Path, commits: list[str]) -> list[str]:
    """Return files changed by the supplied commits."""
    files: set[str] = set()
    for commit_hash in commits:
        rc, out, _ = run_git(
            ["show", "--name-only", "--pretty=format:", commit_hash],
            cwd=repo_root,
        )
        if rc != 0:
            continue
        for line in out.splitlines():
            item = line.strip().replace("\\", "/")
            if item:
                files.add(item)
    return sorted(files)


def collect_commit_diff_text(repo_root: Path, commits: list[str]) -> str:
    """Return added/removed content lines from the supplied commits."""
    lines: list[str] = []
    for commit_hash in commits:
        rc, out, _ = run_git(
            ["show", "--format=", "--unified=0", commit_hash],
            cwd=repo_root,
        )
        if rc != 0:
            continue
        for raw in out.splitlines():
            if raw.startswith("+++") or raw.startswith("---"):
                continue
            if raw.startswith("+") or raw.startswith("-"):
                content = raw[1:].strip()
                if content:
                    lines.append(content)
    return "\n".join(lines)


def collect_task_spec_refs(task_dir: Path | None) -> list[str]:
    """Collect referenced specs from implement/check JSONL files."""
    if not task_dir:
        return []
    refs: set[str] = set()
    for name in ("implement.jsonl", "check.jsonl"):
        path = task_dir / name
        if not path.is_file():
            continue
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                item = json.loads(line)
            except json.JSONDecodeError:
                continue
            file_ref = item.get("file")
            if isinstance(file_ref, str) and f"{DIR_WORKFLOW}/{DIR_SPEC}/" in file_ref:
                refs.add(file_ref.replace("\\", "/"))
    return sorted(refs)


def extract_session_highlights(
    task_dir: Path | None,
    summary: str,
    extra_content: str,
    diff_text: str,
) -> dict[str, list[str]]:
    """Extract deterministic highlight bullets from task/session text."""
    sources = [summary, extra_content, diff_text]
    if task_dir:
        for name in ("prd.md", "design.md", "implement.md"):
            path = task_dir / name
            if path.is_file():
                sources.append(path.read_text(encoding="utf-8"))
    combined = "\n".join(sources)
    return {
        "decisions": _matching_lines(combined, ("decision", "decided", "chose", "rationale", "tradeoff", "trade-off")),
        "pitfalls": _matching_lines(combined, ("pitfall", "gotcha", "bug", "failed", "failure", "avoid", "problem")),
        "invariants": _matching_lines(combined, ("invariant", "must", "never", "always", "required", "contract")),
    }


def _render_session_insight_body(
    title: str,
    summary: str,
    task_dir: Path | None,
    task_path: str | None,
    task_data: dict[str, Any],
    commits: list[str],
    changed_files: list[str],
    referenced_specs: list[str],
    reviewers: list[str],
    highlights: dict[str, list[str]],
) -> str:
    lines = [f"### {title}", "", "#### Summary", "", summary.strip() or "(No summary provided.)"]
    if task_path:
        lines += ["", "#### Task", "", f"- Path: `{task_path}`"]
        if task_data.get("title"):
            lines.append(f"- Title: {task_data['title']}")
        why = _task_goal(task_dir) if task_dir else None
        if why:
            lines.append(f"- Why: {why}")
    lines += ["", "#### Commits", ""]
    lines += [f"- `{item}`" for item in commits] if commits else ["- (No commits recorded.)"]
    lines += ["", "#### Changed Files", ""]
    lines += [f"- `{item}`" for item in changed_files] if changed_files else ["- (No changed files found from recorded commits.)"]
    lines += ["", "#### Referenced Specs", ""]
    lines += [f"- `{item}`" for item in referenced_specs] if referenced_specs else ["- (No task spec references found.)"]
    lines += ["", "#### Review", ""]
    lines += [f"- Reviewed by: {', '.join(reviewers)}"] if reviewers else ["- Reviewed by: (not recorded)"]
    for section, heading in (
        ("decisions", "Key Decisions"),
        ("pitfalls", "Pitfalls"),
        ("invariants", "Invariants"),
    ):
        lines += ["", f"#### {heading}", ""]
        values = highlights.get(section) or []
        lines += [f"- {item}" for item in values] if values else ["- (No explicit markers found.)"]
    return "\n".join(lines)


def _task_goal(task_dir: Path) -> str | None:
    prd_path = task_dir / "prd.md"
    if not prd_path.is_file():
        return None
    content = prd_path.read_text(encoding="utf-8")
    match = re.search(r"^##\s+Goal\s*\n+(.+?)(?:\n##\s+|\Z)", content, re.MULTILINE | re.DOTALL)
    if not match:
        return None
    return _compact(match.group(1))


def _matching_lines(content: str, keywords: tuple[str, ...], limit: int = 6) -> list[str]:
    hits: list[str] = []
    for raw in content.splitlines():
        line = raw.strip().lstrip("-*0123456789.[] xX\t").strip()
        if len(line) < 8:
            continue
        lower = line.lower()
        if any(keyword in lower for keyword in keywords):
            compacted = _compact(line, max_len=180)
            if compacted not in hits:
                hits.append(compacted)
        if len(hits) >= limit:
            break
    return hits


def _read_task_json(task_dir: Path | None) -> dict[str, Any]:
    if not task_dir:
        return {}
    path = task_dir / FILE_TASK_JSON
    if not path.is_file():
        return {}
    data = read_json(path)
    return data if isinstance(data, dict) else {}


def _reviewers(task_data: dict[str, Any]) -> list[str]:
    raw_meta = task_data.get("meta")
    meta: dict[str, Any] = raw_meta if isinstance(raw_meta, dict) else {}
    raw = (
        task_data.get("reviewedBy")
        or task_data.get("reviewed_by")
        or meta.get("reviewedBy")
        or meta.get("reviewed_by")
        or meta.get("reviewer")
    )
    return _string_list(raw)


def _string_list(value: Any) -> list[str]:
    if isinstance(value, str):
        return [item.strip() for item in value.split(",") if item.strip()]
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    return []


def _commit_list(commit: str) -> list[str]:
    if not commit or commit == "-":
        return []
    return [item.strip() for item in commit.split(",") if item.strip() and item.strip() != "-"]


def _task_commits(task_data: dict[str, Any]) -> list[str]:
    raw_meta = task_data.get("meta")
    meta: dict[str, Any] = raw_meta if isinstance(raw_meta, dict) else {}
    raw = (
        task_data.get("commit")
        or task_data.get("commits")
        or meta.get("commit")
        or meta.get("commits")
        or ""
    )
    if isinstance(raw, list):
        return [str(item).strip() for item in raw if str(item).strip()]
    return _commit_list(str(raw))


def _resolve_task_dir(repo_root: Path, task_ref: str | None) -> Path | None:
    if not task_ref:
        return None
    normalized = task_ref.replace("\\", "/").strip()
    candidate = Path(normalized)
    if candidate.is_absolute() and candidate.is_dir():
        return candidate
    direct = repo_root / normalized
    if direct.is_dir():
        return direct
    active = repo_root / DIR_WORKFLOW / DIR_TASKS / normalized
    if active.is_dir():
        return active
    archive_root = repo_root / DIR_WORKFLOW / DIR_TASKS / DIR_ARCHIVE
    for path in archive_root.glob(f"*/*{normalized}*"):
        if path.is_dir():
            return path
    return None


def _session_task_dirs(repo_root: Path, task_ref: str | None) -> list[Path]:
    explicit = _resolve_task_dir(repo_root, task_ref)
    if explicit:
        return [explicit]

    return _recent_archive_commit_tasks(repo_root)


def _latest_archived_task(repo_root: Path) -> Path | None:
    archive_root = repo_root / DIR_WORKFLOW / DIR_TASKS / DIR_ARCHIVE
    if not archive_root.is_dir():
        return None
    candidates = [path for path in archive_root.glob("*/*") if path.is_dir()]
    if not candidates:
        return None
    return max(candidates, key=lambda path: path.stat().st_mtime)


def _recent_archive_commit_tasks(repo_root: Path) -> list[Path]:
    rc, out, _ = run_git(["log", "--format=%s", "-20"], cwd=repo_root)
    if rc != 0:
        return []
    task_names: list[str] = []
    prefix = "chore(task): archive "
    for line in out.splitlines():
        message = line.strip()
        if not message.startswith(prefix):
            break
        task_name = message[len(prefix):].strip()
        if task_name:
            task_names.append(task_name)
    task_dirs = [
        task_dir
        for name in reversed(task_names)
        if (task_dir := _resolve_archived_task_dir(repo_root, name)) is not None
    ]
    return task_dirs


def _resolve_archived_task_dir(repo_root: Path, task_name: str) -> Path | None:
    archive_root = repo_root / DIR_WORKFLOW / DIR_TASKS / DIR_ARCHIVE
    if not archive_root.is_dir():
        return None
    for path in archive_root.glob(f"*/{task_name}"):
        if path.is_dir():
            return path
    return None


def _serialize_spec_entry(attrs: dict[str, str | None], body: str) -> str:
    attr_lines = []
    for key, value in attrs.items():
        if value is None or value == "":
            continue
        attr_lines.append(f'  {key}="{_escape_attr(value)}"')
    return f"<spec-entry\n{chr(10).join(attr_lines)}\n>\n\n{body.strip()}\n</spec-entry>\n"


def _escape_attr(value: str) -> str:
    return value.replace("&", "&amp;").replace('"', "&quot;")


def _unique_insight_id(repo_root: Path, title: str) -> str:
    base = f"insight-{_timestamp_slug()}-{_slugify(title)}"
    root = repo_root / SESSION_INSIGHT_ROOT
    existing = ""
    if root.is_dir():
        existing = "\n".join(path.read_text(encoding="utf-8") for path in root.glob("*.md"))
    candidate = base
    index = 2
    while f'id="{candidate}"' in existing:
        candidate = f"{base}-{index}"
        index += 1
    return candidate


def _unique_insight_path(repo_root: Path, title: str) -> Path:
    root = repo_root / SESSION_INSIGHT_ROOT
    base = _slugify(title)
    candidate = root / f"{base}.md"
    if not candidate.exists():
        return candidate
    stamp = _timestamp_slug()
    candidate = root / f"{base}-{stamp}.md"
    index = 2
    while candidate.exists():
        candidate = root / f"{base}-{stamp}-{index}.md"
        index += 1
    return candidate


def _keywords(
    task_name: str | None,
    package: str | None,
    changed_files: list[str],
    referenced_specs: list[str],
) -> list[str]:
    values = ["session-insight", "finish-work"]
    if task_name:
        values.append(_slugify(task_name))
    if package:
        values.append(_slugify(package))
    if changed_files:
        values.append("diff")
    if referenced_specs:
        values.append("spec")
    return [value for value in values if value]


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "session"


def _timestamp_slug() -> str:
    return datetime.now().strftime("%Y%m%d-%H%M%S")


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _relative(repo_root: Path, path: Path) -> str:
    try:
        return path.relative_to(repo_root).as_posix()
    except ValueError:
        return path.as_posix()


def _compact(value: str, max_len: int = 240) -> str:
    compacted = re.sub(r"\s+", " ", value).strip()
    return compacted if len(compacted) <= max_len else f"{compacted[:max_len - 3]}..."
