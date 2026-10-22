/**
 * Earlier turns as the model sees them: all user and assistant text, with each
 * tool call collapsed to a one-line note (DSL can always be re-read, so full
 * tool results are not resent). Deterministic — the same history always yields
 * the same text — so the whole prefix stays prompt-cacheable across turns.
 */

export type AttachmentRef = { handle: string; name: string; kind?: string };

const ARG_KEYS = [
  "page_path",
  "page_paths",
  "path",
  "id",
  "type",
  "labelContains",
  "source",
  "target_page",
  "handle",
];

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

function parseJson(value: unknown): any {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function textOf(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((p: any) => p?.type === "text" && typeof p.text === "string")
      .map((p: any) => p.text)
      .join("\n");
  }
  return "";
}

function describeArgs(args: any): string {
  if (!args || typeof args !== "object") return "";
  const parts: string[] = [];
  for (const key of ARG_KEYS) {
    const v = args[key];
    if (v === undefined || v === null || v === "") continue;
    parts.push(`${key}=${clip(Array.isArray(v) ? v.join(",") : String(v), 80)}`);
  }
  if (Array.isArray(args.queries)) parts.push(`${args.queries.length} queries`);
  if (Array.isArray(args.patch)) parts.push(`${args.patch.length} ops`);
  if (Array.isArray(args.operations)) parts.push(`${args.operations.length} pages`);
  return parts.join(" ");
}

function describeResult(name: string, content: unknown): string {
  const raw = typeof content === "string" ? content : JSON.stringify(content ?? "");
  if (name.startsWith("propose_")) {
    const firstLine = raw.split("\n")[0];
    return clip(firstLine, 200);
  }
  const parsed = parseJson(raw);
  if (parsed && typeof parsed === "object") {
    if (parsed.error) return `error: ${clip(String(parsed.error), 160)}`;
    if (typeof parsed.outline === "string") {
      return `outline, ${parsed.outline.split("\n").filter(Boolean).length} nodes`;
    }
    if (Array.isArray(parsed.results)) return `${parsed.results.length} results`;
    if (Array.isArray(parsed.matches)) return `${parsed.matches.length} matches`;
    if (parsed.found === false) return "not found";
  }
  return `${raw.length} chars`;
}

function attachmentNote(refs: AttachmentRef[] | undefined): string {
  if (!Array.isArray(refs) || refs.length === 0) return "";
  const list = refs
    .map((r) => `${r.handle} "${r.name}"${r.kind ? ` (${r.kind})` : ""}`)
    .join(", ");
  return `\n[attached: ${list} — still available; read via its handle]`;
}

/** Collapse earlier turns into text-only user/assistant messages. */
export function toModelHistory(prior: any[]): any[] {
  if (!Array.isArray(prior) || prior.length === 0) return [];

  // tool_call_id -> every result text for it (a later "approved" update included)
  const results = new Map<string, unknown[]>();
  for (const m of prior) {
    if (m?.role === "tool" && m.tool_call_id) {
      const list = results.get(m.tool_call_id) ?? [];
      list.push(m.content);
      results.set(m.tool_call_id, list);
    }
  }

  const out: { role: string; content: string }[] = [];
  const push = (role: string, text: string) => {
    if (!text.trim()) return;
    const last = out[out.length - 1];
    if (last && last.role === role) last.content += `\n${text}`;
    else out.push({ role, content: text });
  };

  for (const m of prior) {
    if (!m || m.role === "system" || m.role === "tool") continue;
    if (m.role === "user") {
      push("user", textOf(m.content) + attachmentNote(m._attachments));
      continue;
    }
    if (m.role !== "assistant") continue;
    const lines: string[] = [];
    const text = textOf(m.content);
    if (text) lines.push(text);
    for (const tc of m.tool_calls ?? []) {
      const name = tc?.function?.name ?? "tool";
      const args = parseJson(tc?.function?.arguments) ?? tc?.function?.arguments;
      const outcomes = (results.get(tc?.id) ?? []).map((c) => describeResult(name, c));
      const argText = describeArgs(args);
      lines.push(
        `[${name}${argText ? ` ${argText}` : ""}${outcomes.length ? ` → ${outcomes.join(" | ")}` : ""}]`,
      );
    }
    push("assistant", lines.join("\n"));
  }
  return out;
}
