import { ComponentProperty } from "../data/componentProperties";
import {
  BaseComponent,
  BuilderComponent,
  DataTableColumn,
  FormsNameKeys,
  NameKeyId,
  UserTask,
} from "../types/types";
import { RESTRICTED_ELEMENTS } from "./constants";

export const getFormElementsList = (
  components: BaseComponent[],
  propertyComponentId: string | null
) => {
  let elementList: string[] = [];
  components?.forEach((component) => {
    if (
      "components" in component &&
      RESTRICTED_ELEMENTS.includes(component.type)
    ) {
      elementList = elementList.concat(
        getFormElementsList(
          component.components as BaseComponent[],
          propertyComponentId
        )
      );
    } else if (
      component?.properties?.name &&
      propertyComponentId !== component.id
    ) {
      elementList.push(component.properties.name);
    }
  });
  return elementList;
};

export const getAllFormsElements = (formsNamekeys: FormsNameKeys) => {
  let elements: NameKeyId[] = [];
  const entries = Object.entries(formsNamekeys);

  entries.forEach(([formname, nameKeys]) => {
    nameKeys?.forEach(({ label, id }) => {
      elements.push({
        label: `${formname}.${label}`,
        id: `${formname}.${label}`,
      });
    });
  });

  return elements;
};

export const getAllFormsNameKeys = (userTask: UserTask) => {
  let formsNameKeys: FormsNameKeys = {};
  let tablesNameKeys: FormsNameKeys = {};
  const components: BaseComponent[] = userTask.components ?? [];

  const searchComponents = (components: any[] = []) => {
    for (const comp of components) {
      if (comp.type === "form") {
        formsNameKeys[comp?.properties?.name ?? ""] =
          comp?.properties?.nameKeyIds ?? [];
      } else if (
        (comp.type === "table") ||
        comp.type === "input-table"
      ) {
        tablesNameKeys[comp?.properties?.name ?? ""] =
          comp?.properties?.nameKeyIds ?? [];
      }
      if (comp.components?.length > 0) {
        searchComponents(comp.components);
      }
    }
  };
  searchComponents(components);
  return { formsNameKeys, tablesNameKeys };
};

const deleteNamekeyAndConditions = (
  component: BuilderComponent,
  condition: ComponentProperty,
  nameKeyId: string
) => {
  if (component.properties?.[condition]) {
    if (component.properties?.[condition].parentNames?.includes(nameKeyId)) {
      let parentNames = component.properties?.[condition].parentNames;
      parentNames.splice(parentNames.indexOf(nameKeyId), 1);
      component.properties[condition].parentNames = parentNames;
      component.properties[condition].conditions = {};
    }
    if (component.components?.length) {
      traversFormComponentsNameKeyIdContions(component, nameKeyId);
    }
  }
};

export const processComponentConditions = (
  component: BuilderComponent,
  nameKeyId: string
): void => {
  [
    ComponentProperty.VisibilityConditions,
    ComponentProperty.EnableDisableConditions,
    ComponentProperty.RequiredFieldConditions,
    ComponentProperty.DynamicOptions,
  ].forEach((condition) => {
    deleteNamekeyAndConditions(component, condition, nameKeyId);
  });
};

const removeNameKeyFromDependentOn = (
  component: BuilderComponent,
  nameKeyId: string
) => {
  if (
    nameKeyId &&
    component?.properties?.optionsApiDependentOn?.includes(nameKeyId)
  ) {
    component.properties.optionsApiDependentOn.splice(
      component.properties.optionsApiDependentOn.indexOf(nameKeyId),
      1
    );
  }
};

export const traversFormComponentsNameKeyIdContions = (
  form: BuilderComponent,
  nameKeyId: string
): void => {
  if (form.type === "form" && form?.components?.length) {
    form.components = form.components.map((component) => {
      if (component?.properties?.name === nameKeyId) {
        component.properties.name = "";
      } else {
        processComponentConditions(component as BuilderComponent, nameKeyId);
        removeNameKeyFromDependentOn(component as BuilderComponent, nameKeyId);
      }
      return component;
    });
  } else if (form.properties.tableColumns || form.properties.inputColumns) {
    let columns = (form.properties.tableColumns ??
      form.properties.inputColumns ??
      []) as DataTableColumn[];
    columns = columns.map((column) => {
      if (column?.properties?.name === nameKeyId) {
        column.properties.name = "";
      } else {
        processComponentConditions(column as BuilderComponent, nameKeyId);
        removeNameKeyFromDependentOn(column as BuilderComponent, nameKeyId);
      }
      return column;
    });
    if (form.properties.tableColumns) {
      form.properties.tableColumns = columns;
    } else {
      form.properties.inputColumns = columns;
    }
  }
};
