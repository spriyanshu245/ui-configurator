"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import sharedStyles from "@/app/styles/shared.module.scss";
import { useParams, useRouter } from "next/navigation";
import PlusIcon from "@/app/components/SVGIcons/Plus";
import { MicrositesV2 } from "@/app/types/internalTypes";
import { useHeaderV2 } from "@/app/context/HeaderContextV2";
import DeleteIcon from "@/app/components/SVGIcons/Delete";
import EditIcon from "@/app/components/SVGIcons/EditIcon";
import CopyIcon from "@/app/components/SVGIcons/Copy";
import LayersIcon from "@/app/components/SVGIcons/Layers";
import { SearchFieldConfig } from "@/app/utils/searchUtils";
import { getAllRecords } from "@/app/utils/dataTableUtils";
import { DATA_TYPE_CONFIG } from "@/app/utils/constants";
import FormPane from "@/app/components/InternalComponents/Pane/FormPane/FormPane";
import VersioningPane from "@/app/components/InternalComponents/Pane/VersioningPane/VersioningPane";
import Tooltip from "@/app/components/Tooltip/Tooltip";
import { IRequestData } from "@/app/types/types";
import { useDataList } from "@/app/hooks/useDataList";
import { ColumnConfig, ActionConfig } from "@/app/components/DataList/types";
import ListPageHeader from "@/app/components/DataList/ListPageHeader";
import SearchBar from "@/app/components/DataList/SearchBar";
import DataListTable from "@/app/components/DataList/DataListTable";
import { DeleteMicrositeWorkflowResult } from "@/app/utils/micrositeOrchestration";
import DuplicateMicrositePane from "./DuplicateMicrositePane";
import DeleteMicrositeModal from "./DeleteMicrositeModal";

const dataConfig = DATA_TYPE_CONFIG["microsites"];

type MicrositeSortColumn = "name" | "code" | "version";

const MICROSITE_SEARCH_FIELDS: SearchFieldConfig[] = [
  {
    getValue: (item) => (item as MicrositesV2).code ?? "",
    priority: "primary",
  },
  {
    getValue: (item) => (item as MicrositesV2).name ?? "",
    priority: "secondary",
  },
];

const MICROSITE_TIEBREAKERS = [
  (item: MicrositesV2) => (item.name ?? "").toLowerCase(),
  (item: MicrositesV2) => (item.code ?? "").toLowerCase(),
];

const getMicrositeKey = (item: MicrositesV2) => item.code;

