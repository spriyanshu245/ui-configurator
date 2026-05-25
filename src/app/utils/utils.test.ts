import { v4 as uuidv4 } from "uuid";
import {
  convertHyphenSeparatedToPascalCase,
  toPascalCase,
  resetGhostImage,
  getBuilderPaneScrollTop,
  scrollBuilderPaneTo,
  scrollToTop,
  generateRandomId,
  deepClone,
  keyFormat,
  formatDate,
  getKeyValue,
  getDateFormats,
  getComponents,
  stripKeys,
  addCategoryRecursive,
  renderNameKeyOptions,
  renderOptions,
  traverseAndReplace,
  replaceIdsInJson,
  emptyGridRowElement,
  getSelectedOptions,
  getNameKey,
  copyToClipboard,
  isNonEmpty,
  toCode,
  toEditableCode,
  getBaseUrl,
} from "./utils";
import { NameKeyId } from "../types/types";

jest.mock("uuid");

test("generateRandomId should return a UUID", () => {
  (uuidv4 as jest.Mock).mockReturnValue("1234-5678");

  expect(generateRandomId()).toBe("1234-5678");
});

describe("Utils functions", () => {
  test("convertHyphenSeparatedToPascalCase should convert hyphenated string to PascalCase", () => {
    expect(convertHyphenSeparatedToPascalCase("hello-world")).toBe(
      "HelloWorld",
    );
    expect(convertHyphenSeparatedToPascalCase("")).toBe("");
  });

  test("toPascalCase should convert different cases to PascalCase", () => {
    expect(toPascalCase("helloWorld")).toBe("Hello World");
    expect(toPascalCase("hello_world")).toBe("Hello World");
  });

  test("resetGhostImage should remove ghostEl element", () => {
    document.body.innerHTML = '<div id="ghostEl"></div>';
    resetGhostImage();
    expect(document.getElementById("ghostEl")).toBeNull();
  });

  test("scrollToTop should scroll the window to top", () => {
    window.scrollTo = jest.fn();
    scrollToTop();
    expect(window.scrollTo).toHaveBeenCalledWith({
      top: 0,
      behavior: "auto",
    });
  });

  test("getBuilderPaneScrollTop should return the builder pane scroll position when present", () => {
    const builderPane = document.createElement("div");
    builderPane.id = "builderPane";
    Object.defineProperty(builderPane, "scrollTop", {
      configurable: true,
      value: 135,
    });
    document.body.appendChild(builderPane);

    expect(getBuilderPaneScrollTop()).toBe(135);

    document.body.removeChild(builderPane);
  });

  test("getBuilderPaneScrollTop should fall back to window.scrollY when builder pane is missing", () => {
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 246,
    });

    expect(getBuilderPaneScrollTop()).toBe(246);
  });

  test("scrollBuilderPaneTo should scroll the builder pane when present", () => {
    const builderPane = document.createElement("div");
    builderPane.id = "builderPane";
    builderPane.scrollTo = jest.fn();
    document.body.appendChild(builderPane);

    scrollBuilderPaneTo(88);

    expect(builderPane.scrollTo).toHaveBeenCalledWith({
      top: 88,
      behavior: "auto",
    });

    document.body.removeChild(builderPane);
  });

  test("generateRandomId should return a UUID", () => {
    (uuidv4 as jest.Mock).mockReturnValue("1234-5678");

    expect(generateRandomId()).toBe("1234-5678");

    expect(uuidv4).toHaveBeenCalled();
  });

  test("keyFormat should format keys correctly", () => {
    expect(keyFormat(" a, b , c ")).toBe("a,b,c");
    expect(keyFormat("   ")).toBe("");
  });

  test("formatDate should format date correctly", () => {
    const date = "2024-02-27T15:30:00Z";
    const formattedDate = formatDate(date);
    const dateRegex =
      /^[A-Za-z]{3} \d{1,2}(st|nd|rd|th) \d{4} \d{1,2}:\d{2} (AM|PM)$/;
    expect(formattedDate).toMatch(dateRegex);
  });

  test("should format date with 'st' suffix", () => {
    expect(formatDate("2024-01-01T15:30:00Z")).toMatch(
      /Jan 1st \d{4} \d{1,2}:\d{2} (AM|PM)/,
    );
  });

  test("should format date with 'nd' suffix", () => {
    expect(formatDate("2024-02-02T15:30:00Z")).toMatch(
      /Feb 2nd \d{4} \d{1,2}:\d{2} (AM|PM)/,
    );
  });

  test("should format date with 'rd' suffix", () => {
    expect(formatDate("2024-03-03T15:30:00Z")).toMatch(
      /Mar 3rd \d{4} \d{1,2}:\d{2} (AM|PM)/,
    );
  });

  test("should format date with 'th' suffix (4-20 range)", () => {
    expect(formatDate("2024-04-04T15:30:00Z")).toMatch(
      /Apr 4th \d{4} \d{1,2}:\d{2} (AM|PM)/,
    );
    expect(formatDate("2024-05-11T15:30:00Z")).toMatch(
      /May 11th \d{4} \d{1,2}:\d{2} (AM|PM)/,
    );
    expect(formatDate("2024-06-13T15:30:00Z")).toMatch(
      /Jun 13th \d{4} \d{1,2}:\d{2} (AM|PM)/,
    );
    expect(formatDate("2024-07-20T15:30:00Z")).toMatch(
      /Jul 20th \d{4} \d{1,2}:\d{2} (AM|PM)/,
    );
  });

  test("should format date with 'st' suffix (21st, 31st)", () => {
    expect(formatDate("2024-08-21T15:30:00Z")).toMatch(
      /Aug 21st \d{4} \d{1,2}:\d{2} (AM|PM)/,
    );
    expect(formatDate("2024-10-31T15:30:00Z")).toMatch(
      /Oct 31st \d{4} \d{1,2}:\d{2} (AM|PM)/,
    );
  });

  test("should format date with 'nd' suffix (22nd)", () => {
    expect(formatDate("2024-09-22T15:30:00Z")).toMatch(
      /Sep 22nd \d{4} \d{1,2}:\d{2} (AM|PM)/,
    );
  });

  test("should format date with 'rd' suffix (23rd)", () => {
    expect(formatDate("2024-12-23T15:30:00Z")).toMatch(
      /Dec 23rd \d{4} \d{1,2}:\d{2} (AM|PM)/,
    );
  });

  test("should format date with 'th' suffix (default case)", () => {
    expect(formatDate("2024-11-30T15:30:00Z")).toMatch(
      /Nov 30th \d{4} \d{1,2}:\d{2} (AM|PM)/,
    );
  });

  test("getKeyValue should retrieve nested values", () => {
    const obj = { a: { b: { c: 42 } } };
    expect(getKeyValue(obj, "c")).toBe(42);
    expect(getKeyValue(obj, "x")).toBeUndefined();
  });

  test("getDateFormats should return correct date formats", () => {
    expect(getDateFormats("-")).toEqual([
      "DD-MM-YYYY",
      "MM-DD-YYYY",
      "YYYY-MM-DD",
    ]);
  });

  test("getDateFormats should return correct date formats", () => {
    expect(getDateFormats("")).toEqual([
      "DD/MM/YYYY",
      "MM/DD/YYYY",
      "YYYY/MM/DD",
    ]);
  });
});

