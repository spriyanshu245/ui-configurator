"use client";
import { ComponentProperty } from "@/app/data/componentProperties";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import DragDropFileUpload from "@/app/components/UtilityComponents/DragDropFileUpload/DragDropFileUpload";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import { PropertyPanels } from "@/app/utils/constants";
import ChevronDownIcon from "../../SVGIcons/ChevronDown";

interface ImagePanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: any;
  setProperty: (prop: string, value: any) => void;
}

const ImagePanel = ({
  propertyKeys,
  propertyComponent,
  setProperty,
}: ImagePanelProps) => {
  const { togglePanel, isPanelOpen } = usePropertyPane();

  const renderProperty = (propertyKey: ComponentProperty) => {
    switch (propertyKey) {
      case ComponentProperty.Src:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Image Upload</p>
            <DragDropFileUpload
              id="imageUpload"
              componentId={propertyComponent.id}
              propertyKey="src"
              fileTypes={["png", "jpg", "jpeg"]}
              maxSize={2 * 1024 * 1024} // 2MB
            />
          </div>
        );
      case ComponentProperty.Alt:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Alt Text</p>
            <input
              id="altText"
              data-testid="altText"
              className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
              type="text"
              value={propertyComponent?.properties?.alt ?? ""}
              placeholder="Enter alt text here"
              onChange={(e) => setProperty("alt", e.target.value)}
            />
          </div>
        );

      default:
        return null;
    }
  };
  
  return (
    <div id="imagePanel">
      <button
        id="toggleButton"
        data-testid="toggleButton"
        onClick={() => togglePanel && togglePanel(PropertyPanels.ImagePanel)}
        className={`${sharedPropertiesStyles.panelHeading} ${
          isPanelOpen?.(PropertyPanels.ImagePanel)
            ? sharedPropertiesStyles.isOpen
            : ""
        }`}
      >
        <h3>Image</h3>
        <ChevronDownIcon />
      </button>

      {isPanelOpen && isPanelOpen(PropertyPanels.ImagePanel) && (
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

export default ImagePanel;
