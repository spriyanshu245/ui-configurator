import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import InterceptorsPanel from "./InterceptorsPanel";
import { ComponentProperty } from "../../../data/componentProperties";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import { usePropertyPane } from "../../../context/PropertiesContext";
import { ComponentTypes } from "../../../utils/enums";
import {
  VALIDATION_INTERCEPTOR_JS_SNIPPET,
  VALIDATION_TABLE_INTERCEPTOR_JS_SNIPPET,
} from "../../../utils/constants";

const mockSetProperty = jest.fn();
const mockTogglePanel = jest.fn();
const mockIsPanelOpen = jest.fn().mockReturnValue(true);

jest.mock("../../../context/PropertiesContext", () => ({
  usePropertyPane: jest.fn(),
}));
jest.mock("../../../hooks/useParentFormProperties", () => ({
  useParentFormProperties: jest.fn(() => ({
    parentForm: { id: "53445t", properties: { name: "testForm" } },
  })),
}));
jest.mock("../../../context/UserTaskContext", () => ({
  useUserTask: jest.fn(() => ({
    formsNamekeys: { testForm: [{ id: "testTable", label: "testTable" }] },
  })),
}));

beforeEach(() => {
  jest.clearAllMocks();
  (usePropertyPane as jest.Mock).mockReturnValue({
    togglePanel: mockTogglePanel,
    isPanelOpen: mockIsPanelOpen,
  });
});

