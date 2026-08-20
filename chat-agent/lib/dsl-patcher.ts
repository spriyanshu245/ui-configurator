import * as jsonpatch from "fast-json-patch";
import type { Operation } from "fast-json-patch";
import { v4 as uuidv4 } from "uuid";
import { fetchMicrositePages, fetchPageDsl } from "./microsite-loader";

import { availableComponents } from "../../src/app/data/availableComponents";
import * as fs from "fs";
import * as path from "path";

let componentRegistry: any = null;
try {
  const registryPath = path.join(process.cwd(), "chat-agent/knowledge/component-registry.json");
  componentRegistry = JSON.parse(fs.readFileSync(registryPath, "utf8"));
} catch (e) {
  console.warn("Could not load component-registry.json", e);
}

export function validateAndAssignIds(dsl: any) {
  if (!dsl || !Array.isArray(dsl.components)) return;

  function traverse(node: any, currentFormNameKeyIds: string[] = []) {
    if (!node) return;

    if (node.type) {
      // 1. Assign missing IDs
      if (!node.id || node.id === "") {
        node.id = uuidv4();
      }

      // 2. Validate against availableComponents or componentRegistry
      const availableComp = availableComponents.find((c: any) => c.type === node.type);
      const registryComp = componentRegistry ? componentRegistry[node.type] : null;

      if (!availableComp && !registryComp && node.type !== "root") {
        throw new Error(`Component type "${node.type}" is not registered.`);
      }

      // Validate props if registry exists
      if (registryComp && registryComp.props) {
        for (const [propName, propDef] of Object.entries(registryComp.props)) {
          const req = (propDef as any).required;
          if (req && (!node.properties || node.properties[propName] === undefined)) {
            throw new Error(`Component "${node.type}" is missing required property: ${propName}`);
          }
        }
      }

      // 3. Form Component Mapping Rules
      let formNameKeyIds = [...currentFormNameKeyIds];
      if (node.type === "form" && node.properties?.nameKeyIds) {
        const ids = Array.isArray(node.properties.nameKeyIds) ? node.properties.nameKeyIds : [node.properties.nameKeyIds];
        formNameKeyIds.push(...ids.map(String));
      }

      // If it's an Input and it is inside a form, enforce nameKeyId linkage
      if (["Input", "Select", "CheckboxGroup"].includes(node.type) && formNameKeyIds.length > 0) {
        const hasMatchingName = formNameKeyIds.includes(node.properties?.name);
        if (!hasMatchingName) {
          throw new Error(`Input component "${node.properties?.name || node.type}" must reference the Form's nameKeyId (Expected one of: ${formNameKeyIds.join(", ")})`);
        }
      }

      if (Array.isArray(node.components)) {
        for (const child of node.components) {
          traverse(child, formNameKeyIds);
        }
      }
    } else if (Array.isArray(node)) {
      for (const child of node) {
        traverse(child, currentFormNameKeyIds);
      }
    }
  }

  traverse(dsl);
}

export function applyPatch(currentDsl: unknown, patch: Operation[]) {
  const validationError = jsonpatch.validate(patch, currentDsl);
  if (validationError) {
    throw new Error(`Invalid patch format: ${validationError.message}`);
  }

  try {
    return jsonpatch.applyPatch(structuredClone(currentDsl), patch, true, false)
      .newDocument;
  } catch (error) {
    throw new Error(
      `Error applying patch: ${
        error instanceof Error ? error.message : "Unknown patch error"
      }`,
    );
  }
}

const dslCache = new Map<string, any>();
// Per-page backend version, resolved from the microsite's pages[] list. Kept
// separate from dslCache so updateDslCache (which stores raw DSL after a PUT)
// doesn't have to know about versions. This version MUST be carried through to
// the PUT so writes hit the page's real version slot, not a hardcoded 1.
const pageVersionCache = new Map<string, number>();

export function updateDslCache(pagePath: string, dsl: any, pageVersion?: number) {
  dslCache.set(pagePath, dsl);
  if (typeof pageVersion === "number") {
    pageVersionCache.set(pagePath, pageVersion);
  }
}

/**
 * Load the current DSL for a page AND its real backend pageVersion: cache
 * first, else fetch the microsite's page list to resolve the pageVersion, then
 * fetch the page DSL and populate the caches. Shared by queuePatch and
 * queueBatch. Read-only w.r.t. the DSL cache beyond this population step —
 * callers must NOT write intermediate applied state into dslCache themselves.
 *
 * Returns { dsl, pageVersion }. The pageVersion is later persisted on the
 * pending patch/batch operation and passed to putPageDsl so the PUT targets the
 * correct `?version=` slot (fixes multi-page batches writing to version 1).
 *
 * Throws on failure (page not found / fetch error) — callers decide how to
 * surface that (queuePatch/queueBatch both translate it into an {error} return).
 */
