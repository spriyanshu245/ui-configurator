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

  it("anchors an add at a new array index to the parent array (siblings for context)", () => {
    const currentDsl = makeLargeDsl();
    const patchedDsl = JSON.parse(JSON.stringify(currentDsl));
    const newComponent = { id: "c5", type: "text", properties: { value: "New!" } };
    patchedDsl.components.push(newComponent);

    const patch: Operation[] = [
      {
        op: "add",
        path: "/components/-",
        value: newComponent,
      },
    ];

    const chunks = scopeDiffToPatch(currentDsl, patchedDsl, patch);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].anchorPath).toBe("/components");
    expect(Array.isArray(chunks[0].after)).toBe(true);
    expect((chunks[0].after as any[])).toHaveLength(6);
    // The parent array is the anchor, so original siblings are present too.
    expect((chunks[0].before as any[])).toHaveLength(5);
  });

  it("anchors an add at an explicit numeric array index to the parent array too", () => {
    const currentDsl = makeLargeDsl();
    const patchedDsl = JSON.parse(JSON.stringify(currentDsl));
    const newComponent = { id: "c5", type: "text", properties: { value: "Inserted" } };
    patchedDsl.components.splice(1, 0, newComponent);

    const patch: Operation[] = [
      {
        op: "add",
        path: "/components/1",
        value: newComponent,
      },
    ];

    const chunks = scopeDiffToPatch(currentDsl, patchedDsl, patch);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].anchorPath).toBe("/components");
  });

  it("anchors a remove at an explicit array index to the parent array", () => {
    const currentDsl = makeLargeDsl();
    const patchedDsl = JSON.parse(JSON.stringify(currentDsl));
    patchedDsl.components.splice(3, 1); // remove c3 (button)

    const patch: Operation[] = [
      {
        op: "remove",
        path: "/components/3",
      },
    ];

    const chunks = scopeDiffToPatch(currentDsl, patchedDsl, patch);

    expect(chunks).toHaveLength(1);
    expect(chunks[0].anchorPath).toBe("/components");
    expect((chunks[0].before as any[])).toHaveLength(5);
    expect((chunks[0].after as any[])).toHaveLength(4);
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
