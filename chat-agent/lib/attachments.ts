/**
 * Shared, dependency-free helpers for chat file attachments (images + documents).
 *
 * Used by both the client (ChatPanel, to classify/validate files the user picks)
 * and the server (chat route + aws-bedrock-helper, to build Bedrock Converse
 * content blocks). Keeping the rules here means the client and the model see the
 * same notion of "what's a supported attachment", with one place to change.
 */

export type AttachmentKind = "image" | "document";

/** Max number of files that can ride along with a single message. */
export const MAX_ATTACHMENTS = 5;

/** Per-file byte ceilings (Bedrock Converse limits, with a little headroom). */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_DOC_BYTES = 4.5 * 1024 * 1024; // 4.5 MB (Bedrock document hard limit)

/** Bedrock Converse image formats. */
export const SUPPORTED_IMAGE_FORMATS = new Set(["png", "jpeg", "gif", "webp"]);

/** Bedrock Converse document formats. */
export const SUPPORTED_DOC_FORMATS = new Set([
  "pdf",
  "csv",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "html",
  "txt",
  "md",
]);

const IMAGE_MIME_TO_FORMAT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpeg",
  "image/gif": "gif",
  "image/webp": "webp",
};

const DOC_MIME_TO_FORMAT: Record<string, string> = {
  "application/pdf": "pdf",
  "text/csv": "csv",
  "text/html": "html",
  "text/markdown": "md",
  "text/plain": "txt",
  "application/json": "txt",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};

// Extension fallback for when the browser reports an empty/unknown MIME type
// (common for code/DSL files). Text-ish sources map to `txt` so they still work.
const EXT_TO_FORMAT: Record<string, string> = {
  png: "png", jpg: "jpeg", jpeg: "jpeg", gif: "gif", webp: "webp",
  pdf: "pdf", csv: "csv", html: "html", htm: "html", md: "md", markdown: "md",
  txt: "txt", text: "txt", log: "txt", json: "txt", xml: "txt", yaml: "txt", yml: "txt",
  js: "txt", jsx: "txt", ts: "txt", tsx: "txt", css: "txt", scss: "txt",
  doc: "doc", docx: "docx", xls: "xls", xlsx: "xlsx",
};

export interface ClassifiedAttachment {
  kind: AttachmentKind;
  format: string;
}

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : "";
}

/**
 * Classify a picked file into an image or document with its Bedrock format,
 * or return null if the type is not supported. MIME type wins; extension is the
 * fallback for empty/unknown MIME.
 */
export function classifyAttachment(
  mimeType: string,
  fileName: string,
): ClassifiedAttachment | null {
  const mime = (mimeType || "").toLowerCase();

  if (IMAGE_MIME_TO_FORMAT[mime]) {
    return { kind: "image", format: IMAGE_MIME_TO_FORMAT[mime] };
  }
  if (DOC_MIME_TO_FORMAT[mime]) {
    return { kind: "document", format: DOC_MIME_TO_FORMAT[mime] };
  }

  const ext = extensionOf(fileName);
  const fmt = EXT_TO_FORMAT[ext];
  if (fmt) {
    return {
      kind: SUPPORTED_IMAGE_FORMATS.has(fmt) ? "image" : "document",
      format: fmt,
    };
  }
  return null;
}

/** The byte ceiling for a given attachment kind. */
export function maxBytesFor(kind: AttachmentKind): number {
  return kind === "image" ? MAX_IMAGE_BYTES : MAX_DOC_BYTES;
}

/** Human-readable size, for UI + error messages. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Sanitize a file name into a Bedrock-legal document name: alphanumerics,
 * single spaces, hyphens, parentheses and brackets only (no dots, no runs of
 * whitespace). Falls back to `document-<n>` when nothing usable remains.
 */
export function sanitizeDocName(name: string, index = 0): string {
  const cleaned = (name || "")
    .replace(/[^a-zA-Z0-9\s\-()[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || `document-${index + 1}`;
}
