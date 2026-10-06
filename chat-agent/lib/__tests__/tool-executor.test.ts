/**
 * @jest-environment node
 *
 * executeTool: dispatch plus the tools not covered by dsl-tools / navigate / list-microsites tests.
 */
jest.mock("../microsite-loader", () => ({
  fetchMicrositePages: jest.fn(),
  fetchMicrosites: jest.fn(),
  fetchPageDsl: jest.fn(),
}));

const prefSet = jest.fn();
const getHistorySummaries = jest.fn();
const upsert = jest.fn();
const enforceBounds = jest.fn();
const compileAgentSkill = jest.fn();
const buildPageMap = jest.fn();

jest.mock("../../db/queries/user-preferences", () => ({
  userPreferences: { set: (...a: any[]) => prefSet(...a) },
}));
jest.mock("../../db/queries/dsl-history", () => ({
  dslHistory: { getHistorySummaries: (...a: any[]) => getHistorySummaries(...a) },
}));
jest.mock("../../db/queries/temp-dsl", () => ({ tempDslOps: {} }));
jest.mock("../../db/queries/skill-entries", () => ({
  skillEntries: {
    upsert: (...a: any[]) => upsert(...a),
    enforceBounds: (...a: any[]) => enforceBounds(...a),
  },
}));
jest.mock("../skill-compiler", () => ({ compileAgentSkill: (...a: any[]) => compileAgentSkill(...a) }));
jest.mock("../page-map", () => ({ buildPageMap: (...a: any[]) => buildPageMap(...a) }));
jest.mock("../logger", () => ({ logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() } }));

import { executeTool } from "../tool-executor";
import { fetchMicrositePages } from "../microsite-loader";

const pagesMock = fetchMicrositePages as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
});

describe("dispatch", () => {
  it("throws for an unknown tool", async () => {
    await expect(executeTool("nope", {})).rejects.toThrow("Unknown tool: nope");
  });

  it("does not dispatch to inherited object keys", async () => {
    await expect(executeTool("toString", {})).rejects.toThrow("Unknown tool: toString");
  });
});

describe("get_microsite_pages", () => {
  it("unwraps dslJson and keeps only code/name/firstPageCode and page versions", async () => {
    pagesMock.mockResolvedValue({
      dslJson: { code: "c", name: "N", firstPageCode: "c_home", extra: "x", pages: [{ pageCode: "c_home", pageVersion: 3, big: {} }] },
    });
    expect(await executeTool("get_microsite_pages", { microsite_id: "c" })).toEqual({
      code: "c",
      name: "N",
      firstPageCode: "c_home",
      pages: [{ pageCode: "c_home", pageVersion: 3 }],
    });
  });

  it("handles a bare microsite object with no pages", async () => {
    pagesMock.mockResolvedValue(null);
    expect(await executeTool("get_microsite_pages", { microsite_id: "c" })).toEqual({
      code: undefined,
      name: undefined,
      firstPageCode: undefined,
      pages: [],
    });
  });
});

describe("navigate_to_page reason", () => {
  it("defaults the reason to null", async () => {
    pagesMock.mockResolvedValue({ pages: [{ pageCode: "p" }] });
    const res: any = await executeTool("navigate_to_page", { microsite_id: "m", page_path: "p" });
    expect(res).toMatchObject({ navigate: true, pageCode: "p", reason: null });
  });
});

describe("navigate_to_page failure", () => {
  it("returns an error when the lookup throws", async () => {
    pagesMock.mockRejectedValue(new Error("boom"));
    const res: any = await executeTool("navigate_to_page", { microsite_id: "m", page_path: "p" });
    expect(res.error).toBe("Could not navigate: boom");
  });
});

describe("get_page_dsl '*' listing", () => {
  it("lists pages from a dslJson-wrapped response", async () => {
    pagesMock.mockResolvedValue({ dslJson: { pages: [{ pageCode: "a", pageVersion: 1 }] } });
    const res: any = await executeTool("get_page_dsl", { microsite_id: "m", page_paths: ["*"] });
    expect(res.totalPages).toBe(1);
    expect(res.pages).toEqual([{ pageCode: "a", pageVersion: 1 }]);
  });

  it("handles a response with no pages", async () => {
    pagesMock.mockResolvedValue(undefined);
    const res: any = await executeTool("get_page_dsl", { microsite_id: "m", page_paths: ["*"] });
    expect(res.totalPages).toBe(0);
  });
});

describe("find_components context", () => {
  it("errors when neither args nor ctx supply a microsite", async () => {
    const res: any = await executeTool("find_components", { page_paths: ["p"] });
    expect(res.error).toMatch(/microsite_id/);
  });
});

describe("get_dsl_history", () => {
  it("replaces patch bodies with an op count", async () => {
    getHistorySummaries.mockResolvedValue([
      { id: "h1", description: "d", patchApplied: [{}, {}] },
      { id: "h2", description: "e", patchApplied: undefined },
    ]);
    const res = await executeTool("get_dsl_history", { microsite_id: "m", page_path: "p", limit: 2 });
    expect(getHistorySummaries).toHaveBeenCalledWith("m", "p", 2);
    expect(res).toEqual([
      { id: "h1", description: "d", patchOpCount: 2 },
      { id: "h2", description: "e", patchOpCount: 0 },
    ]);
  });

  it("returns an empty list when there is no history", async () => {
    getHistorySummaries.mockResolvedValue(null);
    expect(await executeTool("get_dsl_history", { microsite_id: "m", page_path: "p" })).toEqual([]);
  });
});

