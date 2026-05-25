import { render, screen, fireEvent } from "@testing-library/react";
import TableProperties from "./TableProperties";
import { TableColumn } from "@/app/template-designer/types";

jest.mock("@/app/components/SVGIcons/Delete", () => ({
  __esModule: true,
  default: () => <span data-testid="delete-icon">X</span>,
}));

jest.mock("@/app/components/SVGIcons/ChevronDown", () => ({
  __esModule: true,
  default: () => <span data-testid="chevron-down">v</span>,
}));

jest.mock("@/app/components/SVGIcons/DragHandle", () => ({
  __esModule: true,
  default: () => <span data-testid="drag-handle">=</span>,
}));

jest.mock("@/app/components/ToggleSwitch/ToggleSwitch", () => ({
  __esModule: true,
  default: ({
    id,
    isToggled,
    onToggle,
  }: {
    id: string;
    isToggled: boolean;
    onToggle: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <input
      type="checkbox"
      id={id}
      checked={isToggled}
      onChange={onToggle}
      data-testid={id}
    />
  ),
}));

jest.mock("../../StyleEditor", () => ({
  __esModule: true,
  default: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (val: string) => void;
  }) => (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      data-testid="style-editor"
    />
  ),
}));

jest.mock("../ColumnWidthSliders/ColumnWidthSliders", () => ({
  __esModule: true,
  default: ({
    columns,
    columnWidths,
    columnLabels,
    onWidthChange,
  }: {
    columns: number;
    columnWidths: number[];
    columnLabels: string[];
    onWidthChange: (widths: number[]) => void;
  }) => (
    <div data-testid="column-width-sliders">
      <span>{`${columns} columns`}</span>
      {columnLabels.map((label, idx) => (
        <span key={idx}>{label}</span>
      ))}
    </div>
  ),
}));

