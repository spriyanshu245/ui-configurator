import { usePropertyPane } from "../../../context/PropertiesContext";
import sharedPropertiesStyles from "../../../styles/properties-pane.module.scss";
import sharedStyles from "../../../styles/shared.module.scss";
import styles from "./FieldPathPanel.module.scss";
import ChevronDownIcon from "../../SVGIcons/ChevronDown";
import { ComponentProperty } from "../../../data/componentProperties";
import { PropertyPanels } from "../../../utils/constants";
import React, { useCallback, useEffect, useState } from "react";
import { generateRandomId } from "../../../utils/utils";
import DeleteIcon from "../../SVGIcons/Delete";
import EditIconButton from "../../EditIconButton/EditIconButton";
import { BuilderComponent, FormComponent } from "../../../types/types";
import AddIcon from "../../SVGIcons/Add";
import { traversFormComponentsNameKeyIdContions } from "../../../utils/formsUtils";
import Modal from "../../InternalComponents/Modal/Modal";
import { useUserTask } from "@/app/context/UserTaskContext";

interface MetadataPanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: FormComponent | BuilderComponent;
  setProperty: (prop: string, value: any) => void;
}

const FieldPathPanel = ({
  propertyKeys,
  propertyComponent,
  setProperty,
}: MetadataPanelProps) => {
  const { nameKeyIds = [], name = "" } = propertyComponent.properties ?? {};
  const { formsNamekeys, tablesNameKeys, setFormsNamekeys, setTablesNameKeys } =
    useUserTask();
  const nameKeys =
    propertyComponent.type === "form" ? formsNamekeys : tablesNameKeys;
  const setNameKeys =
    propertyComponent.type === "form" ? setFormsNamekeys : setTablesNameKeys;

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editedKey, setEditedKey] = useState<string>("");
  const [idToRemove, setIdToRemove] = useState<string>("");
  const { togglePanel, isPanelOpen } = usePropertyPane();
  const [inputValue, setInputValue] = useState("");
  const [isNamekeyExists, setIsNamekeyExists] = useState(false);
  const [isDuplicateNameKey, setIsDuplicateNameKey] = useState(false);
  const addNameKey = () => {
    if (inputValue.trim() !== "" && !isNamekeyExists) {
      const newItem = {
        label: inputValue.trim(),
        id: generateRandomId(),
      };
      const updatedKeys = [...nameKeyIds, newItem];
      setProperty(ComponentProperty.NameKeyIds, updatedKeys);
      setNameKeys({ ...nameKeys, [name]: updatedKeys });
      setInputValue("");
    }
  };

  const removeNameKey = useCallback(() => {
    const updatedKeys = nameKeyIds.filter((item) => item.id !== idToRemove);
    setProperty(ComponentProperty.NameKeyIds, updatedKeys);
    traversFormComponentsNameKeyIdContions(
      propertyComponent as BuilderComponent,
      idToRemove
    );
    setNameKeys({ ...nameKeys, [name]: updatedKeys });
    setIdToRemove("");
  }, [nameKeyIds, idToRemove, nameKeys]);

  const onClose = () => {
    setIdToRemove("");
  };

  const editNameKey = (idToEdit: string) => {
    if (!isDuplicateNameKey && editedKey.trim() !== "") {
      const updatedKeys = nameKeyIds.map((item) => {
        if (item.id === idToEdit) {
          return {
            ...item,
            label: editedKey,
          };
        }
        return item;
      });
      setProperty(ComponentProperty.NameKeyIds, updatedKeys);
      setNameKeys({ ...nameKeys, [name]: updatedKeys });
      setEditingKey("");
      setEditedKey("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      addNameKey();
    }
  };

  useEffect(() => {
    if (inputValue) {
      const existingNameKey = nameKeyIds?.find(
        (item) => item.label === inputValue
      );
      setIsNamekeyExists(!!existingNameKey);
    }
  }, [inputValue]);

  useEffect(() => {
    if (editedKey) {
      const existingNameKey = nameKeyIds?.find(
        (item) => item.label === editedKey && item.id !== editingKey
      );

      setIsDuplicateNameKey(!!existingNameKey);
    } else {
      setIsDuplicateNameKey(false);
    }
  }, [editedKey]);

  const renderProperty = (propertyKey: ComponentProperty) => {
    if (propertyKey === ComponentProperty.NameKeyIds) {
      return (
        <div className={styles.fieldPathPanelContainer}>
          <h5>Add Field Path</h5>
          <div className={styles.addFieldPath}>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value?.trim())}
              onKeyDown={handleKeyPress}
              placeholder="Enter field path"
              rows={3}
            />
            <button
              id={`add-name-key`}
              data-testid={`add-name-key`}
              className={`${sharedStyles.iconButton} ${sharedStyles.svgStroke} ${sharedStyles.small}`}
              onClick={addNameKey}
              disabled={!inputValue.trim() || isNamekeyExists}
              title="Add Field Path"
            >
              <AddIcon />
            </button>
          </div>
          {isNamekeyExists && (
            <div className={sharedPropertiesStyles.errorMessage}>
              This path is already in use.
            </div>
          )}
          <div className={styles.fieldPathsList}>
            <h5>Field Paths ({nameKeyIds?.length}):</h5>
            {nameKeyIds?.length === 0 ? (
              <p className={styles.noFieldPathsAdded}>
                No field paths added yet
              </p>
            ) : (
              <ul className={styles.fieldPaths}>
                {nameKeyIds?.map((item) => (
                  <li key={item.id}>
                    {editingKey === item.id ? (
                      <>
                        <textarea
                          value={editedKey}
                          onChange={(e) => setEditedKey(e.target.value?.trim())}
                          onBlur={() => editNameKey(item.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") editNameKey(item.id);
                          }}
                          rows={3}
                          autoFocus
                        />
                        {isDuplicateNameKey && (
                          <div className={sharedPropertiesStyles.errorMessage}>
                            This path is already in use.
                          </div>
                        )}
                      </>
                    ) : (
                      <div title={item.label} className={styles.fieldPath}>
                        {item.label}
                      </div>
                    )}
                    <div className={styles.actions}>
                      <button
                        id={`delete-${item.id}`}
                        data-testid={`delete-${item.id}`}
                        className={`${sharedStyles.iconButton} ${sharedStyles.small}`}
                        onClick={() => setIdToRemove(item.id)}
                        title={`Delete Field Path`}
                      >
                        <DeleteIcon />
                      </button>
                      {editingKey === item.id ? null : (
                        <EditIconButton
                          id={`edit-${item.id}`}
                          data-testid={`edit-${item.id}`}
                          className={`${sharedStyles.iconButton} ${sharedStyles.small}`}
                          onClick={() => {
                            setEditedKey(item.label);
                            setEditingKey(item.id);
                          }}
                          title={`Edit Field Path`}
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      );
    }

    return null;
  };
  return (
    <div id="FieldPathPanel">
      <button
        id="toggleButton"
        onClick={() => togglePanel?.(PropertyPanels.FieldPathPanel)}
        className={`${sharedPropertiesStyles.panelHeading} ${
          isPanelOpen?.(PropertyPanels.FieldPathPanel)
            ? sharedPropertiesStyles.isOpen
            : ""
        }`}
      >
        <h3>Field Path Manager</h3>
        <ChevronDownIcon />
      </button>
      {isPanelOpen?.(PropertyPanels.FieldPathPanel) && (
        <>
          {propertyKeys.map((propKey) => (
            <div key={`${propKey}-${propertyComponent.id}`}>
              {renderProperty(propKey)}
            </div>
          ))}
        </>
      )}
      <Modal
        isOpen={!!idToRemove}
        onClose={onClose}
        backDrop={onClose}
        onSubmit={removeNameKey}
        title="Remove referenced field?"
        description="If this field is referenced in other field's conditions, removing it will also remove those references. Do you want to proceed?"
        submitText="Delete and remove references"
        cancelText="Cancel"
      ></Modal>
    </div>
  );
};

export default FieldPathPanel;
