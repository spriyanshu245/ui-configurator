import { render, screen, fireEvent } from "@testing-library/react";
import SortableColumn from "./SortableColumn";

jest.mock("@/app/components/SVGIcons/ChevronUpSolid", () => ({
  __esModule: true,
  default: () => <span data-testid="chevron-up">▲</span>,
}));

jest.mock("@/app/components/SVGIcons/ChevronDownSolid", () => ({
  __esModule: true,
  default: () => <span data-testid="chevron-down">▼</span>,
}));

const renderInTable = (ui: React.ReactElement) =>
  render(
    <table>
      <thead>
        <tr>{ui}</tr>
      </thead>
    </table>,
  );

describe("SortableColumn", () => {
  const mockOnSort = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the label text", () => {
    renderInTable(
      <SortableColumn label="Name" direction={null} onSort={mockOnSort} />,
    );
    expect(screen.getByText("Name")).toBeInTheDocument();
  });

  it("calls onSort when button is clicked", () => {
    renderInTable(
      <SortableColumn label="Name" direction={null} onSort={mockOnSort} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Sort by Name" }));
    expect(mockOnSort).toHaveBeenCalledTimes(1);
  });

  it("shows chevron up icon when direction is asc", () => {
    renderInTable(
      <SortableColumn label="Name" direction="asc" onSort={mockOnSort} />,
    );
    expect(screen.getByTestId("chevron-up")).toBeInTheDocument();
  });

  it("shows chevron down icon when direction is desc", () => {
    renderInTable(
      <SortableColumn label="Name" direction="desc" onSort={mockOnSort} />,
    );
    expect(screen.getByTestId("chevron-down")).toBeInTheDocument();
  });

  it("shows chevron down icon when direction is null", () => {
    renderInTable(
      <SortableColumn label="Name" direction={null} onSort={mockOnSort} />,
    );
    expect(screen.getByTestId("chevron-down")).toBeInTheDocument();
  });

  it("applies centered class when centered prop is true", () => {
    renderInTable(
      <SortableColumn
        label="Name"
        direction={null}
        centered
        onSort={mockOnSort}
      />,
    );
    const th = screen.getByRole("columnheader");
    expect(th.className).toContain("centered");
  });

  it("does not apply centered class when centered prop is false", () => {
    renderInTable(
      <SortableColumn label="Name" direction={null} onSort={mockOnSort} />,
    );
    const th = screen.getByRole("columnheader");
    expect(th.className).not.toContain("centered");
  });

  it("applies active class to sort icon when direction is set", () => {
    renderInTable(
      <SortableColumn label="Name" direction="asc" onSort={mockOnSort} />,
    );
    const button = screen.getByRole("button");
    const sortIconSpan = button.querySelector("[class*='sortIcon']");
    expect(sortIconSpan?.className).toContain("active");
  });
});
