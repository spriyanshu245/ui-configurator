/**
 * @jest-environment node
 */
jest.mock("../microsite-loader", () => ({
  fetchMicrositePages: jest.fn(),
  fetchPageDsl: jest.fn(),
}));

jest.mock("../logger", () => ({ logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() } }));

import { buildPageMap } from "../page-map";
import { fetchMicrositePages, fetchPageDsl } from "../microsite-loader";

const fetchPagesMock = fetchMicrositePages as jest.MockedFunction<typeof fetchMicrositePages>;
const fetchDslMock = fetchPageDsl as jest.MockedFunction<typeof fetchPageDsl>;

describe("buildPageMap", () => {
  beforeEach(() => jest.clearAllMocks());

  it("derives nodes, edges (routePage + tab pageCode), popups, and unknown targets", async () => {
    fetchPagesMock.mockResolvedValue({
      firstPageCode: "m1_home",
      pages: [
        { pageCode: "m1_home", pageVersion: 1 },
        { pageCode: "m1_detail", pageVersion: 1 },
        { pageCode: "m1_popup", pageVersion: 1 },
      ],
    } as any);

    fetchDslMock.mockImplementation(async (pageCode: string) => {
      if (pageCode === "m1_home") {
        return {
          type: "page",
          properties: {},
          components: [
            { id: "b1", type: "button-v2", properties: { routingType: "Internal", routePage: "m1_detail" } },
            {
              id: "tabs",
              type: "tabs",
              components: [
                { id: "t1", pageCode: "m1_popup", properties: { title: "More" } },
                { id: "t2", pageCode: "m1_missing", properties: { title: "Gone" } },
              ],
            },
          ],
        } as any;
      }
      if (pageCode === "m1_popup") {
        return { type: "page", properties: { showAsPopup: true }, components: [] } as any;
      }
      return { type: "page", properties: {}, components: [] } as any;
    });

    const map = await buildPageMap("m1");

    expect(map.firstPageCode).toBe("m1_home");
    expect(map.nodes.map((n) => n.pageCode).sort()).toEqual(["m1_detail", "m1_home", "m1_popup"]);
    expect(map.nodes.find((n) => n.pageCode === "m1_home")!.isFirst).toBe(true);
    expect(map.nodes.find((n) => n.pageCode === "m1_popup")!.isPopup).toBe(true);

    // Edges: home -> detail (route), home -> popup (tab). m1_missing is unknown.
    expect(map.edges).toEqual(
      expect.arrayContaining([
        { from: "m1_home", to: "m1_detail", via: "route" },
        { from: "m1_home", to: "m1_popup", via: "tab" },
      ]),
    );
    expect(map.unknownTargets).toContain("m1_missing");
  });

  it("still lists a page as a node when its DSL fails to load", async () => {
    fetchPagesMock.mockResolvedValue({
      firstPageCode: "m1_home",
      pages: [{ pageCode: "m1_home", pageVersion: 1 }],
    } as any);
    fetchDslMock.mockRejectedValue(new Error("boom"));

    const map = await buildPageMap("m1");
    expect(map.nodes.length).toBe(1);
    expect(map.nodes[0].pageCode).toBe("m1_home");
    expect(map.edges).toEqual([]);
  });
});

describe("buildPageMap edge cases", () => {
  beforeEach(() => jest.resetAllMocks());

  const dsl = (components: any[], properties: any = {}) => ({ type: "page", properties, components });

  it("falls back to the first page when the microsite has no firstPageCode (dslJson-wrapped)", async () => {
    fetchPagesMock.mockResolvedValue({ dslJson: { pages: [{ pageCode: "a" }, { pageCode: "b" }] } } as any);
    fetchDslMock.mockResolvedValue(dsl([]) as any);

    const map = await buildPageMap("m");

    expect(map.firstPageCode).toBe("a");
    expect(map.nodes.map((n) => [n.pageCode, n.isFirst])).toEqual([["a", true], ["b", false]]);
    expect(fetchDslMock).toHaveBeenCalledWith("a", 1); // missing pageVersion defaults to 1
  });

  it("returns an empty map when the microsite has no page list", async () => {
    fetchPagesMock.mockResolvedValue({ pages: "oops" } as any);
    expect(await buildPageMap("m")).toEqual({ firstPageCode: null, nodes: [], edges: [], unknownTargets: [] });
    fetchPagesMock.mockResolvedValue(null as any);
    expect((await buildPageMap("m")).nodes).toEqual([]);
  });

  it("reads popup state from a dslJson-wrapped page DSL", async () => {
    fetchPagesMock.mockResolvedValue({ pages: [{ pageCode: "a", pageVersion: 2 }] } as any);
    fetchDslMock.mockResolvedValue({ dslJson: dsl([], { showAsPopup: true }) } as any);
    const map = await buildPageMap("m");
    expect(map.nodes[0].isPopup).toBe(true);
    expect(fetchDslMock).toHaveBeenCalledWith("a", 2);
  });

  it("ignores self references, blank refs and non-string values; dedupes repeated edges", async () => {
    fetchPagesMock.mockResolvedValue({ pages: [{ pageCode: "a" }, { pageCode: "b" }] } as any);
    fetchDslMock.mockImplementation(async (code: string) =>
      (code === "a"
        ? dsl([
            { routePage: "a" }, // self
            { routePage: "   " }, // blank
            { routePage: 5 }, // not a string
            { routePage: " b " }, // trimmed
            { routePage: "b" }, // duplicate edge
            { pageCode: "b" }, // same target via a tab -> separate edge
            { nested: [{ routePage: "ghost" }, { routePage: "ghost" }] },
          ])
        : dsl([])) as any,
    );

    const map = await buildPageMap("m");

    expect(map.edges).toEqual([
      { from: "a", to: "b", via: "route" },
      { from: "a", to: "b", via: "tab" },
    ]);
    expect(map.unknownTargets).toEqual(["ghost"]);
  });

  it("does not loop on shared or circular DSL references", async () => {
    const shared = { routePage: "b" };
    const root: any = dsl([shared, shared]);
    root.components.push(root);
    fetchPagesMock.mockResolvedValue({ pages: [{ pageCode: "a" }, { pageCode: "b" }] } as any);
    fetchDslMock.mockImplementation(async (code: string) => (code === "a" ? root : dsl([])));

    const map = await buildPageMap("m");

    expect(map.edges).toEqual([{ from: "a", to: "b", via: "route" }]);
  });

  it("only inspects the first 60 pages", async () => {
    const pages = Array.from({ length: 75 }, (_, i) => ({ pageCode: `p${i}` }));
    fetchPagesMock.mockResolvedValue({ pages } as any);
    fetchDslMock.mockResolvedValue(dsl([]) as any);
    const map = await buildPageMap("m");
    expect(map.nodes).toHaveLength(60);
    expect(fetchDslMock).toHaveBeenCalledTimes(60);
  });
});
