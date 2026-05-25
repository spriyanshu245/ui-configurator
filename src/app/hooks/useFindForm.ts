import { useMemo } from "react";
import { useUserTask } from "@/app/context/UserTaskContext";
import { MAX_FORMS_LIMIT } from "../utils/constants";

export const useFindForm = () => {
  const { userTask } = useUserTask();

  return useMemo(() => {
    const findAllFormNames = () => {
      const components = userTask?.components || [];
      const formNames: string[] = [];

      const findFormsInHierarchy = (components: any[] = []) => {
        for (const comp of components) {
          if (comp.type === "form") {
            if (comp.properties?.name) {
              formNames.push(comp.properties.name);
            }
          }
          if (comp.components?.length) {
            findFormsInHierarchy(comp.components);
          }
        }
      };
      findFormsInHierarchy(components);
      return formNames;
    };

    const formNames = findAllFormNames();
    return {
      isFormFound: formNames.length > MAX_FORMS_LIMIT,
      formNames,
    };
  }, [userTask?.components]);
};
