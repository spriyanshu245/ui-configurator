import { BaseComponent } from "@/app/types/types";
import { emptyGridRowElement } from "../utils";

export const addComponentToPage = (
  components: BaseComponent[] | undefined,
  newComponent: BaseComponent,
  componentId: string
): BaseComponent[] => {
  if (!componentId || componentId === "") {
    return [...(components || []), newComponent];
  }

  return (components || []).map((component) => {
    if (component.id === componentId) {
      return {
        ...component,
        components: [...(component.components || []), newComponent],
      };
    }
    return component;
  });
};

export const addComponentToComponentAtIndex = (
  components: BaseComponent[] | undefined,
  newComponent: BaseComponent,
  componentId: string,
  index: number
): BaseComponent[] => {
  if (!componentId || componentId === "") {
    const updatedComponents = [...(components || [])];
    updatedComponents.splice(index, 0, newComponent);
    return updatedComponents;
  }

  return (components || []).map((component) => {
    if (component.id === componentId) {
      const updatedComponents = component.components
        ? [...component.components]
        : [];
      updatedComponents.splice(index, 0, newComponent);
      return {
        ...component,
        components: updatedComponents,
      };
    }
    return component;
  });
};

export const removeComponent = (
  component: BaseComponent,
  componentId: string,
  onComponentFound?: (component: BaseComponent) => void
): BaseComponent | null => {
  if (component.id === componentId) {
    if (onComponentFound) {
      onComponentFound(component);
    }
    return null;
  }

  if ("components" in component && component.components) {
    const updatedComponents = component.components
      .map((childComponent) =>
        component.type == "input-grid-row" &&
        removeComponent(childComponent, componentId, onComponentFound) == null
          ? emptyGridRowElement()
          : removeComponent(childComponent, componentId, onComponentFound)
      )
      .filter(Boolean) as BaseComponent[];

    return { ...component, components: updatedComponents };
  }

  return component;
};

export const removeComponentFromComponent = (
  components: BaseComponent[] | undefined,
  componentId: string,
  onComponentFound?: (component: BaseComponent) => void
) => {
  return (components || [])
    .map((component) => {
      const comp = removeComponent(component, componentId, onComponentFound);
      if (comp) return comp;
    })
    .filter(Boolean) as BaseComponent[];
};

export const updateComponentInComponent = (
  component: BaseComponent,
  targetComponentId: string,
  updater: (component: BaseComponent) => void
): BaseComponent => {
  if (component.id === targetComponentId) {
    const updatedComponent = { ...component };
    updater(updatedComponent);
    return updatedComponent;
  }

  if ("components" in component) {
    const updatedComponents = component.components?.map(
      (childComponent: BaseComponent) =>
        updateComponentInComponent(childComponent, targetComponentId, updater)
    );
    component = { ...component, components: updatedComponents };
  }

  if (component.type === "input-table" && component.properties?.inputColumns) {
    const updatedInputColumns = component.properties.inputColumns.map(
      (column: any) => {
        if (column.id === targetComponentId) {
          const updatedColumn = { ...column };
          updater(updatedColumn);
          return updatedColumn;
        }
        return column;
      }
    );

    component = {
      ...component,
      properties: {
        ...component.properties,
        inputColumns: updatedInputColumns,
      },
    };
  }

  return component;
};

export const updateComponent = (
  components: BaseComponent[] | undefined,
  targetComponentId: string,
  updater: (component: BaseComponent) => void
) => {
  return (components || []).map((component) =>
    updateComponentInComponent(component, targetComponentId, updater)
  );
};
