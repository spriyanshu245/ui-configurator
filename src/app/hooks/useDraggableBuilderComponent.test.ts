import { act, renderHook } from "@testing-library/react";
import { useDraggableBuilderComponent } from "./useDraggableBuilderComponent";
import { useDragContext } from "@/app/context/DragContext";
import { useMicrosite } from "@/app/context/MicrositeContext";
import { useUserTask } from "@/app/context/UserTaskContext";
import { useAutoScroll } from "@/app/hooks/useAutoScroll";
import { resetGhostImage } from "@/app/utils/utils";
import { applyCustomDragPreview } from "@/app/utils/dragPreview";

jest.mock("@/app/context/DragContext", () => ({
  useDragContext: jest.fn(),
}));

jest.mock("@/app/context/MicrositeContext", () => ({
  useMicrosite: jest.fn(),
}));

jest.mock("@/app/context/UserTaskContext", () => ({
  useUserTask: jest.fn(),
}));

jest.mock("@/app/hooks/useAutoScroll", () => ({
  useAutoScroll: jest.fn(),
}));

jest.mock("@/app/utils/utils", () => ({
  resetGhostImage: jest.fn(),
}));

jest.mock("@/app/utils/dragPreview", () => ({
  applyCustomDragPreview: jest.fn(),
}));

describe("useDraggableBuilderComponent", () => {
  const mockSetIsDragging = jest.fn();
  const mockSetIsDraggingComponent = jest.fn();
  const mockSetIsDraggingFormElement = jest.fn();
  const mockSetIsFormRowValidation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useDragContext as jest.Mock).mockReturnValue({
      isDragging: false,
      setIsDragging: mockSetIsDragging,
      setIsDraggingComponent: mockSetIsDraggingComponent,
      setIsDraggingFormElement: mockSetIsDraggingFormElement,
      setIsFormRowValidation: mockSetIsFormRowValidation,
    });

    (useMicrosite as jest.Mock).mockReturnValue({ isEditing: true });
    (useUserTask as jest.Mock).mockReturnValue({
      userTask: { properties: { showAsPopup: false } },
    });
  });

  test("prevents dragging external integration when the page is not popup", () => {
    const preventDefault = jest.fn();
    const event = {
      preventDefault,
      currentTarget: document.createElement("div"),
      dataTransfer: {
        setData: jest.fn(),
        effectAllowed: "",
      },
    };

    const { result } = renderHook(() =>
      useDraggableBuilderComponent({
        component: {
          id: "ext-1",
          type: "external-integration",
          category: "component",
        } as any,
        ghostClassName: "ghost",
      }),
    );

    act(() => {
      result.current.handleDragStart(event as any);
    });

    expect(result.current.disableExternalIntegration).toBe(true);
    expect(result.current.isDisabled).toBe(true);
    expect(preventDefault).toHaveBeenCalled();
    expect(resetGhostImage).toHaveBeenCalled();
    expect(applyCustomDragPreview).not.toHaveBeenCalled();
    expect(mockSetIsDragging).not.toHaveBeenCalled();
  });

  test("resets drag state on drag end", () => {
    const { result } = renderHook(() =>
      useDraggableBuilderComponent({
        component: {
          id: "component-1",
          type: "text",
          category: "component",
        } as any,
        ghostClassName: "ghost",
      }),
    );

    act(() => {
      result.current.handleDragEnd();
    });

    expect(mockSetIsDraggingComponent).toHaveBeenCalledWith(false);
    expect(mockSetIsDraggingFormElement).toHaveBeenCalledWith(false);
    expect(mockSetIsFormRowValidation).toHaveBeenCalledWith(false);
    expect(mockSetIsDragging).toHaveBeenCalledWith(false);
    expect(resetGhostImage).toHaveBeenCalled();
    expect(useAutoScroll).toHaveBeenCalledWith(false);
  });

  test("starts dragging a regular component", () => {
    const setData = jest.fn();
    const event = {
      currentTarget: document.createElement("div"),
      dataTransfer: {
        setData,
        effectAllowed: "",
      },
    };

    const { result } = renderHook(() =>
      useDraggableBuilderComponent({
        component: {
          id: "component-1",
          type: "text",
          category: "component",
        } as any,
        ghostClassName: "ghost",
      }),
    );

    act(() => {
      result.current.handleDragStart(event as any);
    });

    expect(applyCustomDragPreview).toHaveBeenCalledWith(
      expect.objectContaining({
        event,
        sourceEl: event.currentTarget,
        fallbackCloneClassName: "ghost",
      }),
    );
    expect(setData).toHaveBeenCalledWith(
      "application/json",
      JSON.stringify({
        id: "component-1",
        type: "text",
        category: "component",
        isComponent: true,
      }),
    );
    expect(event.dataTransfer.effectAllowed).toBe("copy");
    expect(mockSetIsDraggingComponent).toHaveBeenCalledWith(true);
    expect(mockSetIsDragging).toHaveBeenCalledWith(true);
  });

  test("starts dragging a form component and tracks form-row validation", () => {
    const setData = jest.fn();
    const event = {
      currentTarget: document.createElement("div"),
      dataTransfer: {
        setData,
        effectAllowed: "",
      },
    };

    const { result } = renderHook(() =>
      useDraggableBuilderComponent({
        component: {
          id: "form-row-1",
          type: "form-row",
          category: "form",
        } as any,
        ghostClassName: "ghost",
      }),
    );

    act(() => {
      result.current.handleDragStart(event as any);
    });

    expect(setData).toHaveBeenCalledWith(
      "application/json",
      JSON.stringify({
        id: "form-row-1",
        type: "form-row",
        category: "form",
        isComponent: false,
        isFormElement: true,
      }),
    );
    expect(mockSetIsDraggingFormElement).toHaveBeenCalledWith(true);
    expect(mockSetIsFormRowValidation).toHaveBeenCalledWith(true);
    expect(mockSetIsDragging).toHaveBeenCalledWith(true);
  });

  test("starts dragging an uncategorized component as both component and form element", () => {
    const setData = jest.fn();
    const event = {
      currentTarget: document.createElement("div"),
      dataTransfer: {
        setData,
        effectAllowed: "",
      },
    };

    const { result } = renderHook(() =>
      useDraggableBuilderComponent({
        component: {
          id: "misc-1",
          type: "custom",
          category: "",
        } as any,
        ghostClassName: "ghost",
      }),
    );

    act(() => {
      result.current.handleDragStart(event as any);
    });

    expect(setData).toHaveBeenCalledWith(
      "application/json",
      JSON.stringify({
        id: "misc-1",
        type: "custom",
        category: "",
      }),
    );
    expect(mockSetIsDraggingComponent).toHaveBeenCalledWith(true);
    expect(mockSetIsDraggingFormElement).toHaveBeenCalledWith(true);
    expect(mockSetIsDragging).toHaveBeenCalledWith(true);
  });

  test("disables dragging forms when a form already exists", () => {
    const { result } = renderHook(() =>
      useDraggableBuilderComponent({
        component: {
          id: "form-1",
          type: "form",
          category: "component",
        } as any,
        isFormFound: true,
        ghostClassName: "ghost",
      }),
    );

    expect(result.current.isDisabled).toBe(true);
    expect(result.current.draggable).toBe(false);
    expect(result.current.showTooltip).toBe(true);
    expect(result.current.tooltipText).toContain(
      "A page can have a maximum of",
    );
  });
});
