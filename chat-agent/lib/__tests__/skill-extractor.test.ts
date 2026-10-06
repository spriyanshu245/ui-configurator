/**
 * @jest-environment node
 *
 * Behavioural tests for the deterministic session-binding extractor. Each
 * primitive is exercised through the public `mineSessionBindingCandidates`
 * API; the Table/routing/popup happy paths are also covered in
 * skill-learning.test.ts, so here we focus on every remaining recognizer and
 * the pointer-walking edge cases.
 */
import {
  mineSessionBindingCandidates,
  candidateToSkillEntry,
  type SessionBindingCandidate,
} from "../skill-extractor";

/** A page with one component of the given type/properties at /components/0. */
function pageWith(properties: Record<string, any> | undefined, type = "widget") {
  return {
    id: "root",
    type: "page",
    properties: {},
    components: [{ id: "c1", type, properties, components: [] }],
  };
}

function mineOne(op: any, dsl: any) {
  return mineSessionBindingCandidates([op], dsl);
}

const P = "/components/0/properties/";

describe("mineSessionBindingCandidates — input guards", () => {
  it.each([
    ["non-array patch", "nope" as any, { type: "page" }],
    ["missing dsl", [{ op: "add", path: "/a", value: 1 }], null],
  ])("returns [] for %s", (_label, patch, dsl) => {
    expect(mineSessionBindingCandidates(patch, dsl)).toEqual([]);
  });

  it("skips `test` ops and ops without a path", () => {
    const dsl = pageWith({ pageCode: "x" });
    const result = mineSessionBindingCandidates(
      [
        { op: "test", path: P + "pageCode", value: "x" },
        { op: "add", value: "x" } as any,
      ],
      dsl,
    );
    expect(result).toEqual([]);
  });
});

describe("mineSessionBindingCandidates — primitive recognition", () => {
  it.each<[string, string, any, string, any, string, Record<string, any> | null]>([
    // [label, op, propsOnComponent, leafKey, opValue, expectedPrimitive, expectedExample]
    [
      "table binding via component props",
      "replace",
      { storeDataInSession: true, apiName: "a", pathToTableData: "p", nameKeyIds: ["k"] },
      "apiName",
      "a",
      "table_binding",
      { storeDataInSession: true, apiName: "a", pathToTableData: "p", nameKeyIds: ["k"] },
    ],
    [
      "table binding keyed only by the leaf name",
      "add",
      {},
      "storeDataInSession",
      true,
      "table_binding",
      { storeDataInSession: true },
    ],
    [
      "form prefill via leaf key",
      "add",
      { prefillApiName: "getForm" },
      "prefillApiName",
      "getForm",
      "form_prefill",
      { storePrefillInSession: true, prefillApiName: "getForm" },
    ],
    [
      "form prefill via component flag",
      "replace",
      { storePrefillInSession: true, prefillApiName: "x" },
      "label",
      "L",
      "form_prefill",
      { storePrefillInSession: true, prefillApiName: "x" },
    ],
    [
      "fetchFromSession via component prop",
      "replace",
      { fetchFromSession: true, sessionPath: "a.b" },
      "label",
      "L",
      "fetch_from_session",
      { fetchFromSession: true, sessionPath: "a.b" },
    ],
    [
      "fetchFromSession via leaf key",
      "add",
      {},
      "sessionPath",
      "a.b",
      "fetch_from_session",
      { sessionPath: "a.b" },
    ],
    [
      "storeInputApiInSession falls back to op value",
      "add",
      {},
      "storeInputApiInSession",
      "inputApi",
      "store_input_api_in_session",
      null,
    ],
    [
      "storeSelectedInSession prefers component prop",
      "replace",
      { storeSelectedInSession: "sel" },
      "label",
      "L",
      "store_selected_in_session",
      null,
    ],
    [
      "dataTransfer leaf",
      "add",
      {},
      "dataTransfer",
      { name: "n", body: "b" },
      "data_transfer",
      { name: "n", body: "b" },
    ],
    ["sessionKeys CSV", "add", {}, "sessionKeys", "a,b", "session_keys_clear", null],
    [
      "dynamic routing via routeKey leaf",
      "add",
      {},
      "routeKey",
      "k",
      "dynamic_routing",
      { isDynamicRouting: true },
    ],
    [
      "dynamic routing via component flag",
      "replace",
      { isDynamicRouting: true, routeKey: "rk" },
      "label",
      "L",
      "dynamic_routing",
      { isDynamicRouting: true, routeKey: "rk" },
    ],
    [
      "routing action via routePage leaf",
      "add",
      {},
      "routePage",
      "pg",
      "routing_action",
      { routePage: "pg" },
    ],
    [
      "routing action via actionType=routing value",
      "add",
      { actionType: "routing" },
      "actionType",
      "routing",
      "routing_action",
      { actionType: "routing" },
    ],
    [
      "routing action via component routingType",
      "replace",
      { routingType: "Internal" },
      "label",
      "L",
      "routing_action",
      { routingType: "Internal" },
    ],
    [
      "popup page via leaf key",
      "add",
      {},
      "showAsPopup",
      true,
      "popup_page",
      { showAsPopup: true },
    ],
    [
      "popup page via component flag",
      "replace",
      { showAsPopup: true, popupWidth: 40 },
      "label",
      "L",
      "popup_page",
      { showAsPopup: true, popupWidth: 40 },
    ],
    ["tab page link", "add", {}, "pageCode", "page_2", "tab_page_link", null],
    [
      "plain interpolation fallback",
      "replace",
      {},
      "label",
      "Hello ${session.user.name}",
      "session_interpolation",
      null,
    ],
    ["generic component config", "replace", {}, "pageSize", 25, "component_config", null],
  ])("%s", (_label, op, props, leaf, value, primitive, example) => {
    const result = mineOne({ op, path: P + leaf, value }, pageWith({ ...props, [leaf]: value }));
    expect(result).toHaveLength(1);
    expect(result[0].primitive).toBe(primitive);
    expect(result[0].componentType).toBe("widget");
    expect(result[0].op).toBe(op);
    if (example) expect(result[0].exampleValue).toEqual(expect.objectContaining(example));
  });

  it("uses props.dataTransfer when the leaf under dataTransfer holds the payload", () => {
    const dsl = pageWith({ dataTransfer: { name: "n", body: "b" } });
    const [c] = mineOne(
      { op: "add", path: P + "dataTransfer/payload", value: { name: "inner" } },
      dsl,
    );
    expect(c.primitive).toBe("data_transfer");
    expect(c.exampleValue).toEqual({ name: "n", body: "b" });
  });

  it("falls back to the op value when dataTransfer is absent from props", () => {
    const dsl = pageWith({});
    const [c] = mineOne(
      { op: "add", path: P + "dataTransfer/payload", value: { body: "only" } },
      dsl,
    );
    expect(c.exampleValue).toEqual({ body: "only" });
  });

  it("does not treat a name/body object outside dataTransfer as a transfer", () => {
    const dsl = pageWith({});
    const result = mineOne({ op: "add", path: P + "headers", value: { name: "x" } }, dsl);
    expect(result[0].primitive).toBe("component_config");
  });

  it("does not match table binding when the flag is set but no table key is involved", () => {
    const dsl = pageWith({ storeDataInSession: true, label: "L" });
    expect(mineOne({ op: "replace", path: P + "label", value: "L" }, dsl)).toEqual([]);
  });

  it("emits a null exampleValue when a remove op has no value to show", () => {
    const [c] = mineOne({ op: "remove", path: P + "pageCode" }, pageWith({}));
    expect(c.primitive).toBe("tab_page_link");
    expect(c.exampleValue).toBeNull();
  });

  it("stringifies a non-serializable (circular) example value", () => {
    const circular: any = { a: 1 };
    circular.self = circular;
    const [c] = mineOne({ op: "add", path: P + "settings", value: circular }, pageWith({}));
    expect(c.primitive).toBe("component_config");
    expect(c.exampleValue).toBe("[object Object]");
  });
});

