import { render, screen, fireEvent } from "@testing-library/react";
import AccordionGroupPanel from "./AccordionGroupPanel";
import { ComponentProperty } from "@/app/data/componentProperties";
import { PropertyPanels } from "@/app/utils/constants";

jest.mock("@/app/context/PropertiesContext", () => ({
  usePropertyPane: jest.fn(),
}));

jest.mock("../../SVGIcons/ChevronDown", () => ({
  __esModule: true,
  default: () => <span data-testid="chevron-down-icon">v</span>,
}));

jest.mock("../../ExpandableColumn/ExpandableColumn", () => ({
  __esModule: true,
  default: ({
    children,
    label,
    column,
    setProperty,
  }: {
    children: React.ReactNode;
    label: string;
    column: { id: string };
    setProperty?: (prop: string, value: unknown) => void;
  }) => (
    <div data-testid={`expandable-column-${column.id}`}>
      <div data-testid="expandable-label">{label}</div>
      <button
        data-testid={`trigger-setproperty-${column.id}`}
        onClick={() => setProperty?.("test", [{ id: "reordered" }])}
      >
        Trigger setProperty
      </button>
      {children}
    </div>
  ),
  AddExpandableColumn: ({
    handleAddCol,
    label,
  }: {
    handleAddCol: () => void;
    label: string;
  }) => (
    <button data-testid="add-expandable-column" onClick={handleAddCol}>
      Add {label}
    </button>
  ),
}));

import { usePropertyPane } from "@/app/context/PropertiesContext";

