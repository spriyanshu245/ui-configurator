import type { Operation } from "fast-json-patch";
import {
  parsePointer,
  toPointer,
  resolvePointer,
  getParentPointer,
  isPointerWithin,
  lastToken,
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

  // Compute an anchor path per op, then group ops whose anchors are equal or
  // nested within one another. When two anchors are nested, the group's
  // effective anchor is the shallower (ancestor) of the two, so a chunk
  // always covers the full subtree of every op assigned to it.
  type Group = { anchorPath: string; ops: Operation[] };
  const groups: Group[] = [];

  for (const op of patch) {
    const anchorPath = computeAnchorPath(op, currentDsl, patchedDsl, contextDepth);

    let target = groups.find(
      (g) => isPointerWithin(anchorPath, g.anchorPath) || isPointerWithin(g.anchorPath, anchorPath),
    );

    if (target) {
      // If this op's anchor is shallower (an ancestor of the group's current
      // anchor), promote the group's anchor to it.
      if (isPointerWithin(target.anchorPath, anchorPath) && anchorPath !== target.anchorPath) {
        target.anchorPath = anchorPath;
      }
      target.ops.push(op);
    } else {
      groups.push({ anchorPath, ops: [op] });
    }
  }

  // A second pass merges any groups that became nested/equal as a result of
  // anchor promotion above (e.g. group A promoted to an ancestor of group B).
  const merged: Group[] = [];
  for (const group of groups) {
    const existing = merged.find(
      (g) =>
        isPointerWithin(group.anchorPath, g.anchorPath) ||
        isPointerWithin(g.anchorPath, group.anchorPath),
    );
    if (existing) {
      if (isPointerWithin(existing.anchorPath, group.anchorPath) && group.anchorPath !== existing.anchorPath) {
        existing.anchorPath = group.anchorPath;
      }
      existing.ops.push(...group.ops);
    } else {
      merged.push(group);
    }
  }

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
  const isPlainObject = (v: unknown): v is Record<string, unknown> =>
    !!v && typeof v === "object" && !Array.isArray(v);

  if (!isPlainObject(currentDsl) && !isPlainObject(patchedDsl)) {
    // Neither side is a keyed object (e.g. both are arrays, or one/both
    // missing) — fall back to a single whole-document comparison.
    return shallowDiffers(currentDsl, patchedDsl) && chunks.length === 0 ? ["__root__"] : [];
  }

  const keys = new Set<string>([
    ...Object.keys(currentDsl && isPlainObject(currentDsl) ? currentDsl : {}),
    ...Object.keys(patchedDsl && isPlainObject(patchedDsl) ? patchedDsl : {}),
  ]);

  const residual: string[] = [];
  for (const key of keys) {
    const anchorForKey = toPointer([key]);
    // Covered if some chunk's anchor is at or within this top-level key's
    // subtree (or is the whole-document root "").
    const alreadyCovered = chunks.some(
      (c) => c.anchorPath === "" || isPointerWithin(c.anchorPath, anchorForKey),
    );
    if (alreadyCovered) continue;

    const beforeVal = isPlainObject(currentDsl) ? (currentDsl as any)[key] : undefined;
    const afterVal = isPlainObject(patchedDsl) ? (patchedDsl as any)[key] : undefined;
    if (shallowDiffers(beforeVal, afterVal)) {
      residual.push(key);
    }
  }
  return residual;
}

// Re-exported for consumers that only need the leaf-descriptor convention
// (e.g. tests asserting label formatting) without pulling in the whole module.
export { lastToken };
