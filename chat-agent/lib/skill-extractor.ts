import type { Operation } from "fast-json-patch";

/**
 * Deterministic, pure (no I/O) mining of "session-data binding" primitives out
 * of a JSON Patch + the DSL it was applied to. This is the extraction half of
 * skill learning (Workstream D) — it never calls an LLM and never touches the
 * database or filesystem, so it's trivially unit-testable and safe to call
 * synchronously from anywhere.
 *
 * SESSION-DATA BINDING GRAMMAR (11 primitives recognized below):
 *  1. `${a.b.c}` interpolation anywhere in a string value.
 *  2. storePrefillInSession + prefillApiName (Form prefill-read pattern).
 *  3. storeDataInSession + apiName + pathToTableData + nameKeyIds (Table/DataGrid write pattern).
 *  4. fetchFromSession + sessionPath.
 *  5. storeInputApiInSession.
 *  6. storeSelectedInSession.
 *  7. dataTransfer: { name, body }.
 *  8. sessionKeys (CSV string).
 *  9. isDynamicRouting + routeKey.
 * 10. visibilityConditions.parentNames containing "${session...}" tokens.
 * 11. (fallback) plain `${...}` interpolation caught by (1) covers any value
 *     not otherwise classified by 2-10.
 */

export interface SessionBindingCandidate {
  primitive: string;
  componentType: string;
  pathTemplate: string;
  exampleValue: unknown;
  op: string;
}

export interface SkillEntryDraft {
  category:
    | "component_pattern"
    | "user_preference"
    | "dsl_rule"
    | "common_operation"
    | "error_fix"
    | "routing_pattern";
  title: string;
  content: string;
  confidence: number;
}

/** Split an RFC 6901 JSON Pointer into its unescaped segments. */
function parsePointer(pointer: string): string[] {
  if (!pointer || pointer === "/") return [];
  const raw = pointer.startsWith("/") ? pointer.slice(1) : pointer;
  return raw
    .split("/")
    .map((seg) => seg.replace(/~1/g, "/").replace(/~0/g, "~"));
}

/** Generalize numeric array-index segments to the literal token `{n}`. */
function toPathTemplate(segments: string[]): string {
  return (
    "/" +
    segments
      .map((seg) => (/^\d+$/.test(seg) ? "{n}" : seg))
      .join("/")
  );
}

/**
 * Walk `root` following `segments`, stopping either at the end of the path or
 * as soon as we can no longer descend (e.g. the final segment of an `add`
 * doesn't exist yet in the pre-image — irrelevant here since we walk the
 * POST-patch document). Returns the deepest node reached plus the path of
 * segments actually consumed.
 */
function walkPointer(root: any, segments: string[]): any {
  let node = root;
  for (const seg of segments) {
    if (node === null || node === undefined) return node;
    if (Array.isArray(node)) {
      if (seg === "-") return undefined;
      const idx = Number(seg);
      if (Number.isNaN(idx)) return undefined;
      node = node[idx];
    } else if (typeof node === "object") {
      node = node[seg];
    } else {
      return undefined;
    }
  }
  return node;
}

/**
 * Given a full path (segments) into the patched DSL tree, find the nearest
 * ancestor object that looks like a DSL component node: {id, type, properties, components:[]}.
 * Walks from the root down the segment chain, remembering the last node that
 * had a `type` string property.
 */
function findEnclosingComponent(
  root: any,
  segments: string[],
): { type: string; properties: any } | null {
  let node = root;
  let lastComponent: { type: string; properties: any } | null = null;

  if (node && typeof node === "object" && typeof node.type === "string") {
    lastComponent = { type: node.type, properties: node.properties ?? {} };
  }

  for (const seg of segments) {
    if (node === null || node === undefined) break;
    if (Array.isArray(node)) {
      const idx = Number(seg);
      if (Number.isNaN(idx)) break;
      node = node[idx];
    } else if (typeof node === "object") {
      node = node[seg];
    } else {
      break;
    }

    if (node && typeof node === "object" && typeof node.type === "string") {
      lastComponent = { type: node.type, properties: node.properties ?? {} };
    }
  }

  return lastComponent;
}

