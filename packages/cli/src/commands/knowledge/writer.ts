import fs from "node:fs";
import path from "node:path";

import { PATHS } from "../../constants/paths.js";
import {
  parseKeywordCsv,
  parseSpecEntries,
  serializeSpecEntry,
  type SpecEntry,
  type SpecEntryAttrs,
} from "./spec-entry.js";
import { scanKnowledge } from "./store.js";

export const CREATED_KNOWLEDGE_RELATIVE_ROOT = `${PATHS.SPEC}/wiki`;

export interface KnowledgeCreateInput {
  type: string;
  slug: string;
  title: string;
  body?: string;
  category?: string;
  keywords?: string[];
  source?: string;
  status?: string;
  parent?: string;
  related?: string[];
  attrs?: Record<string, string | string[] | undefined>;
  now?: Date;
}

export interface KnowledgeUpdateInput {
  title?: string;
  body?: string;
  category?: string;
  keywords?: string[];
  source?: string;
  status?: string;
  parent?: string;
  related?: string[];
  attrs?: Record<string, string | string[] | undefined>;
}

export interface KnowledgeAppendInput {
  type?: string;
  title: string;
  body: string;
  category?: string;
  keywords?: string[];
  source?: string;
  status?: string;
  related?: string[];
  attrs?: Record<string, string | string[] | undefined>;
  now?: Date;
}

export interface KnowledgeWriteResult {
  id: string;
  filePath: string;
  relativePath: string;
}

export function createKnowledgeEntry(
  cwd: string,
  input: KnowledgeCreateInput,
): KnowledgeWriteResult {
  const type = requiredToken(input.type, "type");
  const slug = requiredSlug(input.slug);
  const title = requiredText(input.title, "title");
  const relativePath = `${CREATED_KNOWLEDGE_RELATIVE_ROOT}/${type}/${slug}.md`;
  const filePath = path.join(cwd, relativePath);
  if (fs.existsSync(filePath)) {
    throw new Error(`knowledge entry file already exists: ${relativePath}`);
  }

  const id = `${type}-${slug}`;
  if (scanKnowledge(cwd).documents.some((doc) => doc.id === id)) {
    throw new Error(`knowledge entry id already exists: ${id}`);
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const attrs = attrsFor(id, {
    type,
    category: input.category ?? type,
    keywords: input.keywords,
    source: input.source ?? "manual",
    date: (input.now ?? new Date()).toISOString().slice(0, 10),
    status: input.status,
    parent: input.parent,
    related: input.related,
    attrs: input.attrs,
  });
  const content = `${serializeSpecEntry(attrs, bodyWithTitle(title, input.body ?? ""))}`;
  fs.writeFileSync(filePath, content, "utf-8");
  return { id, filePath, relativePath };
}

export function updateKnowledgeEntry(
  cwd: string,
  id: string,
  input: KnowledgeUpdateInput,
): KnowledgeWriteResult {
  const entry = findEntryOrThrow(cwd, id);
  const content = fs.readFileSync(entry.filePath, "utf-8");
  const parsed = parseSpecEntries(content, entry.filePath);
  const current = parsed.entries.find((item) => item.attrs.id === id);
  if (!current) throw new Error(`knowledge entry not found: ${id}`);

  const attrs: SpecEntryAttrs = {
    ...current.attrs,
    category: input.category ?? current.attrs.category,
    keywords: input.keywords ?? current.attrs.keywords,
    source: input.source ?? current.attrs.source,
    status: input.status ?? current.attrs.status,
    parent: input.parent ?? current.attrs.parent,
    related: input.related ?? current.attrs.related,
    ...normalizeExtraAttrs(input.attrs),
  };
  const body =
    input.title !== undefined || input.body !== undefined
      ? bodyWithTitle(
          input.title ?? markdownTitle(current.body) ?? current.attrs.id,
          input.body ?? stripLeadingTitle(current.body),
        )
      : current.body;
  replaceEntryBlock(entry.filePath, content, current, serializeSpecEntry(attrs, body));
  return {
    id,
    filePath: entry.filePath,
    relativePath: normalizeRelative(cwd, entry.filePath),
  };
}

export function appendKnowledgeEntry(
  cwd: string,
  containerId: string,
  input: KnowledgeAppendInput,
): KnowledgeWriteResult {
  const container = scanKnowledge(cwd).documents.find((doc) => doc.id === containerId);
  if (!container) throw new Error(`container not found: ${containerId}`);
  if (!container.filePath.endsWith(".md")) {
    throw new Error(`container is not a markdown file: ${containerId}`);
  }
  const content = fs.readFileSync(container.filePath, "utf-8");
  const id = uniqueChildId(content, container.filePath, input.type ?? "entry");
  const attrs = attrsFor(id, {
    type: input.type ?? "entry",
    category: input.category ?? container.category ?? "knowledge",
    keywords: input.keywords,
    source: input.source ?? "manual",
    date: (input.now ?? new Date()).toISOString().slice(0, 10),
    status: input.status,
    related: input.related,
    attrs: input.attrs,
  });
  const entryText = serializeSpecEntry(attrs, bodyWithTitle(input.title, input.body));
  const separator = content.endsWith("\n") ? "\n" : "\n\n";
  fs.writeFileSync(container.filePath, `${content}${separator}${entryText}`, "utf-8");
  return {
    id,
    filePath: container.filePath,
    relativePath: normalizeRelative(cwd, container.filePath),
  };
}

export function removeKnowledgeEntry(
  cwd: string,
  id: string,
): KnowledgeWriteResult {
  const entry = findEntryOrThrow(cwd, id);
  const content = fs.readFileSync(entry.filePath, "utf-8");
  const parsed = parseSpecEntries(content, entry.filePath);
  const current = parsed.entries.find((item) => item.attrs.id === id);
  if (!current) throw new Error(`knowledge entry not found: ${id}`);
  replaceEntryBlock(entry.filePath, content, current, "");
  return {
    id,
    filePath: entry.filePath,
    relativePath: normalizeRelative(cwd, entry.filePath),
  };
}

export function deleteKnowledgeDocument(
  cwd: string,
  id: string,
): KnowledgeWriteResult {
  const doc = scanKnowledge(cwd).documents.find((item) => item.id === id);
  if (!doc) throw new Error(`knowledge document not found: ${id}`);
  const relativePath = normalizeRelative(cwd, doc.filePath);
  if (relativePath.startsWith(`${CREATED_KNOWLEDGE_RELATIVE_ROOT}/`)) {
    fs.unlinkSync(doc.filePath);
    return { id, filePath: doc.filePath, relativePath };
  }
  if (doc.type === "spec-entry") {
    return removeKnowledgeEntry(cwd, id);
  }
  throw new Error(
    `refusing to delete markdown outside ${CREATED_KNOWLEDGE_RELATIVE_ROOT}: ${id}`,
  );
}

function attrsFor(
  id: string,
  input: {
    type: string;
    category: string;
    keywords?: string[];
    source: string;
    date: string;
    status?: string;
    parent?: string;
    related?: string[] | string;
    attrs?: Record<string, string | string[] | undefined>;
  },
): SpecEntryAttrs {
  return {
    id,
    type: input.type,
    category: input.category,
    keywords: normalizeKeywords(input.keywords),
    source: input.source,
    date: input.date,
    status: blankToUndefined(input.status),
    parent: blankToUndefined(input.parent),
    related: Array.isArray(input.related)
      ? nonEmptyList(normalizeKeywords(input.related))
      : blankToUndefined(input.related),
    ...normalizeExtraAttrs(input.attrs),
  };
}

function nonEmptyList(values: string[]): string[] | undefined {
  return values.length > 0 ? values : undefined;
}

function normalizeExtraAttrs(
  attrs: Record<string, string | string[] | undefined> | undefined,
): Record<string, string | string[]> {
  const normalized: Record<string, string | string[]> = {};
  for (const [key, value] of Object.entries(attrs ?? {})) {
    if (!/^[A-Za-z_][A-Za-z0-9_-]*$/.test(key)) continue;
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      const values = normalizeKeywords(value);
      if (values.length > 0) normalized[key] = values;
      continue;
    }
    const scalar = blankToUndefined(value);
    if (scalar !== undefined) normalized[key] = scalar;
  }
  return normalized;
}

