import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import PortalTaskList from "./PortalTaskList";

let mockUseDataListImpl: ((...args: unknown[]) => unknown) | undefined;

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockPathname = "/mock-path";
let mockSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

const mockSetUserNotification = jest.fn();
jest.mock("@/app/context/HeaderContextV2", () => ({
  useHeaderV2: () => ({
    setUserNotification: mockSetUserNotification,
  }),
}));

const mockGetAllPortalTaskConfigs = jest.fn();
const mockDeletePortalTaskConfig = jest.fn();
jest.mock("../../../services/portalTaskServices", () => ({
  getAllPortalTaskConfigs: (...args: unknown[]) =>
    mockGetAllPortalTaskConfigs(...args),
  deletePortalTaskConfig: (...args: unknown[]) =>
    mockDeletePortalTaskConfig(...args),
}));

jest.mock("@/app/hooks/useDataList", () => {
  const actual = jest.requireActual("@/app/hooks/useDataList");

  return {
    ...actual,
    useDataList: (...args: unknown[]) =>
      mockUseDataListImpl
        ? mockUseDataListImpl(...args)
        : actual.useDataList(...args),
  };
});

jest.mock(
  "@/app/portal-tasks/components/PortalTaskFormPane/PortalTaskFormPane",
  () => ({
    __esModule: true,
    default: ({
      isOpen,
      onClose,
      onCreated,
      mode,
      sourcePortalTaskConfig,
    }: {
      isOpen: boolean;
      onClose: () => void;
      onCreated: (code: string) => void;
      mode?: "create" | "duplicate";
      sourcePortalTaskConfig?: { portalTaskConfigCode: string };
    }) =>
      isOpen ? (
        <div
          data-testid={mode === "duplicate" ? "duplicate-pane" : "form-pane"}
        >
          {mode === "duplicate" && sourcePortalTaskConfig && (
            <div data-testid="source-config">
              {sourcePortalTaskConfig.portalTaskConfigCode}
            </div>
          )}
          <button data-testid="form-close" onClick={onClose}>
            Close
          </button>
          <button
            data-testid="form-create"
            onClick={() => onCreated("new-code")}
          >
            {mode === "duplicate" ? "Duplicate" : "Create"}
          </button>
        </div>
      ) : null,
  }),
);

const MOCK_CONFIGS = [
  {
    portalTaskConfigCode: "config-a",

    micrositeSlug: "slug-a",
    version: 1,
  },
  {
    portalTaskConfigCode: "config-b",

    micrositeSlug: "slug-b",
    version: 2,
  },
];