const INTERPOLATION_RE = /\$\{[^}]+\}/;

function containsInterpolation(value: unknown): boolean {
  return typeof value === "string" && INTERPOLATION_RE.test(value);
}

function stringifyExample(value: unknown): unknown {
  if (value === undefined) return null;
  if (typeof value === "object") {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return String(value);
    }
  }
  return value;
}

/**
 * Classify a single (op, resolved value, enclosing component properties)
 * triple against the 11 session-data-binding primitives. Returns the FIRST
 * primitive that matches (most specific checks first), or null if none
 * recognized.
 */
function classifyPrimitive(
  op: Operation,
  value: unknown,
  props: Record<string, any>,
  segments: string[],
): { primitive: string; exampleValue: unknown } | null {
  const lastKey = segments[segments.length - 1];

  // 3. Table/DataGrid session-data WRITE pattern.
  if (
    props?.storeDataInSession === true ||
    lastKey === "storeDataInSession" ||
    (props?.apiName !== undefined && props?.pathToTableData !== undefined)
  ) {
    if (
      "apiName" in (props || {}) ||
      "pathToTableData" in (props || {}) ||
      "nameKeyIds" in (props || {}) ||
      lastKey === "storeDataInSession" ||
      lastKey === "apiName" ||
      lastKey === "pathToTableData" ||
      lastKey === "nameKeyIds"
    ) {
      return {
        primitive: "table_binding",
        exampleValue: stringifyExample({
          storeDataInSession: props?.storeDataInSession ?? true,
          apiName: props?.apiName,
          pathToTableData: props?.pathToTableData,
          nameKeyIds: props?.nameKeyIds,
        }),
      };
    }
  }

  // 2. Form prefill-read pattern.
  if (
    lastKey === "storePrefillInSession" ||
    lastKey === "prefillApiName" ||
    props?.storePrefillInSession === true
  ) {
    return {
      primitive: "form_prefill",
      exampleValue: stringifyExample({
        storePrefillInSession: props?.storePrefillInSession ?? true,
        prefillApiName: props?.prefillApiName,
      }),
    };
  }

  // 4. fetchFromSession + sessionPath.
  if (lastKey === "fetchFromSession" || lastKey === "sessionPath" || props?.fetchFromSession !== undefined) {
    return {
      primitive: "fetch_from_session",
      exampleValue: stringifyExample({
        fetchFromSession: props?.fetchFromSession,
        sessionPath: props?.sessionPath,
      }),
    };
  }

  // 5. storeInputApiInSession.
  if (lastKey === "storeInputApiInSession" || props?.storeInputApiInSession !== undefined) {
    return {
      primitive: "store_input_api_in_session",
      exampleValue: stringifyExample(props?.storeInputApiInSession ?? value),
    };
  }

  // 6. storeSelectedInSession.
  if (lastKey === "storeSelectedInSession" || props?.storeSelectedInSession !== undefined) {
    return {
      primitive: "store_selected_in_session",
      exampleValue: stringifyExample(props?.storeSelectedInSession ?? value),
    };
  }

  // 7. dataTransfer: { name, body }.
  if (lastKey === "dataTransfer" || (value && typeof value === "object" && ("name" in (value as any) || "body" in (value as any)) && segments.includes("dataTransfer"))) {
    const dt = lastKey === "dataTransfer" ? value : props?.dataTransfer;
    return {
      primitive: "data_transfer",
      exampleValue: stringifyExample(dt ?? value),
    };
  }

  // 8. sessionKeys CSV.
  if (lastKey === "sessionKeys" || props?.sessionKeys !== undefined) {
    return {
      primitive: "session_keys_clear",
      exampleValue: stringifyExample(props?.sessionKeys ?? value),
    };
  }

  // 9. isDynamicRouting + routeKey.
  if (
    lastKey === "isDynamicRouting" ||
    lastKey === "routeKey" ||
    props?.isDynamicRouting === true
  ) {
    return {
      primitive: "dynamic_routing",
      exampleValue: stringifyExample({
        isDynamicRouting: props?.isDynamicRouting ?? true,
        routeKey: props?.routeKey,
      }),
    };
  }

  // 10. visibilityConditions.parentNames containing "${session...}" tokens.
  if (lastKey === "parentNames" || lastKey === "visibilityConditions") {
    const parentNames =
      lastKey === "parentNames"
        ? value
        : (value as any)?.parentNames ?? props?.visibilityConditions?.parentNames;
    if (Array.isArray(parentNames) && parentNames.some((p) => containsInterpolation(p))) {
      return {
        primitive: "conditional_visibility_session",
        exampleValue: stringifyExample({ parentNames }),
      };
    }
  }

  if (
    lastKey === "routingType" ||
    lastKey === "routePage" ||
    lastKey === "navigateWithoutDataTransfer" ||
    (lastKey === "actionType" && value === "routing") ||
    props?.routingType !== undefined ||
    props?.routePage !== undefined ||
    (props?.actionType === "routing" && props?.routePage !== undefined)
  ) {
    return {
      primitive: "routing_action",
      exampleValue: stringifyExample({
        actionType: props?.actionType,
        routingType: props?.routingType,
        routePage: props?.routePage ?? (lastKey === "routePage" ? value : undefined),
        navigateWithoutDataTransfer: props?.navigateWithoutDataTransfer,
      }),
    };
  }

  if (
    lastKey === "showAsPopup" ||
    lastKey === "panePosition" ||
    lastKey === "popupWidth" ||
    lastKey === "closeOnBackdropClick" ||
    props?.showAsPopup === true
  ) {
    return {
      primitive: "popup_page",
      exampleValue: stringifyExample({
        showAsPopup: props?.showAsPopup ?? (lastKey === "showAsPopup" ? value : true),
        panePosition: props?.panePosition,
        popupWidth: props?.popupWidth,
        closeOnBackdropClick: props?.closeOnBackdropClick,
      }),
    };
  }

  if (lastKey === "pageCode") {
    return {
      primitive: "tab_page_link",
      exampleValue: stringifyExample(value),
    };
  }

  // 1 / 11. Plain ${...} interpolation fallback — catches anything else.
  if (containsInterpolation(value)) {
    return {
      primitive: "session_interpolation",
      exampleValue: value,
    };
  }

  if (
    (op.op === "add" || op.op === "replace") &&
    segments.includes("properties") &&
    typeof lastKey === "string" &&
    !BORING_LEAF_KEYS.has(lastKey) &&
    !/^\d+$/.test(lastKey)
  ) {
    return {
      primitive: "component_config",
      exampleValue: stringifyExample(value),
    };
  }

  return null;
}

