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

export function updateDslCache(pagePath: string, dsl: any) {
  dslCache.set(pagePath, dsl);
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

  let currentDsl: any = dslCache.get(page_path);
  if (!currentDsl) {
    try {
      const micrositeData = await fetchMicrositePages(microsite_id);
      const page = micrositeData?.pages?.find(
        (p: any) => p.pageCode === page_path,
      );
      if (!page) {
        return { error: `Page "${page_path}" not found in microsite "${microsite_id}"` };
      }
      const version = page.pageVersion || 1;
      currentDsl = await fetchPageDsl(page_path, version);
      dslCache.set(page_path, currentDsl);
    } catch (err: any) {
      return { error: "Failed to fetch current DSL: " + err.message };
    }
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
