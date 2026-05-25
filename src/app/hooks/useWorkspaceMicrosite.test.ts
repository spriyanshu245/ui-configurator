import { renderHook, act, waitFor } from "@testing-library/react";
import { useWorkspaceMicrosite } from "./useWorkspaceMicrosite";

const mockFetchWorkspaceList = jest.fn();
const mockFetchMicrositeList = jest.fn();

jest.mock("@/app/services/microsite.service", () => ({
  __esModule: true,
  fetchWorkspaceList: (...args: unknown[]) => mockFetchWorkspaceList(...args),
  fetchMicrositeList: (...args: unknown[]) => mockFetchMicrositeList(...args),
}));

const mockWorkspaces = [
  { code: "ws1", name: "Workspace 1" },
  { code: "ws2", name: "Workspace 2" },
];

const mockMicrosites = [
  { code: "ms1", name: "Microsite 1", version: 1, published: true, pages: [], firstPageCode: "p1" },
  { code: "ms2", name: "Microsite 2", version: 2, published: false, pages: [], firstPageCode: "p1" },
];

describe("useWorkspaceMicrosite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWorkspaceList.mockResolvedValue(mockWorkspaces);
    mockFetchMicrositeList.mockResolvedValue(mockMicrosites);
  });

  describe("initialization", () => {
    it("should initialize with empty state when closed", () => {
      const { result } = renderHook(() =>
        useWorkspaceMicrosite({
          isOpen: false,
          isDuplicateMode: false,
          getMicrositeSlug: (s: any) => s.micrositeSlug,
          getVersion: (s: any) => s.version,
        })
      );

      expect(result.current.workspaces).toEqual([]);
      expect(result.current.selectedWorkspace).toBeNull();
      expect(result.current.micrositeVersions).toEqual([]);
      expect(result.current.selectedMicrosite).toBeNull();
      expect(result.current.loadingWorkspaces).toBe(false);
      expect(result.current.loadingMicrosites).toBe(false);
    });

    it("should load workspaces when opened", async () => {
      const { result } = renderHook(() =>
        useWorkspaceMicrosite({
          isOpen: true,
          isDuplicateMode: false,
          getMicrositeSlug: (s: any) => s.micrositeSlug,
          getVersion: (s: any) => s.version,
        })
      );

      await waitFor(() => {
        expect(result.current.loadingWorkspaces).toBe(false);
      });

      expect(mockFetchWorkspaceList).toHaveBeenCalled();
      expect(result.current.workspaces).toEqual(mockWorkspaces);
    });
  });

  describe("workspace selection", () => {
    it("should update selectedWorkspace when setSelectedWorkspace is called", async () => {
      const { result } = renderHook(() =>
        useWorkspaceMicrosite({
          isOpen: true,
          isDuplicateMode: false,
          getMicrositeSlug: (s: any) => s.micrositeSlug,
          getVersion: (s: any) => s.version,
        })
      );

      await waitFor(() => {
        expect(result.current.loadingWorkspaces).toBe(false);
      });

      act(() => {
        result.current.setSelectedWorkspace(mockWorkspaces[0]);
      });

      expect(result.current.selectedWorkspace).toEqual(mockWorkspaces[0]);
    });

    it("should load microsites when workspace is selected", async () => {
      const { result } = renderHook(() =>
        useWorkspaceMicrosite({
          isOpen: true,
          isDuplicateMode: false,
          getMicrositeSlug: (s: any) => s.micrositeSlug,
          getVersion: (s: any) => s.version,
        })
      );

      await waitFor(() => {
        expect(result.current.loadingWorkspaces).toBe(false);
      });

      act(() => {
        result.current.setSelectedWorkspace(mockWorkspaces[0]);
      });

      await waitFor(() => {
        expect(result.current.loadingMicrosites).toBe(false);
      });

      expect(mockFetchMicrositeList).toHaveBeenCalledWith("ws1");
      expect(result.current.micrositeVersions).toEqual(mockMicrosites);
    });

    it("should clear microsites when workspace is cleared", async () => {
      const { result } = renderHook(() =>
        useWorkspaceMicrosite({
          isOpen: true,
          isDuplicateMode: false,
          getMicrositeSlug: (s: any) => s.micrositeSlug,
          getVersion: (s: any) => s.version,
        })
      );

      await waitFor(() => {
        expect(result.current.loadingWorkspaces).toBe(false);
      });

      act(() => {
        result.current.setSelectedWorkspace(mockWorkspaces[0]);
      });

      await waitFor(() => {
        expect(result.current.loadingMicrosites).toBe(false);
      });

      act(() => {
        result.current.setSelectedWorkspace(null);
      });

      expect(result.current.micrositeVersions).toEqual([]);
      expect(result.current.selectedMicrosite).toBeNull();
    });
  });

  describe("microsite selection", () => {
    it("should update selectedMicrosite when setSelectedMicrosite is called", async () => {
      const { result } = renderHook(() =>
        useWorkspaceMicrosite({
          isOpen: true,
          isDuplicateMode: false,
          getMicrositeSlug: (s: any) => s.micrositeSlug,
          getVersion: (s: any) => s.version,
        })
      );

      await waitFor(() => {
        expect(result.current.loadingWorkspaces).toBe(false);
      });

      act(() => {
        result.current.setSelectedWorkspace(mockWorkspaces[0]);
      });

      await waitFor(() => {
        expect(result.current.loadingMicrosites).toBe(false);
      });

      act(() => {
        result.current.setSelectedMicrosite(mockMicrosites[0]);
      });

      expect(result.current.selectedMicrosite).toEqual(mockMicrosites[0]);
    });
  });

  describe("duplicate mode", () => {
    const sourceConfig = {
      portalTaskConfigCode: "SOURCE",
      micrositeSlug: "ms1",
      version: 1,
    };

    it("should pre-select workspace based on source config", async () => {
      mockFetchWorkspaceList.mockResolvedValue([
        { code: "ws1", name: "Workspace 1", microsites: [{ code: "ms1" }] },
        { code: "ws2", name: "Workspace 2", microsites: [] },
      ]);

      const { result } = renderHook(() =>
        useWorkspaceMicrosite({
          isOpen: true,
          isDuplicateMode: true,
          sourceConfig: sourceConfig as any,
          getMicrositeSlug: (s: any) => s.micrositeSlug,
          getVersion: (s: any) => s.version,
        })
      );

      await waitFor(() => {
        expect(result.current.loadingWorkspaces).toBe(false);
      });

      expect(result.current.selectedWorkspace).toEqual({
        code: "ws1",
        name: "Workspace 1",
        microsites: [{ code: "ms1" }],
      });
    });

    it("should pre-select microsite based on source config", async () => {
      mockFetchWorkspaceList.mockResolvedValue([
        { code: "ws1", name: "Workspace 1", microsites: [{ code: "ms1" }] },
      ]);

      const { result } = renderHook(() =>
        useWorkspaceMicrosite({
          isOpen: true,
          isDuplicateMode: true,
          sourceConfig: sourceConfig as any,
          getMicrositeSlug: (s: any) => s.micrositeSlug,
          getVersion: (s: any) => s.version,
        })
      );

      await waitFor(() => {
        expect(result.current.loadingWorkspaces).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.loadingMicrosites).toBe(false);
      });

      expect(result.current.selectedMicrosite).toEqual(mockMicrosites[0]);
    });

    it("should not pre-select when source config is not provided", async () => {
      const { result } = renderHook(() =>
        useWorkspaceMicrosite({
          isOpen: true,
          isDuplicateMode: true,
          sourceConfig: undefined,
          getMicrositeSlug: (s: any) => s.micrositeSlug,
          getVersion: (s: any) => s.version,
        })
      );

      await waitFor(() => {
        expect(result.current.loadingWorkspaces).toBe(false);
      });

      expect(result.current.selectedWorkspace).toBeNull();
      expect(result.current.selectedMicrosite).toBeNull();
    });
  });

  describe("cleanup on close", () => {
    it("should reset state when pane closes", async () => {
      const { result, rerender } = renderHook(
        ({ isOpen }: { isOpen: boolean }) =>
          useWorkspaceMicrosite({
            isOpen,
            isDuplicateMode: false,
            getMicrositeSlug: (s: any) => s.micrositeSlug,
            getVersion: (s: any) => s.version,
          }),
        { initialProps: { isOpen: true } }
      );

      await waitFor(() => {
        expect(result.current.loadingWorkspaces).toBe(false);
      });

      act(() => {
        result.current.setSelectedWorkspace(mockWorkspaces[0]);
      });

      await waitFor(() => {
        expect(result.current.loadingMicrosites).toBe(false);
      });

      act(() => {
        result.current.setSelectedMicrosite(mockMicrosites[0]);
      });

      rerender({ isOpen: false });

      expect(result.current.selectedWorkspace).toBeNull();
      expect(result.current.selectedMicrosite).toBeNull();
      expect(result.current.micrositeVersions).toEqual([]);
    });
  });

  describe("loading states", () => {
    it("should show loading workspaces state", async () => {
      mockFetchWorkspaceList.mockImplementation(
        () => new Promise(() => {})
      );

      const { result } = renderHook(() =>
        useWorkspaceMicrosite({
          isOpen: true,
          isDuplicateMode: false,
          getMicrositeSlug: (s: any) => s.micrositeSlug,
          getVersion: (s: any) => s.version,
        })
      );

      expect(result.current.loadingWorkspaces).toBe(true);
    });

    it("should show loading microsites state", async () => {
      mockFetchMicrositeList.mockImplementation(
        () => new Promise(() => {})
      );

      const { result } = renderHook(() =>
        useWorkspaceMicrosite({
          isOpen: true,
          isDuplicateMode: false,
          getMicrositeSlug: (s: any) => s.micrositeSlug,
          getVersion: (s: any) => s.version,
        })
      );

      await waitFor(() => {
        expect(result.current.loadingWorkspaces).toBe(false);
      });

      act(() => {
        result.current.setSelectedWorkspace(mockWorkspaces[0]);
      });

      expect(result.current.loadingMicrosites).toBe(true);
    });
  });
});
