import { TypographComponent } from "@/app/types/types";
import { useMemo } from "react";
import styles from "./Typograph.module.scss";

interface TypographProps {
  readonly component: TypographComponent;
}

export default function Typograph({ component }: TypographProps) {
  const {
    isRichTextEditor = false,
    richTextEditor = "Typograph",
    text = "Typograph",
    textAlign = "left",
    textColor = "#000000",
    width,
    textSize = "12px",
  } = component.properties;

  const commonStyles = useMemo(
    () => ({
      textAlign: textAlign as React.CSSProperties["textAlign"],
      color: textColor,
      width: width ? `${width}%` : "100%",
      fontSize: textSize,
    }),
    [textAlign, textColor, width, textSize]
  );

  if (isRichTextEditor) {
    return (
      <div
        id={component.id}
        style={commonStyles}
        className={styles.typograph}
        dangerouslySetInnerHTML={{ __html: richTextEditor }}
      />
    );
  }

  return (
    <p id={component.id} style={commonStyles} className={styles.typograph}>
      {text}
    </p>
  );
}
