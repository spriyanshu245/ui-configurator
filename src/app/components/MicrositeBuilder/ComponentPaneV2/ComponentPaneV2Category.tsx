"use client";

import { BehaviorCategory, ComponentCatalogEntry } from "@/app/types/types";
import ComponentPaneV2Item from "./ComponentPaneV2Item";
import styles from "./ComponentPaneV2.module.scss";

interface ComponentPaneV2CategoryProps {
  category: BehaviorCategory;
  label: string;
  isOpen: boolean;
  items: ComponentCatalogEntry[];
  viewMode: "list" | "grid";
  isFormFound?: boolean;
  onToggle: (category: BehaviorCategory) => void;
}

export default function ComponentPaneV2Category({
  category,
  label,
  isOpen,
  items,
  viewMode,
  isFormFound,
  onToggle,
}: Readonly<ComponentPaneV2CategoryProps>) {
  const visibleItemCount = items.length;

  return (
    <section className={styles.categorySection}>
      <button
        type="button"
        className={`${styles.categoryHeader} ${isOpen ? styles.isOpen : ""}`}
        onClick={() => onToggle(category)}
        aria-expanded={isOpen}
      >
        <span className={styles.categoryLabel}>
          {label}{" "}
          <span className={styles.categoryLabelCount}>({visibleItemCount})</span>
        </span>
        <div className={styles.categoryToggle}>
          <svg
            width="8"
            height="5"
            viewBox="0 0 8 5"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3.18982 4.45553L0.943224 2.07369C0.329701 1.42323 0.0229391 1.098 0.0022114 0.818778C-0.0157736 0.5765 0.0767287 0.339736 0.251035 0.181902C0.451922 0 0.885749 0 1.7534 0H6.2466C7.11425 0 7.54808 0 7.74896 0.181902C7.92327 0.339736 8.01577 0.5765 7.99779 0.818778C7.97706 1.098 7.6703 1.42323 7.05678 2.07369L4.81018 4.45553C4.52659 4.75619 4.38479 4.90652 4.22129 4.96284C4.07746 5.01239 3.92254 5.01239 3.77871 4.96284C3.61521 4.90652 3.47341 4.75619 3.18982 4.45553Z"
              fill="#333B44"
            />
          </svg>
        </div>
      </button>
      {isOpen ? (
        <div
          className={`${styles.categoryItems} ${
            viewMode === "list" ? styles.listItems : styles.gridItems
          }`}
        >
          {items.map((item) => (
            <ComponentPaneV2Item
              key={item.type}
              entry={item}
              viewMode={viewMode}
              isFormFound={isFormFound}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
