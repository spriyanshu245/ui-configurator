"use client";
import { useState } from "react";
import { ComponentProperty } from "@/app/data/componentProperties";
import { PropertyPanels } from "@/app/utils/constants";
import sharedPropertiesStyles from "@/app/styles/properties-pane.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import sharedStyle from "../../ExpandableColumn/ExpandableColumn.module.scss";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import ChevronDownIcon from "../../SVGIcons/ChevronDown";
import ExpandableColumn, {
  AddExpandableColumn,
} from "../../ExpandableColumn/ExpandableColumn";
import { generateRandomId } from "@/app/utils/utils";

interface AccordionGroupPanelProps {
  propertyKeys: ComponentProperty[];
  propertyComponent: {
    id: string;
    properties: {
      autoOpenFirst?: boolean;
      showNumbering?: boolean;
      items?: { id: string; title: string; description: string }[];
      [key: string]: unknown;
    };
  };
  setProperty: (prop: string, value: unknown) => void;
}

const AccordionGroupPanel = ({
  propertyKeys,
  propertyComponent,
  setProperty,
}: AccordionGroupPanelProps) => {
  const { properties } = propertyComponent;
  const { togglePanel, isPanelOpen } = usePropertyPane();
  const items = properties.items ?? [];

  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);

  const handleAddItem = () => {
    const newItem = {
      id: generateRandomId(),
      title: `Item ${items.length + 1}`,
      description: "",
    };
    setProperty(ComponentProperty.AccordionItems, [...items, newItem]);
  };

  const handleItemChange = (
    index: number,
    field: "title" | "description",
    value: string,
  ) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item,
    );
    setProperty(ComponentProperty.AccordionItems, updated);
  };

  const renderProperty = (propertyKey: ComponentProperty) => {
    switch (propertyKey) {
      case ComponentProperty.AutoOpenFirst:
        return (
          <div
            key={propertyKey}
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="autoOpenFirst"
                type="checkbox"
                checked={!!properties?.autoOpenFirst}
                onChange={(e) =>
                  setProperty(ComponentProperty.AutoOpenFirst, e.target.checked)
                }
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Auto Open First Item
              </span>
            </label>
          </div>
        );

      case ComponentProperty.ShowNumbering:
        return (
          <div
            key={propertyKey}
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <label className={sharedPropertiesStyles.checkBoxCenter}>
              <input
                id="showNumbering"
                type="checkbox"
                checked={!!properties?.showNumbering}
                onChange={(e) =>
                  setProperty(ComponentProperty.ShowNumbering, e.target.checked)
                }
                className={sharedPropertiesStyles.conditionalCheckBox}
              />
              <span className={sharedPropertiesStyles.propertyLabel}>
                Show Numbering
              </span>
            </label>
          </div>
        );

      case ComponentProperty.AccordionItems:
        return (
          <div
            key={propertyKey}
            className={`${sharedPropertiesStyles.componentProperty} ${sharedPropertiesStyles.column}`}
          >
            <p className={sharedPropertiesStyles.propertyLabel}>Items</p>
            <div className={sharedStyle.draggableRows}>
              {items.map((item, index) => (
                <ExpandableColumn
                  key={item.id}
                  colData={items}
                  column={item}
                  draggedItemId={draggedItemId}
                  setDraggedItemId={setDraggedItemId}
                  setProperty={(_, value) =>
                    setProperty(ComponentProperty.AccordionItems, value)
                  }
                  property={ComponentProperty.AccordionItems}
                  id={index}
                  label={item.title || `Item ${index + 1}`}
                  isDraggable={true}
                  minColCount={1}
                >
                  <div className={sharedPropertiesStyles.componentProperty}>
                    <p className={sharedPropertiesStyles.propertyLabel}>
                      Title
                    </p>
                    <input
                      id={`accordionItemTitle-${index}`}
                      className={`${sharedPropertiesStyles.textInput} ${sharedStyles.mt5}`}
                      type="text"
                      value={item.title}
                      placeholder="Enter item title"
                      onChange={(e) =>
                        handleItemChange(index, "title", e.target.value)
                      }
                    />
                  </div>
                  <div className={sharedPropertiesStyles.componentProperty}>
                    <p className={sharedPropertiesStyles.propertyLabel}>
                      Description
                    </p>
                    <textarea
                      id={`accordionItemDescription-${index}`}
                      className={`${sharedPropertiesStyles.textArea} ${sharedStyles.mt5}`}
                      value={item.description}
                      placeholder="Enter item description"
                      onChange={(e) =>
                        handleItemChange(index, "description", e.target.value)
                      }
                    />
                  </div>
                </ExpandableColumn>
              ))}
            </div>
            <AddExpandableColumn handleAddCol={handleAddItem} label="Item" />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div id="accordionGroupPanel">
      <button
        id="toggleAccordionGroupPanel"
        onClick={() => togglePanel?.(PropertyPanels.AccordionGroupPanel)}
        className={`${sharedPropertiesStyles.panelHeading} ${
          isPanelOpen?.(PropertyPanels.AccordionGroupPanel)
            ? sharedPropertiesStyles.isOpen
            : ""
        }`}
      >
        <h3>Accordion Group</h3>
        <ChevronDownIcon />
      </button>

      {isPanelOpen?.(PropertyPanels.AccordionGroupPanel) && (
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

export default AccordionGroupPanel;
