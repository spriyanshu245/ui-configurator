import { renderHook, act, waitFor } from "@testing-library/react";
import { useDataList } from "./useDataList";
import { DataListConfig } from "@/app/components/DataList/types";

const mockReplace = jest.fn();
let mockPathname = "/mock-path";
let mockSearchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

const mockSetUserNotification = jest.fn();
jest.mock("@/app/context/HeaderContextV2", () => ({
  useHeaderV2: () => ({
    setUserNotification: mockSetUserNotification,
  }),
}));

jest.mock("@/app/utils/utils", () => ({
  copyToClipboard: jest.fn().mockResolvedValue(undefined),
}));

interface TestItem {
  id: string;
  name: string;
}

type TestSortColumn = "name";

const createSearchChangeEvent = (value: string) =>
  ({
    currentTarget: { value },
  }) as React.ChangeEvent<HTMLInputElement>;

const config: DataListConfig<TestItem, TestSortColumn> = {
  searchFields: [
    {
      getValue: (item) => (item as TestItem).name ?? "",
      priority: "primary" as const,
    },
  ],
  tiebreakers: [(item: TestItem) => item.name.toLowerCase()],
  defaultSort: { column: "name", direction: "asc" },
  getComparableValue: (item, column) => {
    if (column === "name") return item.name.toLowerCase();
    return "";
  },
  getItemKey: (item) => item.id,
};

const MOCK_DATA: TestItem[] = [
  { id: "1", name: "Alpha" },
  { id: "2", name: "Beta" },
  { id: "3", name: "Charlie" },
];

