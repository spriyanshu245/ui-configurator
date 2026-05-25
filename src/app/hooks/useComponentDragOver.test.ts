// src/app/hooks/useComponentDragOver.test.ts
import { renderHook } from "@testing-library/react";
import { act } from "react";
import { useComponentDragOver } from "./useComponentDragOver";

describe("useComponentDragOver", () => {
  // Create a dummy DragEvent object with necessary methods.
  const createDummyDragEvent = (clientY?: number, jsonData: any = {}) => {
    return {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      clientY,
      dataTransfer: {
        getData: jest.fn(() => JSON.stringify(jsonData)),
      },
    } as unknown as React.DragEvent<HTMLDivElement>;
  };

  it("should initialize with isDragOver false and dragOverIndex null", () => {
    const { result } = renderHook(() => useComponentDragOver());
    expect(result.current.isDragOver).toBe(false);
    expect(result.current.dragOverIndex).toBe(null);
  });

  it("handleDragOver should set isDragOver to true and update dragOverIndex", () => {
    const { result } = renderHook(() => useComponentDragOver());
    const dummyEvent = createDummyDragEvent(undefined);
    act(() => {
      result.current.handleDragOver(dummyEvent, 5);
    });
    expect(dummyEvent.preventDefault).toHaveBeenCalled();
    expect(dummyEvent.stopPropagation).toHaveBeenCalled();
    expect(result.current.isDragOver).toBe(true);
    expect(result.current.dragOverIndex).toBe(5);
  });

  it("handleDragOver should not update state if already dragging", () => {
    const { result } = renderHook(() => useComponentDragOver());
    const firstEvent = createDummyDragEvent(undefined);
    act(() => {
      result.current.handleDragOver(firstEvent, 3);
    });
    expect(result.current.isDragOver).toBe(true);
    expect(result.current.dragOverIndex).toBe(3);

    // Second call with different index should be ignored since isDragOver is already true.
    const secondEvent = createDummyDragEvent(undefined);
    act(() => {
      result.current.handleDragOver(secondEvent, 7);
    });
    // The state remains unchanged.
    expect(result.current.isDragOver).toBe(true);
    expect(result.current.dragOverIndex).toBe(3);
  });

  it("handleDragLeave should reset isDragOver and dragOverIndex", () => {
    const { result } = renderHook(() => useComponentDragOver());
    const dummyEvent = createDummyDragEvent(undefined);
    act(() => {
      result.current.handleDragOver(dummyEvent, 2);
    });
    expect(result.current.isDragOver).toBe(true);
    act(() => {
      result.current.handleDragLeave(dummyEvent);
    });
    expect(dummyEvent.preventDefault).toHaveBeenCalled();
    expect(dummyEvent.stopPropagation).toHaveBeenCalled();
    expect(result.current.isDragOver).toBe(false);
    expect(result.current.dragOverIndex).toBe(null);
  });

  it("handleDrop should reset state and return parsed data", () => {
    const { result } = renderHook(() => useComponentDragOver());
    const dummyData = { foo: "bar" };
    const dummyEvent = createDummyDragEvent(undefined, dummyData);

    // First, set state to simulate that drag is active.
    act(() => {
      result.current.handleDragOver(dummyEvent, 4);
    });
    expect(result.current.isDragOver).toBe(true);

    let returnedData: any;
    act(() => {
      returnedData = result.current.handleDrop(dummyEvent);
    });
    expect(dummyEvent.preventDefault).toHaveBeenCalled();
    expect(dummyEvent.stopPropagation).toHaveBeenCalled();
    expect(result.current.isDragOver).toBe(false);
    expect(result.current.dragOverIndex).toBe(null);
    expect(returnedData).toEqual(dummyData);
  });
});
