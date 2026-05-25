"use client";
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TabsComponent } from "@/app/types/types";
import sharedStyles from "@/app/styles/shared.module.scss";
import stylesPageSelector from "../../../components/MicrositeBuilder/PageSelector/PageSelector.module.scss";
import styles from "./Tabs.module.scss";
import { useMicrosite } from "@/app/context/MicrositeContext";
import { UnsavedChangesModal } from "../../InternalComponents/UnsavedChangesPopupp/UnsavedChangesPopup";
import { useNavigationGuard } from "@/app/hooks/useNavigationGuard";
import useMicrositePageSave from "@/app/hooks/useMicrositePageSave";
import { useControlPanel } from "@/app/context/ControlPanelContext";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import { useUserTask } from "@/app/context/UserTaskContext";

interface TabsProps {
  component: TabsComponent;
}

const resolveTabIndex = (
  activePageCode: string | undefined,
  component: TabsComponent,
  getPendingPageLocationSnapshot: (pageCode: string) => {
    componentLocations: Record<string, { activeTabIndex?: number }>;
  } | null,
) => {
  if (!activePageCode) {
    return 0;
  }

  const pendingPageLocation = getPendingPageLocationSnapshot(activePageCode);
  const activeTabLocation =
    pendingPageLocation?.componentLocations[component.id]?.activeTabIndex;

  if (activeTabLocation === undefined) {
    return 0;
  }

  const tabCount = component.components?.length ?? 0;

  return Math.max(0, Math.min(activeTabLocation, Math.max(tabCount - 1, 0)));
};

const Tabs = ({ component }: TabsProps) => {
  const { setActivePage, activePageCode } = useMicrosite();
  const {
    isAutoSave,
    isSaveSuccessful,
    getPendingPageLocationSnapshot,
    pushPageHistory,
    setPageComponentLocation,
  } = useControlPanel();
  const { resetActivePage } = usePropertyPane();
  const { hasPageChanges } = useUserTask();
  const shouldOpenModal = useMemo(
    () => !isAutoSave && hasPageChanges && !isSaveSuccessful,
    [isAutoSave, hasPageChanges, isSaveSuccessful],
  );
  const { showModal, allow, block, guardedNavigate } =
    useNavigationGuard(shouldOpenModal);

  const { handlePageSave } = useMicrositePageSave();
  const [activeTabIndex, setActiveTabIndex] = useState(() =>
    resolveTabIndex(activePageCode, component, getPendingPageLocationSnapshot),
  );
  const [selectedPageCode, setSelectedPageCode] = useState("");
  const restoredLocationRef = useRef("");

  useLayoutEffect(() => {
    if (!activePageCode) {
      return;
    }

    const boundedTabIndex = resolveTabIndex(
      activePageCode,
      component,
      getPendingPageLocationSnapshot,
    );
    const restoreKey = `${activePageCode}:${component.id}:${boundedTabIndex}`;

    if (restoredLocationRef.current === restoreKey) {
      return;
    }

    restoredLocationRef.current = restoreKey;
    setActiveTabIndex(boundedTabIndex);
  }, [
    activePageCode,
    component.components?.length,
    component.id,
    component,
    getPendingPageLocationSnapshot,
  ]);

  useEffect(() => {
    if (!activePageCode) {
      return;
    }

    setPageComponentLocation(activePageCode, component.id, {
      activeTabIndex,
    });
  }, [activePageCode, activeTabIndex, component.id, setPageComponentLocation]);

  const onLeave = (pageCode: string) => {
    if (!pageCode || pageCode === activePageCode) {
      setSelectedPageCode("");
      allow();
      return;
    }

    pushPageHistory(activePageCode ?? "", pageCode);
    setActivePage(pageCode);
    resetActivePage();
    setSelectedPageCode("");
    allow();
  };

  const onConfirm = async (pageCode: string) => {
    if (hasPageChanges) {
      await handlePageSave();
    }
    onLeave(pageCode);
  };

  const onCancel = () => {
    setSelectedPageCode("");
    block();
  };
  const tabCount = Math.min(
    Number(component?.properties?.rowTabCount || 0),
    Number(component?.components?.length || 0),
  );

  const dynamicGridStyle = {
    display: "grid",
    gridTemplateColumns: `repeat(${tabCount}, 1fr)`,
    gap: "0.5rem",
    overflow: "auto",
  };

  const handlePageNavigation = () => {
    const pageCode = component?.components?.[activeTabIndex]?.pageCode;
    if (!pageCode || pageCode === activePageCode) {
      return;
    }

    setSelectedPageCode(pageCode);
    guardedNavigate(() => onConfirm(pageCode));
  };

  return (
    <div
      className={
        component?.properties?.tabLayout === "vertical"
          ? styles.verticalWrapper
          : ""
      }
      id={component.id}
      data-testid={component.id}
    >
      <div
        className={`${sharedStyles.tabs}  ${
          component?.properties?.tabLayout === "vertical"
            ? styles.verticalTabWrap
            : ""
        }`}
        style={
          component?.properties?.tabLayout === "vertical"
            ? {}
            : dynamicGridStyle
        }
        id={component?.properties?.tabLayout ?? "vertical"}
      >
        {Array.isArray(component?.components) &&
          component?.components?.map((item, index) => (
            <div
              data-testid={item?.id}
              key={item?.id}
              tabIndex={0}
              className={`${sharedStyles.tab} ${stylesPageSelector.header} ${
                styles.tabItemCenter
              } ${index === activeTabIndex ? sharedStyles.active : ""}`}
              onClick={() => {
                setActiveTabIndex(index);
              }}
            >
              <span className={sharedStyles.title}>
                {item?.properties?.title?.length > 13
                  ? item.properties.title.slice(0, 13) + "..."
                  : (item?.properties?.title ?? "")}
              </span>
            </div>
          ))}
      </div>
      <hr />
      <div
        className={
          component?.properties?.tabLayout === "vertical"
            ? styles.verticalContentArea
            : ""
        }
      >
        {component.components?.[activeTabIndex]?.pageCode && (
          <button
            id="pageNavigator"
            data-testid="pageNavigator"
            className={styles.pageNavigator}
            onClick={handlePageNavigation}
          >
            {"Go to the Page >"}
          </button>
        )}
      </div>
      {
        <UnsavedChangesModal
          open={showModal}
          onConfirm={() => onConfirm(selectedPageCode)}
          onCancel={() => onLeave(selectedPageCode)}
          backDrop={onCancel}
        />
      }
    </div>
  );
};

export default Tabs;
