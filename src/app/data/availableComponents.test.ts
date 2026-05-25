import {
  availableComponents,
  componentPaneV2CategoryLabels,
  componentPaneV2CategoryOrder,
  getComponentTitle,
} from "./availableComponents";
import { componentPaneIconMap } from "./componentPaneIconMap";

const getComponent = (type: string) =>
  availableComponents.find((component) => component.type === type);

const expectedPaneTypes = [
  "sub-section",
  "form",
  "tabs",
  "accordion-group",
  "stack",
  "repeatable-sub-section",
  "input-grid",
  "input",
  "button-v2",
  "multi-action-cta",
  "input-table",
  "date",
  "file-upload",
  "image-capture",
  "text-area",
  "transfer-list",
  "time",
  "select",
  "multi-select",
  "checkbox-group",
  "radio-group",
  "toggle-button",
  "numeric-slider",
  "table",
  "heading",
  "typograph",
  "data-grid",
  "image",
  "stepper",
  "tree-structure",
  "spacer",
  "divider",
  "hidden-field",
  "condition-builder",
  "maps",
  "route-plan",
  "financial-details",
  "questionnaire",
  "contact",
  "workflow-stage",
  "external-integration",
  "payment-checkout",
  "collection-dashboard-table",
];

const titleOverrides: Record<string, string> = {
  typograph: "Typography",
  "accordion-group": "Accordion",
  table: "Data Table",
  "data-grid": "Data Panel",
  "button-v2": "Button (CTA)",
  "multi-action-cta": "Multi-Action Button",
  input: "Input Field",
  "checkbox-group": "Checkbox",
  "toggle-button": "Toggle",
  "radio-group": "Radio Buttons",
  "numeric-slider": "Slider",
};

describe("availableComponents", () => {
  it("exports each component type exactly once and preserves builder categories", () => {
    const componentTypes = availableComponents.map(
      (component) => component.type,
    );

    expect(new Set(componentTypes).size).toBe(availableComponents.length);
    expect(getComponent("external-integration")?.category).toBe("component");
    expect(getComponent("input")?.category).toBe("form");
    expect(getComponent("spacer")?.category).toBe("");
  });

  it("preserves default values for common and display components", () => {
    const typograph = getComponent("typograph");
    expect(typograph?.properties?.text).toBe("Enter text here..");
    expect(typograph?.properties?.textAlign).toBe("left");
    expect(typograph?.properties?.fetchDisplayValueFromApi).toBe(false);

    const subSection = getComponent("sub-section");
    expect(subSection?.properties?.showLabel).toBe(true);
    expect(subSection?.properties?.subsectionHeaders?.length).toBe(1);
    expect(subSection?.components).toEqual([]);

    expect(getComponent("spacer")?.properties?.height).toBe(20);

    const divider = getComponent("divider");
    expect(divider?.properties?.height).toBe(1);
    expect(divider?.properties?.width).toBe("100%");

    expect(getComponent("table")?.properties?.tableColumns?.length).toBe(1);
    expect(getComponent("data-grid")?.properties?.columns).toBe(4);
    expect(getComponent("data-grid")?.properties?.columnGap).toBe(30);
    expect(getComponent("input-grid")?.components?.length).toBe(1);
    expect(getComponent("button-v2")?.properties?.actionType).toBe("routing");
    expect(getComponent("stack")?.properties?.columns).toBe(2);
    expect(getComponent("image")?.properties?.src).toBe("");
    expect(getComponent("stepper")?.properties?.statusKey).toBe("status");
    expect(getComponent("tree-structure")?.properties?.behaviorType).toBe(
      "navigation",
    );
  });

  it("preserves default values for builder UI components", () => {
    const externalIntegration = getComponent("external-integration");
    expect(externalIntegration?.properties?.selectedService).toBe("");
    expect(externalIntegration?.properties?.method).toBe("POST");
    expect(externalIntegration?.properties?.iconPosition).toBe("left");

    expect(getComponent("heading")?.properties?.level).toBe(1);
    expect(getComponent("heading")?.properties?.textAlign).toBe("left");

    const form = getComponent("form");
    expect(form?.properties?.name).toBe("form-name");
    expect(form?.components).toEqual([]);

    expect(getComponent("tabs")?.properties?.tabLayout).toBe("horizontal");
    expect(getComponent("tabs")?.properties?.tabLevel).toBe("L1");
    expect(getComponent("workflow-stage")?.category).toBe("component");
    expect(getComponent("payment-checkout")?.category).toBe("component");
  });

  it("preserves default values for form components", () => {
    expect(getComponent("input")?.properties?.inputType).toBe("text");
    expect(getComponent("text-area")?.properties?.languageMode).toBe("text");
    expect(getComponent("select")?.properties?.isFetchingFromApi).toBe(false);
    expect(getComponent("multi-select")?.properties?.showLabel).toBe(true);
    expect(getComponent("checkbox-group")?.properties?.showSingleOption).toBe(
      false,
    );
    expect(getComponent("toggle-button")?.properties?.checked).toBe(false);
    expect(getComponent("radio-group")?.properties?.options?.length).toBe(2);
    expect(getComponent("contact")?.properties?.contactType).toBe(
      "Mobile Number",
    );

    const repeatableSubSection = getComponent("repeatable-sub-section");
    expect(repeatableSubSection?.properties?.isCollapsible).toBe(false);
    expect(repeatableSubSection?.properties?.subsectionHeaders?.length).toBe(1);

    const formRow = getComponent("form-row");
    expect(formRow?.properties?.columns).toBe(2);
    expect(formRow?.properties?.repeatRows).toBe(false);
    expect(formRow?.viewCategory).toBeUndefined();

    expect(getComponent("input-table")?.properties?.inputColumns?.length).toBe(
      3,
    );
    expect(getComponent("date")?.properties?.format).toBe("DD/MM/YYYY");
    expect(getComponent("hidden-field")?.properties?.name).toBe("");
    expect(getComponent("file-upload")?.properties?.isMultiSelect).toBe(false);
    expect(getComponent("questionnaire")?.properties?.name).toBe("");
    expect(getComponent("financial-details")?.properties?.name).toBe("");
    expect(getComponent("transfer-list")?.properties?.fromListTitle).toBe(
      "Available Items",
    );
    expect(getComponent("image-capture")?.properties?.camera).toBe(
      "environment",
    );
    expect(getComponent("image-capture")?.properties?.maxSizeKB).toBe(2048);
    expect(getComponent("image-capture")?.isNewComponent).toBe(true);
    expect(getComponent("condition-builder")?.properties).toEqual({});
    expect(getComponent("maps")?.properties).toEqual({});
    expect(getComponent("route-plan")?.properties).toEqual({});
    expect(getComponent("numeric-slider")?.properties?.sliderMax).toBe("100");
    expect(getComponent("time")?.properties?.label).toBe("Enter time");
  });
});

