import { useUserTask } from "@/app/context/UserTaskContext";
import { UserTask } from "../types/types";

export const useMicrositePageProperties = () => {
  const { updateUserTask, userTask } = useUserTask();

  const setProperty = (key: string, value: any, isProperty: boolean = true) => {
    let updated: UserTask;
    if (userTask) {
      if (isProperty) {
        updated = {
          ...userTask,
          properties: { ...userTask.properties, [key]: value },
        };
      } else {
        updated = { ...userTask, [key]: value };
      }
      updateUserTask(updated);
    }
  };

  const setProperties = (
    newProperties: Record<string, any>,
    isProperty: boolean = true
  ) => {
    if (!userTask) return;
    let updated;
    if (isProperty) {
      updated = {
        ...userTask,
        properties: { ...userTask.properties, ...newProperties },
      };
    } else {
      updated = { ...userTask, ...newProperties };
    }
    updateUserTask(updated);
  };

  return { page: userTask, setProperty, setProperties };
};
