/**
 * @jest-environment node
 */

jest.mock("../microsite-loader", () => ({
  fetchMicrositePages: jest.fn(),
  fetchMicrosites: jest.fn(),
  fetchPageDsl: jest.fn(),
}));

// The executor imports these DB-backed modules at load; stub them so the real
// mongodb client (module-level await) is never pulled in.
jest.mock("../../db/queries/user-preferences", () => ({ userPreferences: {} }));
jest.mock("../../db/queries/dsl-history", () => ({ dslHistory: {} }));
jest.mock("../../db/queries/temp-dsl", () => ({ tempDslOps: {} }));

import { executeTool } from "../tool-executor";
import { fetchMicrositePages } from "../microsite-loader";

const fetchMicrositePagesMock = fetchMicrositePages as jest.MockedFunction<
  typeof fetchMicrositePages
>;

describe("navigate_to_page tool", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns navigate:true with the pageCode when the page exists", async () => {
    fetchMicrositePagesMock.mockResolvedValue({
      pages: [{ pageCode: "m1_home" }, { pageCode: "m1_about" }],
    } as any);

    const result: any = await executeTool("navigate_to_page", {
      microsite_id: "m1",
      page_path: "m1_about",
      reason: "show the about page",
    });

    expect(result.navigate).toBe(true);
    expect(result.pageCode).toBe("m1_about");
    expect(result.reason).toBe("show the about page");
  });

  it("returns an error when the page does not exist", async () => {
    fetchMicrositePagesMock.mockResolvedValue({
      pages: [{ pageCode: "m1_home" }],
    } as any);

    const result: any = await executeTool("navigate_to_page", {
      microsite_id: "m1",
      page_path: "m1_missing",
    });

    expect(result.navigate).toBeUndefined();
    expect(result.error).toMatch(/not found/);
  });
});
