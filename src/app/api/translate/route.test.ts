const mockGetGoogleCloudConfig = jest.fn();

jest.mock("@/app/api/utils/serverConfig", () => ({
  getGoogleCloudConfig: () => mockGetGoogleCloudConfig(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => data,
    }),
  },
}));

const mockFetch = jest.fn();
globalThis.fetch = mockFetch;

const mockCreateSign = jest.fn();
jest.mock("node:crypto", () => ({
  createSign: () => mockCreateSign(),
}));

interface MockRequestBody {
  text?: string;
  texts?: string[];
  sourceLang?: string;
  targetLang?: string;
}

const createMockRequest = (body: MockRequestBody) => {
  return {
    json: jest.fn().mockResolvedValue(body),
  };
};

describe("translate route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    mockGetGoogleCloudConfig.mockReturnValue({
      projectId: "test-project",
      clientEmail: "test@test.iam.gserviceaccount.com",
      privateKey:
        "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg\n-----END PRIVATE KEY-----",
    });

    mockCreateSign.mockReturnValue({
      update: jest.fn(),
      sign: jest.fn().mockReturnValue("mock-signature"),
    });
  });

  describe("POST", () => {
    it("should return 400 when text is missing", async () => {
      const request = createMockRequest({
        sourceLang: "en",
        targetLang: "hi",
      });

      const { POST } = await import("./route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        "Missing required fields: text or texts, sourceLang, targetLang"
      );
    });

    it("should return 400 when sourceLang is missing", async () => {
      const request = createMockRequest({
        text: "Hello",
        targetLang: "hi",
      });

      const { POST } = await import("./route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        "Missing required fields: sourceLang, targetLang"
      );
    });

    it("should return 400 when targetLang is missing", async () => {
      const request = createMockRequest({
        text: "Hello",
        sourceLang: "en",
      });

      const { POST } = await import("./route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe(
        "Missing required fields: sourceLang, targetLang"
      );
    });

    it("should return original text when source and target languages are same", async () => {
      const request = createMockRequest({
        text: "Hello",
        sourceLang: "en",
        targetLang: "en",
      });

      const { POST } = await import("./route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.translatedText).toBe("Hello");
    });

    it("should translate text successfully", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: "mock-access-token" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              translations: [{ translatedText: "नमस्ते" }],
            },
          }),
        });

      const request = createMockRequest({
        text: "Hello",
        sourceLang: "en",
        targetLang: "hi",
      });

      const { POST } = await import("./route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.translatedText).toBe("नमस्ते");
    });

    it("should return 500 when Google Cloud credentials are not configured", async () => {
      mockGetGoogleCloudConfig.mockReturnValue({
        projectId: "",
        clientEmail: "",
        privateKey: "",
      });

      const request = createMockRequest({
        text: "Hello",
        sourceLang: "en",
        targetLang: "hi",
      });

      const { POST } = await import("./route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Google Cloud credentials not configured");
    });

    it("should return 500 when access token request fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        text: async () => "Token error",
      });

      const request = createMockRequest({
        text: "Hello",
        sourceLang: "en",
        targetLang: "hi",
      });

      const { POST } = await import("./route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain("Failed to get access token");
    });

    it("should return 500 when translation request fails", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: "mock-access-token" }),
        })
        .mockResolvedValueOnce({
          ok: false,
          text: async () => "Translation error",
        });

      const request = createMockRequest({
        text: "Hello",
        sourceLang: "en",
        targetLang: "hi",
      });

      const { POST } = await import("./route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain("Translation failed");
    });

    it("should return 500 when Project ID is not configured", async () => {
      mockGetGoogleCloudConfig.mockReturnValue({
        projectId: "",
        clientEmail: "test@test.iam.gserviceaccount.com",
        privateKey:
          "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg\n-----END PRIVATE KEY-----",
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "mock-access-token" }),
      });

      const request = createMockRequest({
        text: "Hello",
        sourceLang: "en",
        targetLang: "hi",
      });

      const { POST } = await import("./route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Google Cloud Project ID not configured");
    });

    it("should handle non-Error exceptions", async () => {
      const request = {
        json: jest.fn().mockRejectedValue("String error"),
      };

      const { POST } = await import("./route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Translation failed");
    });

    it("should handle Error exceptions with message", async () => {
      const request = {
        json: jest.fn().mockRejectedValue(new Error("Custom error message")),
      };

      const { POST } = await import("./route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Custom error message");
    });

    it("should return original texts when source and target languages are same (batch)", async () => {
      const texts = ["Hello", "World"];
      const request = createMockRequest({
        texts,
        sourceLang: "en",
        targetLang: "en",
      });

      const { POST } = await import("./route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.translatedTexts).toEqual(texts);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should translate a batch of texts (under 50) in a single request", async () => {
      const texts = ["Hello", "World", "Goodbye"];
      const translations = texts.map((_, i) => ({ translatedText: `t${i}` }));

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: "mock-access-token" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { translations } }),
        });

      const request = createMockRequest({
        texts,
        sourceLang: "en",
        targetLang: "hi",
      });

      const { POST } = await import("./route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.translatedTexts).toEqual(["t0", "t1", "t2"]);
      // 1 token fetch + 1 translation fetch
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should translate a batch of texts over 50 using multiple chunked requests", async () => {
      const texts = Array.from({ length: 110 }, (_, i) => `text${i}`);
      const chunk1 = texts.slice(0, 50).map((_, i) => ({ translatedText: `c1_${i}` }));
      const chunk2 = texts.slice(50, 100).map((_, i) => ({ translatedText: `c2_${i}` }));
      const chunk3 = texts.slice(100).map((_, i) => ({ translatedText: `c3_${i}` }));

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: "mock-access-token" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { translations: chunk1 } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { translations: chunk2 } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { translations: chunk3 } }),
        });

      const request = createMockRequest({
        texts,
        sourceLang: "en",
        targetLang: "hi",
      });

      const { POST } = await import("./route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.translatedTexts).toHaveLength(110);
      expect(data.translatedTexts[0]).toBe("c1_0");
      expect(data.translatedTexts[49]).toBe("c1_49");
      expect(data.translatedTexts[50]).toBe("c2_0");
      expect(data.translatedTexts[99]).toBe("c2_49");
      expect(data.translatedTexts[100]).toBe("c3_0");
      // 1 token fetch + 3 translation fetches
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it("should return empty array when texts is an empty array", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "mock-access-token" }),
      });

      const request = createMockRequest({
        texts: [],
        sourceLang: "en",
        targetLang: "hi",
      });

      const { POST } = await import("./route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.translatedTexts).toEqual([]);
      // token fetch is called, but no translation fetch needed
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should return 500 when a batch translation request fails mid-chunk", async () => {
      const texts = Array.from({ length: 60 }, (_, i) => `text${i}`);
      const chunk1 = texts.slice(0, 50).map((_, i) => ({ translatedText: `t${i}` }));

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: "mock-access-token" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { translations: chunk1 } }),
        })
        .mockResolvedValueOnce({
          ok: false,
          text: async () => "Translation error on second chunk",
        });

      const request = createMockRequest({
        texts,
        sourceLang: "en",
        targetLang: "hi",
      });

      const { POST } = await import("./route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain("Translation failed");
    });

    it("should properly encode JWT components with special characters", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: "mock-access-token" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              translations: [{ translatedText: "Translated" }],
            },
          }),
        });

      mockCreateSign.mockReturnValue({
        update: jest.fn(),
        sign: jest.fn().mockReturnValue("sig+with/special=="),
      });

      const request = createMockRequest({
        text: "Hello",
        sourceLang: "en",
        targetLang: "hi",
      });

      const { POST } = await import("./route");
      const response = await POST(request as never);

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://oauth2.googleapis.com/token",
        expect.objectContaining({
          method: "POST",
        })
      );
    });
  });
});
