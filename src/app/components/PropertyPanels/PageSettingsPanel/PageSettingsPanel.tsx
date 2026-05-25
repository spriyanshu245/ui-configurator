"use client";
import { ComponentProperty } from "@/app/data/componentProperties";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import { PropertyPanels } from "@/app/utils/constants";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import ChevronDownIcon from "../../SVGIcons/ChevronDown";
import { useMicrosite } from "@/app/context/MicrositeContext";
import Slider from "../../UIComponents/Slider/Slider";
import PropertyInput from "../../PropertyInputs/PropertyInput";
import { renderOptions } from "@/app/utils/utils";

interface PageSettingsPanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: any;
  setProperty: (prop: string, value: any, isProperty?: boolean) => void;
}

const PageSettingsPanel = ({
  propertyKeys,
  propertyComponent,
  setProperty,
}: PageSettingsPanelProps) => {
  const { togglePanel, isPanelOpen } = usePropertyPane();
  const { microsite, updateMicrositeProperties } = useMicrosite();

  const renderProperty = (propertyKey: ComponentProperty) => {
    switch (propertyKey) {
      case ComponentProperty.FirstPage:
        if (propertyComponent?.properties?.showAsPopup) return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="firstPage"
                data-testid="firstPage"
                type="checkbox"
                checked={microsite.firstPageCode === propertyComponent.code}
                onChange={(e) => {
                  updateMicrositeProperties({
                    firstPageCode: e.target.checked
                      ? propertyComponent.code
                      : "",
                  });
                }}
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Set as First Page
              </span>
            </label>
          </div>
        );

      case ComponentProperty.ShowAsPopup:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="showAsPopup"
                data-testid="showAsPopup"
                type="checkbox"
                checked={!!propertyComponent?.properties?.showAsPopup}
                onChange={(e) => {
                  setProperty(ComponentProperty.ShowAsPopup, e.target.checked);
                }}
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Show as Popup
              </span>
            </label>
          </div>
        );

      case ComponentProperty.PanePosition:
        if (!propertyComponent?.properties?.showAsPopup) return null;
        return (
          <PropertyInput
            placeholder="Select Popup Position"
            label="Popup Position"
            type="select"
            id="panePosition"
            value={propertyComponent?.properties?.panePosition ?? "center"}
            options={renderOptions(["left", "right", "center", "bottom"])}
            handleChange={(e) => {
              setProperty(ComponentProperty.PanePosition, e.target.value);
            }}
          />
        );
      case ComponentProperty.PopupWidth:
        if (!propertyComponent?.properties?.showAsPopup) return null;
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
              value={propertyComponent?.properties?.popupWidth || 100}
              valueSuffix="%"
              onChange={(value) =>
                setProperty(ComponentProperty.PopupWidth, value)
              }
            />
          </div>
        );

      case ComponentProperty.CloseOnBackdropClick:
        if (!propertyComponent?.properties?.showAsPopup) return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.row}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="closeOnBackdropClick"
                type="checkbox"
                data-testid="closeOnBackdropClick"
                checked={!!propertyComponent.properties?.closeOnBackdropClick}
                onChange={(e) =>
                  setProperty(
                    ComponentProperty.CloseOnBackdropClick,
                    e.target.checked,
                  )
                }
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Close on backdrop click
              </span>
            </label>
          </div>
        );

      case ComponentProperty.PageCode:
        return (
          <PropertyInput
            id="pageCode"
            label="Code"
            type="text"
            value={propertyComponent?.code}
            placeholder="Enter Page Code here"
            disabled={true}
            handleChange={(e) => setProperty("code", e.target.value, false)}
          />
        );
      case ComponentProperty.PageSlug:
        return (
          <PropertyInput
            id="pageSlug"
            label="Slug"
            type="text"
            value={propertyComponent?.slug}
            placeholder="Enter Page Slug here"
            handleChange={(e) => setProperty("slug", e.target.value, false)}
          />
        );
      case ComponentProperty.PageName:
        return (
          <PropertyInput
            id="pageName"
            label="Name"
            type="text"
            value={propertyComponent?.name}
            placeholder="Enter Page Name here"
            handleChange={(e) => setProperty("name", e.target.value, false)}
          />
        );
      case ComponentProperty.Description:
        return (
          <PropertyInput
            id="description"
            label="description"
            type="text"
            value={propertyComponent?.description}
            placeholder="Enter Page description here"
            handleChange={(e) =>
              setProperty("description", e.target.value, false)
            }
          />
        );
      case ComponentProperty.ShowTitle:
        if (!propertyComponent?.properties?.showAsPopup) return null;
        return (
          <PropertyInput
            placeholder="Show Name"
            label="Show Name"
            type="checkbox"
            id="showTitle"
            value={!!propertyComponent?.properties?.showTitle}
            handleChange={(e) => {
              setProperty(
                ComponentProperty.ShowTitle,
                (e as React.ChangeEvent<HTMLInputElement>).target.checked
              );
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div id="pageSettingsPanel">
      <button
        id="toggleButton"
        data-testid="toggleButton"
        onClick={() => togglePanel?.(PropertyPanels.PageSettingsPanel)}
        className={`${sharedPropertiesStyles.panelHeading} ${
          isPanelOpen?.(PropertyPanels.PageSettingsPanel)
            ? sharedPropertiesStyles.isOpen
            : ""
        }`}
      >
        <h3>Page Settings</h3>
        <ChevronDownIcon />
      </button>

      {isPanelOpen && isPanelOpen(PropertyPanels.PageSettingsPanel) && (
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

export default PageSettingsPanel;
