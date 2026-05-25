"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
} from "react";

import {
  PageComponentLocationState,
  PageHistoryEntry,
  PageLocationSnapshot,
} from "../types/types";
import {
  clonePageLocationSnapshot,
  createDefaultPageLocationSnapshot,
  createPageLocationSnapshot,
  hasSamePageLocationKeys,
} from "../utils/controlPanelUtils";

interface PendingPageLocationState {
  pageCode: string;
  location: PageLocationSnapshot;
}

interface ControlPanelContextType {
  showDropZones: boolean;
  toggleShowDropZones: () => void;
  isAutoSave: boolean;
  toggleAutoSave: () => void;
  isAutoSaveInProgress: boolean;
  setIsAutoSaveInProgress: (value: boolean) => void;
  isSaveSuccessful: boolean;
  setIsSaveSuccessful: (value: boolean) => void;
  setPageHistoryScope: (scopeKey: string) => void;
  clearPageHistory: () => void;
  syncPageHistory: (pageCodes: string[]) => void;
  seedPageHistory: (pageCode: string) => void;
  pushPageHistory: (currentPageCode: string, nextPageCode: string) => void;
  canNavigatePageBack: boolean;
  canNavigatePageForward: boolean;
  goBackPageHistory: (currentPageCode: string) => string | null;
  goForwardPageHistory: (currentPageCode: string) => string | null;
  setPageComponentLocation: (
    pageCode: string,
    componentId: string,
    location: PageComponentLocationState,
  ) => void;
  getPendingPageLocationSnapshot: (
    pageCode: string,
  ) => PageLocationSnapshot | null;
}

const ControlPanelContext = createContext<ControlPanelContextType | undefined>(
  undefined,
);

interface ControlPanelProviderProps {
  children: ReactNode;
}

