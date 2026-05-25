"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import HeaderV2 from "@/app/components/HeaderV2/HeaderV2";
import AccessControlTreeNode from "@/app/components/AccessControlTreeNode/AccessControlTreeNode";
import InlineLoaderIcon from "@/app/components/InternalComponents/InlineLoader/InlineLoader";
import SaveIcon from "@/app/components/SVGIcons/Save";
import {
  AccessConfigComponent,
  AccessConfigPage,
  BaseConfig,
} from "@/app/types/accessControlConfig";
import { BaseComponent, Microsite } from "@/app/types/types";
import styles from "./BaseConfigDetailPage.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import Link from "next/link";
import ChevronRightIcon from "../SVGIcons/ChevronRight";
import ExpandAllIcon from "../SVGIcons/ExpandAll";
import CollapseAllIcon from "../SVGIcons/CollapseAll";
import { useHeaderV2 } from "@/app/context/HeaderContextV2";
export interface BaseConfigDetailPageProps<T extends BaseConfig> {
  title: string;
  code: string;
  listRoute: string;

  config: T | null;
  setConfig: React.Dispatch<React.SetStateAction<T | null>>;

  loading: boolean;
  error: string | null;

  dslData: Microsite | null;
  pageComponentsMap: Map<string, BaseComponent[]>;

  newComponentIds: string[];
  removedCount: number;
  onSave: (config: T) => Promise<T>;
}

