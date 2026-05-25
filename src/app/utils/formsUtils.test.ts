import {
  getFormElementsList,
  getAllFormsElements,
  traversFormComponentsNameKeyIdContions,
  processComponentConditions,
  getAllFormsNameKeys,
} from "./formsUtils";
import {
  BaseComponent,
  BuilderComponent,
  DataTableColumn,
  UserTask,
} from "../types/types";
import { ComponentProperty } from "../data/componentProperties";

jest.mock("./constants", () => ({
  RESTRICTED_ELEMENTS: ["container", "section", "column", "field-group"],
}));

describe("getFormElementsList", () => {
  it("returns an empty array for an empty components array", () => {
    expect(getFormElementsList([], null)).toEqual([]);
  });

  it("skips restricted components but recurses into them", () => {
    const components: BaseComponent[] = [
      {
        id: "1",
        type: "field-group",
        category: "form",
        components: [
          {
            id: "child1",
            type: "input",
            category: "form",
            properties: { name: "childName" },
          },
        ],
        properties: { name: "groupName", nameKeyIds: [] },
      },
    ];
    expect(getFormElementsList(components, null)).toEqual(["childName"]);
  });

  it("returns names of components with a 'name' property", () => {
    const components: BaseComponent[] = [
      {
        id: "1",
        type: "input",
        category: "form",
        properties: { name: "field1", nameKeyIds: [] },
      },
      {
        id: "2",
        type: "button",
        category: "form",
        properties: { name: "btn1", nameKeyIds: [] },
      },
    ];
    expect(getFormElementsList(components, null)).toEqual(["field1", "btn1"]);
  });

  it("does not include a component if its id equals propertyComponentId", () => {
    const components: BaseComponent[] = [
      {
        id: "1",
        type: "input",
        category: "form",
        properties: { nameKeyIds: [], name: "field1" },
      },
      {
        id: "2",
        type: "button",
        category: "form",
        properties: { name: "btn1", nameKeyIds: [] },
      },
    ];
    expect(getFormElementsList(components, "1")).toEqual(["btn1"]);
  });
});

describe("getAllFormsElements", () => {
  it("flattens the formsNameKeys structure correctly", () => {
    const formsNameKeyIds = {
      formName: [{ id: "testField", label: "testField" }],
      otherForm: [{ id: "otherField", label: "Label Other" }],
    };

    expect(getAllFormsElements(formsNameKeyIds)).toEqual([
      {
        id: "formName.testField",
        label: "formName.testField",
      },
      {
        id: "otherForm.Label Other",
        label: "otherForm.Label Other",
      },
    ]);
  });

  it("handles empty input object", () => {
    expect(getAllFormsElements({})).toEqual([]);
  });
});

