"use client";
import { ComponentProperty } from "@/app/data/componentProperties";
import React, { useEffect } from "react";
import Slider from "../../UIComponents/Slider/Slider";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import { ComponentGroup } from "@/app/types/types";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import {
  buttonTypes,
  buttonSizes,
  ALIGNMENT,
  DIRECTION,
  JUSTIFICATION,
  PropertyPanels,
  textAlignTypes,
} from "@/app/utils/constants";
import ChevronDownIcon from "../../SVGIcons/ChevronDown";
import sharedStyles from "@/app/styles/shared.module.scss";
import { propertyIcons } from "@/app/data/propertyIcons";
import ToggleSwitch from "../../ToggleSwitch/ToggleSwitch";
import PropertyInput from "../../PropertyInputs/PropertyInput";
interface LayoutPanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: any;
  setProperty: (prop: string, value: any) => void;
  setProperties: (properties: { [key: string]: any }) => void;
}

const LayoutPanel = ({
  propertyKeys,
  propertyComponent,
  setProperty,
  setProperties,
}: LayoutPanelProps) => {
  const { properties } = propertyComponent;
  const { togglePanel, isPanelOpen } = usePropertyPane();
  const allowOne = ["data-grid", "questionnaire", "stack"];
  const minColumns = allowOne.includes(propertyComponent.type) ? 1 : 2;
  const isPropertyDivider = propertyComponent?.type === "divider";

  const resetMargins = {
    marginRight: 0,
    marginLeft: 0,
    marginTop: 0,
    marginBottom: 0,
  };

  const inputColumns =
    properties?.inputColumns ?? properties.columnHeaders ?? [];
  const tableColumnWidth = properties?.tableColumnWidth ?? [];

  const handlePositionChange = (value: "Top" | "Bottom") => {
    setProperties({
      position: value,
      ...resetMargins,
    });
  };

  const initializeWidths = () => {
    if (tableColumnWidth.length !== inputColumns.length) {
      const equalWidth = Math.floor(100 / inputColumns.length);
      return inputColumns.map(() => equalWidth);
    }
    return tableColumnWidth;
  };

  const columnWidths = initializeWidths();

  const handleColumnWidthChange = (columnIndex: number, value: number) => {
    const maxAllowed = getMaxWidthForColumn(columnIndex);
    const restrictedValue = Math.min(value, maxAllowed);
    const newWidths = [...columnWidths];
    newWidths[columnIndex] = restrictedValue;
    setProperty(ComponentProperty.TableColumnWidth, newWidths);
  };

  const getMaxWidthForColumn = (columnIndex: number) => {
    const otherColumnsTotal = columnWidths.reduce(
      (sum: number, width: number, index: number) => {
        return index === columnIndex ? sum : sum + (width || 0);
      },
      0
    );
    return 100 - otherColumnsTotal;
  };

  useEffect(() => {
    if (!properties?.defineColumnWidth) return;
    setProperty(ComponentProperty.TableColumnWidth, columnWidths);
  }, [inputColumns.length, properties?.defineColumnWidth]);

  const genericColumnCount = properties?.columns || 1;
  const genericColumnWidth = properties?.columnWidths ?? [];

  const initializeGenericWidths = () => {
    if (genericColumnWidth.length !== genericColumnCount) {
      const equalWidth = Math.floor(100 / genericColumnCount);
      return Array.from({ length: genericColumnCount }, () => equalWidth);
    }
    return genericColumnWidth;
  };

  const genericColumnWidths = initializeGenericWidths();

  const handleGenericColumnWidthChange = (
    columnIndex: number,
    value: number
  ) => {
    const maxAllowed = getMaxWidthForGenericColumn(columnIndex);
    const restrictedValue = Math.min(value, maxAllowed);
    const newWidths = [...genericColumnWidths];
    newWidths[columnIndex] = restrictedValue;
    setProperty(ComponentProperty.ColumnWidths, newWidths);
  };

  const getMaxWidthForGenericColumn = (columnIndex: number) => {
    const otherColumnsTotal = genericColumnWidths.reduce(
      (sum: number, width: number, index: number) => {
        return index === columnIndex ? sum : sum + (width || 0);
      },
      0
    );
    return 100 - otherColumnsTotal;
  };

  useEffect(() => {
    if (genericColumnCount > 0) {
      setProperty(ComponentProperty.ColumnWidths, genericColumnWidths);
    }
  }, [genericColumnCount]);

  const handleTranspose = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProperty(ComponentProperty.Transpose, e.target.checked);
  };

  const renderProperty = (propertyKey: ComponentProperty) => {
    switch (propertyKey) {
      case ComponentProperty.Width:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Width</p>
            <Slider
              id="width"
              min={0}
              max={100}
              step={5}
              value={properties?.width || 100}
              valueSuffix="%"
              onChange={(value) => setProperty(ComponentProperty.Width, value)}
            />
          </div>
        );

      case ComponentProperty.IsVertical:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="fieldVerticalOrienation"
                type="checkbox"
                checked={!!properties?.isVertical}
                onChange={(e) =>
                  setProperty(ComponentProperty.IsVertical, e.target.checked)
                }
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Align Vertical
              </span>
            </label>
          </div>
        );

      case ComponentProperty.DisplayAsBlocks:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="displayAsBlocks"
                type="checkbox"
                checked={!!properties?.displayAsBlocks}
                onChange={(e) =>
                  setProperty(
                    ComponentProperty.DisplayAsBlocks,
                    e.target.checked
                  )
                }
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Display As Blocks
              </span>
            </label>
          </div>
        );

      case ComponentProperty.Height:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Height</p>
            <Slider
              id="height"
              min={isPropertyDivider ? 1 : 5}
              max={isPropertyDivider ? 10 : 400}
              step={isPropertyDivider ? 1 : 5}
              value={properties?.height || (isPropertyDivider ? 1 : 5)}
              valueSuffix="px"
              onChange={(value) => setProperty(ComponentProperty.Height, value)}
            />
          </div>
        );

      case ComponentProperty.Columns:
        return (
          ((propertyComponent.type === "stack" && properties.hasFixedColumns) ||
            propertyComponent.type !== "stack") && (
            <div
              className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
            >
              <p className={sharedPropertiesStyles.propertyLabel}>Columns</p>
              <Slider
                id="columns"
                min={
                  propertyComponent.type !== "stack"
                    ? Math.max(
                        (propertyComponent as ComponentGroup)?.components
                          ?.length ?? minColumns,
                        minColumns
                      )
                    : minColumns
                }
                max={propertyComponent?.type === "data-grid" ? 8 : 5}
                step={1}
                value={properties?.columns || 1}
                onChange={(value) =>
                  setProperty(ComponentProperty.Columns, value)
                }
              />
            </div>
          )
        );

      case ComponentProperty.RowCount:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Rows</p>
            <Slider
              id="rows"
              min={2}
              max={5}
              step={1}
              value={properties?.rowCount ?? 3}
              onChange={(value) =>
                setProperty(ComponentProperty.RowCount, value)
              }
            />
          </div>
        );

      case ComponentProperty.ColumnGap:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Column Gap</p>
            <Slider
              id="columnGap"
              min={5}
              max={40}
              step={5}
              value={properties?.columnGap || 0}
              valueSuffix="px"
              onChange={(value) =>
                setProperty(ComponentProperty.ColumnGap, value)
              }
            />
          </div>
        );

      case ComponentProperty.MobileCardViewEnabled:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="mobileCardViewEnabled"
                data-testid="mobileCardViewEnabled"
                type="checkbox"
                checked={!!properties?.mobileCardViewEnabled}
                onChange={(e) =>
                  setProperty(
                    ComponentProperty.MobileCardViewEnabled,
                    e.target.checked
                  )
                }
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Enable Card View on Mobile
              </span>
            </label>
          </div>
        );

      case ComponentProperty.CardViewVisibility:
        return (
          <PropertyInput
            type="select"
            id="cardViewVisibility"
            label="Card View Visibility"
            value={properties?.cardViewVisibility ?? "expanded"}
            options={[
              { label: "Always Visible", value: "always" },
              { label: "Expanded Only", value: "expanded" },
              { label: "Hidden", value: "hidden" },
            ]}
            handleChange={(e) =>
              setProperty(ComponentProperty.CardViewVisibility, e.target.value)
            }
          />
        );

      case ComponentProperty.FieldLayout:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>
              Field Layout Type
            </p>
            <select
              id="fieldLayout"
              data-testid="fieldLayout"
              className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
              value={properties.fieldLayout || "column"}
              onChange={(e) =>
                setProperty(ComponentProperty.FieldLayout, e.target.value)
              }
            >
              <option value="row">Row</option>
              <option value="column">Column</option>
            </select>
          </div>
        );

      case ComponentProperty.RepeatRows:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="repeatRows"
                type="checkbox"
                checked={!!properties?.repeatRows}
                onChange={(e) =>
                  setProperty(ComponentProperty.RepeatRows, e.target.checked)
                }
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Repeat Rows
              </span>
            </label>
          </div>
        );

      case ComponentProperty.HasFixedColumns:
        return (
          <PropertyInput
            id="hasFixedColumns"
            data-testid="hasFixedColumns"
            type="checkbox"
            label="Has Fixed Columns"
            value={properties?.hasFixedColumns ?? false}
            handleChange={(e) => {
              setProperty(
                ComponentProperty.HasFixedColumns,
                (e as React.ChangeEvent<HTMLInputElement>).target.checked
              );
            }}
          />
        );

      case ComponentProperty.EnableVerticalScroll:
        return (
          <PropertyInput
            id="enableVerticalScroll"
            data-testid="enableVerticalScroll"
            type="checkbox"
            label="Enable Vertical Scroll"
            value={properties?.enableVerticalScroll ?? false}
            handleChange={(e) => {
              setProperty(
                ComponentProperty.EnableVerticalScroll,
                (e as React.ChangeEvent<HTMLInputElement>).target.checked
              );
            }}
          />
        );

      case ComponentProperty.Direction:
        return (
          !properties.hasFixedColumns && (
            <PropertyInput
              id="direction"
              data-testid="direction"
              type="select"
              label="Direction"
              value={properties?.direction ?? "row"}
              handleChange={(e) => {
                setProperty(
                  ComponentProperty.Direction,
                  (e as React.ChangeEvent<HTMLInputElement>).target.value
                );
              }}
              options={DIRECTION}
            />
          )
        );

      case ComponentProperty.Alignment:
        return (
          <PropertyInput
            id="alignment"
            data-testid="alignment"
            type="select"
            label="alignment"
            value={properties?.alignment ?? "flex-start"}
            handleChange={(e) => {
              setProperty(
                ComponentProperty.Alignment,
                (e as React.ChangeEvent<HTMLInputElement>).target.value
              );
            }}
            options={ALIGNMENT}
          />
        );

      case ComponentProperty.Justification:
        return (
          <PropertyInput
            id="justification"
            data-testid="justification"
            type="select"
            label="Justification"
            value={properties?.justification ?? "flex-start"}
            handleChange={(e) => {
              setProperty(
                ComponentProperty.Justification,
                (e as React.ChangeEvent<HTMLInputElement>).target.value
              );
            }}
            options={JUSTIFICATION}
          />
        );

      case ComponentProperty.Align:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Align</p>
            <div
              className={`${sharedPropertiesStyles.optionGrid} ${sharedStyles.mt5}`}
            >
              {textAlignTypes.map((alignment) => (
                <button
                  data-testid={alignment}
                  id={alignment}
                  key={alignment}
                  className={`${sharedPropertiesStyles.option} ${
                    properties?.align === alignment
                      ? sharedPropertiesStyles.active
                      : ""
                  }`}
                  onClick={() => setProperty("align", alignment)}
                >
                  <div
                    className={sharedPropertiesStyles.iconContainer}
                    dangerouslySetInnerHTML={{
                      __html: propertyIcons
                        .filter(
                          (icon) =>
                            icon.property === "textAlign" &&
                            icon.value === alignment
                        )
                        .map((icon) => icon.svgCode),
                    }}
                  ></div>
                </button>
              ))}
            </div>
          </div>
        );

      case ComponentProperty.isFloating:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <div
              className={`${sharedPropertiesStyles.optionGrid} ${sharedStyles.mt5}`}
            >
              <ToggleSwitch
                id="isFloating"
                size="small"
                label="Floating Buttons"
                onToggle={() => {
                  let updatedProperties = {
                    isFloating: !properties?.isFloating,
                  };

                  if (!properties?.isFloating) {
                    updatedProperties = {
                      ...updatedProperties,
                      ...resetMargins,
                    };
                  }
                  setProperties({ ...updatedProperties });
                }}
                isToggled={!!properties?.isFloating}
                disabled={false}
              />
            </div>
            {properties?.isFloating && (
              <div className={sharedPropertiesStyles.radioGroup}>
                <label>
                  <input
                    data-testid="position-top"
                    id="top"
                    type="radio"
                    value="Top"
                    checked={properties?.position === "Top"}
                    onChange={() => handlePositionChange("Top")}
                  />{" "}
                  Top
                </label>
                <label>
                  <input
                    data-testid="position-bottom"
                    id="bottom"
                    type="radio"
                    value="Bottom"
                    checked={properties?.position === "Bottom"}
                    onChange={() => handlePositionChange("Bottom")}
                  />{" "}
                  Bottom
                </label>
              </div>
            )}
          </div>
        );

      case ComponentProperty.MarginRight:
        if (properties.align !== "right" || !properties?.isFloating)
          return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Margin Right</p>
            <Slider
              id="marginRight"
              min={5}
              max={40}
              step={5}
              value={properties?.marginRight || 0}
              valueSuffix="px"
              onChange={(value) =>
                setProperty(ComponentProperty.MarginRight, value)
              }
            />
          </div>
        );

      case ComponentProperty.MarginLeft:
        if (properties.align !== "left" || !properties?.isFloating) return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Margin Left</p>
            <Slider
              id="marginLeft"
              min={5}
              max={40}
              step={5}
              value={properties?.marginLeft || 0}
              valueSuffix="px"
              onChange={(value) =>
                setProperty(ComponentProperty.MarginLeft, value)
              }
            />
          </div>
        );

      case ComponentProperty.MarginTop:
        if (properties.position !== "Top" || !properties?.isFloating)
          return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Margin Top</p>
            <Slider
              id="marginTop"
              min={5}
              max={40}
              step={5}
              value={properties?.marginTop || 0}
              valueSuffix="px"
              onChange={(value) =>
                setProperty(ComponentProperty.MarginTop, value)
              }
            />
          </div>
        );

      case ComponentProperty.MarginBottom:
        if (properties.position !== "Bottom" || !properties?.isFloating)
          return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>
              Margin Bottom
            </p>
            <Slider
              id="marginBottom"
              min={5}
              max={40}
              step={5}
              value={properties?.marginBottom || 0}
              valueSuffix="px"
              onChange={(value) =>
                setProperty(ComponentProperty.MarginBottom, value)
              }
            />
          </div>
        );

      case ComponentProperty.ButtonType:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>
              Select Button Type
            </p>
            <select
              id="buttonType"
              data-testid="buttonType"
              className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
              value={properties.buttonType ?? "primary"}
              onChange={(e) =>
                setProperty(ComponentProperty.ButtonType, e.target.value)
              }
            >
              {buttonTypes.map((button) => (
                <option key={button.value} value={button.value}>
                  {button.label}
                </option>
              ))}
            </select>
          </div>
        );

      case ComponentProperty.ButtonSize:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Button Size</p>
            <div
              className={`${sharedPropertiesStyles.optionGrid} ${sharedStyles.mt5}`}
            >
              {buttonSizes.map((size) => (
                <button
                  data-testid={`buttonSize-${size.value}`}
                  id={`buttonSize-${size.value}`}
                  key={size.value}
                  className={`${sharedPropertiesStyles.option} ${
                    (properties.buttonSize ?? "S") === size.value
                      ? sharedPropertiesStyles.active
                      : ""
                  }`}
                  onClick={() =>
                    setProperty(ComponentProperty.ButtonSize, size.value)
                  }
                >
                  {size.value}
                </button>
              ))}
            </div>
          </div>
        );

      case ComponentProperty.FieldSize:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Field Size</p>
            <div
              className={`${sharedPropertiesStyles.optionGrid} ${sharedStyles.mt5}`}
            >
              {buttonSizes.map((size) => (
                <button
                  data-testid={`fieldSize-${size.value}`}
                  id={`fieldSize-${size.value}`}
                  key={size.value}
                  className={`${sharedPropertiesStyles.option} ${
                    (properties.fieldSize ?? "S") === size.value
                      ? sharedPropertiesStyles.active
                      : ""
                  }`}
                  onClick={() =>
                    setProperty(ComponentProperty.FieldSize, size.value)
                  }
                >
                  {size.value}
                </button>
              ))}
            </div>
          </div>
        );

      case ComponentProperty.DefineColumnWidth:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="defineColumnWidth"
                data-testid="defineColumnWidth"
                type="checkbox"
                checked={properties?.defineColumnWidth || false}
                onChange={(e) =>
                  setProperties({
                    [ComponentProperty.DefineColumnWidth]: e.target.checked,
                    [ComponentProperty.TableColumnWidth]: e.target.checked
                      ? []
                      : columnWidths,
                  })
                }
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Define Column Width
              </span>
            </label>
          </div>
        );

      case ComponentProperty.TableColumnWidth:
        if (!properties?.defineColumnWidth) return null;

        return (
          <div className={`${sharedPropertiesStyles.column}`}>
            <p className={sharedPropertiesStyles.propertyLabel}>
              Column Widths
            </p>
            {inputColumns.map((column: any, index: number) => (
              <div
                key={column.id}
                className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
              >
                <p className={sharedPropertiesStyles.propertyLabel}>
                  {column.properties?.label || `Column ${index + 1}`}
                </p>
                <Slider
                  id={`columnWidth-${index}`}
                  min={0}
                  max={100}
                  step={1}
                  value={columnWidths[index]}
                  valueSuffix="%"
                  onChange={(value) => handleColumnWidthChange(index, value)}
                />
              </div>
            ))}
            {columnWidths.reduce((a: number, b: number) => a + b, 0) !==
              100 && (
              <span className={sharedPropertiesStyles.errorMessage}>
                Column widths must sum up to 100%
              </span>
            )}
          </div>
        );

      case ComponentProperty.ColumnWidths:
        if (propertyComponent.type === "stack" && !properties.hasFixedColumns)
          return null;
        return (
          <div className={`${sharedPropertiesStyles.column}`}>
            <p className={sharedPropertiesStyles.propertyLabel}>
              Column Widths
            </p>
            {Array.from({ length: genericColumnCount }, (_, index) => (
              <div
                key={`generic-column-${index}`}
                className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
              >
                <p className={sharedPropertiesStyles.propertyLabel}>
                  Column{index + 1}
                </p>
                <Slider
                  id={`genericColumnWidth-${index}`}
                  min={0}
                  max={100}
                  step={1}
                  value={genericColumnWidths[index]}
                  valueSuffix="%"
                  onChange={(value) =>
                    handleGenericColumnWidthChange(index, value)
                  }
                />
              </div>
            ))}
            {genericColumnWidths.reduce((a: number, b: number) => a + b, 0) !==
              100 && (
              <span className={sharedPropertiesStyles.errorMessage}>
                Column widths must sum up to 100%
              </span>
            )}
          </div>
        );

      case ComponentProperty.Transpose:
        return (
          <PropertyInput
            id="transpose"
            type="checkbox"
            value={!!properties?.transpose}
            label="Transpose table"
            handleChange={(e) =>
              handleTranspose(e as React.ChangeEvent<HTMLInputElement>)
            }
          ></PropertyInput>
        );

      case ComponentProperty.SliderValuePosition:
        return (
          <PropertyInput
            id="sliderValuePosition"
            type="select"
            value={properties.sliderValuePosition ?? "top"}
            handleChange={(e) =>
              setProperty(ComponentProperty.SliderValuePosition, e.target.value)
            }
            label="Value Position"
            options={[
              { label: "Top", value: "top" },
              { label: "Bottom", value: "bottom" },
            ]}
          />
        );

      case ComponentProperty.SliderValueAlignment:
        return (
          <PropertyInput
            id="sliderValueAlignment"
            type="select"
            value={properties.sliderValueAlignment ?? "center"}
            handleChange={(e) =>
              setProperty(
                ComponentProperty.SliderValueAlignment,
                e.target.value
              )
            }
            label="Value Alignment"
            options={[
              { label: "Left", value: "left" },
              { label: "Center", value: "center" },
              { label: "Right", value: "right" },
            ]}
          />
        );

      case ComponentProperty.SliderValueGap:
        return (
          <PropertyInput
            id="sliderValueGap"
            type="number"
            value={properties.sliderValueGap ?? 8}
            handleChange={(e) =>
              setProperty(
                ComponentProperty.SliderValueGap,
                Number(e.target.value)
              )
            }
            label="Value Gap (px)"
            placeholder="Gap between value and slider"
          />
        );

      default:
        return null;
    }
  };
  return (
    <div id="layoutPanel">
      <button
        id="toggleButton"
        data-testid="toggleButton"
        onClick={() => togglePanel && togglePanel(PropertyPanels.LayoutPanel)}
        className={`${sharedPropertiesStyles.panelHeading} ${
          isPanelOpen?.(PropertyPanels.LayoutPanel)
            ? sharedPropertiesStyles.isOpen
            : ""
        }`}
      >
        <h3>Layout</h3>
        <ChevronDownIcon />
      </button>

      {isPanelOpen && isPanelOpen(PropertyPanels.LayoutPanel) && (
        <>
          {propertyKeys.map((propKey) => (
            <div key={`${propKey}-${propertyComponent.id}`}>
              {renderProperty(propKey)}
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default LayoutPanel;