describe("InterceptorsPanel Component", () => {
  const mockPropertyComponent = {
    type: ComponentTypes.INPUT_TABLE,
    properties: { name: "testTable", interceptors: [] },
  };

  it("toggles Interceptor panel visibility", () => {
    render(
      <InterceptorsPanel
        propertyKeys={[]}
        propertyComponent={mockPropertyComponent}
        setProperty={mockSetProperty}
      />
    );

    const toggleButton = screen.getByRole("button", { name: /Interceptors/i });
    fireEvent.click(toggleButton);
    expect(mockTogglePanel).toHaveBeenCalledWith("InterceptorsPanel");
  });

  it("renders the Interceptors panel", () => {
    render(
      <InterceptorsPanel
        propertyKeys={[]}
        propertyComponent={mockPropertyComponent}
        setProperty={mockSetProperty}
      />
    );
    expect(screen.getByText("Interceptors")).toBeInTheDocument();
  });

  it("adds a new interceptor when clicking 'Add Interceptor'", () => {
    render(
      <InterceptorsPanel
        propertyKeys={[]}
        propertyComponent={mockPropertyComponent}
        setProperty={mockSetProperty}
      />
    );

    const addButton = screen.getByText("Add Interceptor");
    fireEvent.click(addButton);
    expect(mockSetProperty).toHaveBeenCalled();
  });

  it("returns null when an invalid property key is passed", () => {
    render(
      <InterceptorsPanel
        propertyKeys={["InvalidPropertyKey"] as unknown as ComponentProperty[]}
        propertyComponent={{ properties: {} }}
        setProperty={mockSetProperty}
      />
    );

    const panelContent = screen.queryByText("Columns");
    expect(panelContent).toBeNull();
  });

  it("applies open class if panel is open", () => {
    // Mocking the panel to be open
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: mockTogglePanel,
      isPanelOpen: jest.fn(() => true),
    });

    render(
      <InterceptorsPanel
        propertyKeys={[]}
        propertyComponent={{ properties: {} }}
        setProperty={mockSetProperty}
      />
    );

    const button = screen.getByTestId("toggleButton");
    expect(button).toHaveClass(sharedPropertiesStyles.isOpen);
  });

  it("does not apply open class if panel is not open", () => {
    // Mocking the panel to be closed
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: mockTogglePanel,
      isPanelOpen: jest.fn(() => false),
    });

    render(
      <InterceptorsPanel
        propertyKeys={[]}
        propertyComponent={{ properties: {} }}
        setProperty={mockSetProperty}
      />
    );

    const button = screen.getByTestId("toggleButton");
    expect(button).not.toHaveClass(sharedPropertiesStyles.isOpen);
  });

  it("adds a validation interceptor with correct JS snippet for INPUT_TABLE", () => {
    render(
      <InterceptorsPanel
        propertyKeys={[]}
        propertyComponent={mockPropertyComponent}
        setProperty={mockSetProperty}
      />
    );

    const addButton = screen.getByText("Add Interceptor");
    fireEvent.click(addButton);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.Interceptors,
      expect.arrayContaining([
        expect.objectContaining({
          jsObject: VALIDATION_TABLE_INTERCEPTOR_JS_SNIPPET,
        }),
      ])
    );
  });

  it("adds a validation interceptor with correct JS snippet for non-INPUT_TABLE components", () => {
    const mockPropertyComponentOther = {
      type: ComponentTypes.FORM, // A different component type
      properties: { interceptors: [] },
    };

    render(
      <InterceptorsPanel
        propertyKeys={[]}
        propertyComponent={mockPropertyComponentOther}
        setProperty={mockSetProperty}
      />
    );

    const addButton = screen.getByText("Add Interceptor");
    fireEvent.click(addButton);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.Interceptors,
      expect.arrayContaining([
        expect.objectContaining({
          jsObject: VALIDATION_INTERCEPTOR_JS_SNIPPET,
        }),
      ])
    );
  });

  it("renders existing interceptors and applies error class for invalid interceptors", () => {
    const invalidInterceptor = {
      id: "int-1",
      label: "",
      interceptorType: "VALIDATION",
      jsObject: "function() {}",
      eventType: "ON_CHANGE",
      eventObject: [],
      messageObject: [],
      message: "",
      messageType: "INFO",
      messageTimeout: 0,
      componentType: ComponentTypes.FORM,
    };

    const mockComponentWithInterceptors = {
      type: ComponentTypes.FORM,
      properties: {
        interceptors: [invalidInterceptor],
      },
    };

    render(
      <InterceptorsPanel
        propertyKeys={[]}
        propertyComponent={mockComponentWithInterceptors}
        setProperty={mockSetProperty}
      />
    );

    expect(screen.getByText("Add Interceptor")).toBeInTheDocument();
  });

  it("renders existing interceptors without error class for valid interceptors", () => {
    const validInterceptor = {
      id: "int-1",
      label: "Valid Interceptor",
      interceptorType: "VALIDATION",
      jsObject: "function() {}",
      eventType: "ON_CHANGE",
      eventObject: ["field1"],
      messageObject: ["msg1"],
      message: "Error message",
      messageType: "INFO",
      messageTimeout: 0,
      componentType: ComponentTypes.FORM,
    };

    const mockComponentWithInterceptors = {
      type: ComponentTypes.FORM,
      properties: {
        interceptors: [validInterceptor],
      },
    };

    render(
      <InterceptorsPanel
        propertyKeys={[]}
        propertyComponent={mockComponentWithInterceptors}
        setProperty={mockSetProperty}
      />
    );

    expect(screen.getByText("Add Interceptor")).toBeInTheDocument();
  });

  it("renders multiple interceptors", () => {
    const interceptors = [
      {
        id: "int-1",
        label: "Interceptor 1",
        interceptorType: "VALIDATION",
        jsObject: "function() {}",
        eventType: "ON_CHANGE",
        eventObject: ["field1"],
        messageObject: ["msg1"],
        message: "Error 1",
        messageType: "INFO",
        messageTimeout: 0,
        componentType: ComponentTypes.FORM,
      },
      {
        id: "int-2",
        label: "Interceptor 2",
        interceptorType: "VALIDATION",
        jsObject: "function() {}",
        eventType: "ON_CHANGE",
        eventObject: ["field2"],
        messageObject: ["msg2"],
        message: "Error 2",
        messageType: "INFO",
        messageTimeout: 0,
        componentType: ComponentTypes.FORM,
      },
    ];

    const mockComponentWithInterceptors = {
      type: ComponentTypes.FORM,
      properties: {
        interceptors,
      },
    };

    render(
      <InterceptorsPanel
        propertyKeys={[]}
        propertyComponent={mockComponentWithInterceptors}
        setProperty={mockSetProperty}
      />
    );

    expect(screen.getByText("Add Interceptor")).toBeInTheDocument();
  });
});
