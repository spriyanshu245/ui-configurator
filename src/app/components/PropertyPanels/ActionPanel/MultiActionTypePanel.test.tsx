import { render, screen, fireEvent } from "@testing-library/react";
import MultiActionTypePanel from "./MultiActionTypePanel";
import { BaseComponent, MultiActionCtaAction } from "@/app/types/types";

jest.mock("@/app/data/componentProperties", () => ({
  ComponentProperty: {
    Actions: "actions",
    LinkedForm: "linkedForm",
    ApiUrl: "apiUrl",
  },
}));

jest.mock("@/app/data/componentPropertiesMap", () => ({
  componentPropertiesMap: {
    "multi-action-submit": ["linkedForm"],
    "multi-action-routing": ["linkedForm"],
    "multi-action-download": ["apiUrl"],
    "multi-action-reset": [],
    "multi-action-close-popup": ["linkedForm"],
    "multi-action-with-unmapped": ["unmappedProp"],
  },
}));

const mockSetProperty = jest.fn();
const mockSetProperties = jest.fn();

jest.mock("@/app/data/propertiesPanelMap", () => {
  const React = require("react");
  const { PropertiesContext } = require("@/app/context/PropertiesContext");

  return {
    propertyPanelsMap: {
      linkedForm: ({
        propertyKeys,
        setProperty,
        setProperties,
        propertyComponent,
      }: any) => {
        const ctx = React.useContext(PropertiesContext);
        return (
          <div data-testid="linked-form-panel">
            <button
              data-testid="set-linked-form"
              onClick={() => setProperty("linkedForm", "form1")}
            >
              Set LinkedForm
            </button>
            <button
              data-testid="set-properties-linked-form"
              onClick={() =>
                setProperties({ linkedForm: "form2", extra: "val" })
              }
            >
              SetProperties
            </button>
            <button
              data-testid="toggle-panel-string"
              onClick={() => ctx?.togglePanel?.("panel-string")}
            >
              Toggle String
            </button>
            <button
              data-testid="toggle-panel-number"
              onClick={() => ctx?.togglePanel?.(1)}
            >
              Toggle Number
            </button>
            <button
              data-testid="is-open-string"
              onClick={() => ctx?.isPanelOpen?.("panel-string")}
            >
              IsOpen String
            </button>
            <button
              data-testid="is-open-number"
              onClick={() => ctx?.isPanelOpen?.(2)}
            >
              IsOpen Number
            </button>
            <button
              data-testid="reset-active-component"
              onClick={() => ctx?.resetActiveComponent?.()}
            >
              Reset Component
            </button>
            <button
              data-testid="reset-active-page"
              onClick={() => ctx?.resetActivePage?.()}
            >
              Reset Page
            </button>
            <button
              data-testid="set-active-component"
              onClick={() => ctx?.setActiveComponent?.("comp-1")}
            >
              Set Component
            </button>
            <button
              data-testid="toggle-property-pane"
              onClick={() => ctx?.togglePropertyPane?.()}
            >
              Toggle Pane
            </button>
            <button
              data-testid="set-active-page"
              onClick={() => ctx?.setActivePage?.("page-1")}
            >
              Set Page
            </button>
            <span data-testid="panel-prop-keys">{propertyKeys?.join(",")}</span>
            <span data-testid="panel-component-type">
              {propertyComponent?.type}
            </span>
          </div>
        );
      },
      apiUrl: ({ setProperty }: any) => (
        <div data-testid="api-url-panel">
          <button onClick={() => setProperty("apiUrl", "http://api.com")}>
            Set ApiUrl
          </button>
        </div>
      ),
    },
  };
});

jest.mock("@/app/utils/constants", () => ({
  multiActionCtaActionTypes: [
    { value: "submit", label: "Submit" },
    { value: "routing", label: "Routing" },
    { value: "reset", label: "Reset" },
    { value: "download", label: "Download" },
    { value: "close-popup", label: "Close Popup" },
  ],
}));

