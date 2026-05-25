import { ReactNode } from "react";
import ArrowFancyRightIcon from "../SVGIcons/ArrowFancyRight";
import GlobeIcon from "../SVGIcons/Globe";
import MicrositeIcon from "../SVGIcons/Microsite";
import RulesIcon from "../SVGIcons/Rules";
import WorkflowIcon from "../SVGIcons/Workflow";
import TemplateIcon from "../SVGIcons/Template";
import LockIcon from "../SVGIcons/Lock";
import MenuIcon from "../SVGIcons/Menu";
import FingerPrintIcon from "../SVGIcons/FingerPrintIcon";
import styles from "./Card.module.scss";

const ICON_MAP: Record<string, ReactNode> = {
  microsite: <MicrositeIcon />,
  workflow: <WorkflowIcon />,
  rules: <RulesIcon />,
  template: <TemplateIcon />,
  lock: <LockIcon />,
  menu: <MenuIcon />,
  fingerprint: <FingerPrintIcon />,
};

interface CardProps {
  title: string;
  description: string;
  icon?: string;
  iconNode?: ReactNode;
  size?: "default" | "compact";
  isExternal?: boolean;
  onClickHandler?: () => void;
  comingSoon?: boolean;
}

const Card = ({
  title,
  description,
  icon,
  iconNode,
  size = "default",
  isExternal,
  onClickHandler,
  comingSoon,
}: CardProps) => {
  const handleClick = () => {
    if (comingSoon) return;
    if (onClickHandler) {
      onClickHandler();
    }
  };

  const sizeClass = size === "compact" ? styles.compact : "";

  return (
    <div
      className={`${styles.cardContainer} ${sizeClass} ${
        !comingSoon ? styles.clickable : styles.disabled
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      <div className={styles.iconContainer}>
        {iconNode ?? (icon && ICON_MAP[icon])}
      </div>
      <h3 className={styles.cardTitle}>{title}</h3>
      <p className={styles.cardDescription}>{description}</p>
      {comingSoon ? (
        <div className={styles.comingSoonContainer}>
          <p className={styles.comingSoonText}>Coming Soon</p>
        </div>
      ) : (
        <div className={styles.arrowContainer}>
          <ArrowFancyRightIcon />
          {isExternal && (
            <span className={styles.externalBadge}>
              <GlobeIcon />
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Card;
