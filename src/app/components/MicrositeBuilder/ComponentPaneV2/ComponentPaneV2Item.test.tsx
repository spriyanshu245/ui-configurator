import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

const setIsDragging = jest.fn();
const setIsDraggingComponent = jest.fn();
const setIsDraggingFormElement = jest.fn();
const setIsFormRowValidation = jest.fn();
const mockUseUserTask = jest.fn();

jest.mock("@/app/context/DragContext", () => ({
  useDragContext: () => ({
    isDragging: false,
    setIsDragging,
    setIsDraggingComponent,
    setIsDraggingFormElement,
    setIsFormRowValidation,
  }),
}));

jest.mock("@/app/context/MicrositeContext", () => ({
  useMicrosite: () => ({
    isEditing: true,
  }),
}));

jest.mock("@/app/context/UserTaskContext", () => ({
  useUserTask: () => mockUseUserTask(),
}));

jest.mock("@/app/hooks/useAutoScroll", () => ({
  useAutoScroll: jest.fn(),
}));

const resetGhostImage = jest.fn();
jest.mock("@/app/utils/utils", () => ({
  resetGhostImage: () => resetGhostImage(),
}));

jest.mock("@/app/components/Tooltip/Tooltip", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip">{children}</div>
  ),
}));

import { ComponentCatalogEntry } from "@/app/types/types";
import ComponentPaneV2Item from "./ComponentPaneV2Item";

const createEntry = (
  overrides: Partial<ComponentCatalogEntry> = {},
  title = "Entry"
): ComponentCatalogEntry => ({
  id: overrides.id ?? "1",
  type: overrides.type ?? "heading",
  title: overrides.title ?? title,
  description: "Description",
  viewCategory: overrides.viewCategory ?? "display",
  keywords: overrides.keywords ?? [],
  displayName: overrides.displayName ?? "Heading",
  category: overrides.category ?? "component",
  properties: overrides.properties ?? {},
  ...overrides,
});

