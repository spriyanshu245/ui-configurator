import React, { useState, useEffect } from "react";
import styles from "./SkillDebugPanel.module.scss";

interface SkillEntrySummary {
  id: string;
  category: string;
  title: string;
  confidence: number;
  usageCount: number;
}

export function SkillDebugPanel() {
  const [content, setContent] = useState("");
  const [entryCount, setEntryCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/skill")
      .then((res) => res.json())
      .then((data: { content?: string; entries?: SkillEntrySummary[]; error?: string }) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
          return;
        }
        setContent(data.content ?? "");
        setEntryCount(Array.isArray(data.entries) ? data.entries.length : 0);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={styles.container}>
      <h3>Skill Debug Panel</h3>
      {error ? (
        <p>Failed to load knowledge base: {error}</p>
      ) : (
        <p>
          {entryCount === null ? "Loading…" : `${entryCount} skill entr${entryCount === 1 ? "y" : "ies"} compiled`}
        </p>
      )}
      <pre className={styles.preContent}>{content}</pre>
    </div>
  );
}
