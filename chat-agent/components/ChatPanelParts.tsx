import React, { useEffect, useState } from "react";
import { X, Send, Bot, Loader2, Paperclip, FileText, Square } from "lucide-react";
import { SuggestionPills } from "./SuggestionPills";
import { formatBytes, MAX_ATTACHMENTS } from "../lib/attachments";
import type { ChatSuggestion } from "../types/types";
import {
  inputPlaceholder,
  STARTER_SUGGESTIONS,
  type AttachedFile,
} from "./chatPanelUtils";
import styles from "./ChatPanel.module.scss";

/** Collapsed floating launcher button with a hover greeting. */
export function ChatLauncher({ onOpen }: Readonly<{ onOpen: () => void }>) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      {/* Floating Greeting Bubble */}
      {isHovered && (
        <div className={styles.floatingBubble}>
          <span className={styles.onlineIndicator} />
          Ask LayoutX
          <div className={styles.bubbleArrow} />
        </div>
      )}

      <button
        onClick={onOpen}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={styles.logoButton}
        style={{
          boxShadow: isHovered
            ? "0 12px 28px -4px rgba(99, 102, 241, 0.5), 0 8px 16px -4px rgba(217, 70, 239, 0.3)"
            : "0 4px 16px 0 rgba(37, 99, 235, 0.25)",
          transform: isHovered ? "scale(1.1) rotate(5deg)" : "scale(1)",
        }}
      >
        {/* Dual Pulse Rings */}
        <div className={styles.pulseRingInner} />
        <div className={styles.pulseRingOuter} />
        <div className={styles.iconWrapper}>
          <Bot size={28} style={{ strokeWidth: 2 }} />
          <span className={styles.iconOnlineIndicator} />
        </div>
      </button>
    </>
  );
}

function handleBackground(isResizing: boolean, isHovered: boolean): string {
  if (isResizing) return "#3b82f6";
  return isHovered ? "rgba(59, 130, 246, 0.5)" : "transparent";
}

export function ResizeHandle({
  isResizing,
  onStart,
}: Readonly<{ isResizing: boolean; onStart: () => void }>) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseDown={(e) => {
        e.preventDefault();
        onStart();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={styles.resizeHandle}
      style={{ background: handleBackground(isResizing, isHovered) }}
    />
  );
}

export function ChatHeader({
  isLoading,
  onClose,
}: Readonly<{ isLoading: boolean; onClose: () => void }>) {
  return (
    <div className={styles.header}>
      <div className={styles.headerTitle}>
        <Bot size={20} />
        <span className={styles.titleText}>LayoutX</span>
        {isLoading && (
          <Loader2
            size={14}
            className={styles.headerSpinner}
            aria-label="Request in progress"
          />
        )}
      </div>
      <button onClick={onClose} className={styles.closeButton}>
        <X size={20} />
      </button>
      {isLoading && <div className={styles.headerProgressBar} />}
    </div>
  );
}

export function LoadingIndicator() {
  return (
    <div className={styles.loadingIndicator}>
      <span className={styles.typingDots} aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      Agent is thinking...
    </div>
  );
}

/**
 * Agent's contextual next actions take priority; else, on an empty
 * conversation with a microsite loaded, show static starters.
 */
export function SuggestionArea({
  isLoading,
  suggestions,
  visibleCount,
  hasMicrosite,
  onPick,
}: Readonly<{
  isLoading: boolean;
  suggestions: ChatSuggestion[];
  visibleCount: number;
  hasMicrosite: boolean;
  onPick: (value: string) => void;
}>) {
  if (isLoading) return null;
  if (suggestions.length > 0) {
    return <SuggestionPills items={suggestions} onPick={onPick} label="Next" />;
  }
  if (visibleCount === 0 && hasMicrosite) {
    return <SuggestionPills items={STARTER_SUGGESTIONS} onPick={onPick} label="Try" />;
  }
  return null;
}

function AttachmentItem({
  file,
  onRemove,
}: Readonly<{ file: AttachedFile; onRemove: (id: string) => void }>) {
  const removeButton = (className: string) => (
    <button
      type="button"
      className={className}
      onClick={() => onRemove(file.id)}
      aria-label={`Remove ${file.name}`}
    >
      <X size={12} />
    </button>
  );

  if (file.kind === "image") {
    return (
      <div className={styles.imageThumb} title={file.name}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={file.previewUrl} alt={file.name} />
        {removeButton(styles.imageThumbRemove)}
      </div>
    );
  }
  return (
    <div className={styles.fileChip} title={file.name}>
      <FileText size={15} className={styles.fileChipIcon} />
      <div className={styles.fileChipMeta}>
        <span className={styles.fileChipName}>{file.name}</span>
        <span className={styles.fileChipSize}>
          {file.format.toUpperCase()} · {formatBytes(file.size)}
        </span>
      </div>
      {removeButton(styles.fileChipRemove)}
    </div>
  );
}

const FILE_ACCEPT =
  "image/png,image/jpeg,image/gif,image/webp,.pdf,.csv,.txt,.md,.markdown,.html,.htm,.json,.log,.xml,.yaml,.yml,.doc,.docx,.xls,.xlsx,.js,.jsx,.ts,.tsx,.css,.scss";

type ChatInputBarProps = {
  input: string;
  isLoading: boolean;
  hasMicrosite: boolean;
  pendingFiles: AttachedFile[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  onFiles: (files: FileList | null) => void;
  onRemoveFile: (id: string) => void;
};

export function ChatInputBar({
  input,
  isLoading,
  hasMicrosite,
  pendingFiles,
  fileInputRef,
  onInputChange,
  onSend,
  onStop,
  onFiles,
  onRemoveFile,
}: Readonly<ChatInputBarProps>) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const canSend = input.trim().length > 0 || pendingFiles.length > 0;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className={styles.inputContainer}>
      {pendingFiles.length > 0 && (
        <div className={styles.attachmentStrip}>
          {pendingFiles.map((f) => (
            <AttachmentItem key={f.id} file={f} onRemove={onRemoveFile} />
          ))}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept={FILE_ACCEPT}
        multiple
        style={{ display: "none" }}
        onChange={(e) => onFiles(e.target.files)}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading || !hasMicrosite || pendingFiles.length >= MAX_ATTACHMENTS}
        className={styles.attachButton}
        aria-label="Attach files"
        title={`Attach files — images, PDF, docs, or text/code (up to ${MAX_ATTACHMENTS})`}
      >
        <Paperclip size={18} />
      </button>
      <textarea
        ref={textareaRef}
        className={`${styles.mainTextarea} ${isLoading ? styles.mainTextareaDisabled : ""}`}
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={inputPlaceholder(isLoading, hasMicrosite, pendingFiles.length > 0)}
        disabled={isLoading || !hasMicrosite}
        rows={1}
      />
      {isLoading ? (
        <button
          onClick={onStop}
          className={`${styles.sendButton} ${styles.stopButton}`}
          aria-label="Stop generating"
          title="Stop"
        >
          <Square size={16} color="white" fill="white" />
        </button>
      ) : (
        <button
          onClick={onSend}
          disabled={!canSend}
          className={styles.sendButton}
          aria-label="Send message"
          style={{
            background: canSend ? "var(--primary, #1c75bc)" : "var(--light-gray-2, #94a3b8)",
            cursor: canSend ? "pointer" : "not-allowed",
          }}
        >
          <Send size={18} color="white" />
        </button>
      )}
    </div>
  );
}
