import {
  maxHeadingLevels,
  inputTypes,
  contactTypes,
  textAreaTypes,
  textAlignTypes,
  borderStyleType,
  pinTo,
  DATE_ERROR_MESSAGE,
  DEFAULT_DATE_FORMAT,
  DEFAULT_DATE_SEPARATOR,
  TEXT_CASE,
  actionTypes,
  externalServices,
  DIRECTION,
  ALIGNMENT,
  JUSTIFICATION,
  micrositeActionTypes,
  requestBodyTypes,
  POSITIONS,
  ROUTING_TYPE,
  BEHAVIOR_TYPE,
  MicrositeHeaders,
  PropertyPanels,
  DefaultButtonIconSize,
  DefaultInputIconSize,
  DefaultButtonIconPosition,
  DefaultButtonTextSize,
  DefaultButtonTextColor,
  DefaultButtonIconSpacing,
  DefaultInputIconSpacing,
  DefaultButtonIconUploadType,
  InputKeyFormat,
  HELPER_TEXT_POSITION,
  MAX_FORMS_LIMIT,
  displayColumnTypes,
  inputColumnTypes,
  columnDataTypes,
  columnInputFieldTypes,
  separatorOptions,
  filterTypes,
  buttonTypes,
  VALIDATION_INTERCEPTOR_JS_SNIPPET,
  VALIDATION_TABLE_INTERCEPTOR_JS_SNIPPET,
  CURRENCY,
  DATE_FORMAT,
  RESTRICTED_ELEMENTS,
  dynamicContionsTitles,
  dynamicConditionsType,
  toggleDynamicTooltips,
  OPERATORS,
  LOGICAL_OPERATORS,
  keysToRemove,
  DATA_TYPE_CONFIG,
  MASTER_NAME,
} from "./constants";

