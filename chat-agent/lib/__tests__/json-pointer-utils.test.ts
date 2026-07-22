/**
 * @jest-environment node
 */

import {
  parsePointer,
  toPointer,
  resolvePointer,
  getParentPointer,
  isPointerWithin,
  lastToken,
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

  it("returns [] for the root pointer (empty string)", () => {
    expect(parsePointer("")).toEqual([]);
  });

  it("returns [] for a bare slash", () => {
    expect(parsePointer("/")).toEqual([""]);
  });

  it("unescapes ~1 to / within a token", () => {
    expect(parsePointer("/a~1b/c")).toEqual(["a/b", "c"]);
  });

  it("unescapes ~0 to ~ within a token", () => {
    expect(parsePointer("/a~0b/c")).toEqual(["a~b", "c"]);
  });

  it("unescapes combined ~01 correctly (~0 then literal 1, not ~1)", () => {
    // Per RFC-6901, ~01 must decode to "~1" (literal tilde + one), not "/".
    expect(parsePointer("/a~01")).toEqual(["a~1"]);
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

  it("returns undefined for a missing object key", () => {
    expect(resolvePointer(doc, "/components/0/properties/missingKey")).toBeUndefined();
  });

  it("returns undefined for an out-of-range array index", () => {
    expect(resolvePointer(doc, "/components/99")).toBeUndefined();
  });

  it("returns undefined for the '-' append token", () => {
    expect(resolvePointer(doc, "/components/-")).toBeUndefined();
  });

  it("returns undefined when walking through a missing intermediate path", () => {
    expect(resolvePointer(doc, "/does/not/exist")).toBeUndefined();
  });

  it("returns undefined when the doc itself is null/undefined", () => {
    expect(resolvePointer(null, "/components/0")).toBeUndefined();
    expect(resolvePointer(undefined, "/components/0")).toBeUndefined();
  });
});

describe("getParentPointer", () => {
  it("returns the pointer to the parent for a nested path", () => {
    expect(getParentPointer("/components/2/properties/apiUrl")).toBe(
      "/components/2/properties",
    );
  });

  it("returns the pointer to a parent array for an index path", () => {
    expect(getParentPointer("/components/2")).toBe("/components");
  });

  it("returns '' for a single-segment path", () => {
    expect(getParentPointer("/components")).toBe("");
  });

  it("returns '' for the root pointer", () => {
    expect(getParentPointer("")).toBe("");
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

describe("lastToken", () => {
  it("returns the final segment of a pointer", () => {
    expect(lastToken("/components/2/properties/apiUrl")).toBe("apiUrl");
  });

  it("returns '' for the root pointer", () => {
    expect(lastToken("")).toBe("");
  });
});
