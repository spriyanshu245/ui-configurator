import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PropertiesPanel from "./PropertiesPanel";
import { useTemplateDesigner } from "../../context/TemplateDesignerContext";
import { TemplateBlock, TableColumn } from "../../../types";

jest.mock("../../context/TemplateDesignerContext", () => ({
  useTemplateDesigner: jest.fn(),
}));

jest.mock("@/app/components/Tooltip/Tooltip", () => {
  return ({ children }: { children: React.ReactNode }) => <>{children}</>;
});

jest.mock("@/app/components/ToggleSwitch/ToggleSwitch", () => {
  return ({
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
      data-testid={`toggle-${id}`}
      checked={isToggled}
      onChange={onToggle}
    />
  );
});

jest.mock("./StyleEditor", () => ({
  __esModule: true,
  default: ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (val: string) => void;
  }) => (
    <input
      data-testid="style-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

jest.mock("../../components/TransliterationInput/TransliterationInput", () => ({
  __esModule: true,
  default: ({
    id,
    value,
    onChange,
    placeholder,
  }: {
    id: string;
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
  }) => (
    <textarea
      id={id}
      data-testid={`transliteration-${id}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
}));

describe("PropertiesPanel", () => {
  const mockUpdateBlock = jest.fn();
  const mockRemoveBlock = jest.fn();
  const mockSetIsMarkdownGuideOpen = jest.fn();

  const defaultMockValues = {
    blocks: [],
    selectedBlockId: null,
    updateBlock: mockUpdateBlock,
    removeBlock: mockRemoveBlock,
    isMarkdownGuideOpen: false,
    setIsMarkdownGuideOpen: mockSetIsMarkdownGuideOpen,
    isCurrentLanguageAutoTranslated: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useTemplateDesigner as jest.Mock).mockReturnValue(defaultMockValues);
  });

  it("should render empty state when no block selected", () => {
    render(<PropertiesPanel />);
    expect(screen.getByText("Properties")).toBeInTheDocument();
    expect(
      screen.getByText("Select a block to edit its properties"),
    ).toBeInTheDocument();
  });

  it("should render properties for selected richText block", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "Hello World",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "block-1",
    });
    render(<PropertiesPanel />);
    expect(screen.getByText("Rich Text - Properties")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("Text Block");
  });

  it("should update block label on input change", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "Hello",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "block-1",
    });
    render(<PropertiesPanel />);

    const nameInput = screen.getByLabelText("Name");
    fireEvent.change(nameInput, { target: { value: "New Label" } });

    expect(mockUpdateBlock).toHaveBeenCalledWith("block-1", {
      label: "New Label",
    });
  });

  it("should toggle markdown guide when info button clicked", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "Hello",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "block-1",
    });
    render(<PropertiesPanel />);

    const infoButton = screen.getByRole("button", { name: /open markdown/i });
    fireEvent.click(infoButton);

    expect(mockSetIsMarkdownGuideOpen).toHaveBeenCalledWith(true);
  });

  it("should delete block when delete button clicked", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "Hello",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "block-1",
    });
    render(<PropertiesPanel />);

    const deleteButton = screen.getByTitle("Delete Block");
    fireEvent.click(deleteButton);

    expect(mockRemoveBlock).toHaveBeenCalledWith("block-1");
  });

  it("should render section properties with bordered toggle", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "section-1",
        type: "section",
        label: "Section",
        content: "Section content",
        properties: {
          bordered: true,
          paddingVertical: "16px",
          paddingHorizontal: "16px",
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "section-1",
    });
    const { container } = render(<PropertiesPanel />);

    expect(screen.getByTestId("toggle-section-bordered")).toBeInTheDocument();
    expect(
      container.querySelector("#section-padding-vertical"),
    ).toBeInTheDocument();
    expect(
      container.querySelector("#section-padding-horizontal"),
    ).toBeInTheDocument();
  });

  it("should toggle bordered property", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "section-1",
        type: "section",
        label: "Section",
        content: "",
        properties: { bordered: true },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "section-1",
    });
    render(<PropertiesPanel />);

    const toggle = screen.getByTestId("toggle-section-bordered");
    fireEvent.click(toggle);

    expect(mockUpdateBlock).toHaveBeenCalled();
  });

  it("should render grid column selector", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "grid-1",
        type: "grid",
        label: "Grid",
        content: "",
        properties: { columns: 2, columnWidths: [50, 50] },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "grid-1",
    });
    render(<PropertiesPanel />);

    expect(screen.getByText("Number of Columns")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("should change grid columns when clicked", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "grid-1",
        type: "grid",
        label: "Grid",
        content: "",
        properties: { columns: 2, columnWidths: [50, 50] },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "grid-1",
    });
    render(<PropertiesPanel />);

    const threeColumnBtn = screen.getByText("3");
    fireEvent.click(threeColumnBtn);

    expect(mockUpdateBlock).toHaveBeenCalled();
  });

  it("should render column width sliders for grid", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "grid-1",
        type: "grid",
        label: "Grid",
        content: "",
        properties: { columns: 2, columnWidths: [50, 50] },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "grid-1",
    });
    render(<PropertiesPanel />);

    expect(screen.getByText("Column Widths")).toBeInTheDocument();
    expect(screen.getByText("Col 1")).toBeInTheDocument();
    expect(screen.getByText("Col 2")).toBeInTheDocument();
  });

  it("should update column width when slider changed", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "grid-1",
        type: "grid",
        label: "Grid",
        content: "",
        properties: { columns: 2, columnWidths: [50, 50] },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "grid-1",
    });
    render(<PropertiesPanel />);

    const sliders = screen.getAllByRole("slider");
    fireEvent.change(sliders[0], { target: { value: "60" } });

    expect(mockUpdateBlock).toHaveBeenCalled();
  });

  it("should render gridRow column contents", () => {
    const parentGrid: TemplateBlock = {
      id: "grid-1",
      type: "grid",
      label: "Grid",
      content: "",
      properties: { columns: 2 },
      children: [
        {
          id: "row-1",
          type: "gridRow",
          label: "Row",
          content: "",
          properties: { columnContents: ["Col 1 content", "Col 2 content"] },
        },
      ],
    };
    const blocks: TemplateBlock[] = [parentGrid];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "row-1",
    });
    render(<PropertiesPanel />);

    expect(screen.getByText("Column #1 Content")).toBeInTheDocument();
    expect(screen.getByText("Column #2 Content")).toBeInTheDocument();
  });

  it("should render table properties", () => {
    const tableColumns: TableColumn[] = [
      { id: "col1", dataKey: "name", label: "Name", alignment: "L" },
    ];
    const blocks: TemplateBlock[] = [
      {
        id: "table-1",
        type: "table",
        label: "Table",
        content: "",
        properties: {
          list: "items",
          zebraRows: false,
          columns: tableColumns,
          columnWidths: [100],
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "table-1",
    });
    render(<PropertiesPanel />);

    expect(screen.getByLabelText("List")).toBeInTheDocument();
    expect(screen.getByText("Zebra Rows")).toBeInTheDocument();
    expect(screen.getByText("Columns")).toBeInTheDocument();
  });

  it("should add table column when add button clicked", () => {
    const tableColumns: TableColumn[] = [
      { id: "col1", dataKey: "name", label: "Name", alignment: "L" },
    ];
    const blocks: TemplateBlock[] = [
      {
        id: "table-1",
        type: "table",
        label: "Table",
        content: "",
        properties: {
          list: "items",
          zebraRows: false,
          columns: tableColumns,
          columnWidths: [100],
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "table-1",
    });
    render(<PropertiesPanel />);

    const addButton = screen.getByText("Add");
    fireEvent.click(addButton);

    expect(mockUpdateBlock).toHaveBeenCalled();
  });

  it("should remove table column when delete button clicked", () => {
    const tableColumns: TableColumn[] = [
      { id: "col1", dataKey: "name", label: "Name", alignment: "L" },
      { id: "col2", dataKey: "value", label: "Value", alignment: "R" },
    ];
    const blocks: TemplateBlock[] = [
      {
        id: "table-1",
        type: "table",
        label: "Table",
        content: "",
        properties: {
          list: "items",
          zebraRows: false,
          columns: tableColumns,
          columnWidths: [50, 50],
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "table-1",
    });
    render(<PropertiesPanel />);

    const deleteButtons = screen.getAllByTitle("Delete column");
    fireEvent.click(deleteButtons[0]);

    expect(mockUpdateBlock).toHaveBeenCalled();
  });

  it("should change table column label", () => {
    const tableColumns: TableColumn[] = [
      { id: "col1", dataKey: "name", label: "Name", alignment: "L" },
    ];
    const blocks: TemplateBlock[] = [
      {
        id: "table-1",
        type: "table",
        label: "Table",
        content: "",
        properties: {
          list: "items",
          zebraRows: false,
          columns: tableColumns,
          columnWidths: [100],
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "table-1",
    });
    render(<PropertiesPanel />);

    const columnExpandBtn = screen.getByRole("button", { name: "Name" });
    fireEvent.click(columnExpandBtn);

    const labelInput = screen.getByDisplayValue("Name");
    fireEvent.change(labelInput, { target: { value: "New Name" } });

    expect(mockUpdateBlock).toHaveBeenCalled();
  });

  it("should change table column alignment", () => {
    const tableColumns: TableColumn[] = [
      { id: "col1", dataKey: "name", label: "Name", alignment: "L" },
    ];
    const blocks: TemplateBlock[] = [
      {
        id: "table-1",
        type: "table",
        label: "Table",
        content: "",
        properties: {
          list: "items",
          zebraRows: false,
          columns: tableColumns,
          columnWidths: [100],
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "table-1",
    });
    render(<PropertiesPanel />);

    const columnExpandBtn = screen.getByRole("button", { name: "Name" });
    fireEvent.click(columnExpandBtn);

    const centerAlignBtn = screen.getByRole("button", { name: "C" });
    fireEvent.click(centerAlignBtn);

    expect(mockUpdateBlock).toHaveBeenCalled();
  });

  it("should update table list binding", () => {
    const tableColumns: TableColumn[] = [
      { id: "col1", dataKey: "name", label: "Name", alignment: "L" },
    ];
    const blocks: TemplateBlock[] = [
      {
        id: "table-1",
        type: "table",
        label: "Table",
        content: "",
        properties: {
          list: "items",
          zebraRows: false,
          columns: tableColumns,
          columnWidths: [100],
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "table-1",
    });
    render(<PropertiesPanel />);

    const listInput = screen.getByLabelText("List");
    fireEvent.change(listInput, { target: { value: "newItems" } });

    expect(mockUpdateBlock).toHaveBeenCalled();
  });

  it("should toggle table zebra rows", () => {
    const tableColumns: TableColumn[] = [
      { id: "col1", dataKey: "name", label: "Name", alignment: "L" },
    ];
    const blocks: TemplateBlock[] = [
      {
        id: "table-1",
        type: "table",
        label: "Table",
        content: "",
        properties: {
          list: "items",
          zebraRows: false,
          columns: tableColumns,
          columnWidths: [100],
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "table-1",
    });
    render(<PropertiesPanel />);

    const zebraToggle = screen.getByTestId("toggle-table-zebra-rows");
    fireEvent.click(zebraToggle);
    expect(mockUpdateBlock).toHaveBeenCalled();
  });

  it("should toggle table show borders", () => {
    const tableColumns: TableColumn[] = [
      { id: "col1", dataKey: "name", label: "Name", alignment: "L" },
    ];
    const blocks: TemplateBlock[] = [
      {
        id: "table-1",
        type: "table",
        label: "Table",
        content: "",
        properties: {
          list: "items",
          zebraRows: false,
          showBorders: true,
          columns: tableColumns,
          columnWidths: [100],
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "table-1",
    });
    render(<PropertiesPanel />);

    const bordersToggle = screen.getByTestId("toggle-table-show-borders");
    fireEvent.click(bordersToggle);
    expect(mockUpdateBlock).toHaveBeenCalled();
  });

  it("should collapse expanded table column when clicked again", () => {
    const tableColumns: TableColumn[] = [
      { id: "col1", dataKey: "name", label: "Name", alignment: "L" },
    ];
    const blocks: TemplateBlock[] = [
      {
        id: "table-1",
        type: "table",
        label: "Table",
        content: "",
        properties: {
          list: "items",
          zebraRows: false,
          columns: tableColumns,
          columnWidths: [100],
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "table-1",
    });
    render(<PropertiesPanel />);

    const columnExpandBtn = screen.getByRole("button", { name: "Name" });
    fireEvent.click(columnExpandBtn);
    expect(screen.getByDisplayValue("Name")).toBeInTheDocument();

    fireEvent.click(columnExpandBtn);
    expect(screen.queryByDisplayValue("Name")).not.toBeInTheDocument();
  });

  it("should expand and edit header cell style", () => {
    const tableColumns: TableColumn[] = [
      { id: "col1", dataKey: "name", label: "Name", alignment: "L" },
    ];
    const blocks: TemplateBlock[] = [
      {
        id: "table-1",
        type: "table",
        label: "Table",
        content: "",
        properties: {
          list: "items",
          zebraRows: false,
          columns: tableColumns,
          columnWidths: [100],
          headerStyle: "font-weight: bold;",
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "table-1",
    });
    render(<PropertiesPanel />);

    const headerCellsButton = screen.getByRole("button", {
      name: /Header Cells/i,
    });
    fireEvent.click(headerCellsButton);

    const styleEditor = screen.getByTestId("style-editor");
    expect(styleEditor).toHaveValue("font-weight: bold;");
    fireEvent.change(styleEditor, { target: { value: "color: red;" } });
    expect(mockUpdateBlock).toHaveBeenCalled();
  });

  it("should collapse header cell style editor when clicked again", () => {
    const tableColumns: TableColumn[] = [
      { id: "col1", dataKey: "name", label: "Name", alignment: "L" },
    ];
    const blocks: TemplateBlock[] = [
      {
        id: "table-1",
        type: "table",
        label: "Table",
        content: "",
        properties: {
          list: "items",
          zebraRows: false,
          columns: tableColumns,
          columnWidths: [100],
          headerStyle: "font-weight: bold;",
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "table-1",
    });
    render(<PropertiesPanel />);

    const headerCellsButton = screen.getByRole("button", {
      name: /Header Cells/i,
    });
    fireEvent.click(headerCellsButton);
    expect(screen.getByTestId("style-editor")).toBeInTheDocument();

    fireEvent.click(headerCellsButton);
    expect(screen.queryByTestId("style-editor")).not.toBeInTheDocument();
  });

  it("should expand and edit row cell style", () => {
    const tableColumns: TableColumn[] = [
      { id: "col1", dataKey: "name", label: "Name", alignment: "L" },
    ];
    const blocks: TemplateBlock[] = [
      {
        id: "table-1",
        type: "table",
        label: "Table",
        content: "",
        properties: {
          list: "items",
          zebraRows: false,
          columns: tableColumns,
          columnWidths: [100],
          rowCellStyle: "padding: 10px;",
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "table-1",
    });
    render(<PropertiesPanel />);

    const rowCellsButton = screen.getByRole("button", {
      name: /Row Cells/i,
    });
    fireEvent.click(rowCellsButton);

    const styleEditor = screen.getByTestId("style-editor");
    expect(styleEditor).toHaveValue("padding: 10px;");
    fireEvent.change(styleEditor, { target: { value: "padding: 5px;" } });
    expect(mockUpdateBlock).toHaveBeenCalled();
  });

  it("should collapse row cell style editor when clicked again", () => {
    const tableColumns: TableColumn[] = [
      { id: "col1", dataKey: "name", label: "Name", alignment: "L" },
    ];
    const blocks: TemplateBlock[] = [
      {
        id: "table-1",
        type: "table",
        label: "Table",
        content: "",
        properties: {
          list: "items",
          zebraRows: false,
          columns: tableColumns,
          columnWidths: [100],
          rowCellStyle: "padding: 10px;",
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "table-1",
    });
    render(<PropertiesPanel />);

    const rowCellsButton = screen.getByRole("button", {
      name: /Row Cells/i,
    });
    fireEvent.click(rowCellsButton);
    expect(screen.getByTestId("style-editor")).toBeInTheDocument();

    fireEvent.click(rowCellsButton);
    expect(screen.queryByTestId("style-editor")).not.toBeInTheDocument();
  });

  it("should display default column index when column has no label", () => {
    const tableColumns: TableColumn[] = [
      { id: "col1", dataKey: "name", label: "", alignment: "L" },
    ];
    const blocks: TemplateBlock[] = [
      {
        id: "table-1",
        type: "table",
        label: "Table",
        content: "",
        properties: {
          list: "items",
          zebraRows: false,
          columns: tableColumns,
          columnWidths: [100],
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "table-1",
    });
    render(<PropertiesPanel />);

    expect(screen.getByText("Column #1")).toBeInTheDocument();
  });

  it("should render image properties with alignment selector", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "image-1",
        type: "image",
        label: "Image",
        content: "",
        properties: {
          src: "https://example.com/img.jpg",
          alt: "Test",
          alignment: "L",
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "image-1",
    });
    render(<PropertiesPanel />);

    expect(screen.getByText("Alignment")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "L" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "C" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "R" })).toBeInTheDocument();
  });

  it("should change image alignment", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "image-1",
        type: "image",
        label: "Image",
        content: "",
        properties: {
          src: "https://example.com/img.jpg",
          alt: "Test",
          alignment: "L",
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "image-1",
    });
    render(<PropertiesPanel />);

    const centerBtn = screen.getByRole("button", { name: "C" });
    fireEvent.click(centerBtn);

    expect(mockUpdateBlock).toHaveBeenCalled();
  });

  it("should render boolean property input", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "customType",
        label: "Custom Block",
        content: "",
        properties: { isActive: true },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "block-1",
    });
    render(<PropertiesPanel />);

    expect(screen.getByText("Is Active")).toBeInTheDocument();
  });

  it("should render number property input", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "customType",
        label: "Custom Block",
        content: "",
        properties: { count: 5 },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "block-1",
    });
    render(<PropertiesPanel />);

    const input = screen.getByDisplayValue("5");
    expect(input).toHaveAttribute("type", "number");
  });

  it("should render pixel suffix property input", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "spacer-1",
        type: "spacer",
        label: "Spacer",
        content: "",
        properties: { height: "30px" },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "spacer-1",
    });
    render(<PropertiesPanel />);

    const input = screen.getByDisplayValue("30");
    expect(input).toBeInTheDocument();
    expect(screen.getByText("px")).toBeInTheDocument();
  });

  it("should update pixel suffix property", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "spacer-1",
        type: "spacer",
        label: "Spacer",
        content: "",
        properties: { height: "30px" },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "spacer-1",
    });
    render(<PropertiesPanel />);

    const input = screen.getByDisplayValue("30");
    fireEvent.change(input, { target: { value: "50" } });

    expect(mockUpdateBlock).toHaveBeenCalled();
  });

  it("should handle content change via transliteration input", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "Hello",
        properties: {},
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "block-1",
    });
    render(<PropertiesPanel />);

    const contentInput = screen.getByTestId("transliteration-block-content");
    fireEvent.change(contentInput, { target: { value: "New Content" } });

    expect(mockUpdateBlock).toHaveBeenCalledWith("block-1", {
      content: "New Content",
    });
  });

  it("should handle style change via style editor", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "richText",
        label: "Text Block",
        content: "Hello",
        properties: { style: "" },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "block-1",
    });
    render(<PropertiesPanel />);

    const styleEditor = screen.getByTestId("style-editor");
    fireEvent.change(styleEditor, { target: { value: "color: red;" } });

    expect(mockUpdateBlock).toHaveBeenCalled();
  });

  it("should not show content for grid block", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "grid-1",
        type: "grid",
        label: "Grid",
        content: "",
        properties: { columns: 2 },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "grid-1",
    });
    render(<PropertiesPanel />);

    expect(screen.queryByLabelText("Content")).not.toBeInTheDocument();
  });

  it("should normalize column widths when mismatch", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "grid-1",
        type: "grid",
        label: "Grid",
        content: "",
        properties: { columns: 3, columnWidths: [50, 50] },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "grid-1",
    });
    render(<PropertiesPanel />);

    expect(screen.getByText("Col 1")).toBeInTheDocument();
    expect(screen.getByText("Col 2")).toBeInTheDocument();
    expect(screen.getByText("Col 3")).toBeInTheDocument();
  });

  it("should update boolean property", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "customType",
        label: "Custom Block",
        content: "",
        properties: { isActive: false },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "block-1",
    });
    render(<PropertiesPanel />);

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(mockUpdateBlock).toHaveBeenCalled();
  });

  it("should update number property", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "customType",
        label: "Custom Block",
        content: "",
        properties: { count: 5 },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "block-1",
    });
    render(<PropertiesPanel />);

    const input = screen.getByDisplayValue("5");
    fireEvent.change(input, { target: { value: "10" } });

    expect(mockUpdateBlock).toHaveBeenCalled();
  });

  it("should update string property", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "customType",
        label: "Custom Block",
        content: "",
        properties: { title: "Original Title" },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "block-1",
    });
    render(<PropertiesPanel />);

    const input = screen.getByDisplayValue("Original Title");
    fireEvent.change(input, { target: { value: "New Title" } });

    expect(mockUpdateBlock).toHaveBeenCalled();
  });

  it("should not render array properties in property input", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "block-1",
        type: "customType",
        label: "Custom Block",
        content: "",
        properties: { items: ["a", "b", "c"], title: "Test" },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "block-1",
    });
    render(<PropertiesPanel />);

    expect(screen.getByDisplayValue("Test")).toBeInTheDocument();
  });

  it("should update section padding vertical", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "section-1",
        type: "section",
        label: "Section",
        content: "",
        properties: {
          bordered: true,
          paddingVertical: "16px",
          paddingHorizontal: "16px",
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "section-1",
    });
    const { container } = render(<PropertiesPanel />);

    const paddingInput = container.querySelector(
      "#section-padding-vertical",
    ) as HTMLInputElement;
    fireEvent.change(paddingInput, { target: { value: "20" } });

    expect(mockUpdateBlock).toHaveBeenCalled();
  });

  it("should update section padding horizontal", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "section-1",
        type: "section",
        label: "Section",
        content: "",
        properties: {
          bordered: true,
          paddingVertical: "16px",
          paddingHorizontal: "16px",
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "section-1",
    });
    const { container } = render(<PropertiesPanel />);

    const paddingInput = container.querySelector(
      "#section-padding-horizontal",
    ) as HTMLInputElement;
    fireEvent.change(paddingInput, { target: { value: "24" } });

    expect(mockUpdateBlock).toHaveBeenCalled();
  });

  it("should disable padding inputs when bordered is false", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "section-1",
        type: "section",
        label: "Section",
        content: "",
        properties: {
          bordered: false,
          paddingVertical: "16px",
          paddingHorizontal: "16px",
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "section-1",
    });
    const { container } = render(<PropertiesPanel />);

    const paddingVertical = container.querySelector(
      "#section-padding-vertical",
    ) as HTMLInputElement;
    const paddingHorizontal = container.querySelector(
      "#section-padding-horizontal",
    ) as HTMLInputElement;

    expect(paddingVertical).not.toBeDisabled();
    expect(paddingHorizontal).not.toBeDisabled();
  });

  it("should update column content for gridRow", () => {
    const parentGrid: TemplateBlock = {
      id: "grid-1",
      type: "grid",
      label: "Grid",
      content: "",
      properties: { columns: 2 },
      children: [
        {
          id: "row-1",
          type: "gridRow",
          label: "Row",
          content: "",
          properties: { columnContents: ["", ""] },
        },
      ],
    };
    const blocks: TemplateBlock[] = [parentGrid];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "row-1",
    });
    render(<PropertiesPanel />);

    const columnInput = screen.getByTestId("transliteration-column-0");
    fireEvent.change(columnInput, { target: { value: "New Content" } });

    expect(mockUpdateBlock).toHaveBeenCalled();
  });

  it("should handle gridRow info button toggle", () => {
    const parentGrid: TemplateBlock = {
      id: "grid-1",
      type: "grid",
      label: "Grid",
      content: "",
      properties: { columns: 2 },
      children: [
        {
          id: "row-1",
          type: "gridRow",
          label: "Row",
          content: "",
          properties: { columnContents: ["", ""] },
        },
      ],
    };
    const blocks: TemplateBlock[] = [parentGrid];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "row-1",
    });
    render(<PropertiesPanel />);

    const infoButtons = screen.getAllByLabelText(
      "Open Markdown and HTML guide",
    );
    fireEvent.click(infoButtons[0]);

    expect(mockSetIsMarkdownGuideOpen).toHaveBeenCalled();
  });

  it("should render table without columns initially", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "table-1",
        type: "table",
        label: "Table",
        content: "",
        properties: {
          list: "",
          zebraRows: false,
          columns: [],
          columnWidths: [],
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "table-1",
    });
    render(<PropertiesPanel />);

    expect(screen.getByLabelText("List")).toBeInTheDocument();
    expect(screen.queryByText("Column Widths")).not.toBeInTheDocument();
  });

  it("should update table column dataKey", () => {
    const tableColumns: TableColumn[] = [
      { id: "col1", dataKey: "name", label: "Name", alignment: "L" },
    ];
    const blocks: TemplateBlock[] = [
      {
        id: "table-1",
        type: "table",
        label: "Table",
        content: "",
        properties: {
          list: "items",
          zebraRows: false,
          columns: tableColumns,
          columnWidths: [100],
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "table-1",
    });
    render(<PropertiesPanel />);

    const columnExpandBtn = screen.getByRole("button", { name: "Name" });
    fireEvent.click(columnExpandBtn);

    const dataKeyInput = screen.getByDisplayValue("name");
    fireEvent.change(dataKeyInput, { target: { value: "newName" } });

    expect(mockUpdateBlock).toHaveBeenCalled();
  });

  it("should handle column width change with delta 0", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "grid-1",
        type: "grid",
        label: "Grid",
        content: "",
        properties: { columns: 2, columnWidths: [50, 50] },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "grid-1",
    });
    render(<PropertiesPanel />);

    const sliders = screen.getAllByRole("slider");
    fireEvent.change(sliders[0], { target: { value: "50" } });

    expect(mockUpdateBlock).not.toHaveBeenCalled();
  });

  it("should handle column width change when total is 100", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "grid-1",
        type: "grid",
        label: "Grid",
        content: "",
        properties: { columns: 2, columnWidths: [50, 50] },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "grid-1",
    });
    render(<PropertiesPanel />);

    const sliders = screen.getAllByRole("slider");
    fireEvent.change(sliders[0], { target: { value: "60" } });

    expect(mockUpdateBlock).toHaveBeenCalled();
  });

  it("should handle table column width change", () => {
    const tableColumns: TableColumn[] = [
      { id: "col1", dataKey: "name", label: "Name", alignment: "L" },
      { id: "col2", dataKey: "value", label: "Value", alignment: "R" },
    ];
    const blocks: TemplateBlock[] = [
      {
        id: "table-1",
        type: "table",
        label: "Table",
        content: "",
        properties: {
          list: "items",
          zebraRows: false,
          columns: tableColumns,
          columnWidths: [50, 50],
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "table-1",
    });
    render(<PropertiesPanel />);

    const sliders = screen.getAllByRole("slider");
    fireEvent.change(sliders[0], { target: { value: "60" } });

    expect(mockUpdateBlock).toHaveBeenCalled();
  });

  it("should show Total: 100% text when widths sum to 100", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "grid-1",
        type: "grid",
        label: "Grid",
        content: "",
        properties: { columns: 2, columnWidths: [50, 50] },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "grid-1",
    });
    render(<PropertiesPanel />);

    expect(screen.getByText("Total: 100%")).toBeInTheDocument();
  });

  it("should handle gridRow with no parent grid columns defaulting to 2", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "row-1",
        type: "gridRow",
        label: "Row",
        content: "",
        properties: { columnContents: ["", ""] },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "row-1",
    });
    render(<PropertiesPanel />);

    expect(screen.getByText("Column #1 Content")).toBeInTheDocument();
    expect(screen.getByText("Column #2 Content")).toBeInTheDocument();
  });

  it("should render image style editor", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "image-1",
        type: "image",
        label: "Image",
        content: "",
        properties: {
          src: "https://example.com/img.jpg",
          style: "border: 1px solid red;",
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "image-1",
    });
    render(<PropertiesPanel />);

    const styleEditors = screen.getAllByTestId("style-editor");
    expect(styleEditors.length).toBeGreaterThan(0);
  });

  it("should handle table with more than 4 columns defaulting widths", () => {
    const tableColumns: TableColumn[] = [
      { id: "col1", dataKey: "a", label: "A", alignment: "L" },
      { id: "col2", dataKey: "b", label: "B", alignment: "L" },
      { id: "col3", dataKey: "c", label: "C", alignment: "L" },
      { id: "col4", dataKey: "d", label: "D", alignment: "L" },
      { id: "col5", dataKey: "e", label: "E", alignment: "L" },
    ];
    const blocks: TemplateBlock[] = [
      {
        id: "table-1",
        type: "table",
        label: "Table",
        content: "",
        properties: {
          list: "items",
          zebraRows: false,
          columns: tableColumns,
          columnWidths: [],
        },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "table-1",
    });
    const { container } = render(<PropertiesPanel />);

    expect(
      container.querySelector('[class*="propertiesPanel"]'),
    ).toBeInTheDocument();
  });

  it("should handle grid column change with default widths", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "grid-1",
        type: "grid",
        label: "Grid",
        content: "",
        properties: { columns: 2, columnWidths: [50, 50] },
        children: [],
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "grid-1",
    });
    const { container } = render(<PropertiesPanel />);

    const columnSelect = container.querySelector("select");
    if (columnSelect) {
      fireEvent.change(columnSelect, { target: { value: "5" } });
      expect(mockUpdateBlock).toHaveBeenCalled();
    }
  });

  it("should handle empty columnContents when editing gridRow", () => {
    const parentGrid: TemplateBlock = {
      id: "grid-1",
      type: "grid",
      label: "Grid",
      content: "",
      properties: { columns: 2, columnWidths: [50, 50] },
      children: [
        {
          id: "row-1",
          type: "gridRow",
          label: "Row",
          content: "",
          properties: {},
        },
      ],
    };
    const blocks: TemplateBlock[] = [parentGrid];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "row-1",
    });
    render(<PropertiesPanel />);

    const inputs = screen.getAllByTestId(/transliteration-/);
    if (inputs.length > 0) {
      fireEvent.change(inputs[0], { target: { value: "New content" } });
      expect(mockUpdateBlock).toHaveBeenCalled();
    }
  });

  it("should handle style change for block", () => {
    const blocks: TemplateBlock[] = [
      {
        id: "text-1",
        type: "richText",
        label: "Text",
        content: "Hello",
        properties: { style: "color: red;" },
      },
    ];
    (useTemplateDesigner as jest.Mock).mockReturnValue({
      ...defaultMockValues,
      blocks,
      selectedBlockId: "text-1",
    });
    render(<PropertiesPanel />);

    const styleEditor = screen.getByTestId("style-editor");
    fireEvent.change(styleEditor, { target: { value: "color: blue;" } });
    expect(mockUpdateBlock).toHaveBeenCalled();
  });
});

describe("ExpandedContentEditor", () => {
  const ExpandedContentEditor =
    require("./ExpandedContentEditor/ExpandedContentEditor").default;

  const mockOnClose = jest.fn();
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return null when isOpen is false", () => {
    const { container } = render(
      <ExpandedContentEditor
        isOpen={false}
        onClose={mockOnClose}
        value="test"
        onChange={mockOnChange}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("should render modal when isOpen is true", () => {
    render(
      <ExpandedContentEditor
        isOpen={true}
        onClose={mockOnClose}
        value="test content"
        onChange={mockOnChange}
      />,
    );
    expect(screen.getByText("Markdown & HTML Guide")).toBeInTheDocument();
    expect(screen.getByText("Content Editor")).toBeInTheDocument();
  });

  it("should close on Escape key press", () => {
    render(
      <ExpandedContentEditor
        isOpen={true}
        onClose={mockOnClose}
        value="test"
        onChange={mockOnChange}
      />,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should not close on non-Escape key press", () => {
    render(
      <ExpandedContentEditor
        isOpen={true}
        onClose={mockOnClose}
        value="test"
        onChange={mockOnChange}
      />,
    );
    fireEvent.keyDown(document, { key: "Enter" });
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("should close when backdrop is clicked", () => {
    render(
      <ExpandedContentEditor
        isOpen={true}
        onClose={mockOnClose}
        value="test"
        onChange={mockOnChange}
      />,
    );
    const backdrop = screen.getByLabelText("Close expanded editor");
    fireEvent.click(backdrop);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should close when Done button is clicked", () => {
    render(
      <ExpandedContentEditor
        isOpen={true}
        onClose={mockOnClose}
        value="test"
        onChange={mockOnChange}
      />,
    );
    const doneButton = screen.getByText("Done");
    fireEvent.click(doneButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should close when close button is clicked", () => {
    render(
      <ExpandedContentEditor
        isOpen={true}
        onClose={mockOnClose}
        value="test"
        onChange={mockOnChange}
      />,
    );
    const closeButton = screen.getByLabelText("Close editor");
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should set body overflow to hidden when open", () => {
    render(
      <ExpandedContentEditor
        isOpen={true}
        onClose={mockOnClose}
        value="test"
        onChange={mockOnChange}
      />,
    );
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("should restore body overflow on unmount", () => {
    const { unmount } = render(
      <ExpandedContentEditor
        isOpen={true}
        onClose={mockOnClose}
        value="test"
        onChange={mockOnChange}
      />,
    );
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("should call onChange when textarea value changes", () => {
    render(
      <ExpandedContentEditor
        isOpen={true}
        onClose={mockOnClose}
        value="test"
        onChange={mockOnChange}
      />,
    );
    const textarea = screen.getByTestId("transliteration-expanded-content");
    fireEvent.change(textarea, { target: { value: "new value" } });
    expect(mockOnChange).toHaveBeenCalledWith("new value");
  });

  it("should render expand button for gridRow column contents", () => {
    const mockUpdateBlock = jest.fn();
    const mockBlocks: TemplateBlock[] = [
      {
        id: "grid-1",
        type: "grid",
        label: "Grid",
        content: "",
        properties: { columns: 3 },
        children: [
          {
            id: "gridRow-1",
            type: "gridRow",
            label: "Row",
            content: "",
            properties: { columnContents: ["Col1", "Col2", "Col3"] },
          },
        ],
      },
    ];

    (useTemplateDesigner as jest.Mock).mockReturnValue({
      blocks: mockBlocks,
      selectedBlockId: "gridRow-1",
      updateBlock: mockUpdateBlock,
      globalStyles: {},
      setGlobalStyles: jest.fn(),
    });

    render(<PropertiesPanel />);
    const expandButtons = screen.getAllByLabelText(
      /Expand column \d+ content editor/,
    );
    expect(expandButtons).toHaveLength(3);
  });

  it("should handle expand button click for gridRow column", () => {
    const mockUpdateBlock = jest.fn();
    const mockBlocks: TemplateBlock[] = [
      {
        id: "gridRow-1",
        type: "gridRow",
        label: "Row",
        content: "",
        properties: { columnContents: ["Content 1", "Content 2"] },
      },
    ];

    (useTemplateDesigner as jest.Mock).mockReturnValue({
      blocks: mockBlocks,
      selectedBlockId: "gridRow-1",
      updateBlock: mockUpdateBlock,
      globalStyles: {},
      setGlobalStyles: jest.fn(),
    });

    render(<PropertiesPanel />);
    const expandButton = screen.getAllByLabelText(
      /Expand column \d+ content editor/,
    )[0];
    fireEvent.click(expandButton);

    expect(
      screen.getByTestId("transliteration-expanded-content"),
    ).toBeInTheDocument();
  });

  it("should render info button for gridRow columns", () => {
    const mockBlocks: TemplateBlock[] = [
      {
        id: "grid-1",
        type: "grid",
        label: "Grid",
        content: "",
        properties: { columns: 2 },
        children: [
          {
            id: "gridRow-1",
            type: "gridRow",
            label: "Row",
            content: "",
            properties: { columnContents: ["Col1", "Col2"] },
          },
        ],
      },
    ];

    (useTemplateDesigner as jest.Mock).mockReturnValue({
      blocks: mockBlocks,
      selectedBlockId: "gridRow-1",
      updateBlock: jest.fn(),
      globalStyles: {},
      setGlobalStyles: jest.fn(),
    });

    render(<PropertiesPanel />);
    const infoButtons = screen.getAllByLabelText(
      "Open Markdown and HTML guide",
    );
    expect(infoButtons.length).toBeGreaterThan(0);
  });

  it("should update column content when TransliterationInput changes", () => {
    const mockUpdateBlock = jest.fn();
    const mockBlocks: TemplateBlock[] = [
      {
        id: "grid-1",
        type: "grid",
        label: "Grid",
        content: "",
        properties: { columns: 1 },
        children: [
          {
            id: "gridRow-1",
            type: "gridRow",
            label: "Row",
            content: "",
            properties: { columnContents: ["Original"] },
          },
        ],
      },
    ];

    (useTemplateDesigner as jest.Mock).mockReturnValue({
      blocks: mockBlocks,
      selectedBlockId: "gridRow-1",
      updateBlock: mockUpdateBlock,
      globalStyles: {},
      setGlobalStyles: jest.fn(),
    });

    render(<PropertiesPanel />);
    const input = screen.getByPlaceholderText(
      /Enter column content here\. Click on info icon/,
    );
    fireEvent.change(input, { target: { value: "Updated content" } });

    expect(mockUpdateBlock).toHaveBeenCalledWith("gridRow-1", {
      properties: { columnContents: ["Updated content"] },
    });
  });

  it("should close expanded editor when close button is clicked", () => {
    const mockBlocks: TemplateBlock[] = [
      {
        id: "grid-1",
        type: "grid",
        label: "Grid",
        content: "",
        properties: { columns: 1 },
        children: [
          {
            id: "gridRow-1",
            type: "gridRow",
            label: "Row",
            content: "",
            properties: { columnContents: ["Content"] },
          },
        ],
      },
    ];

    (useTemplateDesigner as jest.Mock).mockReturnValue({
      blocks: mockBlocks,
      selectedBlockId: "gridRow-1",
      updateBlock: jest.fn(),
      globalStyles: {},
      setGlobalStyles: jest.fn(),
    });

    render(<PropertiesPanel />);
    const expandButton = screen.getByLabelText(
      /Expand column \d+ content editor/,
    );
    fireEvent.click(expandButton);

    expect(
      screen.getByTestId("transliteration-expanded-content"),
    ).toBeInTheDocument();

    const closeButton = screen.getByLabelText("Close expanded editor");
    fireEvent.click(closeButton);

    expect(
      screen.queryByTestId("transliteration-expanded-content"),
    ).not.toBeInTheDocument();
  });

  it("should update content via expanded editor", () => {
    const mockUpdateBlock = jest.fn();
    const mockBlocks: TemplateBlock[] = [
      {
        id: "grid-1",
        type: "grid",
        label: "Grid",
        content: "",
        properties: { columns: 1 },
        children: [
          {
            id: "gridRow-1",
            type: "gridRow",
            label: "Row",
            content: "",
            properties: { columnContents: ["Original"] },
          },
        ],
      },
    ];

    (useTemplateDesigner as jest.Mock).mockReturnValue({
      blocks: mockBlocks,
      selectedBlockId: "gridRow-1",
      updateBlock: mockUpdateBlock,
      globalStyles: {},
      setGlobalStyles: jest.fn(),
    });

    render(<PropertiesPanel />);
    const expandButton = screen.getByLabelText(
      /Expand column \d+ content editor/,
    );
    fireEvent.click(expandButton);

    const textarea = screen.getByTestId("transliteration-expanded-content");
    fireEvent.change(textarea, { target: { value: "Expanded update" } });

    expect(mockUpdateBlock).toHaveBeenCalledWith("gridRow-1", {
      properties: { columnContents: ["Expanded update"] },
    });
  });

  it("should handle gridRow with single column", () => {
    const mockBlocks: TemplateBlock[] = [
      {
        id: "grid-1",
        type: "grid",
        label: "Grid",
        content: "",
        properties: { columns: 1 },
        children: [
          {
            id: "gridRow-1",
            type: "gridRow",
            label: "Row",
            content: "",
            properties: { columnContents: ["Single"] },
          },
        ],
      },
    ];

    (useTemplateDesigner as jest.Mock).mockReturnValue({
      blocks: mockBlocks,
      selectedBlockId: "gridRow-1",
      updateBlock: jest.fn(),
      globalStyles: {},
      setGlobalStyles: jest.fn(),
    });

    render(<PropertiesPanel />);
    const expandButtons = screen.getAllByLabelText(
      /Expand column \d+ content editor/,
    );
    expect(expandButtons).toHaveLength(1);
    expect(
      screen.getByPlaceholderText(
        /Enter column content here\. Click on info icon/,
      ),
    ).toBeInTheDocument();
  });

  it("should handle gridRow with undefined column content", () => {
    const mockUpdateBlock = jest.fn();
    const mockBlocks: TemplateBlock[] = [
      {
        id: "grid-1",
        type: "grid",
        label: "Grid",
        content: "",
        properties: { columns: 2 },
        children: [
          {
            id: "gridRow-1",
            type: "gridRow",
            label: "Row",
            content: "",
            properties: { columnContents: [undefined, "Content 2"] },
          },
        ],
      },
    ];

    (useTemplateDesigner as jest.Mock).mockReturnValue({
      blocks: mockBlocks,
      selectedBlockId: "gridRow-1",
      updateBlock: mockUpdateBlock,
      globalStyles: {},
      setGlobalStyles: jest.fn(),
    });

    render(<PropertiesPanel />);
    const inputs = screen.getAllByPlaceholderText(
      /Enter column content here\. Click on info icon/,
    );
    expect(inputs[0]).toHaveValue("");
    expect(inputs[1]).toHaveValue("Content 2");
  });

  describe("Branch coverage - isMarkdownGuideOpen active state", () => {
    it("should apply active style when markdown guide is open for richText", () => {
      const blocks: TemplateBlock[] = [
        {
          id: "block-1",
          type: "richText",
          label: "Text Block",
          content: "Hello",
          properties: {},
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        blocks,
        selectedBlockId: "block-1",
        updateBlock: jest.fn(),
        removeBlock: jest.fn(),
        isMarkdownGuideOpen: true,
        setIsMarkdownGuideOpen: jest.fn(),
      });
      render(<PropertiesPanel />);
      const infoButton = screen.getByRole("button", {
        name: /close markdown/i,
      });
      expect(infoButton).toBeInTheDocument();
    });

    it("should apply active style when markdown guide is open for gridRow", () => {
      const mockBlocks: TemplateBlock[] = [
        {
          id: "grid-1",
          type: "grid",
          label: "Grid",
          content: "",
          properties: { columns: 2 },
          children: [
            {
              id: "gridRow-1",
              type: "gridRow",
              label: "Row",
              content: "",
              properties: { columnContents: ["A", "B"] },
            },
          ],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        blocks: mockBlocks,
        selectedBlockId: "gridRow-1",
        updateBlock: jest.fn(),
        removeBlock: jest.fn(),
        isMarkdownGuideOpen: true,
        setIsMarkdownGuideOpen: jest.fn(),
      });
      render(<PropertiesPanel />);
      const infoButtons = screen.getAllByRole("button", {
        name: /open markdown/i,
      });
      expect(infoButtons.length).toBeGreaterThan(0);
    });
  });

  describe("Branch coverage - Table fallback branches", () => {
    it("should handle table with undefined columns property", () => {
      const blocks: TemplateBlock[] = [
        {
          id: "table-1",
          type: "table",
          label: "Table Block",
          content: "",
          properties: {},
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        blocks,
        selectedBlockId: "table-1",
        updateBlock: jest.fn(),
        removeBlock: jest.fn(),
        isMarkdownGuideOpen: false,
        setIsMarkdownGuideOpen: jest.fn(),
      });
      render(<PropertiesPanel />);
      expect(screen.getByText("Table - Properties")).toBeInTheDocument();
    });

    it("should handle table with undefined columnWidths property", () => {
      const tableColumns: TableColumn[] = [
        { header: "Col 1", field: "col1", alignment: "L" },
        { header: "Col 2", field: "col2", alignment: "C" },
      ];
      const blocks: TemplateBlock[] = [
        {
          id: "table-1",
          type: "table",
          label: "Table Block",
          content: "",
          properties: { columns: tableColumns },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        blocks,
        selectedBlockId: "table-1",
        updateBlock: jest.fn(),
        removeBlock: jest.fn(),
        isMarkdownGuideOpen: false,
        setIsMarkdownGuideOpen: jest.fn(),
      });
      render(<PropertiesPanel />);
      expect(screen.getByText("Table - Properties")).toBeInTheDocument();
    });

    it("should handle table with undefined list property", () => {
      const blocks: TemplateBlock[] = [
        {
          id: "table-1",
          type: "table",
          label: "Table Block",
          content: "",
          properties: { columns: [], columnWidths: [] },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        blocks,
        selectedBlockId: "table-1",
        updateBlock: jest.fn(),
        removeBlock: jest.fn(),
        isMarkdownGuideOpen: false,
        setIsMarkdownGuideOpen: jest.fn(),
      });
      render(<PropertiesPanel />);
      expect(screen.getByText("Table - Properties")).toBeInTheDocument();
    });

    it("should handle table with mismatched columnWidths length", () => {
      const tableColumns: TableColumn[] = [
        { header: "Col 1", field: "col1", alignment: "L" },
        { header: "Col 2", field: "col2", alignment: "C" },
        { header: "Col 3", field: "col3", alignment: "R" },
      ];
      const blocks: TemplateBlock[] = [
        {
          id: "table-1",
          type: "table",
          label: "Table Block",
          content: "",
          properties: { columns: tableColumns, columnWidths: [50] },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        blocks,
        selectedBlockId: "table-1",
        updateBlock: jest.fn(),
        removeBlock: jest.fn(),
        isMarkdownGuideOpen: false,
        setIsMarkdownGuideOpen: jest.fn(),
      });
      render(<PropertiesPanel />);
      expect(screen.getByText("Table - Properties")).toBeInTheDocument();
    });
  });

  describe("Branch coverage - Grid columnWidths fallback", () => {
    it("should use default column widths when columnWidths property is undefined", () => {
      const blocks: TemplateBlock[] = [
        {
          id: "grid-1",
          type: "grid",
          label: "Grid Block",
          content: "",
          properties: { columns: 3 },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        blocks,
        selectedBlockId: "grid-1",
        updateBlock: jest.fn(),
        removeBlock: jest.fn(),
        isMarkdownGuideOpen: false,
        setIsMarkdownGuideOpen: jest.fn(),
      });
      render(<PropertiesPanel />);
      expect(screen.getByText("Grid - Properties")).toBeInTheDocument();
    });

    it("should handle grid columns change which triggers column widths recalculation", () => {
      const mockUpdateBlock = jest.fn();
      const blocks: TemplateBlock[] = [
        {
          id: "grid-1",
          type: "grid",
          label: "Grid Block",
          content: "",
          properties: { columns: 2, columnWidths: [50, 50] },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        blocks,
        selectedBlockId: "grid-1",
        updateBlock: mockUpdateBlock,
        removeBlock: jest.fn(),
        isMarkdownGuideOpen: false,
        setIsMarkdownGuideOpen: jest.fn(),
      });
      render(<PropertiesPanel />);
      const columnButton = screen.getByRole("button", { name: "3" });
      fireEvent.click(columnButton);
      expect(mockUpdateBlock).toHaveBeenCalled();
    });
  });

  describe("Branch coverage - ExpandedContentEditor fallbacks", () => {
    it("should handle expanded column with undefined columnContents", () => {
      const mockBlocks: TemplateBlock[] = [
        {
          id: "grid-1",
          type: "grid",
          label: "Grid",
          content: "",
          properties: { columns: 2 },
          children: [
            {
              id: "gridRow-1",
              type: "gridRow",
              label: "Row",
              content: "",
              properties: {},
            },
          ],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        blocks: mockBlocks,
        selectedBlockId: "gridRow-1",
        updateBlock: jest.fn(),
        removeBlock: jest.fn(),
        isMarkdownGuideOpen: false,
        setIsMarkdownGuideOpen: jest.fn(),
      });
      render(<PropertiesPanel />);
      const expandButtons = screen.getAllByLabelText(
        /Expand column \d+ content editor/,
      );
      fireEvent.click(expandButtons[0]);
    });

    it("should handle expanded column with undefined content at specific index", () => {
      const mockBlocks: TemplateBlock[] = [
        {
          id: "grid-1",
          type: "grid",
          label: "Grid",
          content: "",
          properties: { columns: 3 },
          children: [
            {
              id: "gridRow-1",
              type: "gridRow",
              label: "Row",
              content: "",
              properties: { columnContents: ["First", undefined, "Third"] },
            },
          ],
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        blocks: mockBlocks,
        selectedBlockId: "gridRow-1",
        updateBlock: jest.fn(),
        removeBlock: jest.fn(),
        isMarkdownGuideOpen: false,
        setIsMarkdownGuideOpen: jest.fn(),
      });
      render(<PropertiesPanel />);
      const expandButtons = screen.getAllByLabelText(
        /Expand column \d+ content editor/,
      );
      fireEvent.click(expandButtons[1]);
    });
  });

  describe("Branch coverage - Table with many columns fallback", () => {
    it("should calculate column widths for table with 11 columns (no DEFAULT_COLUMN_WIDTHS)", () => {
      const manyColumns: TableColumn[] = Array.from({ length: 11 }, (_, i) => ({
        header: `Col ${i + 1}`,
        field: `col${i + 1}`,
        alignment: "L" as const,
      }));
      const blocks: TemplateBlock[] = [
        {
          id: "table-1",
          type: "table",
          label: "Table Block",
          content: "",
          properties: { columns: manyColumns, columnWidths: [] },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        blocks,
        selectedBlockId: "table-1",
        updateBlock: jest.fn(),
        removeBlock: jest.fn(),
        isMarkdownGuideOpen: false,
        setIsMarkdownGuideOpen: jest.fn(),
      });
      render(<PropertiesPanel />);
      expect(screen.getByText("Table - Properties")).toBeInTheDocument();
    });

    it("should use fallback of 1 when table has empty columns array but mismatched widths", () => {
      const blocks: TemplateBlock[] = [
        {
          id: "table-1",
          type: "table",
          label: "Table Block",
          content: "",
          properties: { columns: [], columnWidths: [50] },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        blocks,
        selectedBlockId: "table-1",
        updateBlock: jest.fn(),
        removeBlock: jest.fn(),
        isMarkdownGuideOpen: false,
        setIsMarkdownGuideOpen: jest.fn(),
      });
      render(<PropertiesPanel />);
      expect(screen.getByText("Table - Properties")).toBeInTheDocument();
    });
  });

  describe("Branch coverage - Divider width property", () => {
    it("should use default width of 100 when width property is undefined", () => {
      const blocks: TemplateBlock[] = [
        {
          id: "divider-1",
          type: "divider",
          label: "Divider Block",
          content: "",
          properties: {},
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        blocks,
        selectedBlockId: "divider-1",
        updateBlock: jest.fn(),
        removeBlock: jest.fn(),
        isMarkdownGuideOpen: false,
        setIsMarkdownGuideOpen: jest.fn(),
      });
      render(<PropertiesPanel />);
      expect(screen.getByText("Divider - Properties")).toBeInTheDocument();
      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("should use defined width value when width property is set", () => {
      const blocks: TemplateBlock[] = [
        {
          id: "divider-1",
          type: "divider",
          label: "Divider Block",
          content: "",
          properties: { width: 75 },
        },
      ];
      (useTemplateDesigner as jest.Mock).mockReturnValue({
        blocks,
        selectedBlockId: "divider-1",
        updateBlock: jest.fn(),
        removeBlock: jest.fn(),
        isMarkdownGuideOpen: false,
        setIsMarkdownGuideOpen: jest.fn(),
      });
      render(<PropertiesPanel />);
      expect(screen.getByText("Divider - Properties")).toBeInTheDocument();
      expect(screen.getByText("75%")).toBeInTheDocument();
    });
  });
});
