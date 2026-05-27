#!/usr/bin/env python3
"""
Local DevFlow knowledge management.

This script is installed into every project so AI workflows can search and load
project knowledge without depending on the global devflow CLI after init.
"""

from __future__ import annotations

import argparse
import builtins
import json
import re
import secrets
import sys
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from common.paths import (
    DIR_SPEC,
    DIR_TASKS,
    DIR_WORKFLOW,
    DIR_WORKSPACE,
    get_current_task,
    get_repo_root,
)
from common.devflow_config import tr as _tr


MARKDOWN_EXT = ".md"
SPEC_ENTRY_CLOSE = "</spec-entry>"
SPEC_ENTRY_OPEN_RE = re.compile(r"<spec-entry\b([^>]*)>")
ATTR_RE = re.compile(r'([A-Za-z_][A-Za-z0-9_-]*)="([^"]*)"')
TOKEN_RE = re.compile(r"[^\w-]+", re.UNICODE)
REQUIRED_ATTRS = ("id", "type", "category", "keywords", "source", "date")

_ORIGINAL_PRINT = builtins.print


def _zh_text(value: str) -> str:
    replacements = {
        "Search, load, and capture local DevFlow knowledge": "搜索、加载和沉淀本地 DevFlow 知识",
        "Capture a reusable learning": "记录可复用经验",
        "List structured knowledge entries": "列出结构化知识条目",
        "Search local knowledge": "搜索本地知识",
        "Show one knowledge entry": "显示一条知识",
        "Load one or more knowledge entries": "加载一条或多条知识",
        "Check knowledge store health": "检查知识库健康状态",
        "Show knowledge store statistics": "显示知识库统计",
        "usage: knowledge.py search <query>": "用法：knowledge.py search <查询>",
        "usage: knowledge.py learn <insight>": "用法：knowledge.py learn <经验>",
        "(no matches)": "（无匹配）",
        "(no entries)": "（无条目）",
        "no entries found for requested ids": "未找到请求 id 对应的条目",
        "Knowledge Documents": "知识文档",
        "Title:": "标题：",
        "Path:": "路径：",
        "Keywords:": "关键词：",
        "Source:": "来源：",
        "Captured learning:": "已记录经验：",
        "Documents:": "文档数：",
        "Spec entries:": "Spec 条目数：",
        "Diagnostics:": "诊断数：",
        "Duplicate ids:": "重复 id 数：",
        "Types:": "类型：",
        "warning: not found:": "警告：未找到：",
        "knowledge entry not found:": "未找到知识条目：",
        " loaded)": " 已加载）",
        " loaded": " 已加载",
    }
    for en, zh in replacements.items():
        value = value.replace(en, zh)
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


@dataclass
class KnowledgeDocument:
    id: str
    type: str
    collection: str
    title: str
    body: str
    file_path: Path
    relative_path: str
    line: int
    entry_type: str | None = None
    category: str | None = None
    keywords: list[str] = field(default_factory=list)
    source: str | None = None
    date: str | None = None
    status: str | None = None
    related: list[str] = field(default_factory=list)
    parent: str | None = None
    attrs: dict[str, Any] = field(default_factory=dict)

    def to_json(self) -> dict[str, Any]:
        result: dict[str, Any] = {
            "id": self.id,
            "type": self.type,
            "collection": self.collection,
            "title": self.title,
            "body": self.body,
            "filePath": str(self.file_path),
            "relativePath": self.relative_path,
            "line": self.line,
            "keywords": self.keywords,
            "related": self.related,
        }
        optional = {
            "entryType": self.entry_type,
            "category": self.category,
            "source": self.source,
            "date": self.date,
            "status": self.status,
            "parent": self.parent,
            "attrs": self.attrs or None,
        }
        for key, value in optional.items():
            if value is not None:
                result[key] = value
        return result


@dataclass
class SpecEntry:
    attrs: dict[str, Any]
    body: str
    file_path: Path
    start_line: int


@dataclass
class SpecEntryDiagnostic:
    message: str
    file_path: Path
    line: int

    def to_json(self) -> dict[str, Any]:
        return {
            "severity": "warning",
            "message": self.message,
            "filePath": str(self.file_path),
            "line": self.line,
        }