describe("conditional visibility recognition", () => {
  const interp = ["${session.role}", "static"];

  it("recognizes parentNames array with a session token", () => {
    const [c] = mineOne(
      { op: "add", path: P + "visibilityConditions/parentNames", value: interp },
      pageWith({ visibilityConditions: { parentNames: interp } }),
    );
    expect(c.primitive).toBe("conditional_visibility_session");
    expect(c.exampleValue).toEqual({ parentNames: interp });
  });

  it("reads parentNames out of a visibilityConditions value", () => {
    const [c] = mineOne(
      { op: "add", path: P + "visibilityConditions", value: { parentNames: interp } },
      pageWith({}),
    );
    expect(c.primitive).toBe("conditional_visibility_session");
  });

  it("falls back to the component's visibilityConditions when the op has no value (remove)", () => {
    const [c] = mineOne(
      { op: "remove", path: P + "visibilityConditions" },
      pageWith({ visibilityConditions: { parentNames: interp } }),
    );
    expect(c.primitive).toBe("conditional_visibility_session");
  });

  it("ignores parentNames without any interpolation (generic config instead)", () => {
    const [c] = mineOne(
      { op: "add", path: P + "visibilityConditions/parentNames", value: ["a", "b"] },
      pageWith({}),
    );
    expect(c.primitive).toBe("component_config");
  });

  it("ignores a non-array parentNames", () => {
    const result = mineOne(
      { op: "add", path: P + "visibilityConditions", value: { parentNames: "${x}" } },
      pageWith({}),
    );
    expect(result[0].primitive).toBe("component_config");
  });
});

