import React, { SetStateAction } from "react";
import { UIComponent, BaseComponent, UserTask } from "../types/types";

import {
  addComponentToComponentAtIndex,
  addComponentToPage,
  removeComponentFromComponent,
  updateComponent,
} from "../utils/userTask/componentUtils";

export const useUserTaskComponentActions = <T extends UserTask>(
  setUserTask: React.Dispatch<SetStateAction<T>>
) => {
  const addComponent = (component: UIComponent, componentId: string) => {
    setUserTask((prevUserTask) => {
      const updatedComponents = addComponentToPage(
        prevUserTask.components,
        component,
        componentId
      );
      return { ...prevUserTask, components: updatedComponents };
    });
  };

  const addComponentAtIndex = (
    component: UIComponent,
    componentId: string,
    index: number
  ) => {
    setUserTask((prevUserTask) => {
      const updatedComponents = addComponentToComponentAtIndex(
        prevUserTask.components,
        component,
        componentId,
        index
      );
      return { ...prevUserTask, components: updatedComponents };
    });
  };

  const removeComponent = (componentId: string) => {
    setUserTask((prevUserTask) => {
      const updatedComponents = removeComponentFromComponent(
        prevUserTask.components,
        componentId
      );
      return { ...prevUserTask, components: updatedComponents };
    });
  };

  const moveComponentToIndex = (
    componentId: string,
    targetComponentId: string,
    targetIndex: number
  ) => {
    setUserTask((prevUserTask) => {
      let componentToMove: BaseComponent | null = null;
      const updatedComponents = removeComponentFromComponent(
        prevUserTask.components,
        componentId,
        (component) => {
          componentToMove = component;
        }
      );

      if (componentToMove) {
        const componentssWithComponentAdded = addComponentToComponentAtIndex(
          updatedComponents,
          componentToMove,
          targetComponentId,
          targetIndex
        );
        return { ...prevUserTask, components: componentssWithComponentAdded };
      }

      return prevUserTask;
    });
  };

  const addComponentToComponent = (
    parentComponentId: string,
    newComponent: UIComponent,
    index: number
  ) => {
    setUserTask((prevUserTask) => {
      const components = updateComponent(
        prevUserTask.components,
        parentComponentId,
        (parentComponent) => {
          if ("components" in parentComponent) {
            const updatedComponents: BaseComponent[] | UIComponent[] =
              parentComponent.components ? [...parentComponent.components] : [];
            updatedComponents.splice(
              index,
              parentComponent.type == "input-grid-row" ? 1 : 0,
              newComponent
            );
            parentComponent.components = updatedComponents;
          }
        }
      );
      return { ...prevUserTask, components: components };
    });
  };

  const updateComponentProperties = (
    componentId: string,
    keyOrProperties: string | { [key: string]: any },
    value?: any,
    isOuterUpdate?: boolean
  ) => {
    setUserTask((prevUserTask) => {
      const updatedComponents = updateComponent(
        prevUserTask.components,
        componentId,
        (component) => {
          if (typeof keyOrProperties === "string" && isOuterUpdate) {
            (component as any)[keyOrProperties] = value;
          } else if (typeof keyOrProperties === "string") {
            component.properties = {
              ...component.properties,
              [keyOrProperties]: value,
            };
          } else if (isOuterUpdate) {
            Object.assign(component, keyOrProperties);
          } else {
            component.properties = {
              ...component.properties,
              ...keyOrProperties,
            };
          }
        }
      );
      return { ...prevUserTask, components: updatedComponents };
    });
  };

  const moveComponent = (
    componentId: string,
    targetParentId: string,
    targetIndex: number
  ) => {
    setUserTask((prevUserTask) => {
      let movingComponent: UIComponent | null = null;

      const updatedComponents = removeComponentFromComponent(
        prevUserTask.components,
        componentId,
        (component) => {
          movingComponent = component;
        }
      );

      if (movingComponent) {
        const componentsWithComponentAdded = updateComponent(
          updatedComponents,
          targetParentId,
          (parentComponent) => {
            if ("components" in parentComponent && parentComponent.components) {
              const updatedComps = [...parentComponent.components];
              if (movingComponent) {
                updatedComps.splice(
                  targetIndex,
                  parentComponent.type == "input-grid-row" ? 1 : 0,
                  movingComponent
                );
              }
              parentComponent.components = updatedComps;
            }
          }
        );

        return { ...prevUserTask, components: componentsWithComponentAdded };
      }

      return prevUserTask;
    });
  };

  const importComponent = ({
    importData,
    componentId,
  }: {
    importData: UIComponent;
    componentId: string;
  }) => {
    setUserTask((prevUserTask) => {
      const updatedComponents = updateComponent(
        prevUserTask.components,
        componentId,
        (component) => {
          component.properties = {
            ...importData.properties,
          };
          component.components = [
            ...((importData.components as BaseComponent[]) ?? []),
          ];
        }
      );
      return { ...prevUserTask, components: updatedComponents };
    });
  };

  return {
    addComponent,
    addComponentAtIndex,
    removeComponent,
    moveComponentToIndex,
    addComponentToComponent,
    updateComponentProperties,
    moveComponent,
    importComponent,
  };
};
