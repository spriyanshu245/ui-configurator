import { useEffect, useState } from "react";
import { UserTask, BaseComponent } from "../types/types";

export interface ProcessedComponent {
  id: string;
  type: string;
  name: string;
  text: string;
  label: string;
}
const EXCLUDED_TYPES = ["tab"];

export const useTaskComponents = (
  userTask?: UserTask
): ProcessedComponent[] => {
  const [components, setComponents] = useState<ProcessedComponent[]>([]);

  useEffect(() => {
    if (!userTask?.components) {
      setComponents([]);
      return;
    }

    const processedComponents = processAllComponents(userTask.components);
    setComponents(processedComponents);
  }, [userTask]);

  return components;
};

const processAllComponents = (
  components: BaseComponent[]
): ProcessedComponent[] => {
  const result: ProcessedComponent[] = [];
  if (components && components.length > 0) {
    components.forEach((component) => {
      processComponent(component, result);
    });
  }

  return result;
};

const processComponent = (
  component: BaseComponent,
  result: ProcessedComponent[]
) => {
  if (!component || typeof component !== "object") return;

  if (EXCLUDED_TYPES.includes(component.type)) {
    return;
  }

  result.push({
    id: component.id,
    type: component.type,
    name: component.properties?.name || "",
    label: component.properties?.label || component.type,
    text: component.properties?.text || "",
  });

  if (component?.components && Array.isArray(component?.components)) {
    component?.components.forEach((nestedComponent) => {
      if (
        nestedComponent &&
        typeof nestedComponent === "object" &&
        "type" in nestedComponent
      ) {
        processComponent(nestedComponent, result);
      }
    });
  }

  const potentialComponentArrays = [
    "fields",
    "items",
    "elements",
    "children",
    "formElements",
  ];

  potentialComponentArrays.forEach((arrayName) => {
    if (
      component.properties?.[arrayName] &&
      Array.isArray(component.properties[arrayName])
    ) {
      component.properties[arrayName].forEach((item) => {
        if (item && typeof item === "object" && "type" in item) {
          processComponent(item as BaseComponent, result);
        }
      });
    }
  });

  Object.keys(component.properties || {}).forEach((key) => {
    if (potentialComponentArrays.includes(key)) return;

    const prop = component.properties?.[key];
    if (prop && typeof prop === "object") {
      if ("type" in prop && "category" in prop) {
        processComponent(prop as BaseComponent, result);
      } else if (
        Array.isArray(prop) &&
        prop.length > 0 &&
        typeof prop[0] === "object" &&
        "type" in prop[0]
      ) {
        prop.forEach((item) => {
          if ("type" in item) {
            processComponent(item as BaseComponent, result);
          }
        });
      }
    }
  });
};