def parse_keyword_csv(value: str | list[str] | None) -> list[str]:
    if value is None:
        return []
    raw = ",".join(value) if isinstance(value, list) else value
    return [item.strip() for item in raw.split(",") if item.strip()]


def line_number_at(content: str, index: int) -> int:
    return content.count("\n", 0, index) + 1


def parse_attrs(raw: str) -> dict[str, str]:
    return {match.group(1): match.group(2) for match in ATTR_RE.finditer(raw)}


def parse_spec_entries(content: str, file_path: Path) -> tuple[list[SpecEntry], list[SpecEntryDiagnostic]]:
    entries: list[SpecEntry] = []
    diagnostics: list[SpecEntryDiagnostic] = []
    search_at = 0

    while True:
        match = SPEC_ENTRY_OPEN_RE.search(content, search_at)
        if not match:
            break

        start_line = line_number_at(content, match.start())
        body_start = match.end()
        close_index = content.find(SPEC_ENTRY_CLOSE, body_start)
        if close_index == -1:
            diagnostics.append(
                SpecEntryDiagnostic(
                    "Malformed spec-entry block: missing closing </spec-entry>",
                    file_path,
                    start_line,
                )
            )
            search_at = body_start
            continue

        parsed_attrs = parse_attrs(match.group(1) or "")
        missing = [attr for attr in REQUIRED_ATTRS if not parsed_attrs.get(attr)]
        if missing:
            diagnostics.append(
                SpecEntryDiagnostic(
                    f"Spec-entry is missing required attribute(s): {', '.join(missing)}",
                    file_path,
                    start_line,
                )
            )
        else:
            attrs: dict[str, Any] = {
                **parsed_attrs,
                "keywords": parse_keyword_csv(parsed_attrs.get("keywords")),
            }
            if parsed_attrs.get("code_paths"):
                attrs["code_paths"] = parse_keyword_csv(parsed_attrs.get("code_paths"))
            entries.append(
                SpecEntry(
                    attrs=attrs,
                    body=content[body_start:close_index].strip(),
                    file_path=file_path,
                    start_line=start_line,
                )
            )

        search_at = close_index + len(SPEC_ENTRY_CLOSE)

    return entries, diagnostics


def markdown_title(content: str) -> str | None:
    for line in content.splitlines():
        match = re.match(r"^#{1,3}\s+(.+)$", line)
        if match:
            return match.group(1).strip()
    return None


def read_text(file_path: Path) -> str | None:
    try:
        return file_path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return None


def relative_path(repo_root: Path, file_path: Path) -> str:
    try:
        return file_path.relative_to(repo_root).as_posix()
    except ValueError:
        return str(file_path)


def walk_markdown(root: Path) -> list[Path]:
    if not root.is_dir():
        return []
    result: list[Path] = []
    for file_path in root.rglob(f"*{MARKDOWN_EXT}"):
        if any(part in {".runtime", "__pycache__"} for part in file_path.parts):
            continue
        if file_path.is_file():
            result.append(file_path)
    return sorted(result)


def scan_roots(repo_root: Path) -> list[tuple[str, Path]]:
    workflow_dir = repo_root / DIR_WORKFLOW
    return [
        ("spec", workflow_dir / DIR_SPEC),
        ("task", workflow_dir / DIR_TASKS),
        ("journal", workflow_dir / DIR_WORKSPACE),
    ]


def spec_entry_to_document(repo_root: Path, entry: SpecEntry, collection: str) -> KnowledgeDocument:
    attrs = entry.attrs
    related = parse_keyword_csv(attrs.get("related"))
    return KnowledgeDocument(
        id=str(attrs["id"]),
        type="spec-entry",
        entry_type=str(attrs["type"]),
        collection=collection,
        title=markdown_title(entry.body) or str(attrs["id"]),
        body=entry.body,
        file_path=entry.file_path,
        relative_path=relative_path(repo_root, entry.file_path),
        line=entry.start_line,
        category=str(attrs.get("category") or "") or None,
        keywords=list(attrs.get("keywords") or []),
        source=str(attrs.get("source") or "") or None,
        date=str(attrs.get("date") or "") or None,
        status=str(attrs.get("status") or "") or None,
        related=related,
        parent=str(attrs.get("parent") or "") or None,
        attrs=attrs,
    )


