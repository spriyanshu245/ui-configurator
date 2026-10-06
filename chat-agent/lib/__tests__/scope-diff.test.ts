/**
 * @jest-environment node
 */

import type { Operation } from "fast-json-patch";
import { scopeDiffToPatch } from "../scope-diff";

function makeLargeDsl() {
  return {
    id: "root",
    type: "root",
    components: [
      { id: "c0", type: "heading", properties: { text: "Welcome" } },
      { id: "c1", type: "text", properties: { value: "Some text" } },
      {
        id: "c2",
        type: "table",
        properties: { apiUrl: "/api/old", pageSize: 10 },
        components: [
          { id: "c2-col0", type: "column", properties: { name: "col1" } },
        ],
      },
      { id: "c3", type: "button", properties: { label: "Submit" } },
      { id: "c4", type: "footer", properties: { text: "Footer" } },
    ],
  };
}

describe("scopeDiffToPatch", () => {
  it("returns [] when the patch is empty", () => {
    const dsl = makeLargeDsl();
    expect(scopeDiffToPatch(dsl, dsl, [])).toEqual([]);
  });

  it("anchors a single replace on a component's property at that component", () => {
    const currentDsl = makeLargeDsl();
    const patchedDsl = JSON.parse(JSON.stringify(currentDsl));
    patchedDsl.components[2].properties.apiUrl = "/api/new";

    const patch: Operation[] = [
      {
        op: "replace",
        path: "/components/2/properties/apiUrl",
        value: "/api/new",
      },
    ];

    const chunks = scopeDiffToPatch(currentDsl, patchedDsl, patch);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].anchorPath).toBe("/components/2");
    expect(chunks[0].key).toBe("/components/2");
    expect(chunks[0].ops).toHaveLength(1);
    expect((chunks[0].before as any).id).toBe("c2");
    expect((chunks[0].before as any).properties.apiUrl).toBe("/api/old");
    expect((chunks[0].after as any).properties.apiUrl).toBe("/api/new");
    // Sibling components must NOT leak into the chunk's before/after subtree.
    expect((chunks[0].before as any).properties.pageSize).toBe(10);
  });

  it("groups two edits to the same component into a single chunk", () => {
    const currentDsl = makeLargeDsl();
    const patchedDsl = JSON.parse(JSON.stringify(currentDsl));
    patchedDsl.components[2].properties.apiUrl = "/api/new";
    patchedDsl.components[2].properties.pageSize = 25;

    const patch: Operation[] = [
      {
        op: "replace",
        path: "/components/2/properties/apiUrl",
        value: "/api/new",
      },
      {
        op: "replace",
        path: "/components/2/properties/pageSize",
        value: 25,
      },
    ];

    const chunks = scopeDiffToPatch(currentDsl, patchedDsl, patch);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].anchorPath).toBe("/components/2");
    expect(chunks[0].ops).toHaveLength(2);
    expect((chunks[0].after as any).properties.apiUrl).toBe("/api/new");
    expect((chunks[0].after as any).properties.pageSize).toBe(25);
  });

  describe("array add/remove ops anchor at the parent array (siblings stay visible)", () => {
    const newComponent = { id: "c5", type: "text", properties: { value: "New!" } };

    it.each([
      ["add with the '-' append token", { op: "add", path: "/components/-", value: newComponent }, (d: any) => d.components.push(newComponent), 5, 6],
      ["add at an explicit index", { op: "add", path: "/components/1", value: newComponent }, (d: any) => d.components.splice(1, 0, newComponent), 5, 6],
      ["remove at an explicit index", { op: "remove", path: "/components/3" }, (d: any) => d.components.splice(3, 1), 5, 4],
    ] as const)("%s", (_name, op, mutate, beforeLen, afterLen) => {
      const currentDsl = makeLargeDsl();
      const patchedDsl = JSON.parse(JSON.stringify(currentDsl));
      mutate(patchedDsl);

      const chunks = scopeDiffToPatch(currentDsl, patchedDsl, [op as Operation]);

      expect(chunks).toHaveLength(1);
      expect(chunks[0].anchorPath).toBe("/components");
      expect(chunks[0].before as any[]).toHaveLength(beforeLen);
      expect(chunks[0].after as any[]).toHaveLength(afterLen);
    });
  });

  it("produces separate chunks for edits to different components", () => {
    const currentDsl = makeLargeDsl();
    const patchedDsl = JSON.parse(JSON.stringify(currentDsl));
    patchedDsl.components[0].properties.text = "Welcome!!";
    patchedDsl.components[3].properties.label = "Send";

    const patch: Operation[] = [
      { op: "replace", path: "/components/0/properties/text", value: "Welcome!!" },
      { op: "replace", path: "/components/3/properties/label", value: "Send" },
    ];

    const chunks = scopeDiffToPatch(currentDsl, patchedDsl, patch);

    expect(chunks).toHaveLength(2);
    const anchors = chunks.map((c) => c.anchorPath).sort();
    expect(anchors).toEqual(["/components/0", "/components/3"]);
  });

  it("anchors an edit to a nested child component at the child, not the parent table", () => {
    const currentDsl = makeLargeDsl();
    const patchedDsl = JSON.parse(JSON.stringify(currentDsl));
    patchedDsl.components[2].components[0].properties.name = "renamedCol";

    const patch: Operation[] = [
      {
        op: "replace",
        path: "/components/2/components/0/properties/name",
        value: "renamedCol",
      },
    ];

    const chunks = scopeDiffToPatch(currentDsl, patchedDsl, patch);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].anchorPath).toBe("/components/2/components/0");
    expect((chunks[0].after as any).id).toBe("c2-col0");
  });

  it("adds a fallback residual chunk for a change outside any op's anchor subtree", () => {
    const currentDsl = makeLargeDsl();
    const patchedDsl = JSON.parse(JSON.stringify(currentDsl));
    // Op describes an edit to component 2...
    patchedDsl.components[2].properties.apiUrl = "/api/new";
    // ...but the user also manually edited an unrelated top-level field
    // (simulating an Edit-Patch-tab edit not described by any op).
    (patchedDsl as any).title = "Renamed Page";

    const patch: Operation[] = [
      {
        op: "replace",
        path: "/components/2/properties/apiUrl",
        value: "/api/new",
      },
    ];

    const chunks = scopeDiffToPatch(currentDsl, patchedDsl, patch);

    expect(chunks.length).toBeGreaterThanOrEqual(2);
    const componentChunk = chunks.find((c) => c.anchorPath === "/components/2");
    expect(componentChunk).toBeDefined();
    expect(componentChunk!.ops).toHaveLength(1);

    const residualChunk = chunks.find((c) => c.anchorPath === "");
    expect(residualChunk).toBeDefined();
    expect(residualChunk!.ops).toHaveLength(0);
    expect((residualChunk!.after as any).title).toBe("Renamed Page");
  });

  it("does not add a residual chunk when currentDsl and patchedDsl otherwise match", () => {
    const currentDsl = makeLargeDsl();
    const patchedDsl = JSON.parse(JSON.stringify(currentDsl));
    patchedDsl.components[2].properties.apiUrl = "/api/new";

    const patch: Operation[] = [
      {
        op: "replace",
        path: "/components/2/properties/apiUrl",
        value: "/api/new",
      },
    ];

    const chunks = scopeDiffToPatch(currentDsl, patchedDsl, patch);
    expect(chunks).toHaveLength(1);
  });

  it("respects a custom contextDepth by anchoring at a non-id ancestor if depth is exhausted first", () => {
    const currentDsl = {
      id: "root",
      type: "root",
      wrapper: {
        // No `id` field anywhere in this branch.
        inner: {
          deeper: {
            value: "old",
          },
        },
      },
    };
    const patchedDsl = JSON.parse(JSON.stringify(currentDsl));
    patchedDsl.wrapper.inner.deeper.value = "new";

    const patch: Operation[] = [
      { op: "replace", path: "/wrapper/inner/deeper/value", value: "new" },
    ];

    // contextDepth 1: from /wrapper/inner/deeper/value, walk up at most 1
    // level -> /wrapper/inner/deeper (no id found there either, but depth
    // budget of 1 level is exhausted).
    const chunks = scopeDiffToPatch(currentDsl, patchedDsl, patch, { contextDepth: 1 });
    expect(chunks).toHaveLength(1);
    expect(chunks[0].anchorPath).toBe("/wrapper/inner/deeper");
  });

  it("produces a readable label including the node type and changed leaf key", () => {
    const currentDsl = makeLargeDsl();
    const patchedDsl = JSON.parse(JSON.stringify(currentDsl));
    patchedDsl.components[2].properties.apiUrl = "/api/new";

    const patch: Operation[] = [
      { op: "replace", path: "/components/2/properties/apiUrl", value: "/api/new" },
    ];

    const chunks = scopeDiffToPatch(currentDsl, patchedDsl, patch);
    expect(chunks[0].label).toContain("components[2]");
    expect(chunks[0].label).toContain("table");
    expect(chunks[0].label).toContain("properties.apiUrl");
  });
});

