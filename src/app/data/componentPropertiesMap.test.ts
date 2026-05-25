import { componentPropertiesMap } from "./componentPropertiesMap";
import { ComponentProperty } from "./componentProperties";

describe("componentPropertiesMap", () => {
  it("should be defined", () => {
    expect(componentPropertiesMap).toBeDefined();
  });

  it("should be an object", () => {
    expect(typeof componentPropertiesMap).toBe("object");
  });

  it("should contain mappings for external-integration", () => {
    expect(componentPropertiesMap["external-integration"]).toBeDefined();
    expect(componentPropertiesMap["external-integration"]).toContain(
      ComponentProperty.ShowLabel
    );
    expect(componentPropertiesMap["external-integration"]).toContain(
      ComponentProperty.Label
    );
  });

  it("should contain mappings for heading", () => {
    expect(componentPropertiesMap["heading"]).toBeDefined();
    expect(componentPropertiesMap["heading"]).toContain(ComponentProperty.Text);
    expect(componentPropertiesMap["heading"]).toContain(
      ComponentProperty.Level
    );
    expect(componentPropertiesMap["heading"]).toContain(
      ComponentProperty.TextAlign
    );
  });

  it("should contain mappings for typograph", () => {
    expect(componentPropertiesMap["typograph"]).toBeDefined();
    expect(componentPropertiesMap["typograph"]).toContain(
      ComponentProperty.Name
    );
    expect(componentPropertiesMap["typograph"]).toContain(
      ComponentProperty.Text
    );
    expect(componentPropertiesMap["typograph"]).toContain(
      ComponentProperty.FetchDisplayValueFromApi
    );
    expect(componentPropertiesMap["typograph"]).toContain(
      ComponentProperty.FetchDisplayValueApiUrl
    );
    expect(componentPropertiesMap["typograph"]).toContain(
      ComponentProperty.FetchDisplayValueApiKey
    );
    expect(componentPropertiesMap["typograph"]).toContain(
      ComponentProperty.FetchDisplayValueApiHeaders
    );
    expect(componentPropertiesMap["typograph"]).toContain(
      ComponentProperty.IsRichTextEditor
    );
    expect(componentPropertiesMap["typograph"]).toContain(
      ComponentProperty.RichTextEditor
    );
    expect(componentPropertiesMap["typograph"]).toContain(
      ComponentProperty.ShowHyphen
    );
  });

  it("should contain mappings for image", () => {
    expect(componentPropertiesMap["image"]).toBeDefined();
    expect(componentPropertiesMap["image"]).toContain(ComponentProperty.Src);
    expect(componentPropertiesMap["image"]).toContain(ComponentProperty.Alt);
  });

  it("should contain mappings for image-capture", () => {
    expect(componentPropertiesMap["image-capture"]).toBeDefined();
    expect(componentPropertiesMap["image-capture"]).toContain(
      ComponentProperty.Name
    );
    expect(componentPropertiesMap["image-capture"]).toContain(
      ComponentProperty.ShowLabel
    );
    expect(componentPropertiesMap["image-capture"]).toContain(
      ComponentProperty.Label
    );
    expect(componentPropertiesMap["image-capture"]).toContain(
      ComponentProperty.Required
    );
    expect(componentPropertiesMap["image-capture"]).toContain(
      ComponentProperty.Metadata
    );
  });

  it("should contain mappings for form", () => {
    expect(componentPropertiesMap["form"]).toBeDefined();
    expect(componentPropertiesMap["form"]).toContain(ComponentProperty.Name);
    expect(componentPropertiesMap["form"]).toContain(
      ComponentProperty.NameKeyIds
    );
  });

  it("should contain mappings for sub-section", () => {
    expect(componentPropertiesMap["sub-section"]).toBeDefined();
    expect(componentPropertiesMap["sub-section"]).toContain(
      ComponentProperty.ShowLabel
    );
    expect(componentPropertiesMap["sub-section"]).toContain(
      ComponentProperty.Label
    );
    expect(componentPropertiesMap["sub-section"]).toContain(
      ComponentProperty.IsCollapsible
    );
  });

  it("should contain mappings for spacer", () => {
    expect(componentPropertiesMap["spacer"]).toBeDefined();
    expect(componentPropertiesMap["spacer"]).toContain(
      ComponentProperty.Height
    );
  });

  it("should contain mappings for divider", () => {
    expect(componentPropertiesMap["divider"]).toBeDefined();
    expect(componentPropertiesMap["divider"]).toContain(
      ComponentProperty.Width
    );
    expect(componentPropertiesMap["divider"]).toContain(
      ComponentProperty.Height
    );
  });

  it("should contain mappings for input", () => {
    expect(componentPropertiesMap["input"]).toBeDefined();
    expect(componentPropertiesMap["input"]).toContain(ComponentProperty.Name);
    expect(componentPropertiesMap["input"]).toContain(
      ComponentProperty.InputType
    );
    expect(componentPropertiesMap["input"]).toContain(
      ComponentProperty.Placeholder
    );
  });

  it("should contain mappings for text-area", () => {
    expect(componentPropertiesMap["text-area"]).toBeDefined();
    expect(componentPropertiesMap["text-area"]).toContain(
      ComponentProperty.Name
    );
    expect(componentPropertiesMap["text-area"]).toContain(
      ComponentProperty.RowCount
    );
  });

  it("should contain mappings for select", () => {
    expect(componentPropertiesMap["select"]).toBeDefined();
    expect(componentPropertiesMap["select"]).toContain(ComponentProperty.Name);
    expect(componentPropertiesMap["select"]).toContain(
      ComponentProperty.Options
    );
    expect(componentPropertiesMap["select"]).toContain(
      ComponentProperty.DefaultValue
    );
    expect(componentPropertiesMap["select"]).toContain(
      ComponentProperty.IsFetchingFromApi
    );
    expect(componentPropertiesMap["select"]).toContain(
      ComponentProperty.OptionsApiKeyForMetadata
    );
  });

  it("should contain mappings for multi-select", () => {
    expect(componentPropertiesMap["multi-select"]).toBeDefined();
    expect(componentPropertiesMap["multi-select"]).toContain(
      ComponentProperty.Name
    );
    expect(componentPropertiesMap["multi-select"]).toContain(
      ComponentProperty.EnableSearch
    );
  });

  it("should contain mappings for checkbox-group", () => {
    expect(componentPropertiesMap["checkbox-group"]).toBeDefined();
    expect(componentPropertiesMap["checkbox-group"]).toContain(
      ComponentProperty.Name
    );
    expect(componentPropertiesMap["checkbox-group"]).toContain(
      ComponentProperty.Options
    );
  });

  it("should contain mappings for radio-group", () => {
    expect(componentPropertiesMap["radio-group"]).toBeDefined();
    expect(componentPropertiesMap["radio-group"]).toContain(
      ComponentProperty.Name
    );
    expect(componentPropertiesMap["radio-group"]).toContain(
      ComponentProperty.Options
    );
  });

  it("should contain mappings for field-group", () => {
    expect(componentPropertiesMap["field-group"]).toBeDefined();
    expect(componentPropertiesMap["field-group"]).toContain(
      ComponentProperty.Name
    );
    expect(componentPropertiesMap["field-group"]).toContain(
      ComponentProperty.Components
    );
  });

  it("should contain mappings for date", () => {
    expect(componentPropertiesMap["date"]).toBeDefined();
    expect(componentPropertiesMap["date"]).toContain(ComponentProperty.Name);
    expect(componentPropertiesMap["date"]).toContain(
      ComponentProperty.DateSeparator
    );
    expect(componentPropertiesMap["date"]).toContain(ComponentProperty.MinDate);
    expect(componentPropertiesMap["date"]).toContain(ComponentProperty.MaxDate);
  });

  it("should contain mappings for form-row", () => {
    expect(componentPropertiesMap["form-row"]).toBeDefined();
    expect(componentPropertiesMap["form-row"]).toContain(
      ComponentProperty.Name
    );
    expect(componentPropertiesMap["form-row"]).toContain(
      ComponentProperty.Columns
    );
  });

  it("should contain mappings for table", () => {
    expect(componentPropertiesMap["table"]).toBeDefined();
    expect(componentPropertiesMap["table"]).toContain(ComponentProperty.Name);
    expect(componentPropertiesMap["table"]).toContain(
      ComponentProperty.TableColumns
    );
  });

  it("should contain mobile card view properties for table", () => {
    expect(componentPropertiesMap["table"]).toContain(
      ComponentProperty.MobileCardViewEnabled
    );
    expect(componentPropertiesMap["table"]).toContain(
      ComponentProperty.CardTitleColumn
    );
    expect(componentPropertiesMap["table"]).toContain(
      ComponentProperty.CardSubtitleColumn
    );
    expect(componentPropertiesMap["table"]).toContain(
      ComponentProperty.CardStatusColumn
    );
  });

  it("should contain AutoSelectSingleRow for table", () => {
    expect(componentPropertiesMap["table"]).toContain(
      ComponentProperty.AutoSelectSingleRow
    );
  });

  it("should contain SingleSelectRow for table", () => {
    expect(componentPropertiesMap["table"]).toContain(
      ComponentProperty.SingleSelectRow
    );
  });

  it("should contain CardViewVisibility for table-column", () => {
    expect(componentPropertiesMap["table-column"]).toContain(
      ComponentProperty.CardViewVisibility
    );
  });

  it("should contain mappings for input-table", () => {
    expect(componentPropertiesMap["input-table"]).toBeDefined();
    expect(componentPropertiesMap["input-table"]).toContain(
      ComponentProperty.Name
    );
    expect(componentPropertiesMap["input-table"]).toContain(
      ComponentProperty.InputColumns
    );
  });

  it("should contain mappings for toggle-button", () => {
    expect(componentPropertiesMap["toggle-button"]).toBeDefined();
    expect(componentPropertiesMap["toggle-button"]).toContain(
      ComponentProperty.Name
    );
    expect(componentPropertiesMap["toggle-button"]).toContain(
      ComponentProperty.DefaultValue
    );
  });

  it("should contain mappings for table-column", () => {
    expect(componentPropertiesMap["table-column"]).toBeDefined();
    expect(componentPropertiesMap["table-column"]).toContain(
      ComponentProperty.ColumnInputType
    );
    expect(componentPropertiesMap["table-column"]).toContain(
      ComponentProperty.Name
    );
    expect(componentPropertiesMap["table-column"]).toContain(
      ComponentProperty.DialectCode
    );
  });

  it("should contain mappings for input-table-column", () => {
    expect(componentPropertiesMap["input-table-column"]).toBeDefined();
    expect(componentPropertiesMap["input-table-column"]).toContain(
      ComponentProperty.ColumnInputType
    );
    expect(componentPropertiesMap["input-table-column"]).toContain(
      ComponentProperty.Name
    );
    expect(componentPropertiesMap["input-table-column"]).toContain(
      ComponentProperty.DialectCode
    );
    expect(componentPropertiesMap["input-table-column"]).toContain(
      ComponentProperty.IsMultiSelect
    );
    expect(componentPropertiesMap["input-table-column"]).toContain(
      ComponentProperty.Metadata
    );
  });

  it("should contain mappings for data-grid", () => {
    expect(componentPropertiesMap["data-grid"]).toBeDefined();
    expect(componentPropertiesMap["data-grid"]).toContain(
      ComponentProperty.Name
    );
    expect(componentPropertiesMap["data-grid"]).toContain(
      ComponentProperty.GridData
    );
  });

  it("should contain mappings for repeatable-sub-section", () => {
    expect(componentPropertiesMap["repeatable-sub-section"]).toBeDefined();
    expect(componentPropertiesMap["repeatable-sub-section"]).toContain(
      ComponentProperty.Name
    );
    expect(componentPropertiesMap["repeatable-sub-section"]).toContain(
      ComponentProperty.IsCollapsible
    );
  });

  it("should contain mappings for microsite-page", () => {
    expect(componentPropertiesMap["microsite-page"]).toBeDefined();
    expect(componentPropertiesMap["microsite-page"]).toContain(
      ComponentProperty.ShowAsPopup
    );
  });

  it("should contain mappings for tabs", () => {
    expect(componentPropertiesMap["tabs"]).toBeDefined();
    expect(componentPropertiesMap["tabs"]).toContain(
      ComponentProperty.TabLayout
    );
    expect(componentPropertiesMap["tabs"]).toContain(
      ComponentProperty.TabLevel
    );
  });

  it("should contain mappings for input-grid", () => {
    expect(componentPropertiesMap["input-grid"]).toBeDefined();
    expect(componentPropertiesMap["input-grid"]).toContain(
      ComponentProperty.Name
    );
    expect(componentPropertiesMap["input-grid"]).toContain(
      ComponentProperty.ColumnHeaders
    );
  });

  it("should contain mappings for hidden-field", () => {
    expect(componentPropertiesMap["hidden-field"]).toBeDefined();
    expect(componentPropertiesMap["hidden-field"]).toContain(
      ComponentProperty.Name
    );
    expect(componentPropertiesMap["hidden-field"]).toContain(
      ComponentProperty.DefaultValue
    );
  });

  it("should contain mappings for button-v2", () => {
    expect(componentPropertiesMap["button-v2"]).toBeDefined();
    expect(componentPropertiesMap["button-v2"]).toContain(
      ComponentProperty.Label
    );
    expect(componentPropertiesMap["button-v2"]).toContain(
      ComponentProperty.ActionType
    );
    expect(componentPropertiesMap["button-v2"]).toContain(
      ComponentProperty.ConfigureTimer
    );
    expect(componentPropertiesMap["button-v2"]).toContain(
      ComponentProperty.Timer
    );
    expect(componentPropertiesMap["button-v2"]).toContain(
      ComponentProperty.TimerUnit
    );
    expect(componentPropertiesMap["button-v2"]).toContain(
      ComponentProperty.TimerText
    );
  });

  it("should contain mappings for file-upload", () => {
    expect(componentPropertiesMap["file-upload"]).toBeDefined();
    expect(componentPropertiesMap["file-upload"]).toContain(
      ComponentProperty.Name
    );
    expect(componentPropertiesMap["file-upload"]).toContain(
      ComponentProperty.IsMultiSelect
    );
    expect(componentPropertiesMap["file-upload"]).toContain(
      ComponentProperty.EnableImageCapture
    );
  });

  it("should contain mappings for questionnaire", () => {
    expect(componentPropertiesMap["questionnaire"]).toBeDefined();
    expect(componentPropertiesMap["questionnaire"]).toContain(
      ComponentProperty.Name
    );
    expect(componentPropertiesMap["questionnaire"]).toContain(
      ComponentProperty.Columns
    );
  });

  it("should contain mappings for contact", () => {
    expect(componentPropertiesMap["contact"]).toBeDefined();
    expect(componentPropertiesMap["contact"]).toContain(ComponentProperty.Name);
    expect(componentPropertiesMap["contact"]).toContain(
      ComponentProperty.ContactType
    );
  });

  it("should contain mappings for stack", () => {
    expect(componentPropertiesMap["stack"]).toBeDefined();
    expect(componentPropertiesMap["stack"]).toContain(ComponentProperty.Name);
    expect(componentPropertiesMap["stack"]).toContain(
      ComponentProperty.Columns
    );
    expect(componentPropertiesMap["stack"]).toContain(
      ComponentProperty.Direction
    );
  });

  it("should contain mappings for workflow-stage", () => {
    expect(componentPropertiesMap["workflow-stage"]).toBeDefined();
    expect(componentPropertiesMap["workflow-stage"]).toContain(
      ComponentProperty.ProcessIdKey
    );
    expect(componentPropertiesMap["workflow-stage"]).toContain(
      ComponentProperty.ApiUrl
    );
  });

  it("should contain mappings for financial-details", () => {
    expect(componentPropertiesMap["financial-details"]).toBeDefined();
    expect(componentPropertiesMap["financial-details"]).toContain(
      ComponentProperty.Name
    );
  });

  it("should contain mappings for transfer-list", () => {
    expect(componentPropertiesMap["transfer-list"]).toBeDefined();
    expect(componentPropertiesMap["transfer-list"]).toContain(
      ComponentProperty.Name
    );
    expect(componentPropertiesMap["transfer-list"]).toContain(
      ComponentProperty.FromListTitle
    );
    expect(componentPropertiesMap["transfer-list"]).toContain(
      ComponentProperty.ToListTitle
    );
  });

  it("should contain mappings for tree-structure", () => {
    expect(componentPropertiesMap["tree-structure"]).toBeDefined();
    expect(componentPropertiesMap["tree-structure"]).toContain(
      ComponentProperty.Name
    );
    expect(componentPropertiesMap["tree-structure"]).toContain(
      ComponentProperty.BehaviorType
    );
  });

  it("should contain mappings for payment-checkout", () => {
    expect(componentPropertiesMap["payment-checkout"]).toBeDefined();
    expect(componentPropertiesMap["payment-checkout"]).toContain(
      ComponentProperty.OrderIdPathKey
    );
    expect(componentPropertiesMap["payment-checkout"]).toContain(
      ComponentProperty.PollingTime
    );
  });

  it("should contain mappings for table-column with FetchDisplayValue properties", () => {
    expect(componentPropertiesMap["table-column"]).toBeDefined();
    expect(componentPropertiesMap["table-column"]).toContain(
      ComponentProperty.ColumnInputType
    );
    expect(componentPropertiesMap["table-column"]).toContain(
      ComponentProperty.FetchDisplayValueApiUrl
    );
    expect(componentPropertiesMap["table-column"]).toContain(
      ComponentProperty.FetchDisplayValueApiKey
    );
    expect(componentPropertiesMap["table-column"]).toContain(
      ComponentProperty.FetchDisplayValueApiHeaders
    );
  });

  it("should contain mappings for input-table-column with FetchDisplayValue properties", () => {
    expect(componentPropertiesMap["input-table-column"]).toBeDefined();
    expect(componentPropertiesMap["input-table-column"]).toContain(
      ComponentProperty.ColumnInputType
    );
    expect(componentPropertiesMap["input-table-column"]).toContain(
      ComponentProperty.FetchDisplayValueApiUrl
    );
    expect(componentPropertiesMap["input-table-column"]).toContain(
      ComponentProperty.FetchDisplayValueApiKey
    );
    expect(componentPropertiesMap["input-table-column"]).toContain(
      ComponentProperty.FetchDisplayValueApiHeaders
    );
  });

  it("should have correct number of component types", () => {
    const componentTypes = Object.keys(componentPropertiesMap);
    expect(componentTypes.length).toBeGreaterThan(0);
  });

  it("should have all values as arrays of ComponentProperty", () => {
    Object.values(componentPropertiesMap).forEach((properties) => {
      expect(Array.isArray(properties)).toBe(true);
      properties.forEach((prop) => {
        expect(Object.values(ComponentProperty)).toContain(prop);
      });
    });
  });
});