def scan_knowledge(repo_root: Path) -> tuple[list[KnowledgeDocument], list[SpecEntry], list[SpecEntryDiagnostic]]:
    documents: list[KnowledgeDocument] = []
    entries: list[SpecEntry] = []
    diagnostics: list[SpecEntryDiagnostic] = []

    for collection, root in scan_roots(repo_root):
        for file_path in walk_markdown(root):
            content = read_text(file_path)
            if content is None:
                continue

            parsed_entries, parsed_diagnostics = parse_spec_entries(content, file_path)
            entries.extend(parsed_entries)
            diagnostics.extend(parsed_diagnostics)
            for entry in parsed_entries:
                documents.append(spec_entry_to_document(repo_root, entry, collection))

            rel_path = relative_path(repo_root, file_path)
            documents.append(
                KnowledgeDocument(
                    id=f"file:{rel_path}",
                    type="markdown",
                    collection=collection,
                    title=markdown_title(content) or file_path.name,
                    body=content.strip(),
                    file_path=file_path,
                    relative_path=rel_path,
                    line=1,
                )
            )

    return documents, entries, diagnostics


def tokenize(value: str) -> list[str]:
    tokens = [token.strip().lower() for token in TOKEN_RE.split(value) if token.strip()]
    return list(dict.fromkeys(tokens))


def matches_filters(doc: KnowledgeDocument, args: argparse.Namespace) -> bool:
    query_type = getattr(args, "type", None)
    category = getattr(args, "category", None)
    keyword = getattr(args, "keyword", None)
    tool = bool(getattr(args, "tool", False))

    if query_type == "learning" and doc.entry_type != "learning":
        return False
    if query_type == "knowhow" and doc.entry_type != "knowhow":
        return False
    if query_type in {"spec", "task", "journal"} and doc.collection != query_type:
        return False
    if query_type == "spec-entry" and doc.type != "spec-entry":
        return False
    if query_type == "markdown" and doc.type != "markdown":
        return False
    if category and (doc.category or "").lower() != category.lower():
        return False
    if keyword and keyword.lower() not in [item.lower() for item in doc.keywords]:
        return False
    if tool and not (doc.entry_type == "knowhow" and str(doc.attrs.get("tool")) == "true"):
        return False
    return True


def count_occurrences(haystack: str, needle: str) -> int:
    count = 0
    index = 0
    while True:
        index = haystack.find(needle, index)
        if index == -1:
            return count
        count += 1
        index += len(needle)


def score_document(doc: KnowledgeDocument, tokens: list[str]) -> int:
    title = doc.title.lower()
    body = doc.body.lower()
    path = doc.relative_path.lower()
    keywords = [item.lower() for item in doc.keywords]
    score = 0
    for token in tokens:
        if token in title:
            score += 8
        if token in keywords:
            score += 12
        if (doc.category or "").lower() == token:
            score += 6
        if token in path:
            score += 3
        score += min(count_occurrences(body, token), 10)
    if score > 0 and doc.type == "spec-entry":
        score += 2
    return score


def snippet_for(doc: KnowledgeDocument, tokens: list[str]) -> str:
    body = re.sub(r"\s+", " ", doc.body).strip()
    if not body:
        return ""
    lower = body.lower()
    first = -1
    for token in tokens:
        index = lower.find(token)
        if index != -1 and (first == -1 or index < first):
            first = index
    if first == -1:
        return body[:180]
    start = max(0, first - 70)
    end = min(len(body), first + 140)
    return f"{'...' if start > 0 else ''}{body[start:end]}{'...' if end < len(body) else ''}"


def parse_limit(value: str | None) -> int:
    try:
        parsed = int(value or "20")
    except ValueError:
        return 20
    return max(1, parsed)


