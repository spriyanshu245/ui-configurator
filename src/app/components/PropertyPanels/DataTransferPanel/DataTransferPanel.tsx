import { ComponentProperty } from "@/app/data/componentProperties";
import styles from "./DataTransferPanel.module.scss";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import ChevronDownIcon from "@/app/components/SVGIcons/ChevronDown";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import { InputKeyFormat, PropertyPanels } from "@/app/utils/constants";
import JsonTextArea from "../../JsonTextArea/JsonTextArea";
interface DataTransferPanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: any;
  setProperty: (prop: string, value: any, isProperty?: boolean) => void;
}

const DataTransferPanel = ({
  propertyKeys,
  propertyComponent,
  setProperty,
}: DataTransferPanelProps) => {
  const dataTransfer = propertyComponent.properties?.dataTransfer ?? {};
  const { togglePanel, isPanelOpen } = usePropertyPane();
  const handleChange = (name: string, value: string) => {
    let updatedObj = { ...dataTransfer, [name]: value };

    setProperty(ComponentProperty.DataTransfer, updatedObj);
  };

  const renderProperty = (propertyKey: ComponentProperty) => {
    if (propertyKey === ComponentProperty.DataTransfer) {
      return (
        <div className={styles.columns}>
          {dataTransfer && (
            <div className={styles.columnItem} key={`data-transfer`}>
              <div
                className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
              >
                <p className={sharedPropertiesStyles.propertyLabel}>
                  Field Path
                </p>
                <input
                  id={`name}`}
                  data-testid={`name`}
                  className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
                  type="text"
                  value={dataTransfer.name ?? ""}
                  placeholder="Enter Name here"
                  onChange={(e) => {
                    e.preventDefault();
                    const value = e.target.value.replace(InputKeyFormat, "");
                    handleChange("name", value);
                  }}
                />
              </div>
              <div
                className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
              >
                <p
                  className={`${sharedPropertiesStyles.propertyLabel} ${sharedStyles.mb5}`}
                >
                  Body
                </p>
                <JsonTextArea
                  id={`body`}
                  value={dataTransfer.body ?? "{}"}
                  onChange={(newVal) => {
                    handleChange("body", newVal);
                  }}
                  onValidJson={(parsedObject) => {
                    handleChange("body", JSON.stringify(parsedObject));
                  }}
                />
              </div>
            </div>
          )}
        </div>
      );
    } else {
      return null;
    }
  };

  return (
    <>
      <button
        onClick={() =>
          togglePanel && togglePanel(PropertyPanels.DataTransferPanel)
        }
        className={`${sharedPropertiesStyles.panelHeading} ${
          isPanelOpen?.(PropertyPanels.DataTransferPanel)
            ? sharedPropertiesStyles.isOpen
            : ""
        }`}
      >
        <h3>Session Data Configuration</h3>
        <ChevronDownIcon />
      </button>

      {isPanelOpen && isPanelOpen(PropertyPanels.DataTransferPanel) && (
        <>
          {propertyKeys.map((propKey) => (
            <div key={`${propKey}-${propertyComponent.id}`}>
              {renderProperty(propKey)}
            </div>
          ))}
        </>
      )}
    </>
  );
};

export default DataTransferPanel;
