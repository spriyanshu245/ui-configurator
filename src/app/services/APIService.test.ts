import { apiRequest } from "./APIService";
import { IRequestData } from "../types/types";

jest.mock("../../platforms/session/SessionManagerService", () => ({
  __esModule: true,
  default: {
    notifyActivity: jest.fn().mockResolvedValue(true),
    waitForOngoingRefresh: jest.fn().mockResolvedValue(undefined),
    handle401: jest.fn(),
  },
}));

jest.mock("../utils/utils", () => ({
  ...jest.requireActual("../utils/utils"),
  getApiBaseUrl: jest.fn(),
  appEnv: "production",
}));

const makeHeaders = (contentType = "application/json") => ({
  get: jest.fn().mockReturnValue(contentType),
});

describe("apiRequest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    const { getApiBaseUrl } = jest.requireMock("../utils/utils");
    getApiBaseUrl.mockReturnValue("https://api.example.com");
  });

  it("calculates API URL by transforming the hostname (app -> api)", async () => {
    const data: IRequestData = { method: "GET", endpoint: "/test" };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: makeHeaders(),
      json: jest.fn().mockResolvedValue({ success: true }),
    });

    const result = await apiRequest(data);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.example.com/test",
      expect.objectContaining({ method: "GET" }),
    );
    expect(result).toEqual({ success: true });
  });

  it("throws error if window is undefined (SSR Branch)", async () => {
    const { getApiBaseUrl } = jest.requireMock("../utils/utils");
    getApiBaseUrl.mockImplementation(() => {
      throw new Error("window is not available");
    });
    const data: IRequestData = { method: "GET", endpoint: "/test" };

    await expect(apiRequest(data)).rejects.toThrow("window is not available");
  });

  it("stringifies and attaches body for POST/PUT requests", async () => {
    const body = { key: "value" };
    const methods = ["POST", "PUT"] as const;

    for (const method of methods) {
      const data: IRequestData = { method, endpoint: "/test", body };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: makeHeaders(),
        json: jest.fn().mockResolvedValue({ success: true }),
      });

      await apiRequest(data);

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.example.com/test",
        expect.objectContaining({
          method,
          body: JSON.stringify(body),
        }),
      );
    }
  });

  it("sends raw text bodies without JSON.stringify when rawBody is enabled", async () => {
    const body = "<html>hello</html>";
    const data: IRequestData = {
      method: "POST",
      endpoint: "/test",
      body,
      rawBody: true,
    };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: makeHeaders(),
      json: jest.fn().mockResolvedValue({ success: true }),
    });

    await apiRequest(data);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.example.com/test",
      expect.objectContaining({
        method: "POST",
        body,
        headers: expect.objectContaining({
          "Content-Type": "text/plain",
        }),
      }),
    );
  });

  it("does not attach body for GET requests even if provided", async () => {
    const body = { key: "value" };
    const data: IRequestData = { method: "GET", endpoint: "/test", body };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: makeHeaders(),
      json: jest.fn().mockResolvedValue({ success: true }),
    });

    await apiRequest(data);

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchCall[0]).toBe("https://api.example.com/test");
    expect(fetchCall[1].method).toBe("GET");
    expect(fetchCall[1].body).toBeUndefined();
  });

  it("throws specific error message for 409 Conflict status", async () => {
    const errorMessage = "Conflict occurred";
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 409,
      headers: makeHeaders("application/json"),
      json: jest.fn().mockResolvedValue({ message: errorMessage }),
    });

    const data: IRequestData = { method: "GET", endpoint: "/test" };

    await expect(apiRequest(data)).rejects.toThrow(errorMessage);
  });

  it("throws default 409 error if no message is provided in response", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 409,
      headers: makeHeaders("application/json"),
      json: jest.fn().mockResolvedValue({}),
    });

    const data: IRequestData = { method: "GET", endpoint: "/test" };

    await expect(apiRequest(data)).rejects.toThrow("{}");
  });

  it("throws generic error for other non-OK status codes", async () => {
    const errorText = "Internal Server Error";
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      headers: makeHeaders("text/plain"),
      text: jest.fn().mockResolvedValue(errorText),
    });

    const data: IRequestData = { method: "GET", endpoint: "/test" };

    await expect(apiRequest(data)).rejects.toThrow(errorText);
  });

  it("returns null for 204 No Content responses", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 204,
      headers: makeHeaders(),
    });

    const data: IRequestData = { method: "GET", endpoint: "/test" };

    const result = await apiRequest(data);
    expect(result).toBeNull();
  });

  it("returns text body when responseType is 'text'", async () => {
    const textBody = "<html>hello</html>";
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: makeHeaders("text/html"),
      text: jest.fn().mockResolvedValue(textBody),
    });

    const data: IRequestData = { method: "GET", endpoint: "/test" };

    const result = await apiRequest(data, { responseType: "text" });
    expect(result).toBe(textBody);
  });

  it("rethrows network errors caught in the catch block", async () => {
    const networkError = new Error("Network error");
    (global.fetch as jest.Mock).mockRejectedValue(networkError);

    const data: IRequestData = { method: "GET", endpoint: "/test" };

    await expect(apiRequest(data)).rejects.toThrow(networkError);
  });
});
