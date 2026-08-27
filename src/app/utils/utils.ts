import { v4 as uuidv4 } from "uuid";
import { NameKeyId, UIComponent } from "../types/types";

export const appEnv = process.env.NODE_ENV;
export const convertHyphenSeparatedToPascalCase = (str: string): string => {
  if (!str) return "";
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
};

export const toPascalCase = (str: string): string => {
  return str
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[\s_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const resetGhostImage = () => {
  const ghostElRef = document.getElementById("ghostEl");
  if (ghostElRef) {
    document.body.removeChild(ghostElRef);
  }
};

export const getBuilderPaneElement = () => {
  const element = document.getElementById("builderPane");
  return element instanceof HTMLElement ? element : null;
};

export const getBuilderPaneScrollTop = () => {
  const builderPaneElement = getBuilderPaneElement();
  if (builderPaneElement) {
    return builderPaneElement.scrollTop;
  }

  return window.scrollY;
};

export const scrollBuilderPaneTo = (top: number) => {
  const builderPaneElement = getBuilderPaneElement();
  if (builderPaneElement) {
    builderPaneElement.scrollTo({ top, behavior: "auto" });
    return;
  }

  window.scrollTo({ top, behavior: "auto" });
};

export const scrollToTop = () => {
  scrollBuilderPaneTo(0);
};

export const generateRandomId = () => {
  return uuidv4();
};

export const deepClone = <T>(obj: T, visited = new WeakMap()): T => {
  if (obj === null || typeof obj !== "object") return obj;

  if (visited.has(obj)) {
    return visited.get(obj) as T;
  }

  if (Array.isArray(obj)) {
    const cloneArr = obj.map((item) =>
      deepClone(item, visited),
    ) as unknown as T;
    visited.set(obj, cloneArr);
    return cloneArr;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (obj instanceof Map) {
    const cloneMap = new Map(
      Array.from(obj.entries()).map(([key, value]) => [
        key,
        deepClone(value, visited),
      ]),
    ) as unknown as T;
    visited.set(obj, cloneMap);
    return cloneMap;
  }

  if (obj instanceof Set) {
    const cloneSet = new Set(
      Array.from(obj.values()).map((value) => deepClone(value, visited)),
    ) as unknown as T;
    visited.set(obj, cloneSet);
    return cloneSet;
  }

  if (typeof obj === "object") {
    const clonedObj: Record<string, any> = {};
    visited.set(obj, clonedObj);
    for (const key in obj as Record<string, any>) {
      if (Object.hasOwn(obj, key)) {
        clonedObj[key] = deepClone((obj as Record<string, any>)[key], visited);
      }
    }
    return clonedObj as T;
  }
  return obj;
};

export const keyFormat = (key: string) => {
  return key
    ?.trim()
    ?.split(",")
    .map((v: string) => v.trim())
    .join(",");
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);

  const getOrdinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const day = date.getDate();
  const suffix = getOrdinalSuffix(day);
  return date
    .toLocaleString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    .replace(/,/g, "")
    .replace(day.toString(), `${day}${suffix}`);
};

export const renderOptions = (options: string[]) =>
  options ? options.map((option) => ({ value: option, label: option })) : [];

export const renderNameKeyOptions = (options?: NameKeyId[]) =>
  options
    ? options.map((option) => ({ value: option.id, label: option.label }))
    : [];

export const getKeyValue = (obj: any, key: string) => {
  if (typeof obj !== "object" || obj === null) {
    return undefined;
  }
  if (obj.hasOwnProperty(key)) {
    return obj[key];
  }

  for (const k in obj) {
    if (obj.hasOwnProperty(k)) {
      const result: any = getKeyValue(obj[k], key);
      if (result !== undefined) {
        return result;
      }
    }
  }
  return undefined;
};

export const getDateFormats = (separator: string) => {
  if (!separator) separator = "/";
  return [
    `DD${separator}MM${separator}YYYY`,
    `MM${separator}DD${separator}YYYY`,
    `YYYY${separator}MM${separator}DD`,
  ];
};

export const getComponents = (component: any): any[] => {
  let components: any[] = [];
  if (!component || typeof component !== "object") {
    return components;
  }
  if (
    component?.properties?.name &&
    (component.type === "table" ||
      component.type === "data-grid" ||
      component.type === "form")
  ) {
    components.push(component.properties.name);
  }

  Object.keys(component).forEach((key) => {
    if (typeof component[key] === "object") {
      if (Array.isArray(component[key])) {
        component[key].forEach((item: any) => {
          components = components.concat(getComponents(item));
        });
      } else {
        components = components.concat(getComponents(component[key]));
      }
    }
  });

  return components.filter(Boolean);
};
interface TranverseAndReplaceProps {
  obj: Record<string, any>;
  idMap: Map<any, any>;
}
export const traverseAndReplace = ({
  obj,
  idMap,
}: TranverseAndReplaceProps): Record<string, any> => {
  if (typeof obj !== "object" || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => traverseAndReplace({ obj: item, idMap }));
  }

  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      if (key === "id" || key === "firstPageCode") {
        const originalId = String(obj[key]);
        if (!idMap.has(originalId)) {
          idMap.set(originalId, generateRandomId());
        }
        obj[key] = idMap.get(originalId);
      } else if (key !== "nameKeyIds") {
        obj[key] = traverseAndReplace({ obj: obj[key], idMap });
      }
    }
  }
  return obj;
};
export const replaceIdsInJson = (jsonData: Record<string, any>) => {
  const idMap = new Map();
  const clonedData = JSON.parse(JSON.stringify(jsonData));
  return traverseAndReplace({ obj: clonedData, idMap });
};

