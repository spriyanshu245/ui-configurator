/**
 * Pure helpers to derive "what components/fields a patch will add" from an
 * RFC-6902 patch, for the preview side panel. No I/O, no React — trivially
 * testable.
 */

export interface PreviewField {
  key: string;
  value: string;
}

export interface PreviewComponent {
  type: string;
  id?: string;
  /** A human-ish label pulled from common naming props. */
  label?: string;
  fields: PreviewField[];
  children: PreviewComponent[];
  /** The op that introduced this node (add/replace). */
  op: "add" | "replace";
}

interface PatchOp {
  op: string;
  path: string;
  value?: unknown;
}

const LABEL_KEYS = ["label", "text", "title", "name", "placeholder"];
const SKIP_VALUE_KEYS = new Set(["id", "type", "components", "children"]);

function isComponentNode(v: unknown): v is Record<string, any> {
  return Boolean(v && typeof v === "object" && !Array.isArray(v) && typeof (v as any).type === "string");
}

function pickLabel(node: Record<string, any>): string | undefined {
  const props = node.properties ?? {};
  for (const k of LABEL_KEYS) {
    if (typeof node[k] === "string" && node[k].trim()) return node[k];
    if (typeof props[k] === "string" && props[k].trim()) return props[k];
  }
  return undefined;
}

function shortValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.length > 60 ? v.slice(0, 57) + "…" : v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return `[${v.length}]`;
  return "{…}";
}

/** Flatten a component node's own scalar properties into preview fields. */
function nodeFields(node: Record<string, any>): PreviewField[] {
  const out: PreviewField[] = [];
  const props = node.properties ?? {};
  const source = Object.keys(props).length > 0 ? props : node;
  for (const [key, value] of Object.entries(source)) {
    if (SKIP_VALUE_KEYS.has(key)) continue;
    if (value && typeof value === "object" && !Array.isArray(value)) continue;
    const rendered = shortValue(value);
    if (rendered === "") continue;
    out.push({ key, value: rendered });
    if (out.length >= 8) break;
  }
  return out;
}

/** Recursively map a DSL component node into a PreviewComponent. */
function toPreview(node: Record<string, any>, op: "add" | "replace"): PreviewComponent {
  const childArray: any[] = Array.isArray(node.components)
    ? node.components
    : Array.isArray(node.children)
      ? node.children
      : [];
  return {
    type: node.type,
    id: typeof node.id === "string" ? node.id : undefined,
    label: pickLabel(node),
    fields: nodeFields(node),
    children: childArray.filter(isComponentNode).map((c) => toPreview(c, op)),
    op,
  };
}

/**
 * Extract the component subtrees a patch adds (or replaces). Returns a flat list
 * of top-level added components; each carries its own nested children.
 */
export function extractAddedComponents(patch: unknown): PreviewComponent[] {
  if (!Array.isArray(patch)) return [];
  const out: PreviewComponent[] = [];
  for (const raw of patch as PatchOp[]) {
    if (!raw || (raw.op !== "add" && raw.op !== "replace")) continue;
    const op: "add" | "replace" = raw.op;
    const value = raw.value;
    if (isComponentNode(value)) {
      out.push(toPreview(value, op));
    } else if (Array.isArray(value)) {
      // e.g. replacing an entire `components` array.
      value.filter(isComponentNode).forEach((n) => out.push(toPreview(n, op)));
    }
  }
  return out;
}

/** Count every component in a preview forest (for a summary line). */
export function countPreviewComponents(list: PreviewComponent[]): number {
  return list.reduce((n, c) => n + 1 + countPreviewComponents(c.children), 0);
}

/**
 * Extract the RAW DSL component nodes a patch adds/replaces (unmodified), for
 * feeding the live renderer. Mirrors extractAddedComponents but keeps originals.
 */
export function extractAddedRawNodes(patch: unknown): Record<string, any>[] {
  if (!Array.isArray(patch)) return [];
  const out: Record<string, any>[] = [];
  for (const raw of patch as PatchOp[]) {
    if (!raw || (raw.op !== "add" && raw.op !== "replace")) continue;
    const value = raw.value;
    if (isComponentNode(value)) out.push(value);
    else if (Array.isArray(value)) value.filter(isComponentNode).forEach((n) => out.push(n));
  }
  return out;
}
