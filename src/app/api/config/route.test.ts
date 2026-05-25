const mockGetServerConfig = jest.fn();

jest.mock("@/app/api/utils/serverConfig", () => ({
  getServerConfig: () => mockGetServerConfig(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => data,
    }),
  },
}));

describe("config route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET", () => {
    it("should return config with success message", async () => {
      const mockConfig = {
        SERVICE_BASE_URL: "http://localhost:8080",
        API_KEY: "test-key",
      };
      mockGetServerConfig.mockReturnValue(mockConfig);

      const { GET } = await import("./route");
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Service Base URL received");
      expect(data.SERVICE_BASE_URL).toBe("http://localhost:8080");
      expect(data.API_KEY).toBe("test-key");
    });

    it("should return empty config when no properties are set", async () => {
      mockGetServerConfig.mockReturnValue({});

      const { GET } = await import("./route");
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Service Base URL received");
    });

    it("should spread all config values into response", async () => {
      const mockConfig = {
        KEY1: "value1",
        KEY2: "value2",
        KEY3: "value3",
      };
      mockGetServerConfig.mockReturnValue(mockConfig);

      const { GET } = await import("./route");
      const response = await GET();
      const data = await response.json();

      expect(data.KEY1).toBe("value1");
      expect(data.KEY2).toBe("value2");
      expect(data.KEY3).toBe("value3");
    });
  });
});