describe("deepClone", () => {
  test("should return primitive values as is", () => {
    expect(deepClone(42)).toBe(42);
    expect(deepClone("hello")).toBe("hello");
    expect(deepClone(true)).toBe(true);
    expect(deepClone(null)).toBe(null);
    expect(deepClone(undefined)).toBe(undefined);
  });

  test("should clone a simple object", () => {
    const obj = { a: 1, b: "test" };
    const clonedObj = deepClone(obj);
    expect(clonedObj).toEqual(obj);
    expect(clonedObj).not.toBe(obj);
  });

  test("should clone a nested object", () => {
    const obj = { a: { b: { c: 3 } } };
    const clonedObj = deepClone(obj);
    expect(clonedObj).toEqual(obj);
    expect(clonedObj.a).not.toBe(obj.a);
    expect(clonedObj.a.b).not.toBe(obj.a.b);
  });

  test("should handle cyclic objects", () => {
    const obj: any = { a: 1 };
    obj.self = obj;
    const clonedObj = deepClone(obj);
    expect(clonedObj).toEqual({ a: 1, self: clonedObj });
    expect(clonedObj).not.toBe(obj);
    expect(clonedObj.self).toBe(clonedObj);
  });

  test("should clone arrays", () => {
    const arr = [1, { a: 2 }, [3, 4]];
    const clonedArr = deepClone(arr);
    expect(clonedArr).toEqual(arr);
    expect(clonedArr).not.toBe(arr);
    expect(clonedArr[1]).not.toBe(arr[1]);
    expect(clonedArr[2]).not.toBe(arr[2]);
  });

  test("should clone Date objects", () => {
    const date = new Date();
    const clonedDate = deepClone(date);
    expect(clonedDate).toEqual(date);
    expect(clonedDate).not.toBe(date);
    expect(clonedDate.getTime()).toBe(date.getTime());
  });

  test("should clone Map objects", () => {
    const map = new Map<string, unknown>([
      ["key1", "value1"],
      ["key2", { a: 1 }],
    ]);
    const clonedMap = deepClone(map);
    expect(clonedMap).toEqual(map);
    expect(clonedMap).not.toBe(map);
    expect(clonedMap.get("key2")).not.toBe(map.get("key2"));
  });

  test("should clone Set objects", () => {
    const set = new Set([1, 2, { a: 3 }]);
    const clonedSet = deepClone(set);
    expect(clonedSet).toEqual(set);
    expect(clonedSet).not.toBe(set);
  });

  test("should return an empty object when cloning an empty object", () => {
    expect(deepClone({})).toEqual({});
  });

  test("should return an empty array when cloning an empty array", () => {
    expect(deepClone([])).toEqual([]);
  });

  test("should clone objects with multiple types", () => {
    const obj = {
      num: 1,
      str: "hello",
      bool: true,
      arr: [1, 2, 3],
      nested: { a: 10, b: 20 },
      date: new Date(),
      map: new Map<string, unknown>([
        ["key1", "value1"],
        ["key2", { a: 1 }],
      ]),
      set: new Set([1, 2, 3]),
    };

    const clonedObj = deepClone(obj);

    expect(clonedObj).toEqual(obj);
    expect(clonedObj).not.toBe(obj);
    expect(clonedObj.arr).not.toBe(obj.arr);
    expect(clonedObj.nested).not.toBe(obj.nested);
    expect(clonedObj.date).not.toBe(obj.date);
    expect(clonedObj.date.getTime()).toBe(obj.date.getTime());
    expect(clonedObj.map).not.toBe(obj.map);
    expect(clonedObj.set).not.toBe(obj.set);
  });
});

