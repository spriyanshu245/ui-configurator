import { render, screen, fireEvent } from "@testing-library/react";
import StepperPanel from "./StepperPanel";
import { ComponentProperty } from "@/app/data/componentProperties";
import { PropertyPanels } from "@/app/utils/constants";
import { usePropertyPane } from "@/app/context/PropertiesContext";

jest.mock("@/app/context/PropertiesContext", () => ({
  usePropertyPane: jest.fn(),
}));

jest.mock("@/app/components/SVGIcons/ChevronDown", () => ({
  __esModule: true,
  default: () => <span data-testid="chevron-icon" />,
}));

const ALL_STEPPER_KEYS = [
  ComponentProperty.StepperPathToData,
  ComponentProperty.StatusKey,
  ComponentProperty.WaitValue,
  ComponentProperty.CurrentValue,
  ComponentProperty.CompletedValue,
  ComponentProperty.TitleKey,
  ComponentProperty.DescriptionKey,
];

const baseComponent = (propsOverride: Record<string, unknown> = {}) => ({
  id: "stepper-comp",
  type: "stepper",
  properties: {
    stepperPathToData: "data.steps",
    statusKey: "status",
    waitValue: "Wait",
    currentValue: "Current",
    completedValue: "Completed",
    titleKey: "title",
    descriptionKey: "description",
    ...propsOverride,
  },
});

