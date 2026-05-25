"use client";

import { useState, useEffect } from "react";
import Pane from "../Pane";
import styles from "./VersioningPane.module.scss";
import { useParams, useRouter } from "next/navigation";
import { getRecordVersions } from "@/app/utils/dataTableUtils";
import InlineLoaderIcon from "../../InlineLoader/InlineLoader";
import ChevronRightIcon from "@/app/components/SVGIcons/ChevronRight";
import { DataType } from "@/app/types/types";
import { DATA_TYPE_CONFIG } from "@/app/utils/constants";

interface VersioningPaneProps<T> {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  dataType: DataType;
}

const VersioningPane = <
  T extends {
    code: string;
    version: number;
    published: boolean;
  },
>({
  isOpen,
  onClose,
  code,
  dataType,
}: VersioningPaneProps<T>) => {
  const router = useRouter();
  const { workspaceCode } = useParams();
  const [versions, setVersions] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dataConfig = DATA_TYPE_CONFIG[dataType];

  useEffect(() => {
    if (!isOpen || !code) {
      return;
    }

    const fetchVersions = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getRecordVersions<T>(
          code,
          dataConfig,
          workspaceCode as string,
        );
        setVersions(result.toSorted((a, b) => b.version - a.version));
      } catch (err) {
        setError((err as Error).message ?? "Failed to fetch versions");
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, [isOpen, code]);

  const handleVersionClick = (version: number) => {
    router.push(
      `/workspaces/${workspaceCode}${dataConfig.routeBase}/${encodeURIComponent(
        code,
      )}/v${version}/configure`,
    );
  };

  return (
    <Pane
      isOpen={isOpen}
      onClose={onClose}
      title={code || `${dataConfig.label} Versions`}
      minWidth={400}
    >
      <div className={styles.container}>
        {loading && (
          <div className={styles.loadingContainer}>
            <InlineLoaderIcon />
            <span>Loading versions...</span>
          </div>
        )}

        {error && (
          <div className={styles.errorContainer}>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && versions.length === 0 && (
          <div className={styles.emptyContainer}>
            <p>No versions found</p>
          </div>
        )}

        {!loading && !error && versions.length > 0 && (
          <div className={styles.versionList}>
            {versions.map((version, index) => (
              <div
                key={`${version.code}-${version.version}`}
                data-testid={`${version.code}-${version.version}`}
                className={styles.versionItem}
              >
                <div className={styles.versionIndicator}>
                  {index < versions.length - 1 && (
                    <div
                      data-testid="vertical-line"
                      className={styles.verticalLine}
                    />
                  )}
                  <div
                    className={`${styles.versionBadge} ${
                      !version.published && styles.versionBadgeDraft
                    }`}
                  >
                    <span className={styles.versionText}>
                      v{version.version}
                    </span>
                  </div>
                </div>
                <div className={styles.versionContent}>
                  <span className={styles.statusBadge}>
                    {version.published ? "Published" : "Draft"}
                  </span>
                </div>
                <button
                  className={styles.actionButton}
                  onClick={() => handleVersionClick(version.version)}
                  aria-label={`View version ${version.version}`}
                  data-testid={`view-version-${version.version}`}
                >
                  <ChevronRightIcon />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Pane>
  );
};

export default VersioningPane;
