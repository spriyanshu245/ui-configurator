import { renderHook, act, waitFor } from "@testing-library/react";
import { useConfigDetail } from "./useConfigDetail";
import { Microsite, BaseComponent } from "@/app/types/types";
import { reconcileConfig } from "@/app/utils/accessControlUtils";

jest.mock("@/app/utils/accessControlUtils", () => ({
  reconcileConfig: jest.fn(),
}));

jest.mock("@/app/services/microsite.service", () => ({
  fetchPageDSL: jest.fn(),
}));

import { fetchPageDSL } from "@/app/services/microsite.service";
import { reconcileConfig as reconcileConfigFunc } from "@/app/utils/accessControlUtils";

const mockFetchPageDSL = fetchPageDSL as jest.MockedFunction<typeof fetchPageDSL>;
const mockReconcileConfig = reconcileConfigFunc as jest.MockedFunction<typeof reconcileConfigFunc>;

const mockBaseComponent: BaseComponent = {
  id: "comp1",
  type: "button",
};

const mockMicrosite: Microsite = {
  code: "test-slug",
  version: 1,
  pages: [
    { pageCode: "page1" },
    { pageCode: "page2" },
  ],
  firstPageCode: "page1",
};

const mockConfig = {
  micrositeSlug: "test-slug",
  version: 1,
  pages: [
    {
      pageCode: "page1",
      isVisible: true,
      isEditable: true,
      isDisabled: false,
      components: [],
    },
  ],
};

const mockReconcileResult = {
  config: mockConfig,
  newComponentIds: [],
  removedComponentCount: 0,
  newPageCodes: [],
  removedPageCount: 0,
};

