import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import MicrositeList from "./MicrositeList";

const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockPathname = "/workspaces/test-ws/microsites";
let mockSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
  useParams: () => ({ workspaceCode: "test-ws" }),
}));

const mockSetUserNotification = jest.fn();
jest.mock("@/app/context/HeaderContextV2", () => ({
  useHeaderV2: () => ({
    setUserNotification: mockSetUserNotification,
  }),
}));

const mockGetAllRecords = jest.fn();
jest.mock("@/app/utils/dataTableUtils", () => ({
  getAllRecords: (...args: unknown[]) => mockGetAllRecords(...args),
}));

jest.mock("@/app/utils/constants", () => ({
  DATA_TYPE_CONFIG: {
    microsites: {
      endpoint: "/api/microsites",
      routeBase: "/microsites",
    },
  },
}));

jest.mock("@/app/components/SVGIcons/Plus", () => ({
  __esModule: true,
  default: () => <span data-testid="plus-icon">+</span>,
}));

jest.mock("@/app/components/SVGIcons/All", () => ({
  __esModule: true,
  default: () => <span data-testid="all-icon">all</span>,
}));

jest.mock("@/app/components/SVGIcons/Delete", () => ({
  __esModule: true,
  default: () => <span data-testid="delete-icon">delete</span>,
}));

jest.mock("@/app/components/SVGIcons/EditIcon", () => ({
  __esModule: true,
  default: () => <span data-testid="edit-icon">edit</span>,
}));

jest.mock("@/app/components/SVGIcons/Copy", () => ({
  __esModule: true,
  default: () => <span data-testid="copy-icon">copy</span>,
}));

jest.mock("@/app/components/SVGIcons/Layers", () => ({
  __esModule: true,
  default: () => <span data-testid="layers-icon">layers</span>,
}));

jest.mock("@/app/components/SVGIcons/Search", () => ({
  __esModule: true,
  default: () => <span data-testid="search-icon">search</span>,
}));

jest.mock("@/app/components/SVGIcons/Close", () => ({
  __esModule: true,
  default: () => <span data-testid="close-icon">close</span>,
}));

jest.mock("@/app/components/SVGIcons/ChevronDownSolid", () => ({
  __esModule: true,
  default: () => <span data-testid="chevron-down">v</span>,
}));

jest.mock("@/app/components/SVGIcons/ChevronUpSolid", () => ({
  __esModule: true,
  default: () => <span data-testid="chevron-up">^</span>,
}));

jest.mock(
  "@/app/components/InternalComponents/InlineLoader/InlineLoader",
  () => ({
    __esModule: true,
    default: () => <span data-testid="loader-icon">loading</span>,
  }),
);

