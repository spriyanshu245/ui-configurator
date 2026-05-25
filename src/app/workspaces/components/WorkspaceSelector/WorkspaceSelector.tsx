"use client";
import { useRef, useState, useEffect, KeyboardEvent } from "react";
import { WorkspaceItem, IRequestData } from "@/app/types/types";
import { createRecord } from "@/app/utils/dataTableUtils";
import { toCode } from "@/app/utils/utils";
import { DATA_TYPE_CONFIG } from "@/app/utils/constants";
import PlusIcon from "@/app/components/SVGIcons/Plus";
import SearchIcon from "@/app/components/SVGIcons/Search";
import ChevronDownIcon from "@/app/components/SVGIcons/ChevronDown";
import WorkspaceChip from "./WorkspaceChip";
import styles from "./WorkspaceSelector.module.scss";

const dataConfig = DATA_TYPE_CONFIG["workspace"];

interface WorkspaceSelectorProps {
  workspaces: WorkspaceItem[];
  selectedCode: string | null;
  onSelect: (code: string) => void;
  onCreated: (code: string, name: string) => void;
  onUpdated: (payload: { code: string; name: string }) => void;
  onDelete: (item: WorkspaceItem) => void;
}

const WorkspaceSelector = ({
  workspaces,
  selectedCode,
  onSelect,
  onCreated,
  onUpdated,
  onDelete,
}: WorkspaceSelectorProps) => {
  const [isExpanded, setIsExpanded] = useState(!selectedCode);
  const [searchValue, setSearchValue] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showFadeRight, setShowFadeRight] = useState(false);

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [codeEdited, setCodeEdited] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const selectedWorkspace =
    workspaces.find((ws) => ws.code === selectedCode) ?? null;

  const filteredWorkspaces = searchValue.trim()
    ? workspaces.filter(
        (ws) =>
          ws.name.toLowerCase().includes(searchValue.toLowerCase()) ||
          ws.code.toLowerCase().includes(searchValue.toLowerCase()),
      )
    : workspaces;

  useEffect(() => {
    if (!isExpanded) return;
    const el = scrollRef.current;
    if (!el) return;
    const checkOverflow = () => {
      setShowFadeRight(el.scrollWidth > el.clientWidth + el.scrollLeft + 1);
    };
    checkOverflow();
    el.addEventListener("scroll", checkOverflow);
    const observer = new ResizeObserver(checkOverflow);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", checkOverflow);
      observer.disconnect();
    };
  }, [filteredWorkspaces.length, isCreating, isExpanded]);

  useEffect(() => {
    if (isCreating) {
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  }, [isCreating]);

  const handleToggleExpand = () => {
    setIsExpanded((prev) => {
      if (prev) {
        setIsSearchOpen(false);
        setSearchValue("");
      }
      return !prev;
    });
  };

  const handleChipSelect = (code: string) => {
    onSelect(code);
    setIsExpanded(false);
    setIsSearchOpen(false);
    setSearchValue("");
  };

  const handleSearchToggle = () => {
    setIsSearchOpen((prev) => {
      const opening = !prev;
      if (opening) setTimeout(() => searchInputRef.current?.focus(), 100);
      else setSearchValue("");
      return opening;
    });
  };

  const handleNameChange = (val: string) => {
    setNewName(val);
    if (!codeEdited) setNewCode(toCode(val));
  };

  const handleCodeChange = (val: string) => {
    setCodeEdited(true);
    setNewCode(toCode(val));
  };

  const resetCreate = () => {
    setIsCreating(false);
    setNewName("");
    setNewCode("");
    setCodeEdited(false);
    setSubmitting(false);
    setCreateError(null);
  };

  const isCreateValid = newName.trim().length > 0 && newCode.trim().length > 0;

  const handleCreate = async () => {
    if (!isCreateValid || submitting) return;
    setSubmitting(true);
    setCreateError(null);
    try {
      const requestData: IRequestData = {
        method: "POST",
        endpoint: `/api/v1/config${dataConfig.routeBase}`,
        body: { code: newCode, name: newName.trim() },
      };
      await createRecord(requestData);
      onCreated(newCode, newName.trim());
      resetCreate();
    } catch (e) {
      setCreateError(
        e instanceof Error ? e.message : "Failed to create workspace",
      );
      setSubmitting(false);
    }
  };

  const handleCreateKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") void handleCreate();
    if (e.key === "Escape") resetCreate();
  };

  return (
    <div className={styles.selectorSection}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionLabel}>Workspace</h3>
        {!isExpanded && selectedWorkspace && (
          <div className={styles.collapsedChip}>
            <span className={styles.collapsedName}>
              {selectedWorkspace.name}
            </span>
            <span className={styles.collapsedCode}>
              ({selectedWorkspace.code})
            </span>
          </div>
        )}
        <div className={styles.headerActions}>
          {isExpanded && (
            <div className={styles.searchArea}>
              <div
                className={`${styles.searchInput} ${isSearchOpen ? styles.open : ""}`}
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Filter workspaces..."
                />
              </div>
              <button
                className={styles.searchToggle}
                onClick={handleSearchToggle}
                aria-label="Search workspaces"
              >
                <SearchIcon />
              </button>
            </div>
          )}
          <button
            className={`${styles.expandToggle} ${isExpanded ? styles.expanded : ""}`}
            onClick={handleToggleExpand}
            aria-label={
              isExpanded ? "Collapse workspaces" : "Expand workspaces"
            }
          >
            <ChevronDownIcon />
          </button>
        </div>
      </div>
      <div
        className={`${styles.chipStripWrapper} ${isExpanded ? styles.expanded : ""} ${showFadeRight && isExpanded ? styles.fadeRight : ""}`}
      >
        <div className={styles.chipStrip} ref={scrollRef}>
          {isCreating ? (
            <div
              className={styles.inlineCreateChip}
              onKeyDown={handleCreateKeyDown}
            >
              <div className={styles.inlineCreateFields}>
                <input
                  ref={nameInputRef}
                  className={styles.inlineInput}
                  placeholder="Workspace name"
                  value={newName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  disabled={submitting}
                />
                <input
                  className={`${styles.inlineInput} ${styles.inlineCodeInput}`}
                  placeholder="code"
                  value={newCode}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  disabled={submitting}
                />
                {createError && (
                  <span className={styles.inlineError}>{createError}</span>
                )}
              </div>
              <div className={styles.inlineCreateActions}>
                <button
                  className={`${styles.inlineAction} ${styles.inlineSave}`}
                  onClick={() => void handleCreate()}
                  disabled={!isCreateValid || submitting}
                >
                  {submitting ? "Creating…" : "Create"}
                </button>
                <button
                  className={`${styles.inlineAction} ${styles.inlineCancel}`}
                  onClick={resetCreate}
                  disabled={submitting}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              className={styles.createChip}
              onClick={() => setIsCreating(true)}
              aria-label="Create a new workspace"
            >
              <PlusIcon />
              <span>New Workspace</span>
            </button>
          )}
          {filteredWorkspaces.map((ws) => (
            <WorkspaceChip
              key={ws.code}
              workspace={ws}
              isSelected={selectedCode === ws.code}
              onSelect={() => handleChipSelect(ws.code)}
              onUpdated={onUpdated}
              onDelete={() => onDelete(ws)}
            />
          ))}
          {searchValue.trim() && filteredWorkspaces.length === 0 && (
            <div className={styles.noResults}>No workspaces match</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSelector;
