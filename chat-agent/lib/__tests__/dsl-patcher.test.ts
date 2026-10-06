/**
 * @jest-environment node
 *
 * dsl-patcher: id assignment / validation, patch application, the DSL cache and queuePatch.
 * (queueBatch and error-message trimming live in dsl-patcher-batch / patch-error-message tests.)
 */
jest.mock("../microsite-loader", () => ({ fetchMicrositePages: jest.fn(), fetchPageDsl: jest.fn() }));

// A registry with required props so those branches are reachable (the real one has none).
jest.mock("fast-json-patch", () => {
  const actual = jest.requireActual("fast-json-patch");
  return { ...actual, applyPatch: jest.fn(actual.applyPatch) };
});
jest.mock("fs", () => {
  const actual = jest.requireActual("fs");
  return {
    ...actual,
    readFileSync: (p: any, ...rest: any[]) => {
      if (String(p).includes("component-registry")) {
        if ((globalThis as any).__registryMode === "throw") throw new Error("no registry");
        return JSON.stringify({
          widget: { props: { title: { required: true }, optional: { required: false } } },
          Input: { props: {} },
          Select: {},
          form: { props: {} },
        });
      }
      return actual.readFileSync(p, ...rest);
    },
  };
});

import * as jsonpatch from "fast-json-patch";
import {
  applyPatch,
  getCachedDsl,
  onDslCacheUpdate,
  primeDslCache,
  queueBatch,
  queuePatch,
  updateDslCache,
  validateAndAssignIds,
} from "../dsl-patcher";
import { fetchMicrositePages, fetchPageDsl } from "../microsite-loader";

const pagesMock = fetchMicrositePages as jest.Mock;
const dslMock = fetchPageDsl as jest.Mock;

const dslWith = (...components: any[]) => ({ id: "root", type: "root", components });
const validIdRegex = /^[0-9a-f-]{36}$/;

beforeEach(() => {
  pagesMock.mockReset();
  dslMock.mockReset();
});

