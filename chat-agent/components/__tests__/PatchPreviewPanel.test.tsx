/**
 * @jest-environment jsdom
 */
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
  () => ({ __esModule: true, default: () => <div>live</div> }),
);

import { PatchPreviewPanel } from "../PatchPreviewPanel";
import type { PreviewComponent } from "../../lib/added-components";

const components: PreviewComponent[] = [
  { type: "form", label: "Customer", op: "add", fields: [{ key: "name", value: "Name" }], children: [] },
  { type: "button-v2", label: "Submit", op: "add", fields: [], children: [] },
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
  it("renders the short title and the longer description as a subtitle", () => {
    render(<PatchPreviewPanel {...baseProps} />);
    expect(screen.getByText("Preview · 2 components")).toBeInTheDocument();
    expect(screen.getByText(/Add a customer form/)).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = jest.fn();
    render(<PatchPreviewPanel {...baseProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /close preview/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("minimizes and restores the body via the minimize toggle", () => {
    render(<PatchPreviewPanel {...baseProps} />);
    // Body (structured fields) is visible initially.
    expect(screen.getByText("form")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /minimize preview/i }));
    // Collapsed: body content is gone but the header/title remains.
    expect(screen.queryByText("form")).not.toBeInTheDocument();
    expect(screen.getByText("Preview · 2 components")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /expand preview/i }));
    expect(screen.getByText("form")).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    const { container } = render(<PatchPreviewPanel {...baseProps} open={false} />);
    expect(container).toBeEmptyDOMElement();
  });
});
