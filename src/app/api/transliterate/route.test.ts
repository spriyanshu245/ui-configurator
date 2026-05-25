jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => data,
    }),
  },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

interface MockRequestBody {
  text?: string;
  targetLang?: string;
}

const createMockRequest = (body: MockRequestBody) => {
  return {
    json: jest.fn().mockResolvedValue(body),
  };
};

describe("transliterate route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe("POST", () => {
    it("should return 400 when text is missing", async () => {
      const request = createMockRequest({
        targetLang: "hi",
      });

      const { POST } = await import("./route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing required fields: text, targetLang");
    });

    it("should return 400 when targetLang is missing", async () => {
      const request = createMockRequest({
        text: "namaste",
      });

      const { POST } = await import("./route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing required fields: text, targetLang");
    });

    it("should return empty suggestions for whitespace-only text", async () => {
      const request = createMockRequest({
        text: "   ",
        targetLang: "hi",
      });

      const { POST } = await import("./route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.suggestions).toEqual([]);
    });

    it("should return transliteration suggestions successfully", async () => {
      const mockSuggestions = ["नमस्ते", "नमस्ती", "नमस्त", "नमसते", "नमस्ट"];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ["SUCCESS", [["namaste", mockSuggestions]]],
      });

      const request = createMockRequest({
        text: "namaste",
        targetLang: "hi",
      });

      const { POST } = await import("./route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.suggestions).toEqual(mockSuggestions.slice(0, 9));
    });

    it("should limit suggestions to 9 items", async () => {
      const mockSuggestions = [
        "सुग1",
        "सुग2",
        "सुग3",
        "सुग4",
        "सुग5",
        "सुग6",
        "सुग7",
        "सुग8",
        "सुग9",
        "सुग10",
        "सुग11",
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ["SUCCESS", [["test", mockSuggestions]]],
      });

      const request = createMockRequest({
        text: "test",
        targetLang: "hi",
      });

      const { POST } = await import("./route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.suggestions).toHaveLength(9);
    });

    it("should return original text when API response is not ok", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      });

      const request = createMockRequest({
        text: "hello",
        targetLang: "hi",
      });

      const { POST } = await import("./route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.suggestions).toEqual(["hello"]);
    });

    it("should return original text when API response has no suggestions", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ["SUCCESS"],
      });

      const request = createMockRequest({
        text: "xyz",
        targetLang: "hi",
      });

      const { POST } = await import("./route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.suggestions).toEqual(["xyz"]);
    });

    it("should return original text when response structure is missing data", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ["SUCCESS", []],
      });

      const request = createMockRequest({
        text: "test",
        targetLang: "hi",
      });

      const { POST } = await import("./route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.suggestions).toEqual(["test"]);
    });

    it("should return original text when inner array is missing suggestions", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ["SUCCESS", [["test"]]],
      });

      const request = createMockRequest({
        text: "test",
        targetLang: "hi",
      });

      const { POST } = await import("./route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.suggestions).toEqual(["test"]);
    });

    it("should handle Error exceptions with message", async () => {
      const request = {
        json: jest.fn().mockRejectedValue(new Error("Request parse error")),
      };

      const { POST } = await import("./route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Request parse error");
    });

    it("should handle non-Error exceptions", async () => {
      const request = {
        json: jest.fn().mockRejectedValue("String error"),
      };

      const { POST } = await import("./route");
      const response = await POST(request as never);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Transliteration failed");
    });

    it("should call correct API URL with encoded parameters", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ["SUCCESS", [["hello world", ["हेलो वर्ल्ड"]]]],
      });

      const request = createMockRequest({
        text: "hello world",
        targetLang: "hi",
      });

      const { POST } = await import("./route");
      await POST(request as never);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("https://inputtools.google.com/request"),
        expect.objectContaining({
          headers: {
            "User-Agent": "Mozilla/5.0",
          },
        })
      );

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain("text=hello%20world");
      expect(calledUrl).toContain("itc=hi-t-i0-und");
      expect(calledUrl).toContain("num=9");
    });
  });
});
