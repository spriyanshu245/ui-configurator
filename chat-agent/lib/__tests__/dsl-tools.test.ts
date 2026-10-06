/**
 * @jest-environment node
 *
 * get_page_dsl / query_dsl_path / find_components, read through dsl-store.
 */
jest.mock("../microsite-loader", () => ({
  fetchMicrositePages: jest.fn(),
  fetchMicrosites: jest.fn(),
  fetchPageDsl: jest.fn(),
}));

const storeMany = jest.fn().mockResolvedValue(undefined);
const getMany = jest.fn().mockResolvedValue([]);
const getDslPath = jest.fn();
jest.mock("../../db/queries/temp-dsl", () => ({
  tempDslOps: {
    storeMany: (...a: any[]) => storeMany(...a),
    getMany: (...a: any[]) => getMany(...a),
    getDslPath: (...a: any[]) => getDslPath(...a),
    refreshByPageCode: jest.fn().mockResolvedValue(undefined),
  },
}));
jest.mock("../../db/queries/user-preferences", () => ({ userPreferences: {} }));
jest.mock("../../db/queries/dsl-history", () => ({ dslHistory: {} }));
jest.mock("../../db/queries/skill-entries", () => ({ skillEntries: {} }));
jest.mock("../skill-compiler", () => ({ compileAgentSkill: jest.fn() }));

import { executeTool } from "../tool-executor";
import { __resetDslStoreForTests } from "../dsl-store";
import { fetchMicrositePages, fetchPageDsl } from "../microsite-loader";

const pagesMock = fetchMicrositePages as jest.Mock;
const dslMock = fetchPageDsl as jest.Mock;

const pageDsl = (label: string) => ({
  id: `${label}-root-id`,
  type: "page",
  components: [
    { id: `${label}-btn-0000`, type: "button-v2", properties: { label, routePage: "m_about", notes: null } },
    {
      id: `${label}-frm-0000`,
      type: "form",
      properties: { label: "Big form" },
      components: Array.from({ length: 12 }, (_, i) => ({ id: `${label}-in-${i}`, type: "input", properties: { label: `F${i}` } })),
    },
  ],
});

beforeEach(() => {
  jest.clearAllMocks();
  __resetDslStoreForTests();
  getMany.mockResolvedValue([]);
  pagesMock.mockResolvedValue({
    pages: [
      { pageCode: "m_home", pageVersion: 2 },
      { pageCode: "m_about", pageVersion: 1 },
    ],
  });
  dslMock.mockImplementation(async (code: string) => pageDsl(code === "m_home" ? "Home" : "About"));
});

describe("get_page_dsl", () => {
  it("single page: returns tempDslId + outline (not raw JSON)", async () => {
    const res: any = await executeTool("get_page_dsl", { microsite_id: "m", page_path: "m_home" });
    expect(res.tempDslId).toBe("dsl:m:m_home");
    expect(res.pageVersion).toBe(2);
    expect(res.outline).toContain('/components/0 button-v2 #Home-btn "Home"');
    expect(res.dsl).toBeUndefined();
    expect(dslMock).toHaveBeenCalledWith("m_home", 2);
  });

  it('"*" returns only the page list — no DSL fetch, no outlines', async () => {
    const res: any = await executeTool("get_page_dsl", { microsite_id: "m", page_paths: ["*"] });
    expect(dslMock).not.toHaveBeenCalled();
    expect(res.totalPages).toBe(2);
    expect(JSON.stringify(res)).not.toContain('outline":');
  });

  it("several pages: parallel load, ONE bulk store; repeat call served from memory", async () => {
    const res: any = await executeTool("get_page_dsl", { microsite_id: "m", page_paths: ["m_home", "m_about"] });
    expect(res.pages.map((p: any) => p.pageCode)).toEqual(["m_home", "m_about"]);
    expect(storeMany).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();
    await executeTool("get_page_dsl", { microsite_id: "m", page_paths: ["m_home", "m_about"] });
    expect(dslMock).not.toHaveBeenCalled();
    expect(getMany).not.toHaveBeenCalled();
  });

  it("reports missing pages without failing the others", async () => {
    const res: any = await executeTool("get_page_dsl", { microsite_id: "m", page_paths: ["m_home", "m_nope"] });
    expect(res.pages).toHaveLength(1);
    expect(res.errors).toEqual([{ pageCode: "m_nope", error: 'Page "m_nope" not found.' }]);
  });

  it("errors when no page is requested", async () => {
    const res: any = await executeTool("get_page_dsl", { microsite_id: "m" });
    expect(res.error).toMatch(/page_path/);
  });
});