describe("getComponents", () => {
  // Basic test cases
  test("returns empty array when input is null or undefined", () => {
    expect(getComponents(null)).toEqual([]);
    expect(getComponents(undefined)).toEqual([]);
  });

  test("returns empty array when input is not an object", () => {
    expect(getComponents("string")).toEqual([]);
    expect(getComponents(123)).toEqual([]);
    expect(getComponents(true)).toEqual([]);
  });

  test("extracts name from table component", () => {
    const tableComponent = {
      type: "table",
      properties: {
        name: "usersTable",
      },
    };
    expect(getComponents(tableComponent)).toEqual(["usersTable"]);
  });

  test("extracts name from data-grid component", () => {
    const dataGridComponent = {
      type: "data-grid",
      properties: {
        name: "productsGrid",
      },
    };
    expect(getComponents(dataGridComponent)).toEqual(["productsGrid"]);
  });

  test("ignores components without a name property", () => {
    const component = {
      type: "table",
      properties: {},
    };
    expect(getComponents(component)).toEqual([]);
  });

  test("ignores components that are not table or data-grid", () => {
    const component = {
      type: "button",
      properties: {
        name: "submitButton",
      },
    };
    expect(getComponents(component)).toEqual([]);
  });

  test("processes nested components in an object", () => {
    const component = {
      type: "form",
      properties: {},
      children: {
        child1: {
          type: "table",
          properties: {
            name: "childTable",
          },
        },
      },
    };
    expect(getComponents(component)).toEqual(["childTable"]);
  });

  test("processes nested components in an array", () => {
    const component = {
      type: "container",
      properties: {},
      children: [
        {
          type: "table",
          properties: {
            name: "table1",
          },
        },
        {
          type: "data-grid",
          properties: {
            name: "grid1",
          },
        },
      ],
    };
    expect(getComponents(component)).toEqual(["table1", "grid1"]);
  });

  test("handles deeply nested components", () => {
    const component = {
      type: "page",
      properties: {},
      sections: [
        {
          type: "section",
          properties: {},
          rows: [
            {
              columns: [
                {
                  widgets: [
                    {
                      type: "table",
                      properties: {
                        name: "deepTable",
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(getComponents(component)).toEqual(["deepTable"]);
  });

  test("combines multiple components at different levels", () => {
    const component = {
      type: "page",
      properties: {},
      header: {
        type: "table",
        properties: {
          name: "headerTable",
        },
      },
      content: [
        {
          type: "data-grid",
          properties: {
            name: "contentGrid",
          },
        },
      ],
      footer: {
        elements: [
          {
            type: "table",
            properties: {
              name: "footerTable",
            },
          },
        ],
      },
    };
    expect(getComponents(component)).toEqual([
      "headerTable",
      "contentGrid",
      "footerTable",
    ]);
  });

  test("filters out falsy values", () => {
    const component = {
      type: "container",
      properties: {},
      children: [
        {
          type: "table",
          properties: {
            name: "realTable",
          },
        },
        {
          type: "table",
          properties: {
            name: "", // Empty name
          },
        },
        {
          type: "table",
          properties: {
            name: null, // Null name
          },
        },
      ],
    };
    expect(getComponents(component)).toEqual(["realTable"]);
  });

  test("handles complex mixed nested structures", () => {
    const component = {
      layout: {
        type: "grid",
        properties: {},
        items: [
          {
            type: "cell",
            content: {
              type: "table",
              properties: {
                name: "gridTable",
              },
            },
          },
        ],
      },
      sidebar: {
        widgets: [
          {
            type: "data-grid",
            properties: {
              name: "sidebarGrid",
            },
          },
          {
            type: "container",
            children: {
              nested: {
                type: "table",
                properties: {
                  name: "nestedTable",
                },
              },
            },
          },
        ],
      },
    };

    expect(getComponents(component)).toEqual([
      "gridTable",
      "sidebarGrid",
      "nestedTable",
    ]);
  });
});

describe("stripKeys", () => {
  it("returns primitive values unchanged", () => {
    expect(stripKeys("hello", ["id"])).toBe("hello");
    expect(stripKeys(123, ["id"])).toBe(123);
    expect(stripKeys(null, ["id"])).toBe(null);
  });

  it("removes specified keys from flat objects", () => {
    const obj = { id: "123", name: "John", role: "admin" };
    const result = stripKeys(obj, ["id"]);
    expect(result).toEqual({ name: "John", role: "admin" });
  });

  it("removes specified keys from deeply nested objects", () => {
    const obj = {
      id: "123",
      user: {
        id: "nested-id",
        name: "Alice",
        meta: {
          id: "deep-id",
          info: "details",
        },
      },
    };
    const result = stripKeys(obj, ["id"]);
    expect(result).toEqual({
      user: {
        name: "Alice",
        meta: {
          info: "details",
        },
      },
    });
  });

  it('leaves "properties" key and its value untouched', () => {
    const obj = {
      type: "input",
      properties: {
        label: "Name",
        options: [1, 2, 3],
      },
      id: "xyz",
    };
    const result = stripKeys(obj, ["id"]);
    expect(result).toEqual({
      type: "input",
      properties: {
        label: "Name",
        options: [1, 2, 3],
      },
    });
  });

  it("handles arrays of objects and strips keys properly", () => {
    const obj = [
      { id: "1", name: "A" },
      { id: "2", name: "B", meta: { id: "3", detail: true } },
    ];
    const result = stripKeys(obj, ["id"]);
    expect(result).toEqual([
      { name: "A" },
      { name: "B", meta: { detail: true } },
    ]);
  });

  it("returns array unchanged if insideProperties is true", () => {
    const arr = [{ id: "1", name: "Test" }];
    const result = stripKeys(arr, ["id"], true);
    expect(result).toEqual(arr);
  });
});

describe("addCategoryRecursive", () => {
  beforeEach(() => jest.clearAllMocks());
  global.structuredClone = jest.fn((val) => JSON.parse(JSON.stringify(val)));
  // Essential Test 1: Basic functionality + immutability
  test("adds category and clones component", () => {
    const component = {
      id: "test",
      type: "stack",
      properties: {},
      category: "" as const,
    };

    const result = addCategoryRecursive(component, "section");

    expect(result.category).toBe("section");
    expect(result).not.toBe(component);
    expect(global.structuredClone).toHaveBeenCalledWith(component);
  });

  // Essential Test 2: Recursive behavior
  test("recursively adds category to nested components", () => {
    const component = {
      id: "parent",
      type: "stack",
      properties: {},
      category: "" as const,
      components: [
        { id: "child1", type: "stack", properties: {}, category: "" as const },
        {
          id: "child2",
          type: "stack",
          properties: {},
          category: "" as const,
          components: [
            {
              id: "grandchild",
              type: "stack",
              properties: {},
              category: "" as const,
            },
          ],
        },
      ],
    };

    const result = addCategoryRecursive(component, "form");

    expect(result.category).toBe("form");
    expect(result.components![0].category).toBe("form");
    expect(result.components![1].components![0].category).toBe("form");
  });

  // Essential Test 3: Edge cases
  test("handles components without nested structure", () => {
    const component = {
      id: "test",
      type: "stack",
      properties: {},
      category: "" as const,
      components: [],
    };

    const result = addCategoryRecursive(component, "component");

    expect(result.category).toBe("component");
    expect(result.components).toEqual([]);
  });
});

describe("renderNameKeyOptions", () => {
  it("should map options to value-label pairs", () => {
    const input = [
      { id: "1", label: "Option One" },
      { id: "2", label: "Option Two" },
    ];

    const result = renderNameKeyOptions(input);

    expect(result).toEqual([
      { value: "1", label: "Option One" },
      { value: "2", label: "Option Two" },
    ]);
  });

  it("should return an empty array when options is undefined", () => {
    const result = renderNameKeyOptions(undefined as any);

    expect(result).toEqual([]);
  });

  it("should return an empty array when options is an empty array", () => {
    const result = renderNameKeyOptions([]);

    expect(result).toEqual([]);
  });
});

describe("renderOptions", () => {
  it("should map string array to value-label pairs", () => {
    const result = renderOptions(["a", "b", "c"]);
    expect(result).toEqual([
      { value: "a", label: "a" },
      { value: "b", label: "b" },
      { value: "c", label: "c" },
    ]);
  });

  it("should return empty array when options is falsy", () => {
    const result = renderOptions(null as unknown as string[]);
    expect(result).toEqual([]);
  });
});

describe("keyFormat with null/undefined", () => {
  it("should return undefined when key is null", () => {
    const result = keyFormat(null as unknown as string);
    expect(result).toBeUndefined();
  });
});

describe("traverseAndReplace", () => {
  beforeEach(() => {
    let counter = 0;
    (uuidv4 as jest.Mock).mockImplementation(() => `new-id-${++counter}`);
  });

  it("should return non-object values as-is", () => {
    const idMap = new Map();
    const result = traverseAndReplace({
      obj: "string" as unknown as Record<string, never>,
      idMap,
    });
    expect(result).toBe("string");
  });

  it("should return null as-is", () => {
    const idMap = new Map();
    const result = traverseAndReplace({
      obj: null as unknown as Record<string, never>,
      idMap,
    });
    expect(result).toBeNull();
  });

  it("should map over array items", () => {
    const idMap = new Map();
    const result = traverseAndReplace({
      obj: [{ id: "orig" }] as unknown as Record<string, never>,
      idMap,
    });
    expect(Array.isArray(result)).toBe(true);
    expect((result as Record<string, unknown>[])[0].id).toBe("new-id-1");
  });

  it("should replace id keys with new generated ids", () => {
    const idMap = new Map();
    const obj = { id: "original-id", name: "test" };
    const result = traverseAndReplace({ obj, idMap });
    expect(result.id).toBe("new-id-1");
    expect(result.name).toBe("test");
  });

  it("should replace firstPageCode keys with new generated ids", () => {
    const idMap = new Map();
    const obj = { firstPageCode: "page-1" };
    const result = traverseAndReplace({ obj, idMap });
    expect(result.firstPageCode).toBe("new-id-1");
  });

  it("should reuse same id when key appears multiple times", () => {
    const idMap = new Map();
    const obj = { id: "shared", ref: { id: "shared" } };
    traverseAndReplace({ obj, idMap });
    expect(idMap.get("shared")).toBe("new-id-1");
  });

  it("should skip nameKeyIds keys", () => {
    const idMap = new Map();
    const nameKeyIds = ["original-ref"];
    const obj = { nameKeyIds, title: "test" };
    const result = traverseAndReplace({ obj, idMap });
    expect(result.nameKeyIds).toBe(nameKeyIds);
  });

  it("should recursively process nested objects", () => {
    const idMap = new Map();
    const obj = { nested: { id: "nested-id" } };
    const result = traverseAndReplace({ obj, idMap });
    expect((result.nested as Record<string, unknown>).id).toBe("new-id-1");
  });
});

describe("replaceIdsInJson", () => {
  beforeEach(() => {
    let counter = 0;
    (uuidv4 as jest.Mock).mockImplementation(() => `replaced-${++counter}`);
  });

  it("should replace all id fields in a JSON object", () => {
    const input = { id: "old-id", components: [{ id: "child-id" }] };
    const result = replaceIdsInJson(input);
    expect(result.id).toBe("replaced-1");
    expect((result.components as Record<string, unknown>[])[0].id).toBe(
      "replaced-2",
    );
  });

  it("should not mutate original input", () => {
    const input = { id: "original" };
    replaceIdsInJson(input);
    expect(input.id).toBe("original");
  });
});

describe("emptyGridRowElement", () => {
  beforeEach(() => {
    (uuidv4 as jest.Mock).mockReturnValue("grid-row-id");
  });

  it("should return object with correct type and category", () => {
    const result = emptyGridRowElement();
    expect(result.id).toBe("grid-row-id");
    expect(result.type).toBe("input-grid-column");
    expect(result.category).toBe("component");
  });
});

describe("getSelectedOptions", () => {
  const options: NameKeyId[] = [
    { id: "opt1", label: "Option 1" },
    { id: "opt2", label: "Option 2" },
  ];

  it("should return matched options from the list", () => {
    const result = getSelectedOptions(["opt1"], options);
    expect(result).toEqual([{ id: "opt1", label: "Option 1" }]);
  });

  it("should use option as-is when it starts with ${", () => {
    const result = getSelectedOptions(["${variable}"], options);
    expect(result).toEqual([{ id: "${variable}", label: "${variable}" }]);
  });

  it("should use option as-is when options array is empty", () => {
    const result = getSelectedOptions(["opt1"], []);
    expect(result).toEqual([{ id: "opt1", label: "opt1" }]);
  });

  it("should skip option when not found in options list", () => {
    const result = getSelectedOptions(["notfound"], options);
    expect(result).toEqual([]);
  });

  it("should handle mixed options", () => {
    const result = getSelectedOptions(["opt1", "${expr}", "opt2"], options);
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe("opt1");
    expect(result[1].id).toBe("${expr}");
    expect(result[2].id).toBe("opt2");
  });
});

describe("getNameKey", () => {
  const nameKeyIds: NameKeyId[] = [
    { id: "key1", label: "Label One" },
    { id: "key2", label: "Label Two" },
  ];

  it("should return label when id is found", () => {
    expect(getNameKey(nameKeyIds, "key1")).toBe("Label One");
  });

  it("should return the name itself when id is not found", () => {
    expect(getNameKey(nameKeyIds, "unknown")).toBe("unknown");
  });
});

describe("copyToClipboard", () => {
  const originalClipboard = Object.getOwnPropertyDescriptor(
    navigator,
    "clipboard",
  );

  afterEach(() => {
    if (originalClipboard) {
      Object.defineProperty(navigator, "clipboard", originalClipboard);
    }
    jest.restoreAllMocks();
  });

  it("should use navigator.clipboard.writeText when available", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    await copyToClipboard("hello");
    expect(writeText).toHaveBeenCalledWith("hello");
  });

  it("should fallback to ClipboardItem.write when writeText is not available and ClipboardItem is defined", async () => {
    const write = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { write },
      configurable: true,
    });
    const mockClipboardItem = jest.fn().mockImplementation((items) => items);
    (global as Record<string, unknown>).ClipboardItem = mockClipboardItem;

    await copyToClipboard("clipboard item text");
    expect(write).toHaveBeenCalled();

    delete (global as Record<string, unknown>).ClipboardItem;
  });

  it("should fallback to window.prompt when clipboard is not available", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    });
    const promptSpy = jest.spyOn(window, "prompt").mockReturnValue(null);
    Object.defineProperty(navigator, "userAgent", {
      value: "Windows NT",
      configurable: true,
    });

    await copyToClipboard("fallback text");
    expect(promptSpy).toHaveBeenCalled();
  });

  it("should fallback to prompt when writeText throws", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: jest.fn().mockRejectedValue(new Error("denied")) },
      configurable: true,
    });
    const promptSpy = jest.spyOn(window, "prompt").mockReturnValue(null);

    await copyToClipboard("text");
    expect(promptSpy).toHaveBeenCalled();
  });

  it("should use mac prompt instruction when userAgent includes mac", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      configurable: true,
    });
    const promptSpy = jest.spyOn(window, "prompt").mockReturnValue(null);

    await copyToClipboard("mac text");
    expect(promptSpy).toHaveBeenCalledWith(
      expect.stringContaining("Command+C"),
      "mac text",
    );
  });
});

