import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./AccessControlTreeNode.module.scss";
import {
  Microsite,
  BaseComponent,
} from "@/app/types/types";
import { findComponentById } from "@/app/utils/accessControlUtils";
import SelectDropdown from "@/app/components/InternalComponents/SelectDropdown/SelectDropdown";
import { COLUMN_ACTIONS } from "@/app/utils/constants";
import { AccessConfigComponent, AccessConfigPage } from "@/app/types/accessControlConfig";

interface TreeNodeProps {
  node:  AccessConfigPage| AccessConfigComponent;
  nodeType: "page" | "component";
  label: string;
  level?: number;
  onUpdate: (updatedNode:  AccessConfigPage| AccessConfigComponent) => void;
  pageCode?: string;
  pageComponents?: BaseComponent[];
  dslData?: Microsite | null;
  expandAllTrigger?: { value: boolean; version: number };
  parentVisible?: boolean;
  isColumn?: boolean;
  highlightedComponentId?: string | null;
  newComponentIds?: Set<string>;
}

const AccessControlTreeNode = ({
  node,
  nodeType,
  label,
  level = 0,
  onUpdate,
  pageCode,
  pageComponents,
  dslData,
  expandAllTrigger,
  parentVisible = true,
  isColumn = false,
  highlightedComponentId,
  newComponentIds,
}: TreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const lastTriggerVersion = useRef<number | undefined>(undefined);
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isHighlighted, setIsHighlighted] = useState(false);

  const isEffectivelyVisible = parentVisible && node.isVisible;
  const isCheckboxDisabled = !parentVisible;
  const isReadOnly = "isReadOnly" in node && node.isReadOnly === true;

  const componentId =
    nodeType === "component"
      ? (node as   AccessConfigComponent).componentId
      : null;
  const isNew = componentId
    ? newComponentIds?.has(componentId) ?? false
    : false;

  const handleHighlightEnd = useCallback(() => {
    setIsHighlighted(false);
  }, []);

  useEffect(() => {
    if (
      highlightedComponentId &&
      componentId &&
      highlightedComponentId === componentId
    ) {
      setIsHighlighted(true);
      const timer = setTimeout(() => {
        nodeRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [highlightedComponentId, componentId]);

  useEffect(() => {
    if (
      expandAllTrigger !== undefined &&
      lastTriggerVersion.current !== undefined &&
      expandAllTrigger.version !== lastTriggerVersion.current
    ) {
      setIsExpanded(expandAllTrigger.value);
    }
    lastTriggerVersion.current = expandAllTrigger?.version;
  }, [expandAllTrigger]);

  const hasChildren =
    ("components" in node && node.components && node.components.length > 0) ||
    ("columns" in node && node.columns && node.columns.length > 0);

  const handleToggleExpand = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const updateChildrenRecursively = (
    children: AccessConfigComponent[],
    field: "isVisible" | "isEditable" | "isDisabled",
    value: boolean
  ): AccessConfigComponent[] => {
    return children.map((child) => {
      const updatedChild = { ...child, [field]: value };

      if ("components" in child && child.components) {
        updatedChild.components = updateChildrenRecursively(
          child.components,
          field,
          value
        );
      }

      return updatedChild;
    });
  };

  const handleCheckboxChange = (
    field: "isVisible" | "isEditable" | "isDisabled"
  ) => {
    const newValue = !node[field];
    const updatedNode = { ...node, [field]: newValue };

    if (field === "isVisible" && !newValue) {
      updatedNode.isEditable = false;
      updatedNode.isDisabled = false;
    }

    if (field === "isDisabled" && newValue) {
      updatedNode.isEditable = false;
    }

    if ("components" in updatedNode && updatedNode.components) {
      updatedNode.components = updateChildrenRecursively(
        updatedNode.components,
        field,
        newValue
      );
    }

    if ("columns" in updatedNode && updatedNode.columns) {
      updatedNode.columns = updatedNode.columns.map((col) => ({
        ...col,
        [field]: newValue,
      }));
    }

    onUpdate(updatedNode);
  };

  const handleChildUpdate = (
    index: number,
    updatedChild: AccessConfigComponent
  ) => {
    if ("components" in node && node.components) {
      const updatedComponents = [...node.components];
      updatedComponents[index] = updatedChild;
      onUpdate({ ...node, components: updatedComponents });
    }
  };

  const handleColumnUpdate = (
    index: number,
    updatedColumn: {
      columnId: string;
      isVisible: boolean;
      isDisabled: boolean;
    }
  ) => {
    if ("columns" in node && node.columns) {
      const updatedColumns = [...node.columns];
      updatedColumns[index] = updatedColumn;
      onUpdate({ ...node, columns: updatedColumns });
    }
  };

  const isUUID = (str: string): boolean => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const findNameKeyLabel = (
    components: BaseComponent[],
    nameKeyId: string
  ): string | null => {
    for (const comp of components) {
      if (comp.type === "form" && comp.properties?.nameKeyIds) {
        const nameKey = comp.properties.nameKeyIds.find(
          (nk: { id: string; label: string }) => nk.id === nameKeyId
        );
        if (nameKey) {
          return nameKey.label;
        }
      }
      if (comp.components) {
        const found = findNameKeyLabel(comp.components, nameKeyId);
        if (found) return found;
      }
    }
    return null;
  };

  const getChildLabel = (
    childType: "component" | "column",
    childId: string
  ): string => {
    if (!pageComponents) return childId;

    if (childType === "column") {
      const findColumn = (components: BaseComponent[]): string | null => {
        for (const comp of components) {
          if (comp.type === "table" && comp.properties?.tableColumns) {
            const column = comp.properties.tableColumns.find(
              (col: { id: string; properties?: { label?: string } }) =>
                col.id === childId
            );
            if (column) {
              return column.properties?.label ?? column.id;
            }
          }
          if (comp.type === "input-table" && comp.properties?.inputColumns) {
            const column = comp.properties.inputColumns.find(
              (col: { id: string; properties?: { label?: string } }) =>
                col.id === childId
            );
            if (column) {
              return column.properties?.label ?? column.id;
            }
          }
          if (comp.components) {
            const found = findColumn(comp.components);
            if (found) return found;
          }
        }
        return null;
      };
      const result = findColumn(pageComponents);
      if (result) return result;
      return childId;
    }

    if (childType === "component") {
      const component = findComponentById(pageComponents, childId);
      if (component) {
        const title = component.properties?.title;
        const name = component.properties?.name;
        const label = component.properties?.label;
        const type = component.type;

        if (title) {
          return title;
        }
        if (name) {
          if (isUUID(name)) {
            const nameKeyLabel = findNameKeyLabel(pageComponents, name);
            if (nameKeyLabel) {
              return nameKeyLabel;
            }
          }
          return name;
        }
        if (label) {
          return label;
        }
        if (type) {
          return type;
        }
        return childId;
      }
    }

    return childId;
  };

  const getComponentType = (): string | null => {
    if (nodeType !== "component" || !pageComponents) return null;

    const component = node as AccessConfigComponent;
    const idToFind = component.componentId;

    const findInComponents = (components: any[]): string | null => {
      for (const comp of components) {
        if (comp.type === "table" && comp.properties?.tableColumns) {
          const column = comp.properties.tableColumns.find(
            (col: any) => col.id === idToFind
          );
          if (
            column &&
            COLUMN_ACTIONS.includes(column.properties?.columnInputType)
          ) {
            return "cta";
          }
        }

        if (comp.type === "input-table" && comp.properties?.inputColumns) {
          const column = comp.properties.inputColumns.find(
            (col: any) => col.id === idToFind
          );
          if (
            column &&
            column.properties?.columnDataType === "input" &&
            column.properties?.columnInputType === "routing-action"
          ) {
            return "cta";
          }
        }

        if (comp.components) {
          const found = findInComponents(comp.components);
          if (found) return found;
        }
      }
      return null;
    };

    const columnType = findInComponents(pageComponents);
    if (columnType) return columnType;

    const dslComponent = findComponentById(pageComponents, idToFind);
    if (dslComponent) {
      return dslComponent.type;
    }

    return null;
  };

  const getTabChildren = (): Array<{ id: string; title: string }> => {
    if (nodeType !== "component") return [];
    const component = node as AccessConfigComponent;
    if (!component.components || !pageComponents) return [];

    const tabChildren: Array<{ id: string; title: string }> = [];

    component.components.forEach((child) => {
      const idToFind = child.componentId;
      const dslComponent = findComponentById(pageComponents, idToFind);
      if (dslComponent?.type === "tab") {
        const title =
          dslComponent.properties?.title ||
          dslComponent.properties?.label ||
          dslComponent.name ||
          idToFind;
        tabChildren.push({ id: child.componentId, title });
      }
    });

    return tabChildren;
  };

  const handleDefaultTabChange = (selectedTabId: string) => {
    const component = node as AccessConfigComponent;

    const updatedComponents = component.components?.map((child) => ({
      ...child,
      isDefault: child.componentId === selectedTabId,
    }));

    const updatedComponent = { ...component, components: updatedComponents };
    onUpdate(updatedComponent);
  };

  const componentType = getComponentType();
  const isTabsComponent = componentType === "tabs";
  const tabOptions = isTabsComponent ? getTabChildren() : [];

  return (
    <div
      className={`${styles.treeNode} ${level === 0 ? styles.root : ""}`}
      ref={nodeRef}
    >
      <div
        className={`${styles.nodeHeader} ${
          isHighlighted ? styles.highlighted : ""
        }`}
        onClick={handleToggleExpand}
        onAnimationEnd={handleHighlightEnd}
      >
        <div
          className={`${styles.expandIcon} ${
            isExpanded ? styles.expanded : ""
          } ${hasChildren ? "" : styles.placeholder}`}
        >
          {hasChildren && "▶"}
        </div>

        <div className={styles.namePillGroup}>
          <div
            className={`${styles.nodeLabel} ${styles[nodeType]}`}
            title={label}
          >
            {label}
          </div>
          {componentType && (
            <div
              className={`${styles.componentTypePill} ${
                styles[componentType.replaceAll("-", "_")]
              }`}
            >
              {componentType === "button-v2" ? "cta" : componentType}
            </div>
          )}
        </div>

        {isTabsComponent && tabOptions.length > 0 && (
          <div
            className={styles.defaultTabDropdown}
            onClick={(e) => e.stopPropagation()}
          >
            <label
              htmlFor={`default-tab-${
                (node as AccessConfigComponent).componentId
              }`}
            >
              Default Tab:
            </label>
            <SelectDropdown
              id={`default-tab-${(node as AccessConfigComponent).componentId}`}
              options={[
                { value: "", label: "Select Default Tab" },
                ...tabOptions.map((tab) => ({
                  value: tab.id,
                  label: tab.title,
                })),
              ]}
              value={
                (node as AccessConfigComponent).components?.find(
                  (c) => c.isDefault
                )?.componentId ?? ""
              }
              onChange={handleDefaultTabChange}
              placeholder="Select Default Tab"
            />
          </div>
        )}

        {isNew && <div className={styles.newBadge}>NEW</div>}
        <div className={styles.nodeType}>{nodeType}</div>

        <div
          className={styles.controlsGroup}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.controlItem}>
            <input
              type="checkbox"
              id={`visible-${node[`${nodeType}Id` as keyof typeof node]}`}
              checked={node.isVisible}
              onChange={() => handleCheckboxChange("isVisible")}
              disabled={isCheckboxDisabled || isReadOnly}
            />
            <label
              htmlFor={`visible-${node[`${nodeType}Id` as keyof typeof node]}`}
            >
              Visible
            </label>
          </div>

          <div className={styles.controlItem}>
            <input
              type="checkbox"
              id={`editable-${node[`${nodeType}Id` as keyof typeof node]}`}
              checked={node.isEditable}
              onChange={() => handleCheckboxChange("isEditable")}
              disabled={
                !isEffectivelyVisible ||
                isCheckboxDisabled ||
                node.isDisabled ||
                isColumn ||
                isReadOnly
              }
            />
            <label
              htmlFor={`editable-${node[`${nodeType}Id` as keyof typeof node]}`}
            >
              Editable
            </label>
          </div>

          <div className={styles.controlItem}>
            <input
              type="checkbox"
              id={`disabled-${node[`${nodeType}Id` as keyof typeof node]}`}
              checked={node.isDisabled}
              onChange={() => handleCheckboxChange("isDisabled")}
              disabled={
                !isEffectivelyVisible || isCheckboxDisabled || isReadOnly
              }
            />
            <label
              htmlFor={`disabled-${node[`${nodeType}Id` as keyof typeof node]}`}
            >
              Disabled
            </label>
          </div>
        </div>
      </div>

      {hasChildren && (
        <div
          className={`${styles.children} ${isExpanded ? "" : styles.hidden}`}
        >
          {"components" in node &&
            node.components?.map((component, index) => (
              <AccessControlTreeNode
                key={`component-${component.componentId}-${index}`}
                node={component}
                nodeType="component"
                label={getChildLabel("component", component.componentId)}
                level={level + 1}
                onUpdate={(updated) =>
                  handleChildUpdate(index, updated as AccessConfigComponent)
                }
                pageCode={pageCode}
                pageComponents={pageComponents}
                dslData={dslData}
                expandAllTrigger={expandAllTrigger}
                parentVisible={isEffectivelyVisible}
                highlightedComponentId={highlightedComponentId}
                newComponentIds={newComponentIds}
              />
            ))}

          {"columns" in node &&
            node.columns?.map((column, index) => (
              <AccessControlTreeNode
                key={`column-${column.columnId}-${index}`}
                node={
                  {
                    ...column,
                    componentId: column.columnId,
                    isEditable: false,
                  } as AccessConfigComponent
                }
                nodeType="component"
                label={getChildLabel("column", column.columnId)}
                level={level + 1}
                onUpdate={(updated) => {
                  const updatedColumn = {
                    columnId:
                      (updated as AccessConfigComponent).componentId ||
                      column.columnId,
                    isVisible: updated.isVisible,
                    isDisabled: updated.isDisabled,
                  };
                  handleColumnUpdate(index, updatedColumn);
                }}
                pageCode={pageCode}
                pageComponents={pageComponents}
                dslData={dslData}
                expandAllTrigger={expandAllTrigger}
                parentVisible={isEffectivelyVisible}
                isColumn={true}
                highlightedComponentId={highlightedComponentId}
                newComponentIds={newComponentIds}
              />
            ))}
        </div>
      )}
    </div>
  );
};

export default AccessControlTreeNode;
