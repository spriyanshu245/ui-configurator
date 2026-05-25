import React from "react";
import { render, screen } from "@testing-library/react";
import CollectionDashboardTable from "./CollectionDashboardTable";
import { CollectionDashboardTableComponent } from "../../../types/types";

const createComponent = (
  overrides: Partial<CollectionDashboardTableComponent["properties"]> = {}
): CollectionDashboardTableComponent => ({
  id: "test-collection-dashboard",
  type: "collection-dashboard-table",
  category: "",
  properties: {
    apiUrl: "https://api.example.com/collection",
    apiHeaders: "{}",
    label: "Collection Dashboard",
    showLabel: true,
    ...overrides,
  },
});

describe("CollectionDashboardTable", () => {
  it("renders the container with the component id", () => {
    const { container } = render(
      <CollectionDashboardTable component={createComponent()} />
    );
    expect(container.querySelector("#test-collection-dashboard")).toBeInTheDocument();
  });

  it("renders the label when showLabel is true and label is set", () => {
    render(<CollectionDashboardTable component={createComponent()} />);
    expect(screen.getByText("Collection Dashboard")).toBeInTheDocument();
  });

  it("renders the label as an h3 element", () => {
    const { container } = render(
      <CollectionDashboardTable component={createComponent()} />
    );
    const heading = container.querySelector("h3");
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent("Collection Dashboard");
  });

  it("does not render the label when showLabel is false", () => {
    render(
      <CollectionDashboardTable
        component={createComponent({ showLabel: false, label: "Collection Dashboard" })}
      />
    );
    expect(screen.queryByText("Collection Dashboard")).not.toBeInTheDocument();
  });

  it("does not render the label when label is an empty string", () => {
    const { container } = render(
      <CollectionDashboardTable
        component={createComponent({ showLabel: true, label: "" })}
      />
    );
    expect(container.querySelector("h3")).not.toBeInTheDocument();
  });

  it("does not render the label when label is undefined", () => {
    const { container } = render(
      <CollectionDashboardTable
        component={createComponent({ showLabel: true, label: undefined })}
      />
    );
    expect(container.querySelector("h3")).not.toBeInTheDocument();
  });

  it("renders the table element", () => {
    const { container } = render(
      <CollectionDashboardTable component={createComponent()} />
    );
    expect(container.querySelector("table")).toBeInTheDocument();
  });

  it("renders thead, tbody, and tfoot sections", () => {
    const { container } = render(
      <CollectionDashboardTable component={createComponent()} />
    );
    expect(container.querySelector("thead")).toBeInTheDocument();
    expect(container.querySelector("tbody")).toBeInTheDocument();
    expect(container.querySelector("tfoot")).toBeInTheDocument();
  });

  it("renders the State column header", () => {
    render(<CollectionDashboardTable component={createComponent()} />);
    expect(screen.getByText("State")).toBeInTheDocument();
  });

  it("renders the Branch Name column header", () => {
    render(<CollectionDashboardTable component={createComponent()} />);
    expect(screen.getByText("Branch Name")).toBeInTheDocument();
  });

  it("renders all five bucket group headers", () => {
    render(<CollectionDashboardTable component={createComponent()} />);
    expect(screen.getByText("0-Current")).toBeInTheDocument();
    expect(screen.getByText("1-30 Days")).toBeInTheDocument();
    expect(screen.getByText("31-60 Days")).toBeInTheDocument();
    expect(screen.getByText("61-90 Days")).toBeInTheDocument();
    expect(screen.getByText("91+ Days")).toBeInTheDocument();
  });

  it("renders a No Of Cases sub-header for each bucket", () => {
    render(<CollectionDashboardTable component={createComponent()} />);
    expect(screen.getAllByText("No Of Cases")).toHaveLength(5);
  });

  it("renders a POS sub-header for each bucket", () => {
    render(<CollectionDashboardTable component={createComponent()} />);
    expect(screen.getAllByText("POS")).toHaveLength(5);
  });

  it("renders the State A preview row", () => {
    render(<CollectionDashboardTable component={createComponent()} />);
    expect(screen.getByText("State A")).toBeInTheDocument();
  });

  it("renders Branch 1 and Branch 2 preview rows", () => {
    render(<CollectionDashboardTable component={createComponent()} />);
    expect(screen.getByText("Branch 1")).toBeInTheDocument();
    expect(screen.getByText("Branch 2")).toBeInTheDocument();
  });

  it("renders the Total (Sum) footer row", () => {
    render(<CollectionDashboardTable component={createComponent()} />);
    expect(screen.getByText("Total (Sum)")).toBeInTheDocument();
  });

  it("renders exactly two rows in tbody", () => {
    const { container } = render(
      <CollectionDashboardTable component={createComponent()} />
    );
    expect(container.querySelectorAll("tbody tr")).toHaveLength(2);
  });

  it("renders exactly one row in tfoot", () => {
    const { container } = render(
      <CollectionDashboardTable component={createComponent()} />
    );
    expect(container.querySelectorAll("tfoot tr")).toHaveLength(1);
  });

  it("renders exactly two rows in thead", () => {
    const { container } = render(
      <CollectionDashboardTable component={createComponent()} />
    );
    expect(container.querySelectorAll("thead tr")).toHaveLength(2);
  });

  it("sets rowSpan={2} on the State header", () => {
    render(<CollectionDashboardTable component={createComponent()} />);
    const stateHeader = screen.getByText("State").closest("th");
    expect(stateHeader).toHaveAttribute("rowSpan", "2");
  });

  it("sets rowSpan={2} on the Branch Name header", () => {
    render(<CollectionDashboardTable component={createComponent()} />);
    const branchHeader = screen.getByText("Branch Name").closest("th");
    expect(branchHeader).toHaveAttribute("rowSpan", "2");
  });

  it("sets colSpan={2} on each bucket group header", () => {
    render(<CollectionDashboardTable component={createComponent()} />);
    const bucketLabels = ["0-Current", "1-30 Days", "31-60 Days", "61-90 Days", "91+ Days"];
    bucketLabels.forEach((label) => {
      const th = screen.getByText(label).closest("th");
      expect(th).toHaveAttribute("colSpan", "2");
    });
  });

  it("sets colSpan={2} on the Total (Sum) footer cell", () => {
    render(<CollectionDashboardTable component={createComponent()} />);
    const totalCell = screen.getByText("Total (Sum)").closest("td");
    expect(totalCell).toHaveAttribute("colSpan", "2");
  });

  it("sets rowSpan={2} on the State A body cell", () => {
    render(<CollectionDashboardTable component={createComponent()} />);
    const stateCell = screen.getByText("State A").closest("td");
    expect(stateCell).toHaveAttribute("rowSpan", "2");
  });

  it("renders the table inside a scrollable wrapper div", () => {
    const { container } = render(
      <CollectionDashboardTable component={createComponent()} />
    );
    const table = container.querySelector("table");
    expect(table?.parentElement?.tagName).toBe("DIV");
  });

  it("renders the table without a label when showLabel and label are both omitted", () => {
    const component: CollectionDashboardTableComponent = {
      id: "no-label",
      type: "collection-dashboard-table",
      category: "",
      properties: {
        apiUrl: "",
        apiHeaders: "{}",
      },
    };
    const { container } = render(
      <CollectionDashboardTable component={component} />
    );
    expect(container.querySelector("h3")).not.toBeInTheDocument();
    expect(container.querySelector("table")).toBeInTheDocument();
  });

  it("renders with a custom component id", () => {
    const component = createComponent();
    component.id = "custom-id-123";
    const { container } = render(
      <CollectionDashboardTable component={component} />
    );
    expect(container.querySelector("#custom-id-123")).toBeInTheDocument();
  });

  it("renders State A cell inside tbody", () => {
    const { container } = render(
      <CollectionDashboardTable component={createComponent()} />
    );
    const stateCell = container.querySelector("tbody td");
    expect(stateCell).toHaveTextContent("State A");
  });

  it("renders Total (Sum) cell inside tfoot", () => {
    const { container } = render(
      <CollectionDashboardTable component={createComponent()} />
    );
    const tfootCell = container.querySelector("tfoot td");
    expect(tfootCell).toHaveTextContent("Total (Sum)");
  });
});
