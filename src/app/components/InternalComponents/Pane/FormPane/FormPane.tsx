"use client";
import {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
  Fragment,
  ChangeEvent,
} from "react";
import Pane from "../Pane";
import FormPaneFooter from "@/app/components/InternalComponents/FormPaneFooter/FormPaneFooter";
import sharedStyles from "../../../../styles/shared.module.scss";
import {
  createRecord,
  duplicateRecord,
  getRecord,
  updateRecord,
} from "@/app/utils/dataTableUtils";
import { isNonEmpty, toCode, toEditableCode } from "@/app/utils/utils";
import { DataType, IRequestData } from "@/app/types/types";
import { useParams } from "next/navigation";
import { DATA_TYPE_CONFIG, MASTER_NAME } from "@/app/utils/constants";
import { SourceSystemOption } from "@/app/types/internalTypes";
import { apiRequest } from "@/app/services/APIService";

type FormMode = "create" | "edit" | "duplicate";
type DataToEdit = {
  code?: string;
  name?: string;
  sourceSystem?: string;
  version?: number;
  accessControlled?: boolean;
  description?: string;
  slug?: string;
};
interface FormPaneProps {
  isOpen: boolean;
  mode: FormMode;
  onClose: () => void;
  onCreated?: (code: string) => void | Promise<void>;
  onUpdated?: (payload: {
    code: string;
    name: string;
    sourceSystem?: string;
    accessControlled?: boolean;
    description?: string;
    slug?: string;
  }) => void;
  dataToEdit?: DataToEdit;
  sourceDsl?: Record<string, any> | null;
  dataType: DataType;
  micrositeCode?: string;
}

