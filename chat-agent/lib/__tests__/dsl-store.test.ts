/**
 * @jest-environment node
 *
 * Read-through DSL store: L1 memory → L2 Mongo (one $in query) → L3 backend
 * (parallel, one bulk store), plus write-through on authoritative saves.
 */
jest.mock("../microsite-loader", () => ({
  fetchMicrositePages: jest.fn(),
  fetchPageDsl: jest.fn(),
}));

const getMany = jest.fn();
const storeMany = jest.fn().mockResolvedValue(undefined);
const refreshByPageCode = jest.fn().mockResolvedValue(undefined);
jest.mock("../../db/queries/temp-dsl", () => ({
  tempDslOps: {
    getMany: (...a: any[]) => getMany(...a),
    storeMany: (...a: any[]) => storeMany(...a),
    refreshByPageCode: (...a: any[]) => refreshByPageCode(...a),
  },
}));

import { loadPages, tempDslKey, parseTempDslKey, getNodeIndex, __resetDslStoreForTests } from "../dsl-store";
import { updateDslCache } from "../dsl-patcher";
import { fetchMicrositePages, fetchPageDsl } from "../microsite-loader";

const pagesMock = fetchMicrositePages as jest.Mock;
const dslMock = fetchPageDsl as jest.Mock;

const page = (code: string) => ({ id: `${code}-root`, type: "page", components: [] });

beforeEach(() => {
  jest.clearAllMocks();
  __resetDslStoreForTests();
  getMany.mockResolvedValue([]);
  pagesMock.mockResolvedValue({
    pages: [
      { pageCode: "s_a", pageVersion: 3 },
      { pageCode: "s_b", pageVersion: 1 },
    ],
  });
  dslMock.mockImplementation(async (code: string) => page(code));
});

describe("tempDslKey / parseTempDslKey", () => {
  it("round-trips and rejects legacy keys", () => {
    expect(parseTempDslKey(tempDslKey("m", "m_home"))).toEqual({ micrositeId: "m", pageCode: "m_home" });
    expect(parseTempDslKey("ef6f86e3-db9f")).toBeUndefined();
  });
});

describe("loadPages", () => {
  it("backend miss: one microsite fetch, pages fetched in parallel, ONE bulk store", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    dslMock.mockImplementation(async (code: string) => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight--;
      return page(code);
    });
    const res = await loadPages("m", ["s_a", "s_b"]);
    expect(res.pages.map((p) => [p.pageCode, p.pageVersion, p.source])).toEqual([
      ["s_a", 3, "backend"],
      ["s_b", 1, "backend"],
    ]);
    expect(getMany).toHaveBeenCalledTimes(1);
    expect(getMany).toHaveBeenCalledWith(["dsl:m:s_a", "dsl:m:s_b"]);
    expect(pagesMock).toHaveBeenCalledTimes(1);
    expect(maxInFlight).toBe(2);
    expect(storeMany).toHaveBeenCalledTimes(1);
    expect(storeMany.mock.calls[0][0]).toHaveLength(2);
  });

  it("L1 hit: a second load costs no Mongo or backend call", async () => {
    await loadPages("m", ["s_a"]);
    jest.clearAllMocks();
    const res = await loadPages("m", ["s_a"]);
    expect(res.pages[0].source).toBe("memory");
    expect(getMany).not.toHaveBeenCalled();
    expect(dslMock).not.toHaveBeenCalled();
  });

  it("L2 hit: fresh Mongo copy is used without touching the backend", async () => {
    getMany.mockResolvedValue([
      { toolCallId: "dsl:m:s_b", dsl: page("from-mongo"), pageVersion: 1, createdAt: new Date() },
    ]);
    const res = await loadPages("m", ["s_b"]);
    expect(res.pages[0].source).toBe("mongo");
    expect(res.pages[0].dsl.id).toBe("from-mongo-root");
    expect(dslMock).not.toHaveBeenCalled();
    expect(pagesMock).not.toHaveBeenCalled();
  });

  it("stale Mongo copy (older than FRESH_MS) is re-fetched from the backend", async () => {
    getMany.mockResolvedValue([
      { toolCallId: "dsl:m:s_b", dsl: page("old"), pageVersion: 1, createdAt: new Date(Date.now() - 60 * 60 * 1000) },
    ]);
    const res = await loadPages("m", ["s_b"]);
    expect(res.pages[0].source).toBe("backend");
    expect(dslMock).toHaveBeenCalledWith("s_b", 1);
  });

  it("refresh: true skips memory and Mongo", async () => {
    await loadPages("m", ["s_a"]);
    jest.clearAllMocks();
    const res = await loadPages("m", ["s_a"], { refresh: true });
    expect(res.pages[0].source).toBe("backend");
    expect(getMany).not.toHaveBeenCalled();
  });

  it("reports pages that don't exist without failing the rest", async () => {
    const res = await loadPages("m", ["s_a", "s_missing"]);
    expect(res.pages.map((p) => p.pageCode)).toEqual(["s_a"]);
    expect(res.errors).toEqual([{ pageCode: "s_missing", error: 'Page "s_missing" not found.' }]);
  });
});

describe("write-through", () => {
  it("an authoritative save refreshes Mongo and is served from memory", async () => {
    const saved = page("saved");
    updateDslCache("s_a", saved, 4);
    expect(refreshByPageCode).toHaveBeenCalledWith("s_a", saved, 4);

    const res = await loadPages("m", ["s_a"]);
    expect(res.pages[0]).toMatchObject({ source: "memory", pageVersion: 4 });
    expect(res.pages[0].dsl).toBe(saved);
  });
});

describe("getNodeIndex", () => {
  it("builds once per DSL object", () => {
    const dsl = { id: "r", type: "page", components: [{ id: "c1", type: "spacer" }] };
    const a = getNodeIndex(dsl);
    expect(getNodeIndex(dsl)).toBe(a);
    expect(a.byId.get("c1")).toBe("/components/0");
  });
});