describe("validateAndAssignIds", () => {
  it.each([[null], [undefined], [{}], [{ components: "x" }]])("ignores a non-DSL value %j", (dsl) => {
    expect(() => validateAndAssignIds(dsl)).not.toThrow();
  });

  it("assigns uuids to nodes with missing or empty ids and keeps existing ones", () => {
    const dsl = dslWith({ type: "spacer" }, { id: "", type: "spacer" }, { id: "keep", type: "spacer" });
    validateAndAssignIds(dsl);
    expect(dsl.components[0].id).toMatch(validIdRegex);
    expect(dsl.components[1].id).toMatch(validIdRegex);
    expect(dsl.components[2].id).toBe("keep");
  });

  it("rejects unregistered component types", () => {
    expect(() => validateAndAssignIds(dslWith({ id: "a", type: "totally-unknown" }))).toThrow(
      'Component type "totally-unknown" is not registered.',
    );
  });

  it("accepts nested registered types and visits nested children, arrays and null entries", () => {
    const nested = dslWith({ id: "a", type: "spacer", components: [null, { id: "b", type: "spacer" }, { id: "c", type: "unknown-deep" }] });
    expect(() => validateAndAssignIds(nested)).toThrow(/unknown-deep/);
    const arrays = dslWith([{ id: "x", type: "spacer" }, { id: "y", type: "unknown-in-array" }]);
    expect(() => validateAndAssignIds(arrays)).toThrow(/unknown-in-array/);
    expect(() => validateAndAssignIds(dslWith({ notAComponent: true }))).not.toThrow();
  });

  it("enforces required registry props, including when properties are absent", () => {
    expect(() => validateAndAssignIds(dslWith({ id: "w", type: "widget", properties: { title: "t" } }))).not.toThrow();
    expect(() => validateAndAssignIds(dslWith({ id: "w", type: "widget", properties: {} }))).toThrow(
      'Component "widget" is missing required property: title',
    );
    expect(() => validateAndAssignIds(dslWith({ id: "w", type: "widget" }))).toThrow(/missing required property: title/);
  });

  describe("form field linkage", () => {
    const form = (nameKeyIds: any, ...children: any[]) => ({
      id: "f",
      type: "form",
      properties: { nameKeyIds },
      components: children,
    });

    it("accepts inputs whose name matches an array nameKeyIds entry", () => {
      const dsl = dslWith(form(["first", "second"], { id: "i", type: "Input", properties: { name: "second" } }));
      expect(() => validateAndAssignIds(dsl)).not.toThrow();
    });

    it("accepts a scalar nameKeyIds (coerced to string)", () => {
      const dsl = dslWith(form(42, { id: "i", type: "Select", properties: { name: "42" } }));
      expect(() => validateAndAssignIds(dsl)).not.toThrow();
    });

    it("rejects an input that is not linked, naming the expected ids", () => {
      const dsl = dslWith(form(["a", "b"], { id: "i", type: "Input", properties: { name: "zzz" } }));
      expect(() => validateAndAssignIds(dsl)).toThrow(
        'Input component "zzz" must reference the Form\'s nameKeyId (Expected one of: a, b)',
      );
    });

    it("falls back to the type name in the error when the input has no name", () => {
      const dsl = dslWith(form(["a"], { id: "i", type: "Input" }));
      expect(() => validateAndAssignIds(dsl)).toThrow('Input component "Input" must');
    });

    it("applies inherited ids to deeper descendants", () => {
      const inner = { id: "g", type: "spacer", components: [{ id: "i", type: "Input", properties: { name: "bad" } }] };
      expect(() => validateAndAssignIds(dslWith(form(["ok"], inner)))).toThrow(/Expected one of: ok/);
    });

    it("does not constrain inputs outside any form, or in a form without nameKeyIds", () => {
      expect(() => validateAndAssignIds(dslWith({ id: "i", type: "Input", properties: { name: "any" } }))).not.toThrow();
      const bareForm = { id: "f", type: "form", properties: {}, components: [{ id: "i", type: "Input" }] };
      expect(() => validateAndAssignIds(dslWith(bareForm))).not.toThrow();
    });
  });
});

describe("applyPatch", () => {
  it("returns a patched deep copy and leaves the input untouched", () => {
    const doc = { a: { b: 1 } };
    const out: any = applyPatch(doc, [{ op: "replace", path: "/a/b", value: 2 }]);
    expect(out.a.b).toBe(2);
    expect(doc.a.b).toBe(1);
  });

  it("rejects malformed patches as 'Invalid patch format'", () => {
    expect(() => applyPatch({ a: 1 }, [{ op: "replace", path: "/missing/x", value: 1 }])).toThrow(/^Invalid patch format:/);
  });

  it("wraps failures while applying (non-cloneable document) as 'Error applying patch'", () => {
    const doc = { a: 1, fn: () => 1 };
    expect(() => applyPatch(doc, [{ op: "replace", path: "/a", value: 2 }])).toThrow(/^Error applying patch: /);
  });

  it("reports an unknown error when a non-Error is thrown while applying", () => {
    (jsonpatch.applyPatch as jest.Mock).mockImplementationOnce(() => {
      throw "weird"; // eslint-disable-line no-throw-literal
    });
    expect(() => applyPatch({ a: 1 }, [{ op: "replace", path: "/a", value: 2 }])).toThrow("Error applying patch: Unknown patch error");
  });
});

