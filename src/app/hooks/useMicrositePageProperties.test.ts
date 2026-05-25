import { renderHook, act } from "@testing-library/react";
import { useMicrositePageProperties } from "./useMicrositePageProperties";
import { useUserTask } from "../context/UserTaskContext";

jest.mock("@/app/context/UserTaskContext", () => ({
  useUserTask: jest.fn(),
}));

describe("useMicrositePageProperties", () => {
  let updateUserTaskMock: jest.Mock;
  let userTask: any;

  beforeEach(() => {
    updateUserTaskMock = jest.fn();
    userTask = {
      id: "test-task",
      properties: { title: "Initial Title" },
      otherProp: "initial",
    };
    (useUserTask as jest.Mock).mockReturnValue({
      userTask,
      updateUserTask: updateUserTaskMock,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return the current userTask as page", () => {
    const { result } = renderHook(() => useMicrositePageProperties());
    expect(result.current.page).toEqual(userTask);
  });

  it("should update a top-level property when isProperty is false or undefined", () => {
    const { result } = renderHook(() => useMicrositePageProperties());

    act(() => {
      result.current.setProperty("otherProp", "new value", false);
    });

    expect(updateUserTaskMock).toHaveBeenCalledWith({
      ...userTask,
      otherProp: "new value",
    });
  });

  it("should update a nested property when isProperty is true", () => {
    const { result } = renderHook(() => useMicrositePageProperties());

    act(() => {
      result.current.setProperty("title", "Updated Title");
    });

    expect(updateUserTaskMock).toHaveBeenCalledWith({
      ...userTask,
      properties: {
        ...userTask.properties,
        title: "Updated Title",
      },
    });
  });

  it("should work when userTask.properties is undefined and updating a nested property", () => {
    userTask = { id: "test-task", otherProp: "initial" };
    (useUserTask as jest.Mock).mockReturnValue({
      userTask,
      updateUserTask: updateUserTaskMock,
    });

    const { result } = renderHook(() => useMicrositePageProperties());

    act(() => {
      result.current.setProperty("title", "Updated Title", true);
    });

    expect(updateUserTaskMock).toHaveBeenCalledWith({
      ...userTask,
      properties: {
        title: "Updated Title",
      },
    });
  });

  it("should update a top-level property when isProperty is false or undefined", () => {
    const { result } = renderHook(() => useMicrositePageProperties());

    act(() => {
      result.current.setProperties({ otherProp: "new value" }, false);
    });

    expect(updateUserTaskMock).toHaveBeenCalledWith({
      ...userTask,
      otherProp: "new value",
    });
  });

  it("should update a nested property when isProperty is true", () => {
    const { result } = renderHook(() => useMicrositePageProperties());

    act(() => {
      result.current.setProperties({ title: "Updated Title" }, true);
    });

    expect(updateUserTaskMock).toHaveBeenCalledWith({
      ...userTask,
      properties: {
        ...userTask.properties,
        title: "Updated Title",
      },
    });
  });

  it("should work when userTask.properties is undefined and updating a nested property", () => {
    userTask = { id: "test-task", otherProp: "initial" };
    (useUserTask as jest.Mock).mockReturnValue({
      userTask,
      updateUserTask: updateUserTaskMock,
    });

    const { result } = renderHook(() => useMicrositePageProperties());

    act(() => {
      result.current.setProperties({ title: "Updated Title" });
    });

    expect(updateUserTaskMock).toHaveBeenCalledWith({
      ...userTask,
      properties: {
        title: "Updated Title",
      },
    });
  });
});