describe("scopeDiffToPatch grouping and anchoring edge cases", () => {
  const nestedDoc = (x: number, y: number) => ({
    id: "root",
    type: "page",
    a: { id: "A", type: "group", b: { id: "B", x }, c: { id: "C", y } },
  });

  it("returns [] for a missing patch", () => {
    expect(scopeDiffToPatch({}, {}, undefined as any)).toEqual([]);
  });

  it("promotes a group to a later, shallower anchor", () => {
    const patch: Operation[] = [
      { op: "replace", path: "/a/b/x", value: 2 },
      { op: "replace", path: "/a/id", value: "A" },
    ];
    const chunks = scopeDiffToPatch(nestedDoc(1, 1), nestedDoc(2, 1), patch);
    expect(chunks.map((c) => [c.anchorPath, c.ops.length])).toEqual([["/a", 2]]);
  });

  it("keeps a group anchored at its ancestor when a deeper op arrives later", () => {
    const patch: Operation[] = [
      { op: "replace", path: "/a/id", value: "A" },
      { op: "replace", path: "/a/b/x", value: 2 },
    ];
    const chunks = scopeDiffToPatch(nestedDoc(1, 1), nestedDoc(2, 1), patch);
    expect(chunks.map((c) => [c.anchorPath, c.ops.length])).toEqual([["/a", 2]]);
  });

  it("merges sibling groups that become nested once an ancestor op promotes one of them", () => {
    const patch: Operation[] = [
      { op: "replace", path: "/a/b/x", value: 2 },
      { op: "replace", path: "/a/c/y", value: 2 },
      { op: "replace", path: "/a/id", value: "A" },
    ];
    const chunks = scopeDiffToPatch(nestedDoc(1, 1), nestedDoc(2, 2), patch);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].anchorPath).toBe("/a");
    expect(chunks[0].ops).toHaveLength(3);
  });

  it("keeps edits to sibling components that share no anchor apart", () => {
    const patch: Operation[] = [
      { op: "replace", path: "/a/b/x", value: 2 },
      { op: "replace", path: "/a/c/y", value: 2 },
    ];
    const chunks = scopeDiffToPatch(nestedDoc(1, 1), nestedDoc(2, 2), patch);
    expect(chunks.map((c) => c.anchorPath)).toEqual(["/a/b", "/a/c"]);
  });
});

