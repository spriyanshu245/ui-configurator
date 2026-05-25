import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import AccessControlList from "./AccessControlList";

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

const mockGetAllAccessConfigs = jest.fn();
const mockDeleteAccessConfig = jest.fn();
jest.mock("@/app/services/accessConfigServices", () => ({
  getAllAccessConfigs: (...args: unknown[]) => mockGetAllAccessConfigs(...args),
  deleteAccessConfig: (...args: unknown[]) => mockDeleteAccessConfig(...args),
}));

jest.mock(
  "@/app/access-controls/components/AccessControlFormPane/AccessControlFormPane",
  () => ({
    __esModule: true,
    default: ({
      isOpen,
      onClose,
      onCreated,
      mode,
      sourceAccessConfig,
    }: {
      isOpen: boolean;
      onClose: () => void;
      onCreated: (code: string) => void;
      mode?: "create" | "duplicate";
      sourceAccessConfig?: { accessConfigCode: string };
    }) =>
      isOpen ? (
        <div
          data-testid={mode === "duplicate" ? "duplicate-pane" : "form-pane"}
        >
          {mode === "duplicate" && sourceAccessConfig && (
            <div data-testid="source-config">
              {sourceAccessConfig.accessConfigCode}
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
    accessConfigCode: "config-a",
    accessConfigId: "id-a",
    micrositeSlug: "slug-a",
    version: 1,
  },
  {
    accessConfigCode: "config-b",
    accessConfigId: "id-b",
    micrositeSlug: "slug-b",
    version: 2,
  },
];

describe("AccessControlList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = "/mock-path";
    mockSearchParams = new URLSearchParams();
    mockGetAllAccessConfigs.mockResolvedValue(MOCK_CONFIGS);
    mockDeleteAccessConfig.mockResolvedValue(undefined);
  });

  it("shows loading state initially", () => {
    mockGetAllAccessConfigs.mockReturnValue(new Promise(() => {}));
    render(<AccessControlList />);
    expect(screen.getByText("loading...")).toBeInTheDocument();
  });

  it("renders data after loading", async () => {
    render(<AccessControlList />);
    await waitFor(() => {
      expect(screen.getByText("config-a")).toBeInTheDocument();
    });
    expect(screen.getByText("config-b")).toBeInTheDocument();
  });

  it("renders column headers", async () => {
    render(<AccessControlList />);
    await waitFor(() => {
      expect(screen.getByText("Access Config Code")).toBeInTheDocument();
    });
    expect(screen.getByText("Microsite Slug")).toBeInTheDocument();
    expect(screen.getByText("Version")).toBeInTheDocument();
  });

  it("renders formatted version column", async () => {
    render(<AccessControlList />);
    await waitFor(() => {
      expect(screen.getByText("v1")).toBeInTheDocument();
    });
    expect(screen.getByText("v2")).toBeInTheDocument();
  });

  it("renders micrositeSlug with fallback", async () => {
    mockGetAllAccessConfigs.mockResolvedValue([
      {
        accessConfigCode: "c1",
        accessConfigId: "i1",
        micrositeSlug: "",
        version: 1,
      },
    ]);
    render(<AccessControlList />);
    await waitFor(() => {
      expect(screen.getByText("c1")).toBeInTheDocument();
    });
  });

  it("navigates to config detail on row click", async () => {
    render(<AccessControlList />);
    await waitFor(() => {
      expect(screen.getByText("config-a")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("config-a").closest("tr")!);
    expect(mockPush).toHaveBeenCalledWith("/access-controls/config-a");
  });

  it("opens form pane when create button is clicked", async () => {
    render(<AccessControlList />);
    await waitFor(() => {
      expect(
        screen.getByLabelText("Create access configuration"),
      ).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText("Create access configuration"));
    expect(screen.getByTestId("form-pane")).toBeInTheDocument();
  });

  it("navigates after form creation", async () => {
    render(<AccessControlList />);
    await waitFor(() => {
      expect(
        screen.getByLabelText("Create access configuration"),
      ).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText("Create access configuration"));
    fireEvent.click(screen.getByTestId("form-create"));
    expect(mockPush).toHaveBeenCalledWith("/access-controls/new-code");
  });

  it("closes form pane", async () => {
    render(<AccessControlList />);
    await waitFor(() => {
      expect(
        screen.getByLabelText("Create access configuration"),
      ).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText("Create access configuration"));
    expect(screen.getByTestId("form-pane")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("form-close"));
    expect(screen.queryByTestId("form-pane")).not.toBeInTheDocument();
  });

  it("shows delete confirmation on delete action click", async () => {
    render(<AccessControlList />);
    await waitFor(() => {
      expect(screen.getByText("config-a")).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByLabelText(/Delete configuration/);
    fireEvent.click(deleteButtons[0]);
    expect(screen.getByTestId("confirm-button-yes")).toBeInTheDocument();
  });

  it("cancels delete confirmation", async () => {
    render(<AccessControlList />);
    await waitFor(() => {
      expect(screen.getByText("config-a")).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByLabelText(/Delete configuration/);
    fireEvent.click(deleteButtons[0]);
    fireEvent.click(screen.getByTestId("confirm-button-cancel"));
    expect(screen.queryByTestId("confirm-button-yes")).not.toBeInTheDocument();
  });

  it("deletes item on confirm", async () => {
    render(<AccessControlList />);
    await waitFor(() => {
      expect(screen.getByText("config-a")).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByLabelText(/Delete configuration/);
    fireEvent.click(deleteButtons[0]);
    fireEvent.click(screen.getByTestId("confirm-button-yes"));

    await waitFor(() => {
      expect(mockDeleteAccessConfig).toHaveBeenCalledWith("config-a");
    });
  });

  it("shows header with title", async () => {
    render(<AccessControlList />);
    await waitFor(() => {
      expect(screen.getByText("Access Configurations")).toBeInTheDocument();
    });
  });

  it("renders search bar", async () => {
    render(<AccessControlList />);
    await waitFor(() => {
      expect(screen.getByTestId("search-toggle")).toBeInTheDocument();
    });
  });

  it("shows empty state when no data", async () => {
    mockGetAllAccessConfigs.mockResolvedValue([]);
    render(<AccessControlList />);
    await waitFor(() => {
      expect(
        screen.getByText("No access configurations available."),
      ).toBeInTheDocument();
    });
  });

  it("renders dash for null micrositeSlug", async () => {
    mockGetAllAccessConfigs.mockResolvedValue([
      {
        accessConfigCode: "c-null",
        accessConfigId: "id-null",
        micrositeSlug: null,
        version: 3,
      },
    ]);
    render(<AccessControlList />);
    await waitFor(() => {
      expect(screen.getByText("c-null")).toBeInTheDocument();
    });
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("sorts by micrositeSlug column", async () => {
    render(<AccessControlList />);
    await waitFor(() => {
      expect(screen.getByText("config-a")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText("Sort by Microsite Slug"));
    await waitFor(() => {
      expect(screen.getByText("slug-a")).toBeInTheDocument();
    });
  });

  it("sorts by version column", async () => {
    render(<AccessControlList />);
    await waitFor(() => {
      expect(screen.getByText("config-a")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText("Sort by Version"));
    await waitFor(() => {
      expect(screen.getByText("v1")).toBeInTheDocument();
    });
  });

  it("filters data via search", async () => {
    render(<AccessControlList />);
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
    render(<AccessControlList />);
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
    render(<AccessControlList />);
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

  it("removes deleted item from list after confirm", async () => {
    render(<AccessControlList />);
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
    render(<AccessControlList />);
    await waitFor(() => {
      expect(screen.getByText("config-a")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId("search-toggle"));
    const input = screen.getByPlaceholderText("Search configurations");
    await act(async () => {
      fireEvent.change(input, { target: { value: "zzzznotfound" } });
    });
    await waitFor(() => {
      expect(
        screen.getByText("No configurations found matching your search."),
      ).toBeInTheDocument();
    });
  });

  it("handles keyboard navigation on rows", async () => {
    render(<AccessControlList />);
    await waitFor(() => {
      expect(screen.getByText("config-a")).toBeInTheDocument();
    });
    const row = screen.getByText("config-a").closest("tr")!;
    fireEvent.keyDown(row, { key: "Enter" });
    expect(mockPush).toHaveBeenCalledWith("/access-controls/config-a");
  });

  it("searches by secondary field micrositeSlug", async () => {
    render(<AccessControlList />);
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

  it("handles data with null accessConfigCode in search", async () => {
    mockGetAllAccessConfigs.mockResolvedValue([
      {
        accessConfigCode: null,
        accessConfigId: "id-null",
        micrositeSlug: "slug-null",
        version: 1,
      },
      ...MOCK_CONFIGS,
    ]);
    render(<AccessControlList />);
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
    mockGetAllAccessConfigs.mockResolvedValue([
      {
        accessConfigCode: "config-x",
        accessConfigId: "id-x",
        micrositeSlug: null,
        version: 5,
      },
      ...MOCK_CONFIGS,
    ]);
    render(<AccessControlList />);
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

  it("sorts by accessConfigCode with null value", async () => {
    mockGetAllAccessConfigs.mockResolvedValue([
      {
        accessConfigCode: null,
        accessConfigId: "id-null",
        micrositeSlug: "slug-null",
        version: 1,
      },
      ...MOCK_CONFIGS,
    ]);
    render(<AccessControlList />);
    await waitFor(() => {
      expect(screen.getByText("config-a")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText("Sort by Access Config Code"));
    await waitFor(() => {
      expect(screen.getByText("config-a")).toBeInTheDocument();
    });
  });

  it("sorts by micrositeSlug with null value", async () => {
    mockGetAllAccessConfigs.mockResolvedValue([
      {
        accessConfigCode: "config-null",
        accessConfigId: "id-null",
        micrositeSlug: null,
        version: 1,
      },
      ...MOCK_CONFIGS,
    ]);
    render(<AccessControlList />);
    await waitFor(() => {
      expect(screen.getByText("config-null")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText("Sort by Microsite Slug"));
    await waitFor(() => {
      expect(screen.getByText("config-null")).toBeInTheDocument();
    });
  });

  it("sorts by version with null value", async () => {
    mockGetAllAccessConfigs.mockResolvedValue([
      {
        accessConfigCode: "config-null",
        accessConfigId: "id-null",
        micrositeSlug: "slug",
        version: null,
      },
      ...MOCK_CONFIGS,
    ]);
    render(<AccessControlList />);
    await waitFor(() => {
      expect(screen.getByText("config-null")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText("Sort by Version"));
    await waitFor(() => {
      expect(screen.getByText("config-null")).toBeInTheDocument();
    });
  });

  it("handles tiebreakers with null values during search", async () => {
    mockGetAllAccessConfigs.mockResolvedValue([
      {
        accessConfigCode: "test",
        accessConfigId: "id-1",
        micrositeSlug: null,
        version: 1,
      },
      {
        accessConfigCode: "test",
        accessConfigId: "id-2",
        micrositeSlug: null,
        version: 2,
      },
    ]);
    render(<AccessControlList />);
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
      render(<AccessControlList />);
      await waitFor(() => {
        expect(screen.getByText("config-a")).toBeInTheDocument();
      });
      const duplicateButtons = screen.getAllByLabelText(
        /Duplicate configuration/,
      );
      expect(duplicateButtons.length).toBe(2);
    });

    it("opens duplicate pane when duplicate button is clicked", async () => {
      render(<AccessControlList />);
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
      render(<AccessControlList />);
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
      render(<AccessControlList />);
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
      render(<AccessControlList />);
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
      expect(mockPush).toHaveBeenCalledWith("/access-controls/new-code");
    });

    it("can duplicate different configs", async () => {
      render(<AccessControlList />);
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
      render(<AccessControlList />);
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
      render(<AccessControlList />);
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
      render(<AccessControlList />);
      expect(screen.queryByTestId("duplicate-pane")).not.toBeInTheDocument();
    });

    it("duplicate button click does not trigger row click", async () => {
      render(<AccessControlList />);
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
      render(<AccessControlList />);
      await waitFor(() => {
        expect(
          screen.getByLabelText("Create access configuration"),
        ).toBeInTheDocument();
      });

      // Open create pane
      fireEvent.click(screen.getByLabelText("Create access configuration"));
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
      render(<AccessControlList />);
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

    it("passing correct sourceAccessConfig to duplicate pane", async () => {
      render(<AccessControlList />);
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
});
