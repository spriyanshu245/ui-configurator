import { BlockProperty } from "@/app/template-designer/data/blockProperties";

export const blockPropertiesMap: Record<string, BlockProperty[]> = {
  section: [
    BlockProperty.Title,
    BlockProperty.PaddingVertical,
    BlockProperty.PaddingHorizontal,
    BlockProperty.Bordered,
  ],
  richText: [BlockProperty.Content],
  grid: [BlockProperty.Columns, BlockProperty.Gap, BlockProperty.ColumnWidths],
  gridRow: [BlockProperty.ColumnContents],
  table: [
    BlockProperty.List,
    BlockProperty.ZebraRows,
    BlockProperty.ShowBorders,
    BlockProperty.TableColumns,
    BlockProperty.ColumnWidths,
    BlockProperty.HeaderStyle,
    BlockProperty.RowCellStyle,
  ],
  loop: [BlockProperty.Variable, BlockProperty.List],
  if: [BlockProperty.Condition],
  image: [
    BlockProperty.Src,
    BlockProperty.Alt,
    BlockProperty.Width,
    BlockProperty.Alignment,
  ],
  spacer: [BlockProperty.Height],
  divider: [BlockProperty.Thickness, BlockProperty.Color, BlockProperty.Width],
  pageBreak: [],
};

export const hiddenBlockProperties: Record<string, BlockProperty[]> = {
  section: [
    BlockProperty.Bordered,
    BlockProperty.PaddingVertical,
    BlockProperty.PaddingHorizontal,
  ],
  grid: [
    BlockProperty.Columns,
    BlockProperty.Gap,
    BlockProperty.ColumnWidths,
    BlockProperty.ColumnSpacing,
    BlockProperty.ShowBorders,
    BlockProperty.Style,
    BlockProperty.ColumnStyles,
  ],
  gridRow: [],
  table: [
    BlockProperty.TableColumns,
    BlockProperty.List,
    BlockProperty.ZebraRows,
    BlockProperty.ShowBorders,
    BlockProperty.ColumnWidths,
    BlockProperty.HeaderStyle,
    BlockProperty.RowCellStyle,
  ],
  if: [BlockProperty.Content],
  loop: [BlockProperty.Content],
  pageBreak: [BlockProperty.Content],
  image: [BlockProperty.Alignment],
  divider: [BlockProperty.Width],
};

export const contentHiddenBlockTypes = new Set([
  "grid",
  "gridRow",
  "section",
  "spacer",
  "image",
  "divider",
  "table",
  "if",
  "loop",
  "pageBreak",
]);

export const unitSuffixProperties = new Set<BlockProperty>([
  BlockProperty.PaddingVertical,
  BlockProperty.PaddingHorizontal,
  BlockProperty.Height,
  BlockProperty.Width,
  BlockProperty.Gap,
  BlockProperty.Thickness,
]);
