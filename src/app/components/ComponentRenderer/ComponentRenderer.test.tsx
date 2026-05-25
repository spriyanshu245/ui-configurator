import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ComponentRenderer from "./ComponentRenderer";
import { useDragContext } from "@/app/context/DragContext";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import { UIComponent } from "@/app/types/types";

jest.mock("@/app/context/DragContext", () => ({
  useDragContext: jest.fn(),
}));
jest.mock("@/app/context/PropertiesContext", () => ({
  usePropertyPane: jest.fn(),
}));

jest.mock("../UIComponents/NewForm/Form", () => () => (
  <div data-testid="form">Form Component</div>
));
jest.mock("../UIComponents/Input/Input", () => () => (
  <div role="textbox">Input Component</div>
));
jest.mock("../UIComponents/CheckboxGroup/CheckboxGroup", () => () => (
  <div>checkbox label</div>
));
jest.mock("../UIComponents/Select/Select", () => () => (
  <div data-testid="select">Select Component</div>
));
jest.mock("../UIComponents/Heading/Heading", () => () => (
  <div data-testid="heading">Heading Component</div>
));
jest.mock(
  "../UIComponents/CustomImage/CustomImage",
  () =>
    ({ component }: any) => (
      <img src={component.properties.src} alt={component.properties.alt} />
    ),
);
jest.mock("../UIComponents/Typograph/Typograph", () => () => (
  <div data-testid="typograph">Typograph Component</div>
));
jest.mock("../UIComponents/RadioGroup/RadioGroup", () => () => (
  <div data-testid="radio-group">RadioGroup Component</div>
));
jest.mock("../UIComponents/SubSection/SubSection", () => () => (
  <div data-testid="sub-section">SubSection Component</div>
));
jest.mock("../UIComponents/FormRow/FormRow", () => () => (
  <div data-testid="form-row">FormRow Component</div>
));
jest.mock("../UIComponents/DatePicker/DatePicker", () => () => (
  <div data-testid="date">DatePicker Component</div>
));
jest.mock("../UIComponents/Spacer/Spacer", () => () => (
  <div data-testid="spacer">Spacer Component</div>
));
jest.mock("../UIComponents/Table/Table", () => () => (
  <div data-testid="table">Table Component</div>
));
jest.mock("../UIComponents/InputTable/InputTable", () => () => (
  <div data-testid="input-table">InputTable Component</div>
));
jest.mock("../UIComponents/DataGrid/DataGrid", () => () => (
  <div data-testid="data-grid">DataGrid Component</div>
));
jest.mock("../UIComponents/Tabs/Tabs", () => () => (
  <div data-testid="tabs">Tabs Component</div>
));
jest.mock("../ToggleSwitch/ToggleSwitch", () => () => (
  <div data-testid="toggle-button">Toggle button</div>
));
jest.mock("../UIComponents/InputGrid/InputGrid", () => () => (
  <div data-testid="input-grid">Input Grid Component</div>
));
jest.mock("../UIComponents/HiddenField/HiddenField", () => () => (
  <div data-testid="hidden-field">Hidden Field Component</div>
));
jest.mock("../UIComponents/ButtonV2/ButtonV2", () => () => (
  <button data-testid="button-v2">Button V2 Component</button>
));
jest.mock("../UIComponents/FileUpload/FileUpload", () => () => (
  <div data-testid="file-upload">File Upload Component</div>
));
jest.mock("../UIComponents/Questionnaire/Questionnaire", () => () => (
  <div data-testid="questionnaire">Questionnaire Component</div>
));
jest.mock("../UIComponents/Contact/Contact", () => () => (
  <div id="contact-component" data-testid="contact">
    Contact Component
  </div>
));
jest.mock("../UIComponents/Stack/Stack", () => () => (
  <div data-testid="stack">Stack Component</div>
));
jest.mock("../UIComponents/WorkflowStage/WorkflowStage", () => () => (
  <div data-testid="workflow-stage">Workflow Stage Component</div>
));
jest.mock("../UIComponents/MultiSelect/MultiSelect", () => () => (
  <div data-testid="multi-select">MultiSelect Component</div>
));
jest.mock("../UIComponents/FinancialDetails/FinancialDetails", () => () => (
  <div data-testid="financial-details">FinancialDetails Component</div>
));
jest.mock("../UIComponents/TransferList/TransferList", () => () => (
  <div data-testid="transfer-list">TransferList Component</div>
));
jest.mock("../UIComponents/Divider/Divider", () => () => (
  <div data-testid="divider">Divider Component</div>
));
jest.mock("../UIComponents/TextArea/TextArea", () => () => (
  <div id="text-area-component" data-testid="text-area">
    TextArea Component
  </div>
));
jest.mock(
  "../UIComponents/ExternalIntegration/ExternalIntegration",
  () => () => (
    <div data-testid="external-integration">External Integration Component</div>
  ),
);
jest.mock("../UIComponents/TreeComponent/TreeCompoent", () => () => (
  <div data-testid="treeStructure">Tree Component</div>
));
jest.mock("../UIComponents/ImageCapture/ImageCapture", () => () => (
  <div data-testid="image-capture">Image Capture Component</div>
));
jest.mock("../UIComponents/PaymentCheckout/PaymentCheckout", () => () => (
  <div data-testid="payment-checkout">Payment Checkout Component</div>
));
jest.mock("../UIComponents/ConditionBuilder/ConditionBuilder", () => () => (
  <div data-testid="condition-builder">Condition Builder Component</div>
));

