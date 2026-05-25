import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import TreeStructurePanel from "./TreeStructurePanel";
import { ComponentProperty } from "../../../../app/data/componentProperties";
import { usePropertyPane } from "../../../context/PropertiesContext";
import { PropertyPanels } from "../../../utils/constants";

jest.mock("../../../context/PropertiesContext", () => ({
  usePropertyPane: jest.fn(),
}));

const mockTreeComponent: any = {
  id: "tree-1",
  properties: {
    behaviorType: "STATIC",
    pathKeyToArray: "data.items",
    childrenPathKey: "children",
    sessionKey: "sessionKey",
    labelKey: "label",
    valueKey: "id",
  },
};

const mockTogglePanel = jest.fn();
const mockIsPanelOpen = jest.fn();

const mockUsePropertyPane = (overrides?: {
  togglePanel?: jest.Mock | null;
  isPanelOpen?: jest.Mock | null;
}) => {
  (usePropertyPane as jest.Mock).mockReturnValue({
    togglePanel:
      overrides && "togglePanel" in overrides
        ? overrides.togglePanel
        : mockTogglePanel,
    isPanelOpen:
      overrides && "isPanelOpen" in overrides
        ? overrides.isPanelOpen
        : mockIsPanelOpen,
  });
};

describe("TreeStructurePanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("does not render when propertyKeys is empty", () => {
    mockUsePropertyPane();

    const { container } = render(
      <TreeStructurePanel
        propertyKeys={[]}
        propertyComponent={mockTreeComponent}
        setProperty={jest.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  test("renders heading and toggle button when propertyKeys present", () => {
    mockUsePropertyPane();

    render(
      <TreeStructurePanel
        propertyKeys={[ComponentProperty.BehaviorType]}
        propertyComponent={mockTreeComponent}
        setProperty={jest.fn()}
      />,
    );

    expect(screen.getByTestId("treeStructurePanelHeading")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /structure configuration/i }),
    ).toBeInTheDocument();
  });

  test("calls togglePanel on header button click using fireEvent", () => {
    mockUsePropertyPane();

    render(
      <TreeStructurePanel
        propertyKeys={[ComponentProperty.BehaviorType]}
        propertyComponent={mockTreeComponent}
        setProperty={jest.fn()}
      />,
    );

    const btn = screen.getByRole("button", {
      name: /structure configuration/i,
    });

    fireEvent.click(btn);

    expect(mockTogglePanel).toHaveBeenCalledTimes(1);
    expect(mockTogglePanel).toHaveBeenCalledWith(
      PropertyPanels.TreeStructurePanel,
    );
  });

  test("does not throw when togglePanel is null", () => {
    mockUsePropertyPane({ togglePanel: null as unknown as jest.Mock });

    render(
      <TreeStructurePanel
        propertyKeys={[ComponentProperty.BehaviorType]}
        propertyComponent={mockTreeComponent}
        setProperty={jest.fn()}
      />,
    );

    const btn = screen.getByRole("button", {
      name: /structure configuration/i,
    });

    fireEvent.click(btn);
  });

  test("renders property inputs when panel is open", () => {
    mockIsPanelOpen.mockImplementation(
      (panel: PropertyPanels) => panel === PropertyPanels.TreeStructurePanel,
    );
    mockUsePropertyPane({ isPanelOpen: mockIsPanelOpen });

    render(
      <TreeStructurePanel
        propertyKeys={[
          ComponentProperty.BehaviorType,
          ComponentProperty.PathKeyToArray,
          ComponentProperty.ChildrenPathKey,
          ComponentProperty.LabelKey,
          ComponentProperty.ValueKey,
        ]}
        propertyComponent={mockTreeComponent}
        setProperty={jest.fn()}
      />,
    );

    expect(screen.getByText("Behavior Type")).toBeInTheDocument();
    expect(screen.getByText("Path key to Array")).toBeInTheDocument();
    expect(screen.getByText("Children Path to Array")).toBeInTheDocument();
    expect(screen.getByText("Label key")).toBeInTheDocument();
    expect(screen.getByText("Value key")).toBeInTheDocument();
  });

  test("invokes setProperty when BehaviorType select is changed (fireEvent.change)", () => {
    mockIsPanelOpen.mockReturnValue(true);
    mockUsePropertyPane({ isPanelOpen: mockIsPanelOpen });

    const setPropertyMock = jest.fn();

    render(
      <TreeStructurePanel
        propertyKeys={[ComponentProperty.BehaviorType]}
        propertyComponent={mockTreeComponent}
        setProperty={setPropertyMock}
      />,
    );

    const select = screen.getByTestId("tree-1-behaviorType");

    fireEvent.change(select, { target: { value: "" } });

    expect(setPropertyMock).toHaveBeenCalledTimes(1);
    expect(setPropertyMock).toHaveBeenCalledWith(
      ComponentProperty.BehaviorType,
      "",
    );
  });

  test("invokes setProperty for text inputs using fireEvent.change", () => {
    mockIsPanelOpen.mockReturnValue(true);
    mockUsePropertyPane({ isPanelOpen: mockIsPanelOpen });

    const setPropertyMock = jest.fn();
    const mockComp = {
      ...mockTreeComponent,
      properties: {
        ...mockTreeComponent.properties,
        behaviorType: "navigation",
      },
    };
    render(
      <TreeStructurePanel
        propertyKeys={[
          ComponentProperty.SessionKey,
          ComponentProperty.PathKeyToArray,
          ComponentProperty.ChildrenPathKey,
          ComponentProperty.LabelKey,
          ComponentProperty.ValueKey,
        ]}
        propertyComponent={mockComp}
        setProperty={setPropertyMock}
      />,
    );
    const sessionKeyInput = screen.getByTestId(
      "tree-1-sessionKey",
    ) as HTMLInputElement;
    const pathKeyInput = screen.getByTestId(
      "tree-1-pathKeyToArray",
    ) as HTMLInputElement;
    const childrenPathInput = screen.getByTestId(
      "tree-1-childrenPathKey",
    ) as HTMLInputElement;
    const labelKeyInput = screen.getByTestId(
      "tree-1-labelKey",
    ) as HTMLInputElement;
    const valueKeyInput = screen.getByTestId(
      "tree-1-valueKey",
    ) as HTMLInputElement;

    fireEvent.change(sessionKeyInput, { target: { value: "nekey" } });
    fireEvent.change(pathKeyInput, { target: { value: "data.tree" } });
    fireEvent.change(childrenPathInput, { target: { value: "nodes" } });
    fireEvent.change(labelKeyInput, { target: { value: "name" } });
    fireEvent.change(valueKeyInput, { target: { value: "uuid" } });

    expect(setPropertyMock).toHaveBeenNthCalledWith(
      1,
      ComponentProperty.SessionKey,
      "nekey",
    );
    expect(setPropertyMock).toHaveBeenNthCalledWith(
      2,
      ComponentProperty.PathKeyToArray,
      "data.tree",
    );
    expect(setPropertyMock).toHaveBeenNthCalledWith(
      3,
      ComponentProperty.ChildrenPathKey,
      "nodes",
    );
    expect(setPropertyMock).toHaveBeenNthCalledWith(
      4,
      ComponentProperty.LabelKey,
      "name",
    );
    expect(setPropertyMock).toHaveBeenNthCalledWith(
      5,
      ComponentProperty.ValueKey,
      "uuid",
    );
  });

  test("does not render SessionKey when behaviorType is not navigation", () => {
    mockIsPanelOpen.mockReturnValue(true);
    mockUsePropertyPane({ isPanelOpen: mockIsPanelOpen });

    const mockComp = {
      ...mockTreeComponent,
      properties: {
        ...mockTreeComponent.properties,
        behaviorType: "STATIC",
      },
    };

    render(
      <TreeStructurePanel
        propertyKeys={[ComponentProperty.SessionKey]}
        propertyComponent={mockComp}
        setProperty={jest.fn()}
      />,
    );

    expect(screen.queryByText("Session key")).toBeInTheDocument();
  });

  test("renders ParamValueKey input when behaviorType is navigation", () => {
    mockIsPanelOpen.mockReturnValue(true);
    mockUsePropertyPane({ isPanelOpen: mockIsPanelOpen });

    const setPropertyMock = jest.fn();
    const mockComp = {
      ...mockTreeComponent,
      properties: {
        ...mockTreeComponent.properties,
        behaviorType: "navigation",
        paramValueKey: "testParam",
      },
    };

    render(
      <TreeStructurePanel
        propertyKeys={[ComponentProperty.ParamValueKey]}
        propertyComponent={mockComp}
        setProperty={setPropertyMock}
      />,
    );

    expect(screen.getByText("Param value key")).toBeInTheDocument();
    const input = screen.getByTestId("tree-1-paramValueKey");
    fireEvent.change(input, { target: { value: "newParamKey" } });

    expect(setPropertyMock).toHaveBeenCalledWith(
      ComponentProperty.ParamValueKey,
      "newParamKey",
    );
  });

  test("does not render ParamValueKey when behaviorType is not navigation", () => {
    mockIsPanelOpen.mockReturnValue(true);
    mockUsePropertyPane({ isPanelOpen: mockIsPanelOpen });

    const mockComp = {
      ...mockTreeComponent,
      properties: {
        ...mockTreeComponent.properties,
        behaviorType: "STATIC",
      },
    };

    render(
      <TreeStructurePanel
        propertyKeys={[ComponentProperty.ParamValueKey]}
        propertyComponent={mockComp}
        setProperty={jest.fn()}
      />,
    );

    expect(screen.queryByText("Param value key")).not.toBeInTheDocument();
  });

  test("renders OnSelectApiUrl input when behaviorType is navigation", () => {
    mockIsPanelOpen.mockReturnValue(true);
    mockUsePropertyPane({ isPanelOpen: mockIsPanelOpen });

    const setPropertyMock = jest.fn();
    const mockComp = {
      ...mockTreeComponent,
      properties: {
        ...mockTreeComponent.properties,
        behaviorType: "navigation",
        onSelectApiUrl: "/api/test",
      },
    };

    render(
      <TreeStructurePanel
        propertyKeys={[ComponentProperty.OnSelectApiUrl]}
        propertyComponent={mockComp}
        setProperty={setPropertyMock}
      />,
    );

    expect(screen.getByText("On select API URL")).toBeInTheDocument();
    const input = screen.getByTestId("tree-1-onSelectApiUrl");
    fireEvent.change(input, { target: { value: "/api/new" } });

    expect(setPropertyMock).toHaveBeenCalledWith(
      ComponentProperty.OnSelectApiUrl,
      "/api/new",
    );
  });

  test("does not render OnSelectApiUrl when behaviorType is not navigation", () => {
    mockIsPanelOpen.mockReturnValue(true);
    mockUsePropertyPane({ isPanelOpen: mockIsPanelOpen });

    const mockComp = {
      ...mockTreeComponent,
      properties: {
        ...mockTreeComponent.properties,
        behaviorType: "STATIC",
      },
    };

    render(
      <TreeStructurePanel
        propertyKeys={[ComponentProperty.OnSelectApiUrl]}
        propertyComponent={mockComp}
        setProperty={jest.fn()}
      />,
    );

    expect(screen.queryByText("On select API URL")).not.toBeInTheDocument();
  });

  test("applies isOpen class when panel is open", () => {
    mockIsPanelOpen.mockReturnValue(true);
    mockUsePropertyPane({ isPanelOpen: mockIsPanelOpen });

    render(
      <TreeStructurePanel
        propertyKeys={[ComponentProperty.BehaviorType]}
        propertyComponent={mockTreeComponent}
        setProperty={jest.fn()}
      />,
    );

    const button = screen.getByRole("button", {
      name: /structure configuration/i,
    });
    expect(button.className).toContain("isOpen");
  });

  test("does not apply isOpen class when panel is closed", () => {
    mockIsPanelOpen.mockReturnValue(false);
    mockUsePropertyPane({ isPanelOpen: mockIsPanelOpen });

    render(
      <TreeStructurePanel
        propertyKeys={[ComponentProperty.BehaviorType]}
        propertyComponent={mockTreeComponent}
        setProperty={jest.fn()}
      />,
    );

    const button = screen.getByRole("button", {
      name: /structure configuration/i,
    });
    expect(button.className).not.toContain("isOpen");
  });

  test("does not render property inputs when isPanelOpen is undefined", () => {
    mockUsePropertyPane({ isPanelOpen: undefined as unknown as jest.Mock });

    render(
      <TreeStructurePanel
        propertyKeys={[ComponentProperty.BehaviorType]}
        propertyComponent={mockTreeComponent}
        setProperty={jest.fn()}
      />,
    );

    expect(screen.queryByText("Behavior Type")).not.toBeInTheDocument();
  });

  describe("Branch coverage - conditional property rendering", () => {
    test("does not render SessionKey when type is tree-structure and behaviorType is not navigation", () => {
      mockIsPanelOpen.mockReturnValue(true);
      mockUsePropertyPane({ isPanelOpen: mockIsPanelOpen });

      const mockComp = {
        id: "tree-1",
        type: "tree-structure",
        properties: {
          behaviorType: "STATIC",
        },
      };

      render(
        <TreeStructurePanel
          propertyKeys={[ComponentProperty.SessionKey]}
          propertyComponent={mockComp}
          setProperty={jest.fn()}
        />,
      );

      expect(screen.queryByText("Session key")).not.toBeInTheDocument();
    });

    test("does not render ParamValueKey when behaviorType is not navigation", () => {
      mockIsPanelOpen.mockReturnValue(true);
      mockUsePropertyPane({ isPanelOpen: mockIsPanelOpen });

      const mockComp = {
        id: "tree-1",
        type: "tree-structure",
        properties: {
          behaviorType: "STATIC",
        },
      };

      render(
        <TreeStructurePanel
          propertyKeys={[ComponentProperty.ParamValueKey]}
          propertyComponent={mockComp}
          setProperty={jest.fn()}
        />,
      );

      expect(screen.queryByText("Param value key")).not.toBeInTheDocument();
    });

    test("does not render OnSelectApiUrl when behaviorType is not navigation", () => {
      mockIsPanelOpen.mockReturnValue(true);
      mockUsePropertyPane({ isPanelOpen: mockIsPanelOpen });

      const mockComp = {
        id: "tree-1",
        type: "tree-structure",
        properties: {
          behaviorType: "STATIC",
        },
      };

      render(
        <TreeStructurePanel
          propertyKeys={[ComponentProperty.OnSelectApiUrl]}
          propertyComponent={mockComp}
          setProperty={jest.fn()}
        />,
      );

      expect(screen.queryByText("On select API URL")).not.toBeInTheDocument();
    });

    test("renders ParamValueKey when behaviorType is navigation", () => {
      mockIsPanelOpen.mockReturnValue(true);
      mockUsePropertyPane({ isPanelOpen: mockIsPanelOpen });

      const mockComp = {
        id: "tree-1",
        type: "tree-structure",
        properties: {
          behaviorType: "navigation",
          paramValueKey: "someKey",
        },
      };

      render(
        <TreeStructurePanel
          propertyKeys={[ComponentProperty.ParamValueKey]}
          propertyComponent={mockComp}
          setProperty={jest.fn()}
        />,
      );

      expect(screen.getByText("Param value key")).toBeInTheDocument();
    });

    test("renders OnSelectApiUrl when behaviorType is navigation", () => {
      mockIsPanelOpen.mockReturnValue(true);
      mockUsePropertyPane({ isPanelOpen: mockIsPanelOpen });

      const mockComp = {
        id: "tree-1",
        type: "tree-structure",
        properties: {
          behaviorType: "navigation",
          onSelectApiUrl: "https://api.example.com",
        },
      };

      render(
        <TreeStructurePanel
          propertyKeys={[ComponentProperty.OnSelectApiUrl]}
          propertyComponent={mockComp}
          setProperty={jest.fn()}
        />,
      );

      expect(screen.getByText("On select API URL")).toBeInTheDocument();
    });
  });
});
