import { useUserTask } from "@/app/context/UserTaskContext";

export const useComponentProperties = (componentId: string) => {
  const { updateComponentProperties, getComponentById } = useUserTask();

  const component = getComponentById(componentId);

  const setProperty = (key: string, value: any, isOuterUpdate?: boolean) => {
    updateComponentProperties(componentId, key, value, isOuterUpdate);
  };

  const setProperties = (
    properties: { [key: string]: any },
    isOuterUpdate?: boolean
  ) => {
    updateComponentProperties(
      componentId,
      properties,
      undefined,
      isOuterUpdate
    );
  };

  return { component, setProperty, setProperties };
};
