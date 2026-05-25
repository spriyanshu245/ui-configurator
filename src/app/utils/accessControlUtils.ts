import { Microsite, BaseComponent } from "@/app/types/types";
import {
  AccessConfigComponent,
  AccessConfigPage,
  BaseConfig,
} from "@/app/types/accessControlConfig";
import { COLUMN_ACTIONS } from "./constants";
import { fetchPageDSL } from "@/app/services/microsite.service";

/* ================= FILTER ================= */

const ALLOWED_TYPES = new Set([
  "tabs",
  "tab",
  "cta",
  "cta-v2",
  "button-v2",
  "form",
  "table",
  "input-table",
]);

const shouldInclude = (c: BaseComponent) => ALLOWED_TYPES.has(c.type);

/* ================= COMPONENT CONVERSION ================= */

const convertComponent = (
  component: BaseComponent
): AccessConfigComponent[] => {
  if(!component) return []
  if (!shouldInclude(component)) {
    return component.components?.flatMap(convertComponent) ?? [];
  }

  const isReadOnly =
    (component.type === "table" || component.type === "input-table") &&
    !hasActionableColumns(component);

  return [
    {
      componentId: component.id,
      isVisible: true,
      isEditable: true,
      isDisabled: false,
      ...(isReadOnly && { isReadOnly: true }),
      components: component.components?.flatMap(convertComponent),
      columns: extractColumns(component),
    },
  ];
};

const extractColumns = (component: BaseComponent) => {
  const cols: any[] = [];

  if (component.type === "table") {
    component.properties?.tableColumns?.forEach((c: any) => {
      if (COLUMN_ACTIONS.includes(c.properties?.columnInputType)) {
        cols.push({ columnId: c.id, isVisible: true, isDisabled: false });
      }
    });
  }

  return cols.length ? cols : undefined;
};

const hasActionableColumns = (component: BaseComponent) => {
  return component.properties?.tableColumns?.some((c: any) =>
    COLUMN_ACTIONS.includes(c.properties?.columnInputType)
  );
};

/* ================= PAGE RESOLUTION ================= */

export const resolvePages = async (
  dsl: Microsite
): Promise<AccessConfigPage[]> => {
  return Promise.all(
    dsl.pages.map(async (page) => {
      const data = await fetchPageDSL(page.pageCode ?? "", page.pageVersion ?? 1);
      return {
        pageCode: page.pageCode ?? "",
        isVisible: true,
        isEditable: true,
        isDisabled: false,
        components: convertComponent(data)??[],
      };
    })
  );
};
export const convertDSLToBaseConfig = async <T extends BaseConfig>(
  dsl: Microsite,
  extra: Partial<T>
): Promise<T> => {
  const pages = await resolvePages(dsl);

  return {
    ...extra,
    micrositeSlug: dsl.code,
    version: dsl.version,
    pages,
  } as T;
};

export const mapComponent = (comp: {
  componentId: string;
  isVisible: boolean;
  isEditable: boolean;
  isDisabled: boolean;
  isDefault?: boolean;
  isReadOnly?: boolean;
  components?: unknown[];
  columns?: Array<{
    columnId: string;
    isVisible: boolean;
    isDisabled: boolean;
  }>;
}): AccessConfigComponent => {
  return {
    componentId: comp.componentId,
    isVisible: comp.isVisible,
    isEditable: comp.isEditable,
    isDisabled: comp.isDisabled,
    isDefault: comp.isDefault,
    isReadOnly: comp.isReadOnly,

    components: comp.components
      ? (comp.components as any[]).map(mapComponent)
      : undefined,

    columns: comp.columns?.map((col) => ({
      columnId: col.columnId,
      isVisible: col.isVisible,
      isDisabled: col.isDisabled,
    })),
  };
};

export const mapToBaseConfig = <T extends BaseConfig>(
  data: any,
  extra: Partial<T>
): T => {
  return {
    ...extra,
    micrositeSlug: data.micrositeSlug,
    version: data.version,
    pages: (data.pages ?? []).map((p: any) => ({
      pageCode: p.pageCode,
      isVisible: p.isVisible,
      isEditable: p.isEditable,
      isDisabled: p.isDisabled,
      components: p.components.map(mapComponent),
    })),
  } as T;
};

export const findComponentById = (
  components: BaseComponent[],
  id: string
): BaseComponent | null => {
  for (const component of components) {
    if (component.id === id) return component;
    if (component.components) {
      const found = findComponentById(component.components, id);
      if (found) return found;
    }
  }
  return null;
};

const reconcileColumns = (
  savedColumns: Array<{
    columnId: string;
    isVisible: boolean;
    isDisabled: boolean;
  }>,
  freshColumns: Array<{
    columnId: string;
    isVisible: boolean;
    isDisabled: boolean;
  }>,
  newComponentIds: string[]
): {
  merged: Array<{ columnId: string; isVisible: boolean; isDisabled: boolean }>;
  removedCount: number;
} => {
  const savedMap = new Map(savedColumns.map((col) => [col.columnId, col]));

  const freshColumnIds = new Set(freshColumns.map((col) => col.columnId));

  let removedCount = 0;
  savedColumns.forEach((col) => {
    if (!freshColumnIds.has(col.columnId)) {
      removedCount++;
    }
  });

  const merged = freshColumns.map((freshCol) => {
    const savedCol = savedMap.get(freshCol.columnId);
    if (savedCol) {
      return {
        columnId: freshCol.columnId,
        isVisible: savedCol.isVisible,
        isDisabled: savedCol.isDisabled,
      };
    }
    newComponentIds.push(freshCol.columnId);
    return {
      columnId: freshCol.columnId,
      isVisible: false,
      isDisabled: false,
    };
  });

  return { merged, removedCount };
};

