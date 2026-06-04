import * as jsonpatch from "fast-json-patch";
import { v4 as uuidv4 } from "uuid";
import { fetchMicrositePages } from "./microsite-loader";

export async function queuePatch(args: any, sessionId: string) {
  const {
    microsite_id,
    page_path,
    patch,
    description,
    preview_hint,
    affected_components,
  } = args;

  let currentDsl: any = {};
  try {
    const micrositeData = await fetchMicrositePages(microsite_id);
    const page = micrositeData?.pages?.find(
      (p: any) => p.pageCode === page_path,
    );
    if (!page) {
      return { error: "Page not found" };
    }
    currentDsl = page;
  } catch (err: any) {
    return { error: "Failed to fetch current DSL: " + err.message };
  }

  // Validate patch
  const errors = jsonpatch.validate(patch, currentDsl);
  if (errors) {
    return {
      error: "Invalid patch format: " + errors.message,
    };
  }

  let patchedDsl;
  try {
    patchedDsl = jsonpatch.applyPatch(
      structuredClone(currentDsl),
      patch,
      true,
      false,
    ).newDocument;
  } catch (err: any) {
    return { error: "Error applying patch: " + err.message };
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
    currentDsl,
    patchedDsl,
    sessionId,
  };
}
