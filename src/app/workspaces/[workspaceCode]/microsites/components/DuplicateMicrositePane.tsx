"use client";

import {
  useEffect,
  useRef,
  useState,
  ChangeEvent,
  useCallback,
  useMemo,
} from "react";
import { useParams } from "next/navigation";
import Pane from "@/app/components/InternalComponents/Pane/Pane";
import FormPaneFooter from "@/app/components/InternalComponents/FormPaneFooter/FormPaneFooter";
import OperationProgress from "@/app/components/OperationProgress/OperationProgress";
import SelectDropdown from "@/app/components/InternalComponents/SelectDropdown/SelectDropdown";
import sharedStyles from "@/app/styles/shared.module.scss";
import styles from "./DuplicateMicrositePane.module.scss";
import { toCode, toEditableCode } from "@/app/utils/utils";
import { MicrositesV2 } from "@/app/types/internalTypes";
import {
  dedupePageCodes,
  DuplicateMicrositeTarget,
  buildPageCodeWithPrefix,
  duplicateMicrosite,
  fetchMicrositeVersions,
  getPageCodeSuffix,
  OperationProgress as OperationProgressState,
} from "@/app/utils/micrositeOrchestration";
import { getRecord } from "@/app/utils/dataTableUtils";
import { DATA_TYPE_CONFIG } from "@/app/utils/constants";

interface DuplicateMicrositePaneProps {
  isOpen: boolean;
  sourceMicrositeCode: string | null;
  initialVersion?: number;
  onClose: () => void;
  onCreated: (code: string) => void;
}

interface PageMappingState {
  sourcePageCode: string;
  targetPageCode: string;
}

const buildDuplicateMicrositeCode = (
  sourceMicrositeCode: string,
  timestampToken: string,
) => {
  const normalizedValue = toCode(sourceMicrositeCode);

  if (!normalizedValue) {
    return "";
  }

  return `${normalizedValue}-${timestampToken}`;
};

const getUniqueSourcePageCodes = (
  sourceMicrosite: Record<string, any> | null,
) =>
  dedupePageCodes(
    (sourceMicrosite?.pages ?? []).map((page: { pageCode?: string }) =>
      String(page.pageCode ?? ""),
    ),
  );

