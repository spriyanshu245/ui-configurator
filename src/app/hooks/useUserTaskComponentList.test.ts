import { renderHook } from "@testing-library/react";
import { useTaskComponents } from "./useUserTaskComponentList";
import { UserTask, BaseComponent } from "../types/types";

describe("useTaskComponents", () => {
  it("should return empty array for null or undefined userTask", () => {
    const { result } = renderHook(() =>
      useTaskComponents(undefined as unknown as UserTask)
    );
    expect(result.current).toEqual([]);
  });

  it("should return empty array if userTask has no components", () => {
    const mockUserTask: UserTask = { components: [] } as any;
    const { result } = renderHook(() => useTaskComponents(mockUserTask));
    expect(result.current).toEqual([]);
  });

  it("should process simple components list", () => {
    const mockUserTask: UserTask = {
      components: [
        {
          id: "1",
          type: "input",
          category: "form",
          properties: {
            name: "testInput",
            label: "Test Input",
            text: "Enter text",
          },
        },
      ],
    };

    const { result } = renderHook(() => useTaskComponents(mockUserTask));

    expect(result.current).toEqual([
      {
        id: "1",
        type: "input",
        name: "testInput",
        label: "Test Input",
        text: "Enter text",
      },
    ]);
  });

  it("should handle components with missing properties gracefully", () => {
    const mockUserTask: UserTask = {
      components: [
        {
          id: "2",
          type: "button",
          category: "component",
        },
      ],
    };

    const { result } = renderHook(() => useTaskComponents(mockUserTask));

    expect(result.current).toEqual([
      {
        id: "2",
        type: "button",
        name: "",
        label: "button",
        text: "",
      },
    ]);
  });

  it("should process nested components array", () => {
    const mockUserTask: UserTask = {
      components: [
        {
          id: "parent",
          type: "container",
          category: "component",
          properties: { name: "parent" },
          components: [
            {
              id: "child",
              type: "text",
              category: "component",
              properties: { name: "child" },
            },
          ],
        },
      ],
    };

    const { result } = renderHook(() => useTaskComponents(mockUserTask));

    expect(result.current).toEqual([
      {
        id: "parent",
        type: "container",
        name: "parent",
        label: "container",
        text: "",
      },
      {
        id: "child",
        type: "text",
        name: "child",
        label: "text",
        text: "",
      },
    ]);
  });

  it("should process nested components in special property arrays (fields, items, etc)", () => {
    const mockUserTask: UserTask = {
      components: [
        {
          id: "complex",
          type: "form",
          category: "form",
          properties: {
            fields: [
              {
                id: "field1",
                type: "input",
                category: "form",
                properties: { name: "field1" },
              },
            ],
            items: [
              {
                id: "item1",
                type: "checkbox",
                category: "form",
                properties: { name: "item1" },
              },
            ],
            elements: [
              "string",
              null,
              { id: "el1", type: "button", category: "form" },
            ],
          },
        },
      ],
    };

    const { result } = renderHook(() => useTaskComponents(mockUserTask));

    expect(result.current).toHaveLength(4);
    expect(result.current.map((c) => c.id)).toEqual([
      "complex",
      "field1",
      "item1",
      "el1",
    ]);
  });

  it("should process single object properties that are components", () => {
    const mockUserTask: UserTask = {
      components: [
        {
          id: "wrapper",
          type: "box",
          category: "component",
          properties: {
            headerComponent: {
              id: "header",
              type: "text",
              category: "component",
              properties: { text: "Header" },
            } as any,
            config: {
              someSetting: true,
            },
          },
        },
      ],
    };

    const { result } = renderHook(() => useTaskComponents(mockUserTask));

    expect(result.current.map((c) => c.id)).toEqual(["wrapper", "header"]);
  });

  it("should process generic array properties containing components", () => {
    const mockUserTask: UserTask = {
      components: [
        {
          id: "list",
          type: "list",
          category: "component",
          properties: {
            customList: [
              {
                id: "custom1",
                type: "list-item",
                category: "component",
              },
              { id: "invalid", category: "component" },
            ],
            tags: ["a", "b"],
          },
        },
      ],
    };

    const { result } = renderHook(() => useTaskComponents(mockUserTask));

    expect(result.current.map((c) => c.id)).toEqual(["list", "custom1"]);
  });

  it("should handle nested components with invalid structures gracefully", () => {
    const mockUserTask: UserTask = {
      components: [
        {
          id: "parent",
          type: "group",
          category: "component",
          components: [
            null as unknown as BaseComponent,
            { id: "bad", category: "form" } as BaseComponent,
            { id: "good", type: "span", category: "component" },
          ],
        },
      ],
    };

    const { result } = renderHook(() => useTaskComponents(mockUserTask));

    expect(result.current.map((c) => c.id)).toEqual(["parent", "good"]);
  });

  it("should return early if component is null or not an object", () => {
    const mockUserTask: UserTask = {
      components: [
        null as unknown as BaseComponent,
        "not-an-object" as unknown as BaseComponent,
      ],
    };

    const { result } = renderHook(() => useTaskComponents(mockUserTask));

    expect(result.current).toEqual([]);
  });

  it("should exclude components with types defined in EXCLUDED_TYPES (e.g., tab)", () => {
    const mockUserTask: UserTask = {
      components: [
        {
          id: "tab-1",
          type: "tab",
          category: "component",
          properties: { label: "I should be excluded" },
        },
        {
          id: "input-1",
          type: "input",
          category: "form",
          properties: { label: "I should be included" },
        },
      ],
    };

    const { result } = renderHook(() => useTaskComponents(mockUserTask));

    expect(result.current).toHaveLength(1);
    expect(result.current[0].id).toBe("input-1");
    expect(result.current.find((c) => c.type === "tab")).toBeUndefined();
  });
});
