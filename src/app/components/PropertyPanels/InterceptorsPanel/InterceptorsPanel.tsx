"use client";
import { useEffect } from "react";
import { ComponentProperty } from "@/app/data/componentProperties";
import ChevronDownIcon from "../../SVGIcons/ChevronDown";
import sharedStyles from "@/app/styles/shared.module.scss";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import {
  PropertyPanels,
  VALIDATION_INTERCEPTOR_JS_SNIPPET,
  VALIDATION_TABLE_INTERCEPTOR_JS_SNIPPET,
} from "@/app/utils/constants";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import styles from "./InterceptorPanel.module.scss";
import { Interceptor } from "@/app/types/types";
import {
  ComponentTypes,
  EventTypes,
  InterceptorTypes,
  MessageTypes,
} from "@/app/utils/enums";
import { generateRandomId, getNameKey } from "@/app/utils/utils";
import InterceptorForm from "./InterceptorForm";
import { useParentFormProperties } from "@/app/hooks/useParentFormProperties";
import { useUserTask } from "@/app/context/UserTaskContext";

interface InterceptorsPanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: any;
  setProperty: (prop: string, value: any) => void;
}

const InterceptorsPanel = ({
  propertyKeys,
  propertyComponent,
  setProperty,
}: InterceptorsPanelProps) => {
  const { togglePanel, isPanelOpen } = usePropertyPane();
  const { parentForm } = useParentFormProperties(propertyComponent);
  const { formsNamekeys } = useUserTask();
  let interceptors = propertyComponent.properties?.interceptors || [];

  useEffect(() => {
    interceptors = propertyComponent.properties.interceptors;
  }, [propertyComponent.properties.interceptors, formsNamekeys]);

  const handleAddInterceptor = (componentType: ComponentTypes) => {
    let interceptor: Interceptor = {
      id: generateRandomId(),
      label: "Interceptor",
      interceptorType: InterceptorTypes.VALIDATION,
      jsObject:
        componentType === ComponentTypes.INPUT_TABLE
          ? VALIDATION_TABLE_INTERCEPTOR_JS_SNIPPET
          : VALIDATION_INTERCEPTOR_JS_SNIPPET,
      eventType: EventTypes.ON_CHANGE,
      eventObject: [],
      messageObject: [],
      message: "",
      messageType: MessageTypes.INFO,
      messageTimeout: 0,
      componentType: componentType,
    };
    if (componentType === ComponentTypes.INPUT_TABLE) {
      interceptor["tableName"] = getNameKey(
        parentForm?.properties?.nameKeyIds ?? [],
        propertyComponent.properties?.name
      );
    }
    const updatedData = interceptors?.concat(interceptor);
    setProperty(ComponentProperty.Interceptors, updatedData);
  };

  const hasError = (interceptor: Interceptor): boolean => {
    return (
      !interceptor.id.trim().length ||
      !interceptor.label.trim().length ||
      !interceptor.interceptorType.trim().length ||
      !interceptor.jsObject.trim().length ||
      !interceptor.eventType.trim().length ||
      !interceptor.eventObject.length ||
      !interceptor.messageObject.length ||
      !interceptor.message.trim().length ||
      !interceptor.messageType.trim().length
    );
  };

  return (
    <>
      <button
        data-testid="toggleButton"
        onClick={() => togglePanel?.(PropertyPanels.InterceptorsPanel)}
        className={`${sharedPropertiesStyles.panelHeading} ${
          isPanelOpen?.(PropertyPanels.InterceptorsPanel)
            ? sharedPropertiesStyles.isOpen
            : ""
        }`}
      >
        <h3>Interceptors</h3>
        <ChevronDownIcon />
      </button>

      {isPanelOpen && isPanelOpen(PropertyPanels.InterceptorsPanel) && (
        <div className={styles.interceptors}>
          <div className={styles.interceptorRow}>
            {interceptors?.map((interceptor: Interceptor, index: number) => (
              <div
                key={"interceptor-" + index}
                className={`${styles.row} ${
                  hasError(interceptor) ? styles.error : ""
                }`}
              >
                <InterceptorForm
                  key={"interceptor-" + interceptor.id}
                  interceptor={interceptor}
                  propertyComponent={propertyComponent}
                  setProperty={setProperty}
                />
              </div>
            ))}
            <button
              className={`${sharedStyles.button} ${sharedStyles.secondaryBorderButton}`}
              onClick={() => handleAddInterceptor(propertyComponent.type)}
            >
              Add Interceptor
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default InterceptorsPanel;
