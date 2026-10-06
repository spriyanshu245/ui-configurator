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
jest.mock("../logger", () => ({ logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() } }));

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

describe("createPage validation and request details", () => {
  const originalFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = originalFetch;
    updateDslCacheMock.mockClear();
  });

  const ok = () => jsonRes({ ok: true });

  it.each([[""], ["   "], [undefined as any]])("rejects a blank name (%j) before any request", async (name) => {
    const fetchMock = jest.fn();
    globalThis.fetch = fetchMock as any;
    await expect(createPage({ micrositeId: "m", name })).rejects.toThrow("Page name is required.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a name that yields no slug", async () => {
    const fetchMock = jest.fn();
    globalThis.fetch = fetchMock as any;
    await expect(createPage({ micrositeId: "m", name: "!!!" })).rejects.toThrow(/Could not derive a valid slug from "!!!"/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails with the response status when the microsite cannot be loaded", async () => {
    globalThis.fetch = jest.fn().mockResolvedValueOnce(jsonRes("missing", false, 404)) as any;
    await expect(createPage({ micrositeId: "m", name: "Page" })).rejects.toThrow("Failed to load microsite: 404 Error: missing");
  });

  it("tolerates an unreadable error body", async () => {
    const res = {
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      text: async () => {
        throw new Error("stream");
      },
    };
    globalThis.fetch = jest.fn().mockResolvedValueOnce(res) as any;
    await expect(createPage({ micrositeId: "m", name: "Page" })).rejects.toThrow("Failed to load microsite: 502 Bad Gateway");
  });

  it("fails when the page record POST is rejected, without touching the microsite", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonRes(MICROSITE))
      .mockResolvedValueOnce(jsonRes("exists", false, 409));
    globalThis.fetch = fetchMock as any;
    await expect(createPage({ micrositeId: "loan-accounts-bak1", name: "Dup" })).rejects.toThrow(
      "Failed to create page: 409 Error: exists",
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("makes the first page the microsite's firstPageCode, reading a dslJson-wrapped microsite and its version", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonRes({ dslJson: { code: "m", version: "3" } }))
      .mockResolvedValueOnce(ok())
      .mockResolvedValueOnce(ok());
    globalThis.fetch = fetchMock as any;

    const result = await createPage({ micrositeId: "m", name: "Home", description: "d" });

    expect(result.pageVersion).toBe(3);
    const putBody = JSON.parse(fetchMock.mock.calls[2][1].body);
    expect(putBody).toEqual({ code: "m", firstPageCode: "m_home", pages: [{ pageCode: "m_home", pageVersion: 3 }] });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toMatchObject({ description: "d", name: "Home" });
  });

  it("falls back to the top-level version, then 1, when the microsite has no usable version", async () => {
    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce(jsonRes({ dslJson: { pages: "nope" }, version: 5 }))
      .mockResolvedValueOnce(ok())
      .mockResolvedValueOnce(ok()) as any;
    expect((await createPage({ micrositeId: "m", name: "A" })).pageVersion).toBe(5);

    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce(jsonRes({ version: "abc" }))
      .mockResolvedValueOnce(ok())
      .mockResolvedValueOnce(ok()) as any;
    expect((await createPage({ micrositeId: "m", name: "B" })).pageVersion).toBe(1);
  });

  it("keeps the existing firstPageCode when pages already exist", async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce(jsonRes(MICROSITE)).mockResolvedValueOnce(ok()).mockResolvedValueOnce(ok());
    globalThis.fetch = fetchMock as any;
    await createPage({ micrositeId: "loan-accounts-bak1", name: "Extra" });
    expect(JSON.parse(fetchMock.mock.calls[2][1].body).firstPageCode).toBe("loan-accounts-bak1_overview");
  });

  describe("auth headers", () => {
    const headersFor = async (auth?: any) => {
      const fetchMock = jest.fn().mockResolvedValueOnce(jsonRes(MICROSITE)).mockResolvedValueOnce(ok()).mockResolvedValueOnce(ok());
      globalThis.fetch = fetchMock as any;
      await createPage({ micrositeId: "loan-accounts-bak1", name: "H", auth });
      return fetchMock.mock.calls[0][1].headers;
    };

    it("uses defaults when no auth is supplied", async () => {
      const h = await headersFor();
      expect(h).toMatchObject({ "workspace-code": "engineering-workspace", "x-user-type": "employee" });
      expect(h.Cookie).toBeUndefined();
      expect(h.Authorization).toBeUndefined();
      expect(h["x-user-id"]).toBeUndefined();
    });

    it("forwards workspace, cookie, authorization and prefers the x-user-id header", async () => {
      const h = await headersFor({ workspaceCode: "ws", cookieHeader: "c=1", authHeader: "Bearer t", userIdHeader: "hdr", userId: "u1" });
      expect(h).toMatchObject({ "workspace-code": "ws", Cookie: "c=1", Authorization: "Bearer t", "x-user-id": "hdr" });
    });

    it("falls back to the resolved userId unless it is anonymous", async () => {
      expect((await headersFor({ userId: "u1" }))["x-user-id"]).toBe("u1");
      expect((await headersFor({ userId: "anonymous" }))["x-user-id"]).toBeUndefined();
    });
  });

  describe("orphan cleanup and popup edge cases", () => {
    it("still throws the original error when deleting the orphan also fails", async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce(jsonRes(MICROSITE))
        .mockResolvedValueOnce(ok())
        .mockResolvedValueOnce(jsonRes("", false, 500))
        .mockRejectedValueOnce(new Error("network"));
      globalThis.fetch = fetchMock as any;
      await expect(createPage({ micrositeId: "loan-accounts-bak1", name: "X" })).rejects.toThrow(
        "Failed to append page to microsite: 500 Error",
      );
      expect(fetchMock.mock.calls[3][1].method).toBe("DELETE");
    });

    it("treats an unreadable new-page DSL as empty when applying popup defaults", async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce(jsonRes(MICROSITE))
        .mockResolvedValueOnce(ok())
        .mockResolvedValueOnce(ok())
        .mockResolvedValueOnce(jsonRes("", false, 404)) // GET new page DSL
        .mockResolvedValueOnce(ok()); // PUT popup
      globalThis.fetch = fetchMock as any;

      const result = await createPage({ micrositeId: "loan-accounts-bak1", name: "Pop", isPopup: true });

      expect(result.isPopup).toBe(true);
      expect(result.popupWarning).toBeUndefined();
      const body = JSON.parse(fetchMock.mock.calls[4][1].body);
      expect(body).toEqual({ properties: expect.objectContaining({ showAsPopup: true }) });
    });

    it("warns when the popup PUT is rejected", async () => {
      const fetchMock = jest
        .fn()
        .mockResolvedValueOnce(jsonRes(MICROSITE))
        .mockResolvedValueOnce(ok())
        .mockResolvedValueOnce(ok())
        .mockResolvedValueOnce(jsonRes({ properties: {} }))
        .mockResolvedValueOnce(jsonRes("", false, 500));
      globalThis.fetch = fetchMock as any;
      const result = await createPage({ micrositeId: "loan-accounts-bak1", name: "Pop2", isPopup: true });
      expect(result.popupWarning).toBe("Page created, but popup configuration failed to apply: 500 Error");
      expect(updateDslCacheMock).not.toHaveBeenCalled();
    });
  });
});
