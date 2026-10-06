/**
 * @jest-environment node
 */
import {
  compactDsl,
  parseDslPath,
  toPointer,
  resolveSegments,
  outlineDsl,
  buildNodeIndex,
  findComponents,
  depthOneView,
  countDescendants,
} from "../dsl-compact";

const page = {
  id: "11111111-aaaa-bbbb-cccc-000000000000",
  type: "page",
  properties: { showAsPopup: false, title: "" },
  components: [
    {
      id: "22222222-aaaa-bbbb-cccc-000000000000",
      type: "form",
      properties: { label: "Customer", apiUrl: "/api/x", notes: null, tags: [] },
      components: [
        {
          id: "33333333-aaaa-bbbb-cccc-000000000000",
          type: "button-v2",
          properties: { label: "Submit", actionType: "routing", routingType: "Internal", routePage: "m_overview" },
          components: [],
        },
      ],
    },
    {
      id: "44444444-aaaa-bbbb-cccc-000000000000",
      type: "table",
      properties: {
        tableColumns: [{ id: "55555555-aaaa", type: "table-column", properties: { label: "LAN", isClickable: true } }],
      },
    },
  ],
};

describe("compactDsl", () => {
  it("drops null, empty strings, empty arrays and empty objects", () => {
    const out: any = compactDsl(page);
    expect(out.components[0].properties).toEqual({ label: "Customer", apiUrl: "/api/x" });
    expect(out.components[0].components[0].components).toBeUndefined();
    expect(out.properties).toEqual({ showAsPopup: false }); // false is kept
  });

  it("keeps 0 and false, and returns undefined for a fully empty value", () => {
    expect(compactDsl({ a: 0, b: false, c: {} })).toEqual({ a: 0, b: false });
    expect(compactDsl({ a: null, b: [] })).toBeUndefined();
  });

  it("is shorter than the raw JSON", () => {
    expect(JSON.stringify(compactDsl(page)).length).toBeLessThan(JSON.stringify(page).length);
  });
});

describe("parseDslPath / toPointer / resolveSegments", () => {
  it.each([
    ["/components/0/properties", ["components", "0", "properties"]],
    ["components.0.properties", ["components", "0", "properties"]],
    ["components[0].properties", ["components", "0", "properties"]],
    ["dsl.components.1", ["components", "1"]],
    ["", []],
    ["/", []],
  ])("%s", (path, segments) => {
    expect(parseDslPath(path)).toEqual(segments);
  });

  it("round-trips escaped pointer tokens", () => {
    expect(parseDslPath(toPointer(["a/b", "c~d"]))).toEqual(["a/b", "c~d"]);
  });

  it("resolves array indices", () => {
    expect(resolveSegments(page, ["components", "0", "components", "0", "type"])).toBe("button-v2");
    expect(resolveSegments(page, ["components", "9"])).toBeUndefined();
  });
});