const BORING_LEAF_KEYS = new Set<string>([
  "id",
  "type",
  "key",
  "label",
  "text",
  "title",
  "name",
  "placeholder",
  "value",
  "showLabel",
  "showTitle",
  "children",
  "components",
  "color",
  "backgroundColor",
  "className",
  "style",
  "margin",
  "padding",
]);

/**
 * Mine session-data binding candidates out of a confirmed patch. For each
 * patch operation, resolves the touched node in the POST-patch DSL by walking
 * its JSON Pointer path, inspects the op's value plus the enclosing
 * component's type/properties, and classifies it against the 11 recognized
 * primitives. Pure and synchronous — no I/O.
 */
export function mineSessionBindingCandidates(
  patch: Operation[],
  patchedDsl: any,
): SessionBindingCandidate[] {
  if (!Array.isArray(patch) || !patchedDsl) return [];

  const candidates: SessionBindingCandidate[] = [];

  for (const op of patch) {
    if (op.op === "test") continue;
    const path = (op as any).path as string | undefined;
    if (!path) continue;

    const segments = parsePointer(path);

    // Resolve the value this op touches. For `remove` there's no value in the
    // post-patch document (or in the op itself) worth inspecting further, but
    // we still classify against the key name / enclosing props.
    const resolvedNode = walkPointer(patchedDsl, segments);
    const value = op.op === "remove" ? undefined : (op as any).value ?? resolvedNode;

    const component = findEnclosingComponent(patchedDsl, segments);
    const props = component?.properties ?? {};

    const classification = classifyPrimitive(op, value, props, segments);
    if (!classification) continue;

    candidates.push({
      primitive: classification.primitive,
      componentType: component?.type ?? "unknown",
      pathTemplate: toPathTemplate(segments),
      exampleValue: classification.exampleValue,
      op: op.op,
    });
  }

  return candidates;
}

