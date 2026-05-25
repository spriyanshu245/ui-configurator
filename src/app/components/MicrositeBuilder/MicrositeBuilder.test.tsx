import React from "react";
import { render, screen } from "@testing-library/react";
import MicrositeBuilder from "./MicrositeBuilder";
import { useHeaderV2 } from "@/app/context/HeaderContextV2";
import { useMicrosite } from "@/app/context/MicrositeContext";
import { useControlPanel } from "@/app/context/ControlPanelContext";

jest.mock("next/navigation", () => ({
  useParams: () => ({ workspaceCode: "ws-123", version: "v1" }),
}));

jest.mock("./MicrositeBuilder.module.scss", () => ({
  micrositeContainer: "micrositeContainer",
  componentsPane: "componentsPane",
  builderPane: "builderPane",
}));

jest.mock(
  "@/app/components/MicrositeBuilder/ComponentPaneV2/ComponentPaneV2",
  () => () => <div data-testid="components-pane">ComponentPaneV2</div>,
);
jest.mock(
  "@/app/components/UserTaskBuilder/BuilderPane/BuilderPane",
  () => () => <div data-testid="builder-pane">BuilderPane</div>,
);
jest.mock(
  "@/app/components/MicrositeControlPanel/MicrositeControlPanel",
  () => () => (
    <div data-testid="microsite-control-panel">MicrositeControlPanel</div>
  ),
);

jest.mock("@/app/context/PropertiesContext", () => ({
  PropertyPaneProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="property-pane-provider">{children}</div>
  ),
}));

jest.mock("@/app/context/UserTaskContext", () => ({
  UserTaskProvider: ({
    children,
    pageCode,
  }: {
    children: React.ReactNode;
    pageCode: string;
  }) => (
    <div data-testid="user-task-provider" data-page-code={pageCode}>
      {children}
    </div>
  ),
}));

jest.mock("@/app/context/MicrositeContext", () => ({
  useMicrosite: jest.fn(),
}));

jest.mock("@/app/context/ControlPanelContext", () => ({
  useControlPanel: jest.fn(),
}));

jest.mock("@/app/context/HeaderContextV2", () => ({
  useHeaderV2: jest.fn(),
}));

describe("MicrositeBuilder Component", () => {
  const mockUseMicrosite = useMicrosite as jest.Mock;
  const mockUseHeaderV2 = useHeaderV2 as jest.Mock;
  const mockUseControlPanel = useControlPanel as jest.Mock;
  const mockSetResourceStatus = jest.fn();
  const mockClearPageHistory = jest.fn();
  const mockSeedPageHistory = jest.fn();
  const mockSetPageHistoryScope = jest.fn();
  const mockSyncPageHistory = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseHeaderV2.mockReturnValue({
      setResourceStatus: mockSetResourceStatus,
    });
    mockUseControlPanel.mockReturnValue({
      clearPageHistory: mockClearPageHistory,
      seedPageHistory: mockSeedPageHistory,
      setPageHistoryScope: mockSetPageHistoryScope,
      syncPageHistory: mockSyncPageHistory,
    });
  });

  test("renders all panes including BuilderPane when pages are available", () => {
    mockUseMicrosite.mockReturnValue({
      microsite: {
        code: "test-site",
        version: 1,
        pages: [{ pageCode: "page-1" }],
      },
      isEditing: true,
      activePageCode: "page-1",
    });

    render(<MicrositeBuilder />);

    expect(screen.getByTestId("property-pane-provider")).toBeInTheDocument();

    const userTaskProvider = screen.getByTestId("user-task-provider");
    expect(userTaskProvider).toBeInTheDocument();
    expect(userTaskProvider).toHaveAttribute("data-page-code", "page-1");

    expect(screen.getByTestId("components-pane")).toBeInTheDocument();
    expect(screen.getByTestId("microsite-control-panel")).toBeInTheDocument();

    expect(screen.getByTestId("builder-pane")).toBeInTheDocument();
    expect(mockSetPageHistoryScope).toHaveBeenCalledWith("ws-123:test-site:v1");
    expect(mockSyncPageHistory).toHaveBeenCalledWith(["page-1"]);
    expect(mockSeedPageHistory).toHaveBeenCalledWith("page-1");
  });

  test("does NOT render BuilderPane when microsite pages list is empty", () => {
    mockUseMicrosite.mockReturnValue({
      microsite: {
        code: "test-site",
        version: 1,
        pages: [],
      },
      isEditing: true,
      activePageCode: "page-1",
    });

    render(<MicrositeBuilder />);

    expect(screen.getByTestId("components-pane")).toBeInTheDocument();
    expect(screen.getByTestId("microsite-control-panel")).toBeInTheDocument();

    expect(screen.queryByTestId("builder-pane")).not.toBeInTheDocument();
  });

  test("does NOT render BuilderPane when microsite object has no pages", () => {
    mockUseMicrosite.mockReturnValue({
      microsite: {
        code: "",
        version: 1,
      },
      isEditing: true,
      activePageCode: "page-1",
    });

    render(<MicrositeBuilder />);

    expect(screen.getByTestId("components-pane")).toBeInTheDocument();

    expect(screen.queryByTestId("builder-pane")).not.toBeInTheDocument();
  });

  test("does NOT render BuilderPane when pages property is undefined", () => {
    mockUseMicrosite.mockReturnValue({
      microsite: { code: "test-site", name: "Test" },
      isEditing: true,
      activePageCode: "page-1",
    });

    render(<MicrositeBuilder />);

    expect(screen.queryByTestId("builder-pane")).not.toBeInTheDocument();
  });

  test("does not seed page history when there is no active page", () => {
    mockUseMicrosite.mockReturnValue({
      microsite: {
        code: "test-site",
        version: 1,
        pages: [{ pageCode: "page-1" }],
      },
      isEditing: true,
      activePageCode: "",
    });

    render(<MicrositeBuilder />);

    expect(mockSyncPageHistory).toHaveBeenCalledWith(["page-1"]);
    expect(mockSeedPageHistory).not.toHaveBeenCalled();
  });

  test("uses published status and fallback scope values when params and codes are missing", () => {
    const paramsSpy = jest
      .spyOn(require("next/navigation"), "useParams")
      .mockReturnValue({ workspaceCode: undefined, version: undefined });

    mockUseMicrosite.mockReturnValue({
      microsite: {
        version: 3,
        pages: [{ pageCode: undefined }, { pageCode: "page-2" }],
      },
      isEditing: false,
      activePageCode: "page-2",
    });

    render(<MicrositeBuilder />);

    expect(mockSetResourceStatus).toHaveBeenCalledWith("Published");
    expect(mockSetPageHistoryScope).toHaveBeenCalledWith("::3");
    expect(mockSyncPageHistory).toHaveBeenCalledWith(["page-2"]);
    expect(mockSeedPageHistory).toHaveBeenCalledWith("page-2");

    paramsSpy.mockRestore();
  });

  test("falls back to an empty version segment when neither params nor microsite define one", () => {
    const paramsSpy = jest
      .spyOn(require("next/navigation"), "useParams")
      .mockReturnValue({ workspaceCode: "ws-123", version: undefined });

    mockUseMicrosite.mockReturnValue({
      microsite: {
        code: "test-site",
        pages: [{ pageCode: "page-3" }],
      },
      isEditing: true,
      activePageCode: "page-3",
    });

    render(<MicrositeBuilder />);

    expect(mockSetPageHistoryScope).toHaveBeenCalledWith("ws-123:test-site:");

    paramsSpy.mockRestore();
  });
});