const MicrositeList = () => {
  const { setUserNotification } = useHeaderV2();
  const router = useRouter();
  const { workspaceCode } = useParams();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDuplicatePaneOpen, setIsDuplicatePaneOpen] = useState(false);
  const [deleteTargetMicrosite, setDeleteTargetMicrosite] = useState<Pick<
    MicrositesV2,
    "code" | "name"
  > | null>(null);
  const [isVersionDrawerOpen, setIsVersionDrawerOpen] = useState(false);
  const [versionDrawerCode, setVersionDrawerCode] = useState<string | null>(
    null,
  );
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formContext, setFormContext] = useState<
    | {
        code?: string;
        name?: string;
        sourceSystem?: string;
        version?: number;
        accessControlled?: boolean;
        description?: string;
      }
    | undefined
  >(undefined);
  const [duplicateSourceMicrositeCode, setDuplicateSourceMicrositeCode] =
    useState<string | null>(null);
  const [duplicateInitialVersion, setDuplicateInitialVersion] = useState<
    number | undefined
  >(undefined);

  const dataList = useDataList<MicrositesV2, MicrositeSortColumn>({
    searchFields: MICROSITE_SEARCH_FIELDS,
    tiebreakers: MICROSITE_TIEBREAKERS,
    defaultSort: { column: "code", direction: "asc" },
    getComparableValue: (item, column) => {
      switch (column) {
        case "name":
          return (item.name ?? "").toLowerCase();
        case "code":
          return (item.code ?? "").toLowerCase();
        case "version":
          return item.version ?? "";
        default:
          return "";
      }
    },
    getItemKey: getMicrositeKey,
  });

  const {
    setData,
    loading,
    error,
    displayedData,
    copiedKey,
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
    handleCopy,
    handleRowKeyDown,
    loadData,
  } = dataList;

  const fetchMicrosites = useCallback(async () => {
    const requestData: IRequestData = {
      method: "GET",
      endpoint: dataConfig.endpoint,
      headers: { "workspace-code": workspaceCode as string },
    };
    return getAllRecords<MicrositesV2>(requestData);
  }, [workspaceCode]);

  const refreshMicrosites = useCallback(() => {
    loadData(fetchMicrosites);
  }, [fetchMicrosites, loadData]);

  useEffect(() => {
    return loadData(fetchMicrosites);
  }, [fetchMicrosites, loadData]);

  const handleRowClick = useCallback(
    (item: MicrositesV2) => {
      if (!item.code) return;
      const baseUrl = `/workspaces/${workspaceCode}${dataConfig.routeBase}/${item.code}/v${item.version}/configure`;
      const url = searchValue.trim()
        ? `${baseUrl}?backQuery=${encodeURIComponent(searchValue.trim())}`
        : baseUrl;
      router.push(url);
    },
    [router, workspaceCode, searchValue],
  );

  const handleEdit = useCallback(
    (
      e:
        | React.MouseEvent<HTMLButtonElement>
        | React.KeyboardEvent<HTMLButtonElement>,
      item: MicrositesV2,
    ) => {
      e.preventDefault();
      e.stopPropagation();
      if (!item.code) return;
      setFormMode("edit");
      setFormContext({
        code: item.code,
        version: item.version,
        name: item.name,
        sourceSystem: item.sourceSystem,
        accessControlled: !!item.accessControlled,
        description: item.description,
      });
      setIsFormOpen(true);
    },
    [],
  );

  const handleDuplicate = useCallback(
    (
      e:
        | React.MouseEvent<HTMLButtonElement>
        | React.KeyboardEvent<HTMLButtonElement>,
      item: MicrositesV2,
    ) => {
      e.preventDefault();
      e.stopPropagation();
      if (!item.code) return;
      setDuplicateSourceMicrositeCode(item.code);
      setDuplicateInitialVersion(item.version);
      setIsDuplicatePaneOpen(true);
    },
    [],
  );

  const handleVersions = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, item: MicrositesV2) => {
      e.preventDefault();
      e.stopPropagation();
      setVersionDrawerCode(item.code);
      setIsVersionDrawerOpen(true);
    },
    [],
  );

  const handleFormClose = () => {
    setIsFormOpen(false);
    setFormContext(undefined);
    setFormMode("create");
  };

  const handleDuplicateClose = () => {
    setIsDuplicatePaneOpen(false);
    setDuplicateSourceMicrositeCode(null);
    setDuplicateInitialVersion(undefined);
  };

  const handleDeleteWorkflowComplete = useCallback(
    ({ summary }: DeleteMicrositeWorkflowResult) => {
      refreshMicrosites();
      setUserNotification({
        type: summary.result === "success" ? "success" : "info",
        text:
          summary.result === "success"
            ? "Microsite deleted permanently."
            : "Microsite delete completed with skipped operations.",
        time: 2500,
      });
    },
    [refreshMicrosites, setUserNotification],
  );

  const handleUpdateSuccess = (payload: {
    code: string;
    name: string;
    sourceSystem?: string;
    accessControlled?: boolean;
    description?: string;
  }) => {
    setData((prev) =>
      prev.map((entry) =>
        entry.code === payload.code
          ? ({
              ...entry,
              name: payload.name,
              sourceSystem: payload.sourceSystem,
              accessControlled: payload.accessControlled,
              description: payload.description,
            } as MicrositesV2)
          : entry,
      ),
    );
    setUserNotification({
      type: "success",
      text: "microsites updated",
      time: 2000,
    });
  };

  const columns: ColumnConfig<MicrositesV2>[] = useMemo(
    () => [
      { key: "name", label: "Name", sortable: true },
      {
        key: "code",
        label: "Code",
        sortable: true,
        render: (item) => (
          <>
            <div className={sharedStyles.code}>
              <span>{item.code ?? "—"}</span>
            </div>
            <button
              aria-label="Copy"
              data-testid="copy"
              className={`${sharedStyles.copyButton} ${
                copiedKey === item.code ? sharedStyles.copied : ""
              }`}
              onClick={(e) => handleCopy(e, item.code)}
            >
              <div className={sharedStyles.iconWrapper}>
                <CopyIcon />
              </div>
            </button>
          </>
        ),
      },
      {
        key: "version",
        label: "Version",
        sortable: true,
        render: (item) => (item.version ? `v${item.version}` : "—"),
      },
      {
        key: "sourceSystem",
        label: "Source System",
        render: (item) => {
          const val = item.sourceSystem;
          if (!val || val === "null") return "—";
          if (val.endsWith("_LOS")) return "LOS";
          if (val.endsWith("_LMS")) return "LMS";
          if (val.endsWith("_COLLECTIONS")) return "COLLECT";
          return val;
        },
      },
      { key: "lastUpdatedBy", label: "Last Updated By", render: () => "—" },
      { key: "lastUpdatedOn", label: "Last Updated On", render: () => "—" },
    ],
    [copiedKey, handleCopy],
  );

  const actions: ActionConfig<MicrositesV2>[] = useMemo(
    () => [
      {
        key: "edit",
        icon: <EditIcon />,
        label: () => "Edit microsite",
        title: () => "Edit microsite",
        testId: () => "edit-microsite",
        onClick: (e, item) => handleEdit(e, item),
      },
      {
        key: "duplicate",
        icon: <CopyIcon />,
        label: () => "Duplicate microsite",
        title: () => "Duplicate microsite",
        testId: () => "duplicate-microsite",
        onClick: (e, item) => {
          handleDuplicate(e, item);
        },
      },
      {
        key: "versions",
        icon: <LayersIcon />,
        label: () => "Manage versions",
        title: () => "Manage versions",
        testId: () => "manage-versions",
        onClick: (e, item) =>
          handleVersions(e as React.MouseEvent<HTMLButtonElement>, item),
      },
      {
        key: "delete",
        icon: <DeleteIcon />,
        label: () => "Delete microsite",
        title: () => "Delete microsite",
        isDanger: true,
        testId: () => "delete-microsite",
        onClick: (_e, item) => {
          setDeleteTargetMicrosite({
            code: item.code,
            name: item.name,
          });
        },
      },
    ],
    [handleEdit, handleDuplicate, handleVersions],
  );

  return (
    <div className={sharedStyles.pageContainer}>
      {!loading && (
        <ListPageHeader title="All microsites">
          <SearchBar
            placeholder="Search microsites"
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
          <Tooltip text="Create a new microsites">
            <button
              className={sharedStyles.primaryButton}
              aria-label="Create a microsites"
              data-testid="create-microsites"
              onClick={() => {
                setFormMode("create");
                setFormContext(undefined);
                setIsFormOpen(true);
              }}
            >
              <PlusIcon />
            </button>
          </Tooltip>
        </ListPageHeader>
      )}
      <div className={sharedStyles.listTableContainer}>
        <DataListTable<MicrositesV2, MicrositeSortColumn>
          columns={columns}
          actions={actions}
          displayedData={displayedData}
          getItemKey={getMicrositeKey}
          onRowClick={handleRowClick}
          handleRowKeyDown={handleRowKeyDown}
          handleSort={handleSort}
          getSortDirection={getSortDirection}
          confirmDeleteKey={null}
          deletingKey={null}
          onConfirmDelete={(_e) => {}}
          onCancelDelete={(_e) => {}}
          hasSearchTerm={hasSearchTerm}
          error={error}
          loading={loading}
        />
      </div>
      {isFormOpen && (
        <FormPane
          dataType="microsites"
          isOpen={isFormOpen}
          mode={formMode}
          dataToEdit={formContext}
          onClose={handleFormClose}
          onCreated={(createdCode) => {
            setUserNotification({
              type: "success",
              text: "Microsite created.",
              time: 2000,
            });
            router.push(
              `/workspaces/${workspaceCode}${dataConfig.routeBase}/${createdCode}/v1/configure`,
            );
          }}
          onUpdated={handleUpdateSuccess}
        />
      )}
      {isDuplicatePaneOpen && duplicateSourceMicrositeCode && (
        <DuplicateMicrositePane
          isOpen={isDuplicatePaneOpen}
          sourceMicrositeCode={duplicateSourceMicrositeCode}
          initialVersion={duplicateInitialVersion}
          onClose={handleDuplicateClose}
          onCreated={(createdCode) => {
            setUserNotification({
              type: "success",
              text: "Microsite duplicated.",
              time: 2000,
            });
            router.push(
              `/workspaces/${workspaceCode}${dataConfig.routeBase}/${createdCode}/v1/configure`,
            );
          }}
        />
      )}
      {isVersionDrawerOpen && (
        <VersioningPane
          dataType="microsites"
          isOpen={isVersionDrawerOpen}
          code={versionDrawerCode!}
          onClose={() => {
            setIsVersionDrawerOpen(false);
            setVersionDrawerCode(null);
          }}
        />
      )}
      <DeleteMicrositeModal
        isOpen={Boolean(deleteTargetMicrosite)}
        workspaceCode={workspaceCode as string}
        microsite={deleteTargetMicrosite}
        onClose={() => {
          setDeleteTargetMicrosite(null);
        }}
        onWorkflowComplete={handleDeleteWorkflowComplete}
      />
    </div>
  );
};

export default MicrositeList;
