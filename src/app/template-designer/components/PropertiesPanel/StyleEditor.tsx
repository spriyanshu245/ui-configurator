"use client";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import styles from "./StyleEditor.module.scss";
import DeleteIcon from "@/app/components/SVGIcons/Delete";
import SelectDropdown from "@/app/components/InternalComponents/SelectDropdown/SelectDropdown";
import { CSS_PROPERTIES } from "@/app/template-designer/data/availableCssProperties";

interface StyleEntry {
  id: string;
  property: string;
  value: string;
}

interface StyleEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const parseStyleString = (styleString: string): StyleEntry[] => {
  if (!styleString.trim()) return [];

  const entries: StyleEntry[] = [];
  const parts = styleString.split(";").filter((part) => part.trim());

  parts.forEach((part) => {
    const colonIndex = part.indexOf(":");
    if (colonIndex !== -1) {
      const property = part.slice(0, colonIndex).trim();
      const value = part.slice(colonIndex + 1).trim();
      if (property) {
        entries.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          property,
          value,
        });
      }
    }
  });

  return entries;
};

const entriesToStyleString = (entries: StyleEntry[]): string => {
  return entries
    .filter((entry) => entry.property.trim())
    .map((entry) => `${entry.property}: ${entry.value}`)
    .join("; ");
};

const StyleEditor = ({ value, onChange }: StyleEditorProps) => {
  const [entries, setEntries] = useState<StyleEntry[]>(() =>
    parseStyleString(value)
  );
  const [highlightedEntryId, setHighlightedEntryId] = useState<string | null>(
    null
  );
  const entriesListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parsedEntries = parseStyleString(value);
    const currentString = entriesToStyleString(entries);
    const newString = entriesToStyleString(parsedEntries);
    if (currentString !== newString) {
      setEntries(parsedEntries);
    }
  }, [value]);

  const updateEntries = useCallback(
    (newEntries: StyleEntry[]) => {
      setEntries(newEntries);
      onChange(entriesToStyleString(newEntries));
    },
    [onChange]
  );

  const handleAddEntry = useCallback(() => {
    const newEntry: StyleEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      property: "",
      value: "",
    };
    updateEntries([...entries, newEntry]);
    setTimeout(() => {
      entriesListRef.current?.scrollTo({
        top: entriesListRef.current.scrollHeight,
        behavior: "smooth",
      });
      setTimeout(() => {
        setHighlightedEntryId(newEntry.id);
        setTimeout(() => setHighlightedEntryId(null), 1000);
      }, 300);
    }, 0);
  }, [entries, updateEntries]);

  const handleRemoveEntry = useCallback(
    (id: string) => {
      updateEntries(entries.filter((entry) => entry.id !== id));
    },
    [entries, updateEntries]
  );

  const handlePropertyChange = useCallback(
    (id: string, property: string) => {
      updateEntries(
        entries.map((entry) =>
          entry.id === id ? { ...entry, property } : entry
        )
      );
    },
    [entries, updateEntries]
  );

  const handleValueChange = useCallback(
    (id: string, entryValue: string) => {
      updateEntries(
        entries.map((entry) =>
          entry.id === id ? { ...entry, value: entryValue } : entry
        )
      );
    },
    [entries, updateEntries]
  );

  return (
    <div className={styles.styleEditor}>
      <div ref={entriesListRef} className={styles.entriesList}>
        {entries.map((entry) => (
          <StyleEntryRow
            key={entry.id}
            entry={entry}
            isHighlighted={entry.id === highlightedEntryId}
            onPropertyChange={handlePropertyChange}
            onValueChange={handleValueChange}
            onRemove={handleRemoveEntry}
          />
        ))}
      </div>
      <button
        type="button"
        className={styles.addButton}
        onClick={handleAddEntry}
      >
        <span>+</span>
        <span>Add Style</span>
      </button>
    </div>
  );
};

interface StyleEntryRowProps {
  entry: StyleEntry;
  isHighlighted: boolean;
  onPropertyChange: (id: string, property: string) => void;
  onValueChange: (id: string, value: string) => void;
  onRemove: (id: string) => void;
}

const StyleEntryRow = ({
  entry,
  isHighlighted,
  onPropertyChange,
  onValueChange,
  onRemove,
}: StyleEntryRowProps) => {
  const cssPropertyOptions = useMemo(
    () => CSS_PROPERTIES.map((prop) => ({ value: prop, label: prop })),
    []
  );

  return (
    <div
      className={`${styles.entryRow} ${
        isHighlighted ? styles.highlighted : ""
      }`}
    >
      <div className={styles.entryHeader}>
        <span className={styles.entryLabel}>Property</span>
        <button
          type="button"
          className={styles.removeButton}
          onClick={() => onRemove(entry.id)}
          title="Remove style"
        >
          <DeleteIcon />
        </button>
      </div>
      <div className={styles.propertyInputWrapper}>
        <SelectDropdown
          id={`style-property-${entry.id}`}
          options={cssPropertyOptions}
          value={entry.property}
          onChange={(val) => onPropertyChange(entry.id, val)}
          placeholder="Select property"
          showSearch={true}
        />
      </div>
      <div className={styles.valueRow}>
        <input
          type="text"
          className={styles.valueInput}
          value={entry.value}
          onChange={(e) => onValueChange(entry.id, e.target.value)}
          placeholder="Enter value"
        />
      </div>
    </div>
  );
};

export default StyleEditor;
