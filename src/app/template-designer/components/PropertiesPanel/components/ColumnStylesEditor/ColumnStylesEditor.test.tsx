import { render, screen, fireEvent } from "@testing-library/react";
import ColumnStylesEditor from "./ColumnStylesEditor";

jest.mock("@/app/components/SVGIcons/ChevronDown", () => {
  return function ChevronDownMock() {
    return <span data-testid="chevron-down-icon">▼</span>;
  };
});

jest.mock("../../StyleEditor", () => {
  return function StyleEditorMock({
    value,
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) {
    return (
      <textarea
        data-testid="style-editor"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  };
});

describe("ColumnStylesEditor", () => {
  const mockOnColumnStyleChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render column style editor with correct number of columns", () => {
    render(
      <ColumnStylesEditor
        columns={3}
        columnStyles={["", "", ""]}
        onColumnStyleChange={mockOnColumnStyleChange}
      />,
    );

    expect(screen.getByText("Column Styles")).toBeInTheDocument();
    expect(screen.getByText("Column 1")).toBeInTheDocument();
    expect(screen.getByText("Column 2")).toBeInTheDocument();
    expect(screen.getByText("Column 3")).toBeInTheDocument();
  });

  it("should render single column", () => {
    render(
      <ColumnStylesEditor
        columns={1}
        columnStyles={[""]}
        onColumnStyleChange={mockOnColumnStyleChange}
      />,
    );

    expect(screen.getByText("Column 1")).toBeInTheDocument();
    expect(screen.queryByText("Column 2")).not.toBeInTheDocument();
  });

  it("should render multiple columns", () => {
    render(
      <ColumnStylesEditor
        columns={5}
        columnStyles={["", "", "", "", ""]}
        onColumnStyleChange={mockOnColumnStyleChange}
      />,
    );

    expect(screen.getByText("Column 1")).toBeInTheDocument();
    expect(screen.getByText("Column 2")).toBeInTheDocument();
    expect(screen.getByText("Column 3")).toBeInTheDocument();
    expect(screen.getByText("Column 4")).toBeInTheDocument();
    expect(screen.getByText("Column 5")).toBeInTheDocument();
  });

  it("should expand column editor when header is clicked", () => {
    render(
      <ColumnStylesEditor
        columns={2}
        columnStyles={["color: red;", "color: blue;"]}
        onColumnStyleChange={mockOnColumnStyleChange}
      />,
    );

    const column1Header = screen.getByText("Column 1").closest("button");
    fireEvent.click(column1Header!);

    expect(screen.getByDisplayValue("color: red;")).toBeInTheDocument();
  });

  it("should collapse column editor when header is clicked again", () => {
    render(
      <ColumnStylesEditor
        columns={2}
        columnStyles={["color: red;", "color: blue;"]}
        onColumnStyleChange={mockOnColumnStyleChange}
      />,
    );

    const column1Header = screen.getByText("Column 1").closest("button");
    fireEvent.click(column1Header!);
    expect(screen.getByDisplayValue("color: red;")).toBeInTheDocument();

    fireEvent.click(column1Header!);
    expect(screen.queryByDisplayValue("color: red;")).not.toBeInTheDocument();
  });

  it("should switch between expanded columns", () => {
    render(
      <ColumnStylesEditor
        columns={3}
        columnStyles={["style1", "style2", "style3"]}
        onColumnStyleChange={mockOnColumnStyleChange}
      />,
    );

    const column1Header = screen.getByText("Column 1").closest("button");
    const column2Header = screen.getByText("Column 2").closest("button");

    fireEvent.click(column1Header!);
    expect(screen.getByDisplayValue("style1")).toBeInTheDocument();

    fireEvent.click(column2Header!);
    expect(screen.queryByDisplayValue("style1")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("style2")).toBeInTheDocument();
  });

  it("should call onColumnStyleChange when style is edited", () => {
    render(
      <ColumnStylesEditor
        columns={2}
        columnStyles={["", ""]}
        onColumnStyleChange={mockOnColumnStyleChange}
      />,
    );

    const column1Header = screen.getByText("Column 1").closest("button");
    fireEvent.click(column1Header!);

    const styleEditor = screen.getByTestId("style-editor");
    fireEvent.change(styleEditor, { target: { value: "color: red;" } });

    expect(mockOnColumnStyleChange).toHaveBeenCalledWith(0, "color: red;");
  });

  it("should handle style changes for different columns", () => {
    render(
      <ColumnStylesEditor
        columns={3}
        columnStyles={["", "", ""]}
        onColumnStyleChange={mockOnColumnStyleChange}
      />,
    );

    const column2Header = screen.getByText("Column 2").closest("button");
    fireEvent.click(column2Header!);

    const styleEditor = screen.getByTestId("style-editor");
    fireEvent.change(styleEditor, { target: { value: "padding: 10px;" } });

    expect(mockOnColumnStyleChange).toHaveBeenCalledWith(1, "padding: 10px;");
  });

  it("should display existing column styles when expanded", () => {
    render(
      <ColumnStylesEditor
        columns={3}
        columnStyles={["color: red;", "font-size: 14px;", "margin: 5px;"]}
        onColumnStyleChange={mockOnColumnStyleChange}
      />,
    );

    const column2Header = screen.getByText("Column 2").closest("button");
    fireEvent.click(column2Header!);

    expect(screen.getByDisplayValue("font-size: 14px;")).toBeInTheDocument();
  });

  it("should handle empty columnStyles array gracefully", () => {
    render(
      <ColumnStylesEditor
        columns={2}
        columnStyles={[]}
        onColumnStyleChange={mockOnColumnStyleChange}
      />,
    );

    const column1Header = screen.getByText("Column 1").closest("button");
    fireEvent.click(column1Header!);

    expect(screen.getByTestId("style-editor")).toHaveValue("");
  });

  it("should handle undefined column style", () => {
    render(
      <ColumnStylesEditor
        columns={2}
        columnStyles={["color: red;"]}
        onColumnStyleChange={mockOnColumnStyleChange}
      />,
    );

    const column2Header = screen.getByText("Column 2").closest("button");
    fireEvent.click(column2Header!);

    expect(screen.getByTestId("style-editor")).toHaveValue("");
  });

  it("should apply expanded class when column is expanded", () => {
    render(
      <ColumnStylesEditor
        columns={2}
        columnStyles={["", ""]}
        onColumnStyleChange={mockOnColumnStyleChange}
      />,
    );

    const column1Header = screen.getByText("Column 1").closest("button");
    expect(column1Header).not.toHaveClass("expanded");

    fireEvent.click(column1Header!);
    expect(column1Header).toHaveClass("expanded");
  });

  it("should apply rotated class to chevron when column is expanded", () => {
    const { container } = render(
      <ColumnStylesEditor
        columns={2}
        columnStyles={["", ""]}
        onColumnStyleChange={mockOnColumnStyleChange}
      />,
    );

    const column1Header = screen.getByText("Column 1").closest("button");
    const chevronSpan = container.querySelector(".columnStyleChevron");

    expect(chevronSpan).not.toHaveClass("rotated");

    fireEvent.click(column1Header!);
    expect(chevronSpan).toHaveClass("rotated");
  });

  it("should remove rotated class when column is collapsed", () => {
    const { container } = render(
      <ColumnStylesEditor
        columns={2}
        columnStyles={["", ""]}
        onColumnStyleChange={mockOnColumnStyleChange}
      />,
    );

    const column1Header = screen.getByText("Column 1").closest("button");
    const chevronSpan = container.querySelector(".columnStyleChevron");

    fireEvent.click(column1Header!);
    expect(chevronSpan).toHaveClass("rotated");

    fireEvent.click(column1Header!);
    expect(chevronSpan).not.toHaveClass("rotated");
  });

  it("should handle multiple rapid clicks", () => {
    render(
      <ColumnStylesEditor
        columns={2}
        columnStyles={["", ""]}
        onColumnStyleChange={mockOnColumnStyleChange}
      />,
    );

    const column1Header = screen.getByText("Column 1").closest("button");

    fireEvent.click(column1Header!);
    fireEvent.click(column1Header!);
    fireEvent.click(column1Header!);

    expect(screen.getByTestId("style-editor")).toBeInTheDocument();
  });

  it("should render chevron icon for each column", () => {
    render(
      <ColumnStylesEditor
        columns={3}
        columnStyles={["", "", ""]}
        onColumnStyleChange={mockOnColumnStyleChange}
      />,
    );

    const chevronIcons = screen.getAllByTestId("chevron-down-icon");
    expect(chevronIcons).toHaveLength(3);
  });

  it("should handle zero columns", () => {
    render(
      <ColumnStylesEditor
        columns={0}
        columnStyles={[]}
        onColumnStyleChange={mockOnColumnStyleChange}
      />,
    );

    expect(screen.getByText("Column Styles")).toBeInTheDocument();
    expect(screen.queryByText("Column 1")).not.toBeInTheDocument();
  });

  it("should maintain state when columns prop changes", () => {
    const { rerender } = render(
      <ColumnStylesEditor
        columns={2}
        columnStyles={["", ""]}
        onColumnStyleChange={mockOnColumnStyleChange}
      />,
    );

    const column1Header = screen.getByText("Column 1").closest("button");
    fireEvent.click(column1Header!);

    rerender(
      <ColumnStylesEditor
        columns={3}
        columnStyles={["", "", ""]}
        onColumnStyleChange={mockOnColumnStyleChange}
      />,
    );

    expect(screen.getByTestId("style-editor")).toBeInTheDocument();
  });

  it("should handle large number of columns", () => {
    render(
      <ColumnStylesEditor
        columns={10}
        columnStyles={new Array(10).fill("")}
        onColumnStyleChange={mockOnColumnStyleChange}
      />,
    );

    expect(screen.getByText("Column 1")).toBeInTheDocument();
    expect(screen.getByText("Column 10")).toBeInTheDocument();
  });

  it("should pass correct index to onColumnStyleChange", () => {
    render(
      <ColumnStylesEditor
        columns={5}
        columnStyles={["", "", "", "", ""]}
        onColumnStyleChange={mockOnColumnStyleChange}
      />,
    );

    const column4Header = screen.getByText("Column 4").closest("button");
    fireEvent.click(column4Header!);

    const styleEditor = screen.getByTestId("style-editor");
    fireEvent.change(styleEditor, { target: { value: "test" } });

    expect(mockOnColumnStyleChange).toHaveBeenCalledWith(3, "test");
  });
});
