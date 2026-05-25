import { act, renderHook } from "@testing-library/react";
import { useUserTaskComponentActions } from "./useUserTaskComponentActions";
import * as componentUtils from "../utils/userTask/componentUtils";
import {
  UIComponent,
  BaseComponent,
  UserTask,
  ComponentGroup,
} from "../types/types";

// --- Mocks ---
jest.mock("../utils/userTask/componentUtils", () => ({
  addComponentToPage: jest.fn(),
  addComponentToComponentAtIndex: jest.fn(),
  removeComponentFromComponent: jest.fn(),
  updateComponent: jest.fn(),
}));

// --- Test Setup ---
const initialUserTask: UserTask = {
  components: [],
};

describe("useUserTaskComponentActions", () => {
  let currentState: UserTask;
  let setUserTask: jest.Mock;
  let hookResult: ReturnType<typeof useUserTaskComponentActions<UserTask>>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock State Management
    currentState = JSON.parse(JSON.stringify(initialUserTask));
    setUserTask = jest.fn((updater) => {
      // Handle both functional updates and direct values
      const newState =
        typeof updater === "function" ? updater(currentState) : updater;
      currentState = newState;
      return newState;
    });

    const { result } = renderHook(() =>
      useUserTaskComponentActions(setUserTask)
    );
    hookResult = result.current;
  });

  // 1. addComponent
  it("addComponent calls addComponentToPage and updates state", () => {
    const newComponent = {
      id: "new1",
      type: "box",
      category: "component",
    } as UIComponent;
    const updatedList = [newComponent];

    (componentUtils.addComponentToPage as jest.Mock).mockReturnValue(
      updatedList
    );

    act(() => {
      hookResult.addComponent(newComponent, "");
    });

    expect(componentUtils.addComponentToPage).toHaveBeenCalledWith(
      initialUserTask.components,
      newComponent,
      ""
    );
    expect(currentState.components).toEqual(updatedList);
  });

  // 2. addComponentAtIndex
  it("addComponentAtIndex calls addComponentToComponentAtIndex and updates state", () => {
    const newComponent = {
      id: "new1",
      type: "box",
      category: "component",
    } as UIComponent;
    const updatedList = [newComponent];

    (
      componentUtils.addComponentToComponentAtIndex as jest.Mock
    ).mockReturnValue(updatedList);

    act(() => {
      hookResult.addComponentAtIndex(newComponent, "parent1", 1);
    });

    expect(componentUtils.addComponentToComponentAtIndex).toHaveBeenCalledWith(
      initialUserTask.components,
      newComponent,
      "parent1",
      1
    );
    expect(currentState.components).toEqual(updatedList);
  });

  // 3. removeComponent
  it("removeComponent calls removeComponentFromComponent and updates state", () => {
    (componentUtils.removeComponentFromComponent as jest.Mock).mockReturnValue(
      []
    );

    act(() => {
      hookResult.removeComponent("comp1");
    });

    expect(componentUtils.removeComponentFromComponent).toHaveBeenCalledWith(
      initialUserTask.components,
      "comp1"
    );
  });

  // 4. moveComponentToIndex
  it("moveComponentToIndex removes component (capturing it) and adds it to new index", () => {
    const componentToMove = {
      id: "moveMe",
      type: "input",
      category: "component",
    } as BaseComponent;
    const targetId = "targetParent";
    const targetIndex = 2;

    // Mock Remove: Must invoke callback to capture 'componentToMove'
    (
      componentUtils.removeComponentFromComponent as jest.Mock
    ).mockImplementation((list, id, callback) => {
      if (callback) callback(componentToMove);
      return []; // Return empty list representing removal
    });

    // Mock Add
    const finalState = [componentToMove];
    (
      componentUtils.addComponentToComponentAtIndex as jest.Mock
    ).mockReturnValue(finalState);

    act(() => {
      hookResult.moveComponentToIndex("moveMe", targetId, targetIndex);
    });

    // Check Remove
    expect(componentUtils.removeComponentFromComponent).toHaveBeenCalledWith(
      expect.any(Array),
      "moveMe",
      expect.any(Function)
    );

    // Check Add (ensures the captured component was passed)
    expect(componentUtils.addComponentToComponentAtIndex).toHaveBeenCalledWith(
      [], // The list returned from remove
      componentToMove,
      targetId,
      targetIndex
    );
    expect(currentState.components).toEqual(finalState);
  });

  // 5. addComponentToComponent (Testing the Updater Logic)
  it("addComponentToComponent updates parent component children correctly", () => {
    const parentId = "parent1";
    const newComponent = {
      id: "child1",
      type: "btn",
      category: "component",
    } as UIComponent;
    const index = 0;

    // We need to simulate the implementation of updateComponent to verify the callback logic
    (componentUtils.updateComponent as jest.Mock).mockImplementation(
      (list, id, updater) => {
        // Create a mock parent to pass to the updater callback
        const mockParent = {
          id: parentId,
          type: "container",
          category: "component",
          components: [],
        };
        // Run the callback defined in the hook
        updater(mockParent);

        // Return modified structure
        return [mockParent];
      }
    );

    act(() => {
      hookResult.addComponentToComponent(parentId, newComponent, index);
    });

    // Use optional chaining to safely access components
    expect(currentState.components[0]?.components).toContain(newComponent);
  });

  it("addComponentToComponent handles input-grid-row special splice logic", () => {
    const parentId = "gridRow";
    const newComponent = { id: "child1", category: "component" } as UIComponent;

    (componentUtils.updateComponent as jest.Mock).mockImplementation(
      (list, id, updater) => {
        const mockRow = {
          id: parentId,
          type: "input-grid-row", // Special type
          category: "component",
          components: [{ id: "existing", category: "component" }],
        };
        updater(mockRow);
        return [mockRow];
      }
    );

    act(() => {
      // Index 0
      hookResult.addComponentToComponent(parentId, newComponent, 0);
    });

    // Check the result logic
    expect(currentState.components[0]?.components).toHaveLength(1);
    expect(currentState.components[0]?.components?.[0]).toEqual(newComponent);
  });

  // 6. updateComponentProperties
  it("updateComponentProperties handles string key update", () => {
    (componentUtils.updateComponent as jest.Mock).mockImplementation(
      (list, id, updater) => {
        const mockComp = {
          id,
          category: "component",
          properties: { old: "val" },
        };
        updater(mockComp);
        return [mockComp];
      }
    );

    act(() => {
      hookResult.updateComponentProperties("comp1", "label", "New Label");
    });

    expect(currentState.components[0]?.properties).toEqual({
      old: "val",
      label: "New Label",
    });
  });

  it("updateComponentProperties handles object merge", () => {
    (componentUtils.updateComponent as jest.Mock).mockImplementation(
      (list, id, updater) => {
        const mockComp = {
          id,
          category: "component",
          properties: { old: "val" },
        };
        updater(mockComp);
        return [mockComp];
      }
    );

    act(() => {
      hookResult.updateComponentProperties("comp1", { newProp: "xyz" });
    });

    expect(currentState.components[0]?.properties).toEqual({
      old: "val",
      newProp: "xyz",
    });
  });

  it("updateComponentProperties handles outer update (root level keys)", () => {
    (componentUtils.updateComponent as jest.Mock).mockImplementation(
      (list, id, updater) => {
        const mockComp = { id, category: "component", properties: {} };
        updater(mockComp);
        return [mockComp];
      }
    );

    act(() => {
      hookResult.updateComponentProperties(
        "comp1",
        "displayName",
        "My Comp",
        true
      );
    });

    expect((currentState.components[0] as any).displayName).toBe("My Comp");
  });

  // 7. moveComponent
  it("moveComponent removes component then updates target parent to include it", () => {
    const movingComp = { id: "moveMe", category: "component" } as UIComponent;
    const targetParentId = "newParent";
    const targetIndex = 1;

    // 1. Mock Remove to return the component
    (
      componentUtils.removeComponentFromComponent as jest.Mock
    ).mockImplementation((list, id, cb) => {
      cb(movingComp);
      return [];
    });

    // 2. Mock Update to add the component to parent
    (componentUtils.updateComponent as jest.Mock).mockImplementation(
      (list, id, updater) => {
        const mockParent = {
          id: targetParentId,
          category: "component",
          components: [
            { id: "existing1", category: "component" },
            { id: "existing2", category: "component" },
          ],
        };
        updater(mockParent);
        return [mockParent];
      }
    );

    act(() => {
      hookResult.moveComponent("moveMe", targetParentId, targetIndex);
    });

    const parent = currentState.components[0];
    expect(parent?.components?.[1]).toEqual(movingComp);
    expect(parent?.components).toHaveLength(3);
  });

  // 8. importComponent
  it("importComponent overwrites properties and components", () => {
    const importData = {
      id: "comp1",
      type: "form",
      category: "component", // FIXED: Added category
      properties: { newProp: "imported" },
      components: [
        { id: "childImported", type: "input", category: "component" },
      ],
    } as UIComponent;

    (componentUtils.updateComponent as jest.Mock).mockImplementation(
      (list, id, updater) => {
        const mockComp = {
          id,
          category: "component",
          properties: { old: "deleteMe" },
          components: [{ id: "oldChild", category: "component" }],
        };
        updater(mockComp);
        return [mockComp];
      }
    );

    act(() => {
      hookResult.importComponent({ importData, componentId: "comp1" });
    });

    const updated = currentState.components[0];
    expect(updated?.properties).toEqual({ newProp: "imported" });
    expect(updated?.components).toEqual(importData.components);
  });
});
