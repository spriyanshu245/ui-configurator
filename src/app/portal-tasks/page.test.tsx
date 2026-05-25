import { render, screen } from "@testing-library/react";
import PortalTasksPage from "./page";

const mockSetPageTitle = jest.fn();
const mockResetResourceData = jest.fn();
const mockSetShowCloseIcon = jest.fn();
const mockSetBackRoute = jest.fn();
const mockGet = jest.fn();

jest.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

jest.mock("@/app/context/HeaderContextV2", () => ({
  useHeaderV2: () => ({
    setPageTitle: mockSetPageTitle,
    resetResourceData: mockResetResourceData,
    setShowCloseIcon: mockSetShowCloseIcon,
    setBackRoute: mockSetBackRoute,
  }),
}));

jest.mock("@/app/components/HeaderV2/HeaderV2", () => ({
  __esModule: true,
  default: () => <div data-testid="header-v2">HeaderV2</div>,
}));

jest.mock("./components/PortalTaskList/PortalTaskList", () => ({
  __esModule: true,
  default: () => <div data-testid="portal-task-list">PortalTasksPageList</div>,
}));

describe("PortalTasksPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue(null);
  });

  it("renders HeaderV2", () => {
    render(<PortalTasksPage />);
    expect(screen.getByTestId("header-v2")).toBeInTheDocument();
  });

  it("renders PortalTasksPageList component", () => {
    render(<PortalTasksPage />);
    expect(screen.getByTestId("portal-task-list")).toBeInTheDocument();
  });

  it("sets page title on mount", () => {
    render(<PortalTasksPage />);
    expect(mockSetPageTitle).toHaveBeenCalledWith("Portal Task Configurations");
  });

  it("resets resource data on mount", () => {
    render(<PortalTasksPage />);
    expect(mockResetResourceData).toHaveBeenCalled();
  });

  it("sets showCloseIcon to true on mount", () => {
    render(<PortalTasksPage />);
    expect(mockSetShowCloseIcon).toHaveBeenCalledWith(true);
  });

  it("sets back route to /workspaces on mount", () => {
    render(<PortalTasksPage />);
    expect(mockSetBackRoute).toHaveBeenCalledWith("/workspaces");
  });

  it("sets back route with workspace query when backWs is present", () => {
    mockGet.mockImplementation((key: string) =>
      key === "backWs" ? "ws-123" : null,
    );

    render(<PortalTasksPage />);

    expect(mockSetBackRoute).toHaveBeenCalledWith("/workspaces?ws=ws-123");
  });
});