async function loadCurrentDsl(
  microsite_id: string,
  page_path: string,
): Promise<{ dsl: any; pageVersion: number }> {
  // Cache short-circuit: a cached DSL means no re-fetch. Use the cached version
  // if we recorded one (from a prior fetch or a versioned updateDslCache);
  // otherwise fall back to 1 without forcing a microsite round-trip.
  const cachedDsl = dslCache.get(page_path);
  if (cachedDsl) {
    return { dsl: cachedDsl, pageVersion: pageVersionCache.get(page_path) ?? 1 };
  }

  // Cache miss: resolve the page's real version from the microsite page list,
  // then fetch its DSL, caching both.
  const micrositeData = await fetchMicrositePages(microsite_id);
  const page = micrositeData?.pages?.find(
    (p: any) => p.pageCode === page_path,
  );
  if (!page) {
    throw new Error(`Page "${page_path}" not found in microsite "${microsite_id}"`);
  }
  const pageVersion = page.pageVersion || 1;
  const dsl = await fetchPageDsl(page_path, pageVersion);
  dslCache.set(page_path, dsl);
  pageVersionCache.set(page_path, pageVersion);
  return { dsl, pageVersion };
}

export async function queuePatch(args: any, sessionId: string) {
  const {
    microsite_id,
    page_path,
    patch,
    description,
    preview_hint,
    affected_components,
  } = args;

  let currentDsl: any;
  let pageVersion: number;
  try {
    const loaded = await loadCurrentDsl(microsite_id, page_path);
    currentDsl = loaded.dsl;
    pageVersion = loaded.pageVersion;
  } catch (err: any) {
    return { error: err.message.startsWith("Page ") ? err.message : "Failed to fetch current DSL: " + err.message };
  }

  let patchedDsl;
  try {
    patchedDsl = applyPatch(currentDsl, patch);
  } catch (err: any) {
    return { error: err.message };
  }

  try {
    validateAndAssignIds(patchedDsl);
  } catch (err: any) {
    return { error: `Validation failed: ${err.message}` };
  }

  return {
    id: uuidv4(),
    micrositeId: microsite_id,
    pagePath: page_path,
    pageVersion,
    patch,
    description,
    previewHint: preview_hint,
    affectedComponents: affected_components,
    proposedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    currentDsl,
    patchedDsl,
    sessionId,
  };
}

export interface BatchOperationInput {
  page_path: string;
  patch: Operation[];
  description: string;
  preview_hint?: string;
  affected_components?: string[];
}

export interface QueuedBatchOperation {
  pagePath: string;
  pageVersion: number;
  description: string;
  previewHint?: string;
  affectedComponents?: string[];
  currentDsl: any;
  patchedDsl: any;
  patch: Operation[];
  status: "pending";
}

/**
 * Validate and stage a multi-page batch of patches.
 *
 * PASS 1: for every operation, load the current DSL (cache or backend), apply
 * the patch, and validate/assign ids. On ANY failure, return {error} immediately
 * — nothing is queued and dslCache is left untouched (loadCurrentDsl may still
 * populate the cache with unmodified "current" DSLs it fetched, which is fine —
 * only the PATCHED/intermediate state must never be written to the cache here).
 *
 * PASS 2: only reached if every operation validated. Returns the full pending
 * batch shape for persistence to pending_batches.
 */
export interface QueuedBatch {
  id: string;
  micrositeId: string;
  batchDescription: string;
  navigateTo: string | null;
  operations: QueuedBatchOperation[];
  proposedAt: string;
  sessionId: string;
  status: "pending";
  expiresAt: Date;
}

export async function queueBatch(
  args: any,
  sessionId: string,
): Promise<QueuedBatch | { error: string }> {
  const {
    microsite_id,
    operations,
    navigate_to,
    batch_description,
  } = args;

  if (!Array.isArray(operations) || operations.length === 0) {
    return { error: "Batch must include at least one operation." };
  }

  const validated: QueuedBatchOperation[] = [];

  // PASS 1: validate everything before queuing anything.
  for (const op of operations as BatchOperationInput[]) {
    const { page_path, patch, description, preview_hint, affected_components } = op;

    let currentDsl: any;
    let pageVersion: number;
    try {
      const loaded = await loadCurrentDsl(microsite_id, page_path);
      currentDsl = loaded.dsl;
      pageVersion = loaded.pageVersion;
    } catch (err: any) {
      const msg = err?.message?.startsWith("Page ")
        ? err.message
        : `Failed to fetch current DSL: ${err?.message}`;
      return { error: `Validation failed on page "${page_path}": ${msg}` };
    }

    let patchedDsl;
    try {
      patchedDsl = applyPatch(currentDsl, patch);
    } catch (err: any) {
      return { error: `Validation failed on page "${page_path}": ${err.message}` };
    }

    try {
      validateAndAssignIds(patchedDsl);
    } catch (err: any) {
      return { error: `Validation failed on page "${page_path}": ${err.message}` };
    }

    validated.push({
      pagePath: page_path,
      pageVersion,
      description,
      previewHint: preview_hint,
      affectedComponents: affected_components,
      currentDsl,
      patchedDsl,
      patch,
      status: "pending",
    });
  }

  // PASS 2: everything validated — stage the batch for approval.
  return {
    id: uuidv4(),
    micrositeId: microsite_id,
    batchDescription: batch_description,
    navigateTo: navigate_to || null,
    operations: validated,
    proposedAt: new Date().toISOString(),
    sessionId,
    status: "pending",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
}
