/**
 * Compact, token-lean representations of page DSL for the model's context.
 *
 * - `compactDsl`   — the same JSON minus empty values (null / "" / [] / {}).
 *                    `false` and `0` are kept: they are meaningful settings.
 * - `outlineDsl`   — a "tokenised" one-line-per-component tree with the exact
 *                    JSON Pointer of every node, so the model can navigate and
 *                    write patches without pulling raw JSON into context.
 * - `parseDslPath` — accepts JSON Pointer ("/components/0"), dot
 *                    ("components.0") or bracket ("components[0]") paths.
 */

function compactArray(value: unknown[]): unknown[] | undefined {
  const items = value.map((v) => compactDsl(v)).filter((v) => v !== undefined);
  return items.length ? items : undefined;
}

function compactObject(value: Record<string, unknown>): Record<string, unknown> | undefined {
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value)) {
    const c = compactDsl(v);
    if (c !== undefined) out[key] = c;
  }
  return Object.keys(out).length ? out : undefined;
}

export function compactDsl<T = unknown>(value: T): T | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") return (value === "" ? undefined : value) as any;
  if (Array.isArray(value)) return compactArray(value) as any;
  if (typeof value === "object") return compactObject(value as Record<string, unknown>) as any;
  return value;
}

/** Split any supported path syntax into segments. Empty path → []. */
export function parseDslPath(path: string | undefined | null): string[] {
  const p = (path ?? "").trim();
  if (!p || p === "/" || p === ".") return [];
  if (p.startsWith("/")) {
    return p
      .slice(1)
      .split("/")
      .map((s) => s.replace(/~1/g, "/").replace(/~0/g, "~"))
      .filter((s) => s !== "");
  }
  return p
    .replace(/^dsl\./, "")
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter((s) => s !== "");
}

