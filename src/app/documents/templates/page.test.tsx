import { render, screen } from "@testing-library/react";
import DocumentTemplateListing from "./page";

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

jest.mock("@/app/documents/templates/components/TemplateList", () => ({
  __esModule: true,
  default: ({ baseRoute, title }: { baseRoute: string; title: string }) => (
    <div data-testid="template-list" data-route={baseRoute}>
      {title}
    </div>
  ),
}));

describe("DocumentTemplateListing page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders header and template list with default back route", () => {
    mockBackWs = null;
    render(<DocumentTemplateListing />);
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("template-list")).toHaveAttribute(
      "data-route",
      "/documents/templates",
    );
    expect(mockSetPageTitle).toHaveBeenCalledWith("Document Templates");
    expect(mockResetResourceData).toHaveBeenCalled();
    expect(mockSetShowCloseIcon).toHaveBeenCalledWith(true);
    expect(mockSetBackRoute).toHaveBeenCalledWith("/workspaces");
  });

  it("sets back route with backWs query param when present", () => {
    mockBackWs = "ws-1";
    render(<DocumentTemplateListing />);
    expect(mockSetBackRoute).toHaveBeenCalledWith("/workspaces?ws=ws-1");
  });
});
