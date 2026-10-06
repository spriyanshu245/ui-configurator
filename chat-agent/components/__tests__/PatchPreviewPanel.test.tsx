import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";

// The panel imports the app's heavy providers + lazy renderer only for the Live
// tab; stub them so the test stays light (default tab is the structured view).
jest.mock("../../../src/app/context/DragContext", () => ({
  DragProvider: ({ children }: any) => <>{children}</>,
}));
jest.mock("../../../src/app/context/PropertiesContext", () => ({
  PropertyPaneProvider: ({ children }: any) => <>{children}</>,
}));
jest.mock(
  "../../../src/app/components/ComponentRenderer/ComponentRenderer",
  () => ({
    __esModule: true,
    default: ({ component }: any) => {
      if (component.boom) throw new Error("render failed");
      return <div>live:{component.type}</div>;
    },
  }),
);

import { PatchPreviewPanel } from "../PatchPreviewPanel";
import type { PreviewComponent } from "../../lib/added-components";

const components: PreviewComponent[] = [
  {
    type: "form",
    label: "Customer",
    op: "add",
    fields: [{ key: "name", value: "Name" }],
    children: [{ type: "input", op: "add", fields: [], children: [] }],
  },
  { type: "button-v2", label: "Submit", op: "replace", fields: [], children: [] },
];

const baseProps = {
  open: true,
  title: "Preview · 2 components",
  subtitle: "Add a customer form with a submit button that routes to the overview page",
  components,
  rawNodes: [{ type: "form" }, { type: "button-v2" }],
  width: 380,
  offsetRight: 450,
  onClose: jest.fn(),
};

describe("PatchPreviewPanel", () => {
  it("renders the title, the longer subtitle, and the panel geometry", () => {
    render(<PatchPreviewPanel {...baseProps} />);
    expect(screen.getByText("Preview · 2 components")).toBeInTheDocument();
    expect(screen.getByText(/Add a customer form/)).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Component preview" })).toHaveStyle({
      width: "380px",
      right: "450px",
    });
  });

  it("defaults the title and omits the subtitle when not provided", () => {
    render(<PatchPreviewPanel {...baseProps} title={undefined} subtitle={undefined} />);
    expect(screen.getByText("Preview")).toBeInTheDocument();
  });

  it("lists fields, nested children and a badge for changed components", () => {
    render(<PatchPreviewPanel {...baseProps} />);
    expect(screen.getByText("Customer")).toBeInTheDocument();
    expect(screen.getByText("name")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("input")).toBeInTheDocument();
    expect(screen.getAllByText("changed")).toHaveLength(1);
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = jest.fn();
    render(<PatchPreviewPanel {...baseProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /close preview/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("minimizes and restores the body, hiding subtitle and mode toggle while minimized", () => {
    render(<PatchPreviewPanel {...baseProps} />);
    expect(screen.getByText("form")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /minimize preview/i }));
    expect(screen.queryByText("form")).not.toBeInTheDocument();
    expect(screen.queryByText(/Add a customer form/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Live" })).not.toBeInTheDocument();
    expect(screen.getByText("Preview · 2 components")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /expand preview/i }));
    expect(screen.getByText("form")).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    const { container } = render(<PatchPreviewPanel {...baseProps} open={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("explains an empty change and offers no mode toggle", () => {
    render(<PatchPreviewPanel {...baseProps} components={[]} rawNodes={[]} />);
    expect(screen.getByText("This change adds no new components.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Live" })).not.toBeInTheDocument();
  });

  it("switches to a live render of each raw node and back to fields", async () => {
    render(<PatchPreviewPanel {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Live" }));
    expect(await screen.findByText("live:form")).toBeInTheDocument();
    expect(screen.getByText("live:button-v2")).toBeInTheDocument();
    expect(screen.queryByText("Customer")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Fields" }));
    expect(screen.getByText("Customer")).toBeInTheDocument();
  });

  it("falls back to the fields view when the live renderer throws", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    render(<PatchPreviewPanel {...baseProps} rawNodes={[{ type: "form", boom: true }]} />);
    fireEvent.click(screen.getByRole("button", { name: "Live" }));
    expect(await screen.findByText(/Live preview unavailable/)).toBeInTheDocument();
    expect(screen.getByText("Customer")).toBeInTheDocument();
    errorSpy.mockRestore();
  });
});
