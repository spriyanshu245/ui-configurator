/**
 * @jest-environment node
 */
const cookiesMock = jest.fn();
const headersMock = jest.fn();
jest.mock("next/headers", () => ({
  cookies: (...a: any[]) => cookiesMock(...a),
  headers: (...a: any[]) => headersMock(...a),
}));
jest.mock("../../../src/app/utils/utils", () => ({
  getApiBaseUrl: () => "http://api.test",
}));
jest.mock("../logger", () => ({
  logger: { warn: jest.fn(), info: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { fetchMicrositePages, fetchMicrosites, fetchPageDsl } from "../microsite-loader";
import { logger } from "../logger";

const fetchMock = jest.fn();

function ok(body: any) {
  return { ok: true, json: async () => body };
}
function fail(status = 500, statusText = "Err", text: () => Promise<string> = async () => "details") {
  return { ok: false, status, statusText, text };
}

beforeEach(() => {
  jest.clearAllMocks();
  (global as any).fetch = fetchMock;
  cookiesMock.mockResolvedValue({ toString: () => "sid=1" });
  headersMock.mockResolvedValue({ get: (k: string) => (k === "authorization" ? "Bearer t" : null) });
});

describe("request headers", () => {
  it("forwards cookies and authorization along with the static workspace headers", async () => {
    fetchMock.mockResolvedValue(ok({ pages: [] }));
    await fetchMicrositePages("m1");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://api.test/api/v1/config/microsites/m1?version=1");
    expect(init.method).toBe("GET");
    expect(init.headers).toEqual({
      accept: "*/*",
      "content-type": "application/json",
      "workspace-code": "engineering-workspace",
      "x-user-type": "employee",
      Cookie: "sid=1",
      Authorization: "Bearer t",
    });
  });

  it("omits Cookie/Authorization when empty", async () => {
    cookiesMock.mockResolvedValue({ toString: () => "" });
    headersMock.mockResolvedValue({ get: () => null });
    fetchMock.mockResolvedValue(ok({}));
    await fetchMicrositePages("m1");
    const sent = fetchMock.mock.calls[0][1].headers;
    expect(sent).not.toHaveProperty("Cookie");
    expect(sent).not.toHaveProperty("Authorization");
  });

  it("warns and continues when next/headers is unavailable (outside a request)", async () => {
    cookiesMock.mockRejectedValue(new Error("no request scope"));
    fetchMock.mockResolvedValue(ok({}));
    await expect(fetchMicrositePages("m1")).resolves.toEqual({});
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Could not retrieve cookies"),
      { error: "no request scope" },
    );
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty("Cookie");
  });
});

describe.each([
  ["fetchMicrositePages", () => fetchMicrositePages("m1"), "Failed to fetch microsite pages", "/api/v1/config/microsites/m1?version=1"],
  ["fetchPageDsl", () => fetchPageDsl("pg_1", 3), "Failed to fetch page DSL", "/api/v1/config/pages/pg_1?version=3"],
  ["fetchMicrosites", () => fetchMicrosites(), "Failed to fetch microsites", "/api/v1/config/microsites?version=1"],
])("%s", (_name, call, errorPrefix, urlSuffix) => {
  it("requests the expected backend URL", async () => {
    fetchMock.mockResolvedValue(ok([]));
    await call();
    expect(fetchMock.mock.calls[0][0]).toBe(`http://api.test${urlSuffix}`);
  });

  it("throws with status and body text on a non-ok response", async () => {
    fetchMock.mockResolvedValue(fail(404, "Not Found", async () => "missing"));
    await expect(call()).rejects.toThrow(`${errorPrefix} (Status: 404 Not Found): missing`);
  });

  it("still throws (with empty details) when reading the error body fails", async () => {
    fetchMock.mockResolvedValue(fail(500, "Err", () => Promise.reject(new Error("stream"))));
    await expect(call()).rejects.toThrow(`${errorPrefix} (Status: 500 Err): `);
  });
});

describe("fetchPageDsl payload", () => {
  it("returns the parsed JSON body", async () => {
    fetchMock.mockResolvedValue(ok({ dsl: { id: "p" } }));
    await expect(fetchPageDsl("p", 1)).resolves.toEqual({ dsl: { id: "p" } });
  });
});

describe("fetchMicrosites normalization", () => {
  it("accepts a bare array and maps code/name/slug/pageCount", async () => {
    fetchMock.mockResolvedValue(
      ok([{ code: "m1", name: "One", slug: "one", pages: [{}, {}] }]),
    );
    await expect(fetchMicrosites()).resolves.toEqual([
      { id: "m1", name: "One", slug: "one", pageCount: 2 },
    ]);
  });

  it.each([
    ["data", { data: [{ id: "a", name: "A" }] }],
    ["microsites", { microsites: [{ id: "a", name: "A" }] }],
    ["items", { items: [{ id: "a", name: "A" }] }],
  ])("unwraps the `%s` envelope", async (_k, body) => {
    fetchMock.mockResolvedValue(ok(body));
    await expect(fetchMicrosites()).resolves.toEqual([
      { id: "a", name: "A", slug: undefined, pageCount: undefined },
    ]);
  });

  it("falls back across id/name/slug fields", async () => {
    fetchMock.mockResolvedValue(ok([{ slug: "only-slug" }, { code: "c" }, { id: "i" }]));
    const rows = await fetchMicrosites();
    expect(rows[0]).toMatchObject({ id: "only-slug", slug: "only-slug", name: undefined });
    expect(rows[1]).toMatchObject({ id: "c", name: "c", slug: "c" });
    expect(rows[2]).toMatchObject({ id: "i", name: "i" });
  });

  it("returns [] when the envelope has no recognizable list", async () => {
    fetchMock.mockResolvedValue(ok({ unexpected: true }));
    await expect(fetchMicrosites()).resolves.toEqual([]);
    fetchMock.mockResolvedValue(ok(null));
    await expect(fetchMicrosites()).resolves.toEqual([]);
  });
});