describe("scopeDiffToPatch labels and boundaries from either document", () => {
  it("anchors a removed object at its former location and labels it from the current document", () => {
    const current = { id: "root", header: { id: "h", type: "banner", title: "t" } };
    const patched = { id: "root" };
    const chunks = scopeDiffToPatch(current, patched, [{ op: "remove", path: "/header" }]);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({ anchorPath: "/header", after: undefined, label: "header (banner)" });
    expect((chunks[0].before as any).title).toBe("t");
  });

  it("labels the whole-document anchor as 'root' with its type and no leaf key", () => {
    const current = { id: "root", type: "page", v: 1 };
    const patched = { id: "root", type: "page", v: 2 };
    const chunks = scopeDiffToPatch(current, patched, [{ op: "add", path: "", value: patched } as Operation]);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({ anchorPath: "", label: "root (page)" });
  });

  it("walks up to the nearest id boundary and describes array indexes relative to the anchor", () => {
    const current = { id: "root", components: [{ id: "c", type: "table", columns: [{ k: 1 }] }] };
    const patched = { id: "root", components: [{ id: "c", type: "table", columns: [{ k: 2 }] }] };
    const chunks = scopeDiffToPatch(current, patched, [{ op: "replace", path: "/components/0/columns/0/k", value: 2 }]);
    expect(chunks[0].label).toBe("components[0].columns → [0].k");
  });

  it("scopes documents that are arrays, without a residual chunk", () => {
    const chunks = scopeDiffToPatch([{ id: "a", v: 1 }], [{ id: "a", v: 2 }], [{ op: "replace", path: "/0/v", value: 2 }]);
    expect(chunks.map((c) => c.anchorPath)).toEqual(["/0"]);
  });

  it("copes with a patched document that is not an object", () => {
    const chunks = scopeDiffToPatch({ id: "r", v: 1 }, null, [{ op: "replace", path: "", value: null }]);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toMatchObject({ anchorPath: "", after: null });
  });
});

describe("scopeDiffToPatch residual detection", () => {
  it("treats uncomparable (circular) top-level values as different", () => {
    const circular = () => {
      const o: any = { name: "same" };
      o.self = o;
      return o;
    };
    const current = { id: "root", components: [{ id: "c", v: 1 }], meta: circular() };
    const patched = { id: "root", components: [{ id: "c", v: 2 }], meta: circular() };
    const chunks = scopeDiffToPatch(current, patched, [{ op: "replace", path: "/components/0/v", value: 2 }]);
    expect(chunks.map((c) => c.label)).toEqual(["components[0] → v", "Other changes"]);
  });

  it("does not flag identical circular references as residual", () => {
    const meta: any = {};
    meta.self = meta;
    const current = { id: "root", components: [{ id: "c", v: 1 }], meta };
    const patched = { id: "root", components: [{ id: "c", v: 2 }], meta };
    const chunks = scopeDiffToPatch(current, patched, [{ op: "replace", path: "/components/0/v", value: 2 }]);
    expect(chunks).toHaveLength(1);
  });
});