describe("DSL cache", () => {
  it("returns undefined for an unknown page", () => {
    expect(getCachedDsl("/cache/unknown")).toBeUndefined();
  });

  it("updateDslCache stores the dsl, defaulting pageVersion to 1 until one is given", () => {
    updateDslCache("/cache/a", { v: 1 });
    expect(getCachedDsl("/cache/a")).toEqual({ dsl: { v: 1 }, pageVersion: 1 });
    updateDslCache("/cache/a", { v: 2 }, 7);
    expect(getCachedDsl("/cache/a")).toEqual({ dsl: { v: 2 }, pageVersion: 7 });
    updateDslCache("/cache/a", { v: 3 });
    expect(getCachedDsl("/cache/a")).toEqual({ dsl: { v: 3 }, pageVersion: 7 });
  });

  it("notifies listeners on update, survives a throwing listener, and supports unsubscribe", () => {
    const good = jest.fn();
    const bad = jest.fn(() => {
      throw new Error("listener failure");
    });
    const offBad = onDslCacheUpdate(bad);
    const offGood = onDslCacheUpdate(good);

    updateDslCache("/cache/b", { v: 1 }, 3);
    expect(bad).toHaveBeenCalledWith("/cache/b", { v: 1 }, 3);
    expect(good).toHaveBeenCalledWith("/cache/b", { v: 1 }, 3);

    offBad();
    offGood();
    updateDslCache("/cache/b", { v: 2 });
    expect(good).toHaveBeenCalledTimes(1);
    expect(bad).toHaveBeenCalledTimes(1);
  });

  it("primeDslCache seeds dsl and version without notifying listeners", () => {
    const listener = jest.fn();
    const off = onDslCacheUpdate(listener);
    primeDslCache("/cache/c", { seeded: true }, 5);
    off();
    expect(listener).not.toHaveBeenCalled();
    expect(getCachedDsl("/cache/c")).toEqual({ dsl: { seeded: true }, pageVersion: 5 });
  });
});

