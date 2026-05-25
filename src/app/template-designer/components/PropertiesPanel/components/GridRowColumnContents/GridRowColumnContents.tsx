import styles from "../../PropertiesPanel.module.scss";
import sharedStyles from "@/app/styles/shared.module.scss";
import { GridRowColumnContentsProps } from "@/app/template-designer/types";
import InfoIcon from "@/app/components/SVGIcons/Info";
import MaximizeIcon from "@/app/components/SVGIcons/Maximize";
import Tooltip from "@/app/components/Tooltip/Tooltip";
import TransliterationInput from "@/app/template-designer/components/TransliterationInput/TransliterationInput";

const GridRowColumnContents = ({
  columns,
  columnContents,
  onColumnContentChange,
  isMarkdownGuideOpen,
  onToggleGuide,
  onExpandColumn,
}: GridRowColumnContentsProps) => {
  return (
    <>
      {Array.from({ length: columns }, (_, i) => (
        <div
          key={`grid-row-col-${columns}-${i}`}
          className={styles.propertyRow}
        >
          <div className={styles.labelWithIcon}>
            <label className={styles.propertyLabel} htmlFor={`column-${i}`}>
              Column #{i + 1} Content
            </label>
            <Tooltip text="Expand editor">
              <button
                className={`${sharedStyles.iconButton} ${sharedStyles.small}`}
                onClick={() => onExpandColumn(i)}
                aria-label={`Expand column ${i + 1} content editor`}
                type="button"
              >
                <MaximizeIcon />
              </button>
            </Tooltip>
            <Tooltip text="Open Markdown & HTML guide">
              <button
                className={`${sharedStyles.iconButton} ${sharedStyles.small} ${
                  isMarkdownGuideOpen ? sharedStyles.active : ""
                }`}
                onClick={onToggleGuide}
                aria-label="Open Markdown and HTML guide"
                type="button"
              >
                <InfoIcon />
              </button>
            </Tooltip>
          </div>
          <TransliterationInput
            id={`column-${i}`}
            className={styles.propertyTextarea}
            value={columnContents[i] ?? ""}
            onChange={(value) => onColumnContentChange(i, value)}
            rows={5}
            placeholder="Enter column content here. Click on info icon for Markdown & HTML guide."
          />
        </div>
      ))}
    </>
  );
};

export default GridRowColumnContents;