describe("ComponentPaneV2Item", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUserTask.mockReturnValue({
      userTask: {
        properties: {
          showAsPopup: true,
        },
      },
    });
  });

  afterEach(() => {
    document.querySelectorAll("#ghostEl").forEach((el) => el.remove());
  });

  it("renders the pane title", () => {
    render(<ComponentPaneV2Item entry={createEntry()} viewMode="list" />);

    expect(screen.getByText("Entry")).toBeInTheDocument();
  });

  it("uses the same compact icon-only drag preview in list and grid views", () => {
    const getPreviewMarkup = (viewMode: "list" | "grid") => {
      const setDragImage = jest.fn((dragPreview: HTMLElement) => {
        expect(document.body.contains(dragPreview)).toBe(true);
      });
      const setData = jest.fn();
      const { unmount } = render(
        <ComponentPaneV2Item entry={createEntry()} viewMode={viewMode} />
      );

      fireEvent.dragStart(screen.getByRole("presentation"), {
        dataTransfer: {
          setData,
          setDragImage,
          effectAllowed: "",
        },
      });

      const dragPreview = setDragImage.mock.calls[0][0] as HTMLElement;
      expect(dragPreview).toHaveClass("dragPreview");
      expect(dragPreview.querySelector("[data-drag-preview-icon]")).not.toBeNull();
      expect(dragPreview.querySelector(".itemBody")).toBeNull();
      expect(dragPreview).not.toHaveTextContent("Entry");
      expect(dragPreview).not.toHaveTextContent("Description");

      const previewMarkup = dragPreview.outerHTML;
      unmount();
      document.querySelectorAll("#ghostEl").forEach((el) => el.remove());

      return previewMarkup;
    };

    const listPreviewMarkup = getPreviewMarkup("list");
    const gridPreviewMarkup = getPreviewMarkup("grid");

    expect(listPreviewMarkup).toBe(gridPreviewMarkup);
  });

  it("uses the component-category drag payload shape", () => {
    render(<ComponentPaneV2Item entry={createEntry()} viewMode="list" />);

    const item = screen.getByRole("presentation");
    const setData = jest.fn();

    fireEvent.dragStart(item, {
      dataTransfer: {
        setData,
        setDragImage: jest.fn(),
        effectAllowed: "",
      },
    });

    const entry = createEntry();
    expect(setData).toHaveBeenCalledWith(
      "application/json",
      JSON.stringify({
        ...entry,
        isComponent: true,
      })
    );
    expect(setIsDraggingComponent).toHaveBeenCalledWith(true);
  });

  it("keeps dragging when custom drag image setup fails", () => {
    render(<ComponentPaneV2Item entry={createEntry()} viewMode="list" />);

    const setData = jest.fn();

    fireEvent.dragStart(screen.getByRole("presentation"), {
      dataTransfer: {
        setData,
        setDragImage: () => {
          throw new Error("setDragImage failed");
        },
        effectAllowed: "",
      },
    });

    const entry = createEntry();
    expect(setData).toHaveBeenCalledWith(
      "application/json",
      JSON.stringify({
        ...entry,
        isComponent: true,
      })
    );
    expect(setIsDragging).toHaveBeenCalledWith(true);
    expect(document.getElementById("ghostEl")).toBeNull();
  });

  it("uses the form-category drag payload shape", () => {
    const entry = createEntry(
      {
        type: "input",
        category: "form",
        displayName: "Text Input",
      },
      "Input Field"
    );

    render(<ComponentPaneV2Item entry={entry} viewMode="list" />);

    const setData = jest.fn();
    fireEvent.dragStart(screen.getByRole("presentation"), {
      dataTransfer: {
        setData,
        setDragImage: jest.fn(),
        effectAllowed: "",
      },
    });

    expect(setData).toHaveBeenCalledWith(
      "application/json",
      JSON.stringify({
        ...entry,
        isComponent: false,
        isFormElement: true,
      })
    );
    expect(setIsDraggingFormElement).toHaveBeenCalledWith(true);
  });

  it("uses the common-category drag payload shape", () => {
    const entry = createEntry(
      {
        type: "spacer",
        category: "",
        displayName: "Spacer",
      },
      "Spacer"
    );

    render(<ComponentPaneV2Item entry={entry} viewMode="grid" />);

    const setData = jest.fn();
    fireEvent.dragStart(screen.getByRole("presentation"), {
      dataTransfer: {
        setData,
        setDragImage: jest.fn(),
        effectAllowed: "",
      },
    });

    expect(setData).toHaveBeenCalledWith(
      "application/json",
      JSON.stringify(entry)
    );
    expect(setIsDraggingComponent).toHaveBeenCalledWith(true);
    expect(setIsDraggingFormElement).toHaveBeenCalledWith(true);
  });

  it("disables the form card when the form limit is reached", () => {
    const entry = createEntry(
      {
        type: "form",
        category: "component",
        displayName: "Form",
      },
      "Form"
    );

    render(
      <ComponentPaneV2Item entry={entry} viewMode="list" isFormFound />
    );

    expect(screen.getByRole("presentation")).toHaveAttribute("draggable", "false");
  });

  it("disables external integration when the page is not popup-enabled", () => {
    mockUseUserTask.mockReturnValueOnce({
      userTask: {
        properties: {
          showAsPopup: false,
        },
      },
    });

    const entry = createEntry(
      {
        type: "external-integration",
        category: "component",
        displayName: "External Integration",
      },
      "External Integration"
    );

    render(<ComponentPaneV2Item entry={entry} viewMode="list" />);

    expect(screen.getByRole("presentation")).toHaveAttribute("draggable", "false");
  });

  it("cleans up the generated preview on drag end", () => {
    render(<ComponentPaneV2Item entry={createEntry()} viewMode="list" />);

    const item = screen.getByRole("presentation");

    fireEvent.dragStart(item, {
      dataTransfer: {
        setData: jest.fn(),
        setDragImage: jest.fn(),
        effectAllowed: "",
      },
    });

    fireEvent.dragEnd(item);

    expect(resetGhostImage).toHaveBeenCalled();
  });
});