describe("PortalTaskList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDataListImpl = undefined;
    mockPathname = "/mock-path";
    mockSearchParams = new URLSearchParams();
    mockGetAllPortalTaskConfigs.mockResolvedValue(MOCK_CONFIGS);
    mockDeletePortalTaskConfig.mockResolvedValue(undefined);
  });

  it("shows loading state initially", () => {
    mockGetAllPortalTaskConfigs.mockReturnValue(new Promise(() => {}));
    render(<PortalTaskList />);
    expect(screen.getByText("loading...")).toBeInTheDocument();
  });

  it("renders data after loading", async () => {
    render(<PortalTaskList />);
    await waitFor(() => {
      expect(screen.getByText("config-a")).toBeInTheDocument();
    });
    expect(screen.getByText("config-b")).toBeInTheDocument();
  });

  it("renders column headers", async () => {
    render(<PortalTaskList />);
    await waitFor(() => {
      expect(screen.getByText("Portal Task Config Code")).toBeInTheDocument();
    });
    expect(screen.getByText("Microsite Slug")).toBeInTheDocument();
    expect(screen.getByText("Version")).toBeInTheDocument();
  });

  it("renders formatted version column", async () => {
    render(<PortalTaskList />);
    await waitFor(() => {
      expect(screen.getByText("v1")).toBeInTheDocument();
    });
    expect(screen.getByText("v2")).toBeInTheDocument();
  });

  it("renders micrositeSlug with fallback", async () => {
    mockGetAllPortalTaskConfigs.mockResolvedValue([
      {
        portalTaskConfigCode: "c1",

        micrositeSlug: "",
        version: 1,
      },
    ]);
    render(<PortalTaskList />);
    await waitFor(() => {
      expect(screen.getByText("c1")).toBeInTheDocument();
    });
  });

  it("navigates to config detail on row click", async () => {
    render(<PortalTaskList />);
    await waitFor(() => {
      expect(screen.getByText("config-a")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("config-a").closest("tr")!);
    expect(mockPush).toHaveBeenCalledWith("/portal-tasks/config-a");
  });

  it("opens form pane when create button is clicked", async () => {
    render(<PortalTaskList />);
    await waitFor(() => {
      expect(
        screen.getByLabelText("Create portal task configuration"),
      ).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText("Create portal task configuration"));
    expect(screen.getByTestId("form-pane")).toBeInTheDocument();
  });

  it("navigates after form creation", async () => {
    render(<PortalTaskList />);
    await waitFor(() => {
      expect(
        screen.getByLabelText("Create portal task configuration"),
      ).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText("Create portal task configuration"));
    fireEvent.click(screen.getByTestId("form-create"));
    expect(mockPush).toHaveBeenCalledWith("/portal-tasks/new-code");
  });

  it("closes form pane", async () => {
    render(<PortalTaskList />);
    await waitFor(() => {
      expect(
        screen.getByLabelText("Create portal task configuration"),
      ).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText("Create portal task configuration"));
    expect(screen.getByTestId("form-pane")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("form-close"));
    expect(screen.queryByTestId("form-pane")).not.toBeInTheDocument();
  });

  it("shows delete confirmation on delete action click", async () => {
    render(<PortalTaskList />);
    await waitFor(() => {
      expect(screen.getByText("config-a")).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByLabelText(/Delete configuration/);
    fireEvent.click(deleteButtons[0]);
    expect(screen.getByTestId("confirm-button-yes")).toBeInTheDocument();
  });

  it("cancels delete confirmation", async () => {
    render(<PortalTaskList />);
    await waitFor(() => {
      expect(screen.getByText("config-a")).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByLabelText(/Delete configuration/);
    fireEvent.click(deleteButtons[0]);
    fireEvent.click(screen.getByTestId("confirm-button-cancel"));
    expect(screen.queryByTestId("confirm-button-yes")).not.toBeInTheDocument();
  });

  it("deletes item on confirm", async () => {
    render(<PortalTaskList />);
    await waitFor(() => {
      expect(screen.getByText("config-a")).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByLabelText(/Delete configuration/);
    fireEvent.click(deleteButtons[0]);
    fireEvent.click(screen.getByTestId("confirm-button-yes"));

    await waitFor(() => {
      expect(mockDeletePortalTaskConfig).toHaveBeenCalledWith("config-a");
    });
  });

  it("shows header with title", async () => {
    render(<PortalTaskList />);
    await waitFor(() => {
      expect(
        screen.getByText("Portal Task Configurations"),
      ).toBeInTheDocument();
    });
  });

  it("renders search bar", async () => {
    render(<PortalTaskList />);
    await waitFor(() => {
      expect(screen.getByTestId("search-toggle")).toBeInTheDocument();
    });
  });

  it("shows empty state when no data", async () => {
    mockGetAllPortalTaskConfigs.mockResolvedValue([]);
    render(<PortalTaskList />);
    await waitFor(() => {
      expect(
        screen.getByText("No portal task configurations available."),
      ).toBeInTheDocument();
    });
  });

  it("renders dash for null micrositeSlug", async () => {
    mockGetAllPortalTaskConfigs.mockResolvedValue([
      {
        portalTaskConfigCode: "c-null",

        micrositeSlug: null,
        version: 3,
      },
    ]);
    render(<PortalTaskList />);
    await waitFor(() => {
      expect(screen.getByText("c-null")).toBeInTheDocument();
    });
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("sorts by micrositeSlug column", async () => {
    render(<PortalTaskList />);
    await waitFor(() => {
      expect(screen.getByText("config-a")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText("Sort by Microsite Slug"));
    await waitFor(() => {
      expect(screen.getByText("slug-a")).toBeInTheDocument();
    });
  });

  it("sorts by version column", async () => {
    render(<PortalTaskList />);
    await waitFor(() => {
      expect(screen.getByText("config-a")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText("Sort by Version"));
    await waitFor(() => {
      expect(screen.getByText("v1")).toBeInTheDocument();
    });
  });

  it("filters data via search", async () => {
    render(<PortalTaskList />);
    await waitFor(() => {
      expect(screen.getByText("config-a")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("search-toggle"));
    const input = screen.getByPlaceholderText("Search configurations");
    await act(async () => {
      fireEvent.change(input, { target: { value: "config" } });
    });
    await waitFor(() => {
      expect(screen.getByText("config-a")).toBeInTheDocument();
      expect(screen.getByText("config-b")).toBeInTheDocument();
    });
  });

  it("clears search via clear button", async () => {
    render(<PortalTaskList />);
    await waitFor(() => {
      expect(screen.getByText("config-a")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("search-toggle"));
    const input = screen.getByPlaceholderText("Search configurations");
    await act(async () => {
      fireEvent.change(input, { target: { value: "config-a" } });
    });
    await waitFor(() => {
      expect(screen.getByTestId("clear-search")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("clear-search"));
    });
    await waitFor(() => {
      expect(screen.getByText("config-b")).toBeInTheDocument();
    });
  });

  it("does not navigate when row clicked during delete confirmation", async () => {
    render(<PortalTaskList />);
    await waitFor(() => {
      expect(screen.getByText("config-a")).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByLabelText(/Delete configuration/);
    fireEvent.click(deleteButtons[0]);
    expect(screen.getByTestId("confirm-button-yes")).toBeInTheDocument();
    mockPush.mockClear();
    const row = screen.getByText("config-a").closest("tr")!;
    fireEvent.click(row);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("does not navigate when row code is missing", async () => {
    mockGetAllPortalTaskConfigs.mockResolvedValue([
      {
        portalTaskConfigCode: null,
        micrositeSlug: "slug-null",
        version: 1,
      },
      ...MOCK_CONFIGS,
    ]);

    render(<PortalTaskList />);

    await waitFor(() => {
      expect(screen.getByText("slug-null")).toBeInTheDocument();
    });

    mockPush.mockClear();
    fireEvent.click(screen.getByText("slug-null").closest("tr")!);

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("removes deleted item from list after confirm", async () => {
    render(<PortalTaskList />);
    await waitFor(() => {
      expect(screen.getByText("config-a")).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByLabelText(/Delete configuration/);
    fireEvent.click(deleteButtons[0]);
    fireEvent.click(screen.getByTestId("confirm-button-yes"));
    await waitFor(() => {
      expect(screen.queryByText("config-a")).not.toBeInTheDocument();
    });
    expect(screen.getByText("config-b")).toBeInTheDocument();
  });

  it("shows empty search message when search yields no results", async () => {
    render(<PortalTaskList />);
    await waitFor(() => {
      expect(screen.getByText("config-a")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("search-toggle"));
    const input = screen.getByPlaceholderText("Search configurations");
    await act(async () => {
      fireEvent.change(input, { target: { value: "notfound" } });
    });
    await waitFor(() => {
      expect(
        screen.getByText("No configurations found matching your search."),
      ).toBeInTheDocument();
    });
  });

  it("handles keyboard navigation on rows", async () => {
    render(<PortalTaskList />);
    await waitFor(() => {
      expect(screen.getByText("config-a")).toBeInTheDocument();
    });
    const row = screen.getByText("config-a").closest("tr")!;
    fireEvent.keyDown(row, { key: "Enter" });
    expect(mockPush).toHaveBeenCalledWith("/portal-tasks/config-a");
  });

  it("searches by secondary field micrositeSlug", async () => {
    render(<PortalTaskList />);
    await waitFor(() => {
      expect(screen.getByText("config-a")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("search-toggle"));
    const input = screen.getByPlaceholderText("Search configurations");
    await act(async () => {
      fireEvent.change(input, { target: { value: "slug" } });
    });
    await waitFor(() => {
      expect(screen.getByText("config-a")).toBeInTheDocument();
      expect(screen.getByText("config-b")).toBeInTheDocument();
    });
  });

  it("handles data with null portalTaskConfigCode in search", async () => {
    mockGetAllPortalTaskConfigs.mockResolvedValue([
      {
        portalTaskConfigCode: null,

        micrositeSlug: "slug-null",
        version: 1,
      },
      ...MOCK_CONFIGS,
    ]);
    render(<PortalTaskList />);
    await waitFor(() => {
      expect(screen.getByText("config-a")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("search-toggle"));
    const input = screen.getByPlaceholderText("Search configurations");
    await act(async () => {
      fireEvent.change(input, { target: { value: "slug" } });
    });
    await waitFor(() => {
      expect(screen.getByText("slug-null")).toBeInTheDocument();
    });
  });

  it("handles data with null micrositeSlug in search", async () => {
    mockGetAllPortalTaskConfigs.mockResolvedValue([
      {
        portalTaskConfigCode: "config-x",

        micrositeSlug: null,
        version: 5,
      },
      ...MOCK_CONFIGS,
    ]);
    render(<PortalTaskList />);
    await waitFor(() => {
      expect(screen.getByText("config-x")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("search-toggle"));
    const input = screen.getByPlaceholderText("Search configurations");
    await act(async () => {
      fireEvent.change(input, { target: { value: "config" } });
    });
    await waitFor(() => {
      expect(screen.getByText("config-a")).toBeInTheDocument();
    });
  });

  it("sorts by portalTaskConfigCode with null value", async () => {
    mockGetAllPortalTaskConfigs.mockResolvedValue([
      {
        portalTaskConfigCode: null,

        micrositeSlug: "slug-null",
        version: 1,
      },
      ...MOCK_CONFIGS,
    ]);
    render(<PortalTaskList />);
    await waitFor(() => {
      expect(screen.getByText("config-a")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText("Sort by Portal Task Config Code"));
    await waitFor(() => {
      expect(screen.getByText("config-a")).toBeInTheDocument();
    });
  });

  it("sorts by micrositeSlug with null value", async () => {
    mockGetAllPortalTaskConfigs.mockResolvedValue([
      {
        portalTaskConfigCode: "config-null",

        micrositeSlug: null,
        version: 1,
      },
      ...MOCK_CONFIGS,
    ]);
    render(<PortalTaskList />);
    await waitFor(() => {
      expect(screen.getByText("config-null")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText("Sort by Microsite Slug"));
    await waitFor(() => {
      expect(screen.getByText("config-null")).toBeInTheDocument();
    });
  });

  it("sorts by version with null value", async () => {
    mockGetAllPortalTaskConfigs.mockResolvedValue([
      {
        portalTaskConfigCode: "config-null",

        micrositeSlug: "slug",
        version: null,
      },
      ...MOCK_CONFIGS,
    ]);
    render(<PortalTaskList />);
    await waitFor(() => {
      expect(screen.getByText("config-null")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText("Sort by Version"));
    await waitFor(() => {
      expect(screen.getByText("config-null")).toBeInTheDocument();
    });
  });

  it("handles tiebreakers with null values during search", async () => {
    mockGetAllPortalTaskConfigs.mockResolvedValue([
      {
        portalTaskConfigCode: "test",

        micrositeSlug: null,
        version: 1,
      },
      {
        portalTaskConfigCode: "test",

        micrositeSlug: null,
        version: 2,
      },
    ]);
    render(<PortalTaskList />);
    await waitFor(() => {
      expect(screen.getAllByText("test").length).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getByTestId("search-toggle"));
    const input = screen.getByPlaceholderText("Search configurations");
    await act(async () => {
      fireEvent.change(input, { target: { value: "test" } });
    });
    await waitFor(() => {
      expect(screen.getAllByText("test").length).toBeGreaterThan(0);
    });
  });

  describe("Duplicate Functionality", () => {
    it("displays duplicate action button for each config", async () => {
      render(<PortalTaskList />);
      await waitFor(() => {
        expect(screen.getByText("config-a")).toBeInTheDocument();
      });
      const duplicateButtons = screen.getAllByLabelText(
        /Duplicate configuration/,
      );
      expect(duplicateButtons.length).toBe(2);
    });

    it("opens duplicate pane when duplicate button is clicked", async () => {
      render(<PortalTaskList />);
      await waitFor(() => {
        expect(screen.getByText("config-a")).toBeInTheDocument();
      });
      const duplicateButton = screen.getByLabelText(
        "Duplicate configuration config-a",
      );
      fireEvent.click(duplicateButton);
      await waitFor(() => {
        expect(screen.getByTestId("duplicate-pane")).toBeInTheDocument();
      });
    });

    it("shows source config code in duplicate pane", async () => {
      render(<PortalTaskList />);
      await waitFor(() => {
        expect(screen.getByText("config-a")).toBeInTheDocument();
      });
      const duplicateButton = screen.getByLabelText(
        "Duplicate configuration config-a",
      );
      fireEvent.click(duplicateButton);
      await waitFor(() => {
        expect(screen.getByTestId("source-config")).toHaveTextContent(
          "config-a",
        );
      });
    });

    it("closes duplicate pane when close button is clicked", async () => {
      render(<PortalTaskList />);
      await waitFor(() => {
        expect(screen.getByText("config-a")).toBeInTheDocument();
      });
      const duplicateButton = screen.getByLabelText(
        "Duplicate configuration config-a",
      );
      fireEvent.click(duplicateButton);
      await waitFor(() => {
        expect(screen.getByTestId("duplicate-pane")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId("form-close"));
      await waitFor(() => {
        expect(screen.queryByTestId("duplicate-pane")).not.toBeInTheDocument();
      });
    });

    it("navigates to new config after duplication", async () => {
      render(<PortalTaskList />);
      await waitFor(() => {
        expect(screen.getByText("config-a")).toBeInTheDocument();
      });
      const duplicateButton = screen.getByLabelText(
        "Duplicate configuration config-a",
      );
      fireEvent.click(duplicateButton);
      await waitFor(() => {
        expect(screen.getByTestId("duplicate-pane")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId("form-create"));
      expect(mockPush).toHaveBeenCalledWith("/portal-tasks/new-code");
    });

    it("can duplicate different configs", async () => {
      render(<PortalTaskList />);
      await waitFor(() => {
        expect(screen.getByText("config-b")).toBeInTheDocument();
      });
      const duplicateButton = screen.getByLabelText(
        "Duplicate configuration config-b",
      );
      fireEvent.click(duplicateButton);
      await waitFor(() => {
        expect(screen.getByTestId("source-config")).toHaveTextContent(
          "config-b",
        );
      });
    });

    it("duplicate button has correct title attribute", async () => {
      render(<PortalTaskList />);
      await waitFor(() => {
        expect(screen.getByText("config-a")).toBeInTheDocument();
      });
      const duplicateButton = screen.getByLabelText(
        "Duplicate configuration config-a",
      );
      expect(duplicateButton).toHaveAttribute(
        "title",
        "Duplicate configuration: config-a",
      );
    });

    it("shows duplicate button before delete button", async () => {
      render(<PortalTaskList />);
      await waitFor(() => {
        expect(screen.getByText("config-a")).toBeInTheDocument();
      });
      const row = screen.getByText("config-a").closest("tr");
      const buttons = row?.querySelectorAll("button");
      expect(buttons?.length).toBeGreaterThanOrEqual(2);
      expect(buttons?.[0]).toHaveAttribute(
        "aria-label",
        "Duplicate configuration config-a",
      );
    });

    it("does not open duplicate pane initially", () => {
      render(<PortalTaskList />);
      expect(screen.queryByTestId("duplicate-pane")).not.toBeInTheDocument();
    });

    it("duplicate button click does not trigger row click", async () => {
      render(<PortalTaskList />);
      await waitFor(() => {
        expect(screen.getByText("config-a")).toBeInTheDocument();
      });
      const duplicateButton = screen.getByLabelText(
        "Duplicate configuration config-a",
      );

      mockPush.mockClear();

      fireEvent.click(duplicateButton);

      await waitFor(() => {
        expect(screen.getByTestId("duplicate-pane")).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it("can open both create and duplicate panes independently", async () => {
      render(<PortalTaskList />);
      await waitFor(() => {
        expect(
          screen.getByLabelText("Create portal task configuration"),
        ).toBeInTheDocument();
      });

      // Open create pane
      fireEvent.click(
        screen.getByLabelText("Create portal task configuration"),
      );
      await waitFor(() => {
        expect(screen.getByTestId("form-pane")).toBeInTheDocument();
      });

      // Close create pane
      fireEvent.click(screen.getByTestId("form-close"));
      await waitFor(() => {
        expect(screen.queryByTestId("form-pane")).not.toBeInTheDocument();
      });

      // Open duplicate pane
      const duplicateButton = screen.getByLabelText(
        "Duplicate configuration config-a",
      );
      fireEvent.click(duplicateButton);
      await waitFor(() => {
        expect(screen.getByTestId("duplicate-pane")).toBeInTheDocument();
      });
    });

    it("duplicate button shows Duplicate label", async () => {
      render(<PortalTaskList />);
      await waitFor(() => {
        expect(screen.getByText("config-a")).toBeInTheDocument();
      });
      const duplicateButton = screen.getByLabelText(
        "Duplicate configuration config-a",
      );
      fireEvent.click(duplicateButton);
      await waitFor(() => {
        expect(screen.getByText("Duplicate")).toBeInTheDocument();
      });
    });

    it("passing correct sourcePortalTaskConfig to duplicate pane", async () => {
      render(<PortalTaskList />);
      await waitFor(() => {
        expect(screen.getByText("config-a")).toBeInTheDocument();
      });
      const duplicateButton = screen.getByLabelText(
        "Duplicate configuration config-a",
      );
      fireEvent.click(duplicateButton);
      await waitFor(() => {
        const sourceElement = screen.getByTestId("source-config");
        expect(sourceElement).toHaveTextContent("config-a");
      });
    });
  });

  it("passes tiebreakers that handle missing values", () => {
    let capturedConfig:
      | {
          tiebreakers: Array<
            (item: {
              portalTaskConfigCode?: string | null;
              micrositeSlug?: string | null;
            }) => string
          >;
        }
      | undefined;

    mockUseDataListImpl = (config: unknown) => {
      capturedConfig = config as {
        tiebreakers: Array<
          (item: {
            portalTaskConfigCode?: string | null;
            micrositeSlug?: string | null;
          }) => string
        >;
      };

      return {
        loading: true,
        displayedData: [],
        confirmDeleteKey: null,
        deletingKey: null,
        searchValue: "",
        isSearchOpen: false,
        isPending: false,
        hasSearchTerm: false,
        searchInputRef: { current: null },
        searchContainerRef: { current: null },
        handleSearchToggle: jest.fn(),
        handleSearchChange: jest.fn(),
        handleSearchKeyDown: jest.fn(),
        clearSearch: jest.fn(),
        focusSearchInput: jest.fn(),
        handleSort: jest.fn(),
        getSortDirection: jest.fn(),
        requestDelete: jest.fn(),
        setDeleteHandler: jest.fn(),
        handleConfirmDelete: jest.fn(),
        handleCancelDelete: jest.fn(),
        handleRowKeyDown: jest.fn(),
        loadData: jest.fn(() => jest.fn()),
      };
    };

    render(<PortalTaskList />);

    expect(capturedConfig).toBeDefined();
    expect(capturedConfig?.tiebreakers[0]({ portalTaskConfigCode: null })).toBe(
      "",
    );
    expect(
      capturedConfig?.tiebreakers[0]({ portalTaskConfigCode: "Config-A" }),
    ).toBe("config-a");
    expect(capturedConfig?.tiebreakers[1]({ micrositeSlug: null })).toBe("");
    expect(capturedConfig?.tiebreakers[1]({ micrositeSlug: "Slug-A" })).toBe(
      "slug-a",
    );
  });
});
