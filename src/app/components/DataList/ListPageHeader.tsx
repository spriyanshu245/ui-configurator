import { ReactNode } from "react";
import sharedStyles from "@/app/styles/shared.module.scss";
import AllIcon from "@/app/components/SVGIcons/All";

interface ListPageHeaderProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}

const ListPageHeader = ({ title, icon, children }: ListPageHeaderProps) => (
  <div className={sharedStyles.listPageHeader}>
    <div className={sharedStyles.pageHeadingContainer}>
      <div className={sharedStyles.pageHeadingIcon}>{icon ?? <AllIcon />}</div>
      <h1 className={sharedStyles.pageHeading}>{title}</h1>
    </div>
    <div className={sharedStyles.pageActions}>{children}</div>
  </div>
);

export default ListPageHeader;
