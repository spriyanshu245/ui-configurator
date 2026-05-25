import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import VersioningPane from "./VersioningPane";
import { useConfig } from "@/app/context/ConfigContext";
import { getRecordVersions } from "@/app/utils/dataTableUtils";
import { useRouter, useParams } from "next/navigation";

jest.mock("@/app/context/ConfigContext", () => ({
  useConfig: jest.fn(),
}));

jest.mock("@/app/utils/dataTableUtils", () => ({
  getRecordVersions: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock("@/app/utils/constants", () => ({
  DATA_TYPE_CONFIG: {
    microsite: {
      label: "Microsite",
      routeBase: "/microsites",
      endpoint: "microsites",
    },
  },
}));

jest.mock("./VersioningPane.module.scss", () => ({
  container: "container",
  loadingContainer: "loadingContainer",
  errorContainer: "errorContainer",
  emptyContainer: "emptyContainer",
  versionList: "versionList",
  versionItem: "versionItem",
  versionIndicator: "versionIndicator",
  verticalLine: "verticalLine",
  versionBadge: "versionBadge",
  versionBadgeDraft: "versionBadgeDraft",
  versionText: "versionText",
  versionContent: "versionContent",
  statusBadge: "statusBadge",
  actionButton: "actionButton",
}));

jest.mock("../Pane", () => {
  return function MockPane({
    isOpen,
    onClose,
    title,
    children,
    minWidth,
  }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="pane" data-open={isOpen} style={{ minWidth }}>
        <h2 data-testid="pane-title">{title}</h2>
        <button data-testid="close-btn" onClick={onClose}>
          Close
        </button>
        {children}
      </div>
    );
  };
});

jest.mock("../../InlineLoader/InlineLoader", () => () => (
  <div data-testid="inline-loader" />
));

jest.mock("@/app/components/SVGIcons/ChevronRight", () => () => (
  <svg data-testid="chevron-right" />
));

const mockedUseConfig = useConfig as jest.MockedFunction<typeof useConfig>;
const mockedGetRecordVersions = getRecordVersions as jest.MockedFunction<
  typeof getRecordVersions
>;
const mockedUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockedUseParams = useParams as jest.MockedFunction<typeof useParams>;

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
};
const mockConfig = {
  NEXT_PUBLIC_BASE_URL: "https://api.example.com",
};

describe("VersioningPane", () => {
  const mockOnClose = jest.fn();
  const mockWorkspaceCode = "ws-123";

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseConfig.mockReturnValue({
      config: mockConfig,
      isLoading: false,
      error: null,
    });
    mockedUseRouter.mockReturnValue(mockRouter);
    mockedUseParams.mockReturnValue({ workspaceCode: mockWorkspaceCode });
  });

  it("renders nothing when closed", () => {
    render(
      <VersioningPane
        isOpen={false}
        onClose={mockOnClose}
        code="MS1"
        dataType="microsite"
      />
    );

    expect(screen.queryByTestId("pane")).not.toBeInTheDocument();
  });

  it("renders open state with title", () => {
    render(
      <VersioningPane
        isOpen={true}
        onClose={mockOnClose}
        code="MS1"
        dataType="microsite"
      />
    );

    expect(screen.getByTestId("pane")).toBeInTheDocument();
    expect(screen.getByTestId("pane-title")).toHaveTextContent("MS1");
  });

  it("renders default title if code is missing but isOpen is true", () => {
    render(
      <VersioningPane
        isOpen={true}
        onClose={mockOnClose}
        code=""
        dataType="microsite"
      />
    );
    expect(screen.getByTestId("pane-title")).toHaveTextContent(
      "Microsite Versions"
    );
  });

  it("shows loading state while fetching versions", async () => {
    mockedGetRecordVersions.mockImplementation(() => new Promise(() => {}));

    render(
      <VersioningPane
        isOpen={true}
        onClose={mockOnClose}
        code="MS1"
        dataType="microsite"
      />
    );

    expect(screen.getByTestId("inline-loader")).toBeInTheDocument();
    expect(screen.getByText("Loading versions...")).toBeInTheDocument();
  });

  it("shows error state when fetch fails with message", async () => {
    const errorMessage = "Network error";
    mockedGetRecordVersions.mockRejectedValueOnce(new Error(errorMessage));

    render(
      <VersioningPane
        isOpen={true}
        onClose={mockOnClose}
        code="MS1"
        dataType="microsite"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    expect(screen.queryByTestId("inline-loader")).not.toBeInTheDocument();
  });

  it("shows default error message when fetch fails without message", async () => {
    mockedGetRecordVersions.mockRejectedValueOnce({});

    render(
      <VersioningPane
        isOpen={true}
        onClose={mockOnClose}
        code="MS1"
        dataType="microsite"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Failed to fetch versions")).toBeInTheDocument();
    });
  });

  it("shows empty state when no versions found", async () => {
    mockedGetRecordVersions.mockResolvedValueOnce([]);

    render(
      <VersioningPane
        isOpen={true}
        onClose={mockOnClose}
        code="MS1"
        dataType="microsite"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("No versions found")).toBeInTheDocument();
    });
  });

  it("fetches versions and renders sorted list", async () => {
    const versions = [
      { code: "MS1", version: 1, published: false },
      { code: "MS1", version: 3, published: true },
      { code: "MS1", version: 2, published: false },
    ];
    mockedGetRecordVersions.mockResolvedValueOnce(versions);

    render(
      <VersioningPane
        isOpen={true}
        onClose={mockOnClose}
        code="MS1"
        dataType="microsite"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("v3")).toBeInTheDocument();
    });

    const renderedVersions = screen.getAllByText(/v\d+/);
    expect(renderedVersions).toHaveLength(3);
    expect(renderedVersions[0]).toHaveTextContent("v3");
    expect(renderedVersions[1]).toHaveTextContent("v2");
    expect(renderedVersions[2]).toHaveTextContent("v1");
  });

  it("renders vertical lines correctly", async () => {
    const versions = [
      { code: "MS1", version: 3, published: true },
      { code: "MS1", version: 2, published: false },
      { code: "MS1", version: 1, published: false },
    ];
    mockedGetRecordVersions.mockResolvedValueOnce(versions);

    render(
      <VersioningPane
        isOpen={true}
        onClose={mockOnClose}
        code="MS1"
        dataType="microsite"
      />
    );

    await waitFor(() => {
      const lines = screen.getAllByTestId("vertical-line");
      expect(lines).toHaveLength(2);
    });
  });

  it("applies specific style class for draft versions", async () => {
    const versions = [{ code: "MS1", version: 1, published: false }];
    mockedGetRecordVersions.mockResolvedValueOnce(versions);

    render(
      <VersioningPane
        isOpen={true}
        onClose={mockOnClose}
        code="MS1"
        dataType="microsite"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Draft")).toBeInTheDocument();
    });

    const badgeContainer = screen.getByText("v1").parentElement;
    expect(badgeContainer).toHaveClass("versionBadgeDraft");
  });

  it("does not apply draft style class for published versions", async () => {
    const versions = [{ code: "MS1", version: 1, published: true }];
    mockedGetRecordVersions.mockResolvedValueOnce(versions);

    render(
      <VersioningPane
        isOpen={true}
        onClose={mockOnClose}
        code="MS1"
        dataType="microsite"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Published")).toBeInTheDocument();
    });

    const badgeContainer = screen.getByText("v1").parentElement;
    expect(badgeContainer).not.toHaveClass("versionBadgeDraft");
  });

  it("handles version click navigation", async () => {
    const versions = [{ code: "MS1", version: 2, published: true }];
    mockedGetRecordVersions.mockResolvedValueOnce(versions);

    render(
      <VersioningPane
        isOpen={true}
        onClose={mockOnClose}
        code="MS1"
        dataType="microsite"
      />
    );

    await waitFor(() => screen.getByLabelText("View version 2"));

    fireEvent.click(screen.getByLabelText("View version 2"));

    expect(mockRouter.push).toHaveBeenCalledWith(
      `/workspaces/ws-123/microsites/MS1/v2/configure`
    );
  });

  it("does not fetch when pane closed", async () => {
    render(
      <VersioningPane
        isOpen={false}
        onClose={mockOnClose}
        code="MS1"
        dataType="microsite"
      />
    );

    await waitFor(() => {
      expect(mockedGetRecordVersions).not.toHaveBeenCalled();
    });
  });

  it("does not fetch when code is missing", async () => {
    render(
      <VersioningPane
        isOpen={true}
        onClose={mockOnClose}
        code=""
        dataType="microsite"
      />
    );

    await waitFor(() => {
      expect(mockedGetRecordVersions).not.toHaveBeenCalled();
    });
  });

  it("refetches when code changes", async () => {
    const versions1 = [{ code: "MS1", version: 1, published: true }];
    const versions2 = [{ code: "MS2", version: 5, published: false }];

    mockedGetRecordVersions
      .mockResolvedValueOnce(versions1)
      .mockResolvedValueOnce(versions2);

    const { rerender } = render(
      <VersioningPane
        isOpen={true}
        onClose={mockOnClose}
        code="MS1"
        dataType="microsite"
      />
    );

    await waitFor(() =>
      expect(mockedGetRecordVersions).toHaveBeenCalledTimes(1)
    );

    rerender(
      <VersioningPane
        isOpen={true}
        onClose={mockOnClose}
        code="MS2"
        dataType="microsite"
      />
    );

    await waitFor(() => {
      expect(mockedGetRecordVersions).toHaveBeenCalledTimes(2);
    });
  });
});
