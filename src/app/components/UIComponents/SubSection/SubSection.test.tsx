import { fireEvent, render, screen } from "@testing-library/react";
import SubSection from "./SubSection";
import { BaseComponent, SubSectionComponent } from "../../../types/types";
import { DragProvider } from "../../../context/DragContext";
import { PropertiesContext } from "../../../context/PropertiesContext";
import { UserTaskContext } from "../../../context/UserTaskContext";
import { ControlPanelProvider } from "../../../context/ControlPanelContext";
import { HeaderProviderV2 } from "../../../context/HeaderContextV2";
import { JSX, ReactNode } from "react";

const mockMoveComponent = jest.fn();
const mockAddComponentToComponent = jest.fn();
const mockSetActiveComponent = jest.fn();

const MockPropertiesProvider = ({ children }: { children: ReactNode }) => {
  return (
    <PropertiesContext.Provider
      value={{
        isPropertyPaneVisible: false,
        propertyComponentId: null,
        propertyPageId: null,
        setActiveComponent: mockSetActiveComponent,
        resetActiveComponent: jest.fn(),
        setActivePage: jest.fn(),
        resetActivePage: jest.fn(),
        togglePropertyPane: jest.fn(),
        togglePanel: jest.fn(),
        isPanelOpen: jest.fn(() => false),
      }}
    >
      {children}
    </PropertiesContext.Provider>
  );
};

const MockUserTaskProvider = ({ children }: { children: ReactNode }) => (
  <UserTaskContext.Provider
    value={{
      userTask: { sections: [] },
      addComponent: jest.fn(),
      addComponentAtIndex: jest.fn(),
      moveComponentToIndex: jest.fn(),
      addComponentToComponent: mockAddComponentToComponent,
      updateComponentProperties: jest.fn(),
      getComponentById: jest.fn(),
      removeComponent: jest.fn(),
      pageDetails: { title: "", description: "" },
      moveComponent: mockMoveComponent,
      updateUserTask: jest.fn(),
      importComponent: jest.fn(),
      formsNamekeys: { id: [] },
      setFormsNamekeys: jest.fn(),
      tablesNameKeys: { id: [] },
      setTablesNameKeys: jest.fn(),
    }}
  >
    {children}
  </UserTaskContext.Provider>
);

const renderWithProviders = (component: JSX.Element) => {
  return render(
    <MockUserTaskProvider>
      <MockPropertiesProvider>
        <DragProvider>
          <ControlPanelProvider>
            <HeaderProviderV2>{component}</HeaderProviderV2>
          </ControlPanelProvider>
        </DragProvider>
      </MockPropertiesProvider>
    </MockUserTaskProvider>,
  );
};

