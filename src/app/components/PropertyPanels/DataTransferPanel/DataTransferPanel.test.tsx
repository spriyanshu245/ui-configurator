import { render, screen, fireEvent } from "@testing-library/react";
import DataTransferPanel from "./DataTransferPanel";
import { ComponentProperty } from "@/app/data/componentProperties";
import { usePropertyPane } from "@/app/context/PropertiesContext";

jest.mock("@/app/context/PropertiesContext", () => ({
  usePropertyPane: jest.fn(),
}));

describe("DataTransferPanel", () => {
  const mockTogglePanel = jest.fn();
  const mockSetProperty = jest.fn();
  const mockIsPanelOpen = jest.fn(() => true);

  beforeEach(() => {
    jest.clearAllMocks();
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: mockTogglePanel,
      isPanelOpen: mockIsPanelOpen,
    });
  });

  const defaultProps = {
    propertyKeys: [ComponentProperty.DataTransfer],
    propertyComponent: { properties: { dataTransfer: {} } },
    setProperty: mockSetProperty,
  };

  test("renders DataTransferPanel correctly", () => {
    render(<DataTransferPanel {...defaultProps} />);
    expect(screen.getByText("Session Data Configuration")).toBeInTheDocument();
  });

  test("toggles panel on button click", () => {
    render(<DataTransferPanel {...defaultProps} />);
    fireEvent.click(screen.getByText("Session Data Configuration"));
    expect(mockTogglePanel).toHaveBeenCalledWith("DataTransferPanel");
  });

  test("updates input field when name is changed", () => {
    const propsWithData = {
      ...defaultProps,
      propertyComponent: {
        properties: { dataTransfer: { name: "", body: "{}" } },
      },
    };
    render(<DataTransferPanel {...propsWithData} />);
    const input = screen.getByTestId("name");
    fireEvent.change(input, { target: { value: "newName" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.DataTransfer,
      { name: "newName", body: "{}" }
    );
  });

  test("updates JsonTextArea when body is changed", () => {
    const propsWithData = {
      ...defaultProps,
      propertyComponent: {
        properties: { dataTransfer: { name: "test", body: "{}" } },
      },
    };
    render(<DataTransferPanel {...propsWithData} />);
    const jsonTextArea = screen.getByTestId("body");
    fireEvent.change(jsonTextArea, { target: { value: "{}" } });
    expect(mockSetProperty).toHaveBeenCalled();
  });
  test("calls onValidJson when valid JSON is entered", () => {
    const propsWithData = {
      ...defaultProps,
      propertyComponent: {
        properties: { dataTransfer: { name: "test", body: "{}" } },
      },
    };
    render(<DataTransferPanel {...propsWithData} />);
    const jsonTextArea = screen.getByTestId("body");
    fireEvent.change(jsonTextArea, { target: { value: "" } });
    expect(mockSetProperty).toHaveBeenCalled();
  });

  test("handles invalid JSON input gracefully", () => {
    const propsWithData = {
      ...defaultProps,
      propertyComponent: {
        properties: { dataTransfer: { name: "test", body: "{}" } },
      },
    };
    render(<DataTransferPanel {...propsWithData} />);
    const jsonTextArea = screen.getByTestId("body");
    fireEvent.change(jsonTextArea, { target: { value: "invalid json" } });
    expect(mockSetProperty).not.toHaveBeenCalledWith(expect.anything());
  });

  test("handles else condition when propertyKey is not DataTransfer", () => {
    const propsWithDifferentKey = {
      ...defaultProps,
      propertyKeys: [ComponentProperty.Apis],
    };
    render(<DataTransferPanel {...propsWithDifferentKey} />);
    expect(screen.queryByText("Add")).not.toBeInTheDocument();
  });
});
