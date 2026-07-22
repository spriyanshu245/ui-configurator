import React, { useMemo, useState } from "react";
import { Differ, Viewer } from "json-diff-kit";
import "json-diff-kit/dist/viewer.css";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { DiffChunk as DiffChunkData } from "../lib/scope-diff";
import styles from "./DiffChunk.module.scss";

// A single shared Differ instance for all chunk viewers — Differ is
// stateless configuration, safe to reuse across every chunk's diff() call.
const chunkDiffer = new Differ({
  detectCircular: true,
  maxDepth: Infinity,
  showModifications: true,
  arrayDiffMethod: "lcs",
});

interface DiffChunkProps {
  chunk: DiffChunkData;
  defaultOpen?: boolean;
}

export function DiffChunk({ chunk, defaultOpen = true }: DiffChunkProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const diff = useMemo(() => {
    try {
      return chunkDiffer.diff(chunk.before, chunk.after);
    } catch (e) {
      return [[], []] as any;
    }
  }, [chunk.before, chunk.after]);

  return (
    <div className={styles.chunk} data-chunk-key={chunk.key}>
      <button
        type="button"
        className={styles.chunkHeader}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className={styles.chunkLabel}>{chunk.label}</span>
        <span className={styles.chunkBadge}>
          {chunk.ops.length > 0
            ? `${chunk.ops.length} ${chunk.ops.length === 1 ? "change" : "changes"}`
            : "changes"}
        </span>
      </button>

      {isOpen && (
        <div className={styles.chunkBody}>
          <Viewer diff={diff} />
        </div>
      )}
    </div>
  );
}
