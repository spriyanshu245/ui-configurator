import { renderHook, act } from "@testing-library/react";
import { useUiSorting } from "./useUiSorting";

interface TestData {
  id: number;
  name: string;
  age: number;
  active: boolean;
  category: string | null;
}

type TestColumn = "name" | "age" | "active" | "category";

describe("useUiSorting", () => {
  const mockData: TestData[] = [
    { id: 1, name: "Alice", age: 30, active: true, category: "A" },
    { id: 2, name: "Bob", age: 25, active: false, category: "B" },
    { id: 3, name: "Charlie", age: 35, active: true, category: null },
    { id: 4, name: "David", age: 25, active: false, category: "A" },
    { id: 5, name: "Eve", age: 28, active: true, category: "C" },
  ];

  const getComparableValue = (
    item: TestData,
    column: TestColumn
  ): string | number | boolean | null => {
    switch (column) {
      case "name":
        return item.name.toLowerCase();
      case "age":
        return item.age;
      case "active":
        return item.active;
      case "category":
        return item.category?.toLowerCase() ?? null;
      default:
        return "";
    }
  };

  it("initializes with default state", () => {
    const { result } = renderHook(() =>
      useUiSorting(mockData, getComparableValue)
    );

    expect(result.current.sortState.column).toBeNull();
    expect(result.current.sortState.direction).toBeNull();
    expect(result.current.sortedData).toEqual(mockData);
  });

  it("returns unsorted data when no sort is applied", () => {
    const { result } = renderHook(() =>
      useUiSorting(mockData, getComparableValue)
    );

    expect(result.current.sortedData).toEqual(mockData);
  });

  it("sorts data in ascending order by name on first click", () => {
    const { result } = renderHook(() =>
      useUiSorting(mockData, getComparableValue)
    );

    act(() => {
      result.current.handleSort("name");
    });

    expect(result.current.sortState.column).toBe("name");
    expect(result.current.sortState.direction).toBe("asc");
    expect(result.current.sortedData.map((item) => item.name)).toEqual([
      "Alice",
      "Bob",
      "Charlie",
      "David",
      "Eve",
    ]);
  });

  it("sorts data in descending order by name on second click", () => {
    const { result } = renderHook(() =>
      useUiSorting(mockData, getComparableValue)
    );

    act(() => {
      result.current.handleSort("name");
    });

    act(() => {
      result.current.handleSort("name");
    });

    expect(result.current.sortState.column).toBe("name");
    expect(result.current.sortState.direction).toBe("desc");
    expect(result.current.sortedData.map((item) => item.name)).toEqual([
      "Eve",
      "David",
      "Charlie",
      "Bob",
      "Alice",
    ]);
  });

  it("resets sorting on third click of same column", () => {
    const { result } = renderHook(() =>
      useUiSorting(mockData, getComparableValue)
    );

    act(() => {
      result.current.handleSort("name");
    });

    act(() => {
      result.current.handleSort("name");
    });

    act(() => {
      result.current.handleSort("name");
    });

    expect(result.current.sortState.column).toBeNull();
    expect(result.current.sortState.direction).toBeNull();
    expect(result.current.sortedData).toEqual(mockData);
  });

  it("resets previous column sort when clicking a different column", () => {
    const { result } = renderHook(() =>
      useUiSorting(mockData, getComparableValue)
    );

    act(() => {
      result.current.handleSort("name");
    });

    expect(result.current.sortState.column).toBe("name");
    expect(result.current.sortState.direction).toBe("asc");

    act(() => {
      result.current.handleSort("age");
    });

    expect(result.current.sortState.column).toBe("age");
    expect(result.current.sortState.direction).toBe("asc");
    expect(result.current.sortedData.map((item) => item.age)).toEqual([
      25, 25, 28, 30, 35,
    ]);
  });

  it("sorts numeric values correctly in ascending order", () => {
    const { result } = renderHook(() =>
      useUiSorting(mockData, getComparableValue)
    );

    act(() => {
      result.current.handleSort("age");
    });

    expect(result.current.sortedData.map((item) => item.age)).toEqual([
      25, 25, 28, 30, 35,
    ]);
  });

  it("sorts numeric values correctly in descending order", () => {
    const { result } = renderHook(() =>
      useUiSorting(mockData, getComparableValue)
    );

    act(() => {
      result.current.handleSort("age");
    });

    act(() => {
      result.current.handleSort("age");
    });

    expect(result.current.sortedData.map((item) => item.age)).toEqual([
      35, 30, 28, 25, 25,
    ]);
  });

  it("sorts boolean values correctly in ascending order", () => {
    const { result } = renderHook(() =>
      useUiSorting(mockData, getComparableValue)
    );

    act(() => {
      result.current.handleSort("active");
    });

    expect(result.current.sortedData.map((item) => item.active)).toEqual([
      false,
      false,
      true,
      true,
      true,
    ]);
  });

  it("sorts boolean values correctly in descending order", () => {
    const { result } = renderHook(() =>
      useUiSorting(mockData, getComparableValue)
    );

    act(() => {
      result.current.handleSort("active");
    });

    act(() => {
      result.current.handleSort("active");
    });

    expect(result.current.sortedData.map((item) => item.active)).toEqual([
      true,
      true,
      true,
      false,
      false,
    ]);
  });

  it("handles null values in sorting", () => {
    const { result } = renderHook(() =>
      useUiSorting(mockData, getComparableValue)
    );

    act(() => {
      result.current.handleSort("category");
    });

    const categories = result.current.sortedData.map((item) => item.category);
    expect(categories[0]).toBeNull();
    expect(categories.slice(1)).toEqual(["A", "A", "B", "C"]);
  });

  it("getSortDirection returns correct direction for active column", () => {
    const { result } = renderHook(() =>
      useUiSorting(mockData, getComparableValue)
    );

    expect(result.current.getSortDirection("name")).toBeNull();

    act(() => {
      result.current.handleSort("name");
    });

    expect(result.current.getSortDirection("name")).toBe("asc");

    act(() => {
      result.current.handleSort("name");
    });

    expect(result.current.getSortDirection("name")).toBe("desc");
  });

  it("getSortDirection returns null for inactive columns", () => {
    const { result } = renderHook(() =>
      useUiSorting(mockData, getComparableValue)
    );

    act(() => {
      result.current.handleSort("name");
    });

    expect(result.current.getSortDirection("name")).toBe("asc");
    expect(result.current.getSortDirection("age")).toBeNull();
    expect(result.current.getSortDirection("active")).toBeNull();
  });

  it("maintains sort when data changes", () => {
    const { result, rerender } = renderHook(
      ({ data }) => useUiSorting(data, getComparableValue),
      {
        initialProps: { data: mockData },
      }
    );

    act(() => {
      result.current.handleSort("name");
    });

    expect(result.current.sortState.direction).toBe("asc");

    const newData = [
      ...mockData,
      { id: 6, name: "Frank", age: 40, active: true, category: "D" },
    ];

    rerender({ data: newData });

    expect(result.current.sortState.direction).toBe("asc");
    expect(result.current.sortedData.map((item) => item.name)).toEqual([
      "Alice",
      "Bob",
      "Charlie",
      "David",
      "Eve",
      "Frank",
    ]);
  });

  it("handles empty data array", () => {
    const { result } = renderHook(() => useUiSorting([], getComparableValue));

    act(() => {
      result.current.handleSort("name");
    });

    expect(result.current.sortedData).toEqual([]);
    expect(result.current.sortState.column).toBe("name");
    expect(result.current.sortState.direction).toBe("asc");
  });

  it("handles single item data array", () => {
    const singleItem = [mockData[0]];
    const { result } = renderHook(() =>
      useUiSorting(singleItem, getComparableValue)
    );

    act(() => {
      result.current.handleSort("name");
    });

    expect(result.current.sortedData).toEqual(singleItem);
  });

  it("does not mutate original data array", () => {
    const originalData = [...mockData];
    const { result } = renderHook(() =>
      useUiSorting(mockData, getComparableValue)
    );

    act(() => {
      result.current.handleSort("name");
    });

    expect(mockData).toEqual(originalData);
  });

  it("handles undefined values in comparison", () => {
    const dataWithUndefined: TestData[] = [
      { id: 1, name: "Alice", age: 30, active: true, category: "A" },
      { id: 2, name: "Bob", age: 25, active: false, category: null },
    ];

    const getValueWithUndefined = (
      item: TestData,
      column: TestColumn
    ): string | number | boolean | null | undefined => {
      if (column === "category" && item.category === null) {
        return undefined;
      }
      return getComparableValue(item, column);
    };

    const { result } = renderHook(() =>
      useUiSorting(dataWithUndefined, getValueWithUndefined)
    );

    act(() => {
      result.current.handleSort("category");
    });

    expect(result.current.sortedData).toHaveLength(2);
  });

  it("sorts case-insensitively for strings", () => {
    const mixedCaseData: TestData[] = [
      { id: 1, name: "alice", age: 30, active: true, category: "A" },
      { id: 2, name: "ALICE", age: 25, active: false, category: "B" },
      { id: 3, name: "Bob", age: 35, active: true, category: "C" },
    ];

    const getCaseInsensitiveValue = (
      item: TestData,
      column: TestColumn
    ): string | number | boolean | null => {
      if (column === "name") {
        return item.name.toLowerCase();
      }
      return getComparableValue(item, column);
    };

    const { result } = renderHook(() =>
      useUiSorting(mixedCaseData, getCaseInsensitiveValue)
    );

    act(() => {
      result.current.handleSort("name");
    });

    const sortedNames = result.current.sortedData.map((item) =>
      item.name.toLowerCase()
    );
    expect(sortedNames).toEqual(["alice", "alice", "bob"]);
  });

  it("maintains stable sort for equal values", () => {
    const { result } = renderHook(() =>
      useUiSorting(mockData, getComparableValue)
    );

    act(() => {
      result.current.handleSort("age");
    });

    const sameAge = result.current.sortedData.filter((item) => item.age === 25);
    expect(sameAge.map((item) => item.id)).toEqual([2, 4]);
  });

  it("handles mixed type comparisons gracefully", () => {
    const mixedData = [
      { id: 1, name: "Alice", age: 30, active: true, category: "A" },
      { id: 2, name: "Bob", age: 25, active: false, category: null },
    ];

    const getMixedValue = (
      item: TestData,
      column: TestColumn
    ): string | number | boolean | null => {
      if (column === "category" && item.category === null) {
        return null;
      }
      return getComparableValue(item, column);
    };

    const { result } = renderHook(() => useUiSorting(mixedData, getMixedValue));

    act(() => {
      result.current.handleSort("category");
    });

    expect(result.current.sortedData).toHaveLength(2);
  });

  it("falls back to string comparison for non-standard types", () => {
    const dataWithMixedTypes: TestData[] = [
      { id: 1, name: "Alice", age: 30, active: true, category: "A" },
      { id: 2, name: "Bob", age: 25, active: false, category: "B" },
    ];

    const getMixedTypeValue = (item: TestData, column: TestColumn): unknown => {
      if (column === "category") {
        return { value: item.category } as unknown;
      }
      return getComparableValue(item, column);
    };

    const { result } = renderHook(() =>
      useUiSorting(
        dataWithMixedTypes,
        getMixedTypeValue as (
          item: TestData,
          column: TestColumn
        ) => string | number | boolean | null
      )
    );

    act(() => {
      result.current.handleSort("category");
    });

    expect(result.current.sortedData).toHaveLength(2);
  });

  it("initializes with custom initial sort state", () => {
    const { result } = renderHook(() =>
      useUiSorting(mockData, getComparableValue, {
        column: "name",
        direction: "asc",
      })
    );

    expect(result.current.sortState.column).toBe("name");
    expect(result.current.sortState.direction).toBe("asc");
    expect(result.current.sortedData.map((item) => item.name)).toEqual([
      "Alice",
      "Bob",
      "Charlie",
      "David",
      "Eve",
    ]);
  });

  it("initializes with descending sort state", () => {
    const { result } = renderHook(() =>
      useUiSorting(mockData, getComparableValue, {
        column: "age",
        direction: "desc",
      })
    );

    expect(result.current.sortState.column).toBe("age");
    expect(result.current.sortState.direction).toBe("desc");
    expect(result.current.sortedData.map((item) => item.age)).toEqual([
      35, 30, 28, 25, 25,
    ]);
  });

  it("can change sort after initializing with custom state", () => {
    const { result } = renderHook(() =>
      useUiSorting<TestColumn, TestData>(mockData, getComparableValue, {
        column: "name",
        direction: "asc",
      })
    );

    expect(result.current.sortState.column).toBe("name");

    act(() => {
      result.current.handleSort("age");
    });

    expect(result.current.sortState.column).toBe("age");
    expect(result.current.sortState.direction).toBe("asc");
  });
});