jest.mock("@/app/hooks/useAutoScroll", () => ({
  useAutoScroll: jest.fn(),
}));

jest.mock("@/app/utils/utils", () => ({
  resetGhostImage: jest.fn(),
  convertHyphenSeparatedToPascalCase: jest.fn((str) => str),
}));

jest.mock("@/app/components/SVGIcons/ComponentIcons/Domain", () => () => (
  <svg data-testid="domain-icon" />
));
jest.mock("@/app/components/SVGIcons/ComponentIcons/Placeholder", () => () => (
  <svg data-testid="renderer-placeholder-icon" />
));
jest.mock("@/app/data/availableComponents", () => ({
  getComponentTitle: jest.fn((type: string) =>
    type === "workflow-stage" ? "Workflow Stage" : undefined,
  ),
}));

describe("ComponentRenderer", () => {
  const mockSetActiveComponent = jest.fn();
  const mockSetIsDragging = jest.fn();
  const mockSetIsDraggingComponent = jest.fn();
  const mockSetDraggingComponentId = jest.fn();
  const mockSetIsFormRowValidation = jest.fn();
  const mockSetIsDraggingFormElement = jest.fn();

  const defaultDragContext = {
    isDragging: false,
    setIsDragging: mockSetIsDragging,
    setIsDraggingComponent: mockSetIsDraggingComponent,
    setDraggingComponentId: mockSetDraggingComponentId,
    setIsDraggingFormElement: mockSetIsDraggingFormElement,
    setIsFormRowValidation: mockSetIsFormRowValidation,
    draggingComponentId: null,
  };

  const defaultPropertyPane = {
    propertyComponentId: null,
    setActiveComponent: mockSetActiveComponent,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useDragContext as jest.Mock).mockReturnValue(defaultDragContext);
    (usePropertyPane as jest.Mock).mockReturnValue(defaultPropertyPane);
  });

  afterEach(() => {
    document.querySelectorAll("#ghostEl").forEach((el) => el.remove());
  });

  const renderWithContext = (component: UIComponent) => {
    return render(<ComponentRenderer component={component} />);
  };

  test("renders external-integration component", () => {
    renderWithContext({
      id: "1",
      type: "external-integration",
      category: "component",
      properties: {},
    });
    expect(screen.getByTestId("external-integration")).toBeInTheDocument();
  });

  test("renders heading component", () => {
    renderWithContext({
      id: "1",
      type: "heading",
      category: "component",
      properties: { label: "Heading" },
    });
    expect(screen.getByTestId("heading")).toBeInTheDocument();
  });

  test("renders typograph component", () => {
    renderWithContext({
      id: "1",
      type: "typograph",
      category: "component",
      properties: {},
    });
    expect(screen.getByTestId("typograph")).toBeInTheDocument();
  });

  test("renders form component", () => {
    renderWithContext({
      id: "1",
      type: "form",
      category: "form",
      properties: {},
    });
    expect(screen.getByTestId("form")).toBeInTheDocument();
  });

  test("renders form-row component", () => {
    renderWithContext({
      id: "1",
      type: "form-row",
      category: "form",
      properties: {},
    });
    expect(screen.getByTestId("form-row")).toBeInTheDocument();
  });

  test("renders select component", () => {
    renderWithContext({
      id: "1",
      type: "select",
      category: "form",
      properties: {},
    });
    expect(screen.getByTestId("select")).toBeInTheDocument();
  });

  test("renders image component", () => {
    renderWithContext({
      id: "1",
      type: "image",
      category: "component",
      properties: { src: "img.jpg", alt: "Test Image" },
    });
    expect(screen.getByAltText("Test Image")).toBeInTheDocument();
  });

  test("renders input component", () => {
    renderWithContext({
      id: "1",
      type: "input",
      category: "form",
      properties: {},
    });
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  test("renders text-area component", () => {
    renderWithContext({
      id: "1",
      type: "text-area",
      category: "form",
      properties: {},
    });
    expect(screen.getByTestId("text-area")).toBeInTheDocument();
  });

  test("renders checkbox-group component", () => {
    renderWithContext({
      id: "1",
      type: "checkbox-group",
      category: "form",
      properties: {},
    });
    expect(screen.getByText("checkbox label")).toBeInTheDocument();
  });

  test("renders toggle-button component", () => {
    renderWithContext({
      id: "1",
      type: "toggle-button",
      category: "form",
      properties: {},
    });
    expect(screen.getByTestId("toggle-button")).toBeInTheDocument();
  });

  test("renders radio-group component", () => {
    renderWithContext({
      id: "1",
      type: "radio-group",
      category: "form",
      properties: {},
    });
    expect(screen.getByTestId("radio-group")).toBeInTheDocument();
  });

  test("renders sub-section component", () => {
    renderWithContext({
      id: "1",
      type: "sub-section",
      category: "component",
      properties: {},
    });
    expect(screen.getByTestId("sub-section")).toBeInTheDocument();
  });

  test("renders date component", () => {
    renderWithContext({
      id: "1",
      type: "date",
      category: "form",
      properties: {},
    });
    expect(screen.getByTestId("date")).toBeInTheDocument();
  });

  test("renders table component", () => {
    renderWithContext({
      id: "1",
      type: "table",
      category: "component",
      properties: {},
    });
    expect(screen.getByTestId("table")).toBeInTheDocument();
  });

  test("renders spacer component", () => {
    renderWithContext({
      id: "1",
      type: "spacer",
      category: "component",
      properties: {},
    });
    expect(screen.getByTestId("spacer")).toBeInTheDocument();
  });

  test("renders divider component", () => {
    renderWithContext({
      id: "1",
      type: "divider",
      category: "component",
      properties: {},
    });
    expect(screen.getByTestId("divider")).toBeInTheDocument();
  });

  test("renders input-table component", () => {
    renderWithContext({
      id: "1",
      type: "input-table",
      category: "form",
      properties: {},
    });
    expect(screen.getByTestId("input-table")).toBeInTheDocument();
  });

  test("renders data-grid component", () => {
    renderWithContext({
      id: "1",
      type: "data-grid",
      category: "component",
      properties: {},
    });
    expect(screen.getByTestId("data-grid")).toBeInTheDocument();
  });

  test("renders tabs component", () => {
    renderWithContext({
      id: "1",
      type: "tabs",
      category: "component",
      properties: {},
    });
    expect(screen.getByTestId("tabs")).toBeInTheDocument();
  });

  test("renders input-grid component", () => {
    renderWithContext({
      id: "1",
      type: "input-grid",
      category: "form",
      properties: {},
    });
    expect(screen.getByTestId("input-grid")).toBeInTheDocument();
  });

  test("renders hidden-field component", () => {
    renderWithContext({
      id: "1",
      type: "hidden-field",
      category: "component",
      properties: {},
    });
    expect(screen.getByTestId("hidden-field")).toBeInTheDocument();
  });

  test("renders button-v2 component", () => {
    renderWithContext({
      id: "1",
      type: "button-v2",
      category: "component",
      properties: {},
    });
    expect(screen.getByTestId("button-v2")).toBeInTheDocument();
  });

  test("renders file-upload component", () => {
    renderWithContext({
      id: "1",
      type: "file-upload",
      category: "component",
      properties: {},
    });
    expect(screen.getByTestId("file-upload")).toBeInTheDocument();
  });

  test("renders questionnaire component", () => {
    renderWithContext({
      id: "1",
      type: "questionnaire",
      category: "component",
      properties: {},
    });
    expect(screen.getByTestId("questionnaire")).toBeInTheDocument();
  });

  test("renders contact component", () => {
    renderWithContext({
      id: "1",
      type: "contact",
      category: "form",
      properties: {},
    });
    expect(screen.getByTestId("contact")).toBeInTheDocument();
  });

  test("renders stack component", () => {
    renderWithContext({
      id: "1",
      type: "stack",
      category: "component",
      properties: {},
    });
    expect(screen.getByTestId("stack")).toBeInTheDocument();
  });

  test("renders workflow-stage component", () => {
    renderWithContext({
      id: "1",
      type: "workflow-stage",
      category: "component",
      properties: {},
    });
    expect(screen.getByTestId("workflow-stage")).toBeInTheDocument();
    expect(screen.getByTestId("domain-icon")).toBeInTheDocument();
  });

  test("uses the V2 catalog title for the visible inline label", () => {
    renderWithContext({
      id: "1",
      type: "workflow-stage",
      category: "component",
      displayName: "Workflow Stage",
      properties: {},
    });

    expect(screen.getByText("Workflow Stage")).toBeInTheDocument();
    expect(screen.queryByText("workflow-stage")).not.toBeInTheDocument();
  });

  test("falls back to the converted type when no V2 catalog title exists", () => {
    renderWithContext({
      id: "1",
      type: "form-row",
      category: "form",
      properties: {},
    } as UIComponent);

    expect(screen.getByText("form-row")).toBeInTheDocument();
  });

  test("renders multi-select component", () => {
    renderWithContext({
      id: "1",
      type: "multi-select",
      category: "form",
      properties: {},
    });
    expect(screen.getByTestId("multi-select")).toBeInTheDocument();
  });

  test("renders financial-details component", () => {
    renderWithContext({
      id: "1",
      type: "financial-details",
      category: "component",
      properties: {},
    });
    expect(screen.getByTestId("financial-details")).toBeInTheDocument();
  });

  test("renders transfer-list component", () => {
    renderWithContext({
      id: "1",
      type: "transfer-list",
      category: "component",
      properties: {},
    });
    expect(screen.getByTestId("transfer-list")).toBeInTheDocument();
  });

  test("renders tree-structure component", () => {
    renderWithContext({
      id: "1",
      type: "tree-structure",
      category: "component",
      properties: {},
    });
    expect(screen.getByTestId("treeStructure")).toBeInTheDocument();
  });

  test("renders image-capture component", () => {
    renderWithContext({
      id: "1",
      type: "image-capture",
      category: "component",
      properties: {},
    });
    expect(screen.getByTestId("image-capture")).toBeInTheDocument();
  });

  test("renders payment-checkout component", () => {
    renderWithContext({
      id: "1",
      type: "payment-checkout",
      category: "component",
      properties: {},
    });
    expect(screen.getByTestId("payment-checkout")).toBeInTheDocument();
  });

  test("renders condition-builder component", () => {
    renderWithContext({
      id: "1",
      type: "condition-builder",
      category: "form",
      properties: {
        dialectCode: "LOS",
      },
    });
    expect(screen.getByTestId("condition-builder")).toBeInTheDocument();
  });

  test("renders unknown component message", () => {
    renderWithContext({
      id: "1",
      type: "unknown-type" as any,
      category: "component",
      properties: {},
    });
    expect(
      screen.getByText(
        /Custom component type "unknown-type" is not recognized./,
      ),
    ).toBeInTheDocument();
  });

  test("handles drag start for standard component", () => {
    const { container } = renderWithContext({
      id: "drag-1",
      type: "input",
      category: "component",
      displayName: "Input Field",
      properties: {},
    });
    const wrapper = container.firstChild as HTMLElement;
    const setDragImage = jest.fn((dragPreview: HTMLElement) => {
      expect(document.body.contains(dragPreview)).toBe(true);
    });
    const setData = jest.fn();
    fireEvent.dragStart(wrapper, {
      dataTransfer: {
        setData,
        setDragImage,
        effectAllowed: "",
      },
    });
    const ghostEl = document.getElementById("ghostEl");
    expect(ghostEl).toBeInTheDocument();
    expect(ghostEl).toHaveClass("ghost");
    expect(ghostEl).toHaveTextContent("input");
    expect(mockSetActiveComponent).not.toHaveBeenCalled();
    expect(mockSetIsDragging).toHaveBeenCalledWith(true);
    expect(mockSetDraggingComponentId).toHaveBeenCalledWith("drag-1");
    expect(mockSetIsDraggingComponent).toHaveBeenCalledWith(true);
  });

  test("uses the resolved React icon in the renderer drag ghost", () => {
    const { container } = renderWithContext({
      id: "workflow-1",
      type: "workflow-stage",
      category: "component",
      displayName: "Workflow Stage",
      properties: {},
    });

    const wrapper = container.firstChild as HTMLElement;
    fireEvent.dragStart(wrapper, {
      dataTransfer: {
        setData: jest.fn(),
        setDragImage: jest.fn(),
        effectAllowed: "",
      },
    });

    const ghostEl = document.getElementById("ghostEl");
    expect(ghostEl).toBeInTheDocument();
    expect(ghostEl).toHaveClass("ghost");
    expect(
      ghostEl?.querySelector('[data-testid="domain-icon"]'),
    ).not.toBeNull();
    expect(ghostEl).toHaveTextContent("Workflow Stage");
  });

  test("keeps dragging when the renderer custom drag image setup fails", () => {
    const { container } = renderWithContext({
      id: "workflow-2",
      type: "workflow-stage",
      category: "component",
      displayName: "Workflow Stage",
      properties: {},
    });

    const wrapper = container.firstChild as HTMLElement;
    const setData = jest.fn();

    fireEvent.dragStart(wrapper, {
      dataTransfer: {
        setData,
        setDragImage: () => {
          throw new Error("setDragImage failed");
        },
        effectAllowed: "",
      },
    });

    expect(document.getElementById("ghostEl")).toBeNull();
    expect(setData).toHaveBeenCalledWith(
      "application/json",
      JSON.stringify({
        id: "workflow-2",
        type: "workflow-stage",
        category: "component",
        displayName: "Workflow Stage",
        properties: {},
        isComponent: true,
        isFormElement: false,
      }),
    );
    expect(mockSetIsDragging).toHaveBeenCalledWith(true);
    expect(mockSetIsDraggingComponent).toHaveBeenCalledWith(true);
  });

  test("handles drag start for form element", () => {
    const { container } = renderWithContext({
      id: "form-1",
      type: "input",
      category: "form",
      displayName: "Input Field",
      properties: {},
    });
    const wrapper = container.firstChild as HTMLElement;
    fireEvent.dragStart(wrapper, {
      dataTransfer: {
        setData: jest.fn(),
        setDragImage: jest.fn(),
        effectAllowed: "",
      },
    });
    expect(mockSetIsDragging).toHaveBeenCalledWith(true);
    expect(mockSetDraggingComponentId).toHaveBeenCalledWith("form-1");
    expect(mockSetIsDraggingFormElement).toHaveBeenCalledWith(true);
    expect(mockSetIsFormRowValidation).toHaveBeenCalledWith(false);
  });

  test("handles drag start for form-row element validation", () => {
    const { container } = renderWithContext({
      id: "row-1",
      type: "form-row",
      category: "form",
      displayName: "Form Row",
      properties: {},
    });
    const wrapper = container.firstChild as HTMLElement;
    fireEvent.dragStart(wrapper, {
      dataTransfer: {
        setData: jest.fn(),
        setDragImage: jest.fn(),
        effectAllowed: "",
      },
    });
    expect(mockSetIsFormRowValidation).toHaveBeenCalledWith(true);
    const ghostEl = document.getElementById("ghostEl");
    expect(ghostEl).toBeInTheDocument();
    expect(
      ghostEl?.querySelector('[data-testid="renderer-placeholder-icon"]'),
    ).toBeInTheDocument();
  });

  test("uses the placeholder icon for unmapped renderer-only variants", () => {
    renderWithContext({
      id: "sub-form-1",
      type: "form-sub-section",
      category: "component",
      properties: {},
    });

    expect(screen.getByTestId("renderer-placeholder-icon")).toBeInTheDocument();
  });

  test("handles drag end", () => {
    const { container } = renderWithContext({
      id: "drag-1",
      type: "input",
      category: "component",
      properties: {},
    });
    const wrapper = container.firstChild as HTMLElement;
    fireEvent.dragEnd(wrapper);
    expect(mockSetIsDragging).toHaveBeenCalledWith(false);
    expect(mockSetIsDraggingComponent).toHaveBeenCalledWith(false);
    expect(mockSetIsDraggingFormElement).toHaveBeenCalledWith(false);
    expect(mockSetDraggingComponentId).toHaveBeenCalledWith(null);
  });

  test("activates component on click", () => {
    const { container } = renderWithContext({
      id: "click-1",
      type: "input",
      category: "component",
      properties: {},
    });
    const wrapper = container.firstChild as HTMLElement;
    fireEvent.click(wrapper);
    expect(mockSetActiveComponent).toHaveBeenCalledWith("click-1");
  });

  test("applies active class when propertyComponentId matches", () => {
    (usePropertyPane as jest.Mock).mockReturnValue({
      propertyComponentId: "active-1",
      setActiveComponent: mockSetActiveComponent,
    });
    const { container } = renderWithContext({
      id: "active-1",
      type: "input",
      category: "component",
      properties: {},
    });
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("active");
  });

  test("applies dragging class when draggingComponentId matches", () => {
    (useDragContext as jest.Mock).mockReturnValue({
      ...defaultDragContext,
      draggingComponentId: "drag-1",
    });
    const { container } = renderWithContext({
      id: "drag-1",
      type: "input",
      category: "component",
      properties: {},
    });
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("dragging");
  });

  test("applies componentGroup class when components array is present", () => {
    const groupComponent = {
      id: "group-1",
      type: "stack",
      category: "component",
      properties: {},
      components: [
        { id: "child-1", type: "input", category: "component", properties: {} },
      ],
    };
    const { container } = renderWithContext(groupComponent);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("componentGroup");
  });

  test("applies formComponentWrapper class for form category components", () => {
    const { container } = renderWithContext({
      id: "form-comp",
      type: "input",
      category: "form",
      properties: {},
    });
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("formComponentWrapper");
  });
});
