import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ImagePanel from "./ImagePanel";
import { ComponentProperty } from "@/app/data/componentProperties";
import { PropertyPanels } from "@/app/utils/constants";

jest.mock("@/app/styles/properties-pane.module.scss", () => ({
  componentProperty: "componentProperty",
  column: "column",
  propertyLabel: "propertyLabel",
  textInput: "textInput",
  panelHeading: "panelHeading",
  isOpen: "isOpen",
}));

jest.mock("@/app/styles/shared.module.scss", () => ({
  mt5: "mt5",
}));

jest.mock(
  "@/app/components/UtilityComponents/DragDropFileUpload/DragDropFileUpload",
  () => (props: any) => (
    <div data-testid="drag-drop-upload">
      DragDropFileUpload Mock - {props.propertyKey}
    </div>
  ),
);

jest.mock("../../SVGIcons/ChevronDown", () => () => (
  <div data-testid="chevron-icon" />
));

const togglePanelMock = jest.fn();
const isPanelOpenMock = jest.fn();

jest.mock("@/app/context/PropertiesContext", () => ({
  usePropertyPane: () => ({
    togglePanel: togglePanelMock,
    isPanelOpen: isPanelOpenMock,
  }),
}));

const baseProps = {
  propertyKeys: [ComponentProperty.Src, ComponentProperty.Alt],
  propertyComponent: {
    id: "image-1",
    properties: {
      alt: "Initial alt text",
    },
  },
  setProperty: jest.fn(),
};

describe("ImagePanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the Image panel heading and toggle button", () => {
    isPanelOpenMock.mockReturnValue(false);

    render(<ImagePanel {...baseProps} />);

    expect(screen.getByText("Image")).toBeInTheDocument();
    expect(screen.getByTestId("toggleButton")).toBeInTheDocument();
    expect(screen.getByTestId("chevron-icon")).toBeInTheDocument();
  });

  it("calls togglePanel when toggle button is clicked", () => {
    isPanelOpenMock.mockReturnValue(false);

    render(<ImagePanel {...baseProps} />);

    fireEvent.click(screen.getByTestId("toggleButton"));

    expect(togglePanelMock).toHaveBeenCalledTimes(1);
    expect(togglePanelMock).toHaveBeenCalledWith(PropertyPanels.ImagePanel);
  });

  it("does not render properties when panel is closed", () => {
    isPanelOpenMock.mockReturnValue(false);

    render(<ImagePanel {...baseProps} />);

    expect(screen.queryByText("Image Upload")).not.toBeInTheDocument();

    expect(screen.queryByText("Alt Text")).not.toBeInTheDocument();
  });

  it("renders image upload and alt text input when panel is open", () => {
    isPanelOpenMock.mockReturnValue(true);

    render(<ImagePanel {...baseProps} />);

    expect(screen.getByText("Image Upload")).toBeInTheDocument();
    expect(screen.getByTestId("drag-drop-upload")).toBeInTheDocument();

    expect(screen.getByText("Alt Text")).toBeInTheDocument();
    expect(screen.getByTestId("altText")).toBeInTheDocument();
    expect(screen.getByTestId("altText")).toHaveValue("Initial alt text");
  });

  it("calls setProperty when alt text input changes", () => {
    isPanelOpenMock.mockReturnValue(true);

    render(<ImagePanel {...baseProps} />);

    const input = screen.getByTestId("altText");

    fireEvent.change(input, {
      target: { value: "New alt text" },
    });

    expect(baseProps.setProperty).toHaveBeenCalledTimes(1);
    expect(baseProps.setProperty).toHaveBeenCalledWith("alt", "New alt text");
  });

  it("renders nothing for unhandled property keys", () => {
    isPanelOpenMock.mockReturnValue(true);

    const propsWithUnknownKey = {
      ...baseProps,
      propertyKeys: ["UnknownProperty" as ComponentProperty],
    };

    const { container } = render(<ImagePanel {...propsWithUnknownKey} />);

    expect(screen.queryByText("Image Upload")).not.toBeInTheDocument();
    expect(screen.queryByText("Alt Text")).not.toBeInTheDocument();
  });

  it("handles empty alt text with fallback to empty string", () => {
    isPanelOpenMock.mockReturnValue(true);

    const propsWithoutAlt = {
      ...baseProps,
      propertyComponent: {
        id: "image-1",
        properties: {},
      },
    };

    render(<ImagePanel {...propsWithoutAlt} />);

    const input = screen.getByTestId("altText");
    expect(input).toHaveValue("");
  });
});