const PRIMITIVE_TITLES: Record<string, string> = {
  table_binding: "Table session-data binding",
  form_prefill: "Form prefill session binding",
  fetch_from_session: "Fetch-from-session binding",
  store_input_api_in_session: "Store input API result in session",
  store_selected_in_session: "Store selected value in session",
  data_transfer: "Data transfer payload binding",
  session_keys_clear: "Clear session keys on action",
  dynamic_routing: "Dynamic routing via session routeKey",
  conditional_visibility_session: "Conditional visibility driven by session data",
  routing_action: "Route a control to a page",
  popup_page: "Configure a page as a popup",
  tab_page_link: "Link a tab to a page",
  session_interpolation: "Session value interpolation",
};

const PRIMITIVE_CATEGORY: Record<string, SkillEntryDraft["category"]> = {
  table_binding: "component_pattern",
  form_prefill: "component_pattern",
  fetch_from_session: "component_pattern",
  store_input_api_in_session: "component_pattern",
  store_selected_in_session: "component_pattern",
  data_transfer: "component_pattern",
  session_keys_clear: "common_operation",
  dynamic_routing: "routing_pattern",
  conditional_visibility_session: "dsl_rule",
  routing_action: "routing_pattern",
  popup_page: "component_pattern",
  tab_page_link: "routing_pattern",
  session_interpolation: "dsl_rule",
  component_config: "component_pattern",
};

/**
 * Deterministic, LLM-free template that turns a single mined candidate into a
 * skill entry. Used both as the primary path when no LLM summarization is
 * desired and as the fallback when the LLM call fails/unavailable.
 */