export function toPointer(segments: string[]): string {
  if (!segments.length) return "";
  return "/" + segments.map((s) => s.replace(/~/g, "~0").replace(/\//g, "~1")).join("/");
}

export function resolveSegments(root: unknown, segments: string[]): unknown {
  let node: any = root;
  for (const seg of segments) {
    if (node === null || node === undefined) return undefined;
    node = Array.isArray(node) ? node[Number(seg)] : node[seg];
  }
  return node;
}

// Properties worth surfacing inline in the outline (short, high-signal).
const INLINE_KEYS = [
  "actionType",
  "routingType",
  "routePage",
  "apiUrl",
  "apiName",
  "name",
  "showAsPopup",
  "isClickable",
  "columnInputType",
];
const LABEL_KEYS = ["label", "title", "text", "heading", "name"];
const MAX_INLINE_CHARS = 60;

function short(value: unknown): string {
  const s = typeof value === "string" ? value : JSON.stringify(value);
  return s.length > MAX_INLINE_CHARS ? `${s.slice(0, MAX_INLINE_CHARS)}…` : s;
}

function isNode(v: unknown): v is Record<string, any> {
  return !!v && typeof v === "object" && !Array.isArray(v) && typeof (v as any).type === "string";
}

export function nodeLabel(node: Record<string, any>): string | undefined {
  const props = (node.properties ?? {}) as Record<string, any>;
  return LABEL_KEYS.map((k) => props[k]).find((v) => typeof v === "string" && v.trim());
}

function describeNode(node: Record<string, any>): string {
  const props = (node.properties ?? {}) as Record<string, any>;
  const parts: string[] = [node.type];
  if (typeof node.id === "string") parts.push(`#${node.id.slice(0, 8)}`);
  const label = nodeLabel(node);
  if (label) parts.push(`"${short(label)}"`);
  if (typeof node.pageCode === "string") parts.push(`pageCode=${node.pageCode}`);
  const inline = INLINE_KEYS.filter((k) => props[k] !== undefined && props[k] !== "" && !(LABEL_KEYS.includes(k) && props[k] === label))
    .map((k) => `${k}=${short(props[k])}`);
  if (inline.length) parts.push(`{${inline.join(", ")}}`);
  return parts.join(" ");
}

export interface WalkedNode {
  node: Record<string, any>;
  segments: string[];
  pointer: string;
  /** Nesting depth among component nodes (root node = 0). */
  depth: number;
}

/**
 * Child values of a container with the path suffix leading to each. Objects
 * list their own keys first, then the nodes nested inside `properties`.
 */
function childSlots(value: object): Array<[string[], unknown]> {
  if (Array.isArray(value)) return value.map((v, i) => [[String(i)], v]);
  const record = value as Record<string, unknown>;
  const slots: Array<[string[], unknown]> = Object.entries(record)
    .filter(([k]) => k !== "properties")
    .map(([k, v]) => [[k], v]);
  const props = record.properties;
  if (props && typeof props === "object") {
    slots.push(...Object.entries(props).map(([k, v]): [string[], unknown] => [["properties", k], v]));
  }
  return slots;
}

/**
 * Visit every component node (any object with a string `type`) in document
 * order. Walks all keys (components, tabs, …) and nodes nested inside
 * `properties` (table columns, multipleActions, …).
 */
function walkNodes(
  root: unknown,
  visit: (n: WalkedNode) => void,
  basePath: string[] = [],
): void {
  const walk = (value: unknown, segments: string[], depth: number) => {
    if (value === null || typeof value !== "object") return;
    if (isNode(value)) {
      visit({ node: value, segments, pointer: toPointer(segments) || "/", depth });
      depth++;
    }
    for (const [suffix, child] of childSlots(value)) {
      if (child && typeof child === "object") walk(child, [...segments, ...suffix], depth);
    }
  };
  walk(root, basePath, 0);
}

/**
 * One line per component node: `<pointer> <type> #<id8> "<label>" {key props}`,
 * indented by depth. `maxLines` guards very large pages; the model can outline a
 * subtree with `query_dsl_path` + `outline: true`.
 */
export function outlineDsl(
  dsl: unknown,
  opts: { basePath?: string[]; maxLines?: number } = {},
): string {
  const maxLines = opts.maxLines ?? 400;
  const lines: string[] = [];
  let truncated = 0;
  walkNodes(
    dsl,
    ({ node, pointer, depth }) => {
      if (lines.length < maxLines) lines.push(`${"  ".repeat(depth)}${pointer} ${describeNode(node)}`);
      else truncated++;
    },
    opts.basePath ?? [],
  );
  if (truncated) lines.push(`… (+${truncated} more nodes — outline a subtree with query_dsl_path)`);
  return lines.join("\n");
}

/** In-memory index over one page's component nodes, built once per load. */
export interface NodeIndex {
  /** JSON Pointer → segments, for every node. */
  pointers: Map<string, string[]>;
  /** Full component id → pointer. */
  byId: Map<string, string>;
  /** Every node in document order (for searches). */
  nodes: WalkedNode[];
}

export function buildNodeIndex(dsl: unknown): NodeIndex {
  const index: NodeIndex = { pointers: new Map(), byId: new Map(), nodes: [] };
  walkNodes(dsl, (n) => {
    index.pointers.set(n.pointer, n.segments);
    if (typeof n.node.id === "string") index.byId.set(n.node.id, n.pointer);
    index.nodes.push(n);
  });
  return index;
}

/**
 * Resolve a component id — full, or the 8-char prefix shown in outlines — to
 * its pointer(s). A prefix can match more than one node.
 */
export function pointersForId(index: NodeIndex, id: string): string[] {
  const exact = index.byId.get(id);
  if (exact) return [exact];
  const matches: string[] = [];
  for (const [fullId, pointer] of index.byId) {
    if (fullId.startsWith(id)) matches.push(pointer);
  }
  return matches;
}

export interface ComponentFilter {
  type?: string;
  labelContains?: string;
  prop?: string;
  equals?: string;
}

/** Outline lines of the nodes matching a filter (all criteria must match). */
export function findComponents(index: NodeIndex, filter: ComponentFilter): string[] {
  const label = filter.labelContains?.toLowerCase();
  return index.nodes
    .filter(({ node }) => {
      if (filter.type && node.type !== filter.type) return false;
      if (label && !(nodeLabel(node) ?? "").toLowerCase().includes(label)) return false;
      if (filter.prop) {
        const value = (node.properties ?? {})[filter.prop];
        if (value === undefined) return false;
        if (filter.equals !== undefined && String(typeof value === "object" ? JSON.stringify(value) : value) !== filter.equals) {
          return false;
        }
      }
      return true;
    })
    .map(({ node, pointer }) => `${pointer} ${describeNode(node)}`);
}

/** Number of component nodes strictly below `value`. */
export function countDescendants(value: unknown): number {
  let count = 0;
  walkNodes(value, () => count++);
  return Math.max(0, count - (isNode(value) ? 1 : 0));
}

/**
 * Depth-1 view of a node: its own (compacted) fields, with every nested
 * component replaced by a one-line stub (`<pointer> <type> #<id8> "label"`).
 * The model reads the node's settings and drills into a child by pointer.
 */
export function depthOneView(value: unknown, segments: string[] = []): unknown {
  const stub = (v: unknown, segs: string[], isRoot: boolean): unknown => {
    if (v === null || typeof v !== "object") return v;
    if (!isRoot && isNode(v)) return `${toPointer(segs) || "/"} ${describeNode(v)}`;
    if (Array.isArray(v)) return v.map((item, i) => stub(item, [...segs, String(i)], false));
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(v as Record<string, unknown>)) {
      out[key] = stub(child, [...segs, key], false);
    }
    return out;
  };
  return compactDsl(stub(value, segments, true));
}
