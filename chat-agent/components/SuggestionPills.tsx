import React from "react";
import { Sparkles } from "lucide-react";
import type { ChatSuggestion } from "../types/types";
import styles from "./SuggestionPills.module.scss";

interface SuggestionPillsProps {
  items: ChatSuggestion[];
  onPick: (value: string) => void;
  /** Optional leading label (e.g. "Next" for agent suggestions). */
  label?: string;
  disabled?: boolean;
}

/**
 * A row of clickable pills. Used both for the agent's per-turn "next actions"
 * and for the static empty-state starter prompts. Clicking a pill sends its
 * `value` as the user's next message.
 */
export function SuggestionPills({ items, onPick, label, disabled }: SuggestionPillsProps) {
  if (!items || items.length === 0) return null;
  return (
    <div className={styles.pillsRow} role="group" aria-label={label || "Suggestions"}>
      {label && (
        <span className={styles.pillsLabel}>
          <Sparkles size={12} />
          {label}
        </span>
      )}
      {items.map((s) => (
        <button
          key={s.id}
          type="button"
          className={styles.pill}
          disabled={disabled}
          onClick={() => onPick(s.value)}
          title={s.value}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
