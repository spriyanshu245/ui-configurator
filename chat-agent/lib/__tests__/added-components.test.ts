import {
  extractAddedComponents,
  extractAddedRawNodes,
  countPreviewComponents,
} from "../added-components";

describe("added-components", () => {
  const patch = [
    { op: "test", path: "/x", value: 1 },
    {
      op: "add",
      path: "/components/-",
      value: {
        id: "form-1",
        type: "form",
        properties: { label: "Customer" },
        components: [
          { id: "in-1", type: "input", properties: { name: "lan", label: "LAN" } },
          { id: "in-2", type: "input", properties: { name: "amt", label: "Amount" } },
        ],
      },
    },
    { op: "replace", path: "/components/0/properties/text", value: "Hello" }, // scalar, not a component
  ];

  it("extracts added component subtrees with fields and nested children", () => {
    const list = extractAddedComponents(patch as any);
    expect(list).toHaveLength(1);
    const form = list[0];
    expect(form.type).toBe("form");
    expect(form.label).toBe("Customer");
    expect(form.op).toBe("add");
    expect(form.children).toHaveLength(2);
    expect(form.children[0].type).toBe("input");
    expect(form.children[0].label).toBe("LAN");
    // Fields exclude id/type/components; include name.
    const keys = form.children[0].fields.map((f) => f.key);
    expect(keys).toContain("name");
    expect(keys).not.toContain("id");
    expect(keys).not.toContain("type");
  });

  it("counts every component in the forest (parent + children)", () => {
    const list = extractAddedComponents(patch as any);
    expect(countPreviewComponents(list)).toBe(3); // form + 2 inputs
  });

  it("extracts raw nodes unmodified for the live renderer", () => {
    const raw = extractAddedRawNodes(patch as any);
    expect(raw).toHaveLength(1);
    expect(raw[0].id).toBe("form-1");
    expect(raw[0].components).toHaveLength(2);
  });

  it("handles an array-valued add (whole components array replace)", () => {
    const arrPatch = [
      {
        op: "add",
        path: "/components",
        value: [
          { id: "a", type: "heading", properties: { text: "Title" } },
          { id: "b", type: "spacer", properties: { height: 12 } },
        ],
      },
    ];
    const list = extractAddedComponents(arrPatch as any);
    expect(list).toHaveLength(2);
    expect(list.map((c) => c.type)).toEqual(["heading", "spacer"]);
  });

  it("returns empty for non-array or non-component patches", () => {
    expect(extractAddedComponents(null as any)).toEqual([]);
    expect(extractAddedComponents([{ op: "remove", path: "/x" }] as any)).toEqual([]);
  });
});
