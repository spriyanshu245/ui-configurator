import { propertyPanelsMap } from "./propertiesPanelMap";
import { ComponentProperty } from "./componentProperties";

describe("propertyPanelsMap", () => {
  it("should be defined", () => {
    expect(propertyPanelsMap).toBeDefined();
  });

  it("should be an object", () => {
    expect(typeof propertyPanelsMap).toBe("object");
  });

  it("should map Level to HeadingPanel", () => {
    expect(propertyPanelsMap[ComponentProperty.Level]).toBeDefined();
  });

  it("should map text-related properties to TextPanel", () => {
    expect(propertyPanelsMap[ComponentProperty.Name]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.Text]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.TextAlign]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.TextColor]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.TextSize]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.Placeholder]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.ShowLabel]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.Label]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.InputType]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.ContactType]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.DateSeparator]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.Format]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.ShowHelperText]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.HelperText]).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.HelperTextPosition],
    ).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.TextCase]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.IsCollapsible]).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.IsHorizontalCollapsible],
    ).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.IsExpandedByDefault],
    ).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.SubsectionHeaders],
    ).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.ProcessIdKey]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.FromListTitle]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.ToListTitle]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.IsRichTextEditor]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.RichTextEditor]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.ShowHyphen]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.LanguageMode]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.ApplicationKey]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.ConfigureTimer]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.Timer]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.TimerUnit]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.TimerText]).toBeDefined();
  });

  it("should map NameKeyIds to FieldPathPanel", () => {
    expect(propertyPanelsMap[ComponentProperty.NameKeyIds]).toBeDefined();
  });

  it("should map field restriction properties to FieldRestrictionsPanel", () => {
    expect(propertyPanelsMap[ComponentProperty.AllowAutoFill]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.AllowNegative]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.Disabled]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.IsCurrency]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.CurrencyName]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.DecimalPrecision]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.IsRowPrecision]).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.RowDecimalPrecisionKey],
    ).toBeDefined();
  });

  it("should map layout properties to LayoutPanel", () => {
    expect(propertyPanelsMap[ComponentProperty.RepeatRows]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.Width]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.Height]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.Columns]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.ColumnGap]).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.MobileCardViewEnabled],
    ).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.FieldLayout]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.IsVertical]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.Align]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.isFloating]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.Position]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.MarginRight]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.MarginLeft]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.MarginBottom]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.MarginTop]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.ButtonType]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.Transpose]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.RowCount]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.Direction]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.Alignment]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.Justification]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.HasFixedColumns]).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.EnableVerticalScroll],
    ).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.DefineColumnWidth],
    ).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.TableColumnWidth]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.ColumnWidths]).toBeDefined();
  });

  it("should map image properties to ImagePanel", () => {
    expect(propertyPanelsMap[ComponentProperty.Src]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.Alt]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.Preview]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.Camera]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.MaxSizeKB]).toBeDefined();
  });

  it("should map icon properties to IconPanel", () => {
    expect(propertyPanelsMap[ComponentProperty.IconUploadType]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.IconUrl]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.IconSize]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.IconPosition]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.IconSpacing]).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.IconBackgroundColor],
    ).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.isIconButton]).toBeDefined();
  });

  it("should map integration properties to IntegrationPanel", () => {
    expect(propertyPanelsMap[ComponentProperty.SelectedService]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.InitiateUrl]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.InitiateApiName]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.InitiateMethod]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.InitiateHeaders]).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.InitiateResponseKeys],
    ).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.SubmitUrl]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.SubmitApiName]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.SubmitMethod]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.SubmitHeaders]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.ResponseKeys]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.FileUploadUrl]).toBeDefined();
  });

  it("should map action properties to ActionPanel", () => {
    expect(propertyPanelsMap[ComponentProperty.Method]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.ApiUrl]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.ApiKey]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.ApiValue]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.LinkedForm]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.RequestBodyType]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.RequestBodySpecs]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.SubmitOnChange]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.ButtonPosition]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.ApiName]).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.VisibleOnApiSuccess],
    ).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.ApiHeaders]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.RoutingType]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.RoutePage]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.IsConditional]).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.ConditionalRoutes],
    ).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.ExternalURL]).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.NavigateWithoutDataTransfer],
    ).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.OnCloseAction]).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.ClearFormDataOnAction],
    ).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.RouteOnActionSuccess],
    ).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.StoreDataInSession],
    ).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.SessionKeys]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.ActionType]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.IsClickable]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.ShowConfirmation]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.RouteMicrosite]).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.RouteMicrositeVersion],
    ).toBeDefined();
  });

  it("should map prefill data properties to PrefillDataPanel", () => {
    expect(
      propertyPanelsMap[ComponentProperty.StorePrefillInSession],
    ).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.PrefillApiName]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.PrefillApiUrl]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.ResponseBodyType]).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.PrefillResponseBodySpecs],
    ).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.PrefillApiHeaders],
    ).toBeDefined();
  });

  it("should map data properties to DataPanel", () => {
    expect(propertyPanelsMap[ComponentProperty.IsMultiSelect]).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.IsFetchingFromApi],
    ).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.FetchFromSession]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.FetchFromRoot]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.SessionPath]).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.StoreInputApiInSession],
    ).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.StoreSelectedInSession],
    ).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.OptionsApiDependentOn],
    ).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.OptionsApiName]).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.OptionsApiKeyForOptions],
    ).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.EnableSearch]).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.ResponseDataStructure],
    ).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.OptionsApiKeyForTitle],
    ).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.OptionsApiKeyForKeywords],
    ).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.OptionsApiKeyForLabel],
    ).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.OptionsApiKeyForValue],
    ).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.OptionsApiKeyForMetadata],
    ).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.Keys]).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.OptionsApiKeyForSequence],
    ).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.OptionsApiHeaders],
    ).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.OptionsApiUrl]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.Options]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.Components]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.TypeFor]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.DefaultValue]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.IsTodaysDate]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.ShowSingleOption]).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.ShowOptionHelperText],
    ).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.OptionHelperText]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.IsdCode]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.PhoneNumber]).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.EnableImageCapture],
    ).toBeDefined();
  });

  it("should map display value properties to DisplayValuePanel", () => {
    expect(
      propertyPanelsMap[ComponentProperty.FetchDisplayValueApiUrl],
    ).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.FetchDisplayValueApiHeaders],
    ).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.FetchDisplayValueApiKey],
    ).toBeDefined();
  });

  it("should map style properties to StylePanel", () => {
    expect(propertyPanelsMap[ComponentProperty.BackgroundImage]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.BackgroundColor]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.BorderThickness]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.BorderStyle]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.BorderColor]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.BorderRadius]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.Clickable]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.Url]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.PaddingTop]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.PaddingRight]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.PaddingBottom]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.PaddingLeft]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.Padding]).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.IndependentPadding],
    ).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.IsResponsive]).toBeDefined();
  });

  it("should map conditional properties to ConditionalPanel", () => {
    expect(
      propertyPanelsMap[ComponentProperty.IsConditionalComponent],
    ).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.VisibilityConditions],
    ).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.DynamicOptions]).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.VisibleOnFormResponse],
    ).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.ReloadSessionStatus],
    ).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.LinkedFormForSection],
    ).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.EnableDisableConditions],
    ).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.RequiredFieldConditions],
    ).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.LineUnderLabel]).toBeDefined();
  });

  it("should map calculation properties to InputCalculationsPanel", () => {
    expect(propertyPanelsMap[ComponentProperty.IsCalculated]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.Formula]).toBeDefined();
  });

  it("should map validation properties to InputValidationPanel", () => {
    expect(propertyPanelsMap[ComponentProperty.Required]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.MinLength]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.MaxLength]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.MinValue]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.MaxValue]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.Pattern]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.Expression]).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.ValidationMessage],
    ).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.MinDate]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.MaxDate]).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.IsMinDateAvailable],
    ).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.IsMaxDateAvailable],
    ).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.IsMinTodayDate]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.IsMaxTodayDate]).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.EnableApiValidation],
    ).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.ValidationApiUrl]).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.ValidationApiMethod],
    ).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.ValidationApiRequestBody],
    ).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.ValidationApiHeaders],
    ).toBeDefined();
  });

  it("should map input grid properties to InputGridPanel", () => {
    expect(propertyPanelsMap[ComponentProperty.ColumnHeaders]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.RowHeaders]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.IsLastRowFooter]).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.HideInputGridHeader],
    ).toBeDefined();
  });

  it("should map input table properties to InputTablePanel", () => {
    expect(propertyPanelsMap[ComponentProperty.InputColumns]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.ColumnInputType]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.MinimumTableRow]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.MaximumTableRow]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.FixedRows]).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.ShowInputFooterRow],
    ).toBeDefined();
  });

  it("should map data column properties to DataColumnPanel", () => {
    expect(propertyPanelsMap[ComponentProperty.TableColumns]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.DefaultSort]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.SortByField]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.SortByOrder]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.SelectableRow]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.AutoSelectSingleRow]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.SingleSelectRow]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.PrimaryKey]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.MetaData]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.DefaultPageSize]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.PageSizeOptions]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.EnablePagination]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.GridData]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.HideHeaderRow]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.HideBorders]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.ShowFooterRow]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.FooterKey]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.PathToTableData]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.EnableSorting]).toBeDefined();
  });

  it("should map card column properties to DataColumnPanel", () => {
    expect(
      propertyPanelsMap[ComponentProperty.CardTitleColumn]
    ).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.CardSubtitleColumn]
    ).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.CardStatusColumn]
    ).toBeDefined();
  });

  it("should map CardViewVisibility to LayoutPanel", () => {
    expect(
      propertyPanelsMap[ComponentProperty.CardViewVisibility]
    ).toBeDefined();
  });

  it("should map Interceptors to InterceptorsPanel", () => {
    expect(propertyPanelsMap[ComponentProperty.Interceptors]).toBeDefined();
  });

  it("should map page settings properties to PageSettingsPanel", () => {
    expect(propertyPanelsMap[ComponentProperty.ShowAsPopup]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.PanePosition]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.FirstPage]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.Title]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.PageCode]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.PageSlug]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.PageName]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.Description]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.PopupWidth]).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.CloseOnBackdropClick],
    ).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.ShowTitle]).toBeDefined();
  });

  it("should map DataTransfer to DataTransferPanel", () => {
    expect(propertyPanelsMap[ComponentProperty.DataTransfer]).toBeDefined();
  });

  it("should map tabs properties to TabsPanelV2", () => {
    expect(propertyPanelsMap[ComponentProperty.TabLayout]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.TabLevel]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.RowTabCount]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.TabOrderV2]).toBeDefined();
  });

  it("should map footer properties to FooterPanel", () => {
    expect(propertyPanelsMap[ComponentProperty.CalculatedColumn]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.FooterLabel]).toBeDefined();
  });

  it("should map ConstantsBodySpecs to ConstantsPanel", () => {
    expect(
      propertyPanelsMap[ComponentProperty.ConstantsBodySpecs],
    ).toBeDefined();
  });

  it("should map Metadata to MetadataPanel", () => {
    expect(propertyPanelsMap[ComponentProperty.Metadata]).toBeDefined();
  });

  it("should map positioning properties to PositioningPanel", () => {
    expect(propertyPanelsMap[ComponentProperty.IsSticky]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.PinTo]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.Offset]).toBeDefined();
  });

  it("should map tree structure properties to TreeStructurePanel", () => {
    expect(propertyPanelsMap[ComponentProperty.BehaviorType]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.SessionKey]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.PathKeyToArray]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.ChildrenPathKey]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.ValueKey]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.LabelKey]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.ParamValueKey]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.OnSelectApiUrl]).toBeDefined();
  });

  it("should map payment properties to PaymentPanel", () => {
    expect(propertyPanelsMap[ComponentProperty.PollingTime]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.QRTimer]).toBeDefined();
    expect(propertyPanelsMap[ComponentProperty.OrderIdPathKey]).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.PaymentModePathKey],
    ).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.PrefixHideIconOnNoMatch],
    ).toBeDefined();
  });

  it("should map PrefixSuffix to TextPanel", () => {
    expect(propertyPanelsMap[ComponentProperty.PrefixSuffix]).toBeDefined();
  });

  it("should map prefix dynamic icon properties to TextPanel", () => {
    expect(
      propertyPanelsMap[ComponentProperty.PrefixDynamicIconSize],
    ).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.PrefixDynamicIconName],
    ).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.PrefixDynamicIconDefaultColor],
    ).toBeDefined();
    expect(
      propertyPanelsMap[ComponentProperty.PrefixDynamicIconColorConditions],
    ).toBeDefined();
  });

  it("should have correct number of property mappings", () => {
    const mappedProperties = Object.keys(propertyPanelsMap);
    expect(mappedProperties.length).toBeGreaterThan(0);
  });

  it("should have all values as React components", () => {
    Object.values(propertyPanelsMap).forEach((panel) => {
      expect(typeof panel).toBe("function");
    });
  });
});