export default function BaseConfigDetailPage<T extends BaseConfig>({
  title,
  code,
  listRoute,
  config,
  setConfig,
  loading,
  error,
  dslData,
  pageComponentsMap,
  newComponentIds,
  removedCount,
  onSave,
}: Readonly<BaseConfigDetailPageProps<T>>) {
  const [saving, setSaving] = useState(false);
  const { setUserNotification, setBackRoute, setShowCloseIcon } = useHeaderV2();
  const searchParams = useSearchParams();
  const backQuery = searchParams.get("backQuery");
  const effectiveListRoute = backQuery
    ? `${listRoute}?q=${encodeURIComponent(backQuery)}`
    : listRoute;

  useEffect(() => {
    setBackRoute(effectiveListRoute);
    setShowCloseIcon(true);
  }, [effectiveListRoute, setBackRoute, setShowCloseIcon]);
  const [expandAllTrigger, setExpandAllTrigger] = useState({
    value: true,
    version: 0,
  });
  const [visitedNewIds, setVisitedNewIds] = useState<Set<string>>(new Set());
  const [currentNewIndex, setCurrentNewIndex] = useState(-1);
  const [allNewReviewed, setAllNewReviewed] = useState(false);
  const [highlightedComponentId, setHighlightedComponentId] = useState<
    string | null
  >(null);

  const uniqueNewComponentIds = useMemo(
    () => new Set(newComponentIds),
    [newComponentIds]
  );

  const hasUnvisitedNew = useMemo(
    () =>
      !allNewReviewed &&
      uniqueNewComponentIds.size > 0 &&
      visitedNewIds.size < uniqueNewComponentIds.size,
    [newComponentIds, visitedNewIds, allNewReviewed, uniqueNewComponentIds]
  );

  useEffect(() => {
    if (
      !allNewReviewed &&
      newComponentIds.length > 0 &&
      visitedNewIds.size >= uniqueNewComponentIds.size
    ) {
      setAllNewReviewed(true);
    }
  }, [visitedNewIds, newComponentIds, allNewReviewed, uniqueNewComponentIds]);

  const handleSave = async () => {
    try {
      setSaving(true);
      if (config) {
        await onSave(config);
        setUserNotification({
          text: `${"/access-controls" == listRoute ? "Access Control" : "Portal Task"} configuration saved successfully!`,
          type: "success",
          time: 2000,
        });
      }
      setSaving(false);
    } catch (err) {
      setSaving(false);
      const message =
        err instanceof Error ? err.message : "Failed to save configuration";
      setUserNotification({
        text: message,
        type: "error",
        time: 3000,
      });
    }
  };
  const currentPosition = currentNewIndex >= 0 ? currentNewIndex + 1 : 0;

  const newComponentIdSet = useMemo(
    () => new Set(newComponentIds),
    [newComponentIds],
  );

  const highlightComponent = useCallback((targetId: string) => {
    setExpandAllTrigger((prev) => ({
      value: true,
      version: prev.version + 1,
    }));
    setHighlightedComponentId(null);
    requestAnimationFrame(() => {
      setHighlightedComponentId(targetId);
    });
  }, []);

  const handlePrevNew = useCallback(() => {
    if (newComponentIds.length === 0) return;
    setCurrentNewIndex((prev) => {
      const isWrap = prev <= 0;
      const next = isWrap ? newComponentIds.length - 1 : prev - 1;
      const targetId = newComponentIds[next];
      setVisitedNewIds((prevVisited) => {
        const updated = isWrap ? new Set<string>() : new Set(prevVisited);
        updated.add(targetId);
        return updated;
      });
      highlightComponent(targetId);
      return next;
    });
  }, [newComponentIds, highlightComponent]);

  const handleNextNew = useCallback(() => {
    if (newComponentIds.length === 0) return;
    setCurrentNewIndex((prev) => {
      const isWrap = prev >= newComponentIds.length - 1;
      const next = isWrap ? 0 : prev + 1;
      const targetId = newComponentIds[next];
      setVisitedNewIds((prevVisited) => {
        const updated = isWrap ? new Set<string>() : new Set(prevVisited);
        updated.add(targetId);
        return updated;
      });
      highlightComponent(targetId);
      return next;
    });
  }, [newComponentIds, highlightComponent]);

  const getStats = () => {
    if (!config) return null;
    const totalPages = config.pages.length;

    const countComponents = (components: AccessConfigComponent[]): number => {
      let count = components.length;
      components.forEach((component) => {
        if (component.components && component.components.length > 0) {
          count += countComponents(component.components);
        }
      });
      return count;
    };

    const totalComponents = config.pages?.reduce(
      (acc, page) =>
        acc + (page.components ? countComponents(page.components) : 0),
      0,
    );

    return { totalPages, totalComponents };
  };

  const stats = config?.pages ? getStats() : null;

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}>
            <InlineLoaderIcon />
          </div>
          <div className={styles.loadingText}>
            Loading Portal Task configuration...
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <h3>Failed to Load</h3>
          <p>{error}</p>
          <Link href={effectiveListRoute} className={styles.button}>
            Back to List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <HeaderV2 />
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.breadcrumb}>
              <Link href={effectiveListRoute}>{title}</Link>
              <span className={styles.separator}>/</span>
              <span className={styles.current}>{code}</span>
            </div>
          </div>
        </div>
        {stats && (
          <div className={styles.stats}>
            <div className={styles.statsLeft}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Pages</span>
                <span className={styles.statValue}>{stats.totalPages}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Components</span>
                <span className={styles.statValue}>
                  {stats.totalComponents}
                </span>
              </div>
            </div>
            {(newComponentIds.length > 0 || removedCount > 0) && (
              <div className={styles.statsRight}>
                {newComponentIds.length > 0 && (
                  <div className={`${styles.statItem} ${styles.newStat}`}>
                    <span className={styles.statLabel}>New Components</span>
                    <div className={styles.newStatContent}>
                      <button
                        type="button"
                        className={`${styles.navArrow} ${styles.navArrowLeft}`}
                        onClick={handlePrevNew}
                        aria-label="Previous new component"
                      >
                        <ChevronRightIcon />
                      </button>
                      <span className={styles.statValue}>
                        {currentPosition}/{newComponentIds.length}
                      </span>
                      <button
                        type="button"
                        className={styles.navArrow}
                        onClick={handleNextNew}
                        aria-label="Next new component"
                      >
                        <ChevronRightIcon />
                      </button>
                    </div>
                  </div>
                )}
                {removedCount > 0 && (
                  <div className={`${styles.statItem} ${styles.removedStat}`}>
                    <span className={styles.statLabel}>Removed</span>
                    <span className={styles.statValue}>{removedCount}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {config && (
          <div className={styles.treeActions}>
            <div className={styles.leftSide}>
              <button
                type="button"
                className={sharedStyles.iconButton}
                onClick={() =>
                  setExpandAllTrigger((prev) => ({
                    value: true,
                    version: prev.version + 1,
                  }))
                }
                title="Expand All"
              >
                <ExpandAllIcon />
              </button>
              <button
                type="button"
                className={sharedStyles.iconButton}
                onClick={() =>
                  setExpandAllTrigger((prev) => ({
                    value: false,
                    version: prev.version + 1,
                  }))
                }
                title="Collapse All"
              >
                <CollapseAllIcon />
              </button>
            </div>
            <div className={styles.rightSide}>
              {hasUnvisitedNew && (
                <span className={styles.reviewMessage}>
                  Review new components to enable save
                </span>
              )}
              <button
                type="button"
                className={sharedStyles.iconButton}
                onClick={handleSave}
                disabled={saving || hasUnvisitedNew}
                title={
                  hasUnvisitedNew
                    ? "Review all new components before saving"
                    : "Save Configuration"
                }
              >
                {saving ? <InlineLoaderIcon /> : <SaveIcon />}
              </button>
            </div>
          </div>
        )}
        <div className={styles.treeContainer}>
          {!config && (
            <div className={styles.emptyState}>
              <h3>No Configuration Found</h3>
              <p>
                The Portal Tasks configuration for this portal task code could
                not be found.
              </p>
            </div>
          )}

          {config?.pages?.map((page, index) => (
            <AccessControlTreeNode
              key={page.pageCode}
              node={page}
              nodeType="page"
              label={page.pageCode}
              onUpdate={(updated) => {
                const updatedPages = [...config.pages];
                updatedPages[index] = updated as AccessConfigPage;
                setConfig({ ...config, pages: updatedPages });
              }}
              pageCode={page.pageCode}
              pageComponents={pageComponentsMap.get(page.pageCode) || []}
              dslData={dslData}
              expandAllTrigger={expandAllTrigger}
              highlightedComponentId={highlightedComponentId}
              newComponentIds={newComponentIdSet}
            />
          ))}
        </div>
      </div>
    </>
  );
}
