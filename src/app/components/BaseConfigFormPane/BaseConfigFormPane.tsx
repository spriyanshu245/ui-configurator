"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Pane from "@/app/components/InternalComponents/Pane/Pane";
import SelectDropdown from "@/app/components/InternalComponents/SelectDropdown/SelectDropdown";
import FormPaneFooter from "@/app/components/InternalComponents/FormPaneFooter/FormPaneFooter";
import sharedStyles from "@/app/styles/shared.module.scss";
import { Microsite, WorkspaceItem } from "@/app/types/types";

interface Props<T> {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (code: string) => void;
  mode?: "create" | "duplicate";
  sourceConfig?: T;
  inputLabel: string;
  title: string;
  duplicateLabel: string;
  placeholder: string;

  getSourceCode: (source: T) => string;

  onSubmitHandler: (data: {
    code: string;
    microsite: Microsite;
    sourceConfig?: T;
    isDuplicate: boolean;
  }) => Promise<void>;

  workspaceHook: {
    workspaces: WorkspaceItem[];
    selectedWorkspace: WorkspaceItem | null;
    setSelectedWorkspace: (w: WorkspaceItem | null) => void;
    micrositeVersions: Microsite[];
    selectedMicrosite: Microsite | null;
    setSelectedMicrosite: (m: Microsite | null) => void;
    loadingWorkspaces: boolean;
    loadingMicrosites: boolean;
  };
}

const BaseConfigFormPane = <T,>({
  isOpen,
  onClose,
  onCreated,
  mode = "create",
  sourceConfig,
  title,
  inputLabel,
  duplicateLabel,
  placeholder,
  getSourceCode,
  onSubmitHandler,
  workspaceHook,
}: Props<T>) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const isDuplicateMode = mode === "duplicate";

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    workspaces,
    selectedWorkspace,
    setSelectedWorkspace,
    micrositeVersions,
    selectedMicrosite,
    setSelectedMicrosite,
    loadingWorkspaces,
    loadingMicrosites,
  } = workspaceHook;

  useEffect(() => {
    if (!isOpen) {
      setCode("");
      setError(null);
    }
  }, [isOpen]);

  const getMicrositePlaceholder = (): string => {
    if (!selectedWorkspace) {
      return "Select a workspace first";
    }
    if (loadingMicrosites) {
      return "Loading microsites...";
    }
    return "Select a microsite";
  };

  const isValid = useMemo(() => {
    return code.trim() && selectedWorkspace && selectedMicrosite;
  }, [code, selectedWorkspace, selectedMicrosite]);

  const handleSubmit = async () => {
    if (!isValid || !selectedMicrosite) return;

    try {
      setSubmitting(true);
      await onSubmitHandler({
        code: code.trim(),
        microsite: selectedMicrosite,
        sourceConfig,
        isDuplicate: isDuplicateMode,
      });

      onCreated?.(code.trim());
      onClose();
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Pane
      isOpen={isOpen}
      onClose={onClose}
      minWidth={400}
      title={title}
      paneFooter={
        <FormPaneFooter
          onCancel={onClose}
          onSubmit={handleSubmit}
          isSubmitting={submitting}
          isValid={!!isValid}
          submitLabel={isDuplicateMode ? "Duplicate" : undefined}
        />
      }
    >
      <form className={sharedStyles.form}>
        {isDuplicateMode && sourceConfig && (
          <div className={sharedStyles.info}>
            {duplicateLabel} <strong>{getSourceCode(sourceConfig)}</strong>
          </div>
        )}

        {error && <div className={sharedStyles.error}>{error}</div>}
        <div className={sharedStyles.field}>
          <label
            htmlFor={`${inputLabel.toLowerCase().replaceAll(" ", "-")}-code`}
          >
            {inputLabel} Code*
          </label>
          <input
            id={`${inputLabel.toLowerCase().replaceAll(" ", "-")}-code`}
            ref={inputRef}
            value={code}
            onChange={(e) => setCode(e.target.value.replaceAll(/\s/g, ""))}
            placeholder={placeholder}
          />
        </div>
        <div className={sharedStyles.field}>
          <label htmlFor="workspace-select">Workspace*</label>
          <SelectDropdown
            id="workspace-select"
            options={workspaces.map((w) => ({
              value: w.code,
              label: w.name,
            }))}
            value={selectedWorkspace?.code ?? ""}
            onChange={(val) =>
              setSelectedWorkspace(
                workspaces.find((w) => w.code === val) || null
              )
            }
            loading={loadingWorkspaces}
            placeholder="Select a workspace"
            disabled={submitting}
            loadingText="Loading workspaces..."
          />
        </div>
        <div className={sharedStyles.field}>
          <label htmlFor="microsite-select">Microsite*</label>
          <SelectDropdown
            id="microsite-select"
            options={micrositeVersions.map((m) => ({
              value: `${m.code}|${m.version}`,
              label: `${m.name} v${m.version}`,
            }))}
            value={
              selectedMicrosite
                ? `${selectedMicrosite.code}|${selectedMicrosite.version}`
                : ""
            }
            onChange={(val) =>
              setSelectedMicrosite(
                micrositeVersions.find(
                  (m) => `${m.code}|${m.version}` === val
                ) || null
              )
            }
            loading={loadingMicrosites}
            placeholder={getMicrositePlaceholder()}
            disabled={!selectedWorkspace || submitting}
            loadingText="Loading microsites..."
          />
        </div>
      </form>
    </Pane>
  );
};

export default BaseConfigFormPane;