describe("pointer handling", () => {
  it("generalizes indices and unescapes ~0/~1 in the path template", () => {
    const dsl = pageWith({ "a/b~c": 1 });
    const [c] = mineOne({ op: "add", path: P + "a~1b~0c", value: 1 }, dsl);
    expect(c.pathTemplate).toBe("/components/{n}/properties/a/b~c");
  });

  it("accepts a pointer without the leading slash", () => {
    const [c] = mineOne(
      { op: "add", path: "components/0/properties/pageCode", value: "p" },
      pageWith({}),
    );
    expect(c.pathTemplate).toBe("/components/{n}/properties/pageCode");
  });

  it("handles the whole-document pointer on a typed root", () => {
    const dsl = { type: "page", properties: { showAsPopup: true } };
    const [c] = mineOne({ op: "replace", path: "/", value: dsl }, dsl);
    expect(c.primitive).toBe("popup_page");
    expect(c.componentType).toBe("page");
    expect(c.pathTemplate).toBe("/");
  });

  it("does not crash on `-` append pointers and still finds the enclosing component", () => {
    const dsl = pageWith({});
    const [c] = mineOne(
      { op: "add", path: "/components/-", value: "${session.x}" },
      dsl,
    );
    expect(c.primitive).toBe("session_interpolation");
    expect(c.componentType).toBe("page");
  });

  it("reports componentType 'unknown' when no enclosing node has a type", () => {
    const dsl = { components: [{ properties: {} }] };
    const [c] = mineOne({ op: "add", path: "/components/0/pageCode", value: "p" }, dsl);
    expect(c.componentType).toBe("unknown");
  });

  it("stops descending at scalar values and null nodes", () => {
    const dsl = { type: "page", properties: { label: "text", nothing: null } };
    const viaScalar = mineOne({ op: "add", path: "/properties/label/pageCode", value: "p" }, dsl);
    const viaNull = mineOne({ op: "add", path: "/properties/nothing/pageCode", value: "p" }, dsl);
    expect(viaScalar[0].componentType).toBe("page");
    expect(viaNull[0].componentType).toBe("page");
  });

  it("skips numeric leaf segments and boring presentational leaves for generic config", () => {
    const dsl = pageWith({ items: ["x"], label: "L" });
    expect(mineOne({ op: "add", path: P + "items/0", value: "x" }, dsl)).toEqual([]);
    expect(mineOne({ op: "replace", path: P + "label", value: "L" }, dsl)).toEqual([]);
  });

  it("handles non-numeric array segments and missing properties on the enclosing node", () => {
    const dsl = { type: "page", components: [{ id: "x", type: "widget" }] };
    const [c] = mineOne({ op: "add", path: "/components/0/pageCode", value: "p" }, dsl);
    expect(c.componentType).toBe("widget");
    const none = mineOne({ op: "add", path: "/components/abc/properties/zzz", value: 1 }, dsl);
    expect(none[0].primitive).toBe("component_config");
  });
});

describe("candidateToSkillEntry", () => {
  const base = (primitive: string, extra: Partial<SessionBindingCandidate> = {}): SessionBindingCandidate => ({
    primitive,
    componentType: "Widget",
    pathTemplate: "/components/{n}/properties/thing",
    exampleValue: { k: "v" },
    op: "add",
    ...extra,
  });

  it.each([
    ["table_binding", "Table session-data binding", "component_pattern", "storeDataInSession"],
    ["form_prefill", "Form prefill session binding", "component_pattern", "prefillApiName"],
    ["fetch_from_session", "Fetch-from-session binding", "component_pattern", "sessionPath"],
    ["store_input_api_in_session", "Store input API result in session", "component_pattern", "storeInputApiInSession"],
    ["store_selected_in_session", "Store selected value in session", "component_pattern", "storeSelectedInSession"],
    ["data_transfer", "Data transfer payload binding", "component_pattern", "dataTransfer"],
    ["session_keys_clear", "Clear session keys on action", "common_operation", "sessionKeys"],
    ["dynamic_routing", "Dynamic routing via session routeKey", "routing_pattern", "isDynamicRouting"],
    ["conditional_visibility_session", "Conditional visibility driven by session data", "dsl_rule", "parentNames"],
    ["routing_action", "Route a control to a page", "routing_pattern", "routePage"],
    ["popup_page", "Configure a page as a popup", "component_pattern", "showAsPopup"],
    ["tab_page_link", "Link a tab to a page", "routing_pattern", "pageCode"],
    ["session_interpolation", "Session value interpolation", "dsl_rule", "interpolation"],
  ])("%s -> title, category and content", (primitive, title, category, keyword) => {
    const entry = candidateToSkillEntry(base(primitive));
    expect(entry.title).toBe(title);
    expect(entry.category).toBe(category);
    expect(entry.content).toContain(keyword);
    expect(entry.content).toContain('{"k":"v"}');
    expect(entry.confidence).toBe(0.7);
  });

  it("titles component_config entries per property with low confidence", () => {
    const entry = candidateToSkillEntry(base("component_config"));
    expect(entry.title).toBe("Widget: set thing");
    expect(entry.category).toBe("component_pattern");
    expect(entry.confidence).toBe(0.4);
    expect(entry.content).toContain("`thing` was set at");
  });

  it("uses a generic title/category for unknown primitives and a default leaf key", () => {
    const entry = candidateToSkillEntry(base("mystery", { pathTemplate: "/" }));
    expect(entry.title).toBe("Session binding pattern (mystery)");
    expect(entry.category).toBe("component_pattern");
    expect(entry.content).toContain("`property` was set at");
  });
});
