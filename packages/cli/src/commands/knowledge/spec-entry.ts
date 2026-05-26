export interface SpecEntryAttrs {
  id: string;
  type: string;
  category: string;
  keywords: string[];
  source: string;
  date: string;
  task?: string;
  package?: string;
  layer?: string;
  confidence?: string;
  derived_from?: string;
  [key: string]: string | string[] | undefined;
}

export interface SpecEntry {
  attrs: SpecEntryAttrs;
  body: string;
  filePath: string;
  startLine: number;
  startOffset: number;
  endOffset: number;
}

export interface SpecEntryDiagnostic {
  severity: "warning";
  message: string;
  filePath: string;
  line: number;
}

export interface ParseSpecEntriesResult {
  entries: SpecEntry[];
  diagnostics: SpecEntryDiagnostic[];
}

const SPEC_ENTRY_OPEN_RE = /<spec-entry\b([^>]*)>/g;
const SPEC_ENTRY_CLOSE = "</spec-entry>";
const ATTR_RE = /([A-Za-z_][A-Za-z0-9_-]*)="([^"]*)"/g;

const REQUIRED_ATTRS = [
  "id",
  "type",
  "category",
  "keywords",
  "source",
  "date",
] as const;

const LIST_ATTRS = ["code_paths"] as const;

export function parseKeywordCsv(value: string | undefined): string[] {
  return (
    value
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  );
}

function lineNumberAt(content: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index; i++) {
    if (content.charCodeAt(i) === 10) line++;
  }
  return line;
}

function parseAttrs(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  let match: RegExpExecArray | null;
  ATTR_RE.lastIndex = 0;
  while ((match = ATTR_RE.exec(raw)) !== null) {
    const [, key, value] = match;
    if (key !== undefined && value !== undefined) attrs[key] = value;
  }
  return attrs;
}

export function parseSpecEntries(
  content: string,
  filePath: string,
): ParseSpecEntriesResult {
  const entries: SpecEntry[] = [];
  const diagnostics: SpecEntryDiagnostic[] = [];
  let match: RegExpExecArray | null;
  SPEC_ENTRY_OPEN_RE.lastIndex = 0;

  while ((match = SPEC_ENTRY_OPEN_RE.exec(content)) !== null) {
    const attrsRaw = match[1] ?? "";
    const bodyStart = SPEC_ENTRY_OPEN_RE.lastIndex;
    const startLine = lineNumberAt(content, match.index);
    const closeIndex = content.indexOf(SPEC_ENTRY_CLOSE, bodyStart);

    if (closeIndex === -1) {
      diagnostics.push({
        severity: "warning",
        message: "Malformed spec-entry block: missing closing </spec-entry>",
        filePath,
        line: startLine,
      });
      continue;
    }

    const parsedAttrs = parseAttrs(attrsRaw);
    const missing = REQUIRED_ATTRS.filter((attr) => !parsedAttrs[attr]);
    if (missing.length > 0) {
      diagnostics.push({
        severity: "warning",
        message: `Spec-entry is missing required attribute(s): ${missing.join(", ")}`,
        filePath,
        line: startLine,
      });
    }

    if (missing.length === 0) {
      entries.push({
        attrs: {
          ...parsedAttrs,
          id: parsedAttrs.id ?? "",
          type: parsedAttrs.type ?? "",
          category: parsedAttrs.category ?? "",
          keywords: parseKeywordCsv(parsedAttrs.keywords),
          source: parsedAttrs.source ?? "",
          date: parsedAttrs.date ?? "",
          ...parseListAttrs(parsedAttrs),
        },
        body: content.slice(bodyStart, closeIndex).trim(),
        filePath,
        startLine,
        startOffset: match.index,
        endOffset: closeIndex + SPEC_ENTRY_CLOSE.length,
      });
    }

    SPEC_ENTRY_OPEN_RE.lastIndex = closeIndex + SPEC_ENTRY_CLOSE.length;
  }

  return { entries, diagnostics };
}

function parseListAttrs(attrs: Record<string, string>): Record<string, string[]> {
  const parsed: Record<string, string[]> = {};
  for (const key of LIST_ATTRS) {
    if (attrs[key]) parsed[key] = parseKeywordCsv(attrs[key]);
  }
  return parsed;
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function serializeSpecEntry(attrs: SpecEntryAttrs, body: string): string {
  const attrLines = Object.entries(attrs)
    .filter((entry): entry is [string, string | string[]] => entry[1] !== undefined)
    .map(([key, value]) => {
      const rendered = Array.isArray(value) ? value.join(",") : value;
      return `  ${key}="${escapeAttr(rendered)}"`;
    });

  return `<spec-entry\n${attrLines.join("\n")}\n>\n\n${body.trim()}\n</spec-entry>\n`;
}

export function makeLearningId(now = new Date()): string {
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.random().toString(16).slice(2, 10).padEnd(8, "0");
  return `DFL-${date}-${suffix}`;
}
