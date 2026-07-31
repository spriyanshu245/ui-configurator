/**
 * @jest-environment node
 */

jest.mock("../dsl-patcher", () => ({
  updateDslCache: jest.fn(),
}));

jest.mock("../../../src/app/utils/utils", () => ({
  getApiBaseUrl: () => "https://api.test.example",
}));

import { putPageDsl } from "../backend-sync";
import { updateDslCache } from "../dsl-patcher";

const updateDslCacheMock = updateDslCache as jest.Mock;

describe("putPageDsl", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    updateDslCacheMock.mockClear();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("PUTs the dsl then re-GETs it and updates the dsl cache", async () => {
    const latestDsl = { id: "root", type: "page", components: [] };

    const fetchMock = jest
      .fn()
      // PUT
      .mockResolvedValueOnce({ ok: true, status: 200, statusText: "OK" })
      // GET
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => latestDsl,
      });
    globalThis.fetch = fetchMock as any;

    const result = await putPageDsl("/home", { id: "root", type: "page", components: [] }, {
      authHeader: "Bearer token",
      cookieHeader: "session=abc",
      userIdHeader: "42",
      version: 1,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);

    const putCall = fetchMock.mock.calls[0];
    expect(putCall[0]).toBe("https://api.test.example/api/v1/config/pages//home?version=1");
    expect(putCall[1].method).toBe("PUT");
    expect(putCall[1].headers.Authorization).toBe("Bearer token");
    expect(putCall[1].headers["x-user-id"]).toBe("42");

    const getCall = fetchMock.mock.calls[1];
    expect(getCall[1].method).toBe("GET");

    expect(updateDslCacheMock).toHaveBeenCalledWith("/home", latestDsl);
    expect(result.latestDsl).toEqual(latestDsl);
  });

  it("falls back to the resolved userId for x-user-id when the header is absent (bug fix: backend 'Failed to get User Id from context')", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, statusText: "OK" })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });
    globalThis.fetch = fetchMock as any;

    await putPageDsl("/home", { id: "root" }, {
      authHeader: "Bearer token",
      cookieHeader: "session=abc",
      userIdHeader: null, // client did not send x-user-id
      userId: "12345", // resolved from the JWT via getUserId
      version: 1,
    });

    const putHeaders = fetchMock.mock.calls[0][1].headers;
    expect(putHeaders["x-user-id"]).toBe("12345");
  });

  it("prefers the incoming x-user-id header over the resolved userId", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, statusText: "OK" })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });
    globalThis.fetch = fetchMock as any;

    await putPageDsl("/home", {}, { userIdHeader: "99", userId: "12345" });

    expect(fetchMock.mock.calls[0][1].headers["x-user-id"]).toBe("99");
  });

  it("omits x-user-id when neither a header nor a non-anonymous userId is available", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, statusText: "OK" })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });
    globalThis.fetch = fetchMock as any;

    await putPageDsl("/home", {}, { userId: "anonymous" });

    expect(fetchMock.mock.calls[0][1].headers["x-user-id"]).toBeUndefined();
  });

  it("defaults version to 1 when not provided", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, statusText: "OK" })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });
    globalThis.fetch = fetchMock as any;

    await putPageDsl("/about", {});

    const putUrl = fetchMock.mock.calls[0][0];
    expect(putUrl).toContain("version=1");
  });

  it("throws when the PUT response is not ok", async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => "boom",
    });
    globalThis.fetch = fetchMock as any;

    await expect(putPageDsl("/home", {})).rejects.toThrow(/Failed to apply patch to backend API/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(updateDslCacheMock).not.toHaveBeenCalled();
  });

  it("does not throw if the re-GET fails (best-effort cache refresh)", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, statusText: "OK" })
      .mockRejectedValueOnce(new Error("network down"));
    globalThis.fetch = fetchMock as any;

    const result = await putPageDsl("/home", { a: 1 });
    expect(result.latestDsl).toEqual({ a: 1 });
    expect(updateDslCacheMock).not.toHaveBeenCalled();
  });
});
