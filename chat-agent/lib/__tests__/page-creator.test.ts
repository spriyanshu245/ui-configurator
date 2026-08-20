/**
 * @jest-environment node
 */

jest.mock("../../../src/app/utils/utils", () => ({
  getApiBaseUrl: () => "https://api.test.example",
  // Real slugify behaviour so code derivation is realistic.
  toCode: (v: string) =>
    v.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
}));

jest.mock("../dsl-patcher", () => ({ updateDslCache: jest.fn() }));

import { createPage } from "../page-creator";
import { updateDslCache } from "../dsl-patcher";

const updateDslCacheMock = updateDslCache as jest.Mock;

function jsonRes(body: any, ok = true, status = 200) {
  return {
    ok,
    status,
    statusText: ok ? "OK" : "Error",
    json: async () => body,
    text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
  };
}

const MICROSITE = {
  code: "loan-accounts-bak1",
  name: "Loan Accounts",
  description: "",
  version: 1,
  firstPageCode: "loan-accounts-bak1_overview",
  pages: [{ pageCode: "loan-accounts-bak1_overview", pageVersion: 1 }],
};

describe("createPage", () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
    updateDslCacheMock.mockClear();
  });

  it("creates a page: GET microsite → POST page → PUT microsite (no popup)", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonRes(MICROSITE)) // GET microsite
      .mockResolvedValueOnce(jsonRes({ ok: true })) // POST /pages
      .mockResolvedValueOnce(jsonRes({ ok: true })); // PUT microsite
    globalThis.fetch = fetchMock as any;

    const result = await createPage({
      micrositeId: "loan-accounts-bak1",
      name: "Customer Update Banks",
    });

    expect(result.pageCode).toBe("loan-accounts-bak1_customer-update-banks");
    expect(result.slug).toBe("customer-update-banks");
    expect(result.isPopup).toBe(false);

    // POST body carries the derived code/slug.
    const postCall = fetchMock.mock.calls[1];
    expect(postCall[0]).toContain("/api/v1/config/pages?version=1");
    const postBody = JSON.parse(postCall[1].body);
    expect(postBody.code).toBe("loan-accounts-bak1_customer-update-banks");
    expect(postBody.slug).toBe("customer-update-banks");

    // PUT microsite appends the new page to pages[].
    const putCall = fetchMock.mock.calls[2];
    expect(putCall[1].method).toBe("PUT");
    const putBody = JSON.parse(putCall[1].body);
    expect(putBody.pages).toHaveLength(2);
    expect(putBody.pages[1]).toEqual({
      pageCode: "loan-accounts-bak1_customer-update-banks",
      pageVersion: 1,
    });
    // The microsite's own `version` field is stripped from the PUT body.
    expect(putBody.version).toBeUndefined();
  });

  it("applies popup defaults when isPopup: GET+PUT the new page DSL with right/40/backdrop", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonRes(MICROSITE)) // GET microsite
      .mockResolvedValueOnce(jsonRes({ ok: true })) // POST /pages
      .mockResolvedValueOnce(jsonRes({ ok: true })) // PUT microsite
      .mockResolvedValueOnce(jsonRes({ properties: { existing: true }, components: [] })) // GET new page DSL
      .mockResolvedValueOnce(jsonRes({ ok: true })); // PUT page DSL (popup)
    globalThis.fetch = fetchMock as any;

    const result = await createPage({
      micrositeId: "loan-accounts-bak1",
      name: "Popup Page",
      isPopup: true,
    });

    expect(result.isPopup).toBe(true);
    const popupPut = fetchMock.mock.calls[4];
    expect(popupPut[1].method).toBe("PUT");
    const popupBody = JSON.parse(popupPut[1].body);
    expect(popupBody.properties).toEqual(
      expect.objectContaining({
        existing: true,
        showAsPopup: true,
        panePosition: "right",
        popupWidth: 40,
        closeOnBackdropClick: true,
      }),
    );
    expect(updateDslCacheMock).toHaveBeenCalledWith(
      "loan-accounts-bak1_popup-page",
      expect.any(Object),
      1,
    );
  });

  it("rejects a duplicate page code before creating anything", async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce(
      jsonRes({
        ...MICROSITE,
        pages: [{ pageCode: "loan-accounts-bak1_overview", pageVersion: 1 }],
      }),
    );
    globalThis.fetch = fetchMock as any;

    await expect(
      createPage({ micrositeId: "loan-accounts-bak1", name: "Overview" }),
    ).rejects.toThrow(/already exists/);
    // Only the microsite GET happened — no POST.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("deletes the orphaned page if the microsite PUT fails", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonRes(MICROSITE)) // GET microsite
      .mockResolvedValueOnce(jsonRes({ ok: true })) // POST /pages
      .mockResolvedValueOnce(jsonRes("boom", false, 500)) // PUT microsite FAILS
      .mockResolvedValueOnce(jsonRes({ ok: true })); // DELETE orphan
    globalThis.fetch = fetchMock as any;

    await expect(
      createPage({ micrositeId: "loan-accounts-bak1", name: "New Page" }),
    ).rejects.toThrow(/Failed to append page to microsite/);

    const deleteCall = fetchMock.mock.calls[3];
    expect(deleteCall[1].method).toBe("DELETE");
    expect(deleteCall[0]).toContain(
      "/api/v1/config/pages/loan-accounts-bak1_new-page",
    );
  });

  it("keeps the page (does NOT delete) but warns when only popup config fails", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonRes(MICROSITE)) // GET microsite
      .mockResolvedValueOnce(jsonRes({ ok: true })) // POST /pages
      .mockResolvedValueOnce(jsonRes({ ok: true })) // PUT microsite OK
      .mockResolvedValueOnce(jsonRes({ properties: {} })) // GET page DSL
      .mockResolvedValueOnce(jsonRes("nope", false, 500)); // PUT popup FAILS
    globalThis.fetch = fetchMock as any;

    const result = await createPage({
      micrositeId: "loan-accounts-bak1",
      name: "Half Popup",
      isPopup: true,
    });

    // Page exists and is registered; popup didn't apply → warning, no DELETE.
    expect(result.pageCode).toBe("loan-accounts-bak1_half-popup");
    expect(result.isPopup).toBe(false);
    expect(result.popupWarning).toMatch(/popup configuration failed/i);
    expect(fetchMock.mock.calls.some((c) => c[1]?.method === "DELETE")).toBe(false);
  });
});
