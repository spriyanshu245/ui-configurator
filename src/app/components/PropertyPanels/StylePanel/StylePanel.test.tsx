import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ComponentProperty } from "../../../data/componentProperties";
import { PropertyPanels } from "../../../utils/constants";
import { usePropertyPane } from "../../../context/PropertiesContext";
import StylePanel from "./StylePanel";
import sharedPropertiesStyles from "../../../styles/sharedPropertiesStyles.module.css";

jest.mock("../../../context/PropertiesContext", () => ({
  usePropertyPane: jest.fn(),
}));

describe("SectionPanel Component", () => {
  const mockSetProperty = jest.fn();

  const mockPropertyComponent = {
    id: "section1",
    properties: {
      backgroundColor: "#ffffff",
      borderThickness: 2,
      borderStyle: "solid",
      borderColor: "#000000",
      borderRadius: 5,
      clickable: false,
      url: "",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: jest.fn(),
      isPanelOpen: jest.fn(() => true),
    });
  });

  test("renders section panel with properties", () => {
    render(
      <StylePanel
        propertyKeys={[
          ComponentProperty.BackgroundColor,
          ComponentProperty.BorderThickness,
        ]}
        propertyComponent={mockPropertyComponent}
        setProperty={mockSetProperty}
      />
    );
    expect(screen.getByText("Background Color")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter background color here")
    ).toHaveValue("#ffffff");
    expect(screen.getByText("Border Thickness (px)")).toBeInTheDocument();
  });

  test("allows background color to be changed", () => {
    render(
      <StylePanel
        propertyKeys={[ComponentProperty.BackgroundColor]}
        propertyComponent={mockPropertyComponent}
        setProperty={mockSetProperty}
      />
    );
    const input = screen.getByPlaceholderText("Enter background color here");
    fireEvent.change(input, { target: { value: "#ff0000" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.BackgroundColor,
      "#ff0000"
    );
  });

  test("toggles the panel when the button is clicked", () => {
    const mockTogglePanel = jest.fn();
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: mockTogglePanel,
      isPanelOpen: jest.fn(() => true),
    });

    render(
      <StylePanel
        propertyKeys={[ComponentProperty.BackgroundColor]}
        propertyComponent={mockPropertyComponent}
        setProperty={mockSetProperty}
      />
    );

    const toggleButton = screen.getByRole("button", { name: /style/i });
    fireEvent.click(toggleButton);
    expect(mockTogglePanel).toHaveBeenCalledWith(PropertyPanels.SectionPanel);
  });

  test("renders URL input only if section is clickable", () => {
    const clickableComponent = {
      ...mockPropertyComponent,
      properties: {
        ...mockPropertyComponent.properties,
        clickable: true,
        url: "https://example.com",
      },
    };

    render(
      <StylePanel
        propertyKeys={[ComponentProperty.Url]}
        propertyComponent={clickableComponent}
        setProperty={mockSetProperty}
      />
    );

    expect(screen.getByPlaceholderText("Enter url here")).toHaveValue(
      "https://example.com"
    );
  });

  test("allows border style selection", () => {
    render(
      <StylePanel
        propertyKeys={[ComponentProperty.BorderStyle]}
        propertyComponent={mockPropertyComponent}
        setProperty={mockSetProperty}
      />
    );

    const select = screen.getByTestId("borderStyle");
    fireEvent.change(select, { target: { value: "dashed" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.BorderStyle,
      "dashed"
    );
  });

  test("allows border color input", () => {
    render(
      <StylePanel
        propertyKeys={[ComponentProperty.BorderColor]}
        propertyComponent={mockPropertyComponent}
        setProperty={mockSetProperty}
      />
    );

    const input = screen.getByPlaceholderText("Enter border color here");
    fireEvent.change(input, { target: { value: "#ff0000" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.BorderColor,
      "#ff0000"
    );
  });

  test("allows border radius input", () => {
    render(
      <StylePanel
        propertyKeys={[ComponentProperty.BorderRadius]}
        propertyComponent={mockPropertyComponent}
        setProperty={mockSetProperty}
      />
    );

    const input = screen.getByPlaceholderText("Enter border radius here");
    fireEvent.change(input, { target: { value: "10" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.BorderRadius,
      "10"
    );
  });

  test("allows toggling clickable section", () => {
    render(
      <StylePanel
        propertyKeys={[ComponentProperty.Clickable]}
        propertyComponent={mockPropertyComponent}
        setProperty={mockSetProperty}
      />
    );

    const toggle = screen.getByTestId("clickable");
    fireEvent.click(toggle);
    expect(mockSetProperty).toHaveBeenCalledWith(ComponentProperty.Url, "");
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.Clickable,
      true
    );
  });

  test("allows border thickness input", () => {
    render(
      <StylePanel
        propertyKeys={[ComponentProperty.BorderThickness]}
        propertyComponent={mockPropertyComponent}
        setProperty={mockSetProperty}
      />
    );

    const input = screen.getByPlaceholderText("Enter border thickness here");
    fireEvent.change(input, { target: { value: "5" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.BorderThickness,
      "5"
    );
  });

  test("renders URL input and allows URL to be changed if section is clickable", () => {
    const clickableComponent = {
      ...mockPropertyComponent,
      properties: {
        ...mockPropertyComponent.properties,
        clickable: true,
        url: "https://example.com",
      },
    };

    render(
      <StylePanel
        propertyKeys={[ComponentProperty.Url]}
        propertyComponent={clickableComponent}
        setProperty={mockSetProperty}
      />
    );

    const input = screen.getByPlaceholderText("Enter url here");
    expect(input).toHaveValue("https://example.com");

    fireEvent.change(input, { target: { value: "https://newurl.com" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.Url,
      "https://newurl.com"
    );
  });

  test("does not render URL input if section is not clickable", () => {
    const nonClickableComponent = {
      ...mockPropertyComponent,
      properties: {
        ...mockPropertyComponent.properties,
        clickable: false,
      },
    };

    render(
      <StylePanel
        propertyKeys={[ComponentProperty.Url]}
        propertyComponent={nonClickableComponent}
        setProperty={mockSetProperty}
      />
    );

    expect(screen.queryByPlaceholderText("Enter url here")).toBeNull();
  });

  test("renders with default background color if not provided", () => {
    const componentWithoutBackgroundColor = {
      ...mockPropertyComponent,
      properties: {
        ...mockPropertyComponent.properties,
        backgroundColor: undefined,
      },
    };

    render(
      <StylePanel
        propertyKeys={[ComponentProperty.BackgroundColor]}
        propertyComponent={componentWithoutBackgroundColor}
        setProperty={mockSetProperty}
      />
    );

    const input = screen.getByPlaceholderText("Enter background color here");
    expect(input).toHaveValue("");
  });

  test("renders with default border thickness if not provided", () => {
    const componentWithoutBorderThickness = {
      ...mockPropertyComponent,
      properties: {
        ...mockPropertyComponent.properties,
        borderThickness: undefined,
      },
    };

    render(
      <StylePanel
        propertyKeys={[ComponentProperty.BorderThickness]}
        propertyComponent={componentWithoutBorderThickness}
        setProperty={mockSetProperty}
      />
    );

    const input = screen.getByPlaceholderText("Enter border thickness here");
    expect(input).toHaveValue(0);
  });

  test("renders with default border style if not provided", () => {
    const componentWithoutBorderStyle = {
      ...mockPropertyComponent,
      properties: {
        ...mockPropertyComponent.properties,
        borderStyle: undefined,
      },
    };

    render(
      <StylePanel
        propertyKeys={[ComponentProperty.BorderStyle]}
        propertyComponent={componentWithoutBorderStyle}
        setProperty={mockSetProperty}
      />
    );

    const select = screen.getByTestId("borderStyle");
    expect(select).toHaveValue("none");
  });

  test("renders with default border color if not provided", () => {
    const componentWithoutBorderColor = {
      ...mockPropertyComponent,
      properties: {
        ...mockPropertyComponent.properties,
        borderColor: undefined,
      },
    };

    render(
      <StylePanel
        propertyKeys={[ComponentProperty.BorderColor]}
        propertyComponent={componentWithoutBorderColor}
        setProperty={mockSetProperty}
      />
    );

    const input = screen.getByPlaceholderText("Enter border color here");
    expect(input).toHaveValue("");
  });

  test("renders with default border radius if not provided", () => {
    const componentWithoutBorderRadius = {
      ...mockPropertyComponent,
      properties: {
        ...mockPropertyComponent.properties,
        borderRadius: undefined,
      },
    };

    render(
      <StylePanel
        propertyKeys={[ComponentProperty.BorderRadius]}
        propertyComponent={componentWithoutBorderRadius}
        setProperty={mockSetProperty}
      />
    );

    const input = screen.getByPlaceholderText("Enter border radius here");
    expect(input).toHaveValue(0);
  });

  test("renders with default URL if not provided", () => {
    const componentWithoutUrl = {
      ...mockPropertyComponent,
      properties: {
        ...mockPropertyComponent.properties,
        clickable: true,
        url: undefined,
      },
    };

    render(
      <StylePanel
        propertyKeys={[ComponentProperty.Url]}
        propertyComponent={componentWithoutUrl}
        setProperty={mockSetProperty}
      />
    );

    const input = screen.getByPlaceholderText("Enter url here");
    expect(input).toHaveValue("");
  });

  test("renders panel heading with 'Section' if not sub-section", () => {
    render(
      <StylePanel
        propertyKeys={[]}
        propertyComponent={mockPropertyComponent}
        setProperty={mockSetProperty}
      />
    );

    expect(screen.getByText("Style")).toBeInTheDocument();
  });

  test("renders panel heading with 'Sub Section' if sub-section", () => {
    const subSectionComponent = {
      ...mockPropertyComponent,
      type: "sub-section",
    };

    render(
      <StylePanel
        propertyKeys={[]}
        propertyComponent={subSectionComponent}
        setProperty={mockSetProperty}
      />
    );

    expect(screen.getByText("Style")).toBeInTheDocument();
  });

  test("applies open class if panel is open", () => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: jest.fn(),
      isPanelOpen: jest.fn(() => true),
    });

    render(
      <StylePanel
        propertyKeys={[]}
        propertyComponent={mockPropertyComponent}
        setProperty={mockSetProperty}
      />
    );

    const button = screen.getByRole("button");
    expect(button).toHaveClass(sharedPropertiesStyles.isOpen);
  });

  test("does not apply open class if panel is not open", () => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: jest.fn(),
      isPanelOpen: jest.fn(() => false),
    });

    render(
      <StylePanel
        propertyKeys={[]}
        propertyComponent={mockPropertyComponent}
        setProperty={mockSetProperty}
      />
    );

    const button = screen.getByRole("button");
    expect(button).not.toHaveClass(sharedPropertiesStyles.isOpen);
  });

  test("renders nothing for unsupported property keys", () => {
    const unsupportedPropertyComponent = {
      ...mockPropertyComponent,
      properties: {
        ...mockPropertyComponent.properties,
        unsupportedProperty: "unsupported",
      },
    };

    render(
      <StylePanel
        propertyKeys={["unsupportedProperty" as ComponentProperty]}
        propertyComponent={unsupportedPropertyComponent}
        setProperty={mockSetProperty}
      />
    );

    expect(screen.queryByText("unsupportedProperty")).toBeNull();
  });

  test("renders padding input when independentPadding is false", () => {
    const componentWithPadding = {
      ...mockPropertyComponent,
      properties: {
        ...mockPropertyComponent.properties,
        padding: 10,
        independentPadding: false,
      },
    };

    render(
      <StylePanel
        propertyKeys={[ComponentProperty.Padding]}
        propertyComponent={componentWithPadding}
        setProperty={mockSetProperty}
      />
    );

    expect(screen.getByTestId("padding")).toBeInTheDocument();
  });

  test("renders independent padding fields when independentPadding is true", () => {
    const componentWithIndependentPadding = {
      ...mockPropertyComponent,
      properties: {
        ...mockPropertyComponent.properties,
        independentPadding: true,
        paddingTop: 5,
        paddingBottom: 10,
        paddingLeft: 15,
        paddingRight: 20,
      },
    };

    render(
      <StylePanel
        propertyKeys={[
          ComponentProperty.IndependentPadding,
          ComponentProperty.PaddingTop,
          ComponentProperty.PaddingBottom,
          ComponentProperty.PaddingLeft,
          ComponentProperty.PaddingRight,
        ]}
        propertyComponent={componentWithIndependentPadding}
        setProperty={mockSetProperty}
      />
    );

    expect(screen.getByTestId("independentPadding")).toBeInTheDocument();
    expect(screen.getByTestId("paddingTop")).toHaveValue(5);
    expect(screen.getByTestId("paddingBottom")).toHaveValue(10);
    expect(screen.getByTestId("paddingLeft")).toHaveValue(15);
    expect(screen.getByTestId("paddingRight")).toHaveValue(20);
  });

  test("handles missing togglePanel and isPanelOpen gracefully", () => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: undefined,
      isPanelOpen: undefined,
    });

    render(
      <StylePanel
        propertyKeys={[]}
        propertyComponent={mockPropertyComponent}
        setProperty={mockSetProperty}
      />
    );

    expect(screen.getByRole("button")).toBeInTheDocument(); // No crash
  });
  test("calls setProperty when padding input is changed", () => {
    const componentWithPadding = {
      ...mockPropertyComponent,
      properties: {
        ...mockPropertyComponent.properties,

        independentPadding: false,
      },
    };

    render(
      <StylePanel
        propertyKeys={[ComponentProperty.Padding]}
        propertyComponent={componentWithPadding}
        setProperty={mockSetProperty}
      />
    );

    const input = screen.getByTestId("padding");
    fireEvent.change(input, { target: { value: "20" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.Padding,
      "20"
    );
  });
  test("calls setProperty when paddingTop input is changed", () => {
    const componentWithIndependentPadding = {
      ...mockPropertyComponent,
      properties: {
        ...mockPropertyComponent.properties,
        independentPadding: true,
      },
    };

    render(
      <StylePanel
        propertyKeys={[ComponentProperty.PaddingTop]}
        propertyComponent={componentWithIndependentPadding}
        setProperty={mockSetProperty}
      />
    );

    const input = screen.getByTestId("paddingTop");
    fireEvent.change(input, { target: { value: "15" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.PaddingTop,
      "15"
    );
  });

  test("calls setProperty when independentPadding checkbox is toggled", () => {
    const componentWithCheckbox = {
      ...mockPropertyComponent,
      properties: {
        ...mockPropertyComponent.properties,
      },
    };

    render(
      <StylePanel
        propertyKeys={[ComponentProperty.IndependentPadding]}
        propertyComponent={componentWithCheckbox}
        setProperty={mockSetProperty}
      />
    );

    const checkbox = screen.getByTestId("independentPadding");
    fireEvent.click(checkbox);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.IndependentPadding,
      true
    );
  });

  test("calls setProperty when paddingBottom input is changed", () => {
    const componentWithIndependentPadding = {
      ...mockPropertyComponent,
      properties: {
        ...mockPropertyComponent.properties,
        independentPadding: true,
      },
    };

    render(
      <StylePanel
        propertyKeys={[ComponentProperty.PaddingBottom]}
        propertyComponent={componentWithIndependentPadding}
        setProperty={mockSetProperty}
      />
    );

    const input = screen.getByTestId("paddingBottom");
    fireEvent.change(input, { target: { value: "15" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.PaddingBottom,
      "15"
    );
  });
  test("calls setProperty when paddingRight input is changed", () => {
    const componentWithIndependentPadding = {
      ...mockPropertyComponent,
      properties: {
        ...mockPropertyComponent.properties,
        independentPadding: true,
      },
    };

    render(
      <StylePanel
        propertyKeys={[ComponentProperty.PaddingRight]}
        propertyComponent={componentWithIndependentPadding}
        setProperty={mockSetProperty}
      />
    );

    const input = screen.getByTestId("paddingRight");
    fireEvent.change(input, { target: { value: "15" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.PaddingRight,
      "15"
    );
  });
  test("calls setProperty when paddingLeft input is changed", () => {
    const componentWithIndependentPadding = {
      ...mockPropertyComponent,
      properties: {
        ...mockPropertyComponent.properties,
        independentPadding: true,
      },
    };

    render(
      <StylePanel
        propertyKeys={[ComponentProperty.PaddingLeft]}
        propertyComponent={componentWithIndependentPadding}
        setProperty={mockSetProperty}
      />
    );

    const input = screen.getByTestId("paddingLeft");
    fireEvent.change(input, { target: { value: "15" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.PaddingLeft,
      "15"
    );
  });
});