describe("query_dsl_path", () => {
  it("returns compact JSON for a small node, with its pointer", async () => {
    const res: any = await executeTool("query_dsl_path", { tempDslId: "dsl:m:m_home", path: "/components/0" });
    expect(res).toMatchObject({ pointer: "/components/0", found: true });
    expect(res.data.properties).toEqual({ label: "Home", routePage: "m_about" }); // null dropped
  });

  it("looks a node up by its 8-char id prefix", async () => {
    const res: any = await executeTool("query_dsl_path", { tempDslId: "dsl:m:m_home", id: "Home-btn" });
    expect(res.pointer).toBe("/components/0");
    expect(res.data.type).toBe("button-v2");
  });

  it("returns a depth-1 view for a node with many nested components", async () => {
    const res: any = await executeTool("query_dsl_path", { tempDslId: "dsl:m:m_home", path: "/components/1" });
    expect(res.view).toBe("depth-1");
    expect(res.data.properties).toEqual({ label: "Big form" });
    expect(res.data.components).toHaveLength(12);
    expect(res.data.components[0]).toBe('/components/1/components/0 input #Home-in- "F0"');
  });

  it("full: true returns the untouched node; outline: true returns its outline", async () => {
    const full: any = await executeTool("query_dsl_path", { tempDslId: "dsl:m:m_home", path: "/components/0", full: true });
    expect(full.data.properties.notes).toBeNull();
    const outline: any = await executeTool("query_dsl_path", { tempDslId: "dsl:m:m_home", path: "/components/0", outline: true });
    expect(outline.outline).toContain('/components/0 button-v2 #Home-btn "Home"');
  });

  it("runs several queries across pages, loading each page once", async () => {
    const res: any = await executeTool("query_dsl_path", {
      queries: [
        { tempDslId: "dsl:m:m_home", path: "/components/0/type" },
        { tempDslId: "dsl:m:m_about", path: "/components/0/type" },
        { tempDslId: "dsl:m:m_home", path: "/components/9" },
      ],
    });
    expect(res.results.map((r: any) => r.found)).toEqual([true, true, false]);
    expect(dslMock).toHaveBeenCalledTimes(2);
    expect(getMany).toHaveBeenCalledTimes(1);
  });

  it("falls back to a direct Mongo lookup for legacy (uuid) ids", async () => {
    getDslPath.mockResolvedValue({ a: 1 });
    const res: any = await executeTool("query_dsl_path", { tempDslId: "ef6f86e3-legacy", path: "x" });
    expect(getDslPath).toHaveBeenCalledWith("ef6f86e3-legacy", "x");
    expect(res.data).toEqual({ a: 1 });
  });
});

describe("find_components", () => {
  it("returns matching outline lines per page", async () => {
    const res: any = await executeTool("find_components", {
      microsite_id: "m",
      page_paths: ["m_home", "m_about"],
      prop: "routePage",
      equals: "m_about",
    });
    expect(res.results.map((r: any) => [r.pageCode, r.count])).toEqual([
      ["m_home", 1],
      ["m_about", 1],
    ]);
    expect(res.results[0].matches[0]).toContain("/components/0 button-v2 #Home-btn");
  });

  it("requires specific pages", async () => {
    const res: any = await executeTool("find_components", { microsite_id: "m", page_paths: ["*"], type: "form" });
    expect(res.error).toMatch(/page_paths/);
  });
});