describe("log_user_preference", () => {
  it("stores under the ctx user and microsite", async () => {
    const res = await executeTool("log_user_preference", { key: "k", value: "v" }, { userId: "u", micrositeId: "m" });
    expect(prefSet).toHaveBeenCalledWith("u", "m", "k", "v");
    expect(res).toEqual({ success: true });
  });

  it("falls back to anonymous / global scope", async () => {
    await executeTool("log_user_preference", { key: "k", value: "v" });
    expect(prefSet).toHaveBeenCalledWith("anonymous", "__global__", "k", "v");
  });
});

describe("show_page_map", () => {
  it("builds the map for the arg microsite, else the ctx microsite", async () => {
    buildPageMap.mockResolvedValue({ nodes: [] });
    expect(await executeTool("show_page_map", { microsite_id: "a" })).toEqual({ pageMap: { nodes: [] } });
    expect(buildPageMap).toHaveBeenLastCalledWith("a");
    await executeTool("show_page_map", {}, { micrositeId: "ctx" });
    expect(buildPageMap).toHaveBeenLastCalledWith("ctx");
  });

  it("errors without a microsite id", async () => {
    const res: any = await executeTool("show_page_map", {});
    expect(res.error).toMatch(/No microsite id/);
    expect(buildPageMap).not.toHaveBeenCalled();
  });

  it("converts builder failures into an error result", async () => {
    buildPageMap.mockRejectedValue(new Error("bad"));
    const res: any = await executeTool("show_page_map", { microsite_id: "a" });
    expect(res.error).toBe("Could not build the page map: bad");
  });
});

describe("suggest_next_actions", () => {
  it("keeps valid suggestions, caps at 4 and truncates labels to 60 chars", async () => {
    const suggestions = [
      { label: "x".repeat(80), value: "v0" },
      { label: 1, value: "bad" },
      null,
      { label: "b", value: "v1" },
      { label: "c", value: "v2" },
      { label: "d", value: "v3" },
      { label: "e", value: "v4" },
    ];
    const res: any = await executeTool("suggest_next_actions", { suggestions });
    expect(res.suggestions.map((s: any) => s.id)).toEqual(["sg-0", "sg-1", "sg-2", "sg-3"]);
    expect(res.suggestions[0].label).toHaveLength(60);
    expect(res.suggestions[1].value).toBe("v1");
  });

  it("returns an empty list for missing args", async () => {
    expect(await executeTool("suggest_next_actions", undefined)).toEqual({ suggestions: [] });
  });
});

describe("record_skill", () => {
  it.each([[{ title: "t" }], [{ content: "c" }]])("rejects incomplete input %j", async (args) => {
    const res: any = await executeTool("record_skill", args);
    expect(res.error).toMatch(/requires a title and content/);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("upserts, recompiles and enforces bounds, defaulting the category", async () => {
    const res: any = await executeTool("record_skill", { title: "T", content: "C" });
    expect(upsert).toHaveBeenCalledWith({
      category: "component_pattern",
      title: "T",
      content: "C",
      confidence: 0.8,
      source: "agent_reflection",
    });
    expect(compileAgentSkill).toHaveBeenCalled();
    expect(enforceBounds).toHaveBeenCalled();
    expect(res).toEqual({ success: true, message: 'Recorded skill: "T".' });
  });

  it("uses the provided category", async () => {
    await executeTool("record_skill", { category: "custom", title: "T", content: "C" });
    expect(upsert.mock.calls[0][0].category).toBe("custom");
  });

  it("reports failures without throwing", async () => {
    upsert.mockRejectedValue(new Error("db down"));
    const res: any = await executeTool("record_skill", { title: "T", content: "C" });
    expect(res.error).toBe("Failed to record skill: db down");
    expect(enforceBounds).not.toHaveBeenCalled();
  });
});

describe("propose_rollback", () => {
  const summaries = [
    { id: "h1", micrositeId: "m", pagePath: "p", description: "latest", createdAt: "t1" },
    { id: "h2", micrositeId: "m", pagePath: "p", description: "older", createdAt: "t2" },
  ];

  it("queues a rollback to the requested step", async () => {
    getHistorySummaries.mockResolvedValue(summaries);
    const res: any = await executeTool("propose_rollback", { microsite_id: "m", page_path: "p", steps_back: 2, reason: "oops" });
    expect(getHistorySummaries).toHaveBeenCalledWith("m", "p", 3);
    expect(res.queued).toBe(true);
    expect(res.rollback).toEqual({
      historyId: "h2",
      micrositeId: "m",
      pagePath: "p",
      description: "older",
      createdAt: "t2",
      reason: "oops",
    });
    expect(res.message).toMatch(/does NOT auto-apply/);
  });

  it("defaults to one step back for invalid steps_back", async () => {
    getHistorySummaries.mockResolvedValue(summaries);
    const res: any = await executeTool("propose_rollback", { microsite_id: "m", page_path: "p", steps_back: "abc" });
    expect(res.rollback.historyId).toBe("h1");
  });

  it("reports when there is no history", async () => {
    getHistorySummaries.mockResolvedValue([]);
    const res: any = await executeTool("propose_rollback", { microsite_id: "m", page_path: "p" });
    expect(res).toMatchObject({ queued: false });
    expect(res.message).toMatch(/No snapshot history/);
  });

  it("reports when fewer snapshots exist than requested (clamped to 3)", async () => {
    getHistorySummaries.mockResolvedValue(summaries);
    const res: any = await executeTool("propose_rollback", { microsite_id: "m", page_path: "p", steps_back: 99 });
    expect(res.queued).toBe(false);
    expect(res.message).toMatch(/Only 2 snapshot\(s\).*back 3 step/);
  });
});