describe("TableProperties", () => {
  const mockColumns: TableColumn[] = [
    { id: "col1", dataKey: "name", label: "Name", alignment: "L" },
    { id: "col2", dataKey: "age", label: "Age", alignment: "R" },
  ];

  const defaultProps = {
    list: "items",
    zebraRows: false,
    showBorders: true,
    columns: mockColumns,
    columnWidths: [50, 50],
    headerStyle: "font-weight:bold",
    rowCellStyle: "",
    onListBindingChange: jest.fn(),
    onZebraRowsChange: jest.fn(),
    onShowBordersChange: jest.fn(),
    onColumnsChange: jest.fn(),
    onColumnWidthChange: jest.fn(),
    onHeaderStyleChange: jest.fn(),
    onRowCellStyleChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("List binding", () => {
    it("should render list input with correct value", () => {
      render(<TableProperties {...defaultProps} />);

      const input = screen.getByLabelText("List");
      expect(input).toHaveValue("items");
    });

    it("should call onListBindingChange when list input changes", () => {
      render(<TableProperties {...defaultProps} />);

      const input = screen.getByLabelText("List");
      fireEvent.change(input, { target: { value: "newList" } });

      expect(defaultProps.onListBindingChange).toHaveBeenCalledWith("newList");
    });
  });

  describe("Toggle switches", () => {
    it("should render zebra rows toggle with correct state", () => {
      render(<TableProperties {...defaultProps} zebraRows={true} />);

      const toggle = screen.getByTestId("table-zebra-rows");
      expect(toggle).toBeChecked();
    });

    it("should call onZebraRowsChange when zebra rows toggle changes", () => {
      render(<TableProperties {...defaultProps} />);

      const toggle = screen.getByTestId("table-zebra-rows");
      fireEvent.click(toggle);

      expect(defaultProps.onZebraRowsChange).toHaveBeenCalledWith(true);
    });

    it("should render show borders toggle with correct state", () => {
      render(<TableProperties {...defaultProps} showBorders={false} />);

      const toggle = screen.getByTestId("table-show-borders");
      expect(toggle).not.toBeChecked();
    });

    it("should call onShowBordersChange when show borders toggle changes", () => {
      render(<TableProperties {...defaultProps} />);

      const toggle = screen.getByTestId("table-show-borders");
      fireEvent.click(toggle);

      expect(defaultProps.onShowBordersChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Column width sliders", () => {
    it("should render column width sliders when columns exist", () => {
      render(<TableProperties {...defaultProps} />);

      expect(screen.getByTestId("column-width-sliders")).toBeInTheDocument();
      expect(screen.getByText("2 columns")).toBeInTheDocument();
    });

    it("should not render column width sliders when no columns", () => {
      render(<TableProperties {...defaultProps} columns={[]} />);

      expect(
        screen.queryByTestId("column-width-sliders"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Cell styles section", () => {
    it("should render cell styles section", () => {
      render(<TableProperties {...defaultProps} />);

      expect(screen.getByText("Cell Styles")).toBeInTheDocument();
      expect(screen.getByText("Header Cells")).toBeInTheDocument();
      expect(screen.getByText("Row Cells")).toBeInTheDocument();
    });

    it("should expand header style editor when clicked", () => {
      render(<TableProperties {...defaultProps} />);

      const headerButton = screen.getByText("Header Cells").closest("button");
      fireEvent.click(headerButton!);

      const styleEditors = screen.getAllByTestId("style-editor");
      expect(styleEditors.length).toBeGreaterThan(0);
    });

    it("should collapse header style editor when clicked again", () => {
      render(<TableProperties {...defaultProps} />);

      const headerButton = screen.getByText("Header Cells").closest("button");
      fireEvent.click(headerButton!);
      fireEvent.click(headerButton!);

      expect(screen.queryAllByTestId("style-editor")).toHaveLength(0);
    });

    it("should expand row style editor when clicked", () => {
      render(<TableProperties {...defaultProps} />);

      const rowButton = screen.getByText("Row Cells").closest("button");
      fireEvent.click(rowButton!);

      const styleEditors = screen.getAllByTestId("style-editor");
      expect(styleEditors.length).toBeGreaterThan(0);
    });

    it("should call onHeaderStyleChange when header style changes", () => {
      render(<TableProperties {...defaultProps} />);

      const headerButton = screen.getByText("Header Cells").closest("button");
      fireEvent.click(headerButton!);

      const styleEditor = screen.getByTestId("style-editor");
      fireEvent.change(styleEditor, { target: { value: "color:red" } });

      expect(defaultProps.onHeaderStyleChange).toHaveBeenCalledWith(
        "color:red",
      );
    });

    it("should call onRowCellStyleChange when row style changes", () => {
      render(<TableProperties {...defaultProps} />);

      const rowButton = screen.getByText("Row Cells").closest("button");
      fireEvent.click(rowButton!);

      const styleEditor = screen.getByTestId("style-editor");
      fireEvent.change(styleEditor, { target: { value: "padding:10px" } });

      expect(defaultProps.onRowCellStyleChange).toHaveBeenCalledWith(
        "padding:10px",
      );
    });

    it("should switch from header to row style editor", () => {
      render(<TableProperties {...defaultProps} />);

      const headerButton = screen.getByText("Header Cells").closest("button");
      const rowButton = screen.getByText("Row Cells").closest("button");

      fireEvent.click(headerButton!);
      expect(screen.getAllByTestId("style-editor")).toHaveLength(1);

      fireEvent.click(rowButton!);
      expect(screen.getAllByTestId("style-editor")).toHaveLength(1);
    });
  });

  describe("Columns section", () => {
    it("should render columns section with add button", () => {
      render(<TableProperties {...defaultProps} />);

      expect(screen.getByText("Columns")).toBeInTheDocument();
      expect(screen.getByText("Add")).toBeInTheDocument();
    });

    it("should render all columns", () => {
      render(<TableProperties {...defaultProps} />);

      expect(screen.getAllByText("Name")).toHaveLength(2);
      expect(screen.getAllByText("Age")).toHaveLength(2);
    });

    it("should add new column when add button clicked", () => {
      render(<TableProperties {...defaultProps} />);

      const addButton = screen.getByText("Add").closest("button");
      fireEvent.click(addButton!);

      expect(defaultProps.onColumnsChange).toHaveBeenCalled();
      const callArgs = defaultProps.onColumnsChange.mock.calls[0];
      expect(callArgs[0]).toHaveLength(3);
      expect(callArgs[1]).toEqual([40, 30, 30]);
    });
  });

  describe("Column expansion", () => {
    it("should expand column when clicked", () => {
      render(<TableProperties {...defaultProps} />);

      const nameColumns = screen.getAllByText("Name");
      const nameColumn = nameColumns[1].closest("button");
      fireEvent.click(nameColumn!);

      expect(screen.getByPlaceholderText("Label")).toBeInTheDocument();
    });

    it("should collapse column when clicked again", () => {
      render(<TableProperties {...defaultProps} />);

      const nameColumns = screen.getAllByText("Name");
      const nameColumn = nameColumns[1].closest("button");
      fireEvent.click(nameColumn!);
      fireEvent.click(nameColumn!);

      expect(screen.queryByPlaceholderText("Label")).not.toBeInTheDocument();
    });

    it("should expand multiple columns simultaneously", () => {
      render(<TableProperties {...defaultProps} />);

      const nameColumns = screen.getAllByText("Name");
      const ageColumns = screen.getAllByText("Age");
      const nameColumn = nameColumns[1].closest("button");
      const ageColumn = ageColumns[1].closest("button");

      fireEvent.click(nameColumn!);
      fireEvent.click(ageColumn!);

      expect(screen.getAllByPlaceholderText("Label")).toHaveLength(2);
    });

    it("should auto-expand new column after adding", () => {
      const { rerender } = render(<TableProperties {...defaultProps} />);

      const addButton = screen.getByText("Add").closest("button");
      fireEvent.click(addButton!);

      const newColumns = [
        ...mockColumns,
        { id: "col3", dataKey: "", label: "", alignment: "L" as const },
      ];

      rerender(<TableProperties {...defaultProps} columns={newColumns} />);

      const newColumn = screen.getByText("Column #3").closest("button");
      fireEvent.click(newColumn!);

      expect(screen.getAllByPlaceholderText("Label")).toHaveLength(1);
    });
  });

  describe("Column editing", () => {
    it("should update column label", () => {
      render(<TableProperties {...defaultProps} />);

      const nameColumns = screen.getAllByText("Name");
      const nameColumn = nameColumns[1].closest("button");
      fireEvent.click(nameColumn!);

      const labelInput = screen.getAllByPlaceholderText("Label")[0];
      fireEvent.change(labelInput, { target: { value: "Full Name" } });

      expect(defaultProps.onColumnsChange).toHaveBeenCalled();
      const updatedColumns = defaultProps.onColumnsChange.mock.calls[0][0];
      expect(updatedColumns[0].label).toBe("Full Name");
    });

    it("should update column dataKey", () => {
      render(<TableProperties {...defaultProps} />);

      const nameColumns = screen.getAllByText("Name");
      const nameColumn = nameColumns[1].closest("button");
      fireEvent.click(nameColumn!);

      const valueInput = screen.getByPlaceholderText(
        /e\.g\., \$\{item\.value\}/,
      );
      fireEvent.change(valueInput, { target: { value: "${item.fullName}" } });

      expect(defaultProps.onColumnsChange).toHaveBeenCalled();
      const updatedColumns = defaultProps.onColumnsChange.mock.calls[0][0];
      expect(updatedColumns[0].dataKey).toBe("${item.fullName}");
    });

    it("should update column alignment to C", () => {
      render(<TableProperties {...defaultProps} />);

      const nameColumns = screen.getAllByText("Name");
      const nameColumn = nameColumns[1].closest("button");
      fireEvent.click(nameColumn!);

      const centerButton = screen.getAllByText("C")[0].closest("button");
      fireEvent.click(centerButton!);

      expect(defaultProps.onColumnsChange).toHaveBeenCalled();
      const updatedColumns = defaultProps.onColumnsChange.mock.calls[0][0];
      expect(updatedColumns[0].alignment).toBe("C");
    });

    it("should update column alignment to R", () => {
      render(<TableProperties {...defaultProps} />);

      const nameColumns = screen.getAllByText("Name");
      const nameColumn = nameColumns[1].closest("button");
      fireEvent.click(nameColumn!);

      const rightButton = screen.getAllByText("R")[0].closest("button");
      fireEvent.click(rightButton!);

      expect(defaultProps.onColumnsChange).toHaveBeenCalled();
      const updatedColumns = defaultProps.onColumnsChange.mock.calls[0][0];
      expect(updatedColumns[0].alignment).toBe("R");
    });
  });

  describe("Column deletion", () => {
    it("should remove column when delete button clicked", () => {
      render(<TableProperties {...defaultProps} />);

      const deleteButtons = screen.getAllByTestId("delete-icon");
      fireEvent.click(deleteButtons[0].closest("button")!);

      expect(defaultProps.onColumnsChange).toHaveBeenCalled();
      const callArgs = defaultProps.onColumnsChange.mock.calls[0];
      expect(callArgs[0]).toHaveLength(1);
      expect(callArgs[0][0].id).toBe("col2");
      expect(callArgs[1]).toEqual([100]);
    });

    it("should recalculate column widths when column removed", () => {
      render(<TableProperties {...defaultProps} />);

      const deleteButtons = screen.getAllByTestId("delete-icon");
      fireEvent.click(deleteButtons[1].closest("button")!);

      expect(defaultProps.onColumnsChange).toHaveBeenCalled();
      const callArgs = defaultProps.onColumnsChange.mock.calls[0];
      expect(callArgs[1]).toEqual([100]);
    });
  });

  describe("Column display", () => {
    it("should display column label if available", () => {
      render(<TableProperties {...defaultProps} />);

      expect(screen.getAllByText("Name").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Age").length).toBeGreaterThan(0);
    });

    it("should display fallback label for column without label", () => {
      const columnsWithoutLabel: TableColumn[] = [
        { id: "col1", dataKey: "name", label: "", alignment: "L" },
      ];

      render(
        <TableProperties {...defaultProps} columns={columnsWithoutLabel} />,
      );

      expect(screen.getByText("Column #1")).toBeInTheDocument();
    });
  });
});
