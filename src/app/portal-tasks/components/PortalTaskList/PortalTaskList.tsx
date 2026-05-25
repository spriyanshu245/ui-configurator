"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import sharedStyles from "@/app/styles/shared.module.scss";
import {
  getAllPortalTaskConfigs,
  deletePortalTaskConfig,
} from "@/app/services/portalTaskServices";
import { useRouter } from "next/navigation";
import { PortalTaskConfigListing } from "@/app/types/accessControlConfig";
import { useHeaderV2 } from "@/app/context/HeaderContextV2";
import DeleteIcon from "@/app/components/SVGIcons/Delete";
import CopyIcon from "@/app/components/SVGIcons/Copy";
import PlusIcon from "@/app/components/SVGIcons/Plus";
import PortalTaskFormPaneFormPane from "@/app/portal-tasks/components/PortalTaskFormPane/PortalTaskFormPane";
import { SearchFieldConfig } from "@/app/utils/searchUtils";
import { useDataList } from "@/app/hooks/useDataList";
import { ColumnConfig, ActionConfig } from "@/app/components/DataList/types";
import ListPageHeader from "@/app/components/DataList/ListPageHeader";
import SearchBar from "@/app/components/DataList/SearchBar";
import DataListTable from "@/app/components/DataList/DataListTable";

type AccessConfigSortColumn =
  | "portalTaskConfigCode"
  | "micrositeSlug"
  | "version";

const SEARCH_FIELDS: SearchFieldConfig[] = [
  {
    getValue: (item) =>
      (item as PortalTaskConfigListing).portalTaskConfigCode ?? "",
    priority: "primary",
  },
  {
    getValue: (item) => (item as PortalTaskConfigListing).micrositeSlug ?? "",
    priority: "secondary",
  },
];

const TIEBREAKERS = [
  (item: PortalTaskConfigListing) =>
    (item.portalTaskConfigCode ?? "").toLowerCase(),
  (item: PortalTaskConfigListing) => (item.micrositeSlug ?? "").toLowerCase(),
];

const COLUMNS: ColumnConfig<PortalTaskConfigListing>[] = [
  {
    key: "portalTaskConfigCode",
    label: "Portal Task Config Code",
    sortable: true,
    render: (item) => (
      <div className={sharedStyles.title}>{item.portalTaskConfigCode}</div>
    ),
  },
  {
    key: "micrositeSlug",
    label: "Microsite Slug",
    sortable: true,
    render: (item) => item.micrositeSlug ?? "-",
  },
  {
    key: "version",
    label: "Version",
    sortable: true,
    render: (item) => `v${item.version}`,
  },
];

const getPortalTaskConfigKey = (item: PortalTaskConfigListing) =>
  item.portalTaskConfigCode;

