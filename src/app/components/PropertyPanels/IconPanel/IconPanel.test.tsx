import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import IconPanel from "./IconPanel";
import { ComponentProperty } from "@/app/data/componentProperties";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";

jest.mock("@/app/context/PropertiesContext", () => ({
  usePropertyPane: jest.fn(),
}));

jest.mock("@/app/styles/properties-pane.module.scss", () => ({
  panelHeading: "panelHeading",
  isOpen: "isOpen",
  componentProperty: "componentProperty",
  column: "column",
  propertyLabel: "propertyLabel",
  textInput: "textInput",
  checkBoxCenter: "checkBoxCenter",
  conditionalCheckBox: "conditionalCheckBox",
}));

jest.mock("@/app/styles/shared.module.scss", () => ({
  mt5: "mt5",
}));

jest.mock(
  "@/app/components/UtilityComponents/DragDropFileUpload/DragDropFileUpload",
  () => {
    return function MockDragDrop(props: any) {
      return <div data-testid="mock-drag-drop" />;
    };
  }
);

jest.mock("../../UIComponents/Slider/Slider", () => {
  return function MockSlider({ onChange, id, value }: any) {
    return (
      <input
        data-testid={id}
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    );
  };
});

jest.mock("@/app/components/SVGIcons/ChevronDown", () => {
  return function MockChevron() {
    return <span data-testid="chevron-icon" />;
  };
});

describe("IconPanel", () => {
  const mockSetProperty = jest.fn();
  const mockTogglePanel = jest.fn();
  const mockIsPanelOpen = jest.fn();

  const defaultProps = {
    propertyKeys: [
      ComponentProperty.IconUploadType,
      ComponentProperty.IconUrl,
      ComponentProperty.IconSize,
      ComponentProperty.IconPosition,
      ComponentProperty.IconSpacing,
      ComponentProperty.IconBackgroundColor,
      ComponentProperty.isIconButton,
    ],
    propertyComponent: {
      id: "comp-1",
      type: "button",
      properties: {},
    },
    setProperty: mockSetProperty,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: mockTogglePanel,
      isPanelOpen: mockIsPanelOpen,
    });

    mockIsPanelOpen.mockReturnValue(true);
  });

  it("renders the panel header", () => {
    render(<IconPanel {...defaultProps} />);
    expect(screen.getByText("Icon")).toBeInTheDocument();
    expect(screen.getByTestId("chevron-icon")).toBeInTheDocument();
  });

  it("toggles the panel on click", () => {
    render(<IconPanel {...defaultProps} />);
    const header = screen.getByTestId("toggleButton");
    fireEvent.click(header);
    expect(mockTogglePanel).toHaveBeenCalledWith("IconPanel");
  });

  it("does not apply 'isOpen' class when panel is closed", () => {
    mockIsPanelOpen.mockReturnValue(false);
    render(<IconPanel {...defaultProps} />);
    const header = screen.getByTestId("toggleButton");
    expect(header).not.toHaveClass("isOpen");
  });

  it("handles undefined togglePanel or isPanelOpen gracefully", () => {
    (usePropertyPane as jest.Mock).mockReturnValue({});

    render(<IconPanel {...defaultProps} />);
    const header = screen.getByTestId("toggleButton");

    expect(header).not.toHaveClass("isOpen");

    fireEvent.click(header);
  });

  it("updates IconUploadType", () => {
    render(<IconPanel {...defaultProps} />);
    const select = screen.getByTestId("iconUploadType");

    fireEvent.change(select, { target: { value: "file-upload" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.IconUploadType,
      "file-upload"
    );
  });

  it("renders Text Input for IconUrl when upload type is 'url'", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: { iconUploadType: "url", iconUrl: "http://test.com" },
      },
    };
    render(<IconPanel {...props} />);

    const input = screen.getByTestId("iconUrl");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("http://test.com");

    fireEvent.change(input, { target: { value: "http://new.com" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.IconUrl,
      "http://new.com"
    );
  });

  it("renders DragDropFileUpload for IconUrl when upload type is 'file-upload'", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: { iconUploadType: "file-upload" },
      },
    };
    render(<IconPanel {...props} />);

    expect(screen.getByTestId("mock-drag-drop")).toBeInTheDocument();
    expect(screen.queryByTestId("iconUrl")).not.toBeInTheDocument();
  });

  it("renders nothing for IconUrl if upload type is invalid/empty", () => {
    const randomProps = {
      ...defaultProps,
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: { iconUploadType: "random-invalid-type" },
      },
    };

    render(<IconPanel {...randomProps} />);
    expect(screen.queryByTestId("iconUrl")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mock-drag-drop")).not.toBeInTheDocument();
  });

  it("updates IconSize via Slider", () => {
    render(<IconPanel {...defaultProps} />);
    const slider = screen.getByTestId("iconSize");
    fireEvent.change(slider, { target: { value: "50" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.IconSize,
      50
    );
  });

  it("updates IconSpacing via Slider", () => {
    render(<IconPanel {...defaultProps} />);
    const slider = screen.getByTestId("iconSpacing");
    fireEvent.change(slider, { target: { value: "10" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.IconSpacing,
      10
    );
  });

  it("updates IconPosition", () => {
    render(<IconPanel {...defaultProps} />);
    const select = screen.getByTestId("iconPosition");
    fireEvent.change(select, { target: { value: "right" } });
    expect(mockSetProperty).toHaveBeenCalledWith("iconPosition", "right");
  });

  it("shows 'Above' option for generic components", () => {
    render(<IconPanel {...defaultProps} />);
    const select = screen.getByTestId("iconPosition");
    expect(select).toHaveTextContent("Above");
  });

  it("hides 'Above' option for 'input' components", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        id: "1",
        type: "input",
        properties: {},
      },
    };
    render(<IconPanel {...props} />);
    const select = screen.getByTestId("iconPosition");
    expect(select).not.toHaveTextContent("Above");
  });

  it("hides 'Above' option for 'input-table-column' components", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        id: "1",
        type: "input-table-column",
        properties: {},
      },
    };
    render(<IconPanel {...props} />);
    const select = screen.getByTestId("iconPosition");
    expect(select).not.toHaveTextContent("Above");
  });

  it("updates IconBackgroundColor", () => {
    render(<IconPanel {...defaultProps} />);
    const input = screen.getByTestId("iconBackgroundColor");
    fireEvent.change(input, { target: { value: "#fff" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.IconBackgroundColor,
      "#fff"
    );
  });

  it("updates isIconButton checkbox", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: { isIconButton: false },
      },
    };
    render(<IconPanel {...props} />);

    const checkbox = screen.getByLabelText("Is Icon Button?");
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.isIconButton,
      true
    );
  });
});
