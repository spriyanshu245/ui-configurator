"use client";
import {
  useState,
  useMemo,
  useCallback,
  useRef,
  MouseEvent as ReactMouseEvent,
  KeyboardEvent,
} from "react";
import { useUiSorting } from "@/app/hooks/useUiSorting";
import { useSearch } from "@/app/hooks/useSearch";
import { filterBySearch } from "@/app/utils/searchUtils";
import { useHeaderV2 } from "@/app/context/HeaderContextV2";
import { copyToClipboard } from "@/app/utils/utils";
import {
  DataListConfig,
  UseDataListReturn,
} from "@/app/components/DataList/types";

export const useDataList = <T, S extends string>(
  config: DataListConfig<T, S>,
): UseDataListReturn<T, S> => {
  const { setUserNotification } = useHeaderV2();
  const [data, setData] = useState<T[]>([]);
  const [{ loading, error }, setLoadState] = useState<{
    loading: boolean;
    error: string | null;
  }>({
    loading: true,
    error: null,
  });

  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const {
    searchValue,
    deferredSearchValue,
    isSearchOpen,
    isPending,
    hasSearchTerm,
    searchInputRef,
    searchContainerRef,
    handleSearchToggle,
    handleSearchChange,
    handleSearchKeyDown,
    clearSearch,
    focusSearchInput,
  } = useSearch();

  const searchedData = useMemo(() => {
    if (!hasSearchTerm) {
      return data;
    }
    return filterBySearch(data, deferredSearchValue, config.searchFields);
  }, [hasSearchTerm, data, deferredSearchValue, config.searchFields]);

  const getComparableValue = useCallback(
    (item: T, column: S): string | number => {
      return config.getComparableValue(item, column);
    },
    [config.getComparableValue],
  );

  const {
    sortedData: displayedData,
    handleSort,
    getSortDirection,
  } = useUiSorting<S, T>(searchedData, getComparableValue, config.defaultSort);

  const loadData = useCallback((fetcher: () => Promise<T[]>) => {
    let isMounted = true;
    const load = async () => {
      setLoadState({ loading: true, error: null });
      try {
        const result = await fetcher();
        if (isMounted) {
          setData(result ?? []);
          setLoadState({ loading: false, error: null });
        }
      } catch (e) {
        if (isMounted) {
          const message = e instanceof Error ? e.message : "Failed to load";
          setLoadState({ loading: false, error: message });
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const requestDelete = useCallback((key: string) => {
    setConfirmDeleteKey(key);
  }, []);

  const executeDelete = useCallback(
    async (deleteFn: (key: string) => Promise<void>) => {
      if (!confirmDeleteKey || deletingKey) return;
      const key = confirmDeleteKey;
      try {
        setDeletingKey(key);
        await deleteFn(key);
        setData((prev) =>
          prev.filter((item) => config.getItemKey(item) !== key),
        );
        setConfirmDeleteKey(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete";
        setUserNotification({ type: "error", text: message, time: 2500 });
      } finally {
        setDeletingKey((current) => (current === key ? null : current));
      }
    },
    [confirmDeleteKey, deletingKey, config.getItemKey, setUserNotification],
  );

  const cancelDelete = useCallback(() => {
    setConfirmDeleteKey(null);
  }, []);

  const deleteFnRef = useRef<((key: string) => Promise<void>) | null>(null);

  const setDeleteHandler = useCallback((fn: (key: string) => Promise<void>) => {
    deleteFnRef.current = fn;
  }, []);

  const handleConfirmDelete = useCallback(
    (e: ReactMouseEvent | KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (deleteFnRef.current) {
        executeDelete(deleteFnRef.current);
      }
    },
    [executeDelete],
  );

  const handleCancelDelete = useCallback(
    (e: ReactMouseEvent | KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      cancelDelete();
    },
    [cancelDelete],
  );

  const handleCopy = useCallback(
    async (e: ReactMouseEvent<HTMLButtonElement>, value: string) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        await copyToClipboard(value);
        setCopiedKey(value);
        globalThis.setTimeout(() => {
          setCopiedKey((current) => (current === value ? null : current));
        }, 2000);
        setUserNotification({
          type: "success",
          text: "Code copied to clipboard",
          time: 2000,
        });
      } catch {
        setUserNotification({
          type: "error",
          text: "Failed to copy code",
          time: 2000,
        });
      }
    },
    [setUserNotification],
  );

  const handleRowKeyDown = useCallback(
    (
      e: KeyboardEvent<HTMLTableRowElement>,
      item: T,
      onActivate: (item: T) => void,
    ) => {
      const isActivationKey = e.key === "Enter" || e.key === " ";
      if (isActivationKey) {
        e.preventDefault();
        onActivate(item);
      }
    },
    [],
  );

  return {
    data,
    setData,
    loading,
    error,
    displayedData,
    deletingKey,
    confirmDeleteKey,
    copiedKey,
    searchValue,
    isSearchOpen,
    isPending,
    hasSearchTerm,
    searchInputRef,
    searchContainerRef,
    handleSearchToggle,
    handleSearchChange,
    handleSearchKeyDown,
    clearSearch,
    focusSearchInput,
    handleSort,
    getSortDirection,
    requestDelete,
    executeDelete,
    cancelDelete,
    setDeleteHandler,
    handleConfirmDelete,
    handleCancelDelete,
    handleCopy,
    handleRowKeyDown,
    loadData,
  };
};
