import { useMemo } from "react";
import { useUserTask } from "@/app/context/UserTaskContext";
import {
  BaseComponent,
  ComponentGroup,
  FormComponent,
  SubSectionComponent,
} from "../types/types";

export type ParentComponent = FormComponent | SubSectionComponent;

export const useParentFormProperties = (component: BaseComponent) => {
  const { userTask } = useUserTask();

  return useMemo(() => {
    if (!component || isForm(component)) {
      return { parentForm: null, formId: null };
    }

    function isForm(comp: BaseComponent): comp is FormComponent {
      return comp.type === "form";
    }

    const hasChildComponent = (
      parent: ParentComponent,
      childId: string
    ): boolean => {
      if (parent.id === childId) return true;
      return (parent.components || []).some(
        (child) =>
          child.id === childId ||
          hasChildComponent(child as ParentComponent, childId)
      );
    };

    const findFormInHierarchy = (
      components: ComponentGroup[] = []
    ): FormComponent | null => {
      for (const comp of components) {
        if (
          isForm(comp) &&
          hasChildComponent(comp as ParentComponent, component.id)
        ) {
          return comp;
        }
        if (comp.components?.length) {
          const nestedForm = findFormInHierarchy(comp.components);
          if (nestedForm) return nestedForm;
        }
      }
      return null;
    };

    const parentForm = findFormInHierarchy(userTask?.components);

    return {
      parentForm,
      formId: parentForm?.id ?? null,
    };
  }, [component, userTask?.components]);
};