describe("availableComponents pane metadata", () => {
  const paneComponents = availableComponents.filter(
    (component) => component.viewCategory,
  );

  it("keeps pane-visible components in the current order and excludes form-row", () => {
    expect(paneComponents.map((component) => component.type)).toEqual(
      expectedPaneTypes,
    );
    expect(getComponent("form-row")?.viewCategory).toBeUndefined();
  });

  it("provides the required view metadata for every pane-visible component", () => {
    paneComponents.forEach((component) => {
      expect(component.viewCategory).toBeDefined();
      expect(component.description).toBeTruthy();
      expect(Array.isArray(component.keywords)).toBe(true);
    });
  });

  it("provides an icon mapping for every pane-visible component", () => {
    expect(
      paneComponents.every((component) => componentPaneIconMap[component.type]),
    ).toBe(true);
  });

  it("returns title overrides and falls back to display names", () => {
    for (const [type, title] of Object.entries(titleOverrides)) {
      expect(getComponentTitle(type)).toBe(title);
    }

    expect(getComponentTitle("heading")).toBe("Heading");
    expect(getComponentTitle("sub-section")).toBe("Section");
    expect(getComponentTitle("form-row")).toBe("Form Row");
    expect(getComponentTitle("missing-component")).toBeUndefined();
  });

  it("exports the category order used by the pane", () => {
    expect(componentPaneV2CategoryOrder).toEqual([
      "containers",
      "inputs",
      "choices",
      "display",
      "utilities",
      "domain",
    ]);
    expect(componentPaneV2CategoryLabels.domain).toBe("Domain");
  });

  it("keeps component types unique", () => {
    const componentTypes = availableComponents.map(
      (component) => component.type,
    );

    expect(componentTypes).toHaveLength(new Set(componentTypes).size);
  });

  it("keeps pane-visible component metadata complete", () => {
    const invalidViewComponents = availableComponents.filter(
      (component) =>
        component.viewCategory &&
        (!component.description || !Array.isArray(component.keywords)),
    );

    expect(invalidViewComponents).toEqual([]);
  });
});
