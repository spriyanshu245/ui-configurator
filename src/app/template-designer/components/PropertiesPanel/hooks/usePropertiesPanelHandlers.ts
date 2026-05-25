import { useCallback, ChangeEvent } from "react";
import {
  TemplateBlock,
  PropertyValue,
  TableColumn,
} from "@/app/template-designer/types";
import {
  getDefaultColumnWidths,
  calculateAdjustedColumnWidths,
} from "../utils/propertiesPanelUtils";

interface UsePropertiesPanelHandlersProps {
  selectedBlockId: string | null;
  selectedBlock: TemplateBlock | null;
  updateBlock: (blockId: string, updates: Partial<TemplateBlock>) => void;
  removeBlock: (blockId: string) => void;
}

export const usePropertiesPanelHandlers = ({
  selectedBlockId,
  selectedBlock,
  updateBlock,
  removeBlock,
}: UsePropertiesPanelHandlersProps) => {
  const handlePropertyChange = useCallback(
    (key: string, value: PropertyValue) => {
      if (selectedBlockId) {
        updateBlock(selectedBlockId, {
          properties: {
            ...selectedBlock?.properties,
            [key]: value,
          },
        });
      }
    },
    [selectedBlockId, selectedBlock, updateBlock]
  );

  const handleGridColumnsChange = useCallback(
    (numColumns: number) => {
      if (selectedBlockId) {
        const widths = getDefaultColumnWidths(numColumns);
        updateBlock(selectedBlockId, {
          properties: {
            ...selectedBlock?.properties,
            columns: numColumns,
            columnWidths: widths,
          },
        });
      }
    },
    [selectedBlockId, selectedBlock, updateBlock]
  );

  const handleLabelChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (selectedBlockId) {
        updateBlock(selectedBlockId, { label: e.target.value });
      }
    },
    [selectedBlockId, updateBlock]
  );

  const handleStyleChange = useCallback(
    (styleValue: string) => {
      if (selectedBlockId && selectedBlock) {
        updateBlock(selectedBlockId, {
          properties: {
            ...selectedBlock.properties,
            style: styleValue,
          },
        });
      }
    },
    [selectedBlockId, selectedBlock, updateBlock]
  );

  const handleColumnContentChange = useCallback(
    (columnIndex: number, value: string) => {
      if (selectedBlockId && selectedBlock) {
        const columnContents = selectedBlock.properties.columnContents
          ? [...(selectedBlock.properties.columnContents as string[])]
          : [];
        columnContents[columnIndex] = value;
        updateBlock(selectedBlockId, {
          properties: {
            ...selectedBlock.properties,
            columnContents,
          },
        });
      }
    },
    [selectedBlockId, selectedBlock, updateBlock]
  );

  const handleBorderedChange = useCallback(
    (value: boolean) => {
      if (selectedBlockId && selectedBlock) {
        updateBlock(selectedBlockId, {
          properties: {
            ...selectedBlock.properties,
            bordered: value,
          },
        });
      }
    },
    [selectedBlockId, selectedBlock, updateBlock]
  );

  const handleShowBordersChange = useCallback(
    (value: boolean) => {
      if (selectedBlockId && selectedBlock) {
        updateBlock(selectedBlockId, {
          properties: {
            ...selectedBlock.properties,
            showBorders: value,
          },
        });
      }
    },
    [selectedBlockId, selectedBlock, updateBlock]
  );

  const handleColumnStyleChange = useCallback(
    (columnIndex: number, styleValue: string) => {
      if (selectedBlockId && selectedBlock) {
        const columnStyles = selectedBlock.properties.columnStyles
          ? [...(selectedBlock.properties.columnStyles as string[])]
          : [];
        columnStyles[columnIndex] = styleValue;
        updateBlock(selectedBlockId, {
          properties: {
            ...selectedBlock.properties,
            columnStyles,
          },
        });
      }
    },
    [selectedBlockId, selectedBlock, updateBlock]
  );

  const handleColumnWidthChange = useCallback(
    (index: number, value: number, columnWidths: number[]) => {
      if (!selectedBlockId || !selectedBlock) return;

      const newWidths = calculateAdjustedColumnWidths(
        columnWidths,
        index,
        value
      );
      if (!newWidths) return;

      updateBlock(selectedBlockId, {
        properties: {
          ...selectedBlock.properties,
          columnWidths: newWidths,
        },
      });
    },
    [selectedBlockId, selectedBlock, updateBlock]
  );

  const handleTableListBindingChange = useCallback(
    (value: string) => {
      if (selectedBlockId && selectedBlock) {
        updateBlock(selectedBlockId, {
          properties: {
            ...selectedBlock.properties,
            list: value,
          },
        });
      }
    },
    [selectedBlockId, selectedBlock, updateBlock]
  );

  const handleTableZebraRowsChange = useCallback(
    (value: boolean) => {
      if (selectedBlockId && selectedBlock) {
        updateBlock(selectedBlockId, {
          properties: {
            ...selectedBlock.properties,
            zebraRows: value,
          },
        });
      }
    },
    [selectedBlockId, selectedBlock, updateBlock]
  );

  const handleTableShowBordersChange = useCallback(
    (value: boolean) => {
      if (selectedBlockId && selectedBlock) {
        updateBlock(selectedBlockId, {
          properties: {
            ...selectedBlock.properties,
            showBorders: value,
          },
        });
      }
    },
    [selectedBlockId, selectedBlock, updateBlock]
  );

  const handleTableColumnsChange = useCallback(
    (columns: TableColumn[], newWidths?: number[]) => {
      if (selectedBlockId && selectedBlock) {
        const properties = {
          ...selectedBlock.properties,
          columns,
          ...(newWidths !== undefined && { columnWidths: newWidths }),
        };
        updateBlock(selectedBlockId, { properties });
      }
    },
    [selectedBlockId, selectedBlock, updateBlock]
  );

  const handleTableColumnWidthChange = useCallback(
    (index: number, value: number, columnWidths: number[]) => {
      if (!selectedBlockId || !selectedBlock) return;

      const newWidths = calculateAdjustedColumnWidths(
        columnWidths,
        index,
        value
      );
      if (!newWidths) return;

      updateBlock(selectedBlockId, {
        properties: {
          ...selectedBlock.properties,
          columnWidths: newWidths,
        },
      });
    },
    [selectedBlockId, selectedBlock, updateBlock]
  );

  const handleTableHeaderStyleChange = useCallback(
    (value: string) => {
      if (selectedBlockId && selectedBlock) {
        updateBlock(selectedBlockId, {
          properties: {
            ...selectedBlock.properties,
            headerStyle: value,
          },
        });
      }
    },
    [selectedBlockId, selectedBlock, updateBlock]
  );

  const handleTableRowCellStyleChange = useCallback(
    (value: string) => {
      if (selectedBlockId && selectedBlock) {
        updateBlock(selectedBlockId, {
          properties: {
            ...selectedBlock.properties,
            rowCellStyle: value,
          },
        });
      }
    },
    [selectedBlockId, selectedBlock, updateBlock]
  );

  const handleContentChange = useCallback(
    (value: string) => {
      if (selectedBlockId) {
        updateBlock(selectedBlockId, { content: value });
      }
    },
    [selectedBlockId, updateBlock]
  );

  const handleDelete = useCallback(() => {
    if (selectedBlockId) {
      removeBlock(selectedBlockId);
    }
  }, [selectedBlockId, removeBlock]);

  return {
    handlePropertyChange,
    handleGridColumnsChange,
    handleLabelChange,
    handleStyleChange,
    handleColumnContentChange,
    handleBorderedChange,
    handleShowBordersChange,
    handleColumnStyleChange,
    handleColumnWidthChange,
    handleTableListBindingChange,
    handleTableZebraRowsChange,
    handleTableShowBordersChange,
    handleTableColumnsChange,
    handleTableColumnWidthChange,
    handleTableHeaderStyleChange,
    handleTableRowCellStyleChange,
    handleContentChange,
    handleDelete,
  };
};