describe("get_page_dsl edge cases", () => {
  it("refresh: true bypasses the in-memory copy", async () => {
    await executeTool("get_page_dsl", { microsite_id: "m", page_path: "m_home" });
    dslMock.mockClear();
    await executeTool("get_page_dsl", { microsite_id: "m", page_path: "m_home", refresh: true });
    expect(dslMock).toHaveBeenCalledWith("m_home", 2);
  });

  it("returns a pages array with the error when the single requested page is missing", async () => {
    const res: any = await executeTool("get_page_dsl", { microsite_id: "m", page_path: "m_nope" });
    expect(res.pages).toEqual([]);
    expect(res.errors).toEqual([{ pageCode: "m_nope", error: 'Page "m_nope" not found.' }]);
    expect(res.note).toMatch(/Outline format/);
  });

  it("omits the errors key when every page loads", async () => {
    const res: any = await executeTool("get_page_dsl", { microsite_id: "m", page_paths: ["m_home", "m_about"] });
    expect(res.errors).toBeUndefined();
  });
});

describe("query_dsl_path edge cases", () => {
  it("reports an unknown id as not found", async () => {
    const res: any = await executeTool("query_dsl_path", { tempDslId: "dsl:m:m_home", id: "zzz" });
    expect(res).toEqual({ tempDslId: "dsl:m:m_home", id: "zzz", found: false });
  });

  it("flags an id prefix that matches several components as ambiguous", async () => {
    const res: any = await executeTool("query_dsl_path", { tempDslId: "dsl:m:m_home", id: "Home-in-" });
    // matches all twelve Home-in-N inputs
    expect(res).toMatchObject({ found: true, ambiguous: true });
    expect(res.pointers).toHaveLength(12);
    expect(res.data).toBeUndefined();
  });

  it("cannot look up by id for a legacy key that is not in the store", async () => {
    const res: any = await executeTool("query_dsl_path", { tempDslId: "legacy-uuid", id: "abc" });
    expect(res).toEqual({ tempDslId: "legacy-uuid", id: "abc", found: false });
    expect(getDslPath).not.toHaveBeenCalled();
  });

  it("returns pointer '/' for the document root", async () => {
    const res: any = await executeTool("query_dsl_path", { tempDslId: "dsl:m:m_home", path: "/", full: true });
    expect(res.pointer).toBe("/");
    expect(res.data.id).toBe("Home-root-id");
  });

  it("reports found: false for a legacy lookup that returns nothing, passing an empty path through", async () => {
    getDslPath.mockResolvedValue(undefined);
    const res: any = await executeTool("query_dsl_path", { tempDslId: "legacy-uuid" });
    expect(getDslPath).toHaveBeenCalledWith("legacy-uuid", "");
    expect(res).toEqual({ tempDslId: "legacy-uuid", pointer: "/", found: false });
  });

  it("keeps an empty node as-is when compaction would drop it entirely", async () => {
    const res: any = await executeTool("query_dsl_path", {
      tempDslId: "dsl:m:m_home",
      path: "/components/0/properties/notes",
    });
    expect(res).toMatchObject({ found: true, data: null });
  });

  it("returns {results} even for a one-element queries array", async () => {
    const res: any = await executeTool("query_dsl_path", {
      queries: [{ tempDslId: "dsl:m:m_home", path: "/components/0/type" }],
    });
    expect(res.results).toHaveLength(1);
    expect(res.results[0].data).toBe("button-v2");
  });
});

describe("find_components edge cases", () => {
  it("falls back to ctx.micrositeId and filters by label, matching numeric equals as strings", async () => {
    const res: any = await executeTool(
      "find_components",
      { page_paths: ["m_home"], labelContains: "big", type: "form" },
      { micrositeId: "m" },
    );
    expect(res.results[0]).toMatchObject({ pageCode: "m_home", count: 1 });
    expect(res.errors).toBeUndefined();

    const nested: any = await executeTool("find_components", {
      microsite_id: "m",
      page_paths: ["m_home"],
      prop: "label",
      equals: 7,
    });
    expect(nested.results[0].count).toBe(0);
  });

  it("treats equals: null like no equals filter and reports missing pages alongside results", async () => {
    const res: any = await executeTool("find_components", {
      microsite_id: "m",
      page_paths: ["m_home", "m_nope"],
      prop: "routePage",
      equals: null,
    });
    expect(res.results).toHaveLength(1);
    expect(res.results[0].count).toBe(1);
    expect(res.errors).toEqual([{ pageCode: "m_nope", error: 'Page "m_nope" not found.' }]);
  });
});