const DuplicateMicrositePane = ({
  isOpen,
  sourceMicrositeCode,
  initialVersion,
  onClose,
  onCreated,
}: DuplicateMicrositePaneProps) => {
  const { workspaceCode } = useParams();
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const hasInitializedTargetFieldsRef = useRef(false);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [sourceSystem, setSourceSystem] = useState("");
  const [accessControlled, setAccessControlled] = useState(false);
  const [pageMappings, setPageMappings] = useState<PageMappingState[]>([]);
  const [availableVersions, setAvailableVersions] = useState<MicrositesV2[]>(
    [],
  );
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [sourceMicrosite, setSourceMicrosite] = useState<Record<
    string,
    any
  > | null>(null);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operationProgress, setOperationProgress] =
    useState<OperationProgressState | null>(null);
  const micrositeConfig = DATA_TYPE_CONFIG.microsites;

  const resetState = useCallback(() => {
    setName("");
    setCode("");
    setSlug("");
    setDescription("");
    setSourceSystem("");
    setAccessControlled(false);
    setPageMappings([]);
    setAvailableVersions([]);
    setSelectedVersion(null);
    setSourceMicrosite(null);
    setVersionsLoading(false);
    setSourceLoading(false);
    setSubmitting(false);
    setError(null);
    setOperationProgress(null);
    hasInitializedTargetFieldsRef.current = false;
  }, []);

  const resetAndClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  useEffect(() => {
    if (!isOpen || !sourceMicrositeCode) {
      return;
    }

    const timestampToken = String(Date.now());
    const initialCode = buildDuplicateMicrositeCode(
      sourceMicrositeCode,
      timestampToken,
    );

    setCode(initialCode);
    setSlug(initialCode);
    setName("");
    setDescription("");
    setSourceSystem("");
    setAccessControlled(false);
    setPageMappings([]);
    setAvailableVersions([]);
    setSelectedVersion(null);
    setSourceMicrosite(null);
    setVersionsLoading(true);
    setSourceLoading(false);
    setSubmitting(false);
    setError(null);
    setOperationProgress(null);
    hasInitializedTargetFieldsRef.current = false;

    let active = true;

    (async () => {
      try {
        const versions = await fetchMicrositeVersions(
          workspaceCode as string,
          sourceMicrositeCode,
        );

        if (!active) {
          return;
        }

        setAvailableVersions(versions);

        if (versions.length === 0) {
          setError("No versions found for this microsite.");
          return;
        }

        const nextSelectedVersion = versions.some(
          (version) => version.version === initialVersion,
        )
          ? (initialVersion ?? versions[0].version)
          : versions[0].version;

        setSelectedVersion(nextSelectedVersion);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load microsite versions.",
        );
      } finally {
        if (active) {
          setVersionsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [initialVersion, isOpen, sourceMicrositeCode, workspaceCode]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handle = globalThis.setTimeout(() => {
      nameInputRef.current?.focus();
    }, 0);

    return () => {
      globalThis.clearTimeout(handle);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!submitting) {
      return;
    }

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", handler);

    return () => {
      window.removeEventListener("beforeunload", handler);
    };
  }, [submitting]);

  useEffect(() => {
    if (!isOpen || !sourceMicrosite) {
      return;
    }

    const uniqueSourcePageCodes = getUniqueSourcePageCodes(sourceMicrosite);
    const nextMappings = uniqueSourcePageCodes.map((pageCode) => ({
      sourcePageCode: pageCode,
      targetPageCode: buildPageCodeWithPrefix(
        code,
        getPageCodeSuffix(pageCode),
      ),
    }));

    setPageMappings(nextMappings);
  }, [code, isOpen, sourceMicrosite]);

  useEffect(() => {
    if (!isOpen || !sourceMicrositeCode || selectedVersion === null) {
      return;
    }

    let active = true;
    setSourceLoading(true);
    setSourceMicrosite(null);
    setError(null);

    (async () => {
      try {
        const micrositeRecord = await getRecord<Record<string, unknown>>(
          micrositeConfig,
          sourceMicrositeCode,
          selectedVersion,
          workspaceCode as string,
        );

        if (!active) {
          return;
        }

        setSourceMicrosite(micrositeRecord);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load selected microsite version.",
        );
      } finally {
        if (active) {
          setSourceLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [
    isOpen,
    micrositeConfig,
    selectedVersion,
    sourceMicrositeCode,
    workspaceCode,
  ]);

  useEffect(() => {
    if (!sourceMicrosite) {
      return;
    }

    if (!hasInitializedTargetFieldsRef.current) {
      const duplicateName = `${sourceMicrosite.name ?? sourceMicrosite.code ?? "Microsite"} Copy`;
      setName(duplicateName);
      hasInitializedTargetFieldsRef.current = true;
    }

    setDescription(String(sourceMicrosite.description ?? ""));
    setSourceSystem(String(sourceMicrosite.sourceSystem ?? ""));
    setAccessControlled(Boolean(sourceMicrosite.accessControlled));
  }, [sourceMicrosite]);

  const versionOptions = useMemo(
    () =>
      availableVersions.map((version) => ({
        value: version.version.toString(),
        label: `v${version.version} · ${
          version.published ? "Published" : "Draft"
        }`,
      })),
    [availableVersions],
  );

  const canSubmit =
    !submitting &&
    !versionsLoading &&
    !sourceLoading &&
    Boolean(sourceMicrosite) &&
    Boolean(name.trim()) &&
    Boolean(code.trim()) &&
    Boolean(slug.trim());

  const handleNameChange = (value: string) => {
    setName(value);
  };

  const handleCodeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextCode = toEditableCode(event.target.value);
    setCode(nextCode);
  };

  const handleSlugChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextSlug = toCode(event.target.value);
    setSlug(nextSlug);
  };

  const handleVersionChange = (value: string) => {
    const nextVersion = Number(value);

    if (Number.isNaN(nextVersion)) {
      return;
    }

    setSelectedVersion(nextVersion);
  };

  const handleSubmit = async () => {
    if (!sourceMicrosite) {
      return;
    }

    if (!code.trim() || !slug.trim() || !name.trim()) {
      setError("Name, code, and slug are required.");
      return;
    }

    if (sourceMicrosite.code === code.trim()) {
      setError("Duplicate microsite code must be different from the source.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setOperationProgress(null);

    try {
      const targetMicrosite: DuplicateMicrositeTarget = {
        code: code.trim(),
        slug: slug.trim(),
        name: name.trim(),
        description: description.trim(),
        sourceSystem: sourceSystem.trim(),
        accessControlled,
        version: 1,
        published: false,
      };

      await duplicateMicrosite({
        workspaceCode: workspaceCode as string,
        sourceMicrosite,
        targetMicrosite,
        pageMappings,
        onProgress: setOperationProgress,
      });

      onCreated(targetMicrosite.code);
      resetAndClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to duplicate microsite.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Pane
      isOpen={isOpen}
      onClose={submitting ? () => {} : resetAndClose}
      title="Duplicate microsite"
      minWidth={860}
      showCloseIcon={!submitting}
      paneFooter={
        !submitting ? (
          <FormPaneFooter
            onCancel={resetAndClose}
            onSubmit={handleSubmit}
            isSubmitting={submitting}
            isValid={!!canSubmit}
            submitButtonTestId="duplicate-microsite-submit"
            submitLabel="Duplicate"
            submittingLabel="Duplicating..."
          />
        ) : undefined
      }
    >
      <div className={sharedStyles.form}>
        {submitting && operationProgress ? (
          <div
            className={styles.progressPanel}
            data-testid="duplicate-progress-panel"
          >
            <OperationProgress progress={operationProgress} />
            <p className={styles.progressWarning}>
              Please do not close the browser while duplication is in progress.
            </p>
          </div>
        ) : (
          <>
            {sourceMicrositeCode && (
              <div
                className={`${sharedStyles.infoBanner} ${styles.sourceBanner}`}
              >
                Duplicating from:{" "}
                <strong>{sourceMicrosite?.name ?? sourceMicrositeCode}</strong>
                {selectedVersion ? ` (v${selectedVersion})` : ""}
              </div>
            )}

            <div className={sharedStyles.fieldGroup}>
              <div>
                <h3 className={sharedStyles.fieldGroupTitle}>
                  Microsite details
                </h3>
              </div>
              <div className={sharedStyles.field}>
                <label htmlFor="duplicate-source-version">Source version</label>
                <SelectDropdown
                  id="duplicate-source-version"
                  options={versionOptions}
                  value={selectedVersion?.toString() ?? ""}
                  onChange={handleVersionChange}
                  disabled={submitting || sourceLoading}
                  loading={versionsLoading}
                  loadingText="Loading versions..."
                  minWidth="100%"
                />
                {sourceLoading && (
                  <p className={styles.helperText}>
                    Loading selected version...
                  </p>
                )}
              </div>
              <div className={sharedStyles.field}>
                <label htmlFor="duplicate-microsite-name">Name*</label>
                <input
                  id="duplicate-microsite-name"
                  ref={nameInputRef}
                  value={name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  placeholder="Enter microsite name"
                  disabled={submitting}
                  data-testid="duplicate-microsite-name"
                />
              </div>
              <div className={sharedStyles.field}>
                <label htmlFor="duplicate-microsite-code">Code*</label>
                <input
                  id="duplicate-microsite-code"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="Enter microsite code"
                  disabled={submitting}
                  data-testid="duplicate-microsite-code"
                />
                <p className={styles.helperText}>
                  A timestamp is appended automatically so the duplicated
                  microsite and its page codes stay unique in the workspace.
                </p>
              </div>
              <div className={sharedStyles.field}>
                <label htmlFor="duplicate-microsite-slug">Slug*</label>
                <input
                  id="duplicate-microsite-slug"
                  value={slug}
                  onChange={handleSlugChange}
                  placeholder="Enter microsite slug"
                  disabled={submitting}
                  data-testid="duplicate-microsite-slug"
                />
              </div>
              <div className={sharedStyles.field}>
                <label htmlFor="duplicate-microsite-source-system">
                  Source System
                </label>
                <input
                  id="duplicate-microsite-source-system"
                  value={sourceSystem}
                  onChange={(event) => setSourceSystem(event.target.value)}
                  placeholder="Enter source system"
                  disabled={submitting}
                  data-testid="duplicate-microsite-source-system"
                />
              </div>
              <div className={sharedStyles.field}>
                <label
                  className={sharedStyles.checkbox}
                  htmlFor="duplicate-microsite-access-controlled"
                >
                  <input
                    id="duplicate-microsite-access-controlled"
                    type="checkbox"
                    checked={accessControlled}
                    onChange={(event) =>
                      setAccessControlled(event.target.checked)
                    }
                    disabled={submitting}
                    data-testid="duplicate-microsite-access-controlled"
                  />{" "}
                  Is Microsite Access Controlled?
                </label>
              </div>
              <div className={sharedStyles.field}>
                <label htmlFor="duplicate-microsite-description">
                  Description
                </label>
                <input
                  id="duplicate-microsite-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Enter description"
                  disabled={submitting}
                  data-testid="duplicate-microsite-description"
                />
              </div>
            </div>

            <div className={sharedStyles.fieldGroup}>
              <div>
                <h3 className={sharedStyles.fieldGroupTitle}>
                  Pages ({pageMappings.length})
                </h3>
                <p className={sharedStyles.fieldGroupDescription}>
                  Page references and session keys will be updated automatically
                  during the process.
                </p>
              </div>
            </div>

            {operationProgress && (
              <div
                className={styles.progressPanel}
                data-testid="duplicate-progress-panel"
              >
                <OperationProgress progress={operationProgress} />
              </div>
            )}
          </>
        )}

        {error && (
          <div className={sharedStyles.field}>
            <div className={styles.errorText}>{error}</div>
          </div>
        )}
      </div>
    </Pane>
  );
};

export default DuplicateMicrositePane;
