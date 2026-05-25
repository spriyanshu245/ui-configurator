import { AccordionGroupComponent } from "@/app/types/types";
import styles from "./AccordionGroup.module.scss";

interface AccordionGroupProps {
  readonly component: AccordionGroupComponent;
}

const AccordionGroup = ({ component }: AccordionGroupProps) => {
  const { items, showNumbering, autoOpenFirst } = component.properties;

  return (
    <div className={styles.container}>
      <div className={styles.list}>
        {items?.map((item, index) => {
          const isOpen = autoOpenFirst && index === 0;
          return (
            <div
              key={item.id}
              className={`${styles.item} ${isOpen ? styles.itemOpen : ""}`}
            >
              <div className={styles.itemHeader}>
                {showNumbering && (
                  <span className={styles.itemNumber}>{index + 1}.</span>
                )}
                <span className={styles.itemTitle}>{item.title}</span>
                <span
                  className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 6L8 10L12 6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
              {isOpen && item.description && (
                <p className={styles.itemDescription}>{item.description}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AccordionGroup;
