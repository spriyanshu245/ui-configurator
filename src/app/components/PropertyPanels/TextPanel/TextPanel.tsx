"use client";
import { ComponentProperty } from "../../../../app/data/componentProperties";
import { propertyIcons } from "../../../../app/data/propertyIcons";
import sharedPropertiesStyles from "../../../../app/styles/properties-pane.module.scss";
import sharedStyle from "../../ExpandableColumn/ExpandableColumn.module.scss";
import sharedStyles from "../../../../app/styles/shared.module.scss";
import styles from "../DataColumnPanel/DataColumnPanel.module.scss";
import {
  contactTypes,
  DATE_FORMAT,
  HELPER_TEXT_POSITION,
  InputKeyFormat,
  inputTypes,
  PropertyPanels,
  separatorOptions,
  TEXT_CASE,
  textAlignTypes,
  textAreaTypes,
  timerUnits,
} from "../../../../app/utils/constants";
import React, { ChangeEvent, useMemo, useState } from "react";
import Slider from "../../UIComponents/Slider/Slider";
import { usePropertyPane } from "../../../../app/context/PropertiesContext";
import ChevronDownIcon from "../../SVGIcons/ChevronDown";
import { useParentFormProperties } from "../../../../app/hooks/useParentFormProperties";
import { getFormElementsList } from "../../../utils/formsUtils";
import {
  BaseComponent,
  NameKeyId,
  SubsectionHeader,
} from "../../../../app/types/types";
import { generateRandomId, getDateFormats } from "../../../../app/utils/utils";
import DragDropFileUpload from "../../UtilityComponents/DragDropFileUpload/DragDropFileUpload";
import ExpandableColumn, {
  AddExpandableColumn,
} from "../../ExpandableColumn/ExpandableColumn";
import TextEditor from "../../UIComponents/TextEditor/TextEditor";
import PropertyInput from "../../PropertyInputs/PropertyInput";
import SubsectionHeaderColumn from "../SubsectionHeaderColumn/SubsectionHeaderColumn";
import DynamicIconColorConditions from "./DynamicIconColorConditions";
import { useUserTask } from "@/app/context/UserTaskContext";
import SelectDropdown, {
  DropdownOption,
} from "@/app/components/InternalComponents/SelectDropdown/SelectDropdown";
import AddIcon from "@/app/components/SVGIcons/Add";
import textPanelStyles from "./TextPanel.module.scss";

interface TextPanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: any;
  component?: any;
  setProperty: (prop: string, value: any) => void;
  setProperties: (properties: { [key: string]: any }) => void;
  parentComponentName?: string;
}

