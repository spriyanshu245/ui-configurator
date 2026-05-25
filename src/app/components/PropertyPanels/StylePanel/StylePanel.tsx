"use client";
import { ComponentProperty } from "@/app/data/componentProperties";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import DragDropFileUpload from "../../UtilityComponents/DragDropFileUpload/DragDropFileUpload";
import { borderStyleType, PropertyPanels } from "@/app/utils/constants";
import ToggleSwitch from "../../ToggleSwitch/ToggleSwitch";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import ChevronDownIcon from "../../SVGIcons/ChevronDown";
import PropertyInput from "../../PropertyInputs/PropertyInput";

interface SectionPanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: any;
  setProperty: (prop: string, value: any) => void;
}

const StylePanel = ({
  propertyKeys,
  propertyComponent,
  setProperty,
}: SectionPanelProps) => {
  const { properties } = propertyComponent;
  const { togglePanel, isPanelOpen } = usePropertyPane();

  const renderProperty = (propertyKey: ComponentProperty) => {
    switch (propertyKey) {
      case ComponentProperty.BackgroundImage:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>
              Background Image
            </p>
            <DragDropFileUpload
              id="backgroundImageUpload"
              componentId={propertyComponent.id}
              propertyKey={ComponentProperty.BackgroundImage}
              fileTypes={["png", "jpg", "jpeg"]}
              maxSize={2 * 1024 * 1024}
            />
          </div>
        );

      case ComponentProperty.BackgroundColor:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>
              Background Color
            </p>
            <input
              id="backgroundColor"
              className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
              type="text"
              value={properties?.backgroundColor || ""}
              placeholder="Enter background color here"
              onChange={(e) =>
                setProperty(ComponentProperty.BackgroundColor, e.target.value)
              }
            />
          </div>
        );

      case ComponentProperty.BorderThickness:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>
              Border Thickness (px)
            </p>
            <input
              id="borderThickness"
              className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
              type="number"
              min={0}
              value={properties?.borderThickness ?? 0}
              placeholder="Enter border thickness here"
              onChange={(e) =>
                setProperty(ComponentProperty.BorderThickness, e.target.value)
              }
            />
          </div>
        );

      case ComponentProperty.BorderStyle:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Border Style</p>
            <select
              id="borderStyle"
              data-testid="borderStyle"
              className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
              value={properties?.borderStyle || "none"}
              onChange={(e) =>
                setProperty(ComponentProperty.BorderStyle, e.target.value)
              }
            >
              {borderStyleType.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        );

      case ComponentProperty.BorderColor:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Border Color</p>
            <input
              id="borderColor"
              className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
              type="text"
              value={properties?.borderColor || ""}
              placeholder="Enter border color here"
              onChange={(e) =>
                setProperty(ComponentProperty.BorderColor, e.target.value)
              }
            />
          </div>
        );

      case ComponentProperty.BorderRadius:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>
              Border Radius (px)
            </p>
            <input
              id="borderRadius"
              className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
              type="number"
              min={0}
              value={properties?.borderRadius ?? 0}
              placeholder="Enter border radius here"
              onChange={(e) =>
                setProperty(ComponentProperty.BorderRadius, e.target.value)
              }
            />
          </div>
        );

      case ComponentProperty.Clickable:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <ToggleSwitch
              id="clickable"
              size="small"
              onToggle={(e) => {
                let val = e.target.checked;
                setProperty(ComponentProperty.Url, "");
                setProperty(ComponentProperty.Clickable, val);
              }}
              isToggled={!!properties?.clickable}
              label="Clickable Section"
            />
          </div>
        );

      case ComponentProperty.Url:
        if (!properties?.clickable) return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>URL</p>
            <input
              id="url"
              className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
              type="text"
              value={properties?.url || ""}
              placeholder="Enter url here"
              onChange={(e) =>
                setProperty(ComponentProperty.Url, e.target.value)
              }
            />
          </div>
        );

      case ComponentProperty.Padding:
        return (
          !properties.independentPadding && (
            <PropertyInput
              id="padding"
              data-testid="padding"
              type="number"
              label="Padding"
              value={properties.padding ?? 0}
              handleChange={(e) => {
                setProperty(
                  ComponentProperty.Padding,
                  (e as React.ChangeEvent<HTMLInputElement>).target.value
                );
              }}
            />
          )
        );
      case ComponentProperty.IndependentPadding:
        return (
          <PropertyInput
            id="independentPadding"
            data-testid="independentPadding"
            type="checkbox"
            label="Independent Padding"
            value={properties?.independentPadding ?? false}
            handleChange={(e) => {
              setProperty(
                ComponentProperty.IndependentPadding,
                (e as React.ChangeEvent<HTMLInputElement>).target.checked
              );
            }}
          />
        );

      case ComponentProperty.IsResponsive:
        return (
          <PropertyInput
            id="isResponsive"
            data-testid="isResponsive"
            type="checkbox"
            label="Is Responsive"
            value={properties?.isResponsive ?? true}
            handleChange={(e) => {
              setProperty(
                ComponentProperty.IsResponsive,
                (e as React.ChangeEvent<HTMLInputElement>).target.checked
              );
            }}
          />
        );

      case ComponentProperty.PaddingTop:
        return (
          properties.independentPadding && (
            <PropertyInput
              id="paddingTop"
              data-testid="paddingTop"
              type="number"
              label="Padding Top"
              value={properties?.paddingTop ?? 0}
              handleChange={(e) => {
                setProperty(
                  ComponentProperty.PaddingTop,
                  (e as React.ChangeEvent<HTMLInputElement>).target.value
                );
              }}
            />
          )
        );

      case ComponentProperty.PaddingBottom:
        return (
          properties.independentPadding && (
            <PropertyInput
              id="paddingBottom"
              data-testid="paddingBottom"
              type="number"
              label="Padding Bottom"
              value={properties?.paddingBottom ?? 0}
              handleChange={(e) => {
                setProperty(
                  ComponentProperty.PaddingBottom,
                  (e as React.ChangeEvent<HTMLInputElement>).target.value
                );
              }}
            />
          )
        );

      case ComponentProperty.PaddingLeft:
        return (
          properties.independentPadding && (
            <PropertyInput
              id="paddingLeft"
              data-testid="paddingLeft"
              type="number"
              label="Padding Left"
              value={properties?.paddingLeft ?? 0}
              handleChange={(e) => {
                setProperty(
                  ComponentProperty.PaddingLeft,
                  (e as React.ChangeEvent<HTMLInputElement>).target.value
                );
              }}
            />
          )
        );
      case ComponentProperty.PaddingRight:
        return (
          properties.independentPadding && (
            <PropertyInput
              id="paddingRight"
              data-testid="paddingRight"
              type="number"
              label="Padding Right"
              value={properties?.paddingRight ?? 0}
              handleChange={(e) => {
                setProperty(
                  ComponentProperty.PaddingRight,
                  (e as React.ChangeEvent<HTMLInputElement>).target.value
                );
              }}
            />
          )
        );

      case ComponentProperty.MaxWidth:
        return (
          <PropertyInput
            id="maxWidth"
            data-testid="maxWidth"
            type="number"
            label="Max Width (px)"
            value={properties?.maxWidth ?? 0}
            handleChange={(e) => {
              setProperty(
                ComponentProperty.MaxWidth,
                (e as React.ChangeEvent<HTMLInputElement>).target.value
              );
            }}
          />
        );

      case ComponentProperty.MinWidth:
        return (
          <PropertyInput
            id="minWidth"
            data-testid="minWidth"
            type="number"
            label="Min Width (px)"
            value={properties?.minWidth ?? 0}
            handleChange={(e) => {
              setProperty(
                ComponentProperty.MinWidth,
                (e as React.ChangeEvent<HTMLInputElement>).target.value
              );
            }}
          />
        );

      default:
        return null;
    }
  };
  return (
    <div id="stylePanel">
      <button
        id="toggleButton"
        onClick={() => togglePanel && togglePanel(PropertyPanels.SectionPanel)}
        className={`${sharedPropertiesStyles.panelHeading} ${
          isPanelOpen?.(PropertyPanels.SectionPanel)
            ? sharedPropertiesStyles.isOpen
            : ""
        }`}
      >
        <h3>Style</h3>
        <ChevronDownIcon />
      </button>

      {isPanelOpen && isPanelOpen(PropertyPanels.SectionPanel) && (
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

export default StylePanel;
