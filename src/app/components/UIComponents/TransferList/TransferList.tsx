"use client";
import { TransferListComponent } from "@/app/types/types";
import styles from "./TransferList.module.scss";
import sharedStyles from "./../../../styles/shared.module.scss";
import { useState } from "react";

interface TransferListProps {
  component: TransferListComponent;
}

export default function TransferList({
  component,
}: Readonly<TransferListProps>) {
  const {
    label,
    showLabel,
    fromListTitle,
    toListTitle,
    fromListItems,
    toListItems,
  } = component.properties ?? {};

  const [selectedFromItems, setSelectedFromItems] = useState<string[]>([]);
  const [selectedToItems, setSelectedToItems] = useState<string[]>([]);

  const handleFromItemSelect = (itemValue: string) => {
    setSelectedFromItems((prev) =>
      prev.includes(itemValue)
        ? prev.filter((item) => item !== itemValue)
        : [...prev, itemValue]
    );
  };

  const handleToItemSelect = (itemValue: string) => {
    setSelectedToItems((prev) =>
      prev.includes(itemValue)
        ? prev.filter((item) => item !== itemValue)
        : [...prev, itemValue]
    );
  };

  return (
    <div
      id={component.id}
      className={`${sharedStyles.formGroup} ${styles.formGroup}`}
      key={component.id}
    >
      {label && showLabel && (
        <label htmlFor={component.id} className={sharedStyles.formGroupLabel}>
          {label}
        </label>
      )}

      <div className={styles.transferListContainer}>
        {/* From List */}
        <div className={styles.listContainer}>
          <div className={styles.listTitle}>
            {fromListTitle ?? "Available Items"}
          </div>
          <div className={styles.listBox}>
            {fromListItems?.map((item: { value: string; label: string }) => (
              <button
                key={item.value}
                className={`${styles.listItem} ${
                  selectedFromItems.includes(item.value) ? styles.selected : ""
                }`}
                onClick={() => handleFromItemSelect(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Control Buttons */}
        <div className={styles.controlButtons}>
          <button
            type="button"
            className={styles.controlButton}
            disabled={!fromListItems?.length}
            title="Move all items to right"
          >
            ⇒
          </button>
          <button
            type="button"
            className={styles.controlButton}
            disabled={!toListItems?.length}
            title="Move all items to left"
          >
            ⇐
          </button>
        </div>

        {/* To List */}
        <div className={styles.listContainer}>
          <div className={styles.listTitle}>
            {toListTitle ?? "Selected Items"}
          </div>
          <div className={styles.listBox}>
            {toListItems?.map((item: { value: string; label: string }) => (
              <button
                key={item.value}
                className={`${styles.listItem} ${
                  selectedToItems.includes(item.value) ? styles.selected : ""
                }`}
                onClick={() => handleToItemSelect(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
