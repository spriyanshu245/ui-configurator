"use client";
import { useEffect, useState } from "react";
import { ComponentProperty } from "@/app/data/componentProperties";
import sharedStyles from "@/app/styles/shared.module.scss";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import styles from "./InterceptorPanel.module.scss";
import { FormComponent, InputTableComponent, Interceptor, NameKeyId } from "@/app/types/types";
import {
  ComponentTypes,
  EventTypes,
  InterceptorTypes,
  MessageTypes,
} from "@/app/utils/enums";
import DeleteIcon from "@/app/components/SVGIcons/Delete";
import { getAllFormsElements } from "@/app/utils/formsUtils";
import { useUserTask } from "@/app/context/UserTaskContext";
import MultiSelect from "../../MultiSelect/MultiSelect";

interface InterceptorFormProps {
  interceptor: Interceptor;
  propertyComponent: FormComponent| InputTableComponent;
  setProperty: (prop: string, value: any) => void;
}

const InterceptorForm = ({
  interceptor,
  propertyComponent,
  setProperty,
}: InterceptorFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  let interceptors = propertyComponent.properties?.interceptors ?? [];
  const [formData, setFormData] = useState<Interceptor>(interceptor);
  const { formsNamekeys } = useUserTask();
  const objectOptions: NameKeyId[] =
    propertyComponent.type === ComponentTypes.INPUT_TABLE
      ? propertyComponent.properties?.nameKeyIds?.map(
          ({ label, id }) => {
            return {
              label: label,
              id: label,
            };
          }
        ) ?? []
      : getAllFormsElements(formsNamekeys) || [];

  useEffect(() => updateInterceptors(), [formData]);
  useEffect(() => {
    interceptors = propertyComponent.properties?.interceptors;
  }, [propertyComponent.properties?.interceptors]);

  const updateInterceptors = () => {
    setProperty(
      ComponentProperty.Interceptors,
      interceptors.map((i: Interceptor) =>
        i.id === interceptor.id ? formData : i
      )
    );
  };

  const deleteInterceptor = (id: string) => {
    const updatedData = interceptors.filter((i: Interceptor) => {
      return i.id != id;
    });
    setProperty(ComponentProperty.Interceptors, updatedData);
  };

  return (
    <div className={styles.interceptorDetails}>
      <div className={styles.topContent}>
        <button
          className={styles.labelInput}
          onClick={() => setIsOpen(!isOpen)}
        >
          {formData.label}
        </button>
        <div className={styles.actions}>
          <button
            className={styles.removeIcon}
            onClick={() => deleteInterceptor(formData.id)}
          >
            <DeleteIcon />
          </button>
        </div>
      </div>
      {isOpen && (
        <div className={styles.bottomContent}>
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p
              className={`${sharedPropertiesStyles.propertyLabel} ${sharedStyles.mt10}`}
            >
              Label
            </p>
            <input
              type="text"
              placeholder="Interceptor name"
              className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
              value={formData.label}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  label: e.target.value,
                })
              }
            ></input>

            <p
              className={`${sharedPropertiesStyles.propertyLabel} ${sharedStyles.mt10}`}
            >
              Interceptor Type
            </p>
            <select
              className={`${sharedPropertiesStyles.selectInput} ${sharedStyles.mt5}`}
              value={formData.interceptorType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  interceptorType: e.target.value as InterceptorTypes,
                  eventType: EventTypes.ON_CHANGE,
                })
              }
            >
              {Object.values(InterceptorTypes).map((interceptorType) => (
                <option key={interceptorType} value={interceptorType}>
                  {interceptorType}
                </option>
              ))}
            </select>

            <p
              className={`${sharedPropertiesStyles.propertyLabel} ${sharedStyles.mt10}`}
            >
              JS Object
            </p>
            <textarea
              placeholder="Interceptor JS function"
              className={`${sharedPropertiesStyles.textArea} ${sharedStyles.mt5}`}
              value={formData.jsObject}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  jsObject: e.target.value,
                })
              }
            ></textarea>

            <p
              className={`${sharedPropertiesStyles.propertyLabel} ${sharedStyles.mt10}`}
            >
              Event Type
            </p>
            <select
              className={`${sharedPropertiesStyles.selectInput} ${sharedStyles.mt5}`}
              value={formData.eventType}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  eventType: e.target.value as EventTypes,
                });
              }}
            >
              {Object.values(EventTypes)
                .filter((eventType) => {
                  if (
                    formData.interceptorType === InterceptorTypes.CALCULATION
                  ) {
                    return [
                      EventTypes.ON_CHANGE,
                      EventTypes.ON_LOAD,
                      EventTypes.ON_KEY_DOWN,
                    ].includes(eventType);
                  } else if (
                    formData.interceptorType === InterceptorTypes.VALIDATION
                  ) {
                    return [
                      EventTypes.ON_SUBMIT,
                      EventTypes.ON_CHANGE,
                      EventTypes.ON_KEY_DOWN,
                    ].includes(eventType);
                  }
                  return true;
                })
                .map((eventType) => (
                  <option key={eventType} value={eventType}>
                    {eventType}
                  </option>
                ))}
            </select>

            <p
              className={`${sharedPropertiesStyles.propertyLabel} ${sharedStyles.mt10}`}
            >
              Event Object
            </p>
            <MultiSelect
              id="eventObject"
              dataTestId="eventObject"
              value={formData.eventObject}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  eventObject: e?.filter(
                    (key) => !!objectOptions?.find((item) => item.id == key)
                  ),
                })
              }
              options={objectOptions}
              
              onRemoveValue={() => {}}
            />

            <p
              className={`${sharedPropertiesStyles.propertyLabel} ${sharedStyles.mt10}`}
            >
              Message Object
            </p>
            <MultiSelect
              id="msgObject"
              dataTestId="msgObject"
              value={formData.messageObject}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  messageObject: e?.filter(
                    (key) => !!objectOptions?.find((item) => item.id == key)
                  ),
                })
              }
              options={objectOptions}
              onRemoveValue={() => {}}
              
            />

            <p
              className={`${sharedPropertiesStyles.propertyLabel} ${sharedStyles.mt10}`}
            >
              Message
            </p>
            <input
              type="text"
              placeholder="Message text"
              className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
              value={formData.message}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  message: e.target.value,
                })
              }
            ></input>

            <p
              className={`${sharedPropertiesStyles.propertyLabel} ${sharedStyles.mt10}`}
            >
              Message Type
            </p>
            <select
              className={`${sharedPropertiesStyles.selectInput} ${sharedStyles.mt5}`}
              value={formData.messageType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  messageType: e.target.value as MessageTypes,
                })
              }
            >
              {Object.values(MessageTypes).map((messageType) => (
                <option key={messageType} value={messageType}>
                  {messageType}
                </option>
              ))}
            </select>

            <p
              className={`${sharedPropertiesStyles.propertyLabel} ${sharedStyles.mt10}`}
            >
              Message Timeout
            </p>
            <input
              type="number"
              className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
              value={formData.messageTimeout}
              min={1}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  messageTimeout: Number(e.target.value),
                })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default InterceptorForm;
