import { renderHook } from "@testing-library/react";
import { act } from "react";
import { useAutoScroll } from "./useAutoScroll";

class MockDragEvent extends Event {
  clientY: number;

  constructor(type: string, props: { clientY: number; bubbles?: boolean }) {
    super(type, { bubbles: props.bubbles ?? true });
    this.clientY = props.clientY;
  }
}

// @ts-ignore
global.DragEvent = MockDragEvent;

describe("Test useAutoScroll", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(window, "scrollBy").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it("does nothing when isDragging is false", () => {
    renderHook(() => useAutoScroll(false));
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(window.scrollBy).not.toHaveBeenCalled();
  });

  it("scrolls when dragging near the top edge", () => {
    const mockContainer = {
      getBoundingClientRect: () => ({ top: 200, bottom: 700 }),
      scrollTop: 0,
    };
    jest
      .spyOn(document, "getElementById")
      .mockReturnValue(mockContainer as unknown as HTMLElement);

    const { unmount } = renderHook(() => useAutoScroll(true));

    const dragOverEvent = new Event("dragover", { bubbles: true });
    Object.defineProperty(dragOverEvent, "clientY", { value: 250 });
    document.dispatchEvent(dragOverEvent);

    act(() => {
      jest.advanceTimersByTime(50);
    });

    expect(mockContainer.scrollTop).toBeLessThan(0);
    unmount();
  });

  it("scrolls when dragging near the bottom edge", () => {
    const mockContainer = {
      getBoundingClientRect: () => ({ top: 100, bottom: 600 }),
      scrollTop: 0,
    };
    jest
      .spyOn(document, "getElementById")
      .mockReturnValue(mockContainer as unknown as HTMLElement);

    const { unmount } = renderHook(() => useAutoScroll(true));

    const dragOverEvent = new DragEvent("dragover", {
      bubbles: true,
      clientY: 580,
    });
    document.dispatchEvent(dragOverEvent);

    act(() => {
      jest.advanceTimersByTime(20);
    });

    expect(mockContainer.scrollTop).toBeGreaterThan(0);
    unmount();
  });

  it("cleans up on unmount by clearing the interval and removing event listeners", () => {
    const removeSpy = jest.spyOn(document, "removeEventListener");
    const { unmount } = renderHook(() => useAutoScroll(true));
    unmount();

    expect(removeSpy).toHaveBeenCalledWith("dragover", expect.any(Function));
  });

  it("does not scroll when scrollDirectionRef is null", () => {
    renderHook(() => useAutoScroll(true));

    act(() => {
      jest.advanceTimersByTime(10);
    });

    expect(window.scrollBy).not.toHaveBeenCalled();
  });
});
