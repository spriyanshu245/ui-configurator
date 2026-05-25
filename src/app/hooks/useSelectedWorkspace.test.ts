import { renderHook, act, waitFor } from "@testing-library/react";
import { useSelectedWorkspace } from "./useSelectedWorkspace";

const mockUseSearchParams = jest.fn();
const mockReplace = jest.fn();
const mockUseRouter = jest.fn();
const mockUsePathname = jest.fn();
const mockGet = jest.fn();
const mockToString = jest.fn();

jest.mock("next/navigation", () => ({
  useSearchParams: () => mockUseSearchParams(),
  useRouter: () => mockUseRouter(),
  usePathname: () => mockUsePathname(),
}));

type WorkspaceItem = {
  code: string;
  name: string;
};

describe("useSelectedWorkspace", () => {
  const workspaces: WorkspaceItem[] = [
    { code: "workspace-a", name: "Workspace A" },
    { code: "workspace-b", name: "Workspace B" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      replace: mockReplace,
    });
    mockUsePathname.mockReturnValue("/workspaces");
    mockUseSearchParams.mockReturnValue({
      get: mockGet,
      toString: mockToString,
    });
    mockGet.mockReturnValue(null);
    mockToString.mockReturnValue("");
  });

  it("uses the workspace code from search params first", () => {
    mockUseSearchParams.mockReturnValue({
      get: jest.fn((key: string) => (key === "ws" ? "workspace-b" : null)),
    });

    const { result } = renderHook(() => useSelectedWorkspace(workspaces));

    expect(result.current[0]).toBe("workspace-b");
  });

  it("falls back to the first workspace when search params are missing", async () => {
    const { result } = renderHook(() => useSelectedWorkspace(workspaces));

    await waitFor(() => {
      expect(result.current[0]).toBe("workspace-a");
    });

    expect(mockReplace).toHaveBeenCalledWith("/workspaces?ws=workspace-a", {
      scroll: false,
    });
  });

  it("keeps null selection when there are no workspaces", () => {
    const { result } = renderHook(() => useSelectedWorkspace([]));

    expect(result.current[0]).toBeNull();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("keeps a valid selected workspace", () => {
    mockGet.mockImplementation((key: string) =>
      key === "ws" ? "workspace-b" : null,
    );

    const { result } = renderHook(() => useSelectedWorkspace(workspaces));

    expect(result.current[0]).toBe("workspace-b");
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("falls back to the first workspace when selected query is invalid", async () => {
    mockGet.mockImplementation((key: string) =>
      key === "ws" ? "missing-workspace" : null,
    );

    const { result } = renderHook(() => useSelectedWorkspace(workspaces));

    await waitFor(() => {
      expect(result.current[0]).toBe("workspace-a");
    });

    expect(mockReplace).toHaveBeenCalledWith("/workspaces?ws=workspace-a", {
      scroll: false,
    });
  });

  it("falls back to the first workspace when nothing is selected", async () => {
    const { result } = renderHook(() => useSelectedWorkspace(workspaces));

    await waitFor(() => {
      expect(result.current[0]).toBe("workspace-a");
    });

    expect(mockReplace).toHaveBeenCalledWith("/workspaces?ws=workspace-a", {
      scroll: false,
    });
  });

  it("updates state and url when setter is called", async () => {
    const { result } = renderHook(() => useSelectedWorkspace(workspaces));

    act(() => {
      result.current[1]("workspace-b");
    });

    await waitFor(() => {
      expect(result.current[0]).toBe("workspace-b");
    });

    expect(mockReplace).toHaveBeenCalledWith("/workspaces?ws=workspace-b", {
      scroll: false,
    });
  });

  it("switches to the first workspace when the selected one disappears", async () => {
    mockGet.mockImplementation((key: string) =>
      key === "ws" ? "workspace-b" : null,
    );

    const { result, rerender } = renderHook(
      ({ currentWorkspaces }: { currentWorkspaces: WorkspaceItem[] }) =>
        useSelectedWorkspace(currentWorkspaces),
      {
        initialProps: { currentWorkspaces: workspaces },
      },
    );

    expect(result.current[0]).toBe("workspace-b");

    rerender({
      currentWorkspaces: [{ code: "workspace-c", name: "Workspace C" }],
    });

    await waitFor(() => {
      expect(result.current[0]).toBe("workspace-c");
    });

    expect(mockReplace).toHaveBeenCalledWith("/workspaces?ws=workspace-c", {
      scroll: false,
    });
  });
});