export function candidateToSkillEntry(c: SessionBindingCandidate): SkillEntryDraft {
  const leafKey = c.pathTemplate.split("/").filter(Boolean).pop() ?? "property";
  const title =
    c.primitive === "component_config"
      ? `${c.componentType}: set ${leafKey}`
      : PRIMITIVE_TITLES[c.primitive] ?? `Session binding pattern (${c.primitive})`;
  const category = PRIMITIVE_CATEGORY[c.primitive] ?? "component_pattern";

  let content: string;
  switch (c.primitive) {
    case "table_binding":
      content =
        `On a **${c.componentType}** component, set \`storeDataInSession: true\` together with ` +
        `\`apiName\`, \`pathToTableData\`, and \`nameKeyIds\` to write the fetched table rows into ` +
        `session state for other components/pages to consume. Example at \`${c.pathTemplate}\`: ` +
        `\`${JSON.stringify(c.exampleValue)}\`.`;
      break;
    case "form_prefill":
      content =
        `On a **${c.componentType}** component, set \`storePrefillInSession: true\` and \`prefillApiName\` ` +
        `to persist the form's prefill API response into session state. Example at \`${c.pathTemplate}\`: ` +
        `\`${JSON.stringify(c.exampleValue)}\`.`;
      break;
    case "fetch_from_session":
      content =
        `On a **${c.componentType}** component, use \`fetchFromSession\` with \`sessionPath\` to read a ` +
        `previously stored session value. Example at \`${c.pathTemplate}\`: \`${JSON.stringify(c.exampleValue)}\`.`;
      break;
    case "store_input_api_in_session":
      content =
        `On a **${c.componentType}** component, \`storeInputApiInSession\` persists the input's API result ` +
        `into session state. Example at \`${c.pathTemplate}\`: \`${JSON.stringify(c.exampleValue)}\`.`;
      break;
    case "store_selected_in_session":
      content =
        `On a **${c.componentType}** component, \`storeSelectedInSession\` persists the user's selection into ` +
        `session state. Example at \`${c.pathTemplate}\`: \`${JSON.stringify(c.exampleValue)}\`.`;
      break;
    case "data_transfer":
      content =
        `On a **${c.componentType}** component/action, \`dataTransfer: { name, body }\` defines the payload ` +
        `passed to the next page/API. Example at \`${c.pathTemplate}\`: \`${JSON.stringify(c.exampleValue)}\`.`;
      break;
    case "session_keys_clear":
      content =
        `On a **${c.componentType}** component/action, \`sessionKeys\` (comma-separated) lists which session ` +
        `keys get cleared on click. Example at \`${c.pathTemplate}\`: \`${JSON.stringify(c.exampleValue)}\`.`;
      break;
    case "dynamic_routing":
      content =
        `On a **${c.componentType}** component, \`isDynamicRouting: true\` with \`routeKey\` resolves the ` +
        `navigation target dynamically from session state. Example at \`${c.pathTemplate}\`: \`${JSON.stringify(c.exampleValue)}\`.`;
      break;
    case "conditional_visibility_session":
      content =
        `On a **${c.componentType}** component, \`visibilityConditions.parentNames\` can reference session ` +
        `values via \`\${...}\` interpolation to drive conditional visibility. Example at \`${c.pathTemplate}\`: ` +
        `\`${JSON.stringify(c.exampleValue)}\`.`;
      break;
    case "routing_action":
      content =
        `To route a **${c.componentType}** control to another page, set \`actionType: "routing"\`, ` +
        `\`routingType: "Internal"\`, and \`routePage: "<pageCode>"\` (add \`navigateWithoutDataTransfer: true\` ` +
        `to navigate without carrying a payload). Example at \`${c.pathTemplate}\`: \`${JSON.stringify(c.exampleValue)}\`.`;
      break;
    case "popup_page":
      content =
        `A page is shown as a popup via page-level \`properties\`: \`showAsPopup: true\` with ` +
        `\`panePosition\` (left|right|center|bottom), \`popupWidth\` (0-100), and \`closeOnBackdropClick\`. ` +
        `Popup is page-level config — there is no \`routingType: "Popup"\`. Example at \`${c.pathTemplate}\`: ` +
        `\`${JSON.stringify(c.exampleValue)}\`.`;
      break;
    case "tab_page_link":
      content =
        `A tab links to a page through a bare \`pageCode\` field (not routing props). Example at ` +
        `\`${c.pathTemplate}\`: \`${JSON.stringify(c.exampleValue)}\`.`;
      break;
    case "session_interpolation":
      content =
        `On a **${c.componentType}** component, a value at \`${c.pathTemplate}\` uses \`\${...}\` session ` +
        `interpolation. Example: \`${JSON.stringify(c.exampleValue)}\`.`;
      break;
    default:
      content =
        `On a **${c.componentType}** component, \`${leafKey}\` was set at \`${c.pathTemplate}\`. ` +
        `Example: \`${JSON.stringify(c.exampleValue)}\`.`;
  }

  return {
    category,
    title,
    content,
    confidence: c.primitive === "component_config" ? 0.4 : 0.7,
  };
}
