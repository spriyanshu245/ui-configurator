import { ComponentProperty } from "./componentProperties";

describe("ComponentProperty Enum", () => {
  it("should be defined", () => {
    expect(ComponentProperty).toBeDefined();
  });

  it("should contain FetchDisplayValueFromApi property", () => {
    expect(ComponentProperty.FetchDisplayValueFromApi).toBe(
      "fetchDisplayValueFromApi"
    );
  });

  it("should contain FetchDisplayValueApiUrl property", () => {
    expect(ComponentProperty.FetchDisplayValueApiUrl).toBe(
      "fetchDisplayValueApiUrl"
    );
  });

  it("should contain FetchDisplayValueApiKey property", () => {
    expect(ComponentProperty.FetchDisplayValueApiKey).toBe(
      "fetchDisplayValueApiKey"
    );
  });

  it("should contain FetchDisplayValueApiHeaders property", () => {
    expect(ComponentProperty.FetchDisplayValueApiHeaders).toBe(
      "fetchDisplayValueApiHeaders"
    );
  });

  describe("Display Value Properties Order", () => {
    it("should have FetchDisplayValueFromApi defined before related API properties", () => {
      const allProperties = Object.values(ComponentProperty);
      const fromApiIndex = allProperties.indexOf("fetchDisplayValueFromApi");
      const apiUrlIndex = allProperties.indexOf("fetchDisplayValueApiUrl");
      const apiKeyIndex = allProperties.indexOf("fetchDisplayValueApiKey");
      const apiHeadersIndex = allProperties.indexOf(
        "fetchDisplayValueApiHeaders"
      );

      expect(fromApiIndex).toBeGreaterThan(-1);
      expect(apiUrlIndex).toBeGreaterThan(-1);
      expect(apiKeyIndex).toBeGreaterThan(-1);
      expect(apiHeadersIndex).toBeGreaterThan(-1);

      // FetchDisplayValueFromApi should come before the other three
      expect(fromApiIndex).toBeLessThan(apiUrlIndex);
      expect(fromApiIndex).toBeLessThan(apiKeyIndex);
      expect(fromApiIndex).toBeLessThan(apiHeadersIndex);
    });
  });

  describe("Basic Properties", () => {
    it("should contain Text property", () => {
      expect(ComponentProperty.Text).toBe("text");
    });

    it("should contain Name property", () => {
      expect(ComponentProperty.Name).toBe("name");
    });

    it("should contain Label property", () => {
      expect(ComponentProperty.Label).toBe("label");
    });

    it("should contain Required property", () => {
      expect(ComponentProperty.Required).toBe("required");
    });

    it("should contain Disabled property", () => {
      expect(ComponentProperty.Disabled).toBe("disabled");
    });
  });

  describe("API Related Properties", () => {
    it("should contain ApiUrl property", () => {
      expect(ComponentProperty.ApiUrl).toBe("apiUrl");
    });

    it("should contain ApiKey property", () => {
      expect(ComponentProperty.ApiKey).toBe("apiKey");
    });

    it("should contain ApiHeaders property", () => {
      expect(ComponentProperty.ApiHeaders).toBe("apiHeaders");
    });

    it("should contain Method property", () => {
      expect(ComponentProperty.Method).toBe("method");
    });

    it("should contain IsFetchingFromApi property", () => {
      expect(ComponentProperty.IsFetchingFromApi).toBe("isFetchingFromApi");
    });

    it("should contain OptionsApiKeyForMetadata property", () => {
      expect(ComponentProperty.OptionsApiKeyForMetadata).toBe(
        "optionsApiKeyForMetadata"
      );
    });
  });

  describe("Timer Properties", () => {
    it("should contain ConfigureTimer property", () => {
      expect(ComponentProperty.ConfigureTimer).toBe("configureTimer");
    });

    it("should contain Timer property", () => {
      expect(ComponentProperty.Timer).toBe("timer");
    });

    it("should contain TimerText property", () => {
      expect(ComponentProperty.TimerText).toBe("timerText");
    });

    it("should contain TimerUnit property", () => {
      expect(ComponentProperty.TimerUnit).toBe("timerUnit");
    });
  });

  describe("Input Properties", () => {
    it("should contain InputType property", () => {
      expect(ComponentProperty.InputType).toBe("inputType");
    });

    it("should contain Placeholder property", () => {
      expect(ComponentProperty.Placeholder).toBe("placeholder");
    });

    it("should contain DefaultValue property", () => {
      expect(ComponentProperty.DefaultValue).toBe("defaultValue");
    });
  });

  describe("Table Properties", () => {
    it("should contain TableColumns property", () => {
      expect(ComponentProperty.TableColumns).toBe("tableColumns");
    });

    it("should contain ColumnInputType property", () => {
      expect(ComponentProperty.ColumnInputType).toBe("columnInputType");
    });
  });

  describe("Mobile Card View Properties", () => {
    it("should contain MobileCardViewEnabled property", () => {
      expect(ComponentProperty.MobileCardViewEnabled).toBe(
        "mobileCardViewEnabled"
      );
    });

    it("should contain CardTitleColumn property", () => {
      expect(ComponentProperty.CardTitleColumn).toBe("cardTitleColumn");
    });

    it("should contain CardSubtitleColumn property", () => {
      expect(ComponentProperty.CardSubtitleColumn).toBe("cardSubtitleColumn");
    });

    it("should contain CardStatusColumn property", () => {
      expect(ComponentProperty.CardStatusColumn).toBe("cardStatusColumn");
    });

    it("should contain CardViewVisibility property", () => {
      expect(ComponentProperty.CardViewVisibility).toBe("cardViewVisibility");
    });
  });

  describe("Table Properties", () => {
    it("should contain AutoSelectSingleRow property", () => {
      expect(ComponentProperty.AutoSelectSingleRow).toBe("autoSelectSingleRow");
    });

    it("should contain SingleSelectRow property", () => {
      expect(ComponentProperty.SingleSelectRow).toBe("singleSelectRow");
    });
  });

  describe("Validation Properties", () => {
    it("should contain MinLength property", () => {
      expect(ComponentProperty.MinLength).toBe("minLength");
    });

    it("should contain MaxLength property", () => {
      expect(ComponentProperty.MaxLength).toBe("maxLength");
    });

    it("should contain Pattern property", () => {
      expect(ComponentProperty.Pattern).toBe("pattern");
    });

    it("should contain ValidationMessage property", () => {
      expect(ComponentProperty.ValidationMessage).toBe("validationMessage");
    });
  });

  describe("File Upload Properties", () => {
    it("should contain EnableImageCapture property", () => {
      expect(ComponentProperty.EnableImageCapture).toBe("enableImageCapture");
    });
  });

  describe("Enum Values Uniqueness", () => {
    it("should have unique values for all enum properties", () => {
      const values = Object.values(ComponentProperty);
      const uniqueValues = new Set(values);
      expect(values.length).toBe(uniqueValues.size);
    });
  });
});
