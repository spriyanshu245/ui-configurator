import React, { useEffect, useState } from "react";
import { X, Send, Bot, Loader2, Paperclip, FileText, Square, Pin, PinOff } from "lucide-react";
import { SuggestionPills } from "./SuggestionPills";
import { formatBytes, MAX_ATTACHMENTS } from "../lib/attachments";
import type { ChatSuggestion } from "../types/types";
import {
  inputPlaceholder,
  STARTER_SUGGESTIONS,
  type AttachedFile,
} from "./chatPanelUtils";
import {
  DEFAULT_LAUNCHER,
  DRAG_THRESHOLD,
  bubbleSide,
  clampLauncher,
  launcherTopLeft,
  loadLauncher,
  saveLauncher,
  type LauncherState,
} from "../lib/launcher-position";
import styles from "./ChatPanel.module.scss";

/**
 * Collapsed floating launcher button with a hover greeting. Drag it anywhere on
 * screen; the pin badge (shown on hover) locks it in place. Position and pin
 * state persist per browser. A drag never counts as a click.
 */
export function ChatLauncher({ onOpen }: Readonly<{ onOpen: () => void }>) {
  const [isHovered, setIsHovered] = useState(false);
  const [state, setState] = useState<LauncherState>(DEFAULT_LAUNCHER);
  const [viewport, setViewport] = useState({ w: 1440, h: 900 });
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = React.useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = React.useRef(false);
  const loadedRef = React.useRef(false);

  useEffect(() => {
    const read = () => ({ w: window.innerWidth, h: window.innerHeight });
    setViewport(read());
    setState(loadLauncher(typeof localStorage === "undefined" ? undefined : localStorage));
    loadedRef.current = true;
    const onResize = () => setViewport(read());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (loadedRef.current) {
      saveLauncher(typeof localStorage === "undefined" ? undefined : localStorage, state);
    }
  }, [state]);

  const topLeft = dragPos ?? launcherTopLeft(state, viewport);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (state.pinned || e.button !== 0) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: topLeft.x,
      originY: topLeft.y,
      moved: false,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
    drag.moved = true;
    setDragPos(clampLauncher({ x: drag.originX + dx, y: drag.originY + dy }, viewport));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (drag?.moved && dragPos) {
      suppressClickRef.current = true;
      setState((s) => ({ ...s, pos: dragPos }));
    }
    setDragPos(null);
  };

  const handleClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    onOpen();
  };

  const side = bubbleSide(topLeft.x, viewport);
  const dragging = dragPos !== null;

  return (
    <div
      className={styles.launcherWrapper}
      style={{ left: topLeft.x, top: topLeft.y }}
      data-testid="chat-launcher"
      data-pinned={state.pinned}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Floating Greeting Bubble */}
      {isHovered && !dragging && (
        <div
          className={`${styles.floatingBubble} ${side === "right" ? styles.floatingBubbleRight : styles.floatingBubbleLeft}`}
        >
          <span className={styles.onlineIndicator} />
          Ask LayoutX
          <div className={styles.bubbleArrow} />
        </div>
      )}

      <button
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`${styles.logoButton} ${styles.logoButtonPlaced} ${
          state.pinned ? "" : styles.logoButtonDraggable
        } ${dragging ? styles.logoButtonDragging : ""}`}
        aria-label="Open LayoutX chat"
        title={state.pinned ? "Ask LayoutX" : "Ask LayoutX — drag to move"}
        style={{
          boxShadow: isHovered
            ? "0 12px 28px -4px rgba(99, 102, 241, 0.5), 0 8px 16px -4px rgba(217, 70, 239, 0.3)"
            : "0 4px 16px 0 rgba(37, 99, 235, 0.25)",
          transform: isHovered && !dragging ? "scale(1.1) rotate(5deg)" : "scale(1)",
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

      {(isHovered || state.pinned) && !dragging && (
        <button
          type="button"
          className={`${styles.launcherPin} ${state.pinned ? styles.launcherPinActive : ""}`}
          onClick={() => setState((s) => ({ ...s, pinned: !s.pinned }))}
          aria-label={state.pinned ? "Unpin chat button" : "Pin chat button"}
          aria-pressed={state.pinned}
          title={state.pinned ? "Unpin (allow moving)" : "Pin here"}
        >
          {state.pinned ? <Pin size={11} /> : <PinOff size={11} />}
        </button>
      )}
    </div>
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
