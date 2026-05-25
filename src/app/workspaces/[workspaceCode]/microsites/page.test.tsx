import { render, screen } from "@testing-library/react";
import React from "react";
import Microsites from "./page";

const mockSetPageTitle = jest.fn();
const mockSetBackRoute = jest.fn();
const mockSetShowCloseIcon = jest.fn();
const mockSetResourceCode = jest.fn();
const mockResetResourceData = jest.fn();
const mockGet = jest.fn();

jest.mock("next/navigation", () => ({
  useParams: () => ({ workspaceCode: "ws-1" }),
  useSearchParams: () => ({ get: mockGet }),
}));

jest.mock("@/app/context/HeaderContextV2", () => ({
  useHeaderV2: () => ({
    setPageTitle: mockSetPageTitle,
    setBackRoute: mockSetBackRoute,
    setShowCloseIcon: mockSetShowCloseIcon,
    setResourceCode: mockSetResourceCode,
    resetResourceData: mockResetResourceData,
  }),
}));

jest.mock("@/app/components/HeaderV2/HeaderV2", () => ({
  __esModule: true,
  default: () => <div data-testid="header-v2">HeaderV2</div>,
}));

jest.mock("@/app/context/ControlPanelContext", () => ({
  ControlPanelProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("@/app/context/UserTaskContext", () => ({
  UserTaskProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

jest.mock("./components/MicrositeList", () => ({
  __esModule: true,
  default: () => <div data-testid="microsite-list">MicrositeList</div>,
}));

describe("Microsites Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue(null);
  });

  it("renders the MicrositeList component", () => {
    render(<Microsites />);
    expect(screen.getByTestId("microsite-list")).toBeInTheDocument();
  });

  it("renders HeaderV2", () => {
    render(<Microsites />);
    expect(screen.getByTestId("header-v2")).toBeInTheDocument();
  });

  it("sets page title on mount", () => {
    render(<Microsites />);
    expect(mockSetPageTitle).toHaveBeenCalledWith("Microsites");
  });

  it("sets back route on mount", () => {
    render(<Microsites />);
    expect(mockSetBackRoute).toHaveBeenCalledWith("/workspaces?ws=ws-1");
  });

  it("uses the encoded back query when it is present", () => {
    mockGet.mockReturnValue("workspace filter/value");

    render(<Microsites />);

    expect(mockSetBackRoute).toHaveBeenCalledWith(
      "/workspaces?ws=ws-1&q=workspace%20filter%2Fvalue",
    );
  });

  it("sets showCloseIcon to true on mount", () => {
    render(<Microsites />);
    expect(mockSetShowCloseIcon).toHaveBeenCalledWith(true);
  });

  it("sets resource code on mount", () => {
    render(<Microsites />);
    expect(mockSetResourceCode).toHaveBeenCalledWith("ws-1");
  });

  it("resets resource data on mount", () => {
    render(<Microsites />);
    expect(mockResetResourceData).toHaveBeenCalled();
  });
});