describe("queuePatch", () => {
  const baseArgs = (page: string, patch: any[]) => ({
    microsite_id: "m1",
    page_path: page,
    patch,
    description: "desc",
    preview_hint: "hint",
    affected_components: ["a"],
  });
  const replaceValue = (value: string) => [{ op: "replace", path: "/components/0/properties/value", value }];
  const page = () => dslWith({ id: "a", type: "root", properties: { value: "old" } });

  it("fetches the real page version on a cache miss, then caches it", async () => {
    pagesMock.mockResolvedValue({ pages: [{ pageCode: "/qp/miss", pageVersion: 4 }] });
    dslMock.mockResolvedValue(page());

    const res: any = await queuePatch(baseArgs("/qp/miss", replaceValue("new")), "sess");

    expect(dslMock).toHaveBeenCalledWith("/qp/miss", 4);
    expect(res).toMatchObject({
      micrositeId: "m1",
      pagePath: "/qp/miss",
      pageVersion: 4,
      description: "desc",
      previewHint: "hint",
      affectedComponents: ["a"],
      sessionId: "sess",
    });
    expect(res.id).toMatch(validIdRegex);
    expect(res.patchedDsl.components[0].properties.value).toBe("new");
    expect(res.currentDsl.components[0].properties.value).toBe("old");
    expect(res.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(getCachedDsl("/qp/miss")).toEqual({ dsl: res.currentDsl, pageVersion: 4 });
  });

  it("defaults the version to 1 when the page list has none, and serves repeats from cache", async () => {
    pagesMock.mockResolvedValue({ pages: [{ pageCode: "/qp/nov" }] });
    dslMock.mockResolvedValue(page());
    await queuePatch(baseArgs("/qp/nov", replaceValue("x")), "s");
    expect(dslMock).toHaveBeenCalledWith("/qp/nov", 1);

    dslMock.mockClear();
    const again: any = await queuePatch(baseArgs("/qp/nov", replaceValue("y")), "s");
    expect(dslMock).not.toHaveBeenCalled();
    expect(again.pageVersion).toBe(1);
  });

  it("uses a cached dsl and its recorded version without any fetch", async () => {
    updateDslCache("/qp/cached", page(), 9);
    const res: any = await queuePatch(baseArgs("/qp/cached", replaceValue("z")), "s");
    expect(pagesMock).not.toHaveBeenCalled();
    expect(res.pageVersion).toBe(9);
  });

  it("returns the page-not-found message as is", async () => {
    pagesMock.mockResolvedValue({ pages: [] });
    const res: any = await queuePatch(baseArgs("/qp/none", replaceValue("z")), "s");
    expect(res.error).toBe('Page "/qp/none" not found in microsite "m1"');
  });

  it("prefixes other fetch failures", async () => {
    pagesMock.mockRejectedValue(new Error("network down"));
    const res: any = await queuePatch(baseArgs("/qp/err", replaceValue("z")), "s");
    expect(res.error).toBe("Failed to fetch current DSL: network down");
  });

  it("returns patch application errors", async () => {
    updateDslCache("/qp/badpatch", page());
    const res: any = await queuePatch(baseArgs("/qp/badpatch", [{ op: "replace", path: "/nope/x", value: 1 }]), "s");
    expect(res.error).toMatch(/^Invalid patch format/);
  });

  it("returns validation errors for patched DSLs with unregistered components", async () => {
    updateDslCache("/qp/invalid", page());
    const patch = [{ op: "add", path: "/components/-", value: { id: "n", type: "not-a-component" } }];
    const res: any = await queuePatch(baseArgs("/qp/invalid", patch), "s");
    expect(res.error).toBe('Validation failed: Component type "not-a-component" is not registered.');
  });
});

describe("queueBatch failure details", () => {
  it("prefixes non-page fetch failures with the page path", async () => {
    pagesMock.mockRejectedValue(new Error("timeout"));
    const res: any = await queueBatch(
      { microsite_id: "m1", operations: [{ page_path: "/qb/err", patch: [], description: "d" }] },
      "s",
    );
    expect(res.error).toBe('Validation failed on page "/qb/err": Failed to fetch current DSL: timeout');
  });

  it("reports component validation failures per page and defaults navigateTo to null", async () => {
    updateDslCache("/qb/invalid", dslWith({ id: "a", type: "root" }));
    const bad = [{ op: "add", path: "/components/-", value: { id: "n", type: "not-a-component" } }];
    const res: any = await queueBatch(
      { microsite_id: "m1", operations: [{ page_path: "/qb/invalid", patch: bad, description: "d" }] },
      "s",
    );
    expect(res.error).toMatch(/^Validation failed on page "\/qb\/invalid": Component type "not-a-component"/);

    updateDslCache("/qb/valid", dslWith({ id: "a", type: "root", properties: { value: 1 } }));
    const ok: any = await queueBatch(
      {
        microsite_id: "m1",
        operations: [{ page_path: "/qb/valid", patch: [{ op: "replace", path: "/components/0/properties/value", value: 2 }], description: "d" }],
      },
      "s",
    );
    expect(ok.navigateTo).toBeNull();
    expect(ok.operations[0].pageVersion).toBe(1);
  });

  it("rejects a non-array operations argument", async () => {
    const res: any = await queueBatch({ microsite_id: "m1", operations: undefined }, "s");
    expect(res.error).toBe("Batch must include at least one operation.");
  });
});

describe("registry loading", () => {
  it("warns and still validates against availableComponents when the registry cannot be read", () => {
    (globalThis as any).__registryMode = "throw";
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    try {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const fresh = require("../dsl-patcher");
        expect(warn).toHaveBeenCalledWith("Could not load component-registry.json", expect.any(Error));
        expect(() => fresh.validateAndAssignIds(dslWith({ id: "w", type: "widget" }))).toThrow(/not registered/);
        expect(() => fresh.validateAndAssignIds(dslWith({ id: "f", type: "form", properties: {} }))).not.toThrow();
      });
    } finally {
      (globalThis as any).__registryMode = "ok";
      warn.mockRestore();
    }
  });
});
