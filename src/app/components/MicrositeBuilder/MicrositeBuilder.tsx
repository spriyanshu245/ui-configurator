"use client";
import styles from "./MicrositeBuilder.module.scss";
import ComponentPaneV2 from "@/app/components/MicrositeBuilder/ComponentPaneV2/ComponentPaneV2";
import BuilderPane from "@/app/components/UserTaskBuilder/BuilderPane/BuilderPane";
import { PropertyPaneProvider } from "@/app/context/PropertiesContext";
import { UserTaskProvider } from "@/app/context/UserTaskContext";
import MicrositeControlPanel from "@/app/components/MicrositeControlPanel/MicrositeControlPanel";
import { useMicrosite } from "@/app/context/MicrositeContext";
import { useEffect, useMemo } from "react";
import { useHeaderV2 } from "@/app/context/HeaderContextV2";
import { useControlPanel } from "@/app/context/ControlPanelContext";
import { useParams } from "next/navigation";

export default function MicrositeBuilder() {
  const { microsite, activePageCode, isEditing } = useMicrosite();
  const { setResourceStatus } = useHeaderV2();
  const {
    clearPageHistory,
    seedPageHistory,
    setPageHistoryScope,
    syncPageHistory,
  } = useControlPanel();
  const { workspaceCode, version } = useParams();
  const isPageAvailable = (microsite?.pages?.length ?? 0) > 0;
  const pageCodes = useMemo(
    () =>
      (microsite?.pages ?? [])
        .map((page) => page.pageCode ?? "")
        .filter(Boolean),
    [microsite?.pages],
  );
  const pageHistoryScope = useMemo(
    () =>
      `${String(workspaceCode ?? "")}:${String(microsite.code ?? "")}:${String(
        version ?? microsite.version ?? "",
      )}`,
    [microsite.code, microsite.version, version, workspaceCode],
  );

  useEffect(() => {
    setResourceStatus(isEditing ? "Draft" : "Published");
  }, [isEditing, setResourceStatus]);

  useEffect(() => {
    setPageHistoryScope(pageHistoryScope);

    return () => {
      clearPageHistory();
    };
  }, [clearPageHistory, pageHistoryScope, setPageHistoryScope]);

  useEffect(() => {
    syncPageHistory(pageCodes);
  }, [pageCodes, syncPageHistory]);

  useEffect(() => {
    if (!activePageCode) {
      return;
    }

    seedPageHistory(activePageCode);
  }, [activePageCode, seedPageHistory]);

  return (
    <UserTaskProvider key={activePageCode} pageCode={activePageCode}>
      <PropertyPaneProvider>
        <div className={styles.micrositeContainer}>
          <div className={styles.componentsPane}>
            <ComponentPaneV2 />
          </div>
          <div className={`${styles.builderPane}`}>
            <MicrositeControlPanel />
            {isPageAvailable && <BuilderPane />}
          </div>
        </div>
      </PropertyPaneProvider>
    </UserTaskProvider>
  );
}