describe("Constants", () => {
  describe("Primitive Values", () => {
    test("maxHeadingLevels should be 4", () => {
      expect(maxHeadingLevels).toBe(4);
    });

    test("DATE_ERROR_MESSAGE should be correct", () => {
      expect(DATE_ERROR_MESSAGE).toBe("Enter Valid Date");
    });

    test("DEFAULT_DATE_FORMAT should be 'DD/MM/YYYY'", () => {
      expect(DEFAULT_DATE_FORMAT).toBe("DD/MM/YYYY");
    });

    test("DEFAULT_DATE_SEPARATOR should be '/'", () => {
      expect(DEFAULT_DATE_SEPARATOR).toBe("/");
    });

    test("MAX_FORMS_LIMIT should be 999", () => {
      expect(MAX_FORMS_LIMIT).toBe(999);
    });

    test("MASTER_NAME should be 'PLATFORMSUBSYSTEM'", () => {
      expect(MASTER_NAME).toBe("PLATFORMSUBSYSTEM");
    });

    test("InputKeyFormat should be a RegExp", () => {
      expect(InputKeyFormat).toBeInstanceOf(RegExp);
      // Validates exclusion of special chars except allowed ones
      expect("abc@#$123".replace(InputKeyFormat, "")).toBe("abc123");
    });
  });

  describe("Simple Arrays (Strings)", () => {
    test("inputTypes should contain expected types", () => {
      expect(inputTypes).toEqual([
        "text",
        "number",
        "email",
        "password",
        "location",
      ]);
    });

    test("contactTypes should contain expected types", () => {
      expect(contactTypes).toEqual(["Mobile Number", "Telephone Number"]);
    });

    test("textAreaTypes should contain expected types", () => {
      expect(textAreaTypes).toEqual(["text", "json"]);
    });

    test("textAlignTypes should equal ['left', 'center', 'right']", () => {
      expect(textAlignTypes).toEqual(["left", "center", "right", "stretch"]);
    });

    test("borderStyleType should match expected styles", () => {
      expect(borderStyleType).toEqual(["solid", "dashed", "dotted", "none"]);
    });

    test("pinTo should equal ['Top', 'Bottom']", () => {
      expect(pinTo).toEqual(["Top", "Bottom"]);
    });

    test("TEXT_CASE should match expected cases", () => {
      expect(TEXT_CASE).toEqual([
        "Default",
        "Capitalized",
        "All Caps",
        "All Small",
      ]);
    });

    test("RESTRICTED_ELEMENTS should include all restricted types", () => {
      expect(RESTRICTED_ELEMENTS).toEqual([
        "form-row",
        "sub-section",
        "repeatable-sub-section",
        "input-grid",
        "input-grid-row",
        "stack",
      ]);
    });

    test("keysToRemove should contain specific keys", () => {
      expect(keysToRemove).toEqual([
        "icon",
        "isNewComponent",
        "suffixIconUploadType",
        "prefixIconUploadType",
      ]);
    });

    test("MicrositeHeaders should be empty", () => {
      expect(MicrositeHeaders).toEqual([]);
    });
  });

  describe("Complex Arrays (Objects)", () => {
    test("actionTypes should have expected properties", () => {
      expect(actionTypes).toHaveLength(6);
      expect(actionTypes[0]).toEqual({ value: "submit", label: "Submit" });
    });

    test("externalServices should have expected properties", () => {
      expect(externalServices).toEqual([
        { value: "kyc-verification", label: "KYC Verification" },
        { value: "account-aggregator", label: "Account Aggregator" },
        {
          value: "offline-kyc-verification",
          label: "Offline KYC Verification",
        },
        { value: "mandate-registration", label: "Mandate Registration" },
      ]);
    });

    test("DIRECTION should contain Row and Column", () => {
      expect(DIRECTION).toEqual([
        { label: "Horizontal", value: "row" },
        { label: "Vertical", value: "column" },
      ]);
    });

    test("ALIGNMENT should contain flex properties", () => {
      expect(ALIGNMENT).toHaveLength(4);
      expect(ALIGNMENT[0]).toEqual({ value: "flex-start", label: "Top" });
    });

    test("JUSTIFICATION should contain flex properties", () => {
      expect(JUSTIFICATION).toHaveLength(6);
      expect(JUSTIFICATION[0]).toEqual({ value: "flex-start", label: "Start" });
    });

    test("micrositeActionTypes should have Internal/External", () => {
      expect(micrositeActionTypes).toEqual([
        { value: "internal", label: "Internal" },
        { value: "external", label: "External" },
      ]);
    });

    test("requestBodyTypes should have Flat/Custom", () => {
      expect(requestBodyTypes).toEqual([
        { value: "flat", label: "Flat" },
        { value: "custom", label: "Custom" },
      ]);
    });

    test("POSITIONS should have Left/Right", () => {
      expect(POSITIONS).toEqual([
        { value: "left", label: "Left" },
        { value: "right", label: "Right" },
      ]);
    });

    test("ROUTING_TYPE should contain routing options", () => {
      expect(ROUTING_TYPE).toHaveLength(4);
      expect(ROUTING_TYPE[0]).toEqual({ value: "Internal", label: "Internal" });
    });

    test("BEHAVIOR_TYPE should contain Navigation/MultiSelect", () => {
      expect(BEHAVIOR_TYPE).toEqual([
        { value: "navigation", label: "Navigation" },
        { value: "multiSelect", label: "Multi Select" },
      ]);
    });

    test("HELPER_TEXT_POSITION should equal expected options", () => {
      expect(HELPER_TEXT_POSITION).toEqual([
        { label: "Info Icon with Tooltip", value: "infoIcon" },
        { label: "Below the Input", value: "belowInput" },
      ]);
    });

    test("separatorOptions should have expected options", () => {
      expect(separatorOptions).toEqual([
        { value: "/", label: "/" },
        { value: "-", label: "-" },
        { value: ".", label: "." },
        { value: " ", label: "Space" },
      ]);
    });

    test("filterTypes should have expected structure", () => {
      expect(filterTypes).toHaveLength(4);
      expect(filterTypes[0]).toEqual({
        label: "Text search",
        value: "partialMatch",
      });
    });

    test("buttonTypes should have expected structure", () => {
      expect(buttonTypes).toEqual([
        { value: "primary", label: "Primary" },
        { value: "secondary", label: "Secondary" },
        { value: "tertiary", label: "Tertiary" },
        { value: "link", label: "Link" },
      ]);
    });

    test("CURRENCY should contain expected currencies", () => {
      expect(CURRENCY).toEqual([
        { label: "US Dollar (USD)", value: "en-US" },
        { label: "Indian Rupee (INR)", value: "en-IN" },
      ]);
    });

    test("DATE_FORMAT should contain expected formats", () => {
      expect(DATE_FORMAT).toHaveLength(2);
      expect(DATE_FORMAT[1].value).toContain("2-digit");
    });

    test("OPERATORS should contain comparison operators", () => {
      expect(OPERATORS).toHaveLength(9);
      expect(OPERATORS[0]).toEqual({ value: "==", label: "Equal (==)" });
    });

    test("LOGICAL_OPERATORS should contain AND/OR", () => {
      expect(LOGICAL_OPERATORS).toEqual([
        { value: "&&", label: "AND (&&)" },
        { value: "||", label: "OR (||)" },
      ]);
    });
  });

  describe("Column Types Configuration", () => {
    test("displayColumnTypes should contain 4 values", () => {
      expect(displayColumnTypes).toHaveLength(4);
      expect(displayColumnTypes[0].value).toBe("text");
    });

    test("inputColumnTypes should contain 12 values", () => {
      expect(inputColumnTypes).toHaveLength(12);
      expect(inputColumnTypes[9].value).toBe("condition-builder");
    });

    test("inputColumnTypes should include condition-builder", () => {
      expect(inputColumnTypes).toContainEqual({
        value: "condition-builder",
        label: "Condition Builder",
      });
    });

    test("inputColumnTypes should include image-capture", () => {
      expect(inputColumnTypes).toContainEqual({
        value: "image-capture",
        label: "Image Capture",
      });
    });

    test("inputColumnTypes should include file-upload", () => {
      expect(inputColumnTypes).toContainEqual({
        value: "file-upload",
        label: "File Upload",
      });
    });

    test("columnDataTypes should contain 10 values", () => {
      expect(columnDataTypes).toHaveLength(10);
      expect(columnDataTypes[0].value).toBe("text");
    });

    test("columnDataTypes should include condition-builder", () => {
      const conditionBuilder = columnDataTypes.find(
        (type) => type.value === "condition-builder",
      );
      expect(conditionBuilder).toBeDefined();
      expect(conditionBuilder?.label).toBe("Condition Builder");
    });

    test("columnInputFieldTypes should contain 9 values", () => {
      expect(columnInputFieldTypes).toHaveLength(9);
      expect(columnInputFieldTypes[2].value).toBe("label");
    });
  });

  describe("Defaults", () => {
    test("Default Constants should have correct values", () => {
      expect(DefaultButtonIconSize).toBe(20);
      expect(DefaultInputIconSize).toBe(30);
      expect(DefaultButtonIconPosition).toBe("left");
      expect(DefaultButtonTextSize).toBe(14);
      expect(DefaultButtonTextColor).toBe("#ffffff");
      expect(DefaultButtonIconSpacing).toBe(5);
      expect(DefaultInputIconSpacing).toBe(0);
      expect(DefaultButtonIconUploadType).toBe("file-upload");
    });
  });

  describe("Enums and Objects", () => {
    test("PropertyPanels enum should exist", () => {
      expect(PropertyPanels.ButtonPanel).toBe("ButtonPanel");
      expect(PropertyPanels.TextPanel).toBe("TextPanel");
      expect(Object.keys(PropertyPanels).length).toBeGreaterThan(20);
    });

    test("dynamicContionsTitles should match object", () => {
      expect(dynamicContionsTitles).toEqual({
        visibilityConditions: "Visibility",
        enableDisableConditions: "Enable disable",
        requiredFieldConditions: "Required field",
        dynamicOptions: "Dynamic options",
      });
    });

    test("dynamicConditionsType should match object", () => {
      expect(dynamicConditionsType).toEqual({
        visibilityConditions: "Visible",
        enableDisableConditions: "Enable",
        requiredFieldConditions: "Required",
      });
    });

    test("toggleDynamicTooltips should match object structure", () => {
      expect(toggleDynamicTooltips.visibilityConditions.true).toBe("Visible");
      expect(toggleDynamicTooltips.enableDisableConditions.false).toBe(
        "Disable",
      );
    });

    test("DATA_TYPE_CONFIG should be a record with correct configuration", () => {
      expect(DATA_TYPE_CONFIG.pages).toEqual(
        expect.objectContaining({
          label: "Pages",
          endpoint: "/api/v1/config/pages",
          requiresWorkspace: true,
        }),
      );
      expect(DATA_TYPE_CONFIG.microsites.supportsVersioning).toBe(true);
      expect(DATA_TYPE_CONFIG.workspace.requiresWorkspace).toBe(false);
    });
  });

  describe("Code Snippets", () => {
    test("VALIDATION_INTERCEPTOR_JS_SNIPPET should be correct", () => {
      expect(VALIDATION_INTERCEPTOR_JS_SNIPPET).toContain("const validate");
      expect(VALIDATION_INTERCEPTOR_JS_SNIPPET).toContain(
        "// enter your logic here",
      );
    });

    test("VALIDATION_TABLE_INTERCEPTOR_JS_SNIPPET should be correct", () => {
      expect(VALIDATION_TABLE_INTERCEPTOR_JS_SNIPPET).toContain(
        "const validate",
      );
      expect(VALIDATION_TABLE_INTERCEPTOR_JS_SNIPPET).toContain("$allRows");
    });
  });
});
