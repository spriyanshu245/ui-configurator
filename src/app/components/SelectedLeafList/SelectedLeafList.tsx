import React from "react";
import styles from "./SelectedLeafList.module.scss";
import CloseIcon from "../SVGIcons/Close";

interface SelectedLeafListProps {
  clearAllSelected: () => void;
  selectedItems: Record<string, any>[];
  removeSelectedItem: (menuName: any) => void;
}

function SelectedLeafList({
  clearAllSelected,
  selectedItems,
  removeSelectedItem,
}: Readonly<SelectedLeafListProps>) {
  return (
    <div className={styles.selectedPanel}>
      <div className={styles.flexBtwn}>
        <p>Selected Items</p>
        <button className={styles.clearAllBtn} onClick={clearAllSelected}>
          Clear All
        </button>
      </div>
      <div className={styles.selectedBox}>
        {selectedItems.length === 0 && <p>No items selected.</p>}

        {selectedItems.length > 0 && (
          <ul className={styles.selectedList}>
            {selectedItems.map((item) => (
              <li key={item.menuName} className={styles.selectedItem}>
                <span>{item.menuTitle}</span>
                <button
                  className={styles.removeBtn}
                  onClick={() => removeSelectedItem(item.menuName)}
                >
                  <CloseIcon color="#fff" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default SelectedLeafList;
