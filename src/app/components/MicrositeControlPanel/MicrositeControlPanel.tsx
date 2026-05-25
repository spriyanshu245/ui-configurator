"use client";
import styles from "@/app/components/MicrositeControlPanel/MicrositeControlPanel.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import { useEffect, useState, useRef, useMemo } from "react";
import PageSelector from "@/app/components/MicrositeBuilder/PageSelector/PageSelector";
import ToggleSwitch from "@/app/components/ToggleSwitch/ToggleSwitch";
import { useMicrosite } from "@/app/context/MicrositeContext";
import { useControlPanel } from "@/app/context/ControlPanelContext";
import { useParams, useRouter } from "next/navigation";
import { IRequestData, Microsite } from "@/app/types/types";
import { apiRequest } from "@/app/services/APIService";
import { saveMicrosite } from "@/app/utils/userTask/userTaskUtils";
import Modal from "../InternalComponents/Modal/Modal";
import OperationProgressModal from "../OperationProgressModal/OperationProgressModal";
import { useHeaderV2 } from "@/app/context/HeaderContextV2";
import GlobeIcon from "../SVGIcons/Globe";
import SaveIcon from "../SVGIcons/Save";
import PreviewIcon from "../SVGIcons/Preview";
import Tooltip from "../Tooltip/Tooltip";
import SearchableDropdown from "../InternalComponents/SearchableDropdown/SearchableDropdown";
import { DATA_TYPE_CONFIG } from "@/app/utils/constants";
import EditIcon from "../SVGIcons/EditIcon";
import useMicrositePageSave from "@/app/hooks/useMicrositePageSave";
import { useUserTask } from "@/app/context/UserTaskContext";
import { UnsavedChangesModal } from "../InternalComponents/UnsavedChangesPopupp/UnsavedChangesPopup";
import { useNavigationGuard } from "@/app/hooks/useNavigationGuard";
import { useTaskComponents } from "@/app/hooks/useUserTaskComponentList";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import ArrowLeftIcon from "../SVGIcons/ArrowLeft";
import {
  createNextDraftMicrositeVersion,
  dedupePageCodes,
  ensureEditableMicrositeVersion,
  OperationProgress as OperationProgressState,
} from "@/app/utils/micrositeOrchestration";