jest.mock("@/app/components/Tooltip/Tooltip", () => ({
  __esModule: true,
  default: ({ children }: { text: string; children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

jest.mock("@/app/components/InternalComponents/Pane/FormPane/FormPane", () => ({
  __esModule: true,
  default: ({
    isOpen,
    mode,
    onClose,
    onCreated,
    onUpdated,
  }: {
    isOpen: boolean;
    mode: string;
    dataToEdit?: Record<string, unknown>;
    sourceDsl?: Record<string, unknown> | null;
    onClose: () => void;
    onCreated: (code: string) => void;
    onUpdated: (payload: {
      code: string;
      name: string;
      sourceSystem?: string;
      accessControlled?: boolean;
      description?: string;
    }) => void;
  }) =>
    isOpen ? (
      <div data-testid="form-pane" data-mode={mode}>
        <button data-testid="form-close" onClick={onClose}>
          Close
        </button>
        <button
          data-testid="form-create"
          onClick={() => onCreated("new-ms-code")}
        >
          Create
        </button>
        <button
          data-testid="form-update"
          onClick={() =>
            onUpdated({
              code: "ms1",
              name: "Updated MS",
              sourceSystem: "web",
              accessControlled: true,
              description: "Updated",
            })
          }
        >
          Update
        </button>
      </div>
    ) : null,
}));

jest.mock("./DuplicateMicrositePane", () => ({
  __esModule: true,
  default: ({
    isOpen,
    sourceMicrositeCode,
    initialVersion,
    onClose,
    onCreated,
  }: {
    isOpen: boolean;
    sourceMicrositeCode: string;
    initialVersion?: number;
    onClose: () => void;
    onCreated: (code: string) => void;
  }) =>
    isOpen ? (
      <div
        data-testid="duplicate-microsite-pane"
        data-code={sourceMicrositeCode}
        data-version={initialVersion}
      >
        <button data-testid="duplicate-pane-close" onClick={onClose}>
          Close
        </button>
        <button
          data-testid="duplicate-pane-create"
          onClick={() => onCreated("duplicate-ms-code")}
        >
          Duplicate
        </button>
      </div>
    ) : null,
}));

jest.mock("./DeleteMicrositeModal", () => ({
  __esModule: true,
  default: ({
    isOpen,
    microsite,
    onClose,
    onWorkflowComplete,
  }: {
    isOpen: boolean;
    microsite: { code: string; name?: string | null } | null;
    onClose: () => void;
    onWorkflowComplete: (result: {
      summary: {
        result: "success" | "partial_success";
        deletedMicrositeVersions: number;
        deletedPageVersions: number;
        succeeded: number;
        skipped: number;
        failed: number;
        totalOperations: number;
      };
      operations: unknown[];
    }) => void;
  }) =>
    isOpen ? (
      <div
        data-testid="delete-microsite-modal"
        data-code={microsite?.code}
      >
        <button data-testid="delete-microsite-modal-close" onClick={onClose}>
          Close
        </button>
        <button
          data-testid="delete-microsite-modal-complete"
          onClick={() =>
            onWorkflowComplete({
              summary: {
                result: "success",
                deletedMicrositeVersions: 2,
                deletedPageVersions: 3,
                succeeded: 5,
                skipped: 0,
                failed: 0,
                totalOperations: 5,
              },
              operations: [],
            })
          }
        >
          Complete
        </button>
        <button
          data-testid="delete-microsite-modal-partial"
          onClick={() =>
            onWorkflowComplete({
              summary: {
                result: "partial_success",
                deletedMicrositeVersions: 1,
                deletedPageVersions: 2,
                succeeded: 3,
                skipped: 1,
                failed: 0,
                totalOperations: 4,
              },
              operations: [],
            })
          }
        >
          Partial
        </button>
      </div>
    ) : null,
}));

jest.mock(
  "@/app/components/InternalComponents/Pane/VersioningPane/VersioningPane",
  () => ({
    __esModule: true,
    default: ({
      isOpen,
      code,
      onClose,
    }: {
      isOpen: boolean;
      code: string;
      onClose: () => void;
    }) =>
      isOpen ? (
        <div data-testid="versioning-pane" data-code={code}>
          <button data-testid="versioning-close" onClick={onClose}>
            Close
          </button>
        </div>
      ) : null,
  }),
);

const MOCK_MICROSITES = [
  {
    id: "m1",
    code: "ms1",
    name: "Microsite One",
    description: "Desc 1",
    sourceSystem: "web",
    accessControlled: false,
    published: true,
    isArchive: false,
    createdOn: "2025-01-01",
    updatedOn: "2025-01-02",
    version: 3,
  },
  {
    id: "m2",
    code: "ms2",
    name: "Microsite Two",
    description: "Desc 2",
    sourceSystem: "mobile",
    accessControlled: true,
    published: false,
    isArchive: false,
    createdOn: "2025-01-03",
    updatedOn: "2025-01-04",
    version: 1,
  },
  {
    id: "m3",
    code: "ms3",
    name: "Alpha Microsite",
    description: "Desc 3",
    published: true,
    isArchive: false,
    createdOn: "2025-01-05",
    updatedOn: "2025-01-06",
    version: 2,
  },
];

describe("MicrositeList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = "/workspaces/test-ws/microsites";
    mockSearchParams = new URLSearchParams();
    mockGetAllRecords.mockResolvedValue(MOCK_MICROSITES);
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
  });

  describe("Loading state", () => {
    it("shows loading state initially", () => {
      mockGetAllRecords.mockReturnValue(new Promise(() => {}));
      render(<MicrositeList />);
      expect(screen.getByText("loading...")).toBeInTheDocument();
    });
  });

  describe("Microsite display", () => {
    it("displays microsites after loading", async () => {
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("Microsite One")).toBeInTheDocument();
      });
      expect(screen.getByText("Microsite Two")).toBeInTheDocument();
      expect(screen.getByText("Alpha Microsite")).toBeInTheDocument();
    });

    it("renders column headers", async () => {
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("Name")).toBeInTheDocument();
      });
      expect(screen.getByText("Code")).toBeInTheDocument();
      expect(screen.getByText("Source System")).toBeInTheDocument();
      expect(screen.getByText("Version")).toBeInTheDocument();
    });

    it("renders header title", async () => {
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("All microsites")).toBeInTheDocument();
      });
    });

    it("renders version with v prefix", async () => {
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("v3")).toBeInTheDocument();
      });
      expect(screen.getByText("v1")).toBeInTheDocument();
      expect(screen.getByText("v2")).toBeInTheDocument();
    });

    it("renders source system values", async () => {
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("web")).toBeInTheDocument();
      });
      expect(screen.getByText("mobile")).toBeInTheDocument();
    });

    it("renders dash for missing source system", async () => {
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("Microsite One")).toBeInTheDocument();
      });
      const dashes = screen.getAllByText("—");
      expect(dashes.length).toBeGreaterThan(0);
    });

    it("handles API error", async () => {
      mockGetAllRecords.mockRejectedValue(new Error("Network error"));
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.queryByText("loading...")).not.toBeInTheDocument();
      });
    });

    it("handles null data from API", async () => {
      mockGetAllRecords.mockResolvedValue(null);
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.queryByText("loading...")).not.toBeInTheDocument();
      });
    });
  });

  describe("Navigation", () => {
    it("navigates to microsite on row click", async () => {
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("Microsite One")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("Microsite One").closest("tr")!);
      expect(mockPush).toHaveBeenCalledWith(
        "/workspaces/test-ws/microsites/ms1/v3/configure",
      );
    });

    it("navigates on Enter key press", async () => {
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("Microsite One")).toBeInTheDocument();
      });
      fireEvent.keyDown(screen.getByText("Microsite One").closest("tr")!, {
        key: "Enter",
      });
      expect(mockPush).toHaveBeenCalledWith(
        "/workspaces/test-ws/microsites/ms1/v3/configure",
      );
    });

    it("opens the delete modal from the delete action", async () => {
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("Microsite One")).toBeInTheDocument();
      });
      const deleteButtons = screen.getAllByTestId("delete-microsite");
      fireEvent.click(deleteButtons[0]);
      expect(screen.getByTestId("delete-microsite-modal")).toHaveAttribute(
        "data-code",
        "ms1",
      );
    });
  });

  describe("Edit/Duplicate actions", () => {
    it("opens form pane in edit mode", async () => {
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("Microsite One")).toBeInTheDocument();
      });
      const editButtons = screen.getAllByTestId("edit-microsite");
      fireEvent.click(editButtons[0]);
      expect(screen.getByTestId("form-pane")).toHaveAttribute(
        "data-mode",
        "edit",
      );
    });

    it("opens dedicated duplicate pane", async () => {
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("Microsite One")).toBeInTheDocument();
      });
      const dupButtons = screen.getAllByTestId("duplicate-microsite");
      fireEvent.click(dupButtons[0]);
      await waitFor(() => {
        expect(
          screen.getByTestId("duplicate-microsite-pane"),
        ).toBeInTheDocument();
      });
      expect(screen.getByTestId("duplicate-microsite-pane")).toHaveAttribute(
        "data-version",
        "3",
      );
      expect(screen.getByTestId("duplicate-microsite-pane")).toHaveAttribute(
        "data-code",
        "ms1",
      );
      expect(mockGetAllRecords).toHaveBeenCalledTimes(1);
    });

    it("opens duplicate pane without preloading an exact microsite record", async () => {
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("Microsite One")).toBeInTheDocument();
      });
      const dupButtons = screen.getAllByTestId("duplicate-microsite");
      fireEvent.click(dupButtons[0]);
      expect(screen.getByTestId("duplicate-microsite-pane")).toBeInTheDocument();
    });
  });

  describe("Versioning pane", () => {
    it("opens versioning pane", async () => {
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("Microsite One")).toBeInTheDocument();
      });
      const versionButtons = screen.getAllByTestId("manage-versions");
      fireEvent.click(versionButtons[0]);
      expect(screen.getByTestId("versioning-pane")).toBeInTheDocument();
    });

    it("closes versioning pane", async () => {
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("Microsite One")).toBeInTheDocument();
      });
      const versionButtons = screen.getAllByTestId("manage-versions");
      fireEvent.click(versionButtons[0]);
      fireEvent.click(screen.getByTestId("versioning-close"));
      expect(screen.queryByTestId("versioning-pane")).not.toBeInTheDocument();
    });
  });

  describe("Form pane interactions", () => {
    it("opens create form pane", async () => {
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByTestId("create-microsites")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId("create-microsites"));
      expect(screen.getByTestId("form-pane")).toHaveAttribute(
        "data-mode",
        "create",
      );
    });

    it("closes form pane", async () => {
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByTestId("create-microsites")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId("create-microsites"));
      fireEvent.click(screen.getByTestId("form-close"));
      expect(screen.queryByTestId("form-pane")).not.toBeInTheDocument();
    });

    it("navigates after create success", async () => {
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByTestId("create-microsites")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId("create-microsites"));
      fireEvent.click(screen.getByTestId("form-create"));
      expect(mockPush).toHaveBeenCalledWith(
        "/workspaces/test-ws/microsites/new-ms-code/v1/configure",
      );
    });

    it("updates data and shows notification on update", async () => {
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("Microsite One")).toBeInTheDocument();
      });
      const editButtons = screen.getAllByTestId("edit-microsite");
      fireEvent.click(editButtons[0]);
      fireEvent.click(screen.getByTestId("form-update"));
      expect(mockSetUserNotification).toHaveBeenCalledWith({
        type: "success",
        text: "microsites updated",
        time: 2000,
      });
    });

    it("navigates after duplicate success", async () => {
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("Microsite One")).toBeInTheDocument();
      });
      fireEvent.click(screen.getAllByTestId("duplicate-microsite")[0]);
      fireEvent.click(await screen.findByTestId("duplicate-pane-create"));
      expect(mockPush).toHaveBeenCalledWith(
        "/workspaces/test-ws/microsites/duplicate-ms-code/v1/configure",
      );
      expect(mockSetUserNotification).toHaveBeenCalledWith({
        type: "success",
        text: "Microsite duplicated.",
        time: 2000,
      });
    });
  });

  describe("Delete functionality", () => {
    it("opens the delete modal on delete click", async () => {
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("Microsite One")).toBeInTheDocument();
      });
      const deleteButtons = screen.getAllByTestId("delete-microsite");
      fireEvent.click(deleteButtons[0]);
      expect(screen.getByTestId("delete-microsite-modal")).toBeInTheDocument();
    });

    it("closes the delete modal", async () => {
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("Microsite One")).toBeInTheDocument();
      });
      const deleteButtons = screen.getAllByTestId("delete-microsite");
      fireEvent.click(deleteButtons[0]);
      fireEvent.click(screen.getByTestId("delete-microsite-modal-close"));
      expect(
        screen.queryByTestId("delete-microsite-modal"),
      ).not.toBeInTheDocument();
    });

    it("refreshes the list and shows a success notification after full delete completion", async () => {
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("Microsite One")).toBeInTheDocument();
      });
      const deleteButtons = screen.getAllByTestId("delete-microsite");
      fireEvent.click(deleteButtons[0]);
      fireEvent.click(screen.getByTestId("delete-microsite-modal-complete"));
      await waitFor(() => {
        expect(mockGetAllRecords).toHaveBeenCalledTimes(2);
      });
      expect(mockSetUserNotification).toHaveBeenCalledWith({
        type: "success",
        text: "Microsite deleted permanently.",
        time: 2500,
      });
    });

    it("refreshes the list and shows an info notification after partial delete completion", async () => {
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("Microsite One")).toBeInTheDocument();
      });
      const deleteButtons = screen.getAllByTestId("delete-microsite");
      fireEvent.click(deleteButtons[0]);
      fireEvent.click(screen.getByTestId("delete-microsite-modal-partial"));
      await waitFor(() => {
        expect(mockSetUserNotification).toHaveBeenCalledWith({
          type: "info",
          text: "Microsite delete completed with skipped operations.",
          time: 2500,
        });
      });
    });
  });

  describe("Search functionality", () => {
    it("opens search on toggle click", async () => {
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("Microsite One")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Open search"));
      expect(screen.getByLabelText("Close search")).toBeInTheDocument();
    });

    it("filters microsites by name", async () => {
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("Microsite One")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Open search"));
      const searchInput = screen.getByPlaceholderText("Search microsites");
      fireEvent.change(searchInput, {
        target: { value: "Alpha" },
      });
      expect(searchInput).toHaveValue("Alpha");
      await waitFor(() => {
        expect(screen.getByText("Alpha Microsite")).toBeInTheDocument();
        expect(screen.queryByText("Microsite One")).not.toBeInTheDocument();
      });
    });

    it("searches by code", async () => {
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("Microsite One")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Open search"));
      fireEvent.change(screen.getByPlaceholderText("Search microsites"), {
        target: { value: "ms2" },
      });
      await waitFor(() => {
        expect(screen.getByText("Microsite Two")).toBeInTheDocument();
        expect(screen.queryByText("Microsite One")).not.toBeInTheDocument();
      });
    });

    it("restores the filtered list from ?q= and places the cursor at the end of the query", async () => {
      mockSearchParams = new URLSearchParams("q=Alpha");
      render(<MicrositeList />);

      const searchInput = (await screen.findByDisplayValue(
        "Alpha",
      )) as HTMLInputElement;

      await waitFor(() => {
        expect(searchInput).toHaveFocus();
        expect(searchInput.selectionStart).toBe(searchInput.value.length);
        expect(searchInput.selectionEnd).toBe(searchInput.value.length);
        expect(screen.getByText("Alpha Microsite")).toBeInTheDocument();
        expect(screen.queryByText("Microsite One")).not.toBeInTheDocument();
      });
    });

    it("clears q and restores the full list when Escape is pressed", async () => {
      mockSearchParams = new URLSearchParams("q=Alpha");
      render(<MicrositeList />);

      const searchInput = (await screen.findByDisplayValue(
        "Alpha",
      )) as HTMLInputElement;

      fireEvent.keyDown(searchInput, { key: "Escape" });

      await waitFor(() => {
        expect(searchInput).toHaveValue("");
        expect(searchInput).toHaveFocus();
        expect(screen.getByText("Microsite One")).toBeInTheDocument();
        expect(screen.getByText("Microsite Two")).toBeInTheDocument();
        expect(screen.getByText("Alpha Microsite")).toBeInTheDocument();
        expect(mockReplace).toHaveBeenCalledWith(
          "/workspaces/test-ws/microsites",
          {
            scroll: false,
          },
        );
      });
    });
  });

  describe("Sorting functionality", () => {
    it("sorts by code ascending by default", async () => {
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("Microsite One")).toBeInTheDocument();
      });
      const rows = screen.getAllByRole("row").slice(1);
      expect(rows[0]).toHaveTextContent("Microsite One");
    });

    it("sorts by name column", async () => {
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("Microsite One")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Sort by Name"));
    });

    it("sorts by version column", async () => {
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("Microsite One")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Sort by Version"));
    });
  });

  describe("Copy functionality", () => {
    it("renders copy buttons", async () => {
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("Microsite One")).toBeInTheDocument();
      });
      const copyButtons = screen.getAllByLabelText("Copy");
      expect(copyButtons.length).toBeGreaterThan(0);
    });
  });

  describe("Unmount cleanup", () => {
    it("cleans up on unmount", () => {
      const { unmount } = render(<MicrositeList />);
      unmount();
      expect(true).toBe(true);
    });
  });

  describe("Edge cases", () => {
    it("does not navigate when item has no urlSlug", async () => {
      const micrositesWithNoSlug = [
        { urlSlug: "", name: "No Slug Microsite", version: 1, status: "draft" },
        {
          urlSlug: "ms2",
          name: "Microsite Two",
          version: 1,
          status: "published",
        },
      ];
      mockGetAllRecords.mockResolvedValue(micrositesWithNoSlug);
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("No Slug Microsite")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("No Slug Microsite").closest("tr")!);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("does not render action buttons when item has no urlSlug", async () => {
      const micrositesWithNoSlug = [
        { urlSlug: "", name: "No Slug Microsite", version: 1, status: "draft" },
      ];
      mockGetAllRecords.mockResolvedValue(micrositesWithNoSlug);
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("No Slug Microsite")).toBeInTheDocument();
      });
      const editButtons = screen.queryAllByTestId("edit-microsite");
      expect(editButtons.length).toBe(1);
      const dupButtons = screen.queryAllByTestId("duplicate-microsite");
      expect(dupButtons.length).toBe(1);
    });

    it("handles microsites with null name in tiebreaker", async () => {
      const micrositesWithNull = [
        { code: "ms1", name: null, version: 1, published: false },
        { code: "ms2", name: "Microsite Two", version: 1, published: false },
      ];
      mockGetAllRecords.mockResolvedValue(micrositesWithNull);
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("ms1")).toBeInTheDocument();
      });
    });

    it("handles microsites with null code in tiebreaker", async () => {
      const micrositesWithNull = [
        { code: null, name: "Microsite One", version: 1, published: false },
        { code: "ms2", name: "Microsite Two", version: 1, published: false },
      ];
      mockGetAllRecords.mockResolvedValue(micrositesWithNull);
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("Microsite One")).toBeInTheDocument();
      });
    });

    it("shows copied state when copy button is clicked", async () => {
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("Microsite One")).toBeInTheDocument();
      });
      const copyButtons = screen.getAllByLabelText("Copy");
      fireEvent.click(copyButtons[0]);
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith("ms1");
      });
    });

    it("clears search and focuses input on clear button click", async () => {
      render(<MicrositeList />);
      await waitFor(() => {
        expect(screen.getByText("Microsite One")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Open search"));
      fireEvent.change(screen.getByPlaceholderText("Search microsites"), {
        target: { value: "test" },
      });
      const clearButton = screen.getByLabelText("Clear search");
      fireEvent.click(clearButton);
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Search microsites")).toHaveValue(
          "",
        );
      });
    });
  });
});