describe("AccordionGroupPanel", () => {
  const mockTogglePanel = jest.fn();
  const mockIsPanelOpen = jest.fn();
  const mockSetProperty = jest.fn();

  const defaultPropertyComponent = {
    id: "test-accordion-group",
    properties: {
      autoOpenFirst: false,
      showNumbering: false,
      items: [
        { id: "1", title: "Item 1", description: "Description 1" },
        { id: "2", title: "Item 2", description: "Description 2" },
      ],
    },
  };

  const defaultPropertyKeys = [
    ComponentProperty.AutoOpenFirst,
    ComponentProperty.ShowNumbering,
    ComponentProperty.AccordionItems,
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: mockTogglePanel,
      isPanelOpen: mockIsPanelOpen,
    });
    mockIsPanelOpen.mockReturnValue(true);
  });

  test("renders accordion group panel heading", () => {
    render(
      <AccordionGroupPanel
        propertyKeys={defaultPropertyKeys}
        propertyComponent={defaultPropertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    expect(screen.getByText("Accordion Group")).toBeInTheDocument();
  });

  test("toggles panel when heading is clicked", () => {
    render(
      <AccordionGroupPanel
        propertyKeys={defaultPropertyKeys}
        propertyComponent={defaultPropertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    const toggleButton = screen.getByRole("button", {
      name: /Accordion Group/i,
    });
    fireEvent.click(toggleButton);

    expect(mockTogglePanel).toHaveBeenCalledWith(
      PropertyPanels.AccordionGroupPanel,
    );
  });

  test("applies open class when panel is open", () => {
    mockIsPanelOpen.mockReturnValue(true);
    const { container } = render(
      <AccordionGroupPanel
        propertyKeys={defaultPropertyKeys}
        propertyComponent={defaultPropertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    const button = container.querySelector("button");
    expect(button).toHaveClass("isOpen");
  });

  test("does not apply open class when panel is closed", () => {
    mockIsPanelOpen.mockReturnValue(false);
    const { container } = render(
      <AccordionGroupPanel
        propertyKeys={defaultPropertyKeys}
        propertyComponent={defaultPropertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    const button = container.querySelector("button");
    expect(button).not.toHaveClass("isOpen");
  });

  test("renders AutoOpenFirst checkbox", () => {
    render(
      <AccordionGroupPanel
        propertyKeys={defaultPropertyKeys}
        propertyComponent={defaultPropertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    expect(screen.getByLabelText("Auto Open First Item")).toBeInTheDocument();
  });

  test("renders ShowNumbering checkbox", () => {
    render(
      <AccordionGroupPanel
        propertyKeys={defaultPropertyKeys}
        propertyComponent={defaultPropertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    expect(screen.getByLabelText("Show Numbering")).toBeInTheDocument();
  });

  test("handles AutoOpenFirst checkbox change", () => {
    render(
      <AccordionGroupPanel
        propertyKeys={defaultPropertyKeys}
        propertyComponent={defaultPropertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: /Auto Open First Item/i,
    });
    fireEvent.click(checkbox);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.AutoOpenFirst,
      true,
    );
  });

  test("handles ShowNumbering checkbox change", () => {
    render(
      <AccordionGroupPanel
        propertyKeys={defaultPropertyKeys}
        propertyComponent={defaultPropertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    const checkbox = screen.getByRole("checkbox", { name: /Show Numbering/i });
    fireEvent.click(checkbox);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.ShowNumbering,
      true,
    );
  });

  test("renders accordion items", () => {
    render(
      <AccordionGroupPanel
        propertyKeys={defaultPropertyKeys}
        propertyComponent={defaultPropertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    expect(screen.getByTestId("expandable-column-1")).toBeInTheDocument();
    expect(screen.getByTestId("expandable-column-2")).toBeInTheDocument();
  });

  test("handles adding new item", () => {
    render(
      <AccordionGroupPanel
        propertyKeys={defaultPropertyKeys}
        propertyComponent={defaultPropertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    const addButton = screen.getByTestId("add-expandable-column");
    fireEvent.click(addButton);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.AccordionItems,
      expect.arrayContaining([
        ...defaultPropertyComponent.properties.items,
        expect.objectContaining({
          title: "Item 3",
          description: "",
        }),
      ]),
    );
  });

  test("handles item title change", () => {
    render(
      <AccordionGroupPanel
        propertyKeys={defaultPropertyKeys}
        propertyComponent={defaultPropertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    const titleInput = screen.getByDisplayValue("Item 1");
    fireEvent.change(titleInput, { target: { value: "Updated Title" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.AccordionItems,
      [
        { id: "1", title: "Updated Title", description: "Description 1" },
        { id: "2", title: "Item 2", description: "Description 2" },
      ],
    );
  });

  test("handles item description change", () => {
    render(
      <AccordionGroupPanel
        propertyKeys={defaultPropertyKeys}
        propertyComponent={defaultPropertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    const descriptionTextarea = screen.getByDisplayValue("Description 1");
    fireEvent.change(descriptionTextarea, {
      target: { value: "Updated Description" },
    });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.AccordionItems,
      [
        { id: "1", title: "Item 1", description: "Updated Description" },
        { id: "2", title: "Item 2", description: "Description 2" },
      ],
    );
  });

  test("renders with empty items array", () => {
    const emptyItemsComponent = {
      ...defaultPropertyComponent,
      properties: {
        ...defaultPropertyComponent.properties,
        items: [],
      },
    };

    render(
      <AccordionGroupPanel
        propertyKeys={defaultPropertyKeys}
        propertyComponent={emptyItemsComponent}
        setProperty={mockSetProperty}
      />,
    );

    expect(screen.queryByTestId("expandable-column-1")).not.toBeInTheDocument();
    expect(screen.getByTestId("add-expandable-column")).toBeInTheDocument();
  });

  test("renders with undefined items", () => {
    const undefinedItemsComponent = {
      ...defaultPropertyComponent,
      properties: {
        ...defaultPropertyComponent.properties,
        items: undefined,
      },
    };

    render(
      <AccordionGroupPanel
        propertyKeys={defaultPropertyKeys}
        propertyComponent={undefinedItemsComponent}
        setProperty={mockSetProperty}
      />,
    );

    expect(screen.getByTestId("add-expandable-column")).toBeInTheDocument();
  });

  test("does not render properties when panel is closed", () => {
    mockIsPanelOpen.mockReturnValue(false);

    render(
      <AccordionGroupPanel
        propertyKeys={defaultPropertyKeys}
        propertyComponent={defaultPropertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    expect(
      screen.queryByLabelText("Auto Open First Item"),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Show Numbering")).not.toBeInTheDocument();
  });

  test("renders chevron down icon", () => {
    render(
      <AccordionGroupPanel
        propertyKeys={defaultPropertyKeys}
        propertyComponent={defaultPropertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    expect(screen.getByTestId("chevron-down-icon")).toBeInTheDocument();
  });

  test("AutoOpenFirst checkbox reflects property value", () => {
    const componentWithAutoOpen = {
      ...defaultPropertyComponent,
      properties: {
        ...defaultPropertyComponent.properties,
        autoOpenFirst: true,
      },
    };

    render(
      <AccordionGroupPanel
        propertyKeys={defaultPropertyKeys}
        propertyComponent={componentWithAutoOpen}
        setProperty={mockSetProperty}
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: /Auto Open First Item/i,
    }) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  test("ShowNumbering checkbox reflects property value", () => {
    const componentWithNumbering = {
      ...defaultPropertyComponent,
      properties: {
        ...defaultPropertyComponent.properties,
        showNumbering: true,
      },
    };

    render(
      <AccordionGroupPanel
        propertyKeys={defaultPropertyKeys}
        propertyComponent={componentWithNumbering}
        setProperty={mockSetProperty}
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: /Show Numbering/i,
    }) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  test("handles unchecking AutoOpenFirst", () => {
    const componentWithAutoOpen = {
      ...defaultPropertyComponent,
      properties: {
        ...defaultPropertyComponent.properties,
        autoOpenFirst: true,
      },
    };

    render(
      <AccordionGroupPanel
        propertyKeys={defaultPropertyKeys}
        propertyComponent={componentWithAutoOpen}
        setProperty={mockSetProperty}
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: /Auto Open First Item/i,
    });
    fireEvent.click(checkbox);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.AutoOpenFirst,
      false,
    );
  });

  test("handles unchecking ShowNumbering", () => {
    const componentWithNumbering = {
      ...defaultPropertyComponent,
      properties: {
        ...defaultPropertyComponent.properties,
        showNumbering: true,
      },
    };

    render(
      <AccordionGroupPanel
        propertyKeys={defaultPropertyKeys}
        propertyComponent={componentWithNumbering}
        setProperty={mockSetProperty}
      />,
    );

    const checkbox = screen.getByRole("checkbox", { name: /Show Numbering/i });
    fireEvent.click(checkbox);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.ShowNumbering,
      false,
    );
  });

  test("renders only specified property keys", () => {
    const limitedKeys = [ComponentProperty.AutoOpenFirst];

    render(
      <AccordionGroupPanel
        propertyKeys={limitedKeys}
        propertyComponent={defaultPropertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    expect(screen.getByLabelText("Auto Open First Item")).toBeInTheDocument();
    expect(screen.queryByLabelText("Show Numbering")).not.toBeInTheDocument();
  });

  test("renders items with correct labels in expandable columns", () => {
    render(
      <AccordionGroupPanel
        propertyKeys={defaultPropertyKeys}
        propertyComponent={defaultPropertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    const labels = screen.getAllByTestId("expandable-label");
    expect(labels[0]).toHaveTextContent("Item 1");
    expect(labels[1]).toHaveTextContent("Item 2");
  });

  test("handles multiple rapid item changes", () => {
    render(
      <AccordionGroupPanel
        propertyKeys={defaultPropertyKeys}
        propertyComponent={defaultPropertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    const titleInput = screen.getByDisplayValue("Item 1");
    fireEvent.change(titleInput, { target: { value: "First" } });
    fireEvent.change(titleInput, { target: { value: "Second" } });
    fireEvent.change(titleInput, { target: { value: "Third" } });

    expect(mockSetProperty).toHaveBeenCalledTimes(3);
  });

  test("adds items with sequential naming", () => {
    const { rerender } = render(
      <AccordionGroupPanel
        propertyKeys={defaultPropertyKeys}
        propertyComponent={defaultPropertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    const addButton = screen.getByTestId("add-expandable-column");
    fireEvent.click(addButton);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.AccordionItems,
      expect.arrayContaining([
        expect.objectContaining({
          title: "Item 3",
        }),
      ]),
    );

    const updatedComponent = {
      ...defaultPropertyComponent,
      properties: {
        ...defaultPropertyComponent.properties,
        items: [
          ...defaultPropertyComponent.properties.items,
          { id: "3", title: "Item 3", description: "" },
        ],
      },
    };

    rerender(
      <AccordionGroupPanel
        propertyKeys={defaultPropertyKeys}
        propertyComponent={updatedComponent}
        setProperty={mockSetProperty}
      />,
    );

    fireEvent.click(addButton);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.AccordionItems,
      expect.arrayContaining([
        expect.objectContaining({
          title: "Item 4",
        }),
      ]),
    );
  });

  test("handles property change for different item indexes", () => {
    render(
      <AccordionGroupPanel
        propertyKeys={defaultPropertyKeys}
        propertyComponent={defaultPropertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    const secondTitleInput = screen.getByDisplayValue("Item 2");
    fireEvent.change(secondTitleInput, {
      target: { value: "Modified Item 2" },
    });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.AccordionItems,
      [
        { id: "1", title: "Item 1", description: "Description 1" },
        { id: "2", title: "Modified Item 2", description: "Description 2" },
      ],
    );
  });

  test("has correct input ids for accessibility", () => {
    render(
      <AccordionGroupPanel
        propertyKeys={defaultPropertyKeys}
        propertyComponent={defaultPropertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    expect(
      screen.getByRole("checkbox", { name: /Auto Open First/i }),
    ).toHaveAttribute("id", "autoOpenFirst");
    expect(
      screen.getByRole("checkbox", { name: /Show Numbering/i }),
    ).toHaveAttribute("id", "showNumbering");
  });

  test("renders return null for unknown property keys", () => {
    const unknownKeys = ["unknownProperty" as ComponentProperty];

    const { container } = render(
      <AccordionGroupPanel
        propertyKeys={unknownKeys}
        propertyComponent={defaultPropertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    const propertyElements = container.querySelectorAll(".componentProperty");
    expect(propertyElements).toHaveLength(0);
  });

  test("handles setProperty call from ExpandableColumn", () => {
    render(
      <AccordionGroupPanel
        propertyKeys={defaultPropertyKeys}
        propertyComponent={defaultPropertyComponent}
        setProperty={mockSetProperty}
      />,
    );

    const triggerButton = screen.getByTestId("trigger-setproperty-1");
    fireEvent.click(triggerButton);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.AccordionItems,
      [{ id: "reordered" }],
    );
  });

  test("uses fallback label when item title is empty", () => {
    const componentWithEmptyTitle = {
      ...defaultPropertyComponent,
      properties: {
        ...defaultPropertyComponent.properties,
        items: [
          { id: "1", title: "", description: "Description 1" },
          { id: "2", title: "Item 2", description: "Description 2" },
        ],
      },
    };

    render(
      <AccordionGroupPanel
        propertyKeys={defaultPropertyKeys}
        propertyComponent={componentWithEmptyTitle}
        setProperty={mockSetProperty}
      />,
    );

    const labels = screen.getAllByTestId("expandable-label");
    expect(labels[0]).toHaveTextContent("Item 1");
    expect(labels[1]).toHaveTextContent("Item 2");
  });
});
