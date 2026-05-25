import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import FooterPanel from "./FooterPanel";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import { PropertyPanels } from "@/app/utils/constants";
import { ComponentProperty } from "@/app/data/componentProperties";

// Mock the necessary dependencies
jest.mock("@/app/context/PropertiesContext", () => ({
  usePropertyPane: jest.fn(),
}));

jest.mock("@/app/styles/properties-pane.module.scss", () => ({
  componentProperty: "componentProperty",
  column: "column",
  row: "row",
  propertyLabel: "propertyLabel",
  textArea: "textArea",
  checkBoxCenter: "checkBoxCenter",
  conditionalCheckBox: "conditionalCheckBox",
  panelHeading: "panelHeading",
  isOpen: "isOpen",
}));

jest.mock("@/app/styles/shared.module.scss", () => ({ mt5: "mt5" }));

// Mock the ChevronDownIcon component
jest.mock("../../SVGIcons/ChevronDown", () => () => (
  <div data-testid="chevron-icon" />
));

describe("FooterPanel Component", () => {
  const mockSetProperty = jest.fn();
  const mockTogglePanel = jest.fn();

  // Default property component for testing
  const propertyComponent = {
    id: "test-id",
    properties: {
      calculatedColumn: false,
      footerLabel: "Test Footer Label",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: mockTogglePanel,
      isPanelOpen: jest.fn(() => true),
    });
  });

  test("renders the panel with header and toggle button", () => {
    render(
      <FooterPanel
        propertyKeys={[]}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />
    );

    expect(screen.getByText("Footer")).toBeInTheDocument();
    expect(screen.getByTestId("toggleButton")).toBeInTheDocument();
    expect(screen.getByTestId("chevron-icon")).toBeInTheDocument();
  });

  test("calls togglePanel when toggle button is clicked", () => {
    render(
      <FooterPanel
        propertyKeys={[]}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />
    );

    const toggleButton = screen.getByTestId("toggleButton");
    fireEvent.click(toggleButton);
    expect(mockTogglePanel).toHaveBeenCalledWith(PropertyPanels.FooterPanel);
  });

  test("toggle button does not have isOpen class when panel is closed", () => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: mockTogglePanel,
      isPanelOpen: jest.fn(() => false),
    });

    render(
      <FooterPanel
        propertyKeys={[]}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />
    );

    const toggleButton = screen.getByTestId("toggleButton");
    expect(toggleButton.className).not.toContain("isOpen");
  });

  test("does not render property content when panel is closed", () => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: mockTogglePanel,
      isPanelOpen: jest.fn(() => false),
    });

    render(
      <FooterPanel
        propertyKeys={[
          ComponentProperty.CalculatedColumn,
          ComponentProperty.FooterLabel,
        ]}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />
    );

    expect(screen.queryByTestId("calculatedColumn")).not.toBeInTheDocument();
    expect(screen.queryByTestId("footerLabel")).not.toBeInTheDocument();
  });

  test("renders calculatedColumn checkbox when specified in propertyKeys", () => {
    render(
      <FooterPanel
        propertyKeys={[ComponentProperty.CalculatedColumn]}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />
    );

    const checkbox = screen.getByTestId("calculatedColumn");
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  test("calls setProperty when calculatedColumn checkbox is clicked", () => {
    render(
      <FooterPanel
        propertyKeys={[ComponentProperty.CalculatedColumn]}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />
    );

    const checkbox = screen.getByTestId("calculatedColumn");
    fireEvent.click(checkbox);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.CalculatedColumn,
      true
    );
  });

  test("renders footerLabel input when specified in propertyKeys and calculatedColumn is false", () => {
    render(
      <FooterPanel
        propertyKeys={[ComponentProperty.FooterLabel]}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />
    );

    const input = screen.getByTestId("footerLabel");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("Test Footer Label");
  });

  test("calls setProperty when footerLabel input changes", () => {
    render(
      <FooterPanel
        propertyKeys={[ComponentProperty.FooterLabel]}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />
    );

    const input = screen.getByTestId("footerLabel");
    fireEvent.change(input, { target: { value: "New Footer Label" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.FooterLabel,
      "New Footer Label"
    );
  });

  test("does not render footerLabel input when calculatedColumn is true", () => {
    const calculatedPropertyComponent = {
      id: "test-id",
      properties: {
        calculatedColumn: true,
        footerLabel: "Test Footer Label",
      },
    };

    render(
      <FooterPanel
        propertyKeys={[ComponentProperty.FooterLabel]}
        propertyComponent={calculatedPropertyComponent}
        setProperty={mockSetProperty}
      />
    );

    expect(screen.queryByTestId("footerLabel")).not.toBeInTheDocument();
  });

  test("renders both properties when both are in propertyKeys", () => {
    render(
      <FooterPanel
        propertyKeys={[
          ComponentProperty.CalculatedColumn,
          ComponentProperty.FooterLabel,
        ]}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />
    );

    expect(screen.getByTestId("calculatedColumn")).toBeInTheDocument();
    expect(screen.getByTestId("footerLabel")).toBeInTheDocument();
  });

  test("handles default values when properties are undefined", () => {
    const emptyPropertyComponent = {
      id: "test-id",
      properties: {},
    };

    render(
      <FooterPanel
        propertyKeys={[
          ComponentProperty.CalculatedColumn,
          ComponentProperty.FooterLabel,
        ]}
        propertyComponent={emptyPropertyComponent}
        setProperty={mockSetProperty}
      />
    );

    const checkbox = screen.getByTestId("calculatedColumn");
    expect(checkbox).not.toBeChecked();

    const input = screen.getByTestId("footerLabel");
    expect(input).toHaveValue("");
  });

  test("does not render anything for an unrecognized property key", () => {
    render(
      <FooterPanel
        propertyKeys={["UnknownProperty" as unknown as ComponentProperty]}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />
    );

    expect(screen.queryByTestId("calculatedColumn")).not.toBeInTheDocument();
    expect(screen.queryByTestId("footerLabel")).not.toBeInTheDocument();
  });
});
