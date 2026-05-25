import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TabsRow from "./TabsRow";
import { TabComponent, TabsComponent } from "../../../types/types";
import "@testing-library/jest-dom";

jest.mock("./TabsConditionsRenderer", () => ({
  __esModule: true,
  default: ({ tabConditions, setProperty, "data-testid": dataTestId }: any) => (
    <div data-testid={dataTestId}>
      <button
        data-testid="add-condition"
        onClick={() => setProperty("conditions", [{ id: "1" }])}
      >
        Add Condition
      </button>
    </div>
  ),
}));

describe("TabsRow Component", () => {
  // Mock function for setProperty
  const mockSetProperty = jest.fn();

  // Sample props based on the provided data
  const mockColumn: TabComponent = {
    id: "ca89c39a-96bf-46eb-a88c-dc4e2b1ba1f2",
    properties: {
      title: "Tab 1",
    },
    type: "tab",
    category: "component",
    components: [],
    pageCode: ""
  };

  const mockPropertyComponent: TabsComponent = {
    id: "cd6fc013-804e-4c90-9252-784e5da859cb",
    type: "tabs",
    // displayName: "Tabs",
    category: "component",
    // icon: "<svg>...</svg>",
    components: [
      {
        id: "ca89c39a-96bf-46eb-a88c-dc4e2b1ba1f2",
        properties: {
          title: "Tab 1",
          isConditional: true,
        },
        type: "tab",
        category: "component",
        components: [],
        pageCode: ""
      },
      {
        id: "3d08e5d4-8577-4954-89e9-6058e2c37519",
        properties: {
          title: "Tab 2",
        },
        components: [],
        type: "tab",
        category: "component",
        pageCode: ""
      },
    ],
    properties: {
      tabLayout: "horizontal",
      tabLevel: "L1",
    },
    // isSection: false,
    // isComponent: true
  };

  const defaultProps = {
    id: 0,
    column: mockColumn,
    propertyComponent: mockPropertyComponent,
    setProperty: mockSetProperty,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders correctly with provided props", () => {
    render(<TabsRow {...defaultProps} />);

    expect(screen.getByText("Label")).toBeInTheDocument();

    const input = screen.getByTestId("tabLabel-1") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("Tab 1");
  });

  test("updates tab title when input changes", () => {
    render(<TabsRow {...defaultProps} />);

    const input = screen.getByTestId("tabLabel-1");
    fireEvent.change(input, { target: { value: "Updated Tab Title" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      "components",
      [
        {
          ...mockColumn,
          properties: {
            ...mockColumn.properties,
            title: "Updated Tab Title",
            isConditional: true,
          },
        },
        mockPropertyComponent.components[1],
      ],
      true
    );
  });

  test("handles column with undefined title property", () => {
    const propsWithUndefinedTitle = {
      ...defaultProps,
      column: {
        ...mockColumn,
        properties: {},
      },
    };

    render(<TabsRow {...propsWithUndefinedTitle} />);

    const input = screen.getByTestId("tabLabel-1") as HTMLInputElement;
    expect(input.value).toBe("");
  });

  test("handles null components array gracefully", () => {
    const propsWithNullComponents = {
      ...defaultProps,
      propertyComponent: {
        ...mockPropertyComponent,
        components: null,
      },
    };

    render(<TabsRow {...propsWithNullComponents} />);

    expect(screen.getByText("Label")).toBeInTheDocument();

    const input = screen.getByTestId("tabLabel-1");
    fireEvent.change(input, { target: { value: "New Tab Name" } });

    expect(mockSetProperty).toHaveBeenCalledWith("components", [], true);
  });

  test("does not modify other tabs when updating a tab title", () => {
    const propsForSecondTab = {
      ...defaultProps,
      id: 1,
      column: mockPropertyComponent.components[1],
    };

    render(<TabsRow {...propsForSecondTab} />);

    const input = screen.getByTestId("tabLabel-2");
    fireEvent.change(input, { target: { value: "Modified Tab 2" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      "components",
      [
        mockPropertyComponent.components[0],
        {
          ...mockPropertyComponent.components[1],
          properties: {
            ...mockPropertyComponent.components[1].properties,
            title: "Modified Tab 2",
          },
        },
      ],
      true
    );
  });

  test("toggles isConditional checkbox", () => {
    render(<TabsRow {...defaultProps} />);

    const checkbox = screen.getByTestId("isConditional-1");
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(mockSetProperty).toHaveBeenCalledWith(
      "components",
      expect.arrayContaining([
        expect.objectContaining({
          properties: expect.objectContaining({ isConditional: true }),
        }),
      ]),
      true
    );
  });

  test("renders TabsConditionsRenderer when isConditional is true", () => {
    const conditionalColumn: TabComponent = {
      ...mockColumn,
      properties: {
        ...mockColumn.properties,
        isConditional: true,
        conditions: [],
      },
    };

    const props = {
      ...defaultProps,
      column: conditionalColumn,
    };

    render(<TabsRow {...props} />);
    expect(screen.getByTestId("condition-1")).toBeInTheDocument();
  });

  test("renders sessionKeys textarea and handles change", () => {
    render(<TabsRow {...defaultProps} />);

    const textarea = screen.getByTestId("sessionKeys-1");
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute("placeholder", "Enter session keys (comma-separated)");

    fireEvent.change(textarea, { target: { value: "key1, key2" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      "components",
      expect.arrayContaining([
        expect.objectContaining({
          properties: expect.objectContaining({ sessionKeys: "key1, key2" }),
        }),
      ]),
      true
    );
  });

  test("handles column with undefined isConditional property", () => {
    const columnWithoutConditional: TabComponent = {
      ...mockColumn,
      properties: {
        title: "Tab 1",
      },
    };

    const props = {
      ...defaultProps,
      column: columnWithoutConditional,
    };

    render(<TabsRow {...props} />);
    const checkbox = screen.getByTestId("isConditional-1");
    expect(checkbox).not.toBeChecked();
  });

  test("handles column with undefined sessionKeys property", () => {
    const columnWithoutSessionKeys: TabComponent = {
      ...mockColumn,
      properties: {
        title: "Tab 1",
      },
    };

    const props = {
      ...defaultProps,
      column: columnWithoutSessionKeys,
    };

    render(<TabsRow {...props} />);
    const textarea = screen.getByTestId("sessionKeys-1") as HTMLTextAreaElement;
    expect(textarea.value).toBe("");
  });
});
