import { render, screen, fireEvent } from "@testing-library/react";
import DataListTable from "./DataListTable";
import { ColumnConfig, ActionConfig } from "./types";

jest.mock(
  "@/app/components/InternalComponents/InlineLoader/InlineLoader",
  () => ({
    __esModule: true,
    default: () => <span data-testid="inline-loader">Loading</span>,
  }),
);

jest.mock("@/app/components/SVGIcons/ChevronUpSolid", () => ({
  __esModule: true,
  default: () => <span>▲</span>,
}));

jest.mock("@/app/components/SVGIcons/ChevronDownSolid", () => ({
  __esModule: true,
  default: () => <span>▼</span>,
}));

interface TestItem {
  id: string;
  name: string;
  value: number;
}

const ITEMS: TestItem[] = [
  { id: "1", name: "Alpha", value: 10 },
  { id: "2", name: "Beta", value: 20 },
];

const COLUMNS: ColumnConfig<TestItem>[] = [
  { key: "name", label: "Name", sortable: true },
  { key: "value", label: "Value" },
];

const defaultProps = {
  columns: COLUMNS,
  displayedData: ITEMS,
  getItemKey: (item: TestItem) => item.id,
  onRowClick: jest.fn(),
  handleRowKeyDown: jest.fn(),
  handleSort: jest.fn(),
  getSortDirection: jest.fn().mockReturnValue(null),
  confirmDeleteKey: null,
  deletingKey: null,
  onConfirmDelete: jest.fn(),
  onCancelDelete: jest.fn(),
  hasSearchTerm: false,
  loading: false,
};

describe("DataListTable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state", () => {
    render(<DataListTable {...defaultProps} loading displayedData={[]} />);
    expect(screen.getByTestId("inline-loader")).toBeInTheDocument();
    expect(screen.getByText("loading...")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    render(<DataListTable {...defaultProps} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Value")).toBeInTheDocument();
  });

  it("renders data rows", () => {
    render(<DataListTable {...defaultProps} />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("renders default cell values for non-render columns", () => {
    render(<DataListTable {...defaultProps} />);
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
  });

  it("renders custom render function for columns", () => {
    const columnsWithRender: ColumnConfig<TestItem>[] = [
      {
        key: "name",
        label: "Name",
        render: (item) => (
          <span data-testid={`custom-${item.id}`}>{item.name}!</span>
        ),
      },
    ];
    render(<DataListTable {...defaultProps} columns={columnsWithRender} />);
    expect(screen.getByTestId("custom-1")).toHaveTextContent("Alpha!");
  });

  it("renders em dash for null/undefined values", () => {
    const itemsWithNull = [
      { id: "3", name: null as unknown as string, value: 5 },
    ];
    render(<DataListTable {...defaultProps} displayedData={itemsWithNull} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows empty state text when no data and no search", () => {
    render(
      <DataListTable
        {...defaultProps}
        displayedData={[]}
        emptyText="Nothing here."
      />,
    );
    expect(screen.getByText("Nothing here.")).toBeInTheDocument();
  });

  it("shows empty search text when no data and search term active", () => {
    render(
      <DataListTable
        {...defaultProps}
        displayedData={[]}
        hasSearchTerm
        emptySearchText="No results found."
      />,
    );
    expect(screen.getByText("No results found.")).toBeInTheDocument();
  });

  it("shows error text when error is provided", () => {
    render(
      <DataListTable
        {...defaultProps}
        displayedData={[]}
        error="Something went wrong"
      />,
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("calls onRowClick when a row is clicked", () => {
    render(<DataListTable {...defaultProps} />);
    fireEvent.click(screen.getByText("Alpha").closest("tr")!);
    expect(defaultProps.onRowClick).toHaveBeenCalledWith(ITEMS[0]);
  });

  it("calls handleSort when sortable header is clicked", () => {
    render(<DataListTable {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Sort by Name" }));
    expect(defaultProps.handleSort).toHaveBeenCalledWith("name");
  });

  it("renders Actions column when actions are provided", () => {
    const actions: ActionConfig<TestItem>[] = [
      {
        key: "delete",
        icon: <span>🗑</span>,
        label: (item) => `Delete ${item.name}`,
        title: (item) => `Delete ${item.name}`,
        onClick: jest.fn(),
        isDanger: true,
      },
    ];
    render(<DataListTable {...defaultProps} actions={actions} />);
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("does not render Actions column when no actions", () => {
    render(<DataListTable {...defaultProps} actions={undefined} />);
    expect(screen.queryByText("Actions")).not.toBeInTheDocument();
  });

  it("calls action onClick when action button is clicked", () => {
    const mockActionClick = jest.fn();
    const actions: ActionConfig<TestItem>[] = [
      {
        key: "remove",
        icon: <span>X</span>,
        label: (item) => `Remove ${item.name}`,
        title: (item) => `Remove ${item.name}`,
        onClick: mockActionClick,
      },
    ];
    render(<DataListTable {...defaultProps} actions={actions} />);
    fireEvent.click(screen.getByLabelText("Remove Alpha"));
    expect(mockActionClick).toHaveBeenCalledTimes(1);
  });

  it("renders delete confirmation when confirmDeleteKey matches", () => {
    const actions: ActionConfig<TestItem>[] = [
      {
        key: "delete",
        icon: <span>🗑</span>,
        label: () => "Delete",
        title: () => "Delete",
        onClick: jest.fn(),
        isDanger: true,
      },
    ];
    render(
      <DataListTable
        {...defaultProps}
        actions={actions}
        confirmDeleteKey="1"
      />,
    );
    expect(screen.getByTestId("confirm-button-yes")).toBeInTheDocument();
    expect(screen.getByTestId("confirm-button-cancel")).toBeInTheDocument();
  });

  it("calls handleRowKeyDown when key is pressed on a row", () => {
    render(<DataListTable {...defaultProps} />);
    fireEvent.keyDown(screen.getByText("Alpha").closest("tr")!, {
      key: "Enter",
    });
    expect(defaultProps.handleRowKeyDown).toHaveBeenCalledTimes(1);
  });

  it("renders centered class for centered columns", () => {
    const centeredColumns: ColumnConfig<TestItem>[] = [
      { key: "value", label: "Value", centered: true },
    ];
    render(<DataListTable {...defaultProps} columns={centeredColumns} />);
    const th = screen.getByText("Value").closest("th");
    expect(th?.className).toContain("centered");
  });

  it("disables action button when disabled function returns true", () => {
    const actions: ActionConfig<TestItem>[] = [
      {
        key: "delete",
        icon: <span>X</span>,
        label: () => "Delete",
        title: () => "Delete item",
        onClick: jest.fn(),
        disabled: () => true,
      },
    ];
    render(<DataListTable {...defaultProps} actions={actions} />);
    const buttons = screen.getAllByTitle("Delete item");
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });
});