def cmd_search(args: argparse.Namespace) -> int:
    repo_root = get_repo_root()
    query = " ".join(args.query).strip()
    if not query:
        print("usage: knowledge.py search <query>", file=sys.stderr)
        return 1

    documents, _, _ = scan_knowledge(repo_root)
    tokens = tokenize(query)
    hits = []
    for doc in documents:
        if not matches_filters(doc, args):
            continue
        score = score_document(doc, tokens)
        if score <= 0:
            continue
        hits.append({"document": doc, "score": score, "snippet": snippet_for(doc, tokens)})
    hits.sort(key=lambda hit: (-int(hit["score"]), hit["document"].relative_path))
    hits = hits[: parse_limit(args.limit)]

    if args.json:
        print(json.dumps({"hits": [hit_to_json(hit) for hit in hits]}, indent=2, ensure_ascii=False))
        return 0
    if not hits:
        print("(no matches)")
        return 0
    for hit in hits:
        doc = hit["document"]
        print(f"[{hit['score']}] {doc.id}  {doc.title}  {doc.relative_path}:{doc.line}")
        if hit["snippet"]:
            print(f"  {hit['snippet']}")
    return 0


def hit_to_json(hit: dict[str, Any]) -> dict[str, Any]:
    return {
        "document": hit["document"].to_json(),
        "score": hit["score"],
        "snippet": hit["snippet"],
    }


def cmd_list(args: argparse.Namespace) -> int:
    repo_root = get_repo_root()
    documents, _, _ = scan_knowledge(repo_root)
    rows = [
        doc
        for doc in documents
        if doc.type == "spec-entry" and matches_filters(doc, args)
    ][: parse_limit(args.limit)]
    if args.json:
        print(json.dumps({"entries": [doc.to_json() for doc in rows]}, indent=2, ensure_ascii=False))
        return 0
    if not rows:
        print("(no entries)")
        return 0
    for doc in rows:
        print(f"{doc.id}  [{doc.category or doc.type}] {doc.title}  {doc.relative_path}:{doc.line}")
    return 0


def find_documents_by_id(repo_root: Path, ids: list[str]) -> tuple[list[KnowledgeDocument], list[str]]:
    documents, _, _ = scan_knowledge(repo_root)
    by_id = {doc.id: doc for doc in documents}
    found = [by_id[id_value] for id_value in ids if id_value in by_id]
    missing = [id_value for id_value in ids if id_value not in by_id]
    return found, missing


def cmd_show(args: argparse.Namespace) -> int:
    repo_root = get_repo_root()
    found, _ = find_documents_by_id(repo_root, [args.id])
    if not found:
        print(f"knowledge entry not found: {args.id}", file=sys.stderr)
        return 1
    doc = found[0]
    if args.json:
        print(json.dumps({"document": doc.to_json()}, indent=2, ensure_ascii=False))
        return 0
    print(f"{doc.id}  [{doc.category or doc.type}]")
    print(f"Title: {doc.title}")
    print(f"Path: {doc.relative_path}:{doc.line}")
    if doc.keywords:
        print(f"Keywords: {', '.join(doc.keywords)}")
    print("")
    print(doc.body)
    return 0


def cmd_load(args: argparse.Namespace) -> int:
    repo_root = get_repo_root()
    found, missing = find_documents_by_id(repo_root, args.ids)
    if args.json:
        print(
            json.dumps(
                {"entries": [doc.to_json() for doc in found], "missing": missing},
                indent=2,
                ensure_ascii=False,
            )
        )
        return 0
    for missing_id in missing:
        print(f"warning: not found: {missing_id}", file=sys.stderr)
    if not found:
        print("no entries found for requested ids", file=sys.stderr)
        return 1
    print(f"# Knowledge Documents ({len(found)} loaded)")
    for doc in found:
        print(f"\n---\n\n## [{doc.category or doc.type}] {doc.title}")
        print(f"\nSource: {doc.relative_path}:{doc.line}\n")
        print(doc.body)
    return 0


def learning_store_path(repo_root: Path) -> Path:
    return repo_root / DIR_WORKFLOW / DIR_SPEC / "guides" / "learnings.md"


def learning_scaffold() -> str:
    return (
        "# Project Learnings\n\n"
        "Append-only reusable insights captured by `knowledge.py learn`.\n\n"
        "Entries use closed `<spec-entry>` blocks so they can live inside normal\n"
        "markdown while still being searchable and loadable as structured knowledge.\n"
    )


