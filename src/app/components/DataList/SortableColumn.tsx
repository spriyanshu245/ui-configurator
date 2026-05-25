import sharedStyles from "@/app/styles/shared.module.scss";
import ChevronDownSolidIcon from "@/app/components/SVGIcons/ChevronDownSolid";
import ChevronUpSolidIcon from "@/app/components/SVGIcons/ChevronUpSolid";
import { SortDirection } from "@/app/types/types";

interface SortableColumnProps {
  label: string;
  direction: SortDirection;
  centered?: boolean;
  onSort: () => void;
}

const SortableColumn = ({
  label,
  direction,
  centered,
  onSort,
}: SortableColumnProps) => (
  <th className={centered ? sharedStyles.centered : undefined}>
    <button
      type="button"
      className={sharedStyles.sortableHeader}
      onClick={onSort}
      aria-label={`Sort by ${label}`}
    >
      <span>{label}</span>
      <span
        className={`${sharedStyles.sortIcon} ${
          direction ? sharedStyles.active : ""
        }`}
      >
        {direction === "asc" ? (
          <ChevronUpSolidIcon />
        ) : (
          <ChevronDownSolidIcon />
        )}
      </span>
    </button>
  </th>
);

export default SortableColumn;
