"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import sharedStyles from "@/app/styles/shared.module.scss";
import { getAllTemplates, deleteTemplate } from "@/app/documents/templates/services";
import { useRouter } from "next/navigation";
import PlusIcon from "@/app/components/SVGIcons/Plus";
import { TemplateListing } from "@/app/template-designer/types";
import { useHeaderV2 } from "@/app/context/HeaderContextV2";
import DeleteIcon from "@/app/components/SVGIcons/Delete";
import CopyIcon from "@/app/components/SVGIcons/Copy";
import { SearchFieldConfig } from "@/app/utils/searchUtils";
import TemplateFormPane from "@/app/documents/templates/components/TemplateFormPane/TemplateFormPane";
import { useDataList } from "@/app/hooks/useDataList";
import { ColumnConfig, ActionConfig } from "@/app/components/DataList/types";
import ListPageHeader from "@/app/components/DataList/ListPageHeader";
import SearchBar from "@/app/components/DataList/SearchBar";
import DataListTable from "@/app/components/DataList/DataListTable";

type TemplateSortColumn = "name" | "mimeType" | "category";

const TEMPLATE_SEARCH_FIELDS: SearchFieldConfig[] = [
  {
    getValue: (item) => (item as TemplateListing).name ?? "",
    priority: "primary",
  },
  {
    getValue: (item) => (item as TemplateListing).mimeType ?? "",
    priority: "secondary",
  },
  {
    getValue: (item) => (item as TemplateListing).category ?? "",
    priority: "secondary",
  },
];

const TEMPLATE_TIEBREAKERS = [
  (item: TemplateListing) => (item.name ?? "").toLowerCase(),
  (item: TemplateListing) => (item.mimeType ?? "").toLowerCase(),
];

const COLUMNS: ColumnConfig<TemplateListing>[] = [
  {
    key: "name",
    label: "Name",
    sortable: true,
    render: (item) => <div className={sharedStyles.title}>{item.name}</div>,
  },
  {
    key: "mimeType",
    label: "MIME Type",
    sortable: true,
    render: (item) => item.mimeType ?? "-",
  },
  { key: "category", label: "Category", sortable: true },
];

const getTemplateItemKey = (item: TemplateListing) => item.id;

interface TemplateListProps {
  baseRoute?: string;
  title?: string;
}

const TemplateList = ({
  baseRoute = "/documents/templates",
  title = "All Templates",
}: TemplateListProps) => {
  const { setUserNotification } = useHeaderV2();
  const router = useRouter();
  const [isCreatePaneOpen, setIsCreatePaneOpen] = useState(false);
  const [isDuplicatePaneOpen, setIsDuplicatePaneOpen] = useState(false);
  const [duplicateSourceTemplate, setDuplicateSourceTemplate] =
    useState<TemplateListing | null>(null);

  const dataList = useDataList<TemplateListing, TemplateSortColumn>({
    searchFields: TEMPLATE_SEARCH_FIELDS,
    tiebreakers: TEMPLATE_TIEBREAKERS,
    defaultSort: { column: "name", direction: "asc" },
    getComparableValue: (item, column) => {
      switch (column) {
        case "name":
          return (item.name ?? "").toLowerCase();
        case "mimeType":
          return (item.mimeType ?? "").toLowerCase();
        case "category":
          return (item.category ?? "").toLowerCase();
        default:
          return "";
      }
    },
    getItemKey: getTemplateItemKey,
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
    return loadData(getAllTemplates);
  }, [loadData]);

  const handleDeleteFn = useCallback(
    async (id: string) => {
      await deleteTemplate(id);
      setUserNotification({
        type: "success",
        text: "Template deleted",
        time: 2000,
      });
    },
    [setUserNotification],
  );

  useEffect(() => {
    setDeleteHandler(handleDeleteFn);
  }, [handleDeleteFn, setDeleteHandler]);

  const handleDuplicate = useCallback(
    (
      _e:
        | React.MouseEvent<HTMLButtonElement>
        | React.KeyboardEvent<HTMLButtonElement>,
      item: TemplateListing,
    ) => {
      setDuplicateSourceTemplate(item);
      setIsDuplicatePaneOpen(true);
    },
    [],
  );

  const handleRowClick = useCallback(
    (item: TemplateListing) => {
      if (!item.id || confirmDeleteKey === item.id) return;
      const baseUrl = `${baseRoute}/${encodeURIComponent(item.id)}`;
      const url = searchValue.trim()
        ? `${baseUrl}?backQuery=${encodeURIComponent(searchValue.trim())}`
        : baseUrl;
      router.push(url);
    },
    [router, confirmDeleteKey, searchValue, baseRoute],
  );

  const actions: ActionConfig<TemplateListing>[] = useMemo(
    () => [
      {
        key: "duplicate",
        icon: <CopyIcon />,
        label: (item) => `Duplicate template ${item.name}`,
        title: (item) => `Duplicate template: ${item.name}`,
        isDanger: false,
        onClick: handleDuplicate,
      },
      {
        key: "delete",
        icon: <DeleteIcon />,
        label: (item) => `Delete template ${item.name}`,
        title: (item) => `Delete template: ${item.name}`,
        isDanger: true,
        onClick: (_e, item) => requestDelete(item.id),
      },
    ],
    [handleDuplicate, requestDelete],
  );

  return (
    <div className={sharedStyles.pageContainer}>
      {!loading && (
        <ListPageHeader title={title}>
          <SearchBar
            placeholder="Search templates"
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
            className={sharedStyles.primaryButton}
            aria-label="Create template"
            title="Create a template"
            onClick={() => setIsCreatePaneOpen(true)}
          >
            <PlusIcon />
          </button>
        </ListPageHeader>
      )}
      <div className={sharedStyles.listTableContainer}>
        <DataListTable<TemplateListing, TemplateSortColumn>
          columns={COLUMNS}
          actions={actions}
          displayedData={displayedData}
          getItemKey={getTemplateItemKey}
          onRowClick={handleRowClick}
          handleRowKeyDown={handleRowKeyDown}
          handleSort={handleSort}
          getSortDirection={getSortDirection}
          confirmDeleteKey={confirmDeleteKey}
          deletingKey={deletingKey}
          onConfirmDelete={handleConfirmDelete}
          onCancelDelete={handleCancelDelete}
          hasSearchTerm={hasSearchTerm}
          emptySearchText="No templates found matching your search."
          emptyText="No templates available."
          loading={loading}
        />
      </div>
      <TemplateFormPane
        isOpen={isCreatePaneOpen}
        onClose={() => setIsCreatePaneOpen(false)}
        onCreated={(templateId) => {
          setUserNotification({
            type: "success",
            text: "Template created successfully",
            time: 2000,
          });
          router.push(`${baseRoute}/${encodeURIComponent(templateId)}`);
        }}
      />
      <TemplateFormPane
        isOpen={isDuplicatePaneOpen}
        mode="duplicate"
        sourceTemplate={duplicateSourceTemplate}
        onClose={() => {
          setIsDuplicatePaneOpen(false);
          setDuplicateSourceTemplate(null);
        }}
        onCreated={(templateId) => {
          loadData(getAllTemplates);
          setUserNotification({
            type: "success",
            text: "Template duplicated successfully",
            time: 2000,
          });
          router.push(`${baseRoute}/${encodeURIComponent(templateId)}`);
        }}
      />
    </div>
  );
};

export default TemplateList;
