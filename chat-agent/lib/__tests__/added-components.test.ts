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
    expect(extractAddedRawNodes("nope")).toEqual([]);
  });

  it("ignores falsy patch entries and non-component values", () => {
    const messy = [null, { op: "add", path: "/a", value: "str" }, { op: "add", path: "/b", value: [1, { type: "x" }] }];
    expect(extractAddedComponents(messy)).toHaveLength(1);
    expect(extractAddedRawNodes(messy)).toEqual([{ type: "x" }]);
  });

  it("extracts raw nodes from replace ops with array values and skips removes", () => {
    const raw = extractAddedRawNodes([
      { op: "replace", path: "/components", value: [{ type: "a" }, { type: "b" }] },
      { op: "remove", path: "/components/0" },
    ]);
    expect(raw.map((n) => n.type)).toEqual(["a", "b"]);
  });

  describe("preview details", () => {
    const one = (value: any, op = "add") => extractAddedComponents([{ op, path: "/x", value }])[0];

    it("records the replace op and a non-string id as undefined", () => {
      const c = one({ type: "text", id: 5 }, "replace");
      expect(c.op).toBe("replace");
      expect(c.id).toBeUndefined();
    });

    it("prefers a node-level label key, skips blank labels, falls back through LABEL_KEYS", () => {
      expect(one({ type: "t", label: "Top", properties: { label: "Prop" } }).label).toBe("Top");
      expect(one({ type: "t", properties: { label: "   ", title: "Title" } }).label).toBe("Title");
      expect(one({ type: "t", properties: { height: 1 } }).label).toBeUndefined();
    });

    it("renders scalar fields only, abbreviating long strings, arrays and dropping empties", () => {
      const long = "x".repeat(80);
      const c = one({
        type: "t",
        properties: { long, n: 3, b: false, arr: [1, 2], obj: { a: 1 }, nil: null, blank: undefined, id: "skip" },
      });
      const fields = Object.fromEntries(c.fields.map((f) => [f.key, f.value]));
      expect(fields.long).toBe("x".repeat(57) + "…");
      expect(fields).toMatchObject({ n: "3", b: "false", arr: "[2]" });
      expect(fields).not.toHaveProperty("obj");
      expect(fields).not.toHaveProperty("nil");
      expect(fields).not.toHaveProperty("id");
    });

    it("reads fields from the node itself when it has no properties and caps at 8", () => {
      const node: any = { type: "t" };
      for (let i = 0; i < 12; i++) node[`k${i}`] = i;
      const c = one(node);
      expect(c.fields).toHaveLength(8);
      expect(c.fields[0]).toEqual({ key: "k0", value: "0" });
    });

    it("maps nested `children` arrays when `components` is absent and ignores non-components", () => {
      const c = one({ type: "p", children: [{ type: "c" }, "junk", null] });
      expect(c.children.map((k) => k.type)).toEqual(["c"]);
      expect(one({ type: "p", components: "oops" }).children).toEqual([]);
    });
  });
});
