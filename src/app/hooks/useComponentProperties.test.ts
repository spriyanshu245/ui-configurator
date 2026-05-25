import { renderHook, act } from "@testing-library/react";
import { useComponentProperties } from "./useComponentProperties";
import { useUserTask } from "@/app/context/UserTaskContext";

jest.mock("@/app/context/UserTaskContext", () => ({
  useUserTask: jest.fn(),
}));

describe("useComponentProperties", () => {
  const dummyComponentId = "comp1";
  const dummyComponent = { id: dummyComponentId, name: "Test Component" };

  let updateComponentPropertiesMock: jest.Mock;
  let getComponentByIdMock: jest.Mock;

  beforeEach(() => {
    updateComponentPropertiesMock = jest.fn();
    getComponentByIdMock = jest.fn().mockReturnValue(dummyComponent);

    (useUserTask as jest.Mock).mockReturnValue({
      updateComponentProperties: updateComponentPropertiesMock,
      getComponentById: getComponentByIdMock,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("returns the component from getComponentById", () => {
    const { result } = renderHook(() =>
      useComponentProperties(dummyComponentId)
    );
    expect(getComponentByIdMock).toHaveBeenCalledWith(dummyComponentId);
    expect(result.current.component).toEqual(dummyComponent);
  });

  test("setProperty calls updateComponentProperties with correct parameters", () => {
    const { result } = renderHook(() =>
      useComponentProperties(dummyComponentId)
    );
    act(() => {
      result.current.setProperty("testKey", "testValue");
    });
    expect(updateComponentPropertiesMock).toHaveBeenCalledWith(
      dummyComponentId,
      "testKey",
      "testValue",
      undefined
    );
  });

  test("setProperties calls updateComponentProperties with provided properties", () => {
    const { result } = renderHook(() =>
      useComponentProperties(dummyComponentId)
    );
    const propsToUpdate = { key1: "value1", key2: "value2" };
    
    act(() => {
      result.current.setProperties(propsToUpdate);
    });
    
    expect(updateComponentPropertiesMock).toHaveBeenCalledTimes(1);
    expect(updateComponentPropertiesMock).toHaveBeenCalledWith(
      dummyComponentId,
      propsToUpdate,
      undefined,
      undefined
    );
  });

});
