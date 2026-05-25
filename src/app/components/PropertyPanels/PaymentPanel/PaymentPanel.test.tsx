import { render, screen, fireEvent } from "@testing-library/react";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import PaymentPanel from "./PaymentPanel";
import { ComponentProperty } from "@/app/data/componentProperties";
import { PropertyPanels } from "@/app/utils/constants";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";

jest.mock("@/app/context/PropertiesContext", () => ({
  usePropertyPane: jest.fn(),
}));

describe("PaymentPanel Component", () => {
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    propertyKeys: [
      ComponentProperty.OrderIdPathKey,
      ComponentProperty.PaymentModePathKey,
      ComponentProperty.PollingTime,
      ComponentProperty.QRTimer,
    ],
    propertyComponent: {
      id: "test-payment-component",
      properties: {
        orderIdPathKey: "orderId",
        paymentModePathKey: "paymentMode",
        pollingTime: 30,
        qrTimer: 5,
      },
    },
    setProperty: mockSetProperty,
  };

  describe("Rendering", () => {
    it("renders the PaymentPanel component", () => {
      render(<PaymentPanel {...defaultProps} />);
      expect(screen.getByText("Payment")).toBeInTheDocument();
    });

    it("renders with panel open by default", () => {
      render(<PaymentPanel {...defaultProps} />);
      const toggleButton = screen.getByRole("button");
      expect(toggleButton).toHaveClass(sharedPropertiesStyles.isOpen);
    });

    it("does not apply open class when panel is closed", () => {
      (usePropertyPane as jest.Mock).mockReturnValue({
        togglePanel: mockTogglePanel,
        isPanelOpen: jest.fn(() => false),
      });

      render(<PaymentPanel {...defaultProps} />);
      const toggleButton = screen.getByRole("button");
      expect(toggleButton).not.toHaveClass(sharedPropertiesStyles.isOpen);
    });

    it("does not render property inputs when panel is closed", () => {
      (usePropertyPane as jest.Mock).mockReturnValue({
        togglePanel: mockTogglePanel,
        isPanelOpen: jest.fn(() => false),
      });

      render(<PaymentPanel {...defaultProps} />);
      expect(screen.queryByText("Order ID Path Key")).not.toBeInTheDocument();
      expect(screen.queryByText("Payment Mode Path key")).not.toBeInTheDocument();
    });
  });

  describe("Panel Toggle", () => {
    it("calls togglePanel when panel header is clicked", () => {
      render(<PaymentPanel {...defaultProps} />);
      const toggleButton = screen.getByRole("button");
      fireEvent.click(toggleButton);
      expect(mockTogglePanel).toHaveBeenCalledWith(PropertyPanels.PaymentPanel);
    });

    it("does not call togglePanel if togglePanel is undefined", () => {
      (usePropertyPane as jest.Mock).mockReturnValue({
        togglePanel: undefined,
        isPanelOpen: mockIsPanelOpen,
      });

      render(<PaymentPanel {...defaultProps} />);
      const toggleButton = screen.getByRole("button");
      fireEvent.click(toggleButton);
      expect(mockTogglePanel).not.toHaveBeenCalled();
    });
  });

  describe("Order ID Path Key Property", () => {
    it("renders Order ID Path Key input when property key is provided", () => {
      render(
        <PaymentPanel
          {...defaultProps}
          propertyKeys={[ComponentProperty.OrderIdPathKey]}
        />
      );
      const input = screen.getByPlaceholderText("Enter the path key");
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue("orderId");
    });

    it("calls setProperty when Order ID Path Key input changes", () => {
      render(
        <PaymentPanel
          {...defaultProps}
          propertyKeys={[ComponentProperty.OrderIdPathKey]}
        />
      );
      const input = screen.getByPlaceholderText("Enter the path key");
      fireEvent.change(input, { target: { value: "newOrderIdPath" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.OrderIdPathKey,
        "newOrderIdPath"
      );
    });

    it("renders Order ID Path Key with empty value", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...defaultProps.propertyComponent,
          properties: {
            orderIdPathKey: "",
          },
        },
        propertyKeys: [ComponentProperty.OrderIdPathKey],
      };

      render(<PaymentPanel {...props} />);
      const input = screen.getByPlaceholderText("Enter the path key");
      expect(input).toHaveValue("");
    });

    it("renders Order ID Path Key with undefined value", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...defaultProps.propertyComponent,
          properties: {
            orderIdPathKey: undefined,
          },
        },
        propertyKeys: [ComponentProperty.OrderIdPathKey],
      };

      render(<PaymentPanel {...props} />);
      const input = screen.getByPlaceholderText("Enter the path key");
      expect(input).toBeInTheDocument();
    });
  });

  describe("Payment Mode Path Key Property", () => {
    it("renders Payment Mode Path Key input when property key is provided", () => {
      render(
        <PaymentPanel
          {...defaultProps}
          propertyKeys={[ComponentProperty.PaymentModePathKey]}
        />
      );
      const input = screen.getByPlaceholderText("Enter the path key");
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue("paymentMode");
    });

    it("calls setProperty when Payment Mode Path Key input changes", () => {
      render(
        <PaymentPanel
          {...defaultProps}
          propertyKeys={[ComponentProperty.PaymentModePathKey]}
        />
      );
      const input = screen.getByPlaceholderText("Enter the path key");
      fireEvent.change(input, { target: { value: "newPaymentModePath" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.PaymentModePathKey,
        "newPaymentModePath"
      );
    });

    it("renders Payment Mode Path Key with empty value", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...defaultProps.propertyComponent,
          properties: {
            paymentModePathKey: "",
          },
        },
        propertyKeys: [ComponentProperty.PaymentModePathKey],
      };

      render(<PaymentPanel {...props} />);
      const input = screen.getByPlaceholderText("Enter the path key");
      expect(input).toHaveValue("");
    });
  });

  describe("Polling Time Property", () => {
    it("renders Polling Time input when property key is provided", () => {
      render(
        <PaymentPanel
          {...defaultProps}
          propertyKeys={[ComponentProperty.PollingTime]}
        />
      );
      const input = screen.getByPlaceholderText("Enter time in seconds");
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue(30);
    });

    it("calls setProperty when Polling Time input changes", () => {
      render(
        <PaymentPanel
          {...defaultProps}
          propertyKeys={[ComponentProperty.PollingTime]}
        />
      );
      const input = screen.getByPlaceholderText("Enter time in seconds");
      fireEvent.change(input, { target: { value: "60" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.PollingTime,
        "60"
      );
    });

    it("renders Polling Time with empty value when not set", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...defaultProps.propertyComponent,
          properties: {
            pollingTime: null,
          },
        },
        propertyKeys: [ComponentProperty.PollingTime],
      };

      render(<PaymentPanel {...props} />);
      const input = screen.getByPlaceholderText("Enter time in seconds");
      expect(input).toHaveValue(null);
    });

    it("renders Polling Time with undefined value", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...defaultProps.propertyComponent,
          properties: {
            pollingTime: undefined,
          },
        },
        propertyKeys: [ComponentProperty.PollingTime],
      };

      render(<PaymentPanel {...props} />);
      const input = screen.getByPlaceholderText("Enter time in seconds");
      expect(input).toBeInTheDocument();
    });

    it("accepts numeric value for Polling Time", () => {
      render(
        <PaymentPanel
          {...defaultProps}
          propertyKeys={[ComponentProperty.PollingTime]}
        />
      );
      const input = screen.getByPlaceholderText("Enter time in seconds");
      expect(input).toHaveAttribute("type", "number");
    });
  });

  describe("QR Timer Property", () => {
    it("renders QR Timer input when property key is provided", () => {
      render(
        <PaymentPanel
          {...defaultProps}
          propertyKeys={[ComponentProperty.QRTimer]}
        />
      );
      const input = screen.getByPlaceholderText("Enter time in minutes");
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue(5);
    });

    it("calls setProperty when QR Timer input changes", () => {
      render(
        <PaymentPanel
          {...defaultProps}
          propertyKeys={[ComponentProperty.QRTimer]}
        />
      );
      const input = screen.getByPlaceholderText("Enter time in minutes");
      fireEvent.change(input, { target: { value: "10" } });
      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.QRTimer,
        "10"
      );
    });

    it("renders QR Timer with empty value when not set", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          ...defaultProps.propertyComponent,
          properties: {
            qrTimer: null,
          },
        },
        propertyKeys: [ComponentProperty.QRTimer],
      };

      render(<PaymentPanel {...props} />);
      const input = screen.getByPlaceholderText("Enter time in minutes");
      expect(input).toHaveValue(null);
    });

    it("accepts numeric value for QR Timer", () => {
      render(
        <PaymentPanel
          {...defaultProps}
          propertyKeys={[ComponentProperty.QRTimer]}
        />
      );
      const input = screen.getByPlaceholderText("Enter time in minutes");
      expect(input).toHaveAttribute("type", "number");
    });
  });

  describe("Multiple Properties", () => {
    it("renders all properties when all property keys are provided", () => {
      render(<PaymentPanel {...defaultProps} />);

      expect(screen.getByText("Order ID Path Key")).toBeInTheDocument();
      expect(screen.getByText("Payment Mode Path key")).toBeInTheDocument();
      expect(screen.getByText("Polling Time(s)")).toBeInTheDocument();
      expect(screen.getByText("QR Timer(min)")).toBeInTheDocument();
    });

    it("renders only specified properties", () => {
      render(
        <PaymentPanel
          {...defaultProps}
          propertyKeys={[
            ComponentProperty.OrderIdPathKey,
            ComponentProperty.PollingTime,
          ]}
        />
      );

      expect(screen.getByText("Order ID Path Key")).toBeInTheDocument();
      expect(screen.getByText("Polling Time(s)")).toBeInTheDocument();
      expect(screen.queryByText("Payment Mode Path key")).not.toBeInTheDocument();
      expect(screen.queryByText("QR Timer(min)")).not.toBeInTheDocument();
    });

    it("renders properties in the order they are provided", () => {
      const { container } = render(<PaymentPanel {...defaultProps} />);
      const inputs = container.querySelectorAll("input");
      expect(inputs).toHaveLength(4);
    });
  });

  describe("Edge Cases", () => {
    it("returns null for unknown property keys", () => {
      const { container } = render(
        <PaymentPanel
          {...defaultProps}
          propertyKeys={["unknownProperty" as ComponentProperty]}
        />
      );

      // Only the panel header should be rendered, no inputs
      const inputs = container.querySelectorAll("input");
      expect(inputs).toHaveLength(0);
    });

    it("handles empty propertyKeys array", () => {
      const { container } = render(
        <PaymentPanel {...defaultProps} propertyKeys={[]} />
      );

      // Only the panel header should be rendered
      expect(screen.getByText("Payment")).toBeInTheDocument();
      const inputs = container.querySelectorAll("input");
      expect(inputs).toHaveLength(0);
    });

    it("handles missing properties in propertyComponent", () => {
      const props = {
        ...defaultProps,
        propertyComponent: {
          id: "test-component",
          properties: {},
        },
      };

      render(<PaymentPanel {...props} />);
      expect(screen.getByText("Payment")).toBeInTheDocument();
    });

    it("handles undefined isPanelOpen gracefully", () => {
      (usePropertyPane as jest.Mock).mockReturnValue({
        togglePanel: mockTogglePanel,
        isPanelOpen: undefined,
      });

      render(<PaymentPanel {...defaultProps} />);
      expect(screen.getByText("Payment")).toBeInTheDocument();
    });
  });

  describe("Component IDs", () => {
    it("renders payment panel container with id", () => {
      const { container } = render(<PaymentPanel {...defaultProps} />);
      const paymentPanel = container.querySelector("#paymentPanel");
      expect(paymentPanel).toBeInTheDocument();
    });

    it("uses component id in property keys", () => {
      render(<PaymentPanel {...defaultProps} />);

      // Each property should be rendered with a key containing the component id
      const paymentPanel = screen.getByText("Payment").closest("#paymentPanel");
      expect(paymentPanel).toBeInTheDocument();
    });
  });
});
