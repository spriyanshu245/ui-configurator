import { 
  fetchWorkspaceList,
  fetchMicrositeList,
  fetchMicrositeDSL,
  fetchPageDSL,
  fetchMicrositeDSLBySlug,
} from "./microsite.service";

jest.mock("../services/APIService", () => ({
  apiRequest: jest.fn(),
}));

import { apiRequest } from "../services/APIService";

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe("microsite.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchWorkspaceList", () => {
    it("should call apiRequest with correct endpoint", async () => {
      mockApiRequest.mockResolvedValue([]);

      await fetchWorkspaceList();

      expect(mockApiRequest).toHaveBeenCalledWith({
        endpoint: "/api/v1/config/workspaces",
        method: "GET",
      });
    });

    it("should return workspace list", async () => {
      const mockWorkspaces = [
        { code: "ws1", name: "Workspace 1" },
        { code: "ws2", name: "Workspace 2" },
      ];
      mockApiRequest.mockResolvedValue(mockWorkspaces);

      const result = await fetchWorkspaceList();

      expect(result).toEqual(mockWorkspaces);
    });
  });

  describe("fetchMicrositeList", () => {
    it("should call apiRequest with correct endpoint and headers", async () => {
      mockApiRequest.mockResolvedValue([]);

      await fetchMicrositeList("ws1");

      expect(mockApiRequest).toHaveBeenCalledWith({
        endpoint: "/api/v1/config/microsites",
        method: "GET",
        headers: { "workspace-code": "ws1" },
      });
    });

    it("should return microsite list", async () => {
      const mockMicrosites = [
        { code: "ms1", name: "Microsite 1", version: 1, pages: [], firstPageCode: "p1" },
        { code: "ms2", name: "Microsite 2", version: 2, pages: [], firstPageCode: "p1" },
      ];
      mockApiRequest.mockResolvedValue(mockMicrosites);

      const result = await fetchMicrositeList("ws1");

      expect(result).toEqual(mockMicrosites);
    });

    it("should handle empty workspaceId", async () => {
      mockApiRequest.mockResolvedValue([]);

      await fetchMicrositeList("");

      expect(mockApiRequest).toHaveBeenCalledWith({
        endpoint: "/api/v1/config/microsites",
        method: "GET",
        headers: { "workspace-code": "" },
      });
    });
  });

  describe("fetchMicrositeDSL", () => {
    it("should call apiRequest with correct endpoint and headers", async () => {
      mockApiRequest.mockResolvedValue({});

      await fetchMicrositeDSL("ws1", "ms1", 1);

      expect(mockApiRequest).toHaveBeenCalledWith({
        endpoint: "/api/v1/config/microsites/ms1?version=1",
        method: "GET",
        headers: { "workspace-code": "ws1" },
      });
    });

    it("should return dslJson when available", async () => {
      const mockDsl = { code: "ms1", name: "Microsite 1", pages: [] };
      mockApiRequest.mockResolvedValue({ dslJson: mockDsl });

      const result = await fetchMicrositeDSL("ws1", "ms1", 1);

      expect(result).toEqual(mockDsl);
    });

    it("should return data directly when dslJson is not available", async () => {
      const mockData = { code: "ms1", name: "Microsite 1", pages: [] };
      mockApiRequest.mockResolvedValue(mockData);

      const result = await fetchMicrositeDSL("ws1", "ms1", 1);

      expect(result).toEqual(mockData);
    });

    it("should handle null data", async () => {
      mockApiRequest.mockResolvedValue(null);

      const result = await fetchMicrositeDSL("ws1", "ms1", 1);

      expect(result).toBeNull();
    });

    it("should handle undefined dslJson", async () => {
      mockApiRequest.mockResolvedValue(undefined);

      const result = await fetchMicrositeDSL("ws1", "ms1", 1);

      expect(result).toBeUndefined();
    });
  });

  describe("fetchPageDSL", () => {
    it("should call apiRequest with correct endpoint", async () => {
      mockApiRequest.mockResolvedValue({});

      await fetchPageDSL("page1");

      expect(mockApiRequest).toHaveBeenCalledWith({
        endpoint: "/api/v1/config/pages/page1?version=1",
        method: "GET",
      });
    });

    it("should return page data", async () => {
      const mockPage = { id: "page1", components: [] };
      mockApiRequest.mockResolvedValue(mockPage);

      const result = await fetchPageDSL("page1");

      expect(result).toEqual(mockPage);
    });

    it("should handle empty pageCode", async () => {
      mockApiRequest.mockResolvedValue({});

      await fetchPageDSL("");

      expect(mockApiRequest).toHaveBeenCalledWith({
        endpoint: "/api/v1/config/pages/?version=1",
        method: "GET",
      });
    });

    it("should handle special characters in pageCode", async () => {
      mockApiRequest.mockResolvedValue({});

      await fetchPageDSL("page/with/slashes");

      expect(mockApiRequest).toHaveBeenCalledWith({
        endpoint: "/api/v1/config/pages/page/with/slashes?version=1",
        method: "GET",
      });
    });
  });

  describe("fetchMicrositeDSLBySlug", () => {
    it("should call apiRequest with correct endpoint", async () => {
      mockApiRequest.mockResolvedValue({});

      await fetchMicrositeDSLBySlug("ms1", 1);

      expect(mockApiRequest).toHaveBeenCalledWith({
        endpoint: "/api/v1/config/microsites/ms1?version=1",
        method: "GET",
      });
    });

    it("should encode the microsite slug", async () => {
      mockApiRequest.mockResolvedValue({});

      await fetchMicrositeDSLBySlug("my microsite", 1);

      expect(mockApiRequest).toHaveBeenCalledWith({
        endpoint: "/api/v1/config/microsites/my%20microsite?version=1",
        method: "GET",
      });
    });

    it("should handle special characters in slug", async () => {
      mockApiRequest.mockResolvedValue({});

      await fetchMicrositeDSLBySlug("test-slug_123", 2);

      expect(mockApiRequest).toHaveBeenCalledWith({
        endpoint: "/api/v1/config/microsites/test-slug_123?version=2",
        method: "GET",
      });
    });

    it("should return the API response directly", async () => {
      const mockResponse = {
        dslJson: { code: "ms1", name: "Microsite 1", pages: [] },
        version: 1,
      };
      mockApiRequest.mockResolvedValue(mockResponse);

      const result = await fetchMicrositeDSLBySlug("ms1", 1);

      expect(result).toEqual(mockResponse);
    });

    it("should handle numeric version", async () => {
      mockApiRequest.mockResolvedValue({});

      await fetchMicrositeDSLBySlug("ms1", 1);

      expect(mockApiRequest).toHaveBeenCalledWith({
        endpoint: "/api/v1/config/microsites/ms1?version=1",
        method: "GET",
      });
    });

    it("should handle version zero", async () => {
      mockApiRequest.mockResolvedValue({});

      await fetchMicrositeDSLBySlug("ms1", 0);

      expect(mockApiRequest).toHaveBeenCalledWith({
        endpoint: "/api/v1/config/microsites/ms1?version=0",
        method: "GET",
      });
    });

    it("should handle large version numbers", async () => {
      mockApiRequest.mockResolvedValue({});

      await fetchMicrositeDSLBySlug("ms1", 999);

      expect(mockApiRequest).toHaveBeenCalledWith({
        endpoint: "/api/v1/config/microsites/ms1?version=999",
        method: "GET",
      });
    });
  });
});
