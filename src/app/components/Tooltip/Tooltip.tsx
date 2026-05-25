import React, { useState, ReactNode, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./Tooltip.module.scss";

interface TooltipProps {
  text: string;
  children: ReactNode;
  visibilityCondition?: boolean;
}

interface Position {
  top: number;
  left: number;
}

const getMousePosition = (clientX: number, clientY: number): Position => ({
  top: clientY + 10,
  left: clientX + 10,
});

const Tooltip = ({
  text,
  children,
  visibilityCondition = true,
}: TooltipProps) => {
  const [rawPosition, setRawPosition] = useState<Position>({ top: 0, left: 0 });
  const [adjustedPosition, setAdjustedPosition] = useState<Position>({
    top: 0,
    left: 0,
  });
  const [visible, setVisible] = useState<boolean>(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setRawPosition(getMousePosition(e.clientX, e.clientY));
  };

  useLayoutEffect(() => {
    if (!visible || !tooltipRef.current) {
      setAdjustedPosition(rawPosition);
      return;
    }

    const tooltip = tooltipRef.current;
    const { width, height } = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 8;

    let { top, left } = rawPosition;

    if (left + width + padding > viewportWidth) {
      left = viewportWidth - width - padding;
    }

    if (top + height + padding > viewportHeight) {
      top = rawPosition.top - height - 20;
    }

    setAdjustedPosition({ top, left });
  }, [rawPosition, visible]);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (visibilityCondition) {
      setRawPosition(getMousePosition(e.clientX, e.clientY));
      setVisible(true);
    }
  };

  const handleMouseLeave = () => {
    setVisible(false);
  };

  return (
    <div
      className={styles.tooltipWrapper}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {visible &&
        createPortal(
          <div
            ref={tooltipRef}
            className={styles.tooltip}
            role="tooltip"
            aria-label={text}
            style={{
              top: `${adjustedPosition.top}px`,
              left: `${adjustedPosition.left}px`,
            }}
          >
            {text}
          </div>,
          document.body,
        )}
    </div>
  );
};

export default Tooltip;
