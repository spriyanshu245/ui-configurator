import React, { useState, useEffect } from "react";
import styles from "./SkillDebugPanel.module.scss";
export function SkillDebugPanel() {
  const [content, setContent] = useState("");

  useEffect(() => {
    // Ideally fetch from an API route that serves agentSkill.md content
    setContent("Mock Agent Skill Debug Content");
  }, []);

  return (
    <div className={styles.container}>
      <h3>Skill Debug Panel</h3>
      <pre className={styles.preContent}>{content}</pre>
    </div>
  );
}