def ensure_learning_store(repo_root: Path) -> Path:
    path = learning_store_path(repo_root)
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        path.write_text(learning_scaffold(), encoding="utf-8")
    return path


def make_learning_id(now: datetime) -> str:
    date = now.strftime("%Y%m%d")
    return f"DFL-{date}-{secrets.token_hex(4)}"


def escape_attr(value: str) -> str:
    return value.replace("&", "&amp;").replace('"', "&quot;")


def serialize_spec_entry(attrs: dict[str, Any], body: str) -> str:
    lines = []
    for key, value in attrs.items():
        if value is None:
            continue
        rendered = ",".join(value) if isinstance(value, list) else str(value)
        lines.append(f'  {key}="{escape_attr(rendered)}"')
    return f"<spec-entry\n{chr(10).join(lines)}\n>\n\n{body.strip()}\n</spec-entry>\n"


def title_from_insight(insight: str) -> str:
    first_line = insight.strip().splitlines()[0] if insight.strip() else ""
    stripped = re.sub(r"^#+\s*", "", first_line).strip()
    if not stripped:
        return "Learning"
    return f"{stripped[:77]}..." if len(stripped) > 80 else stripped


def render_learning_body(title: str, insight: str) -> str:
    trimmed = insight.strip()
    if re.search(r"^###\s+", trimmed, re.MULTILINE):
        return trimmed
    return f"### {title}\n\n{trimmed}"


def resolve_task_arg(repo_root: Path, value: str | bool | None) -> str | None:
    if value is True or value == "current":
        return get_current_task(repo_root)
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None


def cmd_learn(args: argparse.Namespace) -> int:
    repo_root = get_repo_root()
    insight = " ".join(args.insight).strip()
    if not insight:
        print("usage: knowledge.py learn <insight>", file=sys.stderr)
        return 1

    path = ensure_learning_store(repo_root)
    existing = path.read_text(encoding="utf-8")
    existing_entries, _ = parse_spec_entries(existing, path)
    existing_ids = {str(entry.attrs["id"]) for entry in existing_entries}
    now = datetime.now(timezone.utc)
    entry_id = args.id or make_learning_id(now)
    while entry_id in existing_ids:
        entry_id = make_learning_id(now)

    title = args.title or title_from_insight(insight)
    attrs = {
        "id": entry_id,
        "type": "learning",
        "category": args.category or "learning",
        "keywords": [item.lower() for item in parse_keyword_csv(args.keywords)],
        "source": args.source or "manual",
        "date": now.date().isoformat(),
        "task": resolve_task_arg(repo_root, args.task),
        "package": args.package,
        "layer": args.layer,
        "confidence": args.confidence,
    }
    entry_text = serialize_spec_entry(attrs, render_learning_body(title, insight))
    separator = "\n" if existing.endswith("\n") else "\n\n"
    path.write_text(f"{existing}{separator}{entry_text}", encoding="utf-8")

    rel_path = relative_path(repo_root, path)
    if args.json:
        print(json.dumps({"id": entry_id, "relativePath": rel_path}, indent=2, ensure_ascii=False))
        return 0
    print(f"Captured learning: {entry_id}")
    print(f"Path: {rel_path}")
    return 0


def cmd_health(args: argparse.Namespace) -> int:
    repo_root = get_repo_root()
    documents, entries, diagnostics = scan_knowledge(repo_root)
    id_locations: dict[str, list[dict[str, Any]]] = {}
    for entry in entries:
        id_locations.setdefault(str(entry.attrs["id"]), []).append(
            {"filePath": str(entry.file_path), "line": entry.start_line}
        )
    duplicate_ids = [
        {"id": entry_id, "locations": locations}
        for entry_id, locations in id_locations.items()
        if len(locations) > 1
    ]
    health = {
        "documents": len(documents),
        "specEntries": len(entries),
        "diagnostics": [diagnostic.to_json() for diagnostic in diagnostics],
        "duplicateIds": duplicate_ids,
    }
    if args.json:
        print(json.dumps(health, indent=2, ensure_ascii=False))
        return 0
    print(f"Documents: {health['documents']}")
    print(f"Spec entries: {health['specEntries']}")
    print(f"Diagnostics: {len(diagnostics)}")
    print(f"Duplicate ids: {len(duplicate_ids)}")
    return 0 if not diagnostics and not duplicate_ids else 1