const PortalTaskList = () => {
  const { setUserNotification } = useHeaderV2();
  const router = useRouter();
  const [isFormPaneOpen, setIsFormPaneOpen] = useState(false);
  const [duplicatePortalTaskConfig, setDuplicatePortalTaskConfig] =
    useState<PortalTaskConfigListing | null>(null);

  const dataList = useDataList<PortalTaskConfigListing, AccessConfigSortColumn>(
    {
      searchFields: SEARCH_FIELDS,
      tiebreakers: TIEBREAKERS,
      defaultSort: { column: "portalTaskConfigCode", direction: "asc" },
      getComparableValue: (item, column) => {
        switch (column) {
          case "portalTaskConfigCode":
            return (item.portalTaskConfigCode ?? "").toLowerCase();
          case "micrositeSlug":
            return (item.micrositeSlug ?? "").toLowerCase();
          case "version":
            return item.version ?? 0;
          default:
            return "";
        }
      },
      getItemKey: getPortalTaskConfigKey,
    },
  );

  const {
    loading,
    displayedData,
    confirmDeleteKey,
    deletingKey,
    searchValue,
    isSearchOpen,
    isPending,
    hasSearchTerm,
    searchInputRef,
    searchContainerRef,
    handleSearchToggle,
    handleSearchChange,
    handleSearchKeyDown,
    clearSearch,
    focusSearchInput,
    handleSort,
    getSortDirection,
    requestDelete,
    setDeleteHandler,
    handleConfirmDelete,
    handleCancelDelete,
    handleRowKeyDown,
    loadData,
  } = dataList;

  useEffect(() => {
    return loadData(getAllPortalTaskConfigs);
  }, [loadData]);

  const handleDeleteFn = useCallback(
    async (portalTaskConfigCode: string) => {
      await deletePortalTaskConfig(portalTaskConfigCode);
      setUserNotification({
        type: "success",
        text: "Portal Task configuration deleted",
        time: 2000,
      });
    },
    [setUserNotification],
  );

  useEffect(() => {
    setDeleteHandler(handleDeleteFn);
  }, [handleDeleteFn, setDeleteHandler]);

  const handleRowClick = useCallback(
    (item: PortalTaskConfigListing) => {
      const code = item.portalTaskConfigCode;
      if (!code || confirmDeleteKey === code) return;
      const baseUrl = `/portal-tasks/${encodeURIComponent(code)}`;
      const url = searchValue.trim()
        ? `${baseUrl}?backQuery=${encodeURIComponent(searchValue.trim())}`
        : baseUrl;
      router.push(url);
    },
    [router, confirmDeleteKey, searchValue],
  );

  const handleDuplicate = useCallback(
    (
      _e:
        | React.KeyboardEvent<HTMLButtonElement>
        | React.MouseEvent<HTMLButtonElement, MouseEvent>,
      item: PortalTaskConfigListing,
    ) => {
      setDuplicatePortalTaskConfig(item);
    },
    [],
  );

  const actions: ActionConfig<PortalTaskConfigListing>[] = useMemo(
    () => [
      {
        key: "duplicate",
        icon: <CopyIcon />,
        label: (item) => `Duplicate configuration ${item.portalTaskConfigCode}`,
        title: (item) =>
          `Duplicate configuration: ${item.portalTaskConfigCode}`,
        onClick: handleDuplicate,
      },
      {
        key: "delete",
        icon: <DeleteIcon />,
        label: (item) => `Delete configuration ${item.portalTaskConfigCode}`,
        title: (item) => `Delete configuration: ${item.portalTaskConfigCode}`,
        isDanger: true,
        onClick: (_e, item) => requestDelete(item.portalTaskConfigCode),
      },
    ],
    [handleDuplicate, requestDelete],
  );

  return (
    <div className={sharedStyles.pageContainer}>
      {!loading && (
        <ListPageHeader title="Portal Task Configurations">
          <SearchBar
            placeholder="Search configurations"
            searchValue={searchValue}
            isSearchOpen={isSearchOpen}
            isPending={isPending}
            hasSearchTerm={hasSearchTerm}
            searchInputRef={searchInputRef}
            searchContainerRef={searchContainerRef}
            onToggle={handleSearchToggle}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            onClear={() => {
              clearSearch();
              focusSearchInput();
            }}
          />
          <button
            type="button"
            className={sharedStyles.primaryButton}
            aria-label="Create portal task configuration"
            title="Create portal task configuration"
            onClick={() => setIsFormPaneOpen(true)}
          >
            <PlusIcon />
          </button>
        </ListPageHeader>
      )}
      <div className={sharedStyles.listTableContainer}>
        <DataListTable<PortalTaskConfigListing, AccessConfigSortColumn>
          columns={COLUMNS}
          actions={actions}
          displayedData={displayedData}
          getItemKey={getPortalTaskConfigKey}
          onRowClick={handleRowClick}
          handleRowKeyDown={handleRowKeyDown}
          handleSort={handleSort}
          getSortDirection={getSortDirection}
          confirmDeleteKey={confirmDeleteKey}
          deletingKey={deletingKey}
          onConfirmDelete={handleConfirmDelete}
          onCancelDelete={handleCancelDelete}
          hasSearchTerm={hasSearchTerm}
          emptySearchText="No configurations found matching your search."
          emptyText="No portal task configurations available."
          loading={loading}
        />
      </div>
      <PortalTaskFormPaneFormPane
        isOpen={isFormPaneOpen}
        onClose={() => setIsFormPaneOpen(false)}
        onCreated={(portalTaskConfigCode) => {
          router.push(
            `/portal-tasks/${encodeURIComponent(portalTaskConfigCode)}`,
          );
        }}
      />
      <PortalTaskFormPaneFormPane
        isOpen={duplicatePortalTaskConfig !== null}
        onClose={() => setDuplicatePortalTaskConfig(null)}
        onCreated={(portalTaskConfigCode) => {
          router.push(
            `/portal-tasks/${encodeURIComponent(portalTaskConfigCode)}`,
          );
        }}
        mode="duplicate"
        sourcePortalTaskConfig={duplicatePortalTaskConfig ?? undefined}
      />
    </div>
  );
};

export default PortalTaskList;
