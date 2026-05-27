import * as jsonpatch from 'fast-json-patch';
import { v4 as uuidv4 } from 'uuid';

export async function queuePatch(args: any, sessionId: string) {
  const { microsite_id, page_path, patch, description, preview_hint, affected_components } = args;

  // Here we would normally fetch the current DSL. Mocking it for now.
  const currentDsl = { type: "page", components: [] };

  // Validate patch
  const errors = jsonpatch.validate(patch, currentDsl);
  if (errors && errors.length > 0) {
    return { error: 'Invalid patch format: ' + errors.map(e => e.message).join(', ') };
  }

  let patchedDsl;
  try {
    patchedDsl = jsonpatch.applyPatch(structuredClone(currentDsl), patch, true, false).newDocument;
  } catch (err: any) {
    return { error: 'Error applying patch: ' + err.message };
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
    sessionId
  };
}
