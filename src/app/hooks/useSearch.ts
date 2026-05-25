"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useState,
  useDeferredValue,
  useRef,
  useCallback,
  useEffect,
  ChangeEvent,
  KeyboardEvent,
  RefObject,
} from "react";

interface UseSearchResult {
  searchValue: string;
  deferredSearchValue: string;
  isSearchOpen: boolean;
  isPending: boolean;
  hasSearchTerm: boolean;
  searchInputRef: RefObject<HTMLInputElement | null>;
  searchContainerRef: RefObject<HTMLDivElement | null>;
  handleSearchToggle: () => void;
  handleSearchChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleSearchKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  clearSearch: () => void;
  closeSearch: () => void;
  focusSearchInput: () => void;
}

const SEARCH_QUERY_PARAM = "q";
type SearchInputFocusMode = "select" | "cursor-end";

const getSearchQuery = (
  searchParams?: Pick<URLSearchParams, "get"> | null,
): string => {
  const value = searchParams?.get(SEARCH_QUERY_PARAM) ?? "";
  return value.trim().length > 0 ? value : "";
};

export const useSearch = (): UseSearchResult => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialQuery = getSearchQuery(searchParams);
  const [searchValue, setSearchValue] = useState(initialQuery);
  const [isSearchOpen, setIsSearchOpen] = useState(initialQuery !== "");
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const pendingUrlQueryRef = useRef<string | null>(null);
  const shouldSyncUrlRef = useRef(false);
  const focusModeRef = useRef<SearchInputFocusMode>(
    initialQuery !== "" ? "cursor-end" : "select",
  );
  const shouldSelectInputRef = useRef(initialQuery !== "");
  const deferredSearchValue = useDeferredValue(searchValue);
  const isPending = searchValue !== deferredSearchValue;

  const hasSearchTerm = searchValue.trim().length > 0;

  const requestSearchInputFocus = useCallback(
    (mode: SearchInputFocusMode = "select") => {
      focusModeRef.current = mode;
      shouldSelectInputRef.current = true;
    },
    [],
  );

  const focusAndSelectSearchInput = useCallback(() => {
    requestSearchInputFocus("select");
  }, [requestSearchInputFocus]);

  const focusSearchInputToEnd = useCallback(() => {
    requestSearchInputFocus("cursor-end");
  }, [requestSearchInputFocus]);

  useEffect(() => {
    if (!isSearchOpen || !shouldSelectInputRef.current) {
      return;
    }

    const focusTimer = window.setTimeout(() => {
      const input = searchInputRef.current;
      if (!input) {
        return;
      }

      input.focus();
      if (focusModeRef.current === "select") {
        input.select();
      } else {
        const cursorPosition = input.value.length;
        input.setSelectionRange(cursorPosition, cursorPosition);
      }
      shouldSelectInputRef.current = false;
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
    };
  }, [isSearchOpen, searchValue]);

  const clearSearch = useCallback(() => {
    shouldSyncUrlRef.current = true;
    setSearchValue("");
  }, []);

  const closeSearch = useCallback(() => {
    shouldSyncUrlRef.current = true;
    setIsSearchOpen(false);
    searchInputRef.current?.blur();
    setSearchValue("");
  }, []);

  const handleSearchToggle = useCallback(() => {
    if (isSearchOpen) {
      closeSearch();
    } else {
      focusAndSelectSearchInput();
      setIsSearchOpen(true);
    }
  }, [closeSearch, focusAndSelectSearchInput, isSearchOpen]);

  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.currentTarget;
      shouldSyncUrlRef.current = true;
      setSearchValue(value);
    },
    [],
  );

  const handleSearchKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();

        if (event.currentTarget.value.trim() !== "") {
          shouldSyncUrlRef.current = true;
          setSearchValue("");
          searchInputRef.current?.focus();
          return;
        }

        closeSearch();
      }
    },
    [closeSearch],
  );

  const focusSearchInput = useCallback(() => {
    searchInputRef.current?.focus();
    searchInputRef.current?.select();
  }, []);

  useEffect(() => {
    const currentQuery = getSearchQuery(searchParams);

    if (pendingUrlQueryRef.current !== null) {
      if (pendingUrlQueryRef.current === currentQuery) {
        pendingUrlQueryRef.current = null;
        shouldSyncUrlRef.current = false;
        return;
      }

      pendingUrlQueryRef.current = null;
    }

    shouldSyncUrlRef.current = false;

    if (currentQuery !== "") {
      setIsSearchOpen(true);
      focusSearchInputToEnd();
    }

    setSearchValue((currentValue) =>
      currentValue === currentQuery ? currentValue : currentQuery,
    );
  }, [focusSearchInputToEnd, searchParams]);

  useEffect(() => {
    if (!shouldSyncUrlRef.current) {
      return;
    }

    const currentQuery = getSearchQuery(searchParams);
    const nextQuery = hasSearchTerm ? searchValue : "";

    if (currentQuery === nextQuery) {
      shouldSyncUrlRef.current = false;
      if (pendingUrlQueryRef.current === currentQuery) {
        pendingUrlQueryRef.current = null;
      }
      return;
    }

    pendingUrlQueryRef.current = nextQuery;

    const nextSearchParams = new URLSearchParams(searchParams?.toString() ?? "");
    if (nextQuery) {
      nextSearchParams.set(SEARCH_QUERY_PARAM, nextQuery);
    } else {
      nextSearchParams.delete(SEARCH_QUERY_PARAM);
    }

    const nextUrl = nextSearchParams.toString()
      ? `${pathname}?${nextSearchParams.toString()}`
      : pathname;

    router.replace(nextUrl, { scroll: false });
  }, [hasSearchTerm, pathname, router, searchParams, searchValue]);

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      const container = searchContainerRef.current;
      const isInsideContainer = container?.contains(target ?? null) ?? false;
      const currentHasSearchTerm = searchInputRef.current?.value.trim() !== "";
      if (!isInsideContainer && !currentHasSearchTerm) {
        closeSearch();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isSearchOpen, closeSearch]);

  return {
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
    closeSearch,
    focusSearchInput,
  };
};
