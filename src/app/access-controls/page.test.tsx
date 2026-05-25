import { render, screen, fireEvent } from "@testing-library/react";
import AccessControlsPage from "./page";

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

jest.mock(
  "@/app/access-controls/components/AccessControlList/AccessControlList",
  () => ({
    __esModule: true,
    default: () => (
      <div data-testid="access-control-list">AccessControlList</div>
    ),
  }),
);

describe("AccessControlsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue(null);
  });

  it("renders HeaderV2", () => {
    render(<AccessControlsPage />);
    expect(screen.getByTestId("header-v2")).toBeInTheDocument();
  });

  it("renders AccessControlList component", () => {
    render(<AccessControlsPage />);
    expect(screen.getByTestId("access-control-list")).toBeInTheDocument();
  });

  it("sets page title on mount", () => {
    render(<AccessControlsPage />);
    expect(mockSetPageTitle).toHaveBeenCalledWith("Access Configurations");
  });

  it("resets resource data on mount", () => {
    render(<AccessControlsPage />);
    expect(mockResetResourceData).toHaveBeenCalled();
  });

  it("sets showCloseIcon to true on mount", () => {
    render(<AccessControlsPage />);
    expect(mockSetShowCloseIcon).toHaveBeenCalledWith(true);
  });

  it("sets back route to /workspaces on mount", () => {
    render(<AccessControlsPage />);
    expect(mockSetBackRoute).toHaveBeenCalledWith("/workspaces");
  });

  it("sets back route with workspace query when backWs is present", () => {
    mockGet.mockImplementation((key: string) =>
      key === "backWs" ? "ws-123" : null,
    );

    render(<AccessControlsPage />);

    expect(mockSetBackRoute).toHaveBeenCalledWith("/workspaces?ws=ws-123");
  });
});
