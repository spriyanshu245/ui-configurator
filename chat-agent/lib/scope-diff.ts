import type { Operation } from "fast-json-patch";
import {
  parsePointer,
  toPointer,
  resolvePointer,
  getParentPointer,
  isPointerWithin,
} from "./json-pointer-utils";

export interface DiffChunk {
  key: string;
  anchorPath: string;
  label: string;
  before: unknown;
  after: unknown;
  ops: Operation[];
}

export interface ScopeDiffOptions {
  /** Max number of levels to walk up from an op's target looking for an `id` boundary. Default 2. */
  contextDepth?: number;
}

const DEFAULT_CONTEXT_DEPTH = 2;
const RESIDUAL_KEY = "__residual__";

/**
 * True if the node at `path` (as resolved against either document) carries an
 * `id` field — the DSL's convention for a component boundary.
 */
function hasIdBoundary(currentDsl: unknown, patchedDsl: unknown, path: string): boolean {
  const patchedNode = resolvePointer(patchedDsl, path);
  if (patchedNode && typeof patchedNode === "object" && !Array.isArray(patchedNode) && "id" in patchedNode) {
    return true;
  }
  const currentNode = resolvePointer(currentDsl, path);
  if (currentNode && typeof currentNode === "object" && !Array.isArray(currentNode) && "id" in currentNode) {
    return true;
  }
  return false;
}

/**
 * Determine the anchor pointer for a single op: walk up from the op's target
 * path until we reach a DSL component boundary (a node carrying an `id`
 * field, checked against patchedDsl then currentDsl) or `contextDepth` levels
 * up, whichever comes first.
 *
 * add/remove ops targeting an array index or the "-" append token are
 * anchored one level up (at the parent array) so sibling entries stay
 * visible for context.
 */
function computeAnchorPath(
  op: Operation,
  currentDsl: unknown,
  patchedDsl: unknown,
  contextDepth: number,
): string {
  if (op.op === "add" || op.op === "remove") {
    const tokens = parsePointer(op.path);
    const last = tokens[tokens.length - 1];
    const isArrayIndexTarget = last === "-" || /^\d+$/.test(last ?? "");
    if (isArrayIndexTarget) {
      // Anchor directly at the parent array so sibling entries stay visible
      // for context — this is a fixed rule for array add/remove, not subject
      // to further id-boundary walk-up (which could otherwise overshoot all
      // the way to the document root, which also carries an `id`).
      return getParentPointer(op.path);
    }
  }

  let candidate = op.path;
  let levelsWalked = 0;

  while (true) {
    if (hasIdBoundary(currentDsl, patchedDsl, candidate)) {
      return candidate;
    }
    if (candidate === "" || levelsWalked >= contextDepth) {
      return candidate;
    }
    candidate = getParentPointer(candidate);
    levelsWalked++;
  }
}

/**
 * Build a human-readable label for a chunk from its anchor path, the node's
 * type (if resolvable), and the distinct leaf keys touched by its ops.
 *
 * e.g. "components[2] (table) -> properties.apiUrl"
 */
function buildLabel(
  anchorPath: string,
  currentDsl: unknown,
  patchedDsl: unknown,
  ops: Operation[],
): string {
  const node =
    resolvePointer(patchedDsl, anchorPath) ?? resolvePointer(currentDsl, anchorPath);
  const nodeType =
    node && typeof node === "object" && !Array.isArray(node) && "type" in node
      ? String((node as any).type)
      : undefined;

  const pathDescriptor = describeAnchorPath(anchorPath);

  const leafKeys = new Set<string>();
  for (const op of ops) {
    const relative = relativeLeafDescriptor(op.path, anchorPath);
    if (relative) leafKeys.add(relative);
  }

  let label = pathDescriptor;
  if (nodeType) {
    label += ` (${nodeType})`;
  }
  if (leafKeys.size > 0) {
    label += ` → ${Array.from(leafKeys).join(", ")}`;
  }
  return label;
}

/**
 * Turn an anchor pointer into a readable "components[2]" style descriptor.
 */
function describeAnchorPath(anchorPath: string): string {
  if (anchorPath === "") return "root";
  const tokens = parsePointer(anchorPath);
  let out = "";
  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      out += `[${token}]`;
    } else {
      out += out ? `.${token}` : token;
    }
  }
  return out;
}

/**
 * Describe the portion of an op's path beyond its chunk's anchor, e.g. for
 * anchorPath "/components/2" and op path "/components/2/properties/apiUrl"
 * returns "properties.apiUrl".
 */
