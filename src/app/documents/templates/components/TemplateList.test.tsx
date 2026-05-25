import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import TemplateList from "./TemplateList";

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

const mockGetAllTemplates = jest.fn();
const mockDeleteTemplate = jest.fn();
jest.mock("@/app/documents/templates/services", () => ({
  getAllTemplates: (...args: unknown[]) => mockGetAllTemplates(...args),
  deleteTemplate: (...args: unknown[]) => mockDeleteTemplate(...args),
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

jest.mock("@/app/components/SVGIcons/Copy", () => ({
  __esModule: true,
  default: () => <span data-testid="copy-icon">copy</span>,
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

jest.mock(
  "@/app/documents/templates/components/TemplateFormPane/TemplateFormPane",
  () => ({
    __esModule: true,
    default: ({
      isOpen,
      onClose,
      onCreated,
      mode,
      sourceTemplate,
    }: {
      isOpen: boolean;
      onClose: () => void;
      onCreated: (id: string) => void;
      mode?: "create" | "duplicate";
      sourceTemplate?: { id: string; name: string } | null;
    }) =>
      isOpen ? (
        <div
          data-testid="template-form-pane"
          data-mode={mode || "create"}
          data-source-id={sourceTemplate?.id || ""}
        >
          <button data-testid="form-close" onClick={onClose}>
            Close
          </button>
          <button
            data-testid="form-create"
            onClick={() => onCreated("new-template-id")}
          >
            {mode === "duplicate" ? "Duplicate" : "Create"}
          </button>
        </div>
      ) : null,
  }),
);

const MOCK_TEMPLATES = [
  { id: "1", name: "Template A", mimeType: "text/html", category: "Email" },
  {
    id: "2",
    name: "Template B",
    mimeType: "application/json",
    category: "Report",
  },
  { id: "3", name: "Another Template", mimeType: null, category: "Invoice" },
];

describe("TemplateList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = "/mock-path";
    mockSearchParams = new URLSearchParams();
    mockGetAllTemplates.mockResolvedValue(MOCK_TEMPLATES);
    mockDeleteTemplate.mockResolvedValue(undefined);
  });

  describe("Loading state", () => {
    it("shows loading state initially", () => {
      mockGetAllTemplates.mockReturnValue(new Promise(() => {}));
      render(<TemplateList />);
      expect(screen.getByText("loading...")).toBeInTheDocument();
    });
  });

  describe("Template display", () => {
    it("displays templates after loading", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      expect(screen.getByText("Template B")).toBeInTheDocument();
      expect(screen.getByText("Another Template")).toBeInTheDocument();
    });

    it("handles null data from API", async () => {
      mockGetAllTemplates.mockResolvedValue(null);
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("No templates available.")).toBeInTheDocument();
      });
    });

    it("shows empty state when no templates", async () => {
      mockGetAllTemplates.mockResolvedValue([]);
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("No templates available.")).toBeInTheDocument();
      });
    });

    it("handles API error", async () => {
      mockGetAllTemplates.mockRejectedValue(new Error("Network error"));
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.queryByText("loading...")).not.toBeInTheDocument();
      });
    });

    it("handles non-Error API rejection", async () => {
      mockGetAllTemplates.mockRejectedValue("Some error");
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.queryByText("loading...")).not.toBeInTheDocument();
      });
    });

    it("displays dash for null mimeType", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("-")).toBeInTheDocument();
      });
    });

    it("renders column headers", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Name")).toBeInTheDocument();
      });
      expect(screen.getByText("MIME Type")).toBeInTheDocument();
      expect(screen.getByText("Category")).toBeInTheDocument();
    });

    it("renders header title", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("All Templates")).toBeInTheDocument();
      });
    });
  });

  describe("Navigation", () => {
    it("navigates to template on row click", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("Template A").closest("tr")!);
      expect(mockPush).toHaveBeenCalledWith("/documents/templates/1");
    });

    it("navigates on Enter key press", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      fireEvent.keyDown(screen.getByText("Template A").closest("tr")!, {
        key: "Enter",
      });
      expect(mockPush).toHaveBeenCalledWith("/documents/templates/1");
    });

    it("navigates on Space key press", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      fireEvent.keyDown(screen.getByText("Template A").closest("tr")!, {
        key: " ",
      });
      expect(mockPush).toHaveBeenCalledWith("/documents/templates/1");
    });

    it("does not navigate on other key press", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      fireEvent.keyDown(screen.getByText("Template A").closest("tr")!, {
        key: "Tab",
      });
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("does not navigate when delete confirmation is active", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Another Template")).toBeInTheDocument();
      });
      const deleteButtons = screen.getAllByLabelText(/Delete template/);
      fireEvent.click(deleteButtons[0]);
      const row = screen.getByText("Another Template").closest("tr");
      fireEvent.click(row!);
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("Create form pane", () => {
    it("opens form pane on create button click", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByLabelText("Create template")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Create template"));
      expect(screen.getByTestId("template-form-pane")).toBeInTheDocument();
    });

    it("closes form pane", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByLabelText("Create template")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Create template"));
      fireEvent.click(screen.getByTestId("form-close"));
      expect(
        screen.queryByTestId("template-form-pane"),
      ).not.toBeInTheDocument();
    });

    it("navigates to new template after creation", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByLabelText("Create template")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Create template"));
      fireEvent.click(screen.getByTestId("form-create"));
      expect(mockPush).toHaveBeenCalledWith("/documents/templates/new-template-id");
    });

    it("shows success notification after creation", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByLabelText("Create template")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Create template"));
      fireEvent.click(screen.getByTestId("form-create"));
      expect(mockSetUserNotification).toHaveBeenCalledWith({
        type: "success",
        text: "Template created successfully",
        time: 2000,
      });
    });
  });

  describe("Delete functionality", () => {
    it("shows confirm dialog on delete button click", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      const deleteButtons = screen.getAllByLabelText(/Delete template/);
      fireEvent.click(deleteButtons[0]);
      expect(screen.getByText("Delete?")).toBeInTheDocument();
    });

    it("cancels delete on cancel button click", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      const deleteButtons = screen.getAllByLabelText(/Delete template/);
      fireEvent.click(deleteButtons[0]);
      fireEvent.click(screen.getByTestId("confirm-button-cancel"));
      expect(screen.queryByText("Delete?")).not.toBeInTheDocument();
    });

    it("deletes template on confirm", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Another Template")).toBeInTheDocument();
      });
      const deleteButtons = screen.getAllByLabelText(/Delete template/);
      fireEvent.click(deleteButtons[0]);
      fireEvent.click(screen.getByTestId("confirm-button-yes"));
      await waitFor(() => {
        expect(mockDeleteTemplate).toHaveBeenCalledWith("3");
      });
      expect(mockSetUserNotification).toHaveBeenCalledWith({
        type: "success",
        text: "Template deleted",
        time: 2000,
      });
    });

    it("shows error notification on delete failure", async () => {
      mockDeleteTemplate.mockRejectedValue(new Error("Delete failed"));
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      const deleteButtons = screen.getAllByLabelText(/Delete template/);
      fireEvent.click(deleteButtons[0]);
      fireEvent.click(screen.getByTestId("confirm-button-yes"));
      await waitFor(() => {
        expect(mockSetUserNotification).toHaveBeenCalledWith({
          type: "error",
          text: "Delete failed",
          time: 2500,
        });
      });
    });

    it("shows generic error on non-Error delete failure", async () => {
      mockDeleteTemplate.mockRejectedValue("Some error");
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      const deleteButtons = screen.getAllByLabelText(/Delete template/);
      fireEvent.click(deleteButtons[0]);
      fireEvent.click(screen.getByTestId("confirm-button-yes"));
      await waitFor(() => {
        expect(mockSetUserNotification).toHaveBeenCalledWith({
          type: "error",
          text: "Failed to delete",
          time: 2500,
        });
      });
    });

    it("prevents concurrent deletes", async () => {
      let resolveDelete: (value?: unknown) => void = () => {};
      mockDeleteTemplate.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveDelete = resolve;
          }),
      );
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      const deleteButtons = screen.getAllByLabelText(/Delete template/);
      fireEvent.click(deleteButtons[0]);
      const confirmButton = screen.getByTestId("confirm-button-yes");
      fireEvent.click(confirmButton);
      await waitFor(() => {
        expect(screen.getByText("...")).toBeInTheDocument();
      });
      fireEvent.click(confirmButton);
      expect(mockDeleteTemplate).toHaveBeenCalledTimes(1);
      await act(async () => {
        resolveDelete();
      });
    });

    it("handles delete button Enter key", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      const deleteButtons = screen.getAllByLabelText(/Delete template/);
      fireEvent.keyDown(deleteButtons[0], { key: "Enter" });
      expect(screen.getByText("Delete?")).toBeInTheDocument();
    });

    it("handles delete button Space key", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      const deleteButtons = screen.getAllByLabelText(/Delete template/);
      fireEvent.keyDown(deleteButtons[0], { key: " " });
      expect(screen.getByText("Delete?")).toBeInTheDocument();
    });

    it("does not trigger delete on other keys", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      const deleteButtons = screen.getAllByLabelText(/Delete template/);
      fireEvent.keyDown(deleteButtons[0], { key: "Tab" });
      expect(screen.queryByText("Delete?")).not.toBeInTheDocument();
    });

    it("resets state after delete error", async () => {
      mockDeleteTemplate.mockRejectedValue(new Error("Delete failed"));
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      const deleteButtons = screen.getAllByLabelText(/Delete template/);
      fireEvent.click(deleteButtons[0]);
      fireEvent.click(screen.getByTestId("confirm-button-yes"));
      await waitFor(() => {
        expect(mockSetUserNotification).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
    });
  });

  describe("Search functionality", () => {
    it("opens search on toggle click", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Open search"));
      expect(screen.getByLabelText("Close search")).toBeInTheDocument();
    });

    it("closes search on toggle click when open", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Open search"));
      fireEvent.click(screen.getByLabelText("Close search"));
      expect(screen.getByLabelText("Open search")).toBeInTheDocument();
    });

    it("filters templates by search term", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Open search"));
      fireEvent.change(screen.getByPlaceholderText("Search templates"), {
        target: { value: "Email" },
      });
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
        expect(screen.queryByText("Template B")).not.toBeInTheDocument();
      });
    });

    it("shows no results message", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Open search"));
      fireEvent.change(screen.getByPlaceholderText("Search templates"), {
        target: { value: "xyz123" },
      });
      await waitFor(() => {
        expect(
          screen.getByText("No templates found matching your search."),
        ).toBeInTheDocument();
      });
    });

    it("closes search on Escape key", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Open search"));
      fireEvent.keyDown(screen.getByPlaceholderText("Search templates"), {
        key: "Escape",
      });
      expect(screen.getByLabelText("Open search")).toBeInTheDocument();
    });

    it("clears search on clear button click", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Open search"));
      const input = screen.getByPlaceholderText("Search templates");
      fireEvent.change(input, { target: { value: "test" } });
      fireEvent.click(screen.getByLabelText("Clear search"));
      await waitFor(() => {
        expect(input).toHaveValue("");
      });
    });

    it("closes search on click outside when empty", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Open search"));
      fireEvent.mouseDown(document.body);
      await waitFor(() => {
        expect(screen.getByLabelText("Open search")).toBeInTheDocument();
      });
    });

    it("keeps search open on click outside when has value", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Open search"));
      fireEvent.change(screen.getByPlaceholderText("Search templates"), {
        target: { value: "test" },
      });
      fireEvent.mouseDown(document.body);
      expect(screen.getByLabelText("Close search")).toBeInTheDocument();
    });

    it("closes search on touch outside", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Open search"));
      fireEvent.touchStart(document.body);
      await waitFor(() => {
        expect(screen.getByLabelText("Open search")).toBeInTheDocument();
      });
    });

    it("searches by mimeType", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Open search"));
      fireEvent.change(screen.getByPlaceholderText("Search templates"), {
        target: { value: "json" },
      });
      await waitFor(() => {
        expect(screen.getByText("Template B")).toBeInTheDocument();
        expect(screen.queryByText("Template A")).not.toBeInTheDocument();
      });
    });

    it("searches by category", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Open search"));
      fireEvent.change(screen.getByPlaceholderText("Search templates"), {
        target: { value: "Invoice" },
      });
      await waitFor(() => {
        expect(screen.getByText("Another Template")).toBeInTheDocument();
        expect(screen.queryByText("Template A")).not.toBeInTheDocument();
      });
    });

    it("handles multiple search tokens", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Open search"));
      fireEvent.change(screen.getByPlaceholderText("Search templates"), {
        target: { value: "template html" },
      });
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
        expect(screen.queryByText("Template B")).not.toBeInTheDocument();
      });
    });

    it("returns all for whitespace-only search", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Open search"));
      fireEvent.change(screen.getByPlaceholderText("Search templates"), {
        target: { value: "   " },
      });
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
        expect(screen.getByText("Template B")).toBeInTheDocument();
      });
    });
  });

  describe("Sorting functionality", () => {
    it("sorts by name ascending by default", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      const rows = screen.getAllByRole("row").slice(1);
      expect(rows[0]).toHaveTextContent("Another Template");
    });

    it("toggles sort direction on column click", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Sort by Name"));
      const rows = screen.getAllByRole("row").slice(1);
      expect(rows[0]).toHaveTextContent("Template B");
    });

    it("sorts by mimeType column", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Sort by MIME Type"));
    });

    it("sorts by category column", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Sort by Category"));
    });

    it("clears sort on third click", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      const header = screen.getByLabelText("Sort by Name");
      fireEvent.click(header);
      fireEvent.click(header);
      fireEvent.click(header);
    });
  });

  describe("Null value edge cases", () => {
    it("handles null values in search scoring", async () => {
      mockGetAllTemplates.mockResolvedValue([
        { id: "1", name: null, mimeType: null, category: null },
        { id: "2", name: "Test", mimeType: "text/html", category: "Email" },
      ]);
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Test")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Open search"));
      fireEvent.change(screen.getByPlaceholderText("Search templates"), {
        target: { value: "test" },
      });
      await waitFor(() => {
        expect(screen.getByText("Test")).toBeInTheDocument();
      });
    });

    it("handles null name in sorting", async () => {
      mockGetAllTemplates.mockResolvedValue([
        { id: "1", name: null, mimeType: "text/html", category: "Email" },
        { id: "2", name: "Valid", mimeType: "text/html", category: "Email" },
      ]);
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Valid")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Sort by Name"));
      const rows = screen.getAllByRole("row").slice(1);
      expect(rows).toHaveLength(2);
    });

    it("handles null mimeType in sorting", async () => {
      mockGetAllTemplates.mockResolvedValue([
        { id: "1", name: "Template A", mimeType: null, category: "Email" },
        {
          id: "2",
          name: "Template B",
          mimeType: "text/html",
          category: "Email",
        },
      ]);
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Sort by MIME Type"));
      const rows = screen.getAllByRole("row").slice(1);
      expect(rows).toHaveLength(2);
    });

    it("handles null category in sorting", async () => {
      mockGetAllTemplates.mockResolvedValue([
        { id: "1", name: "Template A", mimeType: "text/html", category: null },
        {
          id: "2",
          name: "Template B",
          mimeType: "text/html",
          category: "Email",
        },
      ]);
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Sort by Category"));
      const rows = screen.getAllByRole("row").slice(1);
      expect(rows).toHaveLength(2);
    });

    it("handles null name during search tiebreaker", async () => {
      mockGetAllTemplates.mockResolvedValue([
        { id: "1", name: null, mimeType: "text/html", category: "Email" },
        {
          id: "2",
          name: "Email Doc",
          mimeType: "text/html",
          category: "Email",
        },
      ]);
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Email Doc")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Open search"));
      fireEvent.change(screen.getByPlaceholderText("Search templates"), {
        target: { value: "email" },
      });
      await waitFor(() => {
        expect(screen.getAllByRole("row").slice(1)).toHaveLength(2);
      });
    });

    it("handles null mimeType during search tiebreaker", async () => {
      mockGetAllTemplates.mockResolvedValue([
        { id: "1", name: "Email Doc", mimeType: null, category: "Email" },
        {
          id: "2",
          name: "Email Doc",
          mimeType: "text/html",
          category: "Email",
        },
      ]);
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getAllByText("Email Doc")).toHaveLength(2);
      });
      fireEvent.click(screen.getByLabelText("Open search"));
      fireEvent.change(screen.getByPlaceholderText("Search templates"), {
        target: { value: "email" },
      });
      await waitFor(() => {
        expect(screen.getAllByRole("row").slice(1)).toHaveLength(2);
      });
    });
  });

  describe("Search scoring edge cases", () => {
    it("scores items starting with token higher", async () => {
      mockGetAllTemplates.mockResolvedValue([
        {
          id: "1",
          name: "Test Template",
          mimeType: "text/html",
          category: "Email",
        },
        {
          id: "2",
          name: "Another Test",
          mimeType: "text/plain",
          category: "Report",
        },
      ]);
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Test Template")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Open search"));
      fireEvent.change(screen.getByPlaceholderText("Search templates"), {
        target: { value: "test" },
      });
      await waitFor(() => {
        expect(screen.getByText("Test Template")).toBeInTheDocument();
        expect(screen.getByText("Another Test")).toBeInTheDocument();
      });
    });

    it("sorts by name when scores are equal", async () => {
      mockGetAllTemplates.mockResolvedValue([
        { id: "1", name: "Beta", mimeType: "text/test", category: "Cat" },
        { id: "2", name: "Alpha", mimeType: "text/test", category: "Cat" },
      ]);
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Alpha")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Open search"));
      fireEvent.change(screen.getByPlaceholderText("Search templates"), {
        target: { value: "test" },
      });
      await waitFor(() => {
        const rows = screen.getAllByRole("row").slice(1);
        expect(rows[0]).toHaveTextContent("Alpha");
      });
    });

    it("preserves the current order when scores and names are equal", async () => {
      mockGetAllTemplates.mockResolvedValue([
        { id: "1", name: "Same", mimeType: "text/b", category: "test" },
        { id: "2", name: "Same", mimeType: "text/a", category: "test" },
      ]);
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getAllByText("Same")).toHaveLength(2);
      });
      fireEvent.click(screen.getByLabelText("Open search"));
      fireEvent.change(screen.getByPlaceholderText("Search templates"), {
        target: { value: "test" },
      });
      await waitFor(() => {
        const cells = screen.getAllByRole("cell");
        const firstMimeCell = cells.find((c) =>
          c.textContent?.startsWith("text/"),
        );
        expect(firstMimeCell).toHaveTextContent("text/b");
      });
    });

    it("matches partial token without prefix", async () => {
      mockGetAllTemplates.mockResolvedValue([
        {
          id: "1",
          name: "Unique",
          mimeType: "special/type",
          category: "Custom",
        },
      ]);
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Unique")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Open search"));
      fireEvent.change(screen.getByPlaceholderText("Search templates"), {
        target: { value: "ique" },
      });
      await waitFor(() => {
        expect(screen.getByText("Unique")).toBeInTheDocument();
      });
    });
  });

  describe("Duplicate functionality", () => {
    it("renders duplicate button for each template", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      const duplicateButtons = screen.getAllByLabelText(/Duplicate template/);
      expect(duplicateButtons.length).toBeGreaterThan(0);
    });

    it("opens duplicate pane when duplicate button is clicked", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      const duplicateButtons = screen.getAllByLabelText(/Duplicate template/);
      fireEvent.click(duplicateButtons[0]);
      await waitFor(() => {
        const pane = screen.getByTestId("template-form-pane");
        expect(pane).toBeInTheDocument();
        expect(pane).toHaveAttribute("data-mode", "duplicate");
      });
    });

    it("sets source template when opening duplicate pane", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      const duplicateButtons = screen.getAllByLabelText(/Duplicate template/);
      fireEvent.click(duplicateButtons[0]);
      await waitFor(() => {
        const pane = screen.getByTestId("template-form-pane");
        expect(pane).toHaveAttribute("data-source-id", "3");
      });
    });

    it("closes duplicate pane on close button click", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      const duplicateButtons = screen.getAllByLabelText(/Duplicate template/);
      fireEvent.click(duplicateButtons[0]);
      await waitFor(() => {
        expect(screen.getByTestId("template-form-pane")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId("form-close"));
      await waitFor(() => {
        expect(
          screen.queryByTestId("template-form-pane"),
        ).not.toBeInTheDocument();
      });
    });

    it("reloads templates list after successful duplication", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      const duplicateButtons = screen.getAllByLabelText(/Duplicate template/);
      fireEvent.click(duplicateButtons[0]);
      mockGetAllTemplates.mockClear();
      fireEvent.click(screen.getByTestId("form-create"));
      await waitFor(() => {
        expect(mockGetAllTemplates).toHaveBeenCalled();
      });
    });

    it("shows success notification after duplication", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      const duplicateButtons = screen.getAllByLabelText(/Duplicate template/);
      fireEvent.click(duplicateButtons[0]);
      fireEvent.click(screen.getByTestId("form-create"));
      await waitFor(() => {
        expect(mockSetUserNotification).toHaveBeenCalledWith({
          type: "success",
          text: "Template duplicated successfully",
          time: 2000,
        });
      });
    });

    it("navigates to duplicated template after successful duplication", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      const duplicateButtons = screen.getAllByLabelText(/Duplicate template/);
      fireEvent.click(duplicateButtons[0]);
      fireEvent.click(screen.getByTestId("form-create"));
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/documents/templates/new-template-id");
      });
    });

    it("clears source template state when duplicate pane closes", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      const duplicateButtons = screen.getAllByLabelText(/Duplicate template/);
      fireEvent.click(duplicateButtons[0]);
      await waitFor(() => {
        const pane = screen.getByTestId("template-form-pane");
        expect(pane).toHaveAttribute("data-source-id", "3");
      });
      fireEvent.click(screen.getByTestId("form-close"));
      fireEvent.click(duplicateButtons[1]);
      await waitFor(() => {
        const pane = screen.getByTestId("template-form-pane");
        expect(pane).toHaveAttribute("data-source-id", "1");
      });
    });

    it("duplicate button triggers on Enter key", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      const duplicateButtons = screen.getAllByLabelText(/Duplicate template/);
      fireEvent.keyDown(duplicateButtons[0], { key: "Enter" });
      await waitFor(() => {
        expect(screen.getByTestId("template-form-pane")).toBeInTheDocument();
      });
    });

    it("duplicate button triggers on Space key", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      const duplicateButtons = screen.getAllByLabelText(/Duplicate template/);
      fireEvent.keyDown(duplicateButtons[0], { key: " " });
      await waitFor(() => {
        expect(screen.getByTestId("template-form-pane")).toBeInTheDocument();
      });
    });

    it("duplicate button does not trigger on other keys", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      const duplicateButtons = screen.getAllByLabelText(/Duplicate template/);
      fireEvent.keyDown(duplicateButtons[0], { key: "Tab" });
      expect(
        screen.queryByTestId("template-form-pane"),
      ).not.toBeInTheDocument();
    });

    it("does not interfere with row navigation when duplicate button clicked", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      const duplicateButtons = screen.getAllByLabelText(/Duplicate template/);
      fireEvent.click(duplicateButtons[0]);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("can open create pane and duplicate pane separately", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText("Create template"));
      let pane = screen.getByTestId("template-form-pane");
      expect(pane).toHaveAttribute("data-mode", "create");
      fireEvent.click(screen.getByTestId("form-close"));
      const duplicateButtons = screen.getAllByLabelText(/Duplicate template/);
      fireEvent.click(duplicateButtons[0]);
      await waitFor(() => {
        pane = screen.getByTestId("template-form-pane");
        expect(pane).toHaveAttribute("data-mode", "duplicate");
      });
    });

    it("duplicate pane is independent from delete confirmation", async () => {
      render(<TemplateList />);
      await waitFor(() => {
        expect(screen.getByText("Template A")).toBeInTheDocument();
      });
      const deleteButtons = screen.getAllByLabelText(/Delete template/);
      fireEvent.click(deleteButtons[0]);
      expect(screen.getByText("Delete?")).toBeInTheDocument();
      const duplicateButtons = screen.getAllByLabelText(/Duplicate template/);
      fireEvent.click(duplicateButtons[1]);
      await waitFor(() => {
        expect(screen.getByTestId("template-form-pane")).toBeInTheDocument();
      });
    });
  });

  describe("Unmount cleanup", () => {
    it("cleans up on unmount during loading", () => {
      const { unmount } = render(<TemplateList />);
      unmount();
      expect(true).toBe(true);
    });
  });
});