const reconcileComponents = (
  savedComponents: AccessConfigComponent[],
  freshComponents: AccessConfigComponent[],
  newComponentIds: string[]
): {
  merged: AccessConfigComponent[];
  removedCount: number;
} => {
  const savedMap = new Map(
    savedComponents.map((comp) => [comp.componentId, comp])
  );

  const freshIds = new Set(freshComponents.map((comp) => comp.componentId));

  let removedCount = 0;
  savedComponents.forEach((comp) => {
    if (!freshIds.has(comp.componentId)) {
      removedCount++;
      if (comp.components) {
        removedCount += countAllDescendants(comp.components);
      }
      if (comp.columns) {
        removedCount += comp.columns.length;
      }
    }
  });

  const merged = freshComponents.map((freshComp) => {
    const savedComp = savedMap.get(freshComp.componentId);
    if (!savedComp) {
      newComponentIds.push(freshComp.componentId);
      collectAllDescendantIds(freshComp, newComponentIds);
      return setNewComponentDefaults(freshComp);
    }

    const result: AccessConfigComponent = {
      componentId: freshComp.componentId,
      isVisible: savedComp.isVisible,
      isEditable: savedComp.isEditable,
      isDisabled: savedComp.isDisabled,
      isDefault: savedComp.isDefault,
      isReadOnly: freshComp.isReadOnly,
    };

    if (freshComp.components) {
      const childResult = reconcileComponents(
        savedComp.components ?? [],
        freshComp.components,
        newComponentIds
      );
      result.components = childResult.merged;
      removedCount += childResult.removedCount;
    }

    if (freshComp.columns) {
      const colResult = reconcileColumns(
        savedComp.columns ?? [],
        freshComp.columns,
        newComponentIds
      );
      result.columns = colResult.merged;
      removedCount += colResult.removedCount;
    }

    return result;
  });

  return { merged, removedCount };
};

const countAllDescendants = (components: AccessConfigComponent[]): number => {
  let count = 0;
  components.forEach((comp) => {
    count++;
    if (comp.components) {
      count += countAllDescendants(comp.components);
    }
    if (comp.columns) {
      count += comp.columns.length;
    }
  });
  return count;
};

const collectAllDescendantIds = (
  component: AccessConfigComponent,
  ids: string[]
): void => {
  if (component.components) {
    component.components.forEach((child) => {
      ids.push(child.componentId);
      collectAllDescendantIds(child, ids);
    });
  }
  if (component.columns) {
    component.columns.forEach((col) => {
      ids.push(col.columnId);
    });
  }
};

const setNewComponentDefaults = (
  comp: AccessConfigComponent
): AccessConfigComponent => {
  const result: AccessConfigComponent = {
    ...comp,
    isVisible: true,
    isEditable: false,
    isDisabled: false,
  };
  if (comp.components) {
    result.components = comp.components.map(setNewComponentDefaults);
  }
  if (comp.columns) {
    result.columns = comp.columns.map((col) => ({
      ...col,
      isVisible: true,
      isDisabled: false,
    }));
  }
  return result;
};

export const reconcileConfig = <T extends BaseConfig>(
  savedConfig: T,
  freshConfig: T
) => {
  const newComponentIds: string[] = [];
  let removedComponentCount = 0;

  const savedPageMap = new Map(
    savedConfig.pages.map((page) => [page.pageCode, page])
  );

  const freshPageCodes = new Set(freshConfig.pages.map((p) => p.pageCode));

  const newPageCodes: string[] = [];
  let removedPageCount = 0;

  savedConfig.pages.forEach((page) => {
    if (!freshPageCodes.has(page.pageCode)) {
      removedPageCount++;
      removedComponentCount += page.components
        ? countAllDescendants(page.components) + page.components.length
        : 0;
    }
  });

  const mergedPages: AccessConfigPage[] = freshConfig.pages.map((freshPage) => {
    const savedPage = savedPageMap.get(freshPage.pageCode);
    if (!savedPage) {
      newPageCodes.push(freshPage.pageCode);
      freshPage.components.forEach((comp) => {
        newComponentIds.push(comp.componentId);
        collectAllDescendantIds(comp, newComponentIds);
      });
      return {
        ...freshPage,
        components: freshPage.components.map(setNewComponentDefaults),
      };
    }

    const compResult = reconcileComponents(
      savedPage.components ?? [],
      freshPage.components,
      newComponentIds
    );
    removedComponentCount += compResult.removedCount;

    return {
      pageCode: freshPage.pageCode,
      isVisible: savedPage.isVisible,
      isEditable: savedPage.isEditable,
      isDisabled: savedPage.isDisabled,
      components: compResult.merged,
    };
  });

  return {
    config: {
      ...savedConfig,
      pages: mergedPages,
    },
    newComponentIds,
    removedComponentCount,
    newPageCodes,
    removedPageCount,
  };
};