describe("outlineDsl", () => {
  const outline = outlineDsl(page);

  it("emits one line per node with its exact JSON Pointer", () => {
    const lines = outline.split("\n");
    expect(lines[0]).toMatch(/^\/ page #11111111/);
    expect(outline).toContain('/components/0 form #22222222 "Customer" {apiUrl=/api/x}');
    expect(outline).toContain(
      '/components/0/components/0 button-v2 #33333333 "Submit" {actionType=routing, routingType=Internal, routePage=m_overview}',
    );
  });

  it("finds nodes nested inside properties (table columns)", () => {
    expect(outline).toContain('/components/1/properties/tableColumns/0 table-column #55555555 "LAN" {isClickable=true}');
  });

  it("is far smaller than the raw JSON", () => {
    expect(outline.length).toBeLessThan(JSON.stringify(page, null, 2).length / 2);
  });

  it("caps very large outlines and says how many nodes were left out", () => {
    const big = { id: "r", type: "page", components: Array.from({ length: 50 }, (_, i) => ({ id: `c${i}`, type: "spacer" })) };
    const capped = outlineDsl(big, { maxLines: 10 });
    expect(capped.split("\n")).toHaveLength(11);
    expect(capped).toContain("+41 more nodes");
  });

  it("prefixes pointers with basePath when outlining a subtree", () => {
    expect(outlineDsl(page.components[0], { basePath: ["components", "0"] })).toMatch(/^\/components\/0 form/);
  });
});

describe("node index / search / depth-1 view", () => {
  // `page` is defined at the top of this file.
  const { buildNodeIndex, pointersForId, findComponents, countDescendants, depthOneView } =
    jest.requireActual("../dsl-compact");
  const index = buildNodeIndex(page);

  it("indexes every node by pointer and id", () => {
    expect(index.byId.get("33333333-aaaa-bbbb-cccc-000000000000")).toBe("/components/0/components/0");
    expect(index.pointers.get("/components/1/properties/tableColumns/0")).toEqual([
      "components", "1", "properties", "tableColumns", "0",
    ]);
  });

  it("resolves a full id or the 8-char prefix shown in outlines", () => {
    expect(pointersForId(index, "33333333-aaaa-bbbb-cccc-000000000000")).toEqual(["/components/0/components/0"]);
    expect(pointersForId(index, "33333333")).toEqual(["/components/0/components/0"]);
    expect(pointersForId(index, "nope")).toEqual([]);
  });

  it("finds components by type, label and property value", () => {
    expect(findComponents(index, { type: "button-v2" })).toEqual([
      '/components/0/components/0 button-v2 #33333333 "Submit" {actionType=routing, routingType=Internal, routePage=m_overview}',
    ]);
    expect(findComponents(index, { prop: "routePage", equals: "m_overview" })).toHaveLength(1);
    expect(findComponents(index, { prop: "routePage", equals: "other" })).toHaveLength(0);
    expect(findComponents(index, { labelContains: "cust" })[0]).toContain("form #22222222");
    expect(findComponents(index, { prop: "isClickable" })[0]).toContain("table-column");
  });

  it("counts nested component nodes", () => {
    expect(countDescendants(page)).toBe(4);
    expect(countDescendants(page.components[0])).toBe(1);
  });

  it("depth-1 view keeps own settings and stubs nested components", () => {
    const view: any = depthOneView(page.components[0], ["components", "0"]);
    expect(view.properties).toEqual({ label: "Customer", apiUrl: "/api/x" });
    expect(view.components).toEqual([
      '/components/0/components/0 button-v2 #33333333 "Submit" {actionType=routing, routingType=Internal, routePage=m_overview}',
    ]);
    expect(JSON.stringify(view)).not.toContain("routingType\":");
  });
});

describe("path and node helpers edge cases", () => {
  it("parseDslPath treats null/undefined/blank as the root", () => {
    expect(parseDslPath(null)).toEqual([]);
    expect(parseDslPath(undefined)).toEqual([]);
    expect(parseDslPath("  ")).toEqual([]);
  });

  it("resolveSegments stops at a null on the way down", () => {
    expect(resolveSegments({ a: null }, ["a", "b"])).toBeUndefined();
    expect(resolveSegments({ a: [1, 2] }, ["a", "1"])).toBe(2);
  });
});

describe("describeNode / findComponents / depthOneView edge cases", () => {
  const root = {
    id: "root-0000",
    type: "page",
    pageCode: "m_home",
    components: [
      { id: "aaaaaaaa-1", type: "button", properties: { label: "L".repeat(80), routePage: "m_x", flag: false } },
      { id: "bbbbbbbb-2", type: "table", properties: { name: "orders", columns: [{ a: 1 }], meta: { k: "v" } } },
    ],
  };

  it("truncates long labels, shows pageCode, and does not repeat the label key inline", () => {
    const outline = outlineDsl(root);
    expect(outline).toContain(`"${"L".repeat(60)}…"`);
    expect(outline).toContain("page #root-000 pageCode=m_home");
    expect(outline).toContain('table #bbbbbbbb "orders"');
    expect(outline).not.toContain("name=orders");
    expect(outline).toContain("{routePage=m_x}");
  });

  it("findComponents matches object-valued props by their JSON", () => {
    const index = buildNodeIndex(root);
    expect(findComponents(index, { prop: "meta", equals: '{"k":"v"}' })).toHaveLength(1);
    expect(findComponents(index, { prop: "meta", equals: "nope" })).toHaveLength(0);
    expect(findComponents(index, { prop: "missing" })).toHaveLength(0);
    expect(findComponents(index, { type: "table", labelContains: "ORD" })).toHaveLength(1);
    expect(findComponents(index, { labelContains: "zzz" })).toHaveLength(0);
  });

  it("depthOneView stubs nested nodes and defaults to a root pointer", () => {
    const view: any = depthOneView(root);
    expect(view.id).toBe("root-0000");
    expect(view.components[0]).toMatch(/^\/components\/0 button #aaaaaaaa/);
  });

  it("depthOneView of a nested node uses its segments for stub pointers", () => {
    const view: any = depthOneView({ id: "x", type: "stack", components: [{ id: "y", type: "button" }] }, ["a", "0"]);
    expect(view.components[0]).toBe("/a/0/components/0 button #y");
  });

  it("walks nodes held in properties (e.g. table columns) with their pointers", () => {
    const outline = outlineDsl({
      id: "t",
      type: "table",
      properties: { columns: [{ id: "col1", type: "column", properties: { label: "A" } }] },
    });
    expect(outline).toContain("/properties/columns/0 column #col1");
  });

  it("countDescendants excludes the node itself and counts bare containers fully", () => {
    expect(countDescendants(root)).toBe(2);
    expect(countDescendants([{ id: "a", type: "x" }, { id: "b", type: "x" }])).toBe(2);
  });
});
