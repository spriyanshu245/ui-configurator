/**
 * @jest-environment node
 */

import {
  parsePointer,
  toPointer,
  resolvePointer,
  getParentPointer,
  isPointerWithin,
} from "../json-pointer-utils";

describe("parsePointer", () => {
  it("parses a multi-segment pointer into tokens", () => {
    expect(parsePointer("/components/2/properties/apiUrl")).toEqual([
      "components",
      "2",
      "properties",
      "apiUrl",
    ]);
  });

  it.each([
    ["the root pointer (empty string)", "", []],
    ["a bare slash (one empty token)", "/", [""]],
    ["~1 escaped slash", "/a~1b/c", ["a/b", "c"]],
    ["~0 escaped tilde", "/a~0b/c", ["a~b", "c"]],
    ["~01 (decodes to ~1 per RFC-6901, not /)", "/a~01", ["a~1"]],
    ["a pointer without a leading slash", "components/2", ["components", "2"]],
  ])("parses %s", (_name, pointer, tokens) => {
    expect(parsePointer(pointer)).toEqual(tokens);
  });

  it("handles single-token pointers", () => {
    expect(parsePointer("/components")).toEqual(["components"]);
  });
});

describe("toPointer", () => {
  it("serializes tokens back into a pointer string", () => {
    expect(toPointer(["components", "2", "properties", "apiUrl"])).toBe(
      "/components/2/properties/apiUrl",
    );
  });

  it("returns '' for an empty token list", () => {
    expect(toPointer([])).toBe("");
  });

  it("escapes ~ and / when serializing", () => {
    expect(toPointer(["a/b", "c~d"])).toBe("/a~1b/c~0d");
  });

  it("round-trips through parsePointer", () => {
    const original = "/components/2/properties/apiUrl";
    expect(toPointer(parsePointer(original))).toBe(original);
  });
});

describe("resolvePointer", () => {
  const doc = {
    id: "root",
    type: "root",
    components: [
      { id: "a", type: "heading", properties: { text: "Hello" } },
      {
        id: "b",
        type: "table",
        properties: { apiUrl: "/api/old" },
        components: [{ id: "c", type: "column", properties: { name: "col1" } }],
      },
    ],
  };

  it("resolves a nested object path", () => {
    expect(resolvePointer(doc, "/components/1/properties/apiUrl")).toBe(
      "/api/old",
    );
  });

  it("resolves an array element", () => {
    expect(resolvePointer(doc, "/components/0")).toEqual({
      id: "a",
      type: "heading",
      properties: { text: "Hello" },
    });
  });

  it("resolves nested components arrays", () => {
    expect(resolvePointer(doc, "/components/1/components/0/properties/name")).toBe(
      "col1",
    );
  });

  it("resolves the whole document for the root pointer", () => {
    expect(resolvePointer(doc, "")).toBe(doc);
  });

  it.each([
    ["a missing object key", "/components/0/properties/missingKey"],
    ["an out-of-range array index", "/components/99"],
    ["the '-' append token", "/components/-"],
    ["a missing intermediate path", "/does/not/exist"],
  ])("returns undefined for %s", (_name, pointer) => {
    expect(resolvePointer(doc, pointer)).toBeUndefined();
  });

  it("returns undefined when the doc itself is null/undefined", () => {
    expect(resolvePointer(null, "/components/0")).toBeUndefined();
    expect(resolvePointer(undefined, "/components/0")).toBeUndefined();
  });
});

describe("getParentPointer", () => {
  it.each([
    ["a nested path", "/components/2/properties/apiUrl", "/components/2/properties"],
    ["an index path (parent array)", "/components/2", "/components"],
    ["a single-segment path", "/components", ""],
    ["the root pointer", "", ""],
  ])("handles %s", (_name, pointer, parent) => {
    expect(getParentPointer(pointer)).toBe(parent);
  });
});

describe("isPointerWithin", () => {
  it("is true when path equals ancestorPath", () => {
    expect(isPointerWithin("/components/2", "/components/2")).toBe(true);
  });

  it("is true when path is nested under ancestorPath", () => {
    expect(
      isPointerWithin("/components/2/properties/apiUrl", "/components/2"),
    ).toBe(true);
  });

  it("is false when path is an ancestor of ancestorPath (reversed)", () => {
    expect(
      isPointerWithin("/components/2", "/components/2/properties/apiUrl"),
    ).toBe(false);
  });

  it("is false for unrelated paths", () => {
    expect(isPointerWithin("/components/3", "/components/2")).toBe(false);
  });

  it("treats every path as within the root pointer", () => {
    expect(isPointerWithin("/components/2/properties/apiUrl", "")).toBe(true);
  });
});

describe("resolvePointer through primitives", () => {
  it("resolvePointer stops at a primitive in the middle of the path", () => {
    expect(resolvePointer({ a: "text" }, "/a/b")).toBeUndefined();
    expect(resolvePointer({ a: 5 }, "/a/b/c")).toBeUndefined();
  });
});