function findEntryOrThrow(cwd: string, id: string): SpecEntry {
  const entry = scanKnowledge(cwd).entries.find((item) => item.attrs.id === id);
  if (!entry) throw new Error(`knowledge entry not found: ${id}`);
  return entry;
}

function replaceEntryBlock(
  filePath: string,
  content: string,
  entry: SpecEntry,
  replacement: string,
): void {
  const nextContent =
    content.slice(0, entry.startOffset) +
    replacement.trimEnd() +
    content.slice(entry.endOffset);
  fs.writeFileSync(filePath, `${nextContent.trimEnd()}\n`, "utf-8");
}

function uniqueChildId(content: string, filePath: string, type: string): string {
  const existing = new Set(
    parseSpecEntries(content, filePath).entries.map((entry) => entry.attrs.id),
  );
  let index = existing.size + 1;
  while (true) {
    const id = `${type}-${String(index).padStart(3, "0")}`;
    if (!existing.has(id)) return id;
    index++;
  }
}

function bodyWithTitle(title: string, body: string): string {
  const trimmedBody = body.trim();
  return trimmedBody ? `### ${title}\n\n${trimmedBody}` : `### ${title}`;
}

function markdownTitle(content: string): string | undefined {
  return content.match(/^#{1,3}\s+(.+)$/m)?.[1]?.trim();
}

function stripLeadingTitle(content: string): string {
  return content.replace(/^#{1,3}\s+.+\r?\n?/, "").trim();
}

function requiredText(value: string, field: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${field} is required`);
  return trimmed;
}

function requiredToken(value: string, field: string): string {
  const trimmed = requiredText(value, field).toLowerCase();
  if (!/^[a-z][a-z0-9-]*$/.test(trimmed)) {
    throw new Error(`${field} must be kebab-case`);
  }
  return trimmed;
}

function requiredSlug(value: string): string {
  return requiredToken(value, "slug");
}

function normalizeKeywords(values: string[] | undefined): string[] {
  return [
    ...new Set(
      (values ?? [])
        .flatMap((value) => parseKeywordCsv(value))
        .map((value) => value.toLowerCase())
        .filter(Boolean),
    ),
  ];
}

function blankToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed;
}

function normalizeRelative(cwd: string, filePath: string): string {
  return path.relative(cwd, filePath).replace(/\\/g, "/");
}
