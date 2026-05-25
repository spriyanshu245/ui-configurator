import { render, screen, fireEvent } from "@testing-library/react";
import IntegrationPanel from "./IntegrationPanel";
import { ComponentProperty } from "@/app/data/componentProperties";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import { PropertyPanels } from "@/app/utils/constants";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";

jest.mock("@/app/context/PropertiesContext", () => ({
  usePropertyPane: jest.fn(),
}));

const mockTogglePanel = jest.fn();
const mockIsPanelOpen = jest.fn(() => true);
const mockSetProperty = jest.fn();

describe("IntegrationPanel", () => {
  const baseProps = {
    propertyKeys: [
      ComponentProperty.SelectedService,
      ComponentProperty.InitiateUrl,
      ComponentProperty.InitiateApiName,
    ],
    propertyComponent: {
      id: "ext-1",
      properties: {
        selectedService: "kyc-verification",
        initiateUrl: "https://init.example.com",
        initiateApiName: "initiate",
        initiateMethod: "POST",
        initiateHeaders: "{}",
        initiateResponseKeys: "id,status",
        submitUrl: "https://submit.example.com",
        submitApiName: "submit",
        submitMethod: "POST",
        submitHeaders: "{}",
        responseKeys: "id,status",
        fileUploadUrl: "https://upload.example.com",
        storeDataInSession: true,
      },
    },
    setProperty: mockSetProperty,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsPanelOpen.mockReturnValue(true);
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: mockTogglePanel,
      isPanelOpen: mockIsPanelOpen,
    });
  });

  it("renders heading and applies open class when panel is open", () => {
    render(<IntegrationPanel {...baseProps} />);
    expect(screen.getByText("Integration")).toBeInTheDocument();
    const toggleButton = screen.getByRole("button", { name: /Integration/i });
    expect(toggleButton).toHaveClass(sharedPropertiesStyles.isOpen);
  });

  it("calls togglePanel on header click", () => {
    render(<IntegrationPanel {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Integration/i }));
    expect(mockTogglePanel).toHaveBeenCalledWith(
      PropertyPanels.IntegrationPanel
    );
  });

  it("renders KYC fields when kyc-verification is selected", () => {
    render(<IntegrationPanel {...baseProps} />);

    expect(screen.getByLabelText("Store data in session")).toBeInTheDocument();
    expect(screen.getByText("Initiate URL")).toBeInTheDocument();
    expect(screen.getByText("API Name")).toBeInTheDocument();
    expect(screen.getByText("Initiate Method")).toBeInTheDocument();
    expect(screen.getByText("Response Keys")).toBeInTheDocument();
    expect(screen.getByText("Submit URL")).toBeInTheDocument();
    expect(screen.getByText("Submit API Name")).toBeInTheDocument();
  });

  it("renders Account Aggregator fields when selected", () => {
    const props = {
      ...baseProps,
      propertyComponent: {
        ...baseProps.propertyComponent,
        properties: {
          ...baseProps.propertyComponent.properties,
          selectedService: "account-aggregator",
        },
      },
    };

    render(<IntegrationPanel {...props} />);

    expect(screen.getByText("Initiate URL")).toBeInTheDocument();
    expect(screen.getByText("Response Keys")).toBeInTheDocument();
    expect(screen.queryByText("Submit URL")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Store data in session")).toBeInTheDocument();
  });

  it("renders Offline KYC fields when selected", () => {
    const props = {
      ...baseProps,
      propertyComponent: {
        ...baseProps.propertyComponent,
        properties: {
          ...baseProps.propertyComponent.properties,
          selectedService: "offline-kyc-verification",
        },
      },
    };

    render(<IntegrationPanel {...props} />);

    expect(screen.getByText("Submit URL")).toBeInTheDocument();
    expect(screen.getByLabelText("Store data in session")).toBeInTheDocument();
    expect(screen.queryByText("File Upload URL")).not.toBeInTheDocument();
  });

  it("updates selected service on change", () => {
    render(<IntegrationPanel {...baseProps} />);
    const select = screen.getByTestId("selectedService") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "account-aggregator" } });
    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.SelectedService,
      "account-aggregator"
    );
  });

  it("renders null when selectedService is not recognized", () => {
    const props = {
      ...baseProps,
      propertyComponent: {
        ...baseProps.propertyComponent,
        properties: {
          ...baseProps.propertyComponent.properties,
          selectedService: "unknown-service",
        },
      },
    };

    render(<IntegrationPanel {...props} />);

    expect(screen.queryByText("Initiate URL")).not.toBeInTheDocument();
    expect(screen.queryByText("Submit URL")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Store data in session")
    ).not.toBeInTheDocument();
  });

  it("does not apply isOpen class when panel is closed", () => {
    mockIsPanelOpen.mockReturnValue(false);

    render(<IntegrationPanel {...baseProps} />);

    const toggleButton = screen.getByRole("button", { name: /Integration/i });
    expect(toggleButton).not.toHaveClass(sharedPropertiesStyles.isOpen);
  });

  it("does not render service fields when panel is closed", () => {
    mockIsPanelOpen.mockReturnValue(false);

    render(<IntegrationPanel {...baseProps} />);

    expect(screen.queryByTestId("selectedService")).not.toBeInTheDocument();
    expect(screen.queryByText("Initiate URL")).not.toBeInTheDocument();
  });

  it("calls setProperty when text field value changes", () => {
    render(<IntegrationPanel {...baseProps} />);

    const initiateUrlInput = screen.getByTestId("initiateUrl");
    fireEvent.change(initiateUrlInput, {
      target: { value: "https://new-url.com" },
    });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.InitiateUrl,
      "https://new-url.com"
    );
  });

  it("calls setProperty when checkbox value changes", () => {
    render(<IntegrationPanel {...baseProps} />);

    const checkbox = screen.getByLabelText("Store data in session");
    fireEvent.click(checkbox);

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.StoreDataInSession,
      expect.any(Boolean)
    );
  });

  it("calls setProperty when method dropdown changes", () => {
    render(<IntegrationPanel {...baseProps} />);

    const methodSelect = screen.getByTestId("initiateMethod");
    fireEvent.change(methodSelect, { target: { value: "GET" } });

    expect(mockSetProperty).toHaveBeenCalledWith(
      ComponentProperty.InitiateMethod,
      "GET"
    );
  });

  describe("Request Body Type and Specs", () => {
    it("renders Request Body Type field for account-aggregator", () => {
      const props = {
        ...baseProps,
        propertyComponent: {
          ...baseProps.propertyComponent,
          properties: {
            ...baseProps.propertyComponent.properties,
            selectedService: "account-aggregator",
            initiateMethod: "POST",
            requestBodyType: "flat",
          },
        },
      };

      render(<IntegrationPanel {...props} />);

      expect(screen.getByText("Request Body Type")).toBeInTheDocument();
      const select = screen.getByTestId("requestBodyType") as HTMLSelectElement;
      expect(select).toBeInTheDocument();
      expect(select.value).toBe("flat");
    });

    it("does not render Request Body Type when initiateMethod is GET", () => {
      const props = {
        ...baseProps,
        propertyComponent: {
          ...baseProps.propertyComponent,
          properties: {
            ...baseProps.propertyComponent.properties,
            selectedService: "account-aggregator",
            initiateMethod: "GET",
          },
        },
      };

      render(<IntegrationPanel {...props} />);

      expect(screen.queryByText("Request Body Type")).not.toBeInTheDocument();
      expect(screen.queryByTestId("requestBodyType")).not.toBeInTheDocument();
    });

    it("does not render Request Body Specs when initiateMethod is GET", () => {
      const props = {
        ...baseProps,
        propertyComponent: {
          ...baseProps.propertyComponent,
          properties: {
            ...baseProps.propertyComponent.properties,
            selectedService: "account-aggregator",
            initiateMethod: "GET",
            requestBodyType: "custom",
          },
        },
      };

      render(<IntegrationPanel {...props} />);

      expect(screen.queryByText("Request Body Specs")).not.toBeInTheDocument();
      expect(screen.queryByTestId("requestBodySpecs")).not.toBeInTheDocument();
    });

    it("renders Request Body Specs when requestBodyType is not flat", () => {
      const props = {
        ...baseProps,
        propertyComponent: {
          ...baseProps.propertyComponent,
          properties: {
            ...baseProps.propertyComponent.properties,
            selectedService: "account-aggregator",
            requestBodyType: "custom",
            requestBodySpecs: '{"amount": "$amount"}',
          },
        },
      };

      render(<IntegrationPanel {...props} />);

      expect(screen.getByText("Request Body Specs")).toBeInTheDocument();
      expect(screen.getByTestId("requestBodySpecs")).toBeInTheDocument();
    });

    it("does not render Request Body Specs when requestBodyType is flat", () => {
      const props = {
        ...baseProps,
        propertyComponent: {
          ...baseProps.propertyComponent,
          properties: {
            ...baseProps.propertyComponent.properties,
            selectedService: "account-aggregator",
            requestBodyType: "flat",
          },
        },
      };

      render(<IntegrationPanel {...props} />);

      expect(screen.queryByText("Request Body Specs")).not.toBeInTheDocument();
      expect(screen.queryByTestId("requestBodySpecs")).not.toBeInTheDocument();
    });

    it("calls setProperty when Request Body Type changes", () => {
      const props = {
        ...baseProps,
        propertyComponent: {
          ...baseProps.propertyComponent,
          properties: {
            ...baseProps.propertyComponent.properties,
            selectedService: "account-aggregator",
            requestBodyType: "flat",
          },
        },
      };

      render(<IntegrationPanel {...props} />);

      const select = screen.getByTestId("requestBodyType") as HTMLSelectElement;
      fireEvent.change(select, { target: { value: "custom" } });

      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.RequestBodyType,
        "custom"
      );
    });

    it("calls setProperty when Request Body Specs value changes", () => {
      const props = {
        ...baseProps,
        propertyComponent: {
          ...baseProps.propertyComponent,
          properties: {
            ...baseProps.propertyComponent.properties,
            selectedService: "account-aggregator",
            requestBodyType: "custom",
            requestBodySpecs: '{"key": "value"}',
          },
        },
      };

      render(<IntegrationPanel {...props} />);

      const textarea = screen.getByTestId("requestBodySpecs");
      fireEvent.change(textarea, {
        target: { value: '{"amount": "$amount"}' },
      });

      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.RequestBodySpecs,
        '{"amount": "$amount"}'
      );
    });

    it("displays helper text for Request Body Specs", () => {
      const props = {
        ...baseProps,
        propertyComponent: {
          ...baseProps.propertyComponent,
          properties: {
            ...baseProps.propertyComponent.properties,
            selectedService: "account-aggregator",
            requestBodyType: "custom",
          },
        },
      };

      render(<IntegrationPanel {...props} />);

      expect(screen.getByText(/Example JSON Mapping:/i)).toBeInTheDocument();
    });
  });
});
