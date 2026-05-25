import { useState, useCallback } from "react";
import { TemplateBlock } from "@/app/template-designer/types";
import { generateRandomId } from "@/app/utils/utils";
import {
  findBlockById,
  isDescendantOf,
  removeBlockFromList,
  findAncestorIds,
} from "@/app/template-designer/utils";

interface UseBlockOperationsProps {
  initialBlocks?: TemplateBlock[];
  initialSelectedBlockId?: string | null;
}

interface UseBlockOperationsReturn {
  blocks: TemplateBlock[];
  selectedBlockId: string | null;
  expandedNodes: Set<string>;
  setBlocks: React.Dispatch<React.SetStateAction<TemplateBlock[]>>;
  selectBlock: (blockId: string | null) => void;
  addBlock: (
    block: TemplateBlock,
    parentId?: string,
    afterBlockId?: string
  ) => void;
  updateBlock: (blockId: string, updates: Partial<TemplateBlock>) => void;
  removeBlock: (blockId: string) => void;
  duplicateBlock: (blockId: string) => void;
  moveBlock: (
    blockId: string,
    targetParentId: string | null,
    index: number
  ) => void;
  toggleStructureNode: (nodeId: string) => void;
}

const findAndUpdateBlock = (
  blockList: TemplateBlock[],
  blockId: string,
  updateFn: (block: TemplateBlock) => TemplateBlock | null
): TemplateBlock[] => {
  return blockList.reduce<TemplateBlock[]>((acc, block) => {
    if (block.id === blockId) {
      const updated = updateFn(block);
      if (updated) {
        acc.push(updated);
      }
    } else {
      const updatedBlock = {
        ...block,
        children: block.children
          ? findAndUpdateBlock(block.children, blockId, updateFn)
          : undefined,
      };
      acc.push(updatedBlock);
    }
    return acc;
  }, []);
};

export const useBlockOperations = ({
  initialBlocks = [],
  initialSelectedBlockId = null,
}: UseBlockOperationsProps = {}): UseBlockOperationsReturn => {
  const [blocks, setBlocks] = useState<TemplateBlock[]>(initialBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(
    initialSelectedBlockId
  );
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const selectBlock = useCallback(
    (blockId: string | null) => {
      if (blockId) {
        const ancestorIds = findAncestorIds(blocks, blockId);
        if (ancestorIds && ancestorIds.length > 0) {
          setExpandedNodes((prev) => {
            const next = new Set(prev);
            for (const id of ancestorIds) {
              next.add(id);
            }
            return next;
          });
        }
      }
      setSelectedBlockId(blockId);
    },
    [blocks]
  );

  const addBlock = useCallback(
    (block: TemplateBlock, parentId?: string, afterBlockId?: string) => {
      setBlocks((prev) => {
        if (afterBlockId) {
          const insertAfterBlock = (
            blockList: TemplateBlock[],
            targetId: string,
            newBlock: TemplateBlock
          ): { blocks: TemplateBlock[]; inserted: boolean } => {
            const result: TemplateBlock[] = [];
            let inserted = false;

            for (const b of blockList) {
              if (b.children) {
                const childResult = insertAfterBlock(
                  b.children,
                  targetId,
                  newBlock
                );
                result.push({ ...b, children: childResult.blocks });
                if (childResult.inserted) inserted = true;
              } else {
                result.push(b);
              }

              if (b.id === targetId && !inserted) {
                result.push(newBlock);
                inserted = true;
              }
            }

            return { blocks: result, inserted };
          };

          const { blocks: newBlocks, inserted } = insertAfterBlock(
            prev,
            afterBlockId,
            block
          );
          return inserted ? newBlocks : [...prev, block];
        }

        if (!parentId) {
          return [...prev, block];
        }
        return findAndUpdateBlock(prev, parentId, (parent) => ({
          ...parent,
          children: [...(parent.children ?? []), block],
        }));
      });
      setSelectedBlockId(block.id);
    },
    []
  );

  const updateBlock = useCallback(
    (blockId: string, updates: Partial<TemplateBlock>) => {
      setBlocks((prev) =>
        findAndUpdateBlock(prev, blockId, (block) => ({
          ...block,
          ...updates,
        }))
      );
    },
    []
  );

  const removeBlock = useCallback((blockId: string) => {
    setBlocks((prev) => findAndUpdateBlock(prev, blockId, () => null));
    setSelectedBlockId((current) => (current === blockId ? null : current));
  }, []);

  const duplicateBlock = useCallback((blockId: string) => {
    const cloneWithNewIds = (block: TemplateBlock): TemplateBlock => {
      const newId = `${block.type}-${Date.now()}-${generateRandomId()}`;
      return {
        ...structuredClone(block),
        id: newId,
        children: block.children?.map(cloneWithNewIds),
      };
    };

    setBlocks((prev) => {
      const findAndDuplicate = (
        blockList: TemplateBlock[]
      ): TemplateBlock[] => {
        const result: TemplateBlock[] = [];
        for (const b of blockList) {
          if (b.children) {
            result.push({ ...b, children: findAndDuplicate(b.children) });
          } else {
            result.push(b);
          }
          if (b.id === blockId) {
            const cloned = cloneWithNewIds(b);
            result.push(cloned);
            setSelectedBlockId(cloned.id);
          }
        }
        return result;
      };
      return findAndDuplicate(prev);
    });
  }, []);

  const moveBlock = useCallback(
    (blockId: string, targetParentId: string | null, index: number) => {
      setBlocks((prev) => {
        if (targetParentId) {
          const blockToMove = findBlockById(prev, blockId);
          if (blockToMove && isDescendantOf(blockToMove, targetParentId)) {
            return prev;
          }
        }

        const blockRef = { current: null as TemplateBlock | null };
        const withoutBlock = removeBlockFromList(prev, blockId, blockRef);

        if (!blockRef.current) return prev;

        if (!targetParentId) {
          const result = [...withoutBlock];
          result.splice(index, 0, blockRef.current);
          return result;
        }

        const movedBlock = blockRef.current;
        return findAndUpdateBlock(withoutBlock, targetParentId, (parent) => {
          const newChildren = [...(parent.children ?? [])];
          newChildren.splice(index, 0, movedBlock);
          return { ...parent, children: newChildren };
        });
      });
    },
    []
  );

  const toggleStructureNode = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  return {
    blocks,
    selectedBlockId,
    expandedNodes,
    setBlocks,
    selectBlock,
    addBlock,
    updateBlock,
    removeBlock,
    duplicateBlock,
    moveBlock,
    toggleStructureNode,
  };
};
