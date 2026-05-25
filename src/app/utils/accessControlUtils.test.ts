import { Microsite, BaseComponent } from "@/app/types/types";
import {
  mapToBaseConfig,
  mapComponent,
  findComponentById,
  convertDSLToBaseConfig as convertDSLToBaseConfigFunc,
  resolvePages,
  reconcileConfig,
} from "./accessControlUtils";

jest.mock("@/app/services/microsite.service", () => ({
  fetchPageDSL: jest.fn(),
}));

import { fetchPageDSL } from "@/app/services/microsite.service";

const mockFetchPageDSL = fetchPageDSL as jest.MockedFunction<
  typeof fetchPageDSL
>;

describe("accessControlUtils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("mapComponent", () => {
    it("should map component with basic properties", () => {
      const input = {
        componentId: "comp1",
        isVisible: true,
        isEditable: false,
        isDisabled: true,
        components: [],
      };

      const result = mapComponent(input);

      expect(result.componentId).toBe("comp1");
      expect(result.isVisible).toBe(true);
      expect(result.isEditable).toBe(false);
      expect(result.isDisabled).toBe(true);
    });

    it("should map component with isDefault property", () => {
      const input = {
        componentId: "comp1",
        isVisible: true,
        isEditable: true,
        isDisabled: false,
        isDefault: true,
      };

      const result = mapComponent(input);

      expect(result.isDefault).toBe(true);
    });

    it("should map component with isReadOnly property", () => {
      const input = {
        componentId: "comp1",
        isVisible: true,
        isEditable: true,
        isDisabled: false,
        isReadOnly: true,
      };

      const result = mapComponent(input);

      expect(result.isReadOnly).toBe(true);
    });

    it("should recursively map nested components", () => {
      const input = {
        componentId: "parent",
        isVisible: true,
        isEditable: true,
        isDisabled: false,
        components: [
          {
            componentId: "child1",
            isVisible: true,
            isEditable: true,
            isDisabled: false,
          },
        ],
      };

      const result = mapComponent(input);

      expect(result.components).toHaveLength(1);
      expect(result.components?.[0].componentId).toBe("child1");
    });

    it("should map columns correctly", () => {
      const input = {
        componentId: "comp1",
        isVisible: true,
        isEditable: true,
        isDisabled: false,
        columns: [
          { columnId: "col1", isVisible: true, isDisabled: false },
          { columnId: "col2", isVisible: false, isDisabled: true },
        ],
      };

      const result = mapComponent(input);

      expect(result.columns).toHaveLength(2);
      expect(result.columns?.[0].columnId).toBe("col1");
      expect(result.columns?.[1].isVisible).toBe(false);
    });
  });

  describe("mapToBaseConfig", () => {
    it("should map data to base config with extra properties", () => {
      const data = {
        micrositeSlug: "test-slug",
        version: 1,
        pages: [
          {
            pageCode: "page1",
            isVisible: true,
            isEditable: true,
            isDisabled: false,
            components: [
              {
                componentId: "comp1",
                isVisible: true,
                isEditable: true,
                isDisabled: false,
              },
            ],
          },
        ],
      };

      const extra = {
        accessConfigId: "config-id",
        accessConfigCode: "config-code",
      };

      const result = mapToBaseConfig(data, extra);

      expect(result.micrositeSlug).toBe("test-slug");
      expect(result.version).toBe(1);
      expect(result.accessConfigId).toBe("config-id");
      expect(result.accessConfigCode).toBe("config-code");
      expect(result.pages).toHaveLength(1);
      expect(result.pages[0].pageCode).toBe("page1");
    });

    it("should handle empty pages array", () => {
      const data = {
        micrositeSlug: "test-slug",
        version: 1,
        pages: [],
      };

      const result = mapToBaseConfig(data, {});

      expect(result.pages).toHaveLength(0);
    });

    it("should handle missing pages property", () => {
      const data = {
        micrositeSlug: "test-slug",
        version: 1,
      };

      const result = mapToBaseConfig(data, {});

      expect(result.pages).toHaveLength(0);
    });
  });

  describe("findComponentById", () => {
    const mockComponents: BaseComponent[] = [
      {
        id: "comp1",
        type: "button",
        components: [
          {
            id: "comp2",
            type: "button",
          },
        ],
      },
      {
        id: "comp3",
        type: "form",
        components: [
          {
            id: "comp4",
            type: "input",
            components: [
              {
                id: "comp5",
                type: "label",
              },
            ],
          },
        ],
      },
    ];

    it("should find component at root level", () => {
      const result = findComponentById(mockComponents, "comp1");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("comp1");
    });

    it("should find nested component", () => {
      const result = findComponentById(mockComponents, "comp2");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("comp2");
    });

    it("should find deeply nested component", () => {
      const result = findComponentById(mockComponents, "comp5");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("comp5");
    });

    it("should return null for non-existent component", () => {
      const result = findComponentById(mockComponents, "nonexistent");

      expect(result).toBeNull();
    });

    it("should return null for empty components array", () => {
      const result = findComponentById([], "comp1");

      expect(result).toBeNull();
    });
  });

  describe("convertDSLToBaseConfig", () => {
    const mockDsl: Microsite = {
      code: "test-microsite",
      version: 1,
      pages: [{ pageCode: "page1" }, { pageCode: "page2" }],
      firstPageCode: "page1",
    };

    beforeEach(() => {
      mockFetchPageDSL.mockResolvedValue({
        id: "page1",
        type: "page",
        components: [{ id: "comp1", type: "button" }],
      });
    });

    it("should convert DSL to base config", async () => {
      const result = await convertDSLToBaseConfigFunc(mockDsl, {
        portalTaskConfigCode: "TEST",
      });

      expect(result.micrositeSlug).toBe("test-microsite");
      expect(result.version).toBe(1);
      expect(result.portalTaskConfigCode).toBe("TEST");
    });

    it("should call fetchPageDSL for each page", async () => {
      await convertDSLToBaseConfigFunc(mockDsl, {});

      expect(mockFetchPageDSL).toHaveBeenCalledTimes(2);
      expect(mockFetchPageDSL).toHaveBeenNthCalledWith(1, "page1", 1);
      expect(mockFetchPageDSL).toHaveBeenNthCalledWith(2, "page2", 1);
    });

    it("should handle empty pages array", async () => {
      const result = await convertDSLToBaseConfigFunc(
        { ...mockDsl, pages: [] },
        {},
      );

      expect(result.pages).toHaveLength(0);
      expect(mockFetchPageDSL).not.toHaveBeenCalled();
    });

    it("should handle pages with undefined pageCode", async () => {
      mockFetchPageDSL.mockResolvedValue({
        id: "page",
        type: "page",
        components: [],
      });

      const result = await convertDSLToBaseConfigFunc(
        { ...mockDsl, pages: [{}] as any },
        {},
      );

      expect(result.pages).toHaveLength(1);
    });
  });

  describe("resolvePages", () => {
    const tableColumnWithAction = {
      id: "col-action",
      properties: { columnInputType: "api-action" },
    };
    const tableColumnWithoutAction = {
      id: "col-text",
      properties: { columnInputType: "text" },
    };

    it("should resolve pages and convert allowed components", async () => {
      mockFetchPageDSL.mockResolvedValue({
        id: "root",
        type: "page",
        components: [
          {
            id: "form-1",
            type: "form",
            components: [],
          },
        ],
      });

      const dsl: Microsite = {
        code: "test-microsite",
        version: 1,
        pages: [{ pageCode: "page1", pageVersion: 1 }],
        firstPageCode: "page1",
      };

      const result = await resolvePages(dsl);
      expect(result).toHaveLength(1);
      expect(result[0].pageCode).toBe("page1");
      expect(result[0].isVisible).toBe(true);
      expect(result[0].isEditable).toBe(true);
      expect(result[0].isDisabled).toBe(false);
      expect(result[0].components).toHaveLength(1);
      expect(result[0].components[0].componentId).toBe("form-1");
    });

    it("should exclude components not in ALLOWED_TYPES and flatten their children", async () => {
      mockFetchPageDSL.mockResolvedValue({
        id: "root",
        type: "page",
        components: [
          {
            id: "container",
            type: "div",
            components: [{ id: "form-1", type: "form", components: [] }],
          },
        ],
      });

      const dsl: Microsite = {
        code: "ms",
        version: 1,
        pages: [{ pageCode: "pg1", pageVersion: 1 }],
        firstPageCode: "pg1",
      };

      const result = await resolvePages(dsl);
      expect(result[0].components).toHaveLength(1);
      expect(result[0].components[0].componentId).toBe("form-1");
    });

    it("should mark table as isReadOnly when it has no actionable columns", async () => {
      mockFetchPageDSL.mockResolvedValue({
        id: "root",
        type: "page",
        components: [
          {
            id: "table-1",
            type: "table",
            properties: {
              tableColumns: [tableColumnWithoutAction],
            },
            components: [],
          },
        ],
      });

      const dsl: Microsite = {
        code: "ms",
        version: 1,
        pages: [{ pageCode: "pg1", pageVersion: 1 }],
        firstPageCode: "pg1",
      };

      const result = await resolvePages(dsl);
      expect(result[0].components[0].isReadOnly).toBe(true);
    });

    it("should not mark table as isReadOnly when it has actionable columns", async () => {
      mockFetchPageDSL.mockResolvedValue({
        id: "root",
        type: "page",
        components: [
          {
            id: "table-1",
            type: "table",
            properties: {
              tableColumns: [tableColumnWithAction],
            },
            components: [],
          },
        ],
      });

      const dsl: Microsite = {
        code: "ms",
        version: 1,
        pages: [{ pageCode: "pg1", pageVersion: 1 }],
        firstPageCode: "pg1",
      };

      const result = await resolvePages(dsl);
      expect(result[0].components[0].isReadOnly).toBeUndefined();
    });

    it("should extract actionable columns from table components", async () => {
      mockFetchPageDSL.mockResolvedValue({
        id: "root",
        type: "page",
        components: [
          {
            id: "table-1",
            type: "table",
            properties: {
              tableColumns: [tableColumnWithAction, tableColumnWithoutAction],
            },
            components: [],
          },
        ],
      });

      const dsl: Microsite = {
        code: "ms",
        version: 1,
        pages: [{ pageCode: "pg1", pageVersion: 1 }],
        firstPageCode: "pg1",
      };

      const result = await resolvePages(dsl);
      expect(result[0].components[0].columns).toHaveLength(1);
      expect(result[0].components[0].columns![0].columnId).toBe("col-action");
    });

    it("should handle null/undefined component gracefully in convertComponent", async () => {
      mockFetchPageDSL.mockResolvedValue({
        id: "root",
        type: "page",
        components: [
          null,
          undefined,
          { id: "form-1", type: "form", components: [] },
        ],
      });

      const dsl: Microsite = {
        code: "ms",
        version: 1,
        pages: [{ pageCode: "pg1", pageVersion: 1 }],
        firstPageCode: "pg1",
      };

      const result = await resolvePages(dsl);
      expect(result[0].components.some((c) => c.componentId === "form-1")).toBe(
        true,
      );
    });
  });

  describe("reconcileConfig", () => {
    const makeSavedConfig = () => ({
      micrositeSlug: "ms",
      version: 1,
      pages: [
        {
          pageCode: "page1",
          isVisible: false,
          isEditable: false,
          isDisabled: true,
          components: [
            {
              componentId: "comp1",
              isVisible: false,
              isEditable: false,
              isDisabled: true,
              components: [
                {
                  componentId: "child1",
                  isVisible: false,
                  isEditable: false,
                  isDisabled: false,
                },
              ],
            },
          ],
        },
      ],
    });

    const makeFreshConfig = () => ({
      micrositeSlug: "ms",
      version: 2,
      pages: [
        {
          pageCode: "page1",
          isVisible: true,
          isEditable: true,
          isDisabled: false,
          components: [
            {
              componentId: "comp1",
              isVisible: true,
              isEditable: true,
              isDisabled: false,
              components: [
                {
                  componentId: "child1",
                  isVisible: true,
                  isEditable: true,
                  isDisabled: false,
                },
              ],
            },
          ],
        },
      ],
    });

    it("should preserve saved config visibility settings for existing pages and components", () => {
      const saved = makeSavedConfig();
      const fresh = makeFreshConfig();
      const result = reconcileConfig(saved, fresh);

      expect(result.config.pages[0].isVisible).toBe(false);
      expect(result.config.pages[0].isEditable).toBe(false);
      expect(result.config.pages[0].isDisabled).toBe(true);
      expect(result.config.pages[0].components[0].isVisible).toBe(false);
      expect(result.config.pages[0].components[0].isEditable).toBe(false);
    });

    it("should add new components with default settings to newComponentIds", () => {
      const saved = makeSavedConfig();
      const fresh = {
        ...makeFreshConfig(),
        pages: [
          {
            ...makeFreshConfig().pages[0],
            components: [
              ...makeFreshConfig().pages[0].components,
              {
                componentId: "new-comp",
                isVisible: true,
                isEditable: true,
                isDisabled: false,
              },
            ],
          },
        ],
      };

      const result = reconcileConfig(saved, fresh);
      expect(result.newComponentIds).toContain("new-comp");
    });

    it("should count removed components from saved config", () => {
      const saved = makeSavedConfig();
      const fresh = {
        ...makeFreshConfig(),
        pages: [
          {
            pageCode: "page1",
            isVisible: true,
            isEditable: true,
            isDisabled: false,
            components: [],
          },
        ],
      };

      const result = reconcileConfig(saved, fresh);
      expect(result.removedComponentCount).toBeGreaterThan(0);
    });

    it("should add new pages to newPageCodes", () => {
      const saved = makeSavedConfig();
      const fresh = {
        ...makeFreshConfig(),
        pages: [
          ...makeFreshConfig().pages,
          {
            pageCode: "page2",
            isVisible: true,
            isEditable: true,
            isDisabled: false,
            components: [
              {
                componentId: "comp2",
                isVisible: true,
                isEditable: true,
                isDisabled: false,
              },
            ],
          },
        ],
      };

      const result = reconcileConfig(saved, fresh);
      expect(result.newPageCodes).toContain("page2");
      expect(result.newComponentIds).toContain("comp2");
    });

    it("should count removed pages", () => {
      const saved = {
        ...makeSavedConfig(),
        pages: [
          ...makeSavedConfig().pages,
          {
            pageCode: "old-page",
            isVisible: true,
            isEditable: true,
            isDisabled: false,
            components: [
              {
                componentId: "old-comp",
                isVisible: true,
                isEditable: true,
                isDisabled: false,
              },
            ],
          },
        ],
      };
      const fresh = makeFreshConfig();

      const result = reconcileConfig(saved, fresh);
      expect(result.removedPageCount).toBe(1);
    });

    it("should reconcile columns: preserve saved column settings for existing columns", () => {
      const saved = {
        micrositeSlug: "ms",
        version: 1,
        pages: [
          {
            pageCode: "page1",
            isVisible: true,
            isEditable: true,
            isDisabled: false,
            components: [
              {
                componentId: "table-1",
                isVisible: true,
                isEditable: true,
                isDisabled: false,
                columns: [
                  { columnId: "col1", isVisible: false, isDisabled: true },
                ],
              },
            ],
          },
        ],
      };

      const fresh = {
        micrositeSlug: "ms",
        version: 2,
        pages: [
          {
            pageCode: "page1",
            isVisible: true,
            isEditable: true,
            isDisabled: false,
            components: [
              {
                componentId: "table-1",
                isVisible: true,
                isEditable: true,
                isDisabled: false,
                columns: [
                  { columnId: "col1", isVisible: true, isDisabled: false },
                  { columnId: "col2", isVisible: true, isDisabled: false },
                ],
              },
            ],
          },
        ],
      };

      const result = reconcileConfig(saved, fresh);
      const mergedCols = result.config.pages[0].components[0].columns!;
      expect(mergedCols.find((c) => c.columnId === "col1")!.isVisible).toBe(
        false,
      );
      expect(mergedCols.find((c) => c.columnId === "col1")!.isDisabled).toBe(
        true,
      );
      expect(result.newComponentIds).toContain("col2");
    });

    it("should count removed columns in removedComponentCount", () => {
      const saved = {
        micrositeSlug: "ms",
        version: 1,
        pages: [
          {
            pageCode: "page1",
            isVisible: true,
            isEditable: true,
            isDisabled: false,
            components: [
              {
                componentId: "table-1",
                isVisible: true,
                isEditable: true,
                isDisabled: false,
                columns: [
                  { columnId: "col1", isVisible: true, isDisabled: false },
                  { columnId: "col2", isVisible: true, isDisabled: false },
                ],
              },
            ],
          },
        ],
      };

      const fresh = {
        micrositeSlug: "ms",
        version: 2,
        pages: [
          {
            pageCode: "page1",
            isVisible: true,
            isEditable: true,
            isDisabled: false,
            components: [
              {
                componentId: "table-1",
                isVisible: true,
                isEditable: true,
                isDisabled: false,
                columns: [
                  { columnId: "col1", isVisible: true, isDisabled: false },
                ],
              },
            ],
          },
        ],
      };

      const result = reconcileConfig(saved, fresh);
      expect(result.removedComponentCount).toBeGreaterThan(0);
    });

    it("should set defaults for new page components recursively", () => {
      const saved = { micrositeSlug: "ms", version: 1, pages: [] };
      const fresh = {
        micrositeSlug: "ms",
        version: 2,
        pages: [
          {
            pageCode: "new-page",
            isVisible: true,
            isEditable: true,
            isDisabled: false,
            components: [
              {
                componentId: "comp1",
                isVisible: false,
                isEditable: true,
                isDisabled: true,
                components: [
                  {
                    componentId: "child1",
                    isVisible: false,
                    isEditable: true,
                    isDisabled: true,
                  },
                ],
                columns: [
                  { columnId: "col1", isVisible: false, isDisabled: true },
                ],
              },
            ],
          },
        ],
      };

      const result = reconcileConfig(saved, fresh);
      const comp = result.config.pages[0].components[0];
      expect(comp.isVisible).toBe(true);
      expect(comp.isEditable).toBe(false);
      expect(comp.isDisabled).toBe(false);
      expect(comp.components![0].isVisible).toBe(true);
      expect(comp.columns![0].isVisible).toBe(true);
      expect(comp.columns![0].isDisabled).toBe(false);
    });

    it("should collect all descendant ids for new components", () => {
      const saved = { micrositeSlug: "ms", version: 1, pages: [] };
      const fresh = {
        micrositeSlug: "ms",
        version: 2,
        pages: [
          {
            pageCode: "new-page",
            isVisible: true,
            isEditable: true,
            isDisabled: false,
            components: [
              {
                componentId: "parent",
                isVisible: true,
                isEditable: true,
                isDisabled: false,
                components: [
                  {
                    componentId: "child",
                    isVisible: true,
                    isEditable: true,
                    isDisabled: false,
                  },
                ],
                columns: [
                  { columnId: "col1", isVisible: true, isDisabled: false },
                ],
              },
            ],
          },
        ],
      };

      const result = reconcileConfig(saved, fresh);
      expect(result.newComponentIds).toContain("parent");
      expect(result.newComponentIds).toContain("child");
      expect(result.newComponentIds).toContain("col1");
    });

    it("should count removed components that include descendants in saved but removed page", () => {
      const saved = {
        micrositeSlug: "ms",
        version: 1,
        pages: [
          {
            pageCode: "removed-page",
            isVisible: true,
            isEditable: true,
            isDisabled: false,
            components: [
              {
                componentId: "comp1",
                isVisible: true,
                isEditable: true,
                isDisabled: false,
                components: [
                  {
                    componentId: "child1",
                    isVisible: true,
                    isEditable: true,
                    isDisabled: false,
                  },
                ],
                columns: [
                  { columnId: "col1", isVisible: true, isDisabled: false },
                ],
              },
            ],
          },
        ],
      };
      const fresh = { micrositeSlug: "ms", version: 2, pages: [] };

      const result = reconcileConfig(saved, fresh);
      expect(result.removedPageCount).toBe(1);
      expect(result.removedComponentCount).toBeGreaterThan(0);
    });

    it("should count columns of removed components in reconcileComponents", () => {
      const saved = {
        micrositeSlug: "ms",
        version: 1,
        pages: [
          {
            pageCode: "page1",
            isVisible: true,
            isEditable: true,
            isDisabled: false,
            components: [
              {
                componentId: "table-comp",
                isVisible: true,
                isEditable: true,
                isDisabled: false,
                columns: [
                  { columnId: "col1", isVisible: true, isDisabled: false },
                  { columnId: "col2", isVisible: true, isDisabled: false },
                ],
              },
            ],
          },
        ],
      };
      const fresh = {
        micrositeSlug: "ms",
        version: 2,
        pages: [
          {
            pageCode: "page1",
            isVisible: true,
            isEditable: true,
            isDisabled: false,
            components: [],
          },
        ],
      };

      const result = reconcileConfig(saved, fresh);
      expect(result.removedComponentCount).toBeGreaterThanOrEqual(2);
    });

    it("should handle removed page with no components property (line 359 branch)", () => {
      const saved = {
        micrositeSlug: "ms",
        version: 1,
        pages: [
          {
            pageCode: "removed-page",
            isVisible: true,
            isEditable: true,
            isDisabled: false,
          } as unknown as {
            pageCode: string;
            isVisible: boolean;
            isEditable: boolean;
            isDisabled: boolean;
            components: never[];
          },
        ],
      };
      const fresh = { micrositeSlug: "ms", version: 2, pages: [] };

      const result = reconcileConfig(saved as never, fresh as never);
      expect(result.removedPageCount).toBe(1);
      expect(result.removedComponentCount).toBe(0);
    });

    it("should handle savedPage without components when freshPage has components (line 380 branch)", () => {
      const saved = {
        micrositeSlug: "ms",
        version: 1,
        pages: [
          {
            pageCode: "page1",
            isVisible: false,
            isEditable: false,
            isDisabled: true,
          } as unknown as {
            pageCode: string;
            isVisible: boolean;
            isEditable: boolean;
            isDisabled: boolean;
            components: never[];
          },
        ],
      };
      const fresh = {
        micrositeSlug: "ms",
        version: 2,
        pages: [
          {
            pageCode: "page1",
            isVisible: true,
            isEditable: true,
            isDisabled: false,
            components: [
              {
                componentId: "comp1",
                isVisible: true,
                isEditable: true,
                isDisabled: false,
              },
            ],
          },
        ],
      };

      const result = reconcileConfig(saved as never, fresh as never);
      expect(result.newComponentIds).toContain("comp1");
    });

    it("should handle savedComp without components when freshComp has components (line 263 branch)", () => {
      const saved = {
        micrositeSlug: "ms",
        version: 1,
        pages: [
          {
            pageCode: "page1",
            isVisible: false,
            isEditable: false,
            isDisabled: true,
            components: [
              {
                componentId: "comp1",
                isVisible: false,
                isEditable: false,
                isDisabled: true,
              },
            ],
          },
        ],
      };
      const fresh = {
        micrositeSlug: "ms",
        version: 2,
        pages: [
          {
            pageCode: "page1",
            isVisible: true,
            isEditable: true,
            isDisabled: false,
            components: [
              {
                componentId: "comp1",
                isVisible: true,
                isEditable: true,
                isDisabled: false,
                components: [
                  {
                    componentId: "child1",
                    isVisible: true,
                    isEditable: true,
                    isDisabled: false,
                  },
                ],
              },
            ],
          },
        ],
      };

      const result = reconcileConfig(saved as never, fresh as never);
      expect(result.newComponentIds).toContain("child1");
    });

    it("should handle savedComp without columns when freshComp has columns (line 273 branch)", () => {
      const saved = {
        micrositeSlug: "ms",
        version: 1,
        pages: [
          {
            pageCode: "page1",
            isVisible: false,
            isEditable: false,
            isDisabled: true,
            components: [
              {
                componentId: "table-1",
                isVisible: false,
                isEditable: false,
                isDisabled: true,
              },
            ],
          },
        ],
      };
      const fresh = {
        micrositeSlug: "ms",
        version: 2,
        pages: [
          {
            pageCode: "page1",
            isVisible: true,
            isEditable: true,
            isDisabled: false,
            components: [
              {
                componentId: "table-1",
                isVisible: true,
                isEditable: true,
                isDisabled: false,
                columns: [
                  { columnId: "col1", isVisible: true, isDisabled: false },
                ],
              },
            ],
          },
        ],
      };

      const result = reconcileConfig(saved as never, fresh as never);
      expect(result.newComponentIds).toContain("col1");
    });
  });
});
