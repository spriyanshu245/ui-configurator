import {
  hiddenBlockProperties,
  contentHiddenBlockTypes,
} from "@/app/template-designer/data/blockPropertiesMap";
import { DEFAULT_COLUMN_WIDTHS } from "@/app/template-designer/constants";

export const formatPropertyKey = (key: string): string => {
  return key
    .replaceAll(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

export const getHiddenProperties = (type: string): string[] => {
  return (hiddenBlockProperties[type] ?? []) as string[];
};

export const shouldShowContent = (type: string): boolean => {
  return !contentHiddenBlockTypes.has(type);
};

export const getDefaultColumnWidths = (count: number): number[] => {
  return (
    DEFAULT_COLUMN_WIDTHS[count] ??
    Array.from({ length: count }, () => Math.round(100 / count))
  );
};

export const calculateAdjustedColumnWidths = (
  columnWidths: number[],
  index: number,
  newValue: number
): number[] | null => {
  const newWidths = [...columnWidths];
  const oldValue = newWidths[index];
  const delta = newValue - oldValue;

  if (delta === 0) return null;

  const currentTotal = columnWidths.reduce((sum, w) => sum + w, 0);

  if (currentTotal === 100 && delta > 0) {
    const nextIndex = (index + 1) % newWidths.length;
    const reduction = Math.min(newWidths[nextIndex], delta);
    if (reduction > 0) {
      newWidths[index] = oldValue + reduction;
      newWidths[nextIndex] -= reduction;
    }
  } else {
    const othersTotal = columnWidths.reduce(
      (sum, w, i) => (i === index ? sum : sum + w),
      0
    );
    const maxAllowed = 100 - othersTotal;
    newWidths[index] = Math.min(newValue, maxAllowed);
  }

  if (newWidths[index] === oldValue) return null;

  return newWidths;
};