const MicrositeControlPanel = () => {
  const dataConfig = DATA_TYPE_CONFIG["microsites"];
  const {
    microsite,
    activePageCode,
    isEditing,
    hasChanges,
    setActivePage,
    setIsEditing,
    setHasChanges,
  } = useMicrosite();
  const {
    isAutoSave,
    toggleAutoSave,
    isSaveSuccessful,
    canNavigatePageBack,
    canNavigatePageForward,
    goBackPageHistory,
    goForwardPageHistory,
  } = useControlPanel();
  const { hasPageChanges } = useUserTask();
  const { micrositeUrlSlug, workspaceCode, version } = useParams();
  const { resetActivePage } = usePropertyPane();
  const micrositeUrl = `/workspaces/${workspaceCode}/microsites`;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [operationProgressTitle, setOperationProgressTitle] = useState("");
  const [operationProgressDescription, setOperationProgressDescription] =
    useState("");
  const [operationProgress, setOperationProgress] =
    useState<OperationProgressState | null>(null);
  const { setUserNotification } = useHeaderV2();
  const router = useRouter();

  const { handleMicrositeSave, handlePageSave } = useMicrositePageSave();
  const shouldOpenModal = useMemo(
    () => !isAutoSave && (hasChanges || hasPageChanges) && !isSaveSuccessful,
    [isAutoSave, hasChanges, hasPageChanges, isSaveSuccessful],
  );
  const shouldOpenPageHistoryModal = useMemo(
    () => !isAutoSave && hasPageChanges && !isSaveSuccessful,
    [hasPageChanges, isAutoSave, isSaveSuccessful],
  );

  const { showModal, allow, block } = useNavigationGuard(shouldOpenModal);
  const {
    showModal: showPageHistoryModal,
    allow: allowPageHistory,
    block: blockPageHistory,
    guardedNavigate: guardedPageHistoryNavigate,
  } = useNavigationGuard(shouldOpenPageHistoryModal);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedMicrosite = useRef(microsite);
  const prevIsAutoSave = useRef(isAutoSave);
  const [pendingPageHistoryDirection, setPendingPageHistoryDirection] =
    useState<"back" | "forward" | null>(null);
  const { userTask } = useUserTask();
  const micrositeVersion = Number(
    String(version ?? microsite.version ?? 1).replace(/^v/, ""),
  );

  const onConfirm = async () => {
    await handleManualSave();
    allow();
  };

  const movePageHistory = (direction: "back" | "forward") => {
    const moveHistory =
      direction === "back" ? goBackPageHistory : goForwardPageHistory;
    const targetPageCode = moveHistory(activePageCode ?? "");

    if (!targetPageCode) {
      setPendingPageHistoryDirection(null);
      return;
    }

    setActivePage(targetPageCode);
    resetActivePage();
    setPendingPageHistoryDirection(null);
    allowPageHistory();
  };

  const handlePageHistoryConfirm = async (direction: "back" | "forward") => {
    if (hasPageChanges) {
      await handlePageSave();
    }

    movePageHistory(direction);
  };

  const handlePageHistoryStay = () => {
    setPendingPageHistoryDirection(null);
    blockPageHistory();
  };

  const handlePageHistoryNavigation = (direction: "back" | "forward") => {
    if (!activePageCode) {
      return;
    }

    setPendingPageHistoryDirection(direction);
    guardedPageHistoryNavigate(() => handlePageHistoryConfirm(direction));
  };

  const handleSaveShortcut = (event: KeyboardEvent) => {
    if (event.ctrlKey && (event.key === "s" || event.key === "S")) {
      event.preventDefault();
      handleMicrositeSave();
      lastSavedMicrosite.current = microsite;
    }
  };

  const getComparableMicrosite = (microsite: Microsite) => {
    const { lastUpdatedOn, ...rest } = microsite;
    return rest;
  };

  useEffect(() => {
    if (!isAutoSave) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      prevIsAutoSave.current = isAutoSave;
      return;
    }

    const hasChanged =
      JSON.stringify(getComparableMicrosite(microsite)) !==
      JSON.stringify(getComparableMicrosite(lastSavedMicrosite.current));

    const wasAutoSaveJustTurnedOn = !prevIsAutoSave.current && isAutoSave;

    if (hasChanged || wasAutoSaveJustTurnedOn) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      const delay = wasAutoSaveJustTurnedOn ? 0 : 2000;

      autoSaveTimerRef.current = setTimeout(async () => {
        await handleMicrositeSave();
        lastSavedMicrosite.current = microsite;
        autoSaveTimerRef.current = null;
      }, delay);
    }

    prevIsAutoSave.current = isAutoSave;

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [microsite, isAutoSave]);

  const handleManualSave = async () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    await handleMicrositeSave();
    lastSavedMicrosite.current = microsite;
  };

  const componentList = useTaskComponents(userTask);

  useEffect(() => {
    document.addEventListener("keydown", handleSaveShortcut);
    return () => document.removeEventListener("keydown", handleSaveShortcut);
  }, [microsite, hasChanges, hasPageChanges, isEditing, userTask]);

  const handlePublish = async () => {
    const persistedMicrosite = saveMicrosite(microsite);
    const pageCount = dedupePageCodes(
      (persistedMicrosite.pages ?? []).map((page: { pageCode?: string }) =>
        String(page.pageCode ?? ""),
      ),
    ).length;
    const publishTotal = pageCount + 4;

    setOperationProgressTitle("Publishing microsite");
    setOperationProgressDescription(
      "Publishing this version and generating the next editable draft.",
    );
    setOperationProgress({
      phase: "saving",
      label: "Saving current microsite and page changes...",
      current: 1,
      total: publishTotal,
    });

    const saveSuccessful = await handleMicrositeSave();
    if (!saveSuccessful) {
      setOperationProgress(null);
      return;
    }

    try {
      setOperationProgress({
        phase: "publishing",
        label: "Publishing the current microsite version...",
        current: 2,
        total: publishTotal,
      });

      const requestData: IRequestData = {
        endpoint: `${dataConfig.endpoint}/${micrositeUrlSlug}?version=${micrositeVersion}&publish=true`,
        method: "PUT",
        body: persistedMicrosite,
        headers: { "workspace-code": workspaceCode as string },
      };
      await apiRequest(requestData);

      try {
        const nextDraft = await createNextDraftMicrositeVersion({
          workspaceCode: workspaceCode as string,
          sourceMicrosite: persistedMicrosite,
          currentVersion: micrositeVersion,
          onProgress: (progress) =>
            setOperationProgress({
              ...progress,
              current: progress.current + 2,
              total: progress.total + 2,
            }),
        });

        setOperationProgress(null);
        setHasChanges(false);
        setUserNotification({
          text: `Published. Draft v${nextDraft.version} created.`,
          time: 2500,
          type: "success",
        });
      } catch (draftError) {
        setOperationProgress(null);
        setHasChanges(false);
        setUserNotification({
          text:
            draftError instanceof Error
              ? `Published. Draft regeneration failed: ${draftError.message}`
              : "Published. Draft regeneration failed. Use Edit to recreate the draft.",
          time: 5000,
          type: "info",
        });
      }

      router.push(micrositeUrl);
    } catch (error) {
      setOperationProgress(null);
      setUserNotification({
        text: "Publish failed",
        time: 2000,
        type: "error",
      });
    }
  };

  const openInNewTab = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const launchPreview = () => {
    openInNewTab(`preview`);
  };

  const handleItemSelect = (option: any) => {
    const elementId = option.id || option.elementId;

    if (elementId) {
      const targetElement = document.getElementById(elementId);

      if (targetElement) {
        let offset = targetElement.offsetTop;
        let offsetParent = targetElement.offsetParent as HTMLElement;
        while (offsetParent) {
          offset += offsetParent.offsetTop;
          offsetParent = offsetParent.offsetParent as HTMLElement;
        }

        window.scrollTo({
          top: offset - 150,
          behavior: "smooth",
        });
      }
    }
  };
  const searchableOptions = useMemo(() => {
    if (!Array.isArray(componentList)) {
      return [];
    }

    return componentList.map((component) => ({
      id: String(component.id ?? ""),
      label: String(
        component.text ??
          component.label ??
          component.name ??
          component.type ??
          "",
      ),
      keys: {
        type: String(component.type ?? ""),
        name: String(component.name ?? ""),
        label: String(component.label ?? ""),
        text: String(component.text ?? ""),
      },
      tagName: String(component.type ?? ""),
    }));
  }, [componentList]);

  const onEdit = async () => {
    if (isEditing) {
      setIsEditing(true);
      return;
    }

    try {
      setOperationProgressTitle("Opening editable draft");
      setOperationProgressDescription(
        "Checking for an editable draft and creating one if needed.",
      );
      setOperationProgress({
        phase: "checking-draft",
        label: "Checking for an editable draft...",
        current: 1,
        total: 1,
      });

      const editableDraft = await ensureEditableMicrositeVersion({
        workspaceCode: workspaceCode as string,
        micrositeCode: micrositeUrlSlug as string,
        onProgress: (progress) =>
          setOperationProgress({
            ...progress,
            current: progress.current + 1,
            total: progress.total + 1,
          }),
      });

      if (editableDraft.version === micrositeVersion) {
        setOperationProgress(null);
        setIsEditing(true);
        return;
      }

      setOperationProgress(null);
      if (editableDraft.created) {
        setUserNotification({
          text: `Draft v${editableDraft.version} created.`,
          time: 2500,
          type: "success",
        });
      }

      router.push(
        `/workspaces/${workspaceCode}${dataConfig.routeBase}/${micrositeUrlSlug}/v${editableDraft.version}/configure`,
      );
    } catch (editError) {
      setOperationProgress(null);
      setUserNotification({
        text:
          editError instanceof Error
            ? editError.message
            : "Unable to open an editable draft.",
        time: 4000,
        type: "error",
      });
    }
  };

  return (
    <div className={styles.controlPanelContainer}>
      <div className={`${styles.innerPanel} ${styles.leftPanel}`}>
        <Tooltip text="Previous Page">
          <button
            className={`${sharedStyles.iconButton} ${sharedStyles.smallSvg}`}
            onClick={() => handlePageHistoryNavigation("back")}
            disabled={!canNavigatePageBack}
            aria-label="Previous Page"
            data-testid="page-history-back"
          >
            <span className={styles.pageHistoryIcon}>
              <ArrowLeftIcon />
            </span>
          </button>
        </Tooltip>
        <Tooltip text="Next Page">
          <button
            className={`${sharedStyles.iconButton} ${sharedStyles.smallSvg}`}
            onClick={() => handlePageHistoryNavigation("forward")}
            disabled={!canNavigatePageForward}
            aria-label="Next Page"
            data-testid="page-history-forward"
          >
            <span
              className={`${styles.pageHistoryIcon} ${styles.pageHistoryIconNext}`}
            >
              <ArrowLeftIcon />
            </span>
          </button>
        </Tooltip>
        <PageSelector />
      </div>
      <div className={`${styles.innerPanel} ${styles.rightPanel}`}>
        <ToggleSwitch
          size="medium"
          label="Auto Save"
          onToggle={toggleAutoSave}
          isToggled={isAutoSave}
          disabled={false}
        />
        <SearchableDropdown
          options={searchableOptions}
          onItemSelect={handleItemSelect}
          placeholder="Search components..."
          debounceTime={350}
          displayKeys={["name"]}
        />

        {!isAutoSave && (
          <Tooltip
            text={
              isEditing && (hasChanges || hasPageChanges)
                ? "Save"
                : "No changes to save"
            }
          >
            <button
              disabled={!isEditing || (!hasChanges && !hasPageChanges)}
              className={`${sharedStyles.iconButton} ${sharedStyles.smallHeightSvg}`}
              onClick={handleManualSave}
              aria-label="Save"
            >
              <SaveIcon />
            </button>
          </Tooltip>
        )}
        {!isEditing && (
          <Tooltip text="edit">
            <button
              className={`${sharedStyles.iconButton} ${sharedStyles.smallHeightSvg}`}
              aria-label="Edit"
              onClick={onEdit}
            >
              <EditIcon />
            </button>
          </Tooltip>
        )}
        <Tooltip text="Preview">
          <button
            className={`${sharedStyles.iconButton} ${sharedStyles.smallHeightSvg}`}
            onClick={launchPreview}
            aria-label="Preview"
          >
            <PreviewIcon />
          </button>
        </Tooltip>
        <Tooltip text="Publish">
          <button
            className={`${sharedStyles.iconButton} ${sharedStyles.smallHeightSvg}`}
            onClick={() => setIsModalOpen(true)}
            disabled={!isEditing}
            data-testid="publish"
            aria-label="Publish"
          >
            <GlobeIcon />
          </button>
        </Tooltip>
      </div>
      <Modal
        isOpen={isModalOpen}
        backDrop={() => {
          setIsModalOpen(false);
        }}
        onClose={() => {
          setIsModalOpen(false);
        }}
        data-testid="modal"
        onSubmit={() => {
          setIsModalOpen(false);
          handlePublish();
        }}
        title={"Confirm Publish"}
        description={"Are you sure you want to publish this microsite?"}
        submitText={"Publish"}
        cancelText="Cancel"
      />
      <OperationProgressModal
        isOpen={Boolean(operationProgress)}
        title={operationProgressTitle}
        description={operationProgressDescription}
        progress={operationProgress}
      />
      {!isAutoSave && showModal && (
        <UnsavedChangesModal
          open={showModal}
          onConfirm={onConfirm}
          onCancel={allow}
          backDrop={block}
        />
      )}
      {!isAutoSave && !showModal && showPageHistoryModal && (
        <UnsavedChangesModal
          open={showPageHistoryModal}
          onConfirm={() => {
            if (!pendingPageHistoryDirection) {
              return;
            }

            handlePageHistoryConfirm(pendingPageHistoryDirection);
          }}
          onCancel={() => {
            if (!pendingPageHistoryDirection) {
              return;
            }

            movePageHistory(pendingPageHistoryDirection);
          }}
          backDrop={handlePageHistoryStay}
        />
      )}
    </div>
  );
};

export default MicrositeControlPanel;