const TextPanel = ({
  propertyKeys,
  propertyComponent,
  component,
  setProperty,
  setProperties,
  parentComponentName,
}: TextPanelProps) => {
  const { properties } = propertyComponent;
  const {
    tablesNameKeys,
    updateComponentProperties,
    formsNamekeys,
    setFormsNamekeys,
  } = useUserTask();
  const pillsData = properties.subsectionHeaders ?? [];
  const { togglePanel, isPanelOpen } = usePropertyPane();
  const { parentForm } = useParentFormProperties(propertyComponent);
  const tableNameKeys = parentComponentName
    ? tablesNameKeys[parentComponentName]
    : [];

  let nameKeyIds: NameKeyId[] = [];

  if (component?.properties.columnInputType === "multiple-actions") {
    nameKeyIds = tableNameKeys;
  } else if (
    propertyComponent.type === "input-table-column" ||
    propertyComponent.type === "table-column"
  ) {
    nameKeyIds = component?.properties.nameKeyIds ?? [];
  } else {
    nameKeyIds = parentForm?.properties?.nameKeyIds ?? [];
  }

  const formElementsNameList = useMemo(
    () =>
      getFormElementsList(
        parentForm?.components as BaseComponent[],
        propertyComponent.id,
      ) ?? [],
    [parentForm, propertyComponent.id],
  );

  const [showAddKey, setShowAddKey] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState("");

  const isNewKeyDuplicate = useMemo(() => {
    if (!newKeyValue.trim()) return false;
    return (
      nameKeyIds?.some((item) => item.label === newKeyValue.trim()) ?? false
    );
  }, [newKeyValue, nameKeyIds]);

  const handleAddNameKey = () => {
    const trimmedValue = newKeyValue.trim();
    if (trimmedValue === "" || isNewKeyDuplicate || !parentForm) return;

    const newItem: NameKeyId = {
      label: trimmedValue,
      id: generateRandomId(),
    };
    const currentKeys = parentForm.properties?.nameKeyIds ?? [];
    const updatedKeys = [...currentKeys, newItem];

    updateComponentProperties(
      parentForm.id,
      ComponentProperty.NameKeyIds,
      updatedKeys,
    );

    const formName = parentForm.properties?.name ?? "";
    setFormsNamekeys({ ...formsNamekeys, [formName]: updatedKeys });

    setProperty(ComponentProperty.Name, newItem.id);
    setNewKeyValue("");
    setShowAddKey(false);
  };

  const handleNewKeyKeyPress = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddNameKey();
    }
  };

  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
  const prefixSuffixOptions = [
    { label: "Prefix", value: "prefix" },
    { label: "Suffix", value: "suffix" },
    { label: "Prefix and Suffix", value: "prefix-suffix" },
  ];

  const dynamicIconOptions = [
    { label: "Circle", value: "circle-solid" },
    { label: "Phone", value: "phone" },
  ];

  const dialectOptions = [
    { label: "LOS", value: "LOS" },
    { label: "COLLECT", value: "COLLECT" },
  ];

  const isFormInputNameTaken = formElementsNameList.includes(properties?.name);

  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setProperty(ComponentProperty.Text, e.target.value);
  };

  const handleLabelCheck = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProperty(ComponentProperty.ShowLabel, e.target.checked);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.replace(InputKeyFormat, "");
    setProperty(ComponentProperty.Name, value);
  };

  const handleHelperTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProperty(ComponentProperty.HelperText, e.target.value);
  };

  const handleShowHelperText = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProperty(ComponentProperty.ShowHelperText, e.target.checked);
  };

  const handleChange = (name: string, value: any) => {
    setProperty(name, value);
  };

  const handleAddColorCondition = (prefixSuffix: string) => {
    const conditions =
      properties?.[`${prefixSuffix}DynamicIconColorConditions`] ?? [];
    const newCondition = {
      id: generateRandomId(),
      leftOperand: "",
      operator: "==",
      rightOperand: "",
      color: "#000000",
    };
    handleChange(`${prefixSuffix}DynamicIconColorConditions`, [
      ...conditions,
      newCondition,
    ]);
  };

  const handleIconUploadTypeChange = (name: string, value: string) => {
    if (value === "dynamic") {
      setProperties({
        [name]: value,
        prefixDynamicIconName: "circle-solid",
        prefixDynamicIconSize: 16,
        prefixDynamicIconDefaultColor: "#808080",
      });
    } else {
      handleChange(name, value);
    }
  };

  const handlePrefixSuffixChange = (prefixSuffix: string) => {
    return (
      <>
        <div
          className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
        >
          <p
            className={`${sharedPropertiesStyles.propertyLabel} ${sharedStyles.mb5}`}
          >
            {
              prefixSuffixOptions.find((item) => item.value === prefixSuffix)
                ?.label
            }{" "}
            type
          </p>
          <SelectDropdown
            id={`${prefixSuffix}Type`}
            options={[
              { label: "Text", value: "text" },
              { label: "Icon", value: "icon" },
            ]}
            value={properties?.[`${prefixSuffix}Type`] ?? ""}
            onChange={(value) => handleChange(`${prefixSuffix}Type`, value)}
            placeholder="Select type"
            showSearch={false}
            usePortal
          />
        </div>
        {properties?.[`${prefixSuffix}Type`] === "text" && (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Text</p>
            <input
              id={`${prefixSuffix}Text`}
              className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
              type="text"
              value={properties?.[`${prefixSuffix}Text`] ?? ""}
              placeholder="Enter Text"
              onChange={(e) =>
                handleChange(`${prefixSuffix}Text`, e.target.value)
              }
            />
          </div>
        )}
        {properties?.[`${prefixSuffix}Type`] === "icon" && (
          <>
            <div
              className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
            >
              <p
                className={`${sharedPropertiesStyles.propertyLabel} ${sharedStyles.mb5}`}
              >
                Icon Upload Type
              </p>
              <SelectDropdown
                id={`${prefixSuffix}IconUploadType`}
                options={[
                  { label: "URL", value: "url" },
                  { label: "File Upload", value: "file-upload" },
                  ...(prefixSuffix === "prefix"
                    ? [{ label: "Dynamic Icons", value: "dynamic" }]
                    : []),
                ]}
                value={properties?.[`${prefixSuffix}IconUploadType`] ?? ""}
                onChange={(value) =>
                  handleIconUploadTypeChange(
                    `${prefixSuffix}IconUploadType`,
                    value,
                  )
                }
                placeholder="Select"
                showSearch={false}
                usePortal
              />
            </div>
            {properties?.[`${prefixSuffix}IconUploadType`] === "url" && (
              <div
                className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
              >
                <p className={sharedPropertiesStyles.propertyLabel}>Icon URL</p>
                <input
                  id={`${prefixSuffix}IconUrl`}
                  data-testid="iconUrl"
                  className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
                  type="text"
                  value={properties?.[`${prefixSuffix}IconUrl`] ?? ""}
                  placeholder="Enter icon URL"
                  onChange={(e) =>
                    handleChange(`${prefixSuffix}IconUrl`, e.target.value)
                  }
                />
              </div>
            )}
            {properties?.[`${prefixSuffix}IconUploadType`] ===
              "file-upload" && (
              <div
                className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
              >
                <p className={sharedPropertiesStyles.propertyLabel}>
                  Image Upload
                </p>
                <DragDropFileUpload
                  id={`${prefixSuffix}IconUpload`}
                  componentId={component.id}
                  propertyKey={`${prefixSuffix}IconUrl`}
                  fileTypes={["svg", "png", "jpg", "jpeg"]}
                  maxSize={2 * 1024 * 1024}
                  buttonClassName={styles.buttonStyle}
                  handleChange={handleChange}
                />
              </div>
            )}
            {properties?.[`${prefixSuffix}IconUploadType`] === "dynamic" && (
              <>
                <PropertyInput
                  id={`${prefixSuffix}DynamicIconName`}
                  type="select"
                  label="Icon Type"
                  value={properties?.[`${prefixSuffix}DynamicIconName`]}
                  handleChange={(e) =>
                    handleChange(
                      `${prefixSuffix}DynamicIconName`,
                      (e as React.ChangeEvent<HTMLSelectElement>).target.value,
                    )
                  }
                  options={dynamicIconOptions}
                />

                <PropertyInput
                  id={`${prefixSuffix}DynamicIconSize`}
                  type="number"
                  label="Icon Size (px)"
                  value={properties?.[`${prefixSuffix}DynamicIconSize`]}
                  handleChange={(e) =>
                    handleChange(
                      `${prefixSuffix}DynamicIconSize`,
                      parseInt(
                        (e as React.ChangeEvent<HTMLInputElement>).target.value,
                      ),
                    )
                  }
                  min={8}
                  max={48}
                />

                <PropertyInput
                  id={`${prefixSuffix}HideIconOnNoMatch`}
                  type="checkbox"
                  label="Hide Icon When No Condition Matches"
                  value={!!properties?.[`${prefixSuffix}HideIconOnNoMatch`]}
                  handleChange={(e) =>
                    handleChange(
                      `${prefixSuffix}HideIconOnNoMatch`,
                      (e as React.ChangeEvent<HTMLInputElement>).target.checked,
                    )
                  }
                />

                {!properties?.[`${prefixSuffix}HideIconOnNoMatch`] && (
                  <PropertyInput
                    id={`${prefixSuffix}DynamicIconDefaultColor`}
                    type="text"
                    label="Default Color (hex)"
                    value={
                      properties?.[`${prefixSuffix}DynamicIconDefaultColor`]
                    }
                    placeholder="#808080"
                    handleChange={(e) =>
                      handleChange(
                        `${prefixSuffix}DynamicIconDefaultColor`,
                        (e as React.ChangeEvent<HTMLInputElement>).target.value,
                      )
                    }
                  />
                )}

                <DynamicIconColorConditions
                  properties={properties}
                  prefixSuffix={prefixSuffix}
                  setProperty={setProperty}
                  handleAddCondition={() =>
                    handleAddColorCondition(prefixSuffix)
                  }
                />
              </>
            )}
          </>
        )}
      </>
    );
  };

  const resetProperties = (type: string) => {
    if (type !== "number") {
      setProperties({
        isCalculated: false,
        formula: "",
        inputType: type,
      });
    } else {
      setProperty("inputType", type);
    }
  };

  const handleAddPill = () => {
    const newPill = {
      id: generateRandomId(),
      type: "subsection-header",
      properties: {
        label: `Pill ${pillsData.length + 1}`,
        value: `Pill ${pillsData.length + 1}`,
        colSpan: "1",
        columnInputType: "text",
      },
    };

    const updatedPills = [...pillsData, newPill];
    setProperty(ComponentProperty.SubsectionHeaders, updatedPills);
  };

  const handleIsRichTextEditorCheck = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setProperty(ComponentProperty.IsRichTextEditor, e.target.checked);
  };

  const renderProperty = (propertyKey: ComponentProperty) => {
    switch (propertyKey) {
      case ComponentProperty.Name:
        return propertyComponent.category === "component" ? (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Field Path</p>
            <textarea
              id="name"
              data-testid="name"
              className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
              value={properties?.name ?? ""}
              placeholder="Enter name here"
              onChange={handleNameChange}
              rows={3}
              style={{ resize: "none", overflowY: "auto" }}
            />
          </div>
        ) : (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p
              className={`${sharedPropertiesStyles.propertyLabel} ${sharedStyles.mb5}`}
            >
              Field Path
            </p>
            <SelectDropdown
              id="name"
              options={
                nameKeyIds?.map(
                  (option): DropdownOption => ({
                    value: option.id,
                    label: option.label,
                  }),
                ) ?? []
              }
              value={properties?.name ?? ""}
              onChange={(value) =>
                setProperty(
                  ComponentProperty.Name,
                  value.replace(InputKeyFormat, ""),
                )
              }
              placeholder="select the name"
              showSearch
              usePortal
            />
            {isFormInputNameTaken && (
              <span className={sharedPropertiesStyles.errorMessage}>
                This path is already in use.
              </span>
            )}
            {parentForm && (
              <div className={textPanelStyles.addKeyContainer}>
                <button
                  type="button"
                  className={textPanelStyles.addKeyToggle}
                  onClick={() => setShowAddKey((prev) => !prev)}
                >
                  {showAddKey ? "Cancel" : "Add new field path"}
                </button>
                {showAddKey && (
                  <div className={textPanelStyles.addKeySection}>
                    <textarea
                      value={newKeyValue}
                      onChange={(e) => setNewKeyValue(e.target.value?.trim())}
                      onKeyDown={handleNewKeyKeyPress}
                      placeholder="Enter field path"
                      rows={2}
                      className={textPanelStyles.addKeyTextarea}
                    />
                    <button
                      type="button"
                      className={`${sharedStyles.iconButton} ${sharedStyles.svgStroke} ${sharedStyles.small}`}
                      onClick={handleAddNameKey}
                      disabled={!newKeyValue.trim() || isNewKeyDuplicate}
                      title="Add Field Path"
                    >
                      <AddIcon />
                    </button>
                  </div>
                )}
                {isNewKeyDuplicate && (
                  <span className={sharedPropertiesStyles.errorMessage}>
                    This key already exists.
                  </span>
                )}
              </div>
            )}
          </div>
        );

      case ComponentProperty.Text:
        if (
          propertyComponent.type === "typograph" &&
          properties.isRichTextEditor
        )
          return;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Text</p>
            {propertyComponent.type === "typograph" ? (
              <>
                <textarea
                  placeholder="Enter text here"
                  className={`${sharedPropertiesStyles.textArea} ${sharedStyles.mt5}`}
                  value={properties?.text ?? ""}
                  onChange={handleTextChange}
                ></textarea>
                <TypographGuide />
              </>
            ) : (
              <input
                id="text"
                className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
                type="text"
                value={properties?.text ?? ""}
                placeholder="Enter text here"
                onChange={handleTextChange}
              />
            )}
          </div>
        );
      case ComponentProperty.ShowHyphen:
        return (
          <PropertyInput
            id="showHyphen"
            type="checkbox"
            value={!!properties?.showHyphen}
            label="Show Hyphen for Empty Text"
            handleChange={(e) =>
              setProperty(
                ComponentProperty.ShowHyphen,
                (e as React.ChangeEvent<HTMLInputElement>).target.checked,
              )
            }
          ></PropertyInput>
        );

      case ComponentProperty.IsRichTextEditor:
        return (
          <PropertyInput
            id="isRichTextEditor"
            type="checkbox"
            value={!!properties?.isRichTextEditor}
            label="Rich Text Editor"
            handleChange={(e) =>
              handleIsRichTextEditorCheck(
                e as React.ChangeEvent<HTMLInputElement>,
              )
            }
          ></PropertyInput>
        );

      case ComponentProperty.RichTextEditor:
        if (
          propertyComponent.type === "typograph" &&
          properties.isRichTextEditor
        )
          return (
            <TextEditor
              id="richTextEditor"
              value={properties.richTextEditor ?? ""}
              onChange={(newVal) =>
                setProperty(ComponentProperty.RichTextEditor, newVal)
              }
            />
          );
        return;

      case ComponentProperty.TextAlign:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Text Align</p>
            <div
              className={`${sharedPropertiesStyles.optionGrid} ${sharedStyles.mt5}`}
            >
              {textAlignTypes.map((align) => (
                <button
                  id={align}
                  key={align}
                  data-testid={align}
                  className={`${sharedPropertiesStyles.option} ${
                    properties?.textAlign === align
                      ? sharedPropertiesStyles.active
                      : ""
                  }`}
                  onClick={() => setProperty("textAlign", align)}
                >
                  <div
                    className={sharedPropertiesStyles.iconContainer}
                    dangerouslySetInnerHTML={{
                      __html: propertyIcons
                        .filter(
                          (icon) =>
                            icon.property === "textAlign" &&
                            icon.value === align,
                        )
                        .map((icon) => icon.svgCode),
                    }}
                  ></div>
                </button>
              ))}
            </div>
          </div>
        );

      case ComponentProperty.TextColor:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>
              Text Color (hex)
            </p>
            <input
              id="textColor"
              className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
              type="text"
              value={properties?.textColor ?? ""}
              placeholder="Enter text color here"
              onChange={(e) => setProperty("textColor", e.target.value)}
            />
          </div>
        );

      case ComponentProperty.TextSize:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Text Size</p>
            <Slider
              id="textSize"
              min={12}
              max={36}
              step={2}
              value={properties?.textSize || 12}
              valueSuffix="px"
              onChange={(value) =>
                setProperty(ComponentProperty.TextSize, value)
              }
            />
          </div>
        );

      case ComponentProperty.ShowLabel:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="showLabel"
                type="checkbox"
                checked={!!properties?.showLabel}
                onChange={handleLabelCheck}
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Show Label
              </span>
            </label>
          </div>
        );

      case ComponentProperty.Label:
        return (
          <>
            {properties?.showLabel && (
              <div
                className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
              >
                <p className={sharedPropertiesStyles.propertyLabel}>Label</p>
                <input
                  id="label"
                  data-testid="label"
                  className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
                  type="text"
                  value={properties?.label ?? ""}
                  placeholder="Enter label here"
                  onChange={(e) => setProperty("label", e.target.value)}
                />
              </div>
            )}
          </>
        );

      case ComponentProperty.HelperText:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="showHelperText"
                data-testid="showHelperText"
                type="checkbox"
                checked={!!properties?.showHelperText}
                onChange={handleShowHelperText}
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Show Helper Text
              </span>
            </label>
            {properties?.showHelperText && (
              <>
                <input
                  id="helperText"
                  data-testid="helperText"
                  className={`${sharedPropertiesStyles.textArea} ${sharedStyles.mt5} ${sharedStyles.mb10}`}
                  type="text"
                  value={properties?.helperText ?? ""}
                  placeholder="Enter Helper Text here"
                  onChange={handleHelperTextChange}
                />

                <p
                  className={`${sharedPropertiesStyles.propertyLabel} ${sharedStyles.mt5} ${sharedStyles.mb5}`}
                >
                  Helper Text Position
                </p>
                <SelectDropdown
                  id="helperTextPosition"
                  options={HELPER_TEXT_POSITION}
                  value={
                    propertyComponent?.properties?.helperTextPosition ?? ""
                  }
                  onChange={(value) =>
                    setProperty(ComponentProperty.HelperTextPosition, value)
                  }
                  placeholder="Select"
                  showSearch={false}
                  usePortal
                />
                {propertyComponent?.properties?.helperTextPosition ===
                  "belowInput" && (
                  <>
                    <p
                      className={`${sharedPropertiesStyles.propertyLabel} ${sharedStyles.mt5}`}
                    >
                      Helper Text Spacing (px)
                    </p>
                    <input
                      id="helperTextSpacing"
                      data-testid="helperTextSpacing"
                      className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
                      type="number"
                      min={0}
                      value={properties?.helperTextSpacing ?? ""}
                      placeholder="Enter spacing in px"
                      onChange={(e) =>
                        setProperty(
                          ComponentProperty.HelperTextSpacing,
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                        )
                      }
                    />
                  </>
                )}
              </>
            )}
          </div>
        );

      case ComponentProperty.Placeholder:
        if (properties?.columnDataType === "display") return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Placeholder</p>
            <input
              id="placeholder"
              className={`${sharedPropertiesStyles.textArea} ${sharedStyles.mt5}`}
              type="text"
              value={properties?.placeholder ?? ""}
              placeholder="Enter placeholder here"
              onChange={(e) =>
                setProperty(ComponentProperty.Placeholder, e.target.value)
              }
            />
          </div>
        );

      case ComponentProperty.InputType:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Input Type</p>
            <div
              className={`${sharedPropertiesStyles.optionGrid} ${sharedStyles.mt5}`}
            >
              {inputTypes.map((type) => (
                <button
                  id="inputType"
                  data-testid={type}
                  key={type}
                  className={`${sharedPropertiesStyles.option} ${
                    propertyComponent?.properties?.inputType === type
                      ? sharedPropertiesStyles.active
                      : ""
                  }`}
                  onClick={() => resetProperties(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        );

      case ComponentProperty.ContactType:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Contact Type</p>
            <div
              className={`${sharedPropertiesStyles.optionGrid} ${sharedStyles.mt5}`}
            >
              {contactTypes.map((type) => (
                <button
                  id="inputType"
                  data-testid={type}
                  key={type}
                  className={`${sharedPropertiesStyles.option} ${
                    propertyComponent?.properties?.contactType === type
                      ? sharedPropertiesStyles.active
                      : ""
                  }`}
                  onClick={() => {
                    setProperty(ComponentProperty.ContactType, type);
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        );

      case ComponentProperty.DateSeparator:
        if (properties?.columnDataType === "display") return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p
              className={`${sharedPropertiesStyles.propertyLabel} ${sharedStyles.mb5}`}
            >
              Date Separator
            </p>
            <SelectDropdown
              id="dateSeparator"
              options={separatorOptions}
              value={properties?.dateSeparator ?? ""}
              onChange={(value) => {
                const sep = value || "/";
                const fmt = getDateFormats(sep)[0];
                setProperties({
                  [ComponentProperty.DateSeparator]: sep,
                  [ComponentProperty.Format]: fmt,
                  [ComponentProperty.Placeholder]: fmt,
                });
              }}
              placeholder="Select a value"
              showSearch={false}
              usePortal
            />
          </div>
        );

      case ComponentProperty.Format:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p
              className={`${sharedPropertiesStyles.propertyLabel} ${sharedStyles.mb5}`}
            >
              Date Format
            </p>
            <SelectDropdown
              id="format"
              options={DATE_FORMAT}
              value={properties?.format ?? ""}
              onChange={(value) =>
                setProperties({ [ComponentProperty.Format]: value })
              }
              placeholder="Select Format"
              showSearch={false}
              usePortal
            />
          </div>
        );

      case ComponentProperty.TextCase:
        return (
          propertyComponent.properties.inputType === "text" && (
            <div
              className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
            >
              <p
                className={`${sharedPropertiesStyles.propertyLabel} ${sharedStyles.mb5}`}
              >
                Text Case
              </p>
              <SelectDropdown
                id="textCase"
                options={TEXT_CASE.map(
                  (opt): DropdownOption => ({
                    label: opt,
                    value: opt,
                  }),
                )}
                value={properties?.textCase ?? ""}
                onChange={(value) =>
                  setProperties({ [ComponentProperty.TextCase]: value })
                }
                placeholder="Select"
                showSearch={false}
                usePortal
              />
            </div>
          )
        );

      case ComponentProperty.ShowConfirmation:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="showConfirmation"
                data-testid="showConfirmation"
                type="checkbox"
                checked={!!properties?.showConfirmation}
                onChange={(e) =>
                  setProperty(
                    ComponentProperty.ShowConfirmation,
                    e.target.checked,
                  )
                }
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Show Confirmation
              </span>
            </label>
          </div>
        );

      case ComponentProperty.PrefixSuffix:
        if (properties.columnInputType === "api-action") return null;
        return (
          <>
            <div
              className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
            >
              <p
                className={`${sharedPropertiesStyles.propertyLabel} ${sharedStyles.mb5}`}
              >
                Prefix / Suffix
              </p>
              <SelectDropdown
                id="prefixSuffix"
                options={prefixSuffixOptions}
                value={properties?.prefixSuffix ?? ""}
                onChange={(value) => handleChange("prefixSuffix", value)}
                placeholder="None"
                showSearch={false}
                usePortal
              />
            </div>

            {properties.prefixSuffix &&
              properties?.prefixSuffix !== "" &&
              (properties?.prefixSuffix === "prefix-suffix" ? (
                <>
                  {handlePrefixSuffixChange("prefix")}
                  {handlePrefixSuffixChange("suffix")}
                </>
              ) : (
                <>{handlePrefixSuffixChange(properties?.prefixSuffix)}</>
              ))}
          </>
        );

      case ComponentProperty.IsCollapsible:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="isCollapsible"
                type="checkbox"
                checked={!!properties?.isCollapsible}
                onChange={(e) =>
                  setProperty(ComponentProperty.IsCollapsible, e.target.checked)
                }
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Is Collapsible
              </span>
            </label>
          </div>
        );
      case ComponentProperty.IsExpandedByDefault:
        if (properties?.isCollapsible !== true) return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="isExpandedByDefault"
                type="checkbox"
                checked={!!properties?.isExpandedByDefault}
                onChange={(e) =>
                  setProperty(
                    ComponentProperty.IsExpandedByDefault,
                    e.target.checked,
                  )
                }
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Is Expanded by Default
              </span>
            </label>
          </div>
        );
      case ComponentProperty.IsHorizontalCollapsible:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="isHorizontalCollapsible"
                type="checkbox"
                data-testid="isHorizontalCollapsible"
                checked={!!properties?.isHorizontalCollapsible}
                onChange={(e) =>
                  setProperty(
                    ComponentProperty.IsHorizontalCollapsible,
                    e.target.checked,
                  )
                }
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Is Horizontal Collapsible
              </span>
            </label>
          </div>
        );

      case ComponentProperty.SubsectionHeaders:
        if (properties?.isCollapsible !== true) return null;

        return (
          <div className={`${styles.columns}`} data-testid="subsectionHeaders">
            <div className={styles.columnHeader}>Headers</div>
            <div className={sharedStyle.draggableRows}>
              {pillsData.map((pill: SubsectionHeader, index: number) => {
                return (
                  <ExpandableColumn
                    id={index}
                    key={pill.id}
                    colData={pillsData}
                    column={pill}
                    draggedItemId={draggedItemId}
                    setDraggedItemId={setDraggedItemId}
                    setProperty={setProperty}
                    setProperties={setProperties}
                    property={ComponentProperty.SubsectionHeaders}
                    propertyComponent={propertyComponent}
                    isPill={true}
                    minColCount={0}
                    label={pill.properties?.label}
                  >
                    <SubsectionHeaderColumn
                      id={index}
                      setProperty={setProperty}
                      propertyComponent={propertyComponent}
                      column={pill}
                    />
                  </ExpandableColumn>
                );
              })}
              {pillsData.length < 8 && (
                <AddExpandableColumn
                  handleAddCol={handleAddPill}
                  label="Pill"
                />
              )}
            </div>
          </div>
        );

      case ComponentProperty.ProcessIdKey:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Stage Id Key</p>
            <input
              id="processIdKey"
              className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
              type="text"
              value={properties?.processIdKey ?? ""}
              placeholder="Enter key here"
              onChange={(e) =>
                setProperty(ComponentProperty.ProcessIdKey, e.target.value)
              }
            />
          </div>
        );

      case ComponentProperty.ApplicationKey:
        return (
          <PropertyInput
            id="applicationKey"
            label="Application Number Key"
            type="text"
            value={propertyComponent?.properties?.applicationKey ?? ""}
            placeholder="Enter key here"
            handleChange={(e) =>
              setProperty(ComponentProperty.ApplicationKey, e.target.value)
            }
          />
        );

      case ComponentProperty.FromListTitle:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>
              From List Title
            </p>
            <input
              id="fromListTitle"
              className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
              type="text"
              value={properties?.fromListTitle ?? ""}
              placeholder="Enter Title here"
              onChange={(e) => setProperty("fromListTitle", e.target.value)}
            />
          </div>
        );

      case ComponentProperty.ToListTitle:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>
              To List Title
            </p>
            <input
              id="toListTitle"
              className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
              type="text"
              value={properties?.toListTitle ?? ""}
              placeholder="Enter Title here"
              onChange={(e) => setProperty("toListTitle", e.target.value)}
            />
          </div>
        );

      case ComponentProperty.LanguageMode:
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>
              Language Mode
            </p>
            <div
              className={`${sharedPropertiesStyles.optionGrid} ${sharedStyles.mt5}`}
            >
              {textAreaTypes.map((mode) => (
                <button
                  id="inputType"
                  data-testid={mode}
                  key={mode}
                  className={`${sharedPropertiesStyles.option} ${
                    propertyComponent?.properties?.languageMode === mode
                      ? sharedPropertiesStyles.active
                      : ""
                  }`}
                  onClick={() => {
                    setProperty(ComponentProperty.LanguageMode, mode);
                  }}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        );

      case ComponentProperty.DialectCode:
        if (
          properties.columnInputType !== "condition-builder" &&
          propertyComponent.type !== "condition-builder"
        )
          return null;
        return (
          <PropertyInput
            id="dialectCode"
            type="select"
            value={properties.dialectCode}
            label="Dialect Code"
            placeholder="Select Dialect"
            options={dialectOptions}
            handleChange={(e) =>
              setProperty(ComponentProperty.DialectCode, e.target.value)
            }
          />
        );

      case ComponentProperty.ConfigureTimer:
        if (
          propertyComponent.type === "button-v2" &&
          properties.actionType !== "submit"
        )
          return null;
        return (
          <PropertyInput
            id="configureTimer"
            type="checkbox"
            label="Configure Timer"
            value={!!properties?.configureTimer}
            handleChange={(e) =>
              setProperty(
                ComponentProperty.ConfigureTimer,
                (e as ChangeEvent<HTMLInputElement>).target.checked,
              )
            }
          />
        );

      case ComponentProperty.Timer:
        if (
          (propertyComponent.type === "button-v2" &&
            properties.actionType !== "submit") ||
          !properties.configureTimer
        )
          return null;
        return (
          <PropertyInput
            id="timer"
            type="number"
            value={properties.timer ?? ""}
            handleChange={(e) =>
              setProperty(ComponentProperty.Timer, e.target.value)
            }
            label="Timer"
            placeholder="Enter time value"
          />
        );

      case ComponentProperty.TimerUnit:
        if (
          (propertyComponent.type === "button-v2" &&
            properties.actionType !== "submit") ||
          !properties.configureTimer
        )
          return null;
        return (
          <div
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Timer Unit</p>
            <div
              className={`${sharedPropertiesStyles.optionGrid} ${sharedStyles.mt5}`}
            >
              {timerUnits.map((unit) => (
                <button
                  data-testid={`timerUnit-${unit.value}`}
                  id={`timerUnit-${unit.value}`}
                  key={unit.value}
                  className={`${sharedPropertiesStyles.option} ${
                    (properties.timerUnit ?? "min") === unit.value
                      ? sharedPropertiesStyles.active
                      : ""
                  }`}
                  onClick={() =>
                    setProperty(ComponentProperty.TimerUnit, unit.value)
                  }
                >
                  {unit.label}
                </button>
              ))}
            </div>
          </div>
        );

      case ComponentProperty.TimerText:
        if (
          (propertyComponent.type === "button-v2" &&
            properties.actionType !== "submit") ||
          !properties.configureTimer
        )
          return null;
        return (
          <PropertyInput
            id="timerText"
            type="text"
            value={properties.timerText ?? ""}
            handleChange={(e) =>
              setProperty(ComponentProperty.TimerText, e.target.value)
            }
            label="Timer Label"
            placeholder="Enter timer label"
          />
        );

      case ComponentProperty.SliderMin:
        return (
          <PropertyInput
            id="sliderMin"
            type="text"
            value={properties.sliderMin ?? "0"}
            handleChange={(e) =>
              setProperty(ComponentProperty.SliderMin, e.target.value)
            }
            label="Min Value"
            placeholder="e.g. 0 or ${session.key}"
          />
        );

      case ComponentProperty.SliderMax:
        return (
          <PropertyInput
            id="sliderMax"
            type="text"
            value={properties.sliderMax ?? "100"}
            handleChange={(e) =>
              setProperty(ComponentProperty.SliderMax, e.target.value)
            }
            label="Max Value"
            placeholder="e.g. 100 or ${session.key}"
          />
        );

      case ComponentProperty.SliderStep:
        return (
          <PropertyInput
            id="sliderStep"
            type="number"
            value={properties.sliderStep ?? 1}
            handleChange={(e) =>
              setProperty(ComponentProperty.SliderStep, Number(e.target.value))
            }
            label="Step"
            placeholder="Enter step value"
          />
        );

      case ComponentProperty.SliderPrefixText:
        return (
          <PropertyInput
            id="sliderPrefixText"
            type="text"
            value={properties.sliderPrefixText ?? ""}
            handleChange={(e) =>
              setProperty(ComponentProperty.SliderPrefixText, e.target.value)
            }
            label="Prefix Text"
            placeholder="e.g. Rs."
          />
        );

      case ComponentProperty.SliderSuffixText:
        return (
          <PropertyInput
            id="sliderSuffixText"
            type="text"
            value={properties.sliderSuffixText ?? ""}
            handleChange={(e) =>
              setProperty(ComponentProperty.SliderSuffixText, e.target.value)
            }
            label="Suffix Text"
            placeholder="e.g. %"
          />
        );

      case ComponentProperty.SliderValueFontSize:
        return (
          <PropertyInput
            id="sliderValueFontSize"
            type="number"
            value={properties.sliderValueFontSize ?? 24}
            handleChange={(e) =>
              setProperty(
                ComponentProperty.SliderValueFontSize,
                Number(e.target.value),
              )
            }
            label="Value Font Size"
            placeholder="Enter font size"
          />
        );

      case ComponentProperty.SliderValueFontWeight:
        return (
          <PropertyInput
            id="sliderValueFontWeight"
            type="select"
            value={properties.sliderValueFontWeight ?? "600"}
            handleChange={(e) =>
              setProperty(
                ComponentProperty.SliderValueFontWeight,
                e.target.value,
              )
            }
            label="Value Font Weight"
            options={[
              { label: "Normal (400)", value: "400" },
              { label: "Medium (500)", value: "500" },
              { label: "Semi Bold (600)", value: "600" },
              { label: "Bold (700)", value: "700" },
              { label: "Extra Bold (800)", value: "800" },
            ]}
          />
        );

      default:
        return null;
    }
  };
  return (
    <>
      {propertyKeys && propertyKeys.length > 0 && (
        <div id="textPanel">
          <button
            id="toggleButton"
            onClick={() => togglePanel?.(PropertyPanels.TextPanel)}
            className={`${sharedPropertiesStyles.panelHeading} ${
              isPanelOpen?.(PropertyPanels.TextPanel)
                ? sharedPropertiesStyles.isOpen
                : ""
            }`}
          >
            <h3 data-testid="textPanelHeading">Text</h3>
            <ChevronDownIcon />
          </button>

          {isPanelOpen && isPanelOpen(PropertyPanels.TextPanel) && (
            <>
              {propertyKeys.map((propKey) => (
                <div key={`${propKey}-${propertyComponent.id}`}>
                  {renderProperty(propKey)}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </>
  );
};

const TYPOGRAPH_GUIDE_TEXT = `Text Formatting:
- *bold* → Renders bold text
- ~medium~ → Renders medium weight text
- __italic__ → Renders italic text
- \\n → Adds a line break (new line) OR Press enter for next line

Directives:

currency Directive to format values as currency:
- \$balanceSummary[0].balanceAmount?currency("INR") - formData
- \${loan-accounts.loan-overview.balance-summary[0].balanceAmount}?currency("INR") - session data
- INR / USD / EUR / GBP supported

date Directive to format values as date:
- \$balanceSummary[0].balanceAmount?date("DD/MM/YYYY")
-"DD/MM/YYYY" / "MM/DD/YYY" / "DD MMM YYYY" supported

Dynamic Session Path Mapping:
- Example: \${loan-accounts.loan-overview.balance-summary.eventValidationFailure}
- Example Session Data -
  loan-accounts.loan-overview.balance-summary:
    {
      "eventValidationFailure": 
      [
        {
          "errorCode": "EXAMPLE_ERROR_CODE_1",
          "errorDescription": "Example error description 1"
        },
         {
          "errorCode": "EXAMPLE_ERROR_CODE_2",
          "errorDescription": "Example error description 2"
        }
      ]
    }

Array Access:

  - All objects of an array:
  \${loan-accounts.loan-overview.balance-summary.eventValidationFailure[].errorDescription}
  → Returns all errorDescription values as multiple lines

  - First object of an array: Replace [] with [*]

  - Specific object in array (by index): Replace [] with [0]
 

Hardcoded Text Examples:
- "Thank you for your payment!"
- "Next EMI date: *25th July 2025*\\nAmount: __₹5,000__"

Important:
- Ensure the session keys exist before referencing
- Format is case-sensitive and must follow object structure exactly
- Use line breaks (\\n) between multiple dynamic lines if needed`;

const TypographGuide = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={sharedPropertiesStyles.guideContainer}>
      <button
        type="button"
        className={`${sharedPropertiesStyles.guideToggle} ${isExpanded ? sharedPropertiesStyles.guideToggleExpanded : ""}`}
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <span>Formatting & Dynamic Typograph Guide</span>
        <span
          className={`${sharedPropertiesStyles.guideChevron} ${isExpanded ? sharedPropertiesStyles.guideChevronExpanded : ""}`}
        >
          <ChevronDownIcon />
        </span>
      </button>
      {isExpanded && (
        <p className={sharedPropertiesStyles.propertyHelperText}>
          {TYPOGRAPH_GUIDE_TEXT}
        </p>
      )}
    </div>
  );
};

export default TextPanel;
