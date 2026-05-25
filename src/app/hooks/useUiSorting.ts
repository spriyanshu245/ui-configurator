import { useState, useMemo, useCallback } from "react";
import { SortDirection } from "../types/types";



export interface SortState<T extends string> {
  column: T | null;
  direction: SortDirection;
}

export interface UseUiSortingReturn<T extends string, D> {
  sortState: SortState<T>;
  sortedData: D[];
  handleSort: (column: T) => void;
  getSortDirection: (column: T) => SortDirection;
}

export const useUiSorting = <T extends string, D>(
  data: D[],
  getComparableValue: (
    item: D,
    column: T
  ) => string | number | boolean | null | undefined,
  initialSortState?: SortState<T>
): UseUiSortingReturn<T, D> => {
  const [sortState, setSortState] = useState<SortState<T>>(
    initialSortState ?? {
      column: null,
      direction: null,
    }
  );

  const handleSort = useCallback((column: T) => {
    setSortState((prev) => {
      if (prev.column !== column) {
        return { column, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { column, direction: "desc" };
      }
      return { column: null, direction: null };
    });
  }, []);

  const getSortDirection = useCallback(
    (column: T): SortDirection => {
      if (sortState.column === column) {
        return sortState.direction;
      }
      return null;
    },
    [sortState]
  );

  const sortedData = useMemo(() => {
    if (!sortState.column || !sortState.direction) {
      return data;
    }

    const sorted = [...data].sort((a, b) => {
      const aValue = getComparableValue(a, sortState.column as T);
      const bValue = getComparableValue(b, sortState.column as T);

      const aComparable = aValue ?? "";
      const bComparable = bValue ?? "";

      let comparison = 0;
      if (typeof aComparable === "string" && typeof bComparable === "string") {
        comparison = aComparable.localeCompare(bComparable);
      } else if (
        typeof aComparable === "number" &&
        typeof bComparable === "number"
      ) {
        comparison = aComparable - bComparable;
      } else if (
        typeof aComparable === "boolean" &&
        typeof bComparable === "boolean"
      ) {
        if (aComparable !== bComparable) {
          comparison = aComparable ? 1 : -1;
        }
      } else {
        comparison = String(aComparable).localeCompare(String(bComparable));
      }

      return sortState.direction === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [data, sortState, getComparableValue]);

  return {
    sortState,
    sortedData,
    handleSort,
    getSortDirection,
  };
};
