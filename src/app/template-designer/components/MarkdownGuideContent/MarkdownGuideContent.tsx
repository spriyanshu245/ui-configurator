import styles from "@/app/template-designer/components/MarkdownGuideContent/MarkdownGuideContent.module.scss";
import {
  MARKDOWN_GUIDE_TIPS,
  MARKDOWN_GUIDE_SECTIONS,
} from "@/app/template-designer/data/markdownGuideContent";

const MarkdownGuideContent = () => {
  return (
    <div className={styles.markdownGuideContent}>
      <section className={styles.markdownGuideTipSection}>
        <h4>Tips</h4>
        <ul className={styles.markdownGuideTipList}>
          {MARKDOWN_GUIDE_TIPS.map((tip) => (
            <li key={tip.text}>{tip.text}</li>
          ))}
        </ul>
      </section>

      {MARKDOWN_GUIDE_SECTIONS.map((section) => (
        <section key={section.title} className={styles.markdownGuideSection}>
          <h4>{section.title}</h4>
          {section.description && (
            <p className={styles.markdownGuideDescription}>
              {section.description}
            </p>
          )}
          {section.codeBlocks.map((block, blockIndex) => (
            <div
              key={`${section.title}-block-${blockIndex}`}
              className={styles.markdownGuideCodeBlock}
            >
              {block.label && (
                <span className={styles.markdownGuideCodeLabel}>
                  {block.label}
                </span>
              )}
              {block.codes.map((code) => (
                <code key={code} className={styles.markdownGuideCode}>
                  {code}
                </code>
              ))}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
};

export default MarkdownGuideContent;