describe("SubSection Component", () => {
  const mockComponent: SubSectionComponent = {
    id: "subsection1",
    category: "form",
    type: "sub-section",
    properties: {
      styleType: "default",
      backgroundColor: "#ffffff",
      borderRadius: 10,
      borderColor: "#000000",
      borderThickness: 2,
      borderStyle: "solid",
      showLabel: true,
      label: "Test Label",
      backgroundImage: "test-image.jpg",
      dividerColor: "#cccccc",
      dividerHeight: 1,
      dividerStyle: "solid",
      textSize: 14,
      subsectionHeaders: [],
    },
    components: [],
  };

  test("Should render without crashing", () => {
    renderWithProviders(<SubSection component={mockComponent} />);
    expect(screen.getByText("Test Label")).toBeInTheDocument();
  });

  test("Should render the subsection with correct styles", () => {
    renderWithProviders(<SubSection component={mockComponent} />);
    const subsectionElement = screen.getByTestId("subsection-container");
    expect(subsectionElement).toHaveStyle(
      `background-color: ${mockComponent.properties.backgroundColor}`,
    );
    expect(subsectionElement).toHaveStyle(
      `border-radius: ${mockComponent.properties.borderRadius}px`,
    );
    expect(subsectionElement).toHaveStyle(
      `border: ${mockComponent.properties.borderThickness}px ${mockComponent.properties.borderStyle} ${mockComponent.properties.borderColor}`,
    );
  });

  test("Should render a divider when styleType is divider", () => {
    const componentWithDivider = {
      ...mockComponent,
      properties: { ...mockComponent.properties, styleType: "divider" },
    };
    renderWithProviders(<SubSection component={componentWithDivider} />);
    expect(screen.getAllByRole("separator")).toHaveLength(2);
  });

  test("Should render the label if showLabel is true", () => {
    renderWithProviders(<SubSection component={mockComponent} />);
    expect(screen.getByText("Test Label")).toBeInTheDocument();
  });

  test("Should not render the label if showLabel is false", () => {
    const componentWithoutLabel = {
      ...mockComponent,
      properties: { ...mockComponent.properties, showLabel: false },
    };
    renderWithProviders(<SubSection component={componentWithoutLabel} />);
    expect(screen.queryByText("Test Label")).not.toBeInTheDocument();
  });

  test("Should render child components using ComponentRenderer", () => {
    const componentWithChildren: SubSectionComponent = {
      ...mockComponent,
      components: [
        {
          id: "child1",
          category: "form",
          type: "form",
          properties: { label: "Child 1" },
        },
      ],
    };
    renderWithProviders(<SubSection component={componentWithChildren} />);
    expect(screen.getByTestId("component-renderer")).toBeInTheDocument();
  });

  test("Should prevent drop if dropped item’s category does not match", () => {
    renderWithProviders(<SubSection component={mockComponent} />);
    const subsectionElement = screen.getByText("Test Label").closest("div");

    fireEvent.drop(subsectionElement!, {
      dataTransfer: {
        getData: () => JSON.stringify({ category: "other" }),
      },
    });

    expect(screen.getByText("Test Label")).toBeInTheDocument();
  });

  test("Should reset drag state after drop", () => {
    renderWithProviders(<SubSection component={mockComponent} />);
    const subsectionElement = screen.getByText("Test Label").closest("div");

    fireEvent.drop(subsectionElement!, {
      dataTransfer: {
        getData: () => JSON.stringify({ id: "component1", category: "form" }),
      },
    });

    expect(screen.getByText("Test Label")).toBeInTheDocument();
  });

  test("Should move an existing component within the subsection", () => {
    renderWithProviders(<SubSection component={mockComponent} />);

    fireEvent.drop(screen.getByTestId("form-dropzone"), {
      dataTransfer: {
        getData: jest.fn(() =>
          JSON.stringify({ id: "component1", category: "form" }),
        ),
      },
    });

    expect(mockMoveComponent).toHaveBeenCalled();
  });

  test("Should add a new component to the subsection", () => {
    renderWithProviders(<SubSection component={mockComponent} />);

    fireEvent.drop(screen.getByTestId("form-dropzone"), {
      dataTransfer: {
        getData: jest.fn(() =>
          JSON.stringify({
            category: "form",
            type: "input-table",
          }),
        ),
      },
    });

    expect(mockAddComponentToComponent).toHaveBeenCalled();
  });

  test("Should call setActiveComponent after dropping an item", () => {
    renderWithProviders(<SubSection component={mockComponent} />);

    fireEvent.drop(screen.getByTestId("form-dropzone"), {
      dataTransfer: {
        getData: () =>
          JSON.stringify({
            id: "component1",
            category: "form",
          }),
      },
    });

    expect(mockSetActiveComponent).toHaveBeenCalledWith("component1");
  });

  test("should initialize components array when it is undefined", () => {
    const componentWithoutComponents: SubSectionComponent = {
      id: "test-subsection",
      type: "sub-section",
      category: "form",
      properties: {
        label: "Test SubSection",
        showLabel: true,
        subsectionHeaders: [],
      },
    } as SubSectionComponent;

    renderWithProviders(<SubSection component={componentWithoutComponents} />);

    expect(screen.getByTestId("subsection-container")).toBeInTheDocument();

    expect(componentWithoutComponents.components).toEqual([]);
  });

  test("should not modify components array when it already exists", () => {
    const existingComponents: BaseComponent[] = [
      {
        id: "existing-component",
        type: "TextInput",
        category: "form",
        properties: {},
      },
    ];

    const componentWithComponents: SubSectionComponent = {
      id: "test-subsection",
      type: "sub-section",
      category: "form",
      properties: {
        label: "Test SubSection",
        showLabel: true,
        subsectionHeaders: [],
      },
      components: existingComponents,
    };

    renderWithProviders(<SubSection component={componentWithComponents} />);

    expect(componentWithComponents.components).toBe(existingComponents);
    expect(componentWithComponents.components).toHaveLength(1);
  });

  test("should proceed with drop when categories match", () => {
    const component: SubSectionComponent = {
      id: "test-subsection",
      type: "sub-section",
      category: "form",
      properties: {
        label: "",
        subsectionHeaders: [],
      },
      components: [],
    };

    renderWithProviders(<SubSection component={component} />);

    const dropZone = screen.getByTestId("subsection-container");

    const mockDragEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: {
        getData: jest.fn().mockReturnValue(
          JSON.stringify({
            type: "TextInput",
            category: "form",
          }),
        ),
      },
    } as unknown as React.DragEvent<HTMLDivElement>;

    fireEvent.drop(dropZone, mockDragEvent);

    expect(mockAddComponentToComponent).toHaveBeenCalled();
  });

  test("should decrease index by 1 when dragging within same form and original index is less than target index", () => {
    const existingComponent: BaseComponent = {
      id: "existing-component",
      type: "input",
      category: "form",
      properties: {},
    };

    const component: SubSectionComponent = {
      id: "test-subsection",
      type: "sub-section",
      category: "form",
      properties: {
        label: "",
        subsectionHeaders: [],
      },
      components: [existingComponent],
    };

    renderWithProviders(<SubSection component={component} />);

    const dropZone = screen.getByTestId("subsection-container");

    const mockDragEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: {
        getData: jest.fn().mockReturnValue(
          JSON.stringify({
            id: "existing-component",
            type: "TextInput",
            category: "form",
          }),
        ),
      },
    } as unknown as React.DragEvent<HTMLDivElement>;

    const dropHandler = component.components
      ? (e: React.DragEvent<HTMLDivElement>) => {
          const targetIndex = 1;
          const originalIndex = 0;

          mockMoveComponent(
            "existing-component",
            "test-subsection",
            targetIndex - 1,
          );
        }
      : () => {};

    dropHandler(mockDragEvent);

    expect(mockMoveComponent).toHaveBeenCalledWith(
      "existing-component",
      "test-subsection",
      0,
    );
  });

  test("should not adjust index when dragging to a position before the original position", () => {
    const components: BaseComponent[] = [
      {
        id: "component-1",
        type: "input",
        category: "form",
        properties: {},
      },
      {
        id: "component-2",
        type: "input",
        category: "form",
        properties: {},
      },
    ];

    const component: SubSectionComponent = {
      id: "test-subsection",
      type: "sub-section",
      category: "form",
      properties: {
        label: "",
        subsectionHeaders: [],
      },
      components: components,
    };

    renderWithProviders(<SubSection component={component} />);

    const targetIndex = 0;
    const originalIndex = 1;

    const finalIndex =
      originalIndex < targetIndex ? targetIndex - 1 : targetIndex;

    expect(finalIndex).toBe(0);
  });

  test("should not adjust index when component is not in the same form", () => {
    const component: SubSectionComponent = {
      id: "test-subsection",
      type: "sub-section",
      category: "form",
      properties: {
        label: "",
        subsectionHeaders: [],
      },
      components: [
        {
          id: "existing-component",
          type: "TextInput",
          category: "form",
          properties: {},
        },
      ],
    };

    renderWithProviders(<SubSection component={component} />);

    const dropZone = screen.getByTestId("subsection-container");

    const mockDragEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: {
        getData: jest.fn().mockReturnValue(
          JSON.stringify({
            id: "external-component",
            type: "TextInput",
            category: "form",
          }),
        ),
      },
    } as unknown as React.DragEvent<HTMLDivElement>;

    fireEvent.drop(dropZone, mockDragEvent);

    expect(mockMoveComponent).toHaveBeenCalledWith(
      "existing-component",
      "test-subsection",
      expect.any(Number),
    );
  });

  test("should return early when dropped item category does not match component category", () => {
    jest.clearAllMocks();
    const component: SubSectionComponent = {
      id: "test-subsection",
      type: "sub-section",
      category: "form",
      properties: {
        label: "",
        subsectionHeaders: [],
      },
      components: [],
    };

    renderWithProviders(<SubSection component={component} />);

    const dropZone = screen.getByTestId("subsection-container");

    const mockDragEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
      dataTransfer: {
        getData: jest.fn().mockReturnValue(
          JSON.stringify({
            id: "test-component",
            category: "component",
            type: "Container",
          }),
        ),
      },
    } as unknown as React.DragEvent<HTMLDivElement>;

    fireEvent.drop(dropZone, mockDragEvent);

    expect(mockAddComponentToComponent).not.toHaveBeenCalled();
    expect(mockMoveComponent).not.toHaveBeenCalled();
  });

  test("should return null when component is null", () => {
    const { container } = renderWithProviders(
      <SubSection component={null as unknown as SubSectionComponent} />,
    );
    expect(container.firstChild).toBeNull();
  });

  test("should call addCategoryRecursive and add component when dropped item has empty category", () => {
    jest.clearAllMocks();
    renderWithProviders(<SubSection component={mockComponent} />);

    fireEvent.drop(screen.getByTestId("form-dropzone"), {
      dataTransfer: {
        getData: jest.fn(() => JSON.stringify({ type: "input", category: "" })),
      },
    });

    expect(mockAddComponentToComponent).toHaveBeenCalled();
  });

  test("should return early when dropping on form-dropzone with mismatching category", () => {
    jest.clearAllMocks();
    renderWithProviders(<SubSection component={mockComponent} />);

    fireEvent.drop(screen.getByTestId("form-dropzone"), {
      dataTransfer: {
        getData: jest.fn(() =>
          JSON.stringify({ id: "ext", category: "component", type: "Box" }),
        ),
      },
    });

    expect(mockAddComponentToComponent).not.toHaveBeenCalled();
    expect(mockMoveComponent).not.toHaveBeenCalled();
  });

  test("should exercise isSameForm and draggedComponentOriginalIndex lambdas when dropping existing component", () => {
    jest.clearAllMocks();
    const componentWithChild: SubSectionComponent = {
      ...mockComponent,
      components: [
        { id: "child1", category: "form", type: "form", properties: {} },
      ],
    };

    renderWithProviders(<SubSection component={componentWithChild} />);

    const dropZones = screen.getAllByTestId("form-dropzone");
    fireEvent.drop(dropZones[0], {
      dataTransfer: {
        getData: jest.fn(() =>
          JSON.stringify({ id: "child1", category: "form" }),
        ),
      },
    });

    expect(mockMoveComponent).toHaveBeenCalledWith(
      "child1",
      mockComponent.id,
      expect.any(Number),
    );
  });

  test("should adjust index when moving component to a position after its original index", () => {
    jest.clearAllMocks();
    const componentWithChildren: SubSectionComponent = {
      ...mockComponent,
      components: [
        { id: "child0", category: "form", type: "form", properties: {} },
        { id: "child1", category: "form", type: "form", properties: {} },
      ],
    };

    renderWithProviders(<SubSection component={componentWithChildren} />);

    const dropZones = screen.getAllByTestId("form-dropzone");
    // DOM order: SubSection DZ0, Form(child0) DZ0, SubSection DZ1, Form(child1) DZ0, SubSection DZ2 (index=4)
    fireEvent.drop(dropZones[4], {
      dataTransfer: {
        getData: jest.fn(() =>
          JSON.stringify({ id: "child0", category: "form" }),
        ),
      },
    });

    expect(mockMoveComponent).toHaveBeenCalledWith(
      "child0",
      mockComponent.id,
      1,
    );
  });

  test("should trigger handleDrop lambda from after-child drop zone", () => {
    jest.clearAllMocks();
    const componentWithChild: SubSectionComponent = {
      ...mockComponent,
      components: [
        { id: "child1", category: "form", type: "form", properties: {} },
      ],
    };

    renderWithProviders(<SubSection component={componentWithChild} />);

    const dropZones = screen.getAllByTestId("form-dropzone");
    // DOM order: SubSection DZ0 ([0]), Form(child1) DZ0 ([1]), SubSection DZ1 after child ([2])
    fireEvent.drop(dropZones[2], {
      dataTransfer: {
        getData: jest.fn(() =>
          JSON.stringify({ type: "input", category: "form" }),
        ),
      },
    });

    expect(mockAddComponentToComponent).toHaveBeenCalledWith(
      mockComponent.id,
      expect.objectContaining({ category: "form" }),
      1,
    );
  });

  test("should use ComponentDropZone when category is not form", () => {
    const componentComponent: SubSectionComponent = {
      ...mockComponent,
      category: "component",
      properties: { ...mockComponent.properties },
    };
    renderWithProviders(<SubSection component={componentComponent} />);
    expect(screen.getByTestId("subsection-container")).toBeInTheDocument();
    expect(screen.queryByTestId("form-dropzone")).not.toBeInTheDocument();
  });

  test("should apply independent padding styles when independentPadding is true", () => {
    const componentWithIndependentPadding: SubSectionComponent = {
      ...mockComponent,
      properties: {
        ...mockComponent.properties,
        independentPadding: true,
        paddingTop: 10,
        paddingRight: 15,
        paddingBottom: 20,
        paddingLeft: 5,
      },
    };
    renderWithProviders(
      <SubSection component={componentWithIndependentPadding} />,
    );
    const container = screen.getByTestId("subsection-container");
    expect(container).toHaveStyle("padding: 10px 15px 20px 5px");
  });

  test("should apply zero padding values when independentPadding is true but padding values are undefined", () => {
    const componentNoValues: SubSectionComponent = {
      ...mockComponent,
      properties: {
        ...mockComponent.properties,
        independentPadding: true,
        paddingTop: undefined,
        paddingRight: undefined,
        paddingBottom: undefined,
        paddingLeft: undefined,
      },
    };
    renderWithProviders(<SubSection component={componentNoValues} />);
    const container = screen.getByTestId("subsection-container");
    expect(container).toHaveStyle("padding: 0px 0px 0px 0px");
  });
});
