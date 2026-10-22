import { createHash } from "crypto";
import {
  chatAttachmentsOps,
  type StoredAttachmentKind,
} from "../db/queries/chat-attachments";
import type { AttachmentRef } from "./history";
import { logger } from "./logger";

/**
 * Server side of chat attachments. Every uploaded file is stored once in
 * Mongo under a content-derived handle (att-xxxxxxxxxx) so later turns can
 * still reach it. A JSON page DSL is NOT sent to the model as a document
 * (that cost ~75k tokens on every agent step); the model reads it through the
 * DSL tools instead, using the handle as page_path.
 */

export interface IncomingAttachment {
  kind?: string;
  format?: string;
  name?: string;
  dataBase64: string;
}

export interface AttachmentScope {
  userId: string;
  micrositeId?: string;
  sessionId?: string;
}

const TEXT_FORMATS = new Set(["txt", "md", "csv", "html"]);
const READ_PAGE_CHARS = 50_000;

/** Parsed attachment DSLs are immutable — cache them for the process lifetime. */
const dslCache = new Map<string, any>();

export const isAttachmentHandle = (code: unknown): boolean =>
  typeof code === "string" && /^att-[0-9a-f]{6,}$/.test(code);

function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** The page-DSL object inside an uploaded JSON (it may be wrapped in dslJson/data/page). */
export function findDslRoot(value: unknown, depth = 0): any | undefined {
  if (typeof value === "string" && depth > 0) {
    const parsed = value.trim().startsWith("{") ? tryParseJson(value) : undefined;
    return parsed ? findDslRoot(parsed, depth) : undefined;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const obj = value as Record<string, unknown>;
  if (Array.isArray(obj.components)) return obj;
  if (depth >= 3) return undefined;
  for (const key of ["dslJson", "dsl", "data", "page", "pageDsl"]) {
    const found = findDslRoot(obj[key], depth + 1);
    if (found) return found;
  }
  return undefined;
}

/** "412 components: 6 input-table, 2 form, …" */
export function summarizeDsl(dsl: any): string {
  const counts = new Map<string, number>();
  const walk = (node: any) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    if (typeof node.type === "string" && typeof node.id === "string") {
      counts.set(node.type, (counts.get(node.type) ?? 0) + 1);
    }
    Object.values(node).forEach(walk);
  };
  walk(dsl?.components);
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  const top = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 8)
    .map(([t, n]) => `${n} ${t}`)
    .join(", ");
  return `page DSL JSON, ${total} components (${top})`;
}

