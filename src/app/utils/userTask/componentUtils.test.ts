import {
  addComponentToPage,
  addComponentToComponentAtIndex,
  removeComponent,
  removeComponentFromComponent,
  updateComponentInComponent,
  updateComponent,
} from "./componentUtils";
import { BaseComponent } from "@/app/types/types";

jest.mock("../utils", () => ({
  emptyGridRowElement: jest.fn(() => ({
    id: "empty-row",
    type: "empty-row",
    category: "component",
  })),
}));

const dummyComponentA: BaseComponent = {
  id: "compA",
  type: "input",
  category: "component",
  properties: { name: "fieldA" },
};

const dummyComponentB: BaseComponent = {
  id: "compB",
  type: "input",
  category: "component",
  properties: { name: "fieldB" },
};

const dummyComponentC: BaseComponent = {
  id: "compC",
  type: "button",
  category: "component",
  properties: { name: "btnC" },
};

const dummyContainer: BaseComponent = {
  id: "container1",
  type: "container",
  category: "component",
  components: [dummyComponentA],
};

describe("componentUtils", () => {
  describe("addComponentToPage", () => {
    it("should append a new component to the root list if componentId is empty", () => {
      const components: BaseComponent[] = [dummyComponentA];
      const result = addComponentToPage(components, dummyComponentB, "");
      expect(result).toHaveLength(2);
      expect(result[1]).toEqual(dummyComponentB);
    });

    it("should append a new component to the root list if componentId is null/undefined", () => {
      const components: BaseComponent[] = [dummyComponentA];
      const result = addComponentToPage(
        components,
        dummyComponentB,
        null as any
      );
      expect(result).toHaveLength(2);
    });

    it("should handle undefined components input gracefully", () => {
      const result = addComponentToPage(undefined, dummyComponentA, "");
      expect(result).toEqual([dummyComponentA]);
    });

    it("should add a component to a target container's children", () => {
      const components: BaseComponent[] = [dummyContainer];
      const result = addComponentToPage(
        components,
        dummyComponentB,
        "container1"
      );

      expect(result[0].components).toHaveLength(2);
      expect(result[0].components?.[1]).toEqual(dummyComponentB);
    });

    it("should return unmodified components if target componentId is not found", () => {
      const components: BaseComponent[] = [dummyContainer];
      const result = addComponentToPage(
        components,
        dummyComponentB,
        "nonExistentId"
      );

      expect(result).toEqual(components);
    });
  });

  describe("addComponentToComponentAtIndex", () => {
    it("should insert at specific index in root list if componentId is empty", () => {
      const components = [dummyComponentA, dummyComponentB];

      const result = addComponentToComponentAtIndex(
        components,
        dummyComponentC,
        "",
        1
      );

      expect(result).toHaveLength(3);
      expect(result[1]).toEqual(dummyComponentC);
      expect(result[2]).toEqual(dummyComponentB);
    });

    it("should insert at specific index inside a target container", () => {
      const container: BaseComponent = {
        ...dummyContainer,
        components: [dummyComponentA, dummyComponentB],
      };
      const components = [container];

      const result = addComponentToComponentAtIndex(
        components,
        dummyComponentC,
        "container1",
        1
      );

      expect(result[0].components).toHaveLength(3);
      expect(result[0].components?.[1]).toEqual(dummyComponentC);
    });

    it("should handle undefined components property in target container", () => {
      const emptyContainer: BaseComponent = {
        id: "c1",
        type: "box",
        category: "component",
      };
      const components = [emptyContainer];

      const result = addComponentToComponentAtIndex(
        components,
        dummyComponentA,
        "c1",
        0
      );

      expect(result[0].components).toEqual([dummyComponentA]);
    });
  });

  describe("removeComponent", () => {
    it("should return null if the component matches the ID to remove", () => {
      const onFound = jest.fn();
      const result = removeComponent(dummyComponentA, "compA", onFound);

      expect(result).toBeNull();
      expect(onFound).toHaveBeenCalledWith(dummyComponentA);
    });

    it("should recursively remove a child component from a container", () => {
      const container: BaseComponent = {
        ...dummyContainer,
        components: [dummyComponentA, dummyComponentB],
      };

      const result = removeComponent(container, "compA");

      expect(result).not.toBeNull();

      expect(result.components).toHaveLength(1);

      expect(result.components[0]).toEqual(dummyComponentB);
    });

    it("should replace deleted child with emptyGridRowElement if parent is 'input-grid-row'", () => {
      const row: BaseComponent = {
        id: "row1",
        type: "input-grid-row",
        category: "component",
        components: [dummyComponentA],
      };

      const result = removeComponent(row, "compA");

      expect(result.components[0].type).toBe("empty-row");
    });

    it("should return component unchanged if neither it nor children match", () => {
      const result = removeComponent(dummyComponentA, "compB");
      expect(result).toEqual(dummyComponentA);
    });
  });

  describe("removeComponentFromComponent", () => {
    it("should remove a component from an array of components", () => {
      const components = [dummyComponentA, dummyComponentB];
      const result = removeComponentFromComponent(components, "compA");

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(dummyComponentB);
    });

    it("should handle undefined input array", () => {
      const result = removeComponentFromComponent(undefined, "compA");
      expect(result).toEqual([]);
    });
  });

  describe("updateComponentInComponent", () => {
    it("should update properties if component matches target ID", () => {
      const updater = jest.fn((comp) => {
        comp.properties.updated = true;
      });
      const result = updateComponentInComponent(
        dummyComponentA,
        "compA",
        updater
      );

      expect(result.properties?.updated).toBe(true);
      expect(updater).toHaveBeenCalled();
    });

    it("should recurse to update a child component", () => {
      const updater = jest.fn((comp) => {
        comp.properties.updated = true;
      });
      const result = updateComponentInComponent(
        dummyContainer,
        "compA",
        updater
      );

      expect(result.components?.[0].properties?.updated).toBe(true);
    });

    it("should update a column in an input-table properties", () => {
      const inputTable: BaseComponent = {
        id: "table1",
        type: "input-table",
        category: "component",
        properties: {
          inputColumns: [{ id: "col1", label: "Old Label" }],
        },
      };

      const updater = jest.fn((col) => {
        col.label = "New Label";
      });
      const result = updateComponentInComponent(inputTable, "col1", updater);

      expect(result.properties?.inputColumns[0].label).toBe("New Label");
    });

    it("should return original component if not found", () => {
      const updater = jest.fn();
      const result = updateComponentInComponent(
        dummyComponentA,
        "compB",
        updater
      );
      expect(result).toEqual(dummyComponentA);
    });
  });

  describe("updateComponent", () => {
    it("should update a component inside an array", () => {
      const compA: BaseComponent = {
        id: "compA",
        type: "input",
        category: "component",
        properties: { name: "fieldA" },
      };
      const compB: BaseComponent = {
        id: "compB",
        type: "input",
        category: "component",
        properties: { name: "fieldB" },
      };

      const components = [compA, compB];

      const updater = jest.fn((comp) => {
        comp.properties = { ...comp.properties, updated: true };
      });

      const result = updateComponent(components, "compB", updater);

      expect(result[1].properties?.updated).toBe(true);

      expect(result[0].properties?.updated).toBeUndefined();
    });

    it("should handle undefined components array", () => {
      const result = updateComponent(undefined, "compA", jest.fn());
      expect(result).toEqual([]);
    });
  });
});
