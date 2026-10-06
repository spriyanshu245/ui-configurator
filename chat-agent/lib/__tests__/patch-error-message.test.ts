/**
 * @jest-environment node
 *
 * fast-json-patch errors embed the whole document ("tree: ..."). That text is
 * returned to the model as a tool result, so it must be trimmed.
 */
jest.mock("../microsite-loader", () => ({ fetchMicrositePages: jest.fn(), fetchPageDsl: jest.fn() }));

import { applyPatch, conciseJsonPatchError } from "../dsl-patcher";

const bigDoc = {
  id: "root",
  components: Array.from({ length: 2000 }, (_, i) => ({ id: `c${i}`, type: "spacer", properties: { height: i } })),
};

describe("conciseJsonPatchError", () => {
  it("drops the tree dump but keeps reason, index and operation", () => {
    const msg = 'Cannot perform the operation at a path that does not exist\nname: OPERATION_PATH_UNRESOLVABLE\nindex: 0\noperation: {"op":"replace","path":"/x/y"}\ntree: {"huge":"document"}';
    const out = conciseJsonPatchError(msg);
    expect(out).toContain("OPERATION_PATH_UNRESOLVABLE");
    expect(out).toContain('"path":"/x/y"');
    expect(out).not.toContain("tree:");
  });

  it("trims very long lines", () => {
    const out = conciseJsonPatchError(`operation: ${"x".repeat(5000)}`);
    expect(out.length).toBeLessThan(600);
  });
});

describe("applyPatch error messages", () => {
  it("stay small even for a large document", () => {
    let message = "";
    try {
      applyPatch(bigDoc, [{ op: "replace", path: "/missing/path", value: 1 } as any]);
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toMatch(/Invalid patch format|Error applying patch/);
    expect(message.length).toBeLessThan(2000);
    expect(JSON.stringify(bigDoc).length).toBeGreaterThan(50000);
  });
});