describe("useDataList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockPathname = "/mock-path";
    mockSearchParams = new URLSearchParams();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("starts with loading true and empty data", () => {
    const { result } = renderHook(() => useDataList(config));
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual([]);
  });

  it("loads data via loadData", async () => {
    const fetcher = jest.fn().mockResolvedValue(MOCK_DATA);
    const { result } = renderHook(() => useDataList(config));

    act(() => {
      result.current.loadData(fetcher);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(MOCK_DATA);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("handles loadData error", async () => {
    const fetcher = jest.fn().mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useDataList(config));

    act(() => {
      result.current.loadData(fetcher);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.data).toEqual([]);
  });

  it("handles loadData with non-Error exception", async () => {
    const fetcher = jest.fn().mockRejectedValue("string error");
    const { result } = renderHook(() => useDataList(config));

    act(() => {
      result.current.loadData(fetcher);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Failed to load");
  });

  it("returns displayedData sorted by default sort", async () => {
    const fetcher = jest.fn().mockResolvedValue(MOCK_DATA);
    const { result } = renderHook(() => useDataList(config));

    act(() => {
      result.current.loadData(fetcher);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.displayedData[0].name).toBe("Alpha");
    expect(result.current.displayedData[1].name).toBe("Beta");
    expect(result.current.displayedData[2].name).toBe("Charlie");
  });

  it("filters search results while preserving the configured column sort", async () => {
    const descendingConfig: DataListConfig<TestItem, TestSortColumn> = {
      ...config,
      defaultSort: { column: "name", direction: "desc" },
    };
    const fetcher = jest.fn().mockResolvedValue([
      { id: "1", name: "Zulu" },
      { id: "2", name: "Alpha" },
      { id: "3", name: "Beta" },
    ]);
    const { result } = renderHook(() => useDataList(descendingConfig));

    act(() => {
      result.current.loadData(fetcher);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.handleSearchChange(createSearchChangeEvent("a"));
    });

    await waitFor(() => {
      expect(result.current.displayedData.map((item) => item.name)).toEqual([
        "Beta",
        "Alpha",
      ]);
    });
  });

  it("restores the full dataset when clearing search", async () => {
    const fetcher = jest.fn().mockResolvedValue(MOCK_DATA);
    const { result } = renderHook(() => useDataList(config));

    act(() => {
      result.current.loadData(fetcher);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.handleSearchChange(createSearchChangeEvent("be"));
    });

    await waitFor(() => {
      expect(result.current.displayedData.map((item) => item.name)).toEqual([
        "Beta",
      ]);
    });

    act(() => {
      result.current.clearSearch();
    });

    await waitFor(() => {
      expect(result.current.searchValue).toBe("");
      expect(result.current.displayedData.map((item) => item.name)).toEqual([
        "Alpha",
        "Beta",
        "Charlie",
      ]);
    });
  });

  it("requestDelete sets confirmDeleteKey", async () => {
    const fetcher = jest.fn().mockResolvedValue(MOCK_DATA);
    const { result } = renderHook(() => useDataList(config));

    act(() => {
      result.current.loadData(fetcher);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.requestDelete("1");
    });

    expect(result.current.confirmDeleteKey).toBe("1");
  });

  it("cancelDelete clears confirmDeleteKey", async () => {
    const { result } = renderHook(() => useDataList(config));

    act(() => {
      result.current.requestDelete("1");
    });

    expect(result.current.confirmDeleteKey).toBe("1");

    act(() => {
      result.current.cancelDelete();
    });

    expect(result.current.confirmDeleteKey).toBeNull();
  });

  it("executeDelete removes item and clears confirmDeleteKey", async () => {
    const fetcher = jest.fn().mockResolvedValue(MOCK_DATA);
    const deleteFn = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useDataList(config));

    act(() => {
      result.current.loadData(fetcher);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.requestDelete("2");
    });

    await act(async () => {
      await result.current.executeDelete(deleteFn);
    });

    expect(deleteFn).toHaveBeenCalledWith("2");
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data.find((d) => d.id === "2")).toBeUndefined();
    expect(result.current.confirmDeleteKey).toBeNull();
  });

  it("executeDelete does nothing without confirmDeleteKey", async () => {
    const deleteFn = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useDataList(config));

    await act(async () => {
      await result.current.executeDelete(deleteFn);
    });

    expect(deleteFn).not.toHaveBeenCalled();
  });

  it("executeDelete shows error notification on failure", async () => {
    const fetcher = jest.fn().mockResolvedValue(MOCK_DATA);
    const deleteFn = jest.fn().mockRejectedValue(new Error("Delete failed"));
    const { result } = renderHook(() => useDataList(config));

    act(() => {
      result.current.loadData(fetcher);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.requestDelete("1");
    });

    await act(async () => {
      await result.current.executeDelete(deleteFn);
    });

    expect(mockSetUserNotification).toHaveBeenCalledWith({
      type: "error",
      text: "Delete failed",
      time: 2500,
    });
  });

  it("handleCopy copies value and shows notification", async () => {
    const { result } = renderHook(() => useDataList(config));
    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    } as unknown as React.MouseEvent<HTMLButtonElement>;

    await act(async () => {
      await result.current.handleCopy(mockEvent, "test-code");
    });

    expect(result.current.copiedKey).toBe("test-code");
    expect(mockSetUserNotification).toHaveBeenCalledWith({
      type: "success",
      text: "Code copied to clipboard",
      time: 2000,
    });
  });

  it("handleRowKeyDown calls onActivate for Enter key", () => {
    const { result } = renderHook(() => useDataList(config));
    const onActivate = jest.fn();
    const item: TestItem = { id: "1", name: "Test" };
    const event = {
      key: "Enter",
      preventDefault: jest.fn(),
    } as unknown as React.KeyboardEvent<HTMLTableRowElement>;

    act(() => {
      result.current.handleRowKeyDown(event, item, onActivate);
    });

    expect(onActivate).toHaveBeenCalledWith(item);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it("handleRowKeyDown calls onActivate for Space key", () => {
    const { result } = renderHook(() => useDataList(config));
    const onActivate = jest.fn();
    const item: TestItem = { id: "1", name: "Test" };
    const event = {
      key: " ",
      preventDefault: jest.fn(),
    } as unknown as React.KeyboardEvent<HTMLTableRowElement>;

    act(() => {
      result.current.handleRowKeyDown(event, item, onActivate);
    });

    expect(onActivate).toHaveBeenCalledWith(item);
  });

  it("handleRowKeyDown does not call onActivate for other keys", () => {
    const { result } = renderHook(() => useDataList(config));
    const onActivate = jest.fn();
    const item: TestItem = { id: "1", name: "Test" };
    const event = {
      key: "Tab",
      preventDefault: jest.fn(),
    } as unknown as React.KeyboardEvent<HTMLTableRowElement>;

    act(() => {
      result.current.handleRowKeyDown(event, item, onActivate);
    });

    expect(onActivate).not.toHaveBeenCalled();
  });

  it("setData allows direct data manipulation", async () => {
    const fetcher = jest.fn().mockResolvedValue(MOCK_DATA);
    const { result } = renderHook(() => useDataList(config));

    act(() => {
      result.current.loadData(fetcher);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setData([{ id: "99", name: "Custom" }]);
    });

    expect(result.current.data).toEqual([{ id: "99", name: "Custom" }]);
  });

  it("loadData returns a cleanup function", () => {
    const fetcher = jest.fn().mockResolvedValue(MOCK_DATA);
    const { result } = renderHook(() => useDataList(config));

    let cleanup: (() => void) | undefined;
    act(() => {
      cleanup = result.current.loadData(fetcher);
    });

    expect(typeof cleanup).toBe("function");
  });

  it("loadData handles null response", async () => {
    const fetcher = jest.fn().mockResolvedValue(null);
    const { result } = renderHook(() => useDataList(config));

    act(() => {
      result.current.loadData(fetcher);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
  });
});
