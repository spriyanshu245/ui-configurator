import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ComponentItem from "./ComponentItem";
import "@testing-library/jest-dom";

const setIsDragging = jest.fn();
const setIsDraggingComponent = jest.fn();
const setIsDraggingFormElement = jest.fn();
const setIsFormRowValidation = jest.fn();

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
  useUserTask: () => ({
    userTask: {
      properties: {
        showAsPopup: true,
      },
    },
  }),
}));

jest.mock("@/app/hooks/useAutoScroll", () => ({
  useAutoScroll: jest.fn(),
}));

const resetGhostImage = jest.fn();
jest.mock("@/app/utils/utils", () => ({
  resetGhostImage: () => resetGhostImage(),
}));

jest.mock("../../Tooltip/Tooltip", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip">{children}</div>
  ),
}));

jest.mock("@/app/data/componentIcons", () => ({
  componentIcons: [
    {
      type: "text",
      svgCode: "<svg data-testid='text-icon'></svg>",
    },
    {
      type: "placeholder",
      svgCode: "<svg data-testid='placeholder-icon'></svg>",
    },
  ],
}));

const mockUseUserTask = jest.fn();

jest.mock("@/app/context/UserTaskContext", () => ({
  useUserTask: () => mockUseUserTask(),
}));

const baseComponent = {
  type: "text",
  displayName: "Text",
  category: "component",
};

describe("ComponentItem", () => {
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

  it("renders component label", () => {
    render(<ComponentItem component={baseComponent as any} />);

    expect(screen.getByText("Text")).toBeInTheDocument();
  });

  it("is draggable when editing and not disabled", () => {
    render(<ComponentItem component={baseComponent as any} />);

    const item = screen.getByRole("presentation");
    expect(item).toHaveAttribute("draggable", "true");
  });

  it("starts dragging a component with the default cloned ghost", () => {
    render(<ComponentItem component={baseComponent as any} />);

    const item = screen.getByRole("presentation");
    const setDragImage = jest.fn((ghostEl: HTMLElement) => {
      expect(document.body.contains(ghostEl)).toBe(true);
    });

    fireEvent.dragStart(item, {
      dataTransfer: {
        setData: jest.fn(),
        setDragImage,
        effectAllowed: "",
      },
    });

    const ghostEl = setDragImage.mock.calls[0][0] as HTMLElement;
    expect(ghostEl.id).toBe("ghostEl");
    expect(ghostEl).toHaveTextContent("Text");
    expect(setIsDragging).toHaveBeenCalledWith(true);
    expect(setIsDraggingComponent).toHaveBeenCalledWith(true);
  });

  it("ends dragging and resets state", () => {
    const { container } = render(
      <ComponentItem component={baseComponent as any} />
    );
    
    const item = container.querySelector(
      '[role="presentation"]:not(#ghostEl)'
    ) as HTMLElement;

    fireEvent.dragStart(item, {
      dataTransfer: {
        setData: jest.fn(),
        setDragImage: jest.fn(),
        effectAllowed: "",
      },
    });

    fireEvent.dragEnd(item);

    expect(setIsDraggingComponent).toHaveBeenCalledWith(false);
    expect(setIsDraggingFormElement).toHaveBeenCalledWith(false);
    expect(setIsFormRowValidation).toHaveBeenCalledWith(false);
    expect(setIsDragging).toHaveBeenCalledWith(false);
    expect(resetGhostImage).toHaveBeenCalled();
  });

  it("disables dragging when form already exists", () => {
    const { container } = render(
      <ComponentItem
        component={{ ...baseComponent, type: "form" } as any}
        isFormFound
      />
    );

    const item = container.querySelector(
      '[role="presentation"]:not(#ghostEl)'
    ) as HTMLElement;

    expect(item).toHaveAttribute("draggable", "false");
  });

  it("disables external integration when not popup page", () => {
    mockUseUserTask.mockReturnValueOnce({
      userTask: {
        properties: {
          showAsPopup: false,
        },
      },
    });

    const { container } = render(
      <ComponentItem
        component={
          {
            ...baseComponent,
            type: "external-integration",
          } as any
        }
      />
    );

    const item = container.querySelector(
      '[role="presentation"]:not(#ghostEl)'
    ) as HTMLElement;

    expect(item).toHaveAttribute("draggable", "false");
  });

  it("sets form row validation for form-row type", () => {
    const { container } = render(
      <ComponentItem
        component={
          {
            ...baseComponent,
            category: "form",
            type: "form-row",
          } as any
        }
      />
    );

    const item = container.querySelector(
      '[role="presentation"]:not(#ghostEl)'
    ) as HTMLElement;

    fireEvent.dragStart(item, {
      dataTransfer: {
        setData: jest.fn(),
        setDragImage: jest.fn(),
        effectAllowed: "",
      },
    });

    expect(setIsDraggingFormElement).toHaveBeenCalledWith(true);
    expect(setIsFormRowValidation).toHaveBeenCalledWith(true);
  });
});