export const emptyGridRowElement = () => ({
  id: generateRandomId(),
  type: "input-grid-column",
  category: "component",
});

export const stripKeys = (
  obj: any,
  keysToRemove: string[],
  insideProperties = false,
): any => {
  if (Array.isArray(obj)) {
    return insideProperties
      ? obj
      : obj.map((item) => stripKeys(item, keysToRemove, insideProperties));
  } else if (obj && typeof obj === "object") {
    const cleaned: any = {};

    for (const key in obj) {
      if (keysToRemove.includes(key)) {
        continue;
      }

      const value = obj[key];

      if (key === "properties") {
        cleaned[key] = value;
      } else {
        cleaned[key] = stripKeys(value, keysToRemove, insideProperties);
      }
    }

    return cleaned;
  }

  return obj;
};

export const addCategoryRecursive = (
  component: UIComponent,
  category: "" | "component" | "form",
): UIComponent => {
  const clonedComponent: UIComponent = structuredClone(component);
  clonedComponent.category = category;
  if (clonedComponent.components) {
    clonedComponent.components = clonedComponent.components.map(
      (nestedComponent) => addCategoryRecursive(nestedComponent, category),
    );
  }
  return clonedComponent;
};

export const getSelectedOptions = (
  selectedValues: string[],
  options: NameKeyId[],
) => {
  const filtreredOptions: NameKeyId[] = [];
  selectedValues.forEach((selectedOption) => {
    if (!selectedOption?.startsWith("${") && options?.length) {
      const selected = options.find((option) => option.id == selectedOption);
      if (selected) {
        filtreredOptions.push(selected);
      }
    } else {
      filtreredOptions.push({
        id: selectedOption,
        label: selectedOption,
      });
    }
  });
  return filtreredOptions;
};

export const getNameKey = (nameKeyIds: NameKeyId[], name: string) => {
  return nameKeyIds.find((item) => item.id == name)?.label ?? name;
};

const requestManualCopy = (value: string): void => {
  const loweredAgent = navigator.userAgent.toLowerCase();
  const instruction = loweredAgent.includes("mac")
    ? "Press Command+C to copy the text below."
    : "Press Ctrl+C to copy the text below.";
  window.prompt(instruction, value);
};

export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {}

  const clipboard = navigator.clipboard;
  if (clipboard && typeof ClipboardItem !== "undefined" && clipboard.write) {
    try {
      const clipboardItem = new ClipboardItem({
        "text/plain": new Blob([text], { type: "text/plain" }),
      });
      await clipboard.write([clipboardItem]);
      return;
    } catch {}
  }

  requestManualCopy(text);
};

export const isNonEmpty = (value: string): boolean => value.trim().length > 0;

export const toCode = (value: string): string => {
  const lower = value.trim().toLowerCase();
  const hyphenated = lower.replace(/[^a-z0-9]+/g, "-");
  return hyphenated.replace(/^-+|-+$/g, "");
};

export const toEditableCode = (value: string): string => {
  const lower = value.toLowerCase();
  return lower
    .replace(/[^a-z0-9\s-]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/, "");
};

export const getBaseUrl = (prefix: string, env: string): string => {
  if (!prefix) return "";
  if (typeof window === "undefined") {
    throw new Error("window is not available");
  }

  const currentHost = window.location.hostname;

  const apiHost = currentHost.split(".");
  apiHost[0] = prefix;

  const protocol = window.location.protocol;

  return env === "development"
    ? `https://${prefix}.dev.rahi.cloud`
    : `${protocol}//${apiHost.join(".")}`;
};

export const getApiBaseUrl = () => {
  if (!globalThis.window) {
    return "https://api.rahi-dev.rahi.cloud";
  }

  const currentHost = globalThis.window.location.hostname;

  const apiHost = currentHost.split(".");
  apiHost[0] = "api";

  const protocol = globalThis.window.location.protocol;

  return appEnv === "development"
    ? "https://api.rahi-dev.rahi.cloud"
    : `${protocol}//${apiHost.join(".")}`;
};

export const reloadWindow = () => globalThis.location.reload();
export const closeWindow = () => window.close();