describe("useConfigDetail", () => {
  const mockFetchConfig = jest.fn();
  const mockFetchDSL = jest.fn();
  const mockConvertDSL = jest.fn();
  const mockMapFromApi = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchConfig.mockResolvedValue(mockConfig);
    mockFetchDSL.mockResolvedValue({ dslJson: mockMicrosite });
    mockConvertDSL.mockResolvedValue(mockConfig);
    mockMapFromApi.mockImplementation((config) => config);
    mockReconcileConfig.mockReturnValue(mockReconcileResult);
    mockFetchPageDSL.mockResolvedValue({
      components: [mockBaseComponent],
    });
  });

  const renderUseConfigDetail = () => {
    return renderHook(() =>
      useConfigDetail({
        code: "test-code",
        fetchConfig: mockFetchConfig,
        fetchDSL: mockFetchDSL,
        convertDSL: mockConvertDSL,
        mapFromApi: mockMapFromApi,
      })
    );
  };

  describe("initialization", () => {
    it("should initialize with correct default values", () => {
      const { result } = renderUseConfigDetail();

      expect(result.current.config).toBeNull();
      expect(result.current.dslData).toBeNull();
      expect(result.current.pageComponentsMap).toEqual(new Map());
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.newComponentIds).toEqual([]);
      expect(result.current.removedCount).toBe(0);
    });
  });

  describe("loading data", () => {
    it("should set loading to true initially", () => {
      const { result } = renderUseConfigDetail();
      expect(result.current.loading).toBe(true);
    });

    it("should call fetchConfig with decoded code", async () => {
      const { result } = renderUseConfigDetail();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetchConfig).toHaveBeenCalledWith("test-code");
    });

    it("should set config when data is loaded successfully", async () => {
      const { result } = renderUseConfigDetail();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.config).not.toBeNull();
    });

    it("should handle empty code - skip loading", () => {
      const { result } = renderHook(() =>
        useConfigDetail({
          code: "",
          fetchConfig: mockFetchConfig,
          fetchDSL: mockFetchDSL,
          convertDSL: mockConvertDSL,
          mapFromApi: mockMapFromApi,
        })
      );

      expect(result.current.loading).toBe(true);
      expect(mockFetchConfig).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("should set error when config is not found", async () => {
      mockFetchConfig.mockResolvedValue(null);

      const { result } = renderUseConfigDetail();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Configuration not found");
    });

    it("should set error when fetchConfig throws", async () => {
      mockFetchConfig.mockRejectedValue(new Error("Network error"));

      const { result } = renderUseConfigDetail();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Network error");
    });

    it("should set generic error for non-Error exceptions", async () => {
      mockFetchConfig.mockRejectedValue("String error");

      const { result } = renderUseConfigDetail();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe("Failed to load access configuration");
    });
  });

  describe("DSL fetching", () => {
    it("should fetch DSL when micrositeSlug exists", async () => {
      const { result } = renderUseConfigDetail();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetchDSL).toHaveBeenCalledWith("test-slug", 1);
    });

    it("should not fetch DSL when micrositeSlug is missing", async () => {
      mockFetchConfig.mockResolvedValue({
        ...mockConfig,
        micrositeSlug: undefined,
      });

      const { result } = renderUseConfigDetail();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetchDSL).not.toHaveBeenCalled();
    });

    it("should handle DSL fetch error gracefully", async () => {
      mockFetchDSL.mockRejectedValue(new Error("DSL error"));

      const { result } = renderUseConfigDetail();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.config).not.toBeNull();
    });

    it("should handle missing dslJson response", async () => {
      mockFetchDSL.mockResolvedValue(mockMicrosite);

      const { result } = renderUseConfigDetail();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.dslData).not.toBeNull();
    });

    it("should handle missing pages in DSL response", async () => {
      mockFetchDSL.mockResolvedValue({});

      const { result } = renderUseConfigDetail();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.config).not.toBeNull();
    });
  });

  describe("page components fetching", () => {
    it("should fetch page components for each page", async () => {
      const { result } = renderUseConfigDetail();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetchPageDSL).toHaveBeenCalledTimes(2);
    });

    it("should handle page fetch error gracefully", async () => {
      mockFetchPageDSL.mockRejectedValue(new Error("Page fetch error"));

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const { result } = renderUseConfigDetail();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should not set components when pageData.components is missing", async () => {
      mockFetchPageDSL.mockResolvedValue({});

      const { result } = renderUseConfigDetail();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.pageComponentsMap.size).toBe(0);
    });
  });

  describe("config generation", () => {
    it("should convert DSL when hasPagesFromApi is false", async () => {
      mockFetchConfig.mockResolvedValue({
        ...mockConfig,
        pages: [],
      });

      const { result } = renderUseConfigDetail();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockConvertDSL).toHaveBeenCalled();
    });

    it("should map from API when hasPagesFromApi is true", async () => {
      const configWithPages = {
        ...mockConfig,
        pages: [{ pageCode: "page1", isVisible: true, isEditable: true, isDisabled: false, components: [] }],
      };
      mockFetchConfig.mockResolvedValue(configWithPages);

      const { result } = renderUseConfigDetail();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockMapFromApi).toHaveBeenCalled();
    });

    it("should reconcile config when hasPagesFromApi is true and dsl exists", async () => {
      const configWithPages = {
        ...mockConfig,
        pages: [{ pageCode: "page1", isVisible: true, isEditable: true, isDisabled: false, components: [] }],
      };
      mockFetchConfig.mockResolvedValue(configWithPages);

      const { result } = renderUseConfigDetail();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockReconcileConfig).toHaveBeenCalled();
      expect(result.current.newComponentIds).toEqual([]);
      expect(result.current.removedCount).toBe(0);
    });

    it("should set mapped config when dsl is null", async () => {
      mockFetchDSL.mockResolvedValue(null);

      const { result } = renderUseConfigDetail();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockMapFromApi).toHaveBeenCalled();
    });
  });

  describe("state setters", () => {
    it("should provide setConfig function", async () => {
      const { result } = renderUseConfigDetail();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(typeof result.current.setConfig).toBe("function");
    });

    it("should provide setNewComponentIds function", async () => {
      const { result } = renderUseConfigDetail();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(typeof result.current.setNewComponentIds).toBe("function");
    });

    it("should provide setRemovedCount function", async () => {
      const { result } = renderUseConfigDetail();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(typeof result.current.setRemovedCount).toBe("function");
    });
  });

  describe("re-render with new code", () => {
    it("should re-fetch data when code changes", async () => {
      const { result, rerender } = renderHook(({ code }) =>
        useConfigDetail({
          code,
          fetchConfig: mockFetchConfig,
          fetchDSL: mockFetchDSL,
          convertDSL: mockConvertDSL,
          mapFromApi: mockMapFromApi,
        }),
        { initialProps: { code: "initial-code" } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetchConfig).toHaveBeenCalledTimes(1);

      rerender({ code: "new-code" });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetchConfig).toHaveBeenCalledTimes(2);
      expect(mockFetchConfig).toHaveBeenCalledWith("new-code");
    });
  });

  describe("decodeURIComponent", () => {
    it("should decode the code before fetching config", async () => {
      const { result } = renderHook(() =>
        useConfigDetail({
          code: "encoded%20code",
          fetchConfig: mockFetchConfig,
          fetchDSL: mockFetchDSL,
          convertDSL: mockConvertDSL,
          mapFromApi: mockMapFromApi,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetchConfig).toHaveBeenCalledWith("encoded code");
    });
  });

  describe("array response handling", () => {
    it("should handle array response from fetchConfig", async () => {
      mockFetchConfig.mockResolvedValue([mockConfig, mockConfig]);

      const { result } = renderUseConfigDetail();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.config).not.toBeNull();
    });
  });
});
