"use client";

import { useMicrosite } from "@/app/context/MicrositeContext";
import { usePropertyPane } from "@/app/context/PropertiesContext";
import sharedStyles from "@/app/styles/shared.module.scss";
import Tooltip from "../../Tooltip/Tooltip";
import SettingsIcon from "../../SVGIcons/Settings";
import NewIcon from "../../SVGIcons/New";
import { useEffect, useMemo, useState } from "react";
import FormPane from "../../InternalComponents/Pane/FormPane/FormPane";
import useMicrositePageSave from "@/app/hooks/useMicrositePageSave";
import useDurableMicrositePageCreation from "@/app/hooks/useDurableMicrositePageCreation";
import { useUserTask } from "@/app/context/UserTaskContext";
import { useControlPanel } from "@/app/context/ControlPanelContext";
import { useNavigationGuard } from "@/app/hooks/useNavigationGuard";
import { UnsavedChangesModal } from "../../InternalComponents/UnsavedChangesPopupp/UnsavedChangesPopup";
import SelectDropdown, {
  DropdownOption,
} from "../../InternalComponents/SelectDropdown/SelectDropdown";
import { scrollToTop } from "@/app/utils/utils";

export default function PageSelector() {
  const [selectedPageCode, setSelectedPageCode] = useState("");
  const { microsite, setActivePage, activePageCode } = useMicrosite();
  const { setActivePage: setActivePropertyPage, resetActivePage } =
    usePropertyPane();
  const { hasPageChanges } = useUserTask();

  const { isAutoSave, isSaveSuccessful, pushPageHistory } = useControlPanel();
  const shouldOpenModal = useMemo(
    () => !isAutoSave && hasPageChanges && !isSaveSuccessful,
    [isAutoSave, hasPageChanges, isSaveSuccessful],
  );
  const { showModal, allow, block, guardedNavigate } =
    useNavigationGuard(shouldOpenModal);

  const { handlePageSave } = useMicrositePageSave();
  const { persistCreatedPage } = useDurableMicrositePageCreation();

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

  const pages = microsite?.pages ?? [];
  const [isFormOpen, setIsFormOpen] = useState(false);
  const hasPages = pages.length > 0;

  useEffect(() => {
    if (pages.length === 0) {
      setIsFormOpen(true);
    }
  }, [pages.length]);

  const handlePageChange = (pageCode: string) => {
    if (!pageCode || pageCode === activePageCode) {
      return;
    }

    setSelectedPageCode(pageCode);
    guardedNavigate(() => onConfirm(pageCode));
  };

  const openPageSettings = () => {
    if (!activePageCode) return;
    setActivePropertyPage(activePageCode);
  };

  const openCreatePane = () => {
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
  };

  const handleCreateSuccess = async (createdCode: string) => {
    await persistCreatedPage(createdCode);
    scrollToTop();
    setIsFormOpen(false);
  };

  const isValidActivePage = pages.some(
    (page) => page.pageCode === activePageCode,
  );

  const safeActivePageId = isValidActivePage ? activePageCode! : "";

  const pageOptions: DropdownOption[] = useMemo(
    () =>
      pages
        .filter((page) => !!page.pageCode)
        .map((page) => ({
          value: page.pageCode,
          label: page.pageCode.includes("_")
            ? page.pageCode.substring(page.pageCode.indexOf("_") + 1)
            : page.pageCode,
        })),
    [pages],
  );

  return (
    <div className={sharedStyles.pageSelector}>
      <div className={sharedStyles.tabs}>
        {hasPages && (
          <>
            <SelectDropdown
              id="page-selector"
              options={pageOptions}
              value={safeActivePageId}
              onChange={handlePageChange}
              placeholder="Select a Page"
              usePortal
              minWidth={400}
            />

            <Tooltip text="Page Settings">
              <button
                data-testid="pageSettings"
                className={`${sharedStyles.iconButton} ${sharedStyles.smallHeightSvg}`}
                onClick={openPageSettings}
              >
                <SettingsIcon />
              </button>
            </Tooltip>
          </>
        )}

        <Tooltip text="Add New Page">
          <button
            data-testid="addNewPage"
            className={`${sharedStyles.iconButton} ${sharedStyles.smallHeightSvg}`}
            onClick={openCreatePane}
          >
            <NewIcon />
          </button>
        </Tooltip>
      </div>

      {isFormOpen && (
        <FormPane
          dataType="pages"
          isOpen={isFormOpen}
          mode="create"
          dataToEdit={undefined}
          sourceDsl={null}
          onClose={handleFormClose}
          onCreated={handleCreateSuccess}
          micrositeCode={microsite.code}
        />
      )}
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
}