describe("StepperPanel", () => {
  const mockTogglePanel = jest.fn();
  const mockIsPanelOpen = jest.fn();
  const mockSetProperty = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (usePropertyPane as jest.Mock).mockReturnValue({
      togglePanel: mockTogglePanel,
      isPanelOpen: mockIsPanelOpen,
    });
    mockIsPanelOpen.mockReturnValue(true);
  });

  describe("section visibility", () => {
    it("renders Stepper Configuration section when stepper keys are present", () => {
      render(
        <StepperPanel
          propertyKeys={ALL_STEPPER_KEYS}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      expect(screen.getByText("Stepper Configuration")).toBeInTheDocument();
    });

    it("does not render Stepper Configuration section when no stepper keys provided", () => {
      render(
        <StepperPanel
          propertyKeys={[]}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      expect(
        screen.queryByText("Stepper Configuration"),
      ).not.toBeInTheDocument();
    });

    it("renders Stepper Configuration section with subset of stepper keys", () => {
      render(
        <StepperPanel
          propertyKeys={[
            ComponentProperty.StepperPathToData,
            ComponentProperty.StatusKey,
          ]}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      expect(screen.getByText("Stepper Configuration")).toBeInTheDocument();
    });
  });

  describe("panel toggle", () => {
    it("calls togglePanel with StepperMappingPanel when Stepper Configuration button is clicked", () => {
      render(
        <StepperPanel
          propertyKeys={ALL_STEPPER_KEYS}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      fireEvent.click(
        screen.getByText("Stepper Configuration").closest("button"),
      );
      expect(mockTogglePanel).toHaveBeenCalledWith(
        PropertyPanels.StepperMappingPanel,
      );
    });

    it("does not render content when isPanelOpen returns false", () => {
      mockIsPanelOpen.mockReturnValue(false);

      render(
        <StepperPanel
          propertyKeys={ALL_STEPPER_KEYS}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      expect(screen.getByText("Stepper Configuration")).toBeInTheDocument();
      expect(
        screen.queryByTestId("stepper-comp-stepperPathToData"),
      ).not.toBeInTheDocument();
    });

    it("does not crash when togglePanel is undefined", () => {
      (usePropertyPane as jest.Mock).mockReturnValue({
        togglePanel: undefined,
        isPanelOpen: mockIsPanelOpen,
      });

      render(
        <StepperPanel
          propertyKeys={ALL_STEPPER_KEYS}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      const button = screen
        .getByText("Stepper Configuration")
        .closest("button");
      expect(() => fireEvent.click(button)).not.toThrow();
    });

    it("does not crash when isPanelOpen is undefined", () => {
      (usePropertyPane as jest.Mock).mockReturnValue({
        togglePanel: mockTogglePanel,
        isPanelOpen: undefined,
      });

      expect(() =>
        render(
          <StepperPanel
            propertyKeys={ALL_STEPPER_KEYS}
            propertyComponent={baseComponent()}
            setProperty={mockSetProperty}
          />,
        ),
      ).not.toThrow();
    });

    it("renders with isOpen class when panel is open", () => {
      mockIsPanelOpen.mockReturnValue(true);

      render(
        <StepperPanel
          propertyKeys={ALL_STEPPER_KEYS}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      const button = screen
        .getByText("Stepper Configuration")
        .closest("button");
      expect(button).toHaveClass("isOpen");
    });

    it("does not render with isOpen class when panel is closed", () => {
      mockIsPanelOpen.mockReturnValue(false);

      render(
        <StepperPanel
          propertyKeys={ALL_STEPPER_KEYS}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      const button = screen
        .getByText("Stepper Configuration")
        .closest("button");
      expect(button).not.toHaveClass("isOpen");
    });
  });

  describe("StepperPathToData property", () => {
    it("renders stepperPathToData input when property key is present", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.StepperPathToData]}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      expect(
        screen.getByTestId("stepper-comp-stepperPathToData"),
      ).toBeInTheDocument();
    });

    it("displays correct value for stepperPathToData", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.StepperPathToData]}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      const input = screen.getByTestId("stepper-comp-stepperPathToData");
      expect(input.value).toBe("data.steps");
    });

    it("calls setProperty when stepperPathToData is changed", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.StepperPathToData]}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      const input = screen.getByTestId("stepper-comp-stepperPathToData");
      fireEvent.change(input, { target: { value: "response.data.items" } });

      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.StepperPathToData,
        "response.data.items",
      );
    });

    it("displays empty string when stepperPathToData is undefined", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.StepperPathToData]}
          propertyComponent={baseComponent({ stepperPathToData: undefined })}
          setProperty={mockSetProperty}
        />,
      );

      const input = screen.getByTestId("stepper-comp-stepperPathToData");
      expect(input.value).toBe("");
    });

    it("does not render stepperPathToData when property key is not present", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.StatusKey]}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      expect(
        screen.queryByTestId("stepper-comp-stepperPathToData"),
      ).not.toBeInTheDocument();
    });
  });

  describe("StatusKey property", () => {
    it("renders statusKey input when property key is present", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.StatusKey]}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      expect(screen.getByTestId("stepper-comp-statusKey")).toBeInTheDocument();
    });

    it("displays correct value for statusKey", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.StatusKey]}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      const input = screen.getByTestId("stepper-comp-statusKey");
      expect(input.value).toBe("status");
    });

    it("calls setProperty when statusKey is changed", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.StatusKey]}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      const input = screen.getByTestId("stepper-comp-statusKey");
      fireEvent.change(input, { target: { value: "state" } });

      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.StatusKey,
        "state",
      );
    });

    it("displays empty string when statusKey is undefined", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.StatusKey]}
          propertyComponent={baseComponent({ statusKey: undefined })}
          setProperty={mockSetProperty}
        />,
      );

      const input = screen.getByTestId("stepper-comp-statusKey");
      expect(input.value).toBe("");
    });

    it("does not render statusKey when property key is not present", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.StepperPathToData]}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      expect(
        screen.queryByTestId("stepper-comp-statusKey"),
      ).not.toBeInTheDocument();
    });
  });

  describe("WaitValue property", () => {
    it("renders waitValue input when property key is present", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.WaitValue]}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      expect(screen.getByTestId("stepper-comp-waitValue")).toBeInTheDocument();
    });

    it("displays correct value for waitValue", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.WaitValue]}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      const input = screen.getByTestId("stepper-comp-waitValue");
      expect(input.value).toBe("Wait");
    });

    it("calls setProperty when waitValue is changed", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.WaitValue]}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      const input = screen.getByTestId("stepper-comp-waitValue");
      fireEvent.change(input, { target: { value: "Pending" } });

      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.WaitValue,
        "Pending",
      );
    });

    it("displays empty string when waitValue is undefined", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.WaitValue]}
          propertyComponent={baseComponent({ waitValue: undefined })}
          setProperty={mockSetProperty}
        />,
      );

      const input = screen.getByTestId("stepper-comp-waitValue");
      expect(input.value).toBe("");
    });

    it("does not render waitValue when property key is not present", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.StepperPathToData]}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      expect(
        screen.queryByTestId("stepper-comp-waitValue"),
      ).not.toBeInTheDocument();
    });
  });

  describe("CurrentValue property", () => {
    it("renders currentValue input when property key is present", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.CurrentValue]}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      expect(
        screen.getByTestId("stepper-comp-currentValue"),
      ).toBeInTheDocument();
    });

    it("displays correct value for currentValue", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.CurrentValue]}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      const input = screen.getByTestId("stepper-comp-currentValue");
      expect(input.value).toBe("Current");
    });

    it("calls setProperty when currentValue is changed", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.CurrentValue]}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      const input = screen.getByTestId("stepper-comp-currentValue");
      fireEvent.change(input, { target: { value: "Active" } });

      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.CurrentValue,
        "Active",
      );
    });

    it("displays empty string when currentValue is undefined", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.CurrentValue]}
          propertyComponent={baseComponent({ currentValue: undefined })}
          setProperty={mockSetProperty}
        />,
      );

      const input = screen.getByTestId("stepper-comp-currentValue");
      expect(input.value).toBe("");
    });

    it("does not render currentValue when property key is not present", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.StepperPathToData]}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      expect(
        screen.queryByTestId("stepper-comp-currentValue"),
      ).not.toBeInTheDocument();
    });
  });

  describe("CompletedValue property", () => {
    it("renders completedValue input when property key is present", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.CompletedValue]}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      expect(
        screen.getByTestId("stepper-comp-completedValue"),
      ).toBeInTheDocument();
    });

    it("displays correct value for completedValue", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.CompletedValue]}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      const input = screen.getByTestId("stepper-comp-completedValue");
      expect(input.value).toBe("Completed");
    });

    it("calls setProperty when completedValue is changed", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.CompletedValue]}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      const input = screen.getByTestId("stepper-comp-completedValue");
      fireEvent.change(input, { target: { value: "Done" } });

      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.CompletedValue,
        "Done",
      );
    });

    it("displays empty string when completedValue is undefined", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.CompletedValue]}
          propertyComponent={baseComponent({ completedValue: undefined })}
          setProperty={mockSetProperty}
        />,
      );

      const input = screen.getByTestId("stepper-comp-completedValue");
      expect(input.value).toBe("");
    });

    it("does not render completedValue when property key is not present", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.StepperPathToData]}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      expect(
        screen.queryByTestId("stepper-comp-completedValue"),
      ).not.toBeInTheDocument();
    });
  });

  describe("TitleKey property", () => {
    it("renders titleKey input when property key is present", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.TitleKey]}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      expect(screen.getByTestId("stepper-comp-titleKey")).toBeInTheDocument();
    });

    it("displays correct value for titleKey", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.TitleKey]}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      const input = screen.getByTestId("stepper-comp-titleKey");
      expect(input.value).toBe("title");
    });

    it("calls setProperty when titleKey is changed", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.TitleKey]}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      const input = screen.getByTestId("stepper-comp-titleKey");
      fireEvent.change(input, { target: { value: "name" } });

      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.TitleKey,
        "name",
      );
    });

    it("displays empty string when titleKey is undefined", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.TitleKey]}
          propertyComponent={baseComponent({ titleKey: undefined })}
          setProperty={mockSetProperty}
        />,
      );

      const input = screen.getByTestId("stepper-comp-titleKey");
      expect(input.value).toBe("");
    });

    it("does not render titleKey when property key is not present", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.StepperPathToData]}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      expect(
        screen.queryByTestId("stepper-comp-titleKey"),
      ).not.toBeInTheDocument();
    });
  });

  describe("DescriptionKey property", () => {
    it("renders descriptionKey input when property key is present", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.DescriptionKey]}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      expect(
        screen.getByTestId("stepper-comp-descriptionKey"),
      ).toBeInTheDocument();
    });

    it("displays correct value for descriptionKey", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.DescriptionKey]}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      const input = screen.getByTestId("stepper-comp-descriptionKey");
      expect(input.value).toBe("description");
    });

    it("calls setProperty when descriptionKey is changed", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.DescriptionKey]}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      const input = screen.getByTestId("stepper-comp-descriptionKey");
      fireEvent.change(input, { target: { value: "details" } });

      expect(mockSetProperty).toHaveBeenCalledWith(
        ComponentProperty.DescriptionKey,
        "details",
      );
    });

    it("displays empty string when descriptionKey is undefined", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.DescriptionKey]}
          propertyComponent={baseComponent({ descriptionKey: undefined })}
          setProperty={mockSetProperty}
        />,
      );

      const input = screen.getByTestId("stepper-comp-descriptionKey");
      expect(input.value).toBe("");
    });

    it("does not render descriptionKey when property key is not present", () => {
      render(
        <StepperPanel
          propertyKeys={[ComponentProperty.StepperPathToData]}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      expect(
        screen.queryByTestId("stepper-comp-descriptionKey"),
      ).not.toBeInTheDocument();
    });
  });

  describe("property key filtering", () => {
    it("renders only properties that are in propertyKeys", () => {
      render(
        <StepperPanel
          propertyKeys={[
            ComponentProperty.StepperPathToData,
            ComponentProperty.StatusKey,
          ]}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      expect(
        screen.getByTestId("stepper-comp-stepperPathToData"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("stepper-comp-statusKey")).toBeInTheDocument();
      expect(
        screen.queryByTestId("stepper-comp-waitValue"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("stepper-comp-currentValue"),
      ).not.toBeInTheDocument();
    });

    it("renders all properties when all keys are provided", () => {
      render(
        <StepperPanel
          propertyKeys={ALL_STEPPER_KEYS}
          propertyComponent={baseComponent()}
          setProperty={mockSetProperty}
        />,
      );

      expect(
        screen.getByTestId("stepper-comp-stepperPathToData"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("stepper-comp-statusKey")).toBeInTheDocument();
      expect(screen.getByTestId("stepper-comp-waitValue")).toBeInTheDocument();
      expect(
        screen.getByTestId("stepper-comp-currentValue"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("stepper-comp-completedValue"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("stepper-comp-titleKey")).toBeInTheDocument();
      expect(
        screen.getByTestId("stepper-comp-descriptionKey"),
      ).toBeInTheDocument();
    });
  });

  describe("component ID in test IDs", () => {
    it("uses component id in test IDs for all inputs", () => {
      const customComponent = baseComponent();
      customComponent.id = "custom-stepper-123";

      render(
        <StepperPanel
          propertyKeys={ALL_STEPPER_KEYS}
          propertyComponent={customComponent}
          setProperty={mockSetProperty}
        />,
      );

      expect(
        screen.getByTestId("custom-stepper-123-stepperPathToData"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("custom-stepper-123-statusKey"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("custom-stepper-123-waitValue"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("custom-stepper-123-currentValue"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("custom-stepper-123-completedValue"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("custom-stepper-123-titleKey"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("custom-stepper-123-descriptionKey"),
      ).toBeInTheDocument();
    });
  });
});