describe("getAllFormsNameKeys", () => {
  describe("Happy Path", () => {
    it("should return empty objects when userTask has no components", () => {
      const userTask: UserTask = {
        components: [],
      };

      const result = getAllFormsNameKeys(userTask);

      expect(result).toEqual({
        formsNameKeys: {},
        tablesNameKeys: {},
      });
    });

    it("should extract form nameKeyIds correctly", () => {
      const userTask: UserTask = {
        components: [
          {
            type: "form",
            id: "f1",
            category: "form",
            properties: {
              name: "myForm",
              nameKeyIds: [{ id: "k1", label: "l1" }],
            },
          },
        ],
      };

      const result = getAllFormsNameKeys(userTask);

      expect(result.formsNameKeys).toEqual({
        myForm: [{ id: "k1", label: "l1" }],
      });
      expect(result.tablesNameKeys).toEqual({});
    });

    it("should handle mixed forms and tables", () => {
      const mockComponents: BaseComponent[] = [
        {
          type: "form",
          properties: {
            name: "form1",
            nameKeyIds: [{ id: "f1-key-1", label: "Field 1" }],
          },
          id: "1",
          category: "component",
        },
        {
          type: "input-table",
          properties: {
            name: "grid1",
            nameKeyIds: [{ id: "g1", label: "c1" }],
          },
          id: "2",
          category: "form",
        },
        {
          type: "table",
          category: "form",
          properties: {
            name: "table1",
            nameKeyIds: [{ id: "t1", label: "c2" }],
          },
          id: "3",
        },
        {
          type: "table",
          category: "component",
          properties: {
            name: "ignoredTable",
            nameKeyIds: [],
          },
          id: "4",
        },
      ];

      const userTask: UserTask = {
        components: mockComponents,
      };

      const result = getAllFormsNameKeys(userTask);

      expect(result.formsNameKeys).toEqual({
        form1: [{ id: "f1-key-1", label: "Field 1" }],
      });
      expect(result.tablesNameKeys).toEqual({
        grid1: [{ id: "g1", label: "c1" }],
        table1: [{ id: "t1", label: "c2" }],
        ignoredTable: [],
      });
    });

    it("should recursively search nested components", () => {
      const mockComponents: BaseComponent[] = [
        {
          type: "container",
          id: "c1",
          category: "component",
          components: [
            {
              type: "form",
              properties: {
                name: "nestedForm",
                nameKeyIds: [{ id: "nested-key-1", label: "Nested Field" }],
              },
              components: [],
              id: "nf1",
              category: "component",
            },
          ],
        },
      ];
      const userTask: UserTask = {
        components: mockComponents,
      };
      const result = getAllFormsNameKeys(userTask);

      expect(result.formsNameKeys).toEqual({
        nestedForm: [{ id: "nested-key-1", label: "Nested Field" }],
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined userTask.components", () => {
      const userTask: UserTask = {
        components: undefined as any,
      };

      const result = getAllFormsNameKeys(userTask);

      expect(result).toEqual({
        formsNameKeys: {},
        tablesNameKeys: {},
      });
    });

    it("should handle components without properties gracefully", () => {
      const mockComponents: BaseComponent[] = [
        {
          type: "form",
          properties: undefined,
          id: "1",
          category: "",
        },
      ];
      const userTask: UserTask = {
        components: mockComponents,
      };

      const result = getAllFormsNameKeys(userTask);

      expect(result.formsNameKeys).toEqual({
        "": [],
      });
    });
  });
});

describe("processComponentConditions", () => {
  describe("Condition Cleanup Logic", () => {
    it("should remove nameKeyId from parentNames and clear conditions", () => {
      const component: BuilderComponent = {
        id: "comp-1",
        type: "input",
        category: "form",
        displayName: "",
        properties: {
          [ComponentProperty.VisibilityConditions]: {
            parentNames: ["nameKey-1", "nameKey-2"],
            conditions: { some: true },
          },
        },
      };

      processComponentConditions(component, "nameKey-1");

      expect(
        component.properties[ComponentProperty.VisibilityConditions]
          ?.parentNames,
      ).toEqual(["nameKey-2"]);
      expect(
        component.properties[ComponentProperty.VisibilityConditions]
          ?.conditions,
      ).toEqual({});
    });

    it("should handle recursion: cleanup children if component has components", () => {
      const childComp: BuilderComponent = {
        id: "child",
        type: "input",
        category: "form",
        displayName: "",
        properties: {
          name: "nameKey-1",
        },
      };

      const parentComp: BuilderComponent = {
        id: "parent",
        type: "form",
        category: "component",
        displayName: "",
        components: [childComp],
        properties: {
          [ComponentProperty.VisibilityConditions]: {
            parentNames: ["nameKey-1"],
            conditions: { a: true },
          },
        },
      };

      processComponentConditions(parentComp, "nameKey-1");

      expect(
        parentComp.properties[ComponentProperty.VisibilityConditions]
          ?.parentNames,
      ).toEqual([]);

      expect(childComp.properties.name).toBe("");
    });

    it("should ignore if nameKeyId is not present in parentNames", () => {
      const component: BuilderComponent = {
        id: "comp-1",
        type: "input",
        category: "form",
        displayName: "",
        properties: {
          [ComponentProperty.VisibilityConditions]: {
            parentNames: ["otherKey"],
            conditions: { keep: true },
          },
        },
      };

      processComponentConditions(component, "nameKey-1");

      expect(
        component.properties[ComponentProperty.VisibilityConditions]
          ?.conditions,
      ).toEqual({ keep: true });
    });
  });
});

describe("traversFormComponentsNameKeyIdContions", () => {
  describe("Form Component Traversal", () => {
    it("should clear name property when component name matches nameKeyId", () => {
      const form: BuilderComponent = {
        id: "form-1",
        type: "form",
        category: "form",
        displayName: "",
        properties: {},
        components: [
          {
            id: "input-1",
            type: "input",
            category: "form",
            properties: {
              name: "targetName",
            },
          },
        ],
      };

      traversFormComponentsNameKeyIdContions(form, "targetName");

      expect(form.components?.[0].properties?.name).toBe("");
    });

    it("should remove nameKeyId from optionsApiDependentOn", () => {
      const form: BuilderComponent = {
        id: "form-1",
        type: "form",
        category: "form",
        displayName: "",
        properties: {},
        components: [
          {
            id: "select-1",
            type: "select",
            category: "form",
            properties: {
              name: "selectField",
              optionsApiDependentOn: ["targetName", "otherKey"],
            },
          },
        ],
      };

      traversFormComponentsNameKeyIdContions(form, "targetName");

      expect(form.components?.[0].properties?.optionsApiDependentOn).toEqual([
        "otherKey",
      ]);
    });
  });

  describe("Table Columns Traversal", () => {
    it("should process tableColumns and clear name when matched", () => {
      const table: BuilderComponent = {
        id: "table-1",
        type: "table",
        category: "form",
        displayName: "",
        properties: {
          tableColumns: [
            {
              id: "col-1",
              type: "column",
              properties: {
                name: "targetCol",
              },
            },
          ],
        },
      };

      traversFormComponentsNameKeyIdContions(table, "targetCol");

      expect(table.properties.tableColumns[0].properties.name).toBe("");
    });

    it("should process inputColumns (for Input Table)", () => {
      const inputTable: BuilderComponent = {
        id: "input-table-1",
        type: "input-table",
        category: "form",
        displayName: "",
        properties: {
          inputColumns: [
            {
              id: "col-1",
              type: "column",
              properties: {
                name: "targetCol",
              },
            },
          ] as DataTableColumn[],
        },
      };

      traversFormComponentsNameKeyIdContions(inputTable, "targetCol");

      expect(inputTable.properties.inputColumns[0].properties.name).toBe("");
    });

    it("should handle recursive conditions inside columns", () => {
      const table: BuilderComponent = {
        id: "t1",
        type: "table",
        category: "form",
        displayName: "",
        properties: {
          tableColumns: [
            {
              id: "c1",
              type: "column",
              properties: {
                name: "otherCol",

                [ComponentProperty.VisibilityConditions]: {
                  parentNames: ["targetCol"],
                  conditions: { x: true },
                },
              },
            },
          ],
        },
      };

      traversFormComponentsNameKeyIdContions(table, "targetCol");

      expect(
        table.properties.tableColumns[0].properties[
          ComponentProperty.VisibilityConditions
        ].parentNames,
      ).toEqual([]);
    });
  });

  describe("Edge Cases", () => {
    it("should handle form without components array", () => {
      const form: BuilderComponent = {
        id: "f1",
        type: "form",
        category: "form",
        displayName: "",
        properties: {},
      };
      expect(() =>
        traversFormComponentsNameKeyIdContions(form, "k1"),
      ).not.toThrow();
    });

    it("should handle table without columns array", () => {
      const table: BuilderComponent = {
        id: "t1",
        type: "table",
        category: "form",
        displayName: "",
        properties: {},
      };
      expect(() =>
        traversFormComponentsNameKeyIdContions(table, "k1"),
      ).not.toThrow();
    });

    it("should fallback safely if neither form components nor table columns exist", () => {
      const generic: BuilderComponent = {
        id: "g1",
        type: "container",
        category: "component",
        displayName: "",
        properties: {},
      };
      expect(() =>
        traversFormComponentsNameKeyIdContions(generic, "k1"),
      ).not.toThrow();
    });
  });
});
