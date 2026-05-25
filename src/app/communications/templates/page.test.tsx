import { render, screen } from "@testing-library/react";
import CommunicationTemplateListing from "./page";

const mockSetPageTitle = jest.fn();
const mockResetResourceData = jest.fn();
const mockSetBackRoute = jest.fn();
const mockSetShowCloseIcon = jest.fn();
let mockBackWs: string | null = null;

jest.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: () => mockBackWs }),
}));

jest.mock("@/app/context/HeaderContextV2", () => ({
  useHeaderV2: () => ({
    setPageTitle: mockSetPageTitle,
    resetResourceData: mockResetResourceData,
    setBackRoute: mockSetBackRoute,
    setShowCloseIcon: mockSetShowCloseIcon,
  }),
}));

jest.mock("@/app/components/HeaderV2/HeaderV2", () => ({
  __esModule: true,
  default: () => <div data-testid="header" />,
}));

jest.mock(
  "@/app/communications/templates/components/CommunicationTemplateManager",
  () => ({
    __esModule: true,
    default: () => <div data-testid="manager" />,
  }),
);

describe("CommunicationTemplateListing page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sets header context with default back route when no backWs param", () => {
    mockBackWs = null;
    render(<CommunicationTemplateListing />);
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("manager")).toBeInTheDocument();
    expect(mockSetPageTitle).toHaveBeenCalledWith("Communication Templates");
    expect(mockResetResourceData).toHaveBeenCalled();
    expect(mockSetShowCloseIcon).toHaveBeenCalledWith(true);
    expect(mockSetBackRoute).toHaveBeenCalledWith("/workspaces");
  });

  it("sets back route with backWs query param when present", () => {
    mockBackWs = "ws-1";
    render(<CommunicationTemplateListing />);
    expect(mockSetBackRoute).toHaveBeenCalledWith("/workspaces?ws=ws-1");
  });
});