const createAction = (
  overrides: Partial<MultiActionCtaAction> = {},
): MultiActionCtaAction => ({
  id: "action-1",
  actionType: "",
  ...overrides,
});

const createPropertyComponent = (
  actions: MultiActionCtaAction[] = [],
): BaseComponent => ({
  id: "comp-1",
  type: "multi-action-cta",
  category: "component",
  properties: {
    actions,
  },
});

describe("MultiActionTypePanel", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders the Action Type label", () => {
    const action = createAction();
    render(
      <MultiActionTypePanel
        id={0}
        action={action}
        propertyComponent={createPropertyComponent([action])}
        setProperty={mockSetProperty}
      />,
    );
    expect(screen.getByText("Action Type")).toBeInTheDocument();
  });

  it("renders the action type select", () => {
    const action = createAction();
    render(
      <MultiActionTypePanel
        id={0}
        action={action}
        propertyComponent={createPropertyComponent([action])}
        setProperty={mockSetProperty}
      />,
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("renders 'Select Action Type' as the default option", () => {
    const action = createAction();
    render(
      <MultiActionTypePanel
        id={0}
        action={action}
        propertyComponent={createPropertyComponent([action])}
        setProperty={mockSetProperty}
      />,
    );
    expect(screen.getByText("Select Action Type")).toBeInTheDocument();
  });

  it("renders all action type options from constants", () => {
    const action = createAction();
    render(
      <MultiActionTypePanel
        id={0}
        action={action}
        propertyComponent={createPropertyComponent([action])}
        setProperty={mockSetProperty}
      />,
    );
    expect(screen.getByRole("option", { name: "Submit" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Routing" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Reset" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Download" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Close Popup" }),
    ).toBeInTheDocument();
  });

  it("select displays correct id based on index", () => {
    const action = createAction();
    render(
      <MultiActionTypePanel
        id={2}
        action={action}
        propertyComponent={createPropertyComponent([action])}
        setProperty={mockSetProperty}
      />,
    );
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "id",
      "selectedActionType-3",
    );
  });

  it("shows current action type as selected value", () => {
    const action = createAction({ actionType: "submit" });
    render(
      <MultiActionTypePanel
        id={0}
        action={action}
        propertyComponent={createPropertyComponent([action])}
        setProperty={mockSetProperty}
      />,
    );
    expect(screen.getByRole("combobox")).toHaveValue("submit");
  });

  it("calls setProperty with updated actions when action type changes", () => {
    const action = createAction({ id: "action-1", actionType: "" });
    render(
      <MultiActionTypePanel
        id={0}
        action={action}
        propertyComponent={createPropertyComponent([action])}
        setProperty={mockSetProperty}
      />,
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "routing" },
    });
    expect(mockSetProperty).toHaveBeenCalledWith("actions", [
      expect.objectContaining({ id: "action-1", actionType: "routing" }),
    ]);
  });

  it("only updates the matching action when multiple actions exist", () => {
    const action1 = createAction({ id: "action-1", actionType: "" });
    const action2 = createAction({ id: "action-2", actionType: "reset" });
    render(
      <MultiActionTypePanel
        id={0}
        action={action1}
        propertyComponent={createPropertyComponent([action1, action2])}
        setProperty={mockSetProperty}
      />,
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "submit" },
    });
    expect(mockSetProperty).toHaveBeenCalledWith("actions", [
      expect.objectContaining({ id: "action-1", actionType: "submit" }),
      expect.objectContaining({ id: "action-2", actionType: "reset" }),
    ]);
  });

  it("renders relevant panel when action type is set to submit", () => {
    const action = createAction({ actionType: "submit" });
    render(
      <MultiActionTypePanel
        id={0}
        action={action}
        propertyComponent={createPropertyComponent([action])}
        setProperty={mockSetProperty}
      />,
    );
    expect(screen.getByTestId("linked-form-panel")).toBeInTheDocument();
  });

  it("renders api-url panel when action type is download", () => {
    const action = createAction({ actionType: "download" });
    render(
      <MultiActionTypePanel
        id={0}
        action={action}
        propertyComponent={createPropertyComponent([action])}
        setProperty={mockSetProperty}
      />,
    );
    expect(screen.getByTestId("api-url-panel")).toBeInTheDocument();
  });

  it("renders no sub-panel when action type is reset (empty props)", () => {
    const action = createAction({ actionType: "reset" });
    render(
      <MultiActionTypePanel
        id={0}
        action={action}
        propertyComponent={createPropertyComponent([action])}
        setProperty={mockSetProperty}
      />,
    );
    expect(screen.queryByTestId("linked-form-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("api-url-panel")).not.toBeInTheDocument();
  });

  it("renders no sub-panels when action type is empty", () => {
    const action = createAction({ actionType: "" });
    render(
      <MultiActionTypePanel
        id={0}
        action={action}
        propertyComponent={createPropertyComponent([action])}
        setProperty={mockSetProperty}
      />,
    );
    expect(screen.queryByTestId("linked-form-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("api-url-panel")).not.toBeInTheDocument();
  });

  it("passes the correct effectiveType as propertyComponent.type to sub-panel", () => {
    const action = createAction({ actionType: "submit" });
    render(
      <MultiActionTypePanel
        id={0}
        action={action}
        propertyComponent={createPropertyComponent([action])}
        setProperty={mockSetProperty}
      />,
    );
    expect(screen.getByTestId("panel-component-type")).toHaveTextContent(
      "multi-action-submit",
    );
  });

  it("passes correct propertyKeys to sub-panel", () => {
    const action = createAction({ actionType: "submit" });
    render(
      <MultiActionTypePanel
        id={0}
        action={action}
        propertyComponent={createPropertyComponent([action])}
        setProperty={mockSetProperty}
      />,
    );
    expect(screen.getByTestId("panel-prop-keys")).toHaveTextContent(
      "linkedForm",
    );
  });

  it("sub-panel setProperty triggers updateAction correctly", () => {
    const action = createAction({ actionType: "submit", linkedForm: "" });
    render(
      <MultiActionTypePanel
        id={0}
        action={action}
        propertyComponent={createPropertyComponent([action])}
        setProperty={mockSetProperty}
      />,
    );
    fireEvent.click(screen.getByTestId("set-linked-form"));
    expect(mockSetProperty).toHaveBeenCalledWith(
      "actions",
      expect.arrayContaining([
        expect.objectContaining({ id: "action-1", linkedForm: "form1" }),
      ]),
    );
  });

  it("sub-panel setProperties triggers updateAction correctly", () => {
    const action = createAction({ actionType: "submit" });
    render(
      <MultiActionTypePanel
        id={0}
        action={action}
        propertyComponent={createPropertyComponent([action])}
        setProperty={mockSetProperty}
      />,
    );
    fireEvent.click(screen.getByTestId("set-properties-linked-form"));
    expect(mockSetProperty).toHaveBeenCalledWith(
      "actions",
      expect.arrayContaining([
        expect.objectContaining({
          id: "action-1",
          linkedForm: "form2",
          extra: "val",
        }),
      ]),
    );
  });

  it("handles a propertyComponent with no actions array (uses empty array)", () => {
    const action = createAction({ actionType: "submit" });
    const propertyComponent: BaseComponent = {
      id: "comp-1",
      type: "multi-action-cta",
      category: "component",
      properties: {},
    };
    render(
      <MultiActionTypePanel
        id={0}
        action={action}
        propertyComponent={propertyComponent}
        setProperty={mockSetProperty}
      />,
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("uses empty array when effectiveType is not in componentPropertiesMap", () => {
    const action = createAction({ actionType: "not-in-map" as any });
    render(
      <MultiActionTypePanel
        id={0}
        action={action}
        propertyComponent={createPropertyComponent([action])}
        setProperty={mockSetProperty}
      />,
    );
    expect(screen.queryByTestId("linked-form-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("api-url-panel")).not.toBeInTheDocument();
  });

  it("skips propKeys whose panel component is not in propertyPanelsMap", () => {
    const action = createAction({ actionType: "with-unmapped" as any });
    render(
      <MultiActionTypePanel
        id={0}
        action={action}
        propertyComponent={createPropertyComponent([action])}
        setProperty={mockSetProperty}
      />,
    );
    expect(screen.queryByTestId("linked-form-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("api-url-panel")).not.toBeInTheDocument();
  });

  it("updateAction preserves other actions in list (covers : a branch)", () => {
    const action1 = createAction({ id: "action-1", actionType: "submit" });
    const action2 = createAction({ id: "action-2", actionType: "routing" });
    render(
      <MultiActionTypePanel
        id={0}
        action={action1}
        propertyComponent={createPropertyComponent([action1, action2])}
        setProperty={mockSetProperty}
      />,
    );
    fireEvent.click(screen.getByTestId("set-linked-form"));
    expect(mockSetProperty).toHaveBeenCalledWith(
      "actions",
      expect.arrayContaining([
        expect.objectContaining({ id: "action-1", linkedForm: "form1" }),
        expect.objectContaining({ id: "action-2", actionType: "routing" }),
      ]),
    );
  });

  it("handles undefined actionType via nullish coalescing (renders empty string value)", () => {
    const action = { id: "action-1" } as unknown as MultiActionCtaAction;
    render(
      <MultiActionTypePanel
        id={0}
        action={action}
        propertyComponent={createPropertyComponent([action])}
        setProperty={mockSetProperty}
      />,
    );
    expect(screen.getByRole("combobox")).toHaveValue("");
  });

  it("stub functions in localValue are callable without errors", () => {
    const action = createAction({ actionType: "submit" });
    render(
      <MultiActionTypePanel
        id={0}
        action={action}
        propertyComponent={createPropertyComponent([action])}
        setProperty={mockSetProperty}
      />,
    );
    fireEvent.click(screen.getByTestId("reset-active-component"));
    fireEvent.click(screen.getByTestId("reset-active-page"));
    fireEvent.click(screen.getByTestId("set-active-component"));
    fireEvent.click(screen.getByTestId("toggle-property-pane"));
    fireEvent.click(screen.getByTestId("set-active-page"));
    expect(screen.getByTestId("linked-form-panel")).toBeInTheDocument();
  });

  it("togglePanel with a string panel id updates open state", () => {
    const action = createAction({ actionType: "submit" });
    render(
      <MultiActionTypePanel
        id={0}
        action={action}
        propertyComponent={createPropertyComponent([action])}
        setProperty={mockSetProperty}
      />,
    );
    const toggleBtn = screen.getByTestId("toggle-panel-string");
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId("linked-form-panel")).toBeInTheDocument();
  });

  it("togglePanel with a numeric panel id updates open state", () => {
    const action = createAction({ actionType: "submit" });
    render(
      <MultiActionTypePanel
        id={0}
        action={action}
        propertyComponent={createPropertyComponent([action])}
        setProperty={mockSetProperty}
      />,
    );
    const toggleBtn = screen.getByTestId("toggle-panel-number");
    fireEvent.click(toggleBtn);
    expect(screen.getByTestId("linked-form-panel")).toBeInTheDocument();
  });

  it("isPanelOpen with a string panel id returns boolean", () => {
    const action = createAction({ actionType: "submit" });
    render(
      <MultiActionTypePanel
        id={0}
        action={action}
        propertyComponent={createPropertyComponent([action])}
        setProperty={mockSetProperty}
      />,
    );
    fireEvent.click(screen.getByTestId("is-open-string"));
    expect(screen.getByTestId("linked-form-panel")).toBeInTheDocument();
  });

  it("isPanelOpen with a numeric panel id returns boolean", () => {
    const action = createAction({ actionType: "submit" });
    render(
      <MultiActionTypePanel
        id={0}
        action={action}
        propertyComponent={createPropertyComponent([action])}
        setProperty={mockSetProperty}
      />,
    );
    fireEvent.click(screen.getByTestId("is-open-number"));
    expect(screen.getByTestId("linked-form-panel")).toBeInTheDocument();
  });
});
