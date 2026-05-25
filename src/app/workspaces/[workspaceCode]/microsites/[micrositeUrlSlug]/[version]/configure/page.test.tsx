import React from "react";
import { render, screen } from "@testing-library/react";
import MicrositeConfigurator from "./page";
import { useParams, useSearchParams } from "next/navigation";

const mockGet = jest.fn();

jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock("@/app/context/HeaderContextV2", () => ({
  useHeaderV2: jest.fn(),
}));

jest.mock("@/app/components/HeaderV2/HeaderV2", () => () => (
  <div data-testid="header-v2">HeaderV2 Component</div>
));

jest.mock("@/app/components/MicrositeBuilder/MicrositeBuilder", () => () => (
  <div data-testid="microsite-builder">MicrositeBuilder Component</div>
));

jest.mock("@/app/context/ControlPanelContext", () => ({
  ControlPanelProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="control-panel-provider">{children}</div>
  ),
}));

jest.mock("@/app/context/MicrositeContext", () => ({
  MicrositeProvider: ({
    children,
    code,
    version,
    workspaceCode,
  }: {
    children: React.ReactNode;
    code: string;
    version: number | undefined;
    workspaceCode: string;
  }) => {
    const normalizedVersion =
      typeof version === "number" && Number.isFinite(version)
        ? String(version)
        : "NaN";

    return (
      <div
        data-testid="microsite-provider"
        data-code={code}
        data-version={normalizedVersion}
        data-workspace={workspaceCode}
      >
        {children}
      </div>
    );
  },
}));

jest.mock("@/app/context/DragContext", () => ({
  DragProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drag-provider">{children}</div>
  ),
}));

jest.mock("@/app/context/ConfiguratorModeContext", () => ({
  ConfiguratorModeProvider: ({
    children,
    mode,
  }: {
    children: React.ReactNode;
    mode: string;
  }) => (
    <div data-testid="configurator-mode-provider" data-mode={mode}>
      {children}
    </div>
  ),
}));

const { useHeaderV2 } = jest.requireMock("@/app/context/HeaderContextV2") as {
  useHeaderV2: jest.Mock;
};

describe("MicrositeConfigurator", () => {
  const mockSetPageTitle = jest.fn();
  const mockSetBackRoute = jest.fn();
  const mockSetShowCloseIcon = jest.fn();
  const mockResetResourceData = jest.fn();
  const mockSetResourceCode = jest.fn();
  const mockSetResourceVersion = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    useHeaderV2.mockReturnValue({
      setPageTitle: mockSetPageTitle,
      setBackRoute: mockSetBackRoute,
      setShowCloseIcon: mockSetShowCloseIcon,
      resetResourceData: mockResetResourceData,
      setResourceCode: mockSetResourceCode,
      setResourceVersion: mockSetResourceVersion,
    });

    (useParams as jest.Mock).mockReturnValue({
      micrositeUrlSlug: "test-site",
      version: "v1",
      workspaceCode: "ws-123",
    });

    (useSearchParams as jest.Mock).mockReturnValue({
      get: mockGet,
    });

    mockGet.mockReturnValue(null);
  });

  it("renders the full component tree correctly", () => {
    render(<MicrositeConfigurator />);

    expect(screen.getByTestId("control-panel-provider")).toBeInTheDocument();
    expect(screen.getByTestId("microsite-provider")).toBeInTheDocument();
    expect(screen.getByTestId("drag-provider")).toBeInTheDocument();
    expect(
      screen.getByTestId("configurator-mode-provider"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("header-v2")).toBeInTheDocument();
    expect(screen.getByTestId("microsite-builder")).toBeInTheDocument();
  });

  it("initializes HeaderV2 context with correct values", () => {
    render(<MicrositeConfigurator />);

    expect(mockSetPageTitle).toHaveBeenCalledWith("Microsite Configurator");
    expect(mockSetBackRoute).toHaveBeenCalledWith(
      "/workspaces/ws-123/microsites",
    );
    expect(mockSetShowCloseIcon).toHaveBeenCalledWith(true);
    expect(mockResetResourceData).toHaveBeenCalled();
    expect(mockSetResourceCode).toHaveBeenCalledWith("test-site");
    expect(mockSetResourceVersion).toHaveBeenCalledWith("v1");
  });

  it("parses parameters and passes them to MicrositeProvider", () => {
    render(<MicrositeConfigurator />);

    const provider = screen.getByTestId("microsite-provider");
    expect(provider).toHaveAttribute("data-code", "test-site");
    expect(provider).toHaveAttribute("data-version", "1");
    expect(provider).toHaveAttribute("data-workspace", "ws-123");
  });

  it("passes correct mode to ConfiguratorModeProvider", () => {
    render(<MicrositeConfigurator />);

    expect(screen.getByTestId("configurator-mode-provider")).toHaveAttribute(
      "data-mode",
      "microsite",
    );
  });

  it("handles case where version param might be undefined safely", () => {
    (useParams as jest.Mock).mockReturnValue({
      micrositeUrlSlug: "test-site",
      version: undefined,
      workspaceCode: "ws-123",
    });

    render(<MicrositeConfigurator />);

    expect(screen.getByTestId("microsite-provider")).toHaveAttribute(
      "data-version",
      "NaN",
    );
    expect(mockSetResourceVersion).toHaveBeenCalledWith("");
  });

  it("uses the encoded back query when present", () => {
    mockGet.mockReturnValue("search/value");

    render(<MicrositeConfigurator />);

    expect(mockSetBackRoute).toHaveBeenCalledWith(
      "/workspaces/ws-123/microsites?q=search%2Fvalue",
    );
  });
});