def cmd_stats(args: argparse.Namespace) -> int:
    repo_root = get_repo_root()
    documents, entries, _ = scan_knowledge(repo_root)
    by_type: dict[str, int] = {}
    by_category: dict[str, int] = {}
    keywords: dict[str, int] = {}
    for doc in documents:
        key = doc.entry_type or doc.type
        by_type[key] = by_type.get(key, 0) + 1
        if doc.category:
            by_category[doc.category] = by_category.get(doc.category, 0) + 1
        for keyword in doc.keywords:
            keywords[keyword] = keywords.get(keyword, 0) + 1
    stats = {
        "documents": len(documents),
        "specEntries": len(entries),
        "byType": dict(sorted(by_type.items())),
        "byCategory": dict(sorted(by_category.items())),
        "topKeywords": [
            {"keyword": keyword, "count": count}
            for keyword, count in sorted(keywords.items(), key=lambda item: (-item[1], item[0]))[:20]
        ],
    }
    if args.json:
        print(json.dumps(stats, indent=2, ensure_ascii=False))
        return 0
    print(f"Documents: {stats['documents']}")
    print(f"Spec entries: {stats['specEntries']}")
    print("Types:")
    for key, value in stats["byType"].items():
        print(f"  {key}: {value}")
    return 0


def add_filter_options(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--category")
    parser.add_argument("--keyword")
    parser.add_argument("--type", choices=["learning", "knowhow", "spec", "task", "journal", "spec-entry", "markdown"])
    parser.add_argument("--tool", action="store_true")
    parser.add_argument("--limit", default="20")
    parser.add_argument("--json", action="store_true")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=_h(
            "Search, load, and capture local DevFlow knowledge",
            "搜索、加载和沉淀本地 DevFlow 知识",
        )
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    p_learn = subparsers.add_parser("learn", help=_h("Capture a reusable learning", "记录可复用经验"))
    p_learn.add_argument("insight", nargs="+")
    p_learn.add_argument("--title")
    p_learn.add_argument("--category")
    p_learn.add_argument("--keywords")
    p_learn.add_argument("--source")
    p_learn.add_argument("--task", nargs="?", const=True)
    p_learn.add_argument("--package")
    p_learn.add_argument("--layer")
    p_learn.add_argument("--confidence")
    p_learn.add_argument("--id")
    p_learn.add_argument("--json", action="store_true")
    p_learn.set_defaults(func=cmd_learn)

    p_list = subparsers.add_parser("list", aliases=["ls"], help=_h("List structured knowledge entries", "列出结构化知识条目"))
    add_filter_options(p_list)
    p_list.set_defaults(func=cmd_list)

    p_search = subparsers.add_parser("search", help=_h("Search local knowledge", "搜索本地知识"))
    p_search.add_argument("query", nargs="+")
    add_filter_options(p_search)
    p_search.set_defaults(func=cmd_search)

    p_show = subparsers.add_parser("show", aliases=["get"], help=_h("Show one knowledge entry", "显示一条知识"))
    p_show.add_argument("id")
    p_show.add_argument("--json", action="store_true")
    p_show.set_defaults(func=cmd_show)

    p_load = subparsers.add_parser("load", help=_h("Load one or more knowledge entries", "加载一条或多条知识"))
    p_load.add_argument("ids", nargs="+")
    p_load.add_argument("--json", action="store_true")
    p_load.set_defaults(func=cmd_load)

    p_health = subparsers.add_parser("health", help=_h("Check knowledge store health", "检查知识库健康状态"))
    p_health.add_argument("--json", action="store_true")
    p_health.set_defaults(func=cmd_health)

    p_stats = subparsers.add_parser("stats", help=_h("Show knowledge store statistics", "显示知识库统计"))
    p_stats.add_argument("--json", action="store_true")
    p_stats.set_defaults(func=cmd_stats)

    return parser


def main() -> int:
    _install_output_localization()
    parser = build_parser()
    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