function classify(a: IncomingAttachment, bytes: Buffer) {
  const format = String(a.format || "").toLowerCase();
  if (a.kind === "image") return { kind: "image" as StoredAttachmentKind, format };
  if (!TEXT_FORMATS.has(format)) return { kind: "binary" as StoredAttachmentKind, format };
  const text = bytes.toString("utf8");
  const parsed = /^\s*[[{]/.test(text) ? tryParseJson(text) : undefined;
  if (parsed !== undefined) {
    const dsl = findDslRoot(parsed);
    if (dsl) return { kind: "dsl" as StoredAttachmentKind, format, text, dsl };
    return { kind: "json" as StoredAttachmentKind, format, text };
  }
  return { kind: "text" as StoredAttachmentKind, format, text };
}

function handleFor(scope: AttachmentScope, bytes: Buffer): { handle: string; sha256: string } {
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const scoped = createHash("sha256")
    .update(`${scope.userId}|${scope.micrositeId ?? ""}|${sha256}`)
    .digest("hex");
  return { handle: `att-${scoped.slice(0, 10)}`, sha256 };
}

function inlinePart(a: IncomingAttachment) {
  return a.kind === "image"
    ? { type: "image", format: a.format || "png", dataBase64: a.dataBase64 }
    : { type: "document", format: a.format, name: a.name, dataBase64: a.dataBase64 };
}

export interface ProcessedAttachments {
  /** Content parts for the current user message (after its text). */
  parts: any[];
  /** Handles to show in the chat and to carry in history. */
  refs: AttachmentRef[];
}

/**
 * Store each attachment and build the model-facing parts for this turn:
 * page DSL JSON → a one-line pointer to its handle (read via tools);
 * anything else → the file itself plus a line naming its handle.
 */
export async function processAttachments(
  attachments: IncomingAttachment[],
  scope: AttachmentScope,
): Promise<ProcessedAttachments> {
  const parts: any[] = [];
  const refs: AttachmentRef[] = [];
  for (const a of attachments) {
    const bytes = Buffer.from(a.dataBase64, "base64");
    const info = classify(a, bytes);
    const { handle, sha256 } = handleFor(scope, bytes);
    const name = a.name || handle;
    const summary =
      info.kind === "dsl" ? summarizeDsl((info as any).dsl) : `${info.kind} file, ${bytes.length} bytes`;
    let stored = true;
    try {
      await chatAttachmentsOps.save({
        handle,
        userId: scope.userId,
        micrositeId: scope.micrositeId,
        sessionId: scope.sessionId,
        name,
        format: info.format,
        kind: info.kind,
        size: bytes.length,
        sha256,
        summary,
        ...("text" in info ? { text: info.text } : { dataBase64: a.dataBase64 }),
      });
      if (info.kind === "dsl") dslCache.set(handle, (info as any).dsl);
    } catch (e) {
      stored = false;
      logger.warn("Failed to store attachment; sending it inline", { name, error: (e as Error).message });
    }

    if (stored && info.kind === "dsl") {
      refs.push({ handle, name, kind: "page DSL" });
      parts.push({
        type: "text",
        _note: true,
        text:
          `[Attachment ${handle} "${name}": ${summary}. Its JSON is NOT inlined here — read it with ` +
          `get_page_dsl / query_dsl_path / find_components using page_path "${handle}". ` +
          `It is reference material only: never copy its ids, tableName or nameKeyIds labels.]`,
      });
      continue;
    }
    parts.push(inlinePart(a));
    if (stored) {
      refs.push({ handle, name, kind: info.kind });
      parts.push({
        type: "text",
        _note: true,
        text: `[The file above is stored as ${handle} "${name}"; in later turns use read_attachment("${handle}").]`,
      });
    }
  }
  return { parts, refs };
}

/** Load an attachment's page DSL (for dsl-store). Undefined if it is not a DSL. */
export async function loadAttachmentDsl(handle: string, micrositeId?: string): Promise<any | undefined> {
  if (dslCache.has(handle)) return dslCache.get(handle);
  const doc = await chatAttachmentsOps.getByHandle(handle, micrositeId);
  if (!doc?.text) return undefined;
  const dsl = findDslRoot(tryParseJson(doc.text));
  if (dsl) dslCache.set(handle, dsl);
  return dsl;
}

/** read_attachment tool: paged text, or guidance for non-text kinds. */
export async function readAttachment(args: { handle?: string; offset?: number }, micrositeId?: string) {
  const handle = String(args?.handle ?? "");
  if (!isAttachmentHandle(handle)) return { error: "Provide a handle like att-0123456789." };
  const doc = await chatAttachmentsOps.getByHandle(handle, micrositeId);
  if (!doc) return { error: `Attachment ${handle} not found (attachments expire after 7 days).` };
  if (doc.kind === "dsl") {
    return {
      handle: doc.handle,
      name: doc.name,
      kind: doc.kind,
      summary: doc.summary,
      note: `This is a page DSL — use get_page_dsl / query_dsl_path / find_components with page_path "${doc.handle}".`,
    };
  }
  if (!doc.text) {
    return {
      handle: doc.handle,
      name: doc.name,
      kind: doc.kind,
      note: "Binary file (image/PDF/office) — it was shown in the turn it was attached; ask the user to re-attach it if you need to see it again.",
    };
  }
  const offset = Math.max(0, Number(args.offset) || 0);
  const chunk = doc.text.slice(offset, offset + READ_PAGE_CHARS);
  const next = offset + chunk.length;
  return {
    handle: doc.handle,
    name: doc.name,
    kind: doc.kind,
    offset,
    totalChars: doc.text.length,
    ...(next < doc.text.length ? { nextOffset: next } : {}),
    text: chunk,
  };
}

/** Test helper. */
export function __resetAttachmentCache() {
  dslCache.clear();
}
