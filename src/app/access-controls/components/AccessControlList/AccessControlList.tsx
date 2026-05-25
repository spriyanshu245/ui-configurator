"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import sharedStyles from "@/app/styles/shared.module.scss";
import {
  getAllAccessConfigs,
  deleteAccessConfig,
} from "@/app/services/accessConfigServices";
import { useRouter } from "next/navigation";
import { AccessConfigListing } from "@/app/types/accessControlConfig";
import { useHeaderV2 } from "@/app/context/HeaderContextV2";
import DeleteIcon from "@/app/components/SVGIcons/Delete";
import CopyIcon from "@/app/components/SVGIcons/Copy";
import PlusIcon from "@/app/components/SVGIcons/Plus";
import AccessControlFormPane from "@/app/access-controls/components/AccessControlFormPane/AccessControlFormPane";
import { SearchFieldConfig } from "@/app/utils/searchUtils";
import { useDataList } from "@/app/hooks/useDataList";
import { ColumnConfig, ActionConfig } from "@/app/components/DataList/types";
import ListPageHeader from "@/app/components/DataList/ListPageHeader";
import SearchBar from "@/app/components/DataList/SearchBar";
import DataListTable from "@/app/components/DataList/DataListTable";

type AccessConfigSortColumn = "accessConfigCode" | "micrositeSlug" | "version";

const SEARCH_FIELDS: SearchFieldConfig[] = [
  {
    getValue: (item) => (item as AccessConfigListing).accessConfigCode ?? "",
    priority: "primary",
  },
  {
    getValue: (item) => (item as AccessConfigListing).micrositeSlug ?? "",
    priority: "secondary",
  },
];

const TIEBREAKERS = [
  (item: AccessConfigListing) => (item.accessConfigCode ?? "").toLowerCase(),
  (item: AccessConfigListing) => (item.micrositeSlug ?? "").toLowerCase(),
];

const COLUMNS: ColumnConfig<AccessConfigListing>[] = [
  {
    key: "accessConfigCode",
    label: "Access Config Code",
    sortable: true,
    render: (item) => (
      <div className={sharedStyles.title}>{item.accessConfigCode}</div>
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

const getAccessConfigKey = (item: AccessConfigListing) => item.accessConfigCode;

const AccessControlList = () => {
  const { setUserNotification } = useHeaderV2();
  const router = useRouter();
  const [isFormPaneOpen, setIsFormPaneOpen] = useState(false);
  const [duplicateAccessConfig, setDuplicateAccessConfig] =
    useState<AccessConfigListing | null>(null);

  const dataList = useDataList<AccessConfigListing, AccessConfigSortColumn>({
    searchFields: SEARCH_FIELDS,
    tiebreakers: TIEBREAKERS,
    defaultSort: { column: "accessConfigCode", direction: "asc" },
    getComparableValue: (item, column) => {
      switch (column) {
        case "accessConfigCode":
          return (item.accessConfigCode ?? "").toLowerCase();
        case "micrositeSlug":
          return (item.micrositeSlug ?? "").toLowerCase();
        case "version":
          return item.version ?? 0;
        default:
          return "";
      }
    },
    getItemKey: getAccessConfigKey,
  });

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
    return loadData(getAllAccessConfigs);
  }, [loadData]);

  const handleDeleteFn = useCallback(
    async (accessConfigCode: string) => {
      await deleteAccessConfig(accessConfigCode);
      setUserNotification({
        type: "success",
        text: "Access configuration deleted",
        time: 2000,
      });
    },
    [setUserNotification],
  );

  useEffect(() => {
    setDeleteHandler(handleDeleteFn);
  }, [handleDeleteFn, setDeleteHandler]);

  const handleRowClick = useCallback(
    (item: AccessConfigListing) => {
      const code = item.accessConfigCode;
      if (!code || confirmDeleteKey === code) return;
      const baseUrl = `/access-controls/${encodeURIComponent(code)}`;
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
      item: AccessConfigListing,
    ) => {
      setDuplicateAccessConfig(item);
    },
    [],
  );

  const actions: ActionConfig<AccessConfigListing>[] = useMemo(
    () => [
      {
        key: "duplicate",
        icon: <CopyIcon />,
        label: (item) => `Duplicate configuration ${item.accessConfigCode}`,
        title: (item) => `Duplicate configuration: ${item.accessConfigCode}`,
        onClick: handleDuplicate,
      },
      {
        key: "delete",
        icon: <DeleteIcon />,
        label: (item) => `Delete configuration ${item.accessConfigCode}`,
        title: (item) => `Delete configuration: ${item.accessConfigCode}`,
        isDanger: true,
        onClick: (_e, item) => requestDelete(item.accessConfigCode),
      },
    ],
    [handleDuplicate, requestDelete],
  );

  return (
    <div className={sharedStyles.pageContainer}>
      {!loading && (
        <ListPageHeader title="Access Configurations">
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
            aria-label="Create access configuration"
            title="Create access configuration"
            onClick={() => setIsFormPaneOpen(true)}
          >
            <PlusIcon />
          </button>
        </ListPageHeader>
      )}
      <div className={sharedStyles.listTableContainer}>
        <DataListTable<AccessConfigListing, AccessConfigSortColumn>
          columns={COLUMNS}
          actions={actions}
          displayedData={displayedData}
          getItemKey={getAccessConfigKey}
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
          emptyText="No access configurations available."
          loading={loading}
        />
      </div>
      <AccessControlFormPane
        isOpen={isFormPaneOpen}
        onClose={() => setIsFormPaneOpen(false)}
        onCreated={(accessConfigCode) => {
          router.push(
            `/access-controls/${encodeURIComponent(accessConfigCode)}`,
          );
        }}
      />
      <AccessControlFormPane
        isOpen={duplicateAccessConfig !== null}
        onClose={() => setDuplicateAccessConfig(null)}
        onCreated={(accessConfigCode) => {
          router.push(
            `/access-controls/${encodeURIComponent(accessConfigCode)}`,
          );
        }}
        mode="duplicate"
        sourceAccessConfig={duplicateAccessConfig ?? undefined}
      />
    </div>
  );
};

export default AccessControlList;