describe("isNonEmpty", () => {
  it("should return true for non-empty string", () => {
    expect(isNonEmpty("hello")).toBe(true);
  });

  it("should return false for empty string", () => {
    expect(isNonEmpty("")).toBe(false);
  });

  it("should return false for whitespace-only string", () => {
    expect(isNonEmpty("   ")).toBe(false);
  });
});

describe("toCode", () => {
  it("should lowercase and hyphenate a string", () => {
    expect(toCode("Hello World")).toBe("hello-world");
  });

  it("should strip special characters", () => {
    expect(toCode("Hello! @World#")).toBe("hello-world");
  });

  it("should strip leading and trailing hyphens", () => {
    expect(toCode("--hello--")).toBe("hello");
  });

  it("should handle alphanumeric input unchanged", () => {
    expect(toCode("abc123")).toBe("abc123");
  });
});

describe("toEditableCode", () => {
  it("should lowercase and hyphenate spaces", () => {
    expect(toEditableCode("Hello World")).toBe("hello-world");
  });

  it("should strip special characters but keep hyphens", () => {
    expect(toEditableCode("hello@world")).toBe("helloworld");
  });

  it("should collapse multiple hyphens into one", () => {
    expect(toEditableCode("hello--world")).toBe("hello-world");
  });

  it("should strip leading hyphens", () => {
    expect(toEditableCode("-hello")).toBe("hello");
  });
});

describe("getBaseUrl", () => {
  it("should return an empty string when prefix is empty", () => {
    expect(getBaseUrl("", "test")).toBe("");
  });
});