export const ControlPanelProvider: React.FC<ControlPanelProviderProps> = ({
  children,
}) => {
  const [showDropZones, setShowDropZones] = useState(true);
  const [isAutoSave, setIsAutoSave] = useState(false);
  const [isAutoSaveInProgress, setIsAutoSaveInProgress] = useState(false);
  const [isSaveSuccessful, setIsSaveSuccessful] = useState(false);
  const [pageHistoryScopeKey, setPageHistoryScopeKey] = useState("");
  const [pageHistory, setPageHistory] = useState<PageHistoryEntry[]>([]);
  const [pageHistoryCursor, setPageHistoryCursor] = useState(-1);
  const [pageComponentLocations, setPageComponentLocations] = useState<
    Record<string, Record<string, PageComponentLocationState>>
  >({});
  const [pendingPageLocation, setPendingPageLocation] =
    useState<PendingPageLocationState | null>(null);

  const toggleShowDropZones = () => {
    setShowDropZones((prev) => !prev);
  };

  const toggleAutoSave = () => {
    setIsAutoSave((prev) => !prev);
  };

  const clearPageHistory = useCallback(() => {
    setPageHistory([]);
    setPageHistoryCursor(-1);
    setPageComponentLocations({});
    setPendingPageLocation(null);
  }, []);

  const setPageHistoryScope = useCallback(
    (scopeKey: string) => {
      if (!scopeKey || scopeKey === pageHistoryScopeKey) {
        return;
      }

      setPageHistoryScopeKey(scopeKey);
      clearPageHistory();
    },
    [clearPageHistory, pageHistoryScopeKey],
  );

  const setPageComponentLocation = useCallback(
    (
      pageCode: string,
      componentId: string,
      location: PageComponentLocationState,
    ) => {
      if (!pageCode || !componentId) {
        return;
      }

      setPageComponentLocations((prev) => ({
        ...prev,
        [pageCode]: {
          ...(prev[pageCode] ?? {}),
          [componentId]: {
            ...(prev[pageCode]?.[componentId] ?? {}),
            ...location,
          },
        },
      }));
    },
    [],
  );

  const syncPageHistory = useCallback(
    (pageCodes: string[]) => {
      const validPageCodes = new Set(pageCodes.filter(Boolean));
      const nextPageHistory = pageHistory.filter((entry) =>
        validPageCodes.has(entry.pageCode),
      );
      const currentPageCode = pageHistory[pageHistoryCursor]?.pageCode ?? "";
      const nextCursor = nextPageHistory.length
        ? nextPageHistory.findIndex(
            (entry) => entry.pageCode === currentPageCode,
          )
        : -1;
      const resolvedCursor =
        nextCursor === -1 ? nextPageHistory.length - 1 : nextCursor;

      if (
        nextPageHistory.length !== pageHistory.length ||
        resolvedCursor !== pageHistoryCursor
      ) {
        setPageHistory(nextPageHistory);
        setPageHistoryCursor(resolvedCursor);
      }

      setPageComponentLocations((prev) => {
        const nextComponentLocations = Object.fromEntries(
          Object.entries(prev).filter(([pageCode]) =>
            validPageCodes.has(pageCode),
          ),
        );

        return hasSamePageLocationKeys(prev, nextComponentLocations)
          ? prev
          : nextComponentLocations;
      });

      if (
        pendingPageLocation &&
        !validPageCodes.has(pendingPageLocation.pageCode)
      ) {
        setPendingPageLocation(null);
      }
    },
    [pageHistory, pageHistoryCursor, pendingPageLocation],
  );

  const seedPageHistory = useCallback(
    (pageCode: string) => {
      if (!pageCode) {
        return;
      }

      const currentEntry = pageHistory[pageHistoryCursor];
      if (!currentEntry) {
        const nextEntry: PageHistoryEntry = {
          pageCode,
          location: createDefaultPageLocationSnapshot(),
        };
        setPageHistory([nextEntry]);
        setPageHistoryCursor(0);
        setPendingPageLocation({
          pageCode,
          location: clonePageLocationSnapshot(nextEntry.location),
        });
        return;
      }

      if (currentEntry.pageCode === pageCode) {
        return;
      }

      const nextEntry: PageHistoryEntry = {
        pageCode,
        location: createDefaultPageLocationSnapshot(),
      };
      const nextPageHistory = [
        ...pageHistory.slice(0, pageHistoryCursor + 1),
        nextEntry,
      ];
      setPageHistory(nextPageHistory);
      setPageHistoryCursor(nextPageHistory.length - 1);
      setPendingPageLocation({
        pageCode,
        location: clonePageLocationSnapshot(nextEntry.location),
      });
    },
    [pageHistory, pageHistoryCursor],
  );

  const pushPageHistory = useCallback(
    (currentPageCode: string, nextPageCode: string) => {
      if (!nextPageCode || currentPageCode === nextPageCode) {
        return;
      }

      const nextPageHistory = [...pageHistory.slice(0, pageHistoryCursor + 1)];
      const currentEntry = nextPageHistory[pageHistoryCursor];

      if (currentEntry && currentEntry.pageCode === currentPageCode) {
        nextPageHistory[pageHistoryCursor] = {
          ...currentEntry,
          location: createPageLocationSnapshot(
            currentPageCode,
            pageComponentLocations,
          ),
        };
      }

      const nextEntry: PageHistoryEntry = {
        pageCode: nextPageCode,
        location: createDefaultPageLocationSnapshot(),
      };

      nextPageHistory.push(nextEntry);
      setPageHistory(nextPageHistory);
      setPageHistoryCursor(nextPageHistory.length - 1);
      setPendingPageLocation({
        pageCode: nextPageCode,
        location: clonePageLocationSnapshot(nextEntry.location),
      });
    },
    [pageComponentLocations, pageHistory, pageHistoryCursor],
  );

  const goBackPageHistory = useCallback(
    (currentPageCode: string) => {
      if (pageHistoryCursor <= 0) {
        return null;
      }

      const nextPageHistory = [...pageHistory];
      const currentEntry = nextPageHistory[pageHistoryCursor];

      if (currentEntry && currentEntry.pageCode === currentPageCode) {
        nextPageHistory[pageHistoryCursor] = {
          ...currentEntry,
          location: createPageLocationSnapshot(
            currentPageCode,
            pageComponentLocations,
          ),
        };
      }

      const nextCursor = pageHistoryCursor - 1;
      const targetEntry = nextPageHistory[nextCursor];

      setPageHistory(nextPageHistory);
      setPageHistoryCursor(nextCursor);
      setPendingPageLocation({
        pageCode: targetEntry.pageCode,
        location: clonePageLocationSnapshot(targetEntry.location),
      });

      return targetEntry.pageCode;
    },
    [pageComponentLocations, pageHistory, pageHistoryCursor],
  );

  const goForwardPageHistory = useCallback(
    (currentPageCode: string) => {
      if (
        pageHistoryCursor < 0 ||
        pageHistoryCursor >= pageHistory.length - 1
      ) {
        return null;
      }

      const nextPageHistory = [...pageHistory];
      const currentEntry = nextPageHistory[pageHistoryCursor];

      if (currentEntry && currentEntry.pageCode === currentPageCode) {
        nextPageHistory[pageHistoryCursor] = {
          ...currentEntry,
          location: createPageLocationSnapshot(
            currentPageCode,
            pageComponentLocations,
          ),
        };
      }

      const nextCursor = pageHistoryCursor + 1;
      const targetEntry = nextPageHistory[nextCursor];

      setPageHistory(nextPageHistory);
      setPageHistoryCursor(nextCursor);
      setPendingPageLocation({
        pageCode: targetEntry.pageCode,
        location: clonePageLocationSnapshot(targetEntry.location),
      });

      return targetEntry.pageCode;
    },
    [pageComponentLocations, pageHistory, pageHistoryCursor],
  );

  const getPendingPageLocationSnapshot = useCallback(
    (pageCode: string) => {
      if (!pendingPageLocation || pendingPageLocation.pageCode !== pageCode) {
        return null;
      }

      return pendingPageLocation.location;
    },
    [pendingPageLocation],
  );

  const canNavigatePageBack = pageHistoryCursor > 0;
  const canNavigatePageForward =
    pageHistoryCursor >= 0 && pageHistoryCursor < pageHistory.length - 1;

  const value = React.useMemo(
    () => ({
      showDropZones,
      toggleShowDropZones,
      isAutoSave,
      toggleAutoSave,
      isAutoSaveInProgress,
      setIsAutoSaveInProgress,
      isSaveSuccessful,
      setIsSaveSuccessful,
      setPageHistoryScope,
      clearPageHistory,
      syncPageHistory,
      seedPageHistory,
      pushPageHistory,
      canNavigatePageBack,
      canNavigatePageForward,
      goBackPageHistory,
      goForwardPageHistory,
      setPageComponentLocation,
      getPendingPageLocationSnapshot,
    }),
    [
      showDropZones,
      isAutoSave,
      isAutoSaveInProgress,
      isSaveSuccessful,
      setPageHistoryScope,
      clearPageHistory,
      syncPageHistory,
      seedPageHistory,
      pushPageHistory,
      canNavigatePageBack,
      canNavigatePageForward,
      goBackPageHistory,
      goForwardPageHistory,
      setPageComponentLocation,
      getPendingPageLocationSnapshot,
    ],
  );

  return (
    <ControlPanelContext.Provider value={value}>
      {children}
    </ControlPanelContext.Provider>
  );
};

export const useControlPanel = (): ControlPanelContextType => {
  const context = useContext(ControlPanelContext);
  if (!context) {
    throw new Error(
      "useControlPanel must be used within a ControlPanelProvider",
    );
  }
  return context;
};
