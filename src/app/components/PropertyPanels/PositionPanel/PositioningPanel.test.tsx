import { render, screen, fireEvent } from "@testing-library/react";
import PositioningPanel from "./PositioningPanel";
import { ComponentProperty } from "../../../data/componentProperties";
import { PropertyPanels } from "../../../utils/constants";

const mockTogglePanel = jest.fn();
const mockIsPanelOpen = jest.fn();

jest.mock("@/app/context/PropertiesContext", () => ({
  usePropertyPane: () => ({
    togglePanel: mockTogglePanel,
    isPanelOpen: (panel: string) => mockIsPanelOpen(panel),
  }),
}));

describe("PositioningPanel", () => {
  const mockSetProperty = jest.fn();
  const mockSetProperties = jest.fn();

  const defaultProps = {
    propertyKeys: [
      ComponentProperty.IsSticky,
      ComponentProperty.PinTo,
      ComponentProperty.Offset,
    ],
    propertyComponent: {
      id: "comp-1",
      properties: {
        isSticky: true,
        pinTo: "top",
        offset: "50px",
      },
    },
    setProperty: mockSetProperty,
    setProperties: mockSetProperties,
  };

  beforeEach(() => {
    mockSetProperty.mockClear();
    mockSetProperties.mockClear();
    mockIsPanelOpen.mockReturnValue(true);
  });

  it("renders the LayoutPanel and toggle button", () => {
    render(<PositioningPanel {...defaultProps} />);
    expect(screen.getByText("Positioning")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Positioning/i })
    ).toBeInTheDocument();
  });

  test("updates 'isSticky' property when checkbox is clicked", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          isSticky: false,
        },
      },
    };
    render(<PositioningPanel {...props} />);
    const checkbox = screen.getByTestId("isSticky") as HTMLInputElement;

    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);

    expect(mockSetProperty).toHaveBeenCalledWith("isSticky", true);
  });

  test("updates 'pinTo' property when a new option is selected", () => {
    render(<PositioningPanel {...defaultProps} />);
    const select = screen.getByTestId("pinTo");

    fireEvent.change(select, { target: { value: "Bottom" } });

    expect(mockSetProperty).toHaveBeenCalledWith("pinTo", "Bottom");
  });

  test("updates 'offset' property when input value changes", () => {
    render(<PositioningPanel {...defaultProps} />);
    const input = screen.getByTestId("name");

    fireEvent.change(input, { target: { value: "100px" } });

    expect(mockSetProperty).toHaveBeenCalledWith("offset", "100px");
  });

  test("does not render PinTo or Offset when 'isSticky' is false", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        ...defaultProps.propertyComponent,
        properties: {
          ...defaultProps.propertyComponent.properties,
          isSticky: false,
        },
      },
    };

    render(<PositioningPanel {...props} />);
    expect(screen.queryByTestId("pinTo")).not.toBeInTheDocument();
    expect(screen.queryByTestId("name")).not.toBeInTheDocument();
  });

  test("renders PinTo and Offset when 'isSticky' is true", () => {
    render(<PositioningPanel {...defaultProps} />);
    expect(screen.getByTestId("pinTo")).toBeInTheDocument();
    expect(screen.getByTestId("name")).toBeInTheDocument();
  });

  test("calls togglePanel when toggle button is clicked", () => {
    render(<PositioningPanel {...defaultProps} />);
    const toggleBtn = screen.getByTestId("toggleButton");
    fireEvent.click(toggleBtn);

    expect(mockTogglePanel).toHaveBeenCalledWith(
      PropertyPanels.PositioningPanel
    );
  });

  test("renders Positioning panel and toggle button", () => {
    render(<PositioningPanel {...defaultProps} />);
    expect(screen.getByTestId("toggleButton")).toBeInTheDocument();
    expect(screen.getByText("Positioning")).toBeInTheDocument();
  });

  test("does not add isOpen class when panel is closed", () => {
    mockIsPanelOpen.mockReturnValue(false);
    render(<PositioningPanel {...defaultProps} />);
    const toggleBtn = screen.getByTestId("toggleButton");
    expect(toggleBtn).not.toHaveClass("isOpen");
  });

  test("renders with undefined properties uses default values", () => {
    mockIsPanelOpen.mockReturnValue(true);
    const props = {
      ...defaultProps,
      propertyComponent: {
        id: "comp-1",
        properties: undefined,
      },
    };
    render(<PositioningPanel {...props} />);
    const checkbox = screen.getByTestId("isSticky") as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  test("renders with null pinTo and offset uses default values", () => {
    const props = {
      ...defaultProps,
      propertyComponent: {
        id: "comp-1",
        properties: {
          isSticky: true,
          pinTo: undefined,
          offset: undefined,
        },
      },
    };
    render(<PositioningPanel {...props} />);
    const select = screen.getByTestId("pinTo") as HTMLSelectElement;
    expect(select.value).toBe("none");
    const input = screen.getByTestId("name") as HTMLInputElement;
    expect(input.value).toBe("");
  });
});