const FormPane = ({
  isOpen,
  mode,
  onClose,
  onCreated,
  onUpdated,
  dataToEdit,
  sourceDsl,
  dataType,
  micrositeCode,
}: FormPaneProps) => {
  const {
    code: dataCode,
    version,
    name: initialName,
    sourceSystem: initialSourceSystem,
    accessControlled: initialIsAccessControlled,
    description: initialDescription,
    slug: initialSlug,
  } = dataToEdit ?? {};
  const isEditMode = mode === "edit";
  const isDuplicateMode = mode === "duplicate";
  const dataConfig = DATA_TYPE_CONFIG[dataType];
  const { workspaceCode, version: routeVersion } = useParams();
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const resolvedVersion = Number(
    String(version ?? routeVersion ?? 1).replace(/^v/, ""),
  );

  const [name, setName] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [slug, setSlug] = useState<string>("");
  const [sourceSystem, setSourceSystem] = useState<string>("");
  const [accessControlled, setAccessControlled] = useState<boolean>(false);
  const [description, setDescription] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [codeEdited, setCodeEdited] = useState<boolean>(false);
  const [slugEdited, setSlugEdited] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [dsl, setDsl] = useState<Record<string, any> | null>(null);
  const [sourceSystemOptions, setSourceSystemOptions] = useState<
    SourceSystemOption[]
  >([]);
  const isPageCreateSubmitting =
    submitting && !isEditMode && !isDuplicateMode && dataType === "pages";

  useEffect(() => {
    if (dataType === "pages" && !isEditMode) {
      if (micrositeCode && slug) {
        setCode(`${micrositeCode}_${slug}`);
      } else {
        setCode("");
      }
    }
  }, [dataType, isEditMode, micrositeCode, slug]);

  const isValid = useMemo(() => {
    if (!isNonEmpty(name)) return false;
    if (isEditMode) {
      if (loading) return false;
      return dsl !== null;
    }

    if (dataType === "pages") {
      return isNonEmpty(code) && isNonEmpty(slug) && micrositeCode;
    }
    if (dataType === "microsites") {
      return isNonEmpty(code) && isNonEmpty(slug);
    }
    return isNonEmpty(code);
  }, [isEditMode, name, code, slug, loading, dsl, dataType, micrositeCode]);

  const primaryActionLabel = useMemo(() => {
    if (submitting) {
      if (isEditMode) return "Saving...";
      if (isDuplicateMode) return "Duplicating...";
      return "Creating...";
    }
    if (isEditMode) return "Save";
    if (isDuplicateMode) return "Duplicate";
    return "Create";
  }, [submitting, isEditMode, isDuplicateMode]);

  const paneTitle = useMemo(() => {
    if (isEditMode) return `Edit ${dataType}`;
    if (isDuplicateMode) return `Duplicate ${dataType}`;
    return `Create ${dataType}`;
  }, [isEditMode, isDuplicateMode, dataType]);

  const resetFormState = useCallback(() => {
    setName("");
    setCode("");
    setSlug("");
    setSourceSystem("");
    setAccessControlled(false);
    setDescription("");
    setCodeEdited(false);
    setSlugEdited(false);
    setError(null);
    setSubmitting(false);
    setLoading(false);
    setDsl(null);
  }, []);

  const resetAndClose = useCallback(() => {
    resetFormState();
    onClose();
  }, [resetFormState, onClose]);

  const handlePaneClose = useCallback(() => {
    if (isPageCreateSubmitting) return;
    resetAndClose();
  }, [isPageCreateSubmitting, resetAndClose]);

  const fetchSourceSystems = useCallback(async () => {
    try {
      const requestData: IRequestData = {
        endpoint: `/api/v3/masters/${MASTER_NAME}`,
        method: "GET",
      };
      const response = await apiRequest(requestData);
      if (response && Array.isArray(response)) {
        setSourceSystemOptions(response);
      }
    } catch (error) {
      console.error("Failed to fetch source systems:", error);
    }
  }, []);

  useEffect(() => {
    fetchSourceSystems();
  }, []);

  useEffect(() => {
    if (!isPageCreateSubmitting) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    globalThis.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      globalThis.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isPageCreateSubmitting]);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSubmitting(false);
    setLoading(false);
    if (isEditMode) {
      setCode(dataCode ?? "");
      setCodeEdited(true);
      setName(initialName ?? "");
      setSlug(initialSlug ?? "");
      setSlugEdited(true);
      setSourceSystem(initialSourceSystem ?? "");
      setAccessControlled(!!initialIsAccessControlled);
      setDescription(initialDescription ?? "");
      setDsl(null);
      return;
    }
    if (isDuplicateMode && sourceDsl) {
      setName("");
      setCode("");
      setSlug("");
      setSourceSystem(sourceDsl.sourceSystem ?? "");
      setAccessControlled(false);
      setDescription("");
      setCodeEdited(false);
      setSlugEdited(false);
      setDsl(sourceDsl);
      return;
    }
    setName("");
    setCode("");
    setSlug("");
    setSourceSystem("");
    setDescription("");
    setCodeEdited(false);
    setSlugEdited(false);
    setDsl(null);
  }, [
    isOpen,
    isEditMode,
    isDuplicateMode,
    dataCode,
    initialName,
    initialSlug,
    initialSourceSystem,
    sourceDsl,
  ]);

  useEffect(() => {
    if (!isOpen || !isEditMode || !dataCode) {
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const data = await getRecord<Record<string, any>>(
          dataConfig,
          dataCode,
          version,
          workspaceCode as string,
        );
        if (!active) return;

        setDsl(data);
        setName(data.name);
        setCode(data.code);
        setSlug(data.slug ?? "");
        setSourceSystem(data.sourceSystem ?? "");
        setAccessControlled(!!data.accessControlled);
        setDescription(data.description ?? "");
      } catch (err) {
        if (!active) return;
        const message =
          err instanceof Error ? err.message : `Failed to load ${dataType}`;
        setError(message);
        setDsl(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isOpen, isEditMode, dataCode, version]);

  useEffect(() => {
    if (!isOpen) return;
    if (isEditMode && loading) return;
    const handle = globalThis.setTimeout(() => {
      nameInputRef.current?.focus();
    }, 0);
    return () => {
      globalThis.clearTimeout(handle);
    };
  }, [isOpen, isEditMode, loading]);

  const handleNameChange = (value: string) => {
    setName(value);

    if (dataType === "pages") {
      if (!isEditMode && !isDuplicateMode && !slugEdited) {
        setSlug(toCode(value));
      }
      if (isDuplicateMode && !slugEdited) {
        setSlug(toCode(value));
      }
      return;
    }

    if (!isEditMode && !isDuplicateMode && !codeEdited) {
      setCode(toCode(value));
    }

    if (
      dataType === "microsites" &&
      !isEditMode &&
      !isDuplicateMode &&
      !slugEdited
    ) {
      setSlug(toCode(value));
    }
    if (isDuplicateMode && !codeEdited) {
      setCode(toCode(value));
    }
    if (dataType === "microsites" && isDuplicateMode && !slugEdited) {
      setSlug(toCode(value));
    }
  };

  const handleCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (isEditMode || dataType === "pages") return;
    const val = e.target.value;
    setCode(dataType === "microsites" ? toEditableCode(val) : toCode(val));
    setCodeEdited(val.trim().length > 0);
  };

  const handleSlugChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (isEditMode) return;
    const val = e.target.value;
    setSlug(toCode(val));
    setSlugEdited(val.trim().length > 0);
  };

  const handleSourceSystemChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSourceSystem(val);
  };

  const handleDuplicateMode = async () => {
    if (!dsl) {
      setError(`Unable to load source ${dataType}`);
      setSubmitting(false);
      return;
    }
    try {
      const endpoint = `/api/v1/config${dataConfig.routeBase}`;
      let body: Record<string, any> = {
        ...sourceDsl,
        code,
        name,
      };

      if (dataType === "pages" || dataType === "microsites") {
        body.slug = slug;
      }

      const requestData: IRequestData = {
        method: "POST",
        endpoint,
        body: {
          ...body,
          sourceSystem,
          accessControlled,
        },
        headers: {
          "workspace-code": workspaceCode as string,
        },
      };
      await duplicateRecord(requestData);
      await onCreated?.(code);
      resetAndClose();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : `Failed to duplicate ${dataType}`;
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateMode = async () => {
    try {
      let body: Record<string, any> = {
        code,
        name,
        description,
      };

      if (dataType === "pages" || dataType === "microsites") {
        body.slug = slug;
      }

      const endpoint = `/api/v1/config${dataConfig.routeBase}`;
      const endpointWithVersion =
        dataType === "pages"
          ? `${endpoint}?version=${resolvedVersion}`
          : dataType === "microsites"
            ? `${endpoint}?version=1`
            : endpoint;

      if (dataType === "microsites") {
        body = {
          ...body,
          sourceSystem,
          accessControlled,
        };
      }
      const requestData: IRequestData = {
        method: "POST",
        endpoint: endpointWithVersion,
        body,
        headers: {
          "workspace-code": workspaceCode as string,
        },
      };
      await createRecord(requestData);
      await onCreated?.(code);
      resetAndClose();
    } catch (e) {
      const message =
        e instanceof Error ? e.message : `Failed to create ${dataType}`;
      console.log(e);
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateMode = async () => {
    try {
      const trimmedName = name.trim();
      const updatedDsl: Record<string, any> = {
        ...dsl,
        name: trimmedName,
        code: dataCode,
      };

      updatedDsl.description = description;

      if (dataType === "pages" || dataType === "microsites") {
        updatedDsl.slug = slug;
      }

      const endpoint = `/api/v1/config${dataConfig.routeBase}/${code}`;
      const endpointWithVersion =
        dataType === "pages" || dataType === "microsites"
          ? `${endpoint}?version=${resolvedVersion}`
          : endpoint;
      const requestData: IRequestData = {
        method: "PUT",
        endpoint: endpointWithVersion,
        body: {
          ...updatedDsl,
          sourceSystem,
          accessControlled,
        },
        headers: {
          "workspace-code": workspaceCode as string,
        },
      };
      await updateRecord(requestData);
      setDsl(updatedDsl);
      onUpdated?.({
        code: updatedDsl.code,
        name: updatedDsl.name,
        slug: updatedDsl.slug,
        sourceSystem: updatedDsl.sourceSystem,
        accessControlled: updatedDsl.accessControlled,
        description: updatedDsl.description,
      });
      resetAndClose();
    } catch (e) {
      console.log(e);
      const message =
        e instanceof Error ? e.message : `Failed to update ${dataType}`;
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    setError(null);

    if (isDuplicateMode) {
      return await handleDuplicateMode();
    }

    if (!isEditMode) {
      return handleCreateMode();
    }
    if (!dataCode) {
      setError(`Missing ${dataType} code`);
      setSubmitting(false);
      return;
    }
    if (!dsl) {
      setError(`Unable to load ${dataType}`);
      setSubmitting(false);
      return;
    }
    return handleUpdateMode();
  };

  const disableInputs = submitting || (isEditMode && loading);

  const isCodeDisabled = dataType === "pages" || isEditMode || submitting;

  const footer = (
    <FormPaneFooter
      onCancel={resetAndClose}
      onSubmit={handleSubmit}
      isSubmitting={submitting}
      isValid={!!isValid}
      cancelButtonTestId={`${primaryActionLabel}-cancel`}
      submitButtonTestId={`${primaryActionLabel}-button`}
      submitLabel={
        isEditMode ? "Save" : isDuplicateMode ? "Duplicate" : "Create"
      }
      submittingLabel={
        isEditMode
          ? "Saving..."
          : isDuplicateMode
            ? "Duplicating..."
            : "Creating..."
      }
    />
  );

  return (
    <Pane
      isOpen={isOpen}
      onClose={handlePaneClose}
      title={paneTitle}
      minWidth={600}
      paneFooter={footer}
      showCloseIcon={!isPageCreateSubmitting}
      dismissible={!isPageCreateSubmitting}
    >
      <form
        className={sharedStyles.form}
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
      >
        {isDuplicateMode && sourceDsl && (
          <div className={sharedStyles.infoBanner}>
            Duplicating from: <strong>{sourceDsl.name}</strong>
          </div>
        )}
        <div className={sharedStyles.fieldGroup}>
          <div className={sharedStyles.field}>
            <label htmlFor={`${dataType}-name`}>Name*</label>
            <input
              id={`${dataType}-name`}
              data-testid={`${dataType}-name`}
              type="text"
              ref={nameInputRef}
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={`Enter ${dataType} name`}
              disabled={disableInputs}
              required
            />
          </div>
          {(dataType === "pages" || dataType === "microsites") && (
            <div className={sharedStyles.field}>
              <label htmlFor={`${dataType}-slug`}>Slug*</label>
              <input
                id={`${dataType}-slug`}
                data-testid={`${dataType}-slug`}
                type="text"
                value={slug}
                onChange={handleSlugChange}
                placeholder="Enter unique slug (no spaces)"
                disabled={isEditMode || submitting}
                readOnly={isEditMode}
                required
              />
            </div>
          )}
          <div className={sharedStyles.field}>
            <label htmlFor={`${dataType}-code`}>Code*</label>
            <input
              id={`${dataType}-code`}
              data-testid={`${dataType}-code`}
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder={
                dataType === "pages"
                  ? "Auto-generated from microsite code and slug"
                  : "Enter unique code (no spaces)"
              }
              disabled={isCodeDisabled}
              readOnly={dataType === "pages" || isEditMode}
              required
            />
          </div>
          {dataType === "microsites" && (
            <Fragment>
              <div className={sharedStyles.field}>
                <label htmlFor={`${dataType}-sourceSystem`}>
                  Source System
                </label>
                <select
                  id={`${dataType}-sourceSystem`}
                  data-testid={`${dataType}-sourceSystem`}
                  value={sourceSystem}
                  onChange={handleSourceSystemChange}
                  disabled={disableInputs}
                >
                  <option value="">Select Source System</option>
                  {sourceSystemOptions.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={sharedStyles.field}>
                <label
                  className={sharedStyles.checkbox}
                  htmlFor={`${dataType}-accessControlled`}
                >
                  <input
                    id={`${dataType}-accessControlled`}
                    data-testid={`${dataType}-accessControlled`}
                    type="checkbox"
                    checked={accessControlled}
                    onChange={(e) => setAccessControlled(e.target.checked)}
                    disabled={disableInputs}
                  />{" "}
                  Is Microsite Access Controlled?
                </label>
              </div>
            </Fragment>
          )}
          <div className={sharedStyles.field}>
            <label htmlFor={`${dataType}-Description`}>Description</label>
            <input
              id={`${dataType}-Description`}
              data-testid={`${dataType}-Description`}
              type="text"
              value={description}
              onChange={(e) => {
                const val = e.target.value;
                setDescription(val);
              }}
              placeholder="Enter Description"
            />
          </div>
        </div>
        {error && (
          <div className={sharedStyles.field}>
            <div className={sharedStyles.error}>{error}</div>
          </div>
        )}
      </form>
    </Pane>
  );
};

export default FormPane;