function relativeLeafDescriptor(opPath: string, anchorPath: string): string | null {
  const opTokens = parsePointer(opPath);
  const anchorTokens = parsePointer(anchorPath);
  const remainder = opTokens.slice(anchorTokens.length);
  if (remainder.length === 0) return null;
  return remainder
    .map((token) => (/^\d+$/.test(token) ? `[${token}]` : token))
    .join(".")
    .replace(/\.\[/g, "[");
}

/**
 * Shallow structural inequality check used only to detect residual
 * differences outside of any op-derived anchor's subtree.
 */
function shallowDiffers(a: unknown, b: unknown): boolean {
  if (a === b) return false;
  try {
    return JSON.stringify(a) !== JSON.stringify(b);
  } catch {
    return a !== b;
  }
}

type Group = { anchorPath: string; ops: Operation[] };

const anchorsOverlap = (a: string, b: string) => isPointerWithin(a, b) || isPointerWithin(b, a);

/**
 * Add `anchorPath`/`ops` to the first overlapping group (promoting that
 * group's anchor to the shallower ancestor so a chunk always covers the full
 * subtree of every op in it), or start a new group.
 */
function addToGroups(groups: Group[], anchorPath: string, ops: Operation[]) {
  const target = groups.find((g) => anchorsOverlap(anchorPath, g.anchorPath));
  if (!target) {
    groups.push({ anchorPath, ops: [...ops] });
    return;
  }
  if (isPointerWithin(target.anchorPath, anchorPath)) target.anchorPath = anchorPath;
  target.ops.push(...ops);
}

/**
 * Group ops whose anchors are equal or nested. A second pass merges groups
 * that became nested/equal as a result of anchor promotion in the first.
 */
function groupOpsByAnchor(
  patch: Operation[],
  currentDsl: unknown,
  patchedDsl: unknown,
  contextDepth: number,
): Group[] {
  const groups: Group[] = [];
  for (const op of patch) {
    addToGroups(groups, computeAnchorPath(op, currentDsl, patchedDsl, contextDepth), [op]);
  }
  const merged: Group[] = [];
  for (const group of groups) addToGroups(merged, group.anchorPath, group.ops);
  return merged;
}

/**
 * Scope a whole-document diff down to a set of small, per-component chunks
 * derived from the RFC-6902 patch that produced `patchedDsl` from
 * `currentDsl`.
 *
 * - Each op is anchored at the nearest enclosing DSL component boundary (a
 *   node with an `id` field), walking up at most `contextDepth` levels.
 * - Ops whose anchor paths are the same, or nested within one another, are
 *   grouped into a single chunk (anchored at the shallowest of the two).
 * - A final residual chunk ("other changes") is appended if some top-level
 *   difference between currentDsl and patchedDsl falls outside every
 *   anchor's subtree — this covers edits made directly in the Edit Patch tab
 *   that aren't described by any op.
 *
 * Pure function — does not mutate its inputs.
 */
export function scopeDiffToPatch(
  currentDsl: unknown,
  patchedDsl: unknown,
  patch: Operation[],
  opts?: ScopeDiffOptions,
): DiffChunk[] {
  const contextDepth = opts?.contextDepth ?? DEFAULT_CONTEXT_DEPTH;

  if (!patch || patch.length === 0) {
    return [];
  }

  const merged = groupOpsByAnchor(patch, currentDsl, patchedDsl, contextDepth);

  const chunks: DiffChunk[] = merged.map((group) => {
    const before = resolvePointer(currentDsl, group.anchorPath);
    const after = resolvePointer(patchedDsl, group.anchorPath);
    return {
      key: group.anchorPath,
      anchorPath: group.anchorPath,
      label: buildLabel(group.anchorPath, currentDsl, patchedDsl, group.ops),
      before,
      after,
      ops: group.ops,
    };
  });

  // Fallback: detect residual differences that fall outside every chunk's
  // subtree (e.g. a manual edit in the Edit Patch tab not described by any
  // op). Compare top-level keys of both documents; if a key differs and
  // isn't covered by an existing anchor, roll it into one catch-all chunk.
  const residualKeys = findResidualTopLevelKeys(currentDsl, patchedDsl, chunks);
  if (residualKeys.length > 0) {
    chunks.push({
      key: RESIDUAL_KEY,
      anchorPath: "",
      label: "Other changes",
      before: currentDsl,
      after: patchedDsl,
      ops: [],
    });
  }

  return chunks;
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

const asRecord = (v: unknown): Record<string, unknown> => (isPlainObject(v) ? v : {});

/**
 * Return top-level keys (of currentDsl/patchedDsl, treated as plain objects)
 * whose values differ and are not already covered by an existing chunk's
 * anchor subtree.
 */
function findResidualTopLevelKeys(
  currentDsl: unknown,
  patchedDsl: unknown,
  chunks: DiffChunk[],
): string[] {
  // Neither side is a keyed object (e.g. both are arrays, or one/both missing):
  // every op already produced a chunk, so there is nothing residual to report.
  if (!isPlainObject(currentDsl) && !isPlainObject(patchedDsl)) return [];

  const before = asRecord(currentDsl);
  const after = asRecord(patchedDsl);
  const keys = new Set<string>([...Object.keys(before), ...Object.keys(after)]);

  const isCovered = (key: string) => {
    const anchorForKey = toPointer([key]);
    // Covered if some chunk's anchor is at or within this top-level key's
    // subtree (or is the whole-document root "").
    return chunks.some((c) => c.anchorPath === "" || isPointerWithin(c.anchorPath, anchorForKey));
  };

  return [...keys].filter((key) => !isCovered(key) && shallowDiffers(before[key], after[key]));
}
