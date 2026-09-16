/**
 * @jest-environment node
 */
jest.mock("../microsite-loader", () => ({
  fetchMicrositePages: jest.fn(),
  fetchPageDsl: jest.fn(),
}));

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
