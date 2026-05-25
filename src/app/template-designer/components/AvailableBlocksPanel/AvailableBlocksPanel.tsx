"use client";
import { useCallback, useState } from "react";
import styles from "./AvailableBlocksPanel.module.scss";
import { useTemplateDesigner } from "@/app/template-designer/context/TemplateDesignerContext";
import {
  AvailableBlock,
  TemplateBlock,
  BlockItemProps,
} from "@/app/template-designer/types";
import { availableBlocks } from "@/app/template-designer/data/availableBlocks";
import ChevronRightIcon from "@/app/components/SVGIcons/ChevronRight";
import {
  findBlockById,
  isContainerType,
  isGridType,
} from "@/app/template-designer/utils";
import NewIcon from "@/app/components/SVGIcons/New";

const AvailableBlocksPanel = () => {
  const { addBlock, selectedBlockId, blocks } = useTemplateDesigner();
  const [isExpanded, setIsExpanded] = useState(true);

  const handleAddBlock = useCallback(
    (block: AvailableBlock) => {
      const newBlock: TemplateBlock = {
        id: `${block.type}-${Date.now()}`,
        type: block.type,
        label: block.label,
        content: block.defaultContent,
        properties: { ...block.defaultProperties },
        children: block.isContainer ? [] : undefined,
      };

      let parentId: string | undefined;
      let afterBlockId: string | undefined;

      if (selectedBlockId) {
        const selectedBlock = findBlockById(blocks, selectedBlockId);
        if (selectedBlock) {
          if (isGridType(selectedBlock.type)) {
            afterBlockId = selectedBlockId;
          } else if (isContainerType(selectedBlock.type)) {
            parentId = selectedBlockId;
          } else {
            afterBlockId = selectedBlockId;
          }
        }
      }

      addBlock(newBlock, parentId, afterBlockId);
    },
    [addBlock, selectedBlockId, blocks]
  );

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div className={styles.availableBlocksPanel}>
      <button className={styles.header} onClick={toggleExpanded}>
        <span
          className={`${styles.chevron} ${isExpanded ? styles.expanded : ""}`}
        >
          <ChevronRightIcon />
        </span>
        <span className={styles.title}>Available Blocks</span>
      </button>
      {isExpanded && (
        <div className={styles.content}>
          <div className={styles.blockList}>
            {availableBlocks.map((block) => (
              <BlockItem key={block.id} block={block} onAdd={handleAddBlock} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const BlockItem = ({ block, onAdd }: BlockItemProps) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/json", JSON.stringify(block));
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleClick = () => {
    onAdd(block);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onAdd(block);
    }
  };

  return (
    <div
      className={styles.blockItem}
      draggable
      onDragStart={handleDragStart}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className={styles.blockInfo}>
        <span className={styles.blockLabel}>{block.label}</span>
        <span className={styles.blockDescription}>{block.description}</span>
      </div>
      <div className={styles.blockIcon}>
        <NewIcon />
      </div>
    </div>
  );
};

export default AvailableBlocksPanel;
