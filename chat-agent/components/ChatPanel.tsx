"use client";
import React, { useRef, useState, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { SuggestionPills } from "./SuggestionPills";
import { PatchPreviewPanel } from "./PatchPreviewPanel";
import {
  extractAddedComponents,
  extractAddedRawNodes,
  type PreviewComponent,
} from "../lib/added-components";
import {
  createParser,
  ParsedEventLocal,
  ReconnectIntervalLocal,
} from "../lib/eventsource-parser-wrapper";
import type {
  ChatMessage as ChatMessageType,
  ChatSuggestion,
} from "../types/types";
import { useMicrosite } from "../../src/app/context/MicrositeContext";
import { useParams } from "next/navigation";
import { X, Send, Bot, Loader2, Paperclip, FileText, Square } from "lucide-react";
import {
  classifyAttachment,
  maxBytesFor,
  formatBytes,
  MAX_ATTACHMENTS,
  type AttachmentKind,
} from "../lib/attachments";
import styles from "./ChatPanel.module.scss";

type ToolCall = {
  id?: string;
  type?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
};

type PendingPatch = {
  id: string;
  currentDsl: unknown;
  patchedDsl: unknown;
  description?: string;
  previewHint?: string;
};

type PageCreationProposal = {
  micrositeId: string;
  suggestedName: string;
  purpose?: string | null;
};

type AttachedFile = {
  id: string;
  name: string;
  kind: AttachmentKind; // image | document
  format: string; // png|jpeg|gif|webp for images; pdf|csv|txt|md|... for documents
  size: number; // bytes
  dataBase64: string; // raw base64 (no data: prefix)
  previewUrl?: string; // data: URL for image thumbnail rendering (images only)
};

// Static starter prompts shown on the empty state (hybrid pills: these seed the
// conversation; the agent emits contextual "next actions" via suggest_next_actions).
const STARTER_SUGGESTIONS: ChatSuggestion[] = [
  { id: "starter-explain", label: "Explain this page", value: "Explain what this page does and list its main components." },
  { id: "starter-form", label: "Add a form", value: "Add a form with a few input fields to this page." },
  { id: "starter-table", label: "Add a table", value: "Add a table to display a list of records on this page." },
  { id: "starter-page", label: "Create a page", value: "Create a new page in this microsite." },
];

type ProposedRollback = {
  historyId: string;
  micrositeId: string;
  pagePath: string;
  description?: string;
  createdAt: string;
  reason?: string;
};

type PendingBatchOperation = {
  pagePath: string;
  description?: string;
  previewHint?: string;
  affectedComponents?: string[];
  currentDsl: unknown;
  patchedDsl: unknown;
  status?: string;
};

type PendingBatch = {
  id: string;
  batchDescription?: string;
  navigateTo?: string | null;
  operations: PendingBatchOperation[];
};

type ChatPanelMessage = ChatMessageType & {
  tool_call_id?: string;
  tool_calls?: ToolCall[];
  type?:
    | "patch_proposed"
    | "rollback_proposed"
    | "batch_proposed"
    | "page_creation_proposed"
    | "page_map";
  patch?: PendingPatch;
  rollback?: ProposedRollback;
  batch?: PendingBatch;
  pageCreation?: PageCreationProposal;
  pageMap?: unknown;
  _isStatus?: boolean;
  _isStreaming?: boolean;
  _isError?: boolean;
  _retryMessages?: ChatPanelMessage[];
  _changeStatus?: "proposed" | "applied" | "reverted";
  _attachedImageNames?: string[];
};

type RouteMessage = Pick<
  ChatPanelMessage,
  "role" | "content" | "name" | "tool_call_id" | "tool_calls"
>;

const createMessageId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`;

/**
 * Build the identity headers the backend expects, mirroring the app's shared
 * APIService: an `Authorization: Bearer` token plus an `x-user-id` resolved from
 * `global.login.userDetails`. The backend rejects config PUTs with a
 * ContextException ("Failed to get User Id from context") when x-user-id is
 * absent, so every approve/reject/rollback request must forward it — the server
 * route relays these headers on to the backend PUT.
 */
const buildAuthHeaders = (
  base: Record<string, string> = {},
): Record<string, string> => {
  const headers: Record<string, string> = { ...base };
  try {
    const token = sessionStorage.getItem("accessToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const rawDetails = sessionStorage.getItem("global.login.userDetails");
    if (rawDetails) {
      const userId = JSON.parse(rawDetails)?.userId;
      if (userId !== undefined && userId !== null && `${userId}` !== "") {
        headers["x-user-id"] = `${userId}`;
      }
    }
  } catch {
    // sessionStorage/JSON access can throw in some contexts — send whatever we have.
  }
  return headers;
};

const createMessage = (
  message: Omit<ChatPanelMessage, "id">,
): ChatPanelMessage => ({
  id: createMessageId(),
  ...message,
});

const normalizeIncomingMessage = (
  message: Partial<ChatPanelMessage>,
): ChatPanelMessage =>
  createMessage({
    role: message.role ?? "assistant",
    content: typeof message.content === "string" ? message.content : "",
    name: message.name,
    tool_call_id: message.tool_call_id,
    tool_calls: message.tool_calls,
  });

const replaceAssistantMessage = (
  currentMessages: ChatPanelMessage[],
  assistantMessage: ChatPanelMessage,
) => {
  const nextMessages = [...currentMessages];

  for (let index = nextMessages.length - 1; index >= 0; index -= 1) {
    if (nextMessages[index].role === "assistant") {
      nextMessages[index] = {
        ...nextMessages[index],
        ...assistantMessage,
        id: nextMessages[index].id,
      };
      return nextMessages;
    }
  }

  return nextMessages;
};

const toRouteMessages = (messages: ChatPanelMessage[]): RouteMessage[] =>
  messages.map(({ role, content, name, tool_call_id, tool_calls }) => ({
    role,
    content,
    name,
    tool_call_id,
    tool_calls,
  }));

export function ChatPanel() {
  const { microsite, activePageCode, setActivePage, addPage } = useMicrosite();
  const routeParams = useParams();
  const workspaceCode =
    (routeParams?.workspaceCode as string | undefined) ?? undefined;
  const micrositeId = microsite.code?.trim();
  // Per-tab id — used to keep the canonical session's clientSessionIds list in
  // sync, never used as the query key for session state.
  const sessionIdRef = useRef(createMessageId());
  // Canonical (userId, micrositeId) session id resolved by /api/session/restore.
  // Falls back to the per-tab id until restore completes.
  const canonicalSessionIdRef = useRef<string | null>(null);
  // taskContext + pageOps stashed from /api/session/restore so continuity survives
  // across chat turns instead of being dropped on the floor.
  const sessionContextRef = useRef<{
    taskContext?: Record<string, any>;
    pageOps?: Record<string, any[]>;
  }>({});
  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [messages, setMessages] = useState<ChatPanelMessage[]>([]);
  const [input, setInput] = useState("");
  // Agent-emitted "next action" pills for the current turn (hybrid: paired with
  // static empty-state starters below).
  const [suggestions, setSuggestions] = useState<ChatSuggestion[]>([]);
  // Component preview side panel (opened from a patch/batch proposal).
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<{
    title: string;
    subtitle?: string;
    components: PreviewComponent[];
    rawNodes: Record<string, any>[];
  }>({ title: "Preview", components: [], rawNodes: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Declarative session-restore pill (replaces the old imperative DOM hack).
  const [showRestorePill, setShowRestorePill] = useState(false);
  const restorePillTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  // File attachments (images + documents) for the next message.
  const [pendingFiles, setPendingFiles] = useState<AttachedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [width, setWidth] = useState(450);
  const [isResizing, setIsResizing] = useState(false);
  const [isHandleHovered, setIsHandleHovered] = useState(false);
  const [isHoveredLogo, setIsHoveredLogo] = useState(false);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 320 && newWidth <= 1200) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        150,
      )}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/chat")
        .then((res) => res.json())
        .then((data) => console.log("DB Init status:", data))
        .catch((err) =>
          console.error("Failed to init DB connection on window open:", err),
        );

      if (micrositeId) {
        const token = sessionStorage.getItem("accessToken");
        fetch(
          `/api/session/restore?micrositeId=${encodeURIComponent(micrositeId)}&clientSessionId=${encodeURIComponent(sessionIdRef.current)}`,
          {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          },
        )
          .then((res) => res.json())
          .then((data) => {
            if (typeof data.sessionId === "string") {
              canonicalSessionIdRef.current = data.sessionId;
            }
            sessionContextRef.current = {
              taskContext: data.taskContext,
              pageOps: data.pageOps,
            };

            if (
              data.messages &&
              data.messages.length > 0 &&
              messages.length === 0
            ) {
              const m = data.messages.map((msg: any) =>
                createMessage({
                  role: msg.role,
                  content: msg.content,
                  type: msg.type,
                  patch: msg.patch,
                  tool_call_id: msg.tool_call_id,
                  tool_calls: msg.tool_calls,
                }),
              );
              setMessages(m);

              // Show pill (declarative React state — auto-dismisses after 5s).
              if (restorePillTimeoutRef.current) {
                clearTimeout(restorePillTimeoutRef.current);
              }
              setShowRestorePill(true);
              restorePillTimeoutRef.current = setTimeout(() => {
                setShowRestorePill(false);
                restorePillTimeoutRef.current = null;
              }, 5000);
            }
          })
          .catch((err) => console.error("Failed to restore session", err));
      }
    }
  }, [isOpen, micrositeId]);

  // Clear any pending restore-pill timeout on unmount.
  useEffect(() => {
    return () => {
      if (restorePillTimeoutRef.current) {
        clearTimeout(restorePillTimeoutRef.current);
      }
    };
  }, []);

  const appendAssistantMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      createMessage({ role: "assistant", content }),
    ]);
  };

  // Routes both catch-block errors and SSE {type:"error"} events through a
  // distinctly-styled error bubble (instead of a plain assistant message),
  // tagging it with the messages needed to retry via the existing triggerAgent.
  const appendErrorMessage = (
    content: string,
    retryMessages?: ChatPanelMessage[],
  ) => {
    setMessages((prev) => [
      ...prev,
      createMessage({
        role: "assistant",
        content,
        _isError: true,
        _retryMessages: retryMessages,
      }),
    ]);
  };

  const addStatusMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      createMessage({ role: "assistant", content, _isStatus: true }),
    ]);
  };

  const triggerAgent = async (
    currentMessages: ChatPanelMessage[],
    files?: AttachedFile[],
  ) => {
    if (!micrositeId) {
      appendAssistantMessage(
        "Open a microsite configurator page before using the assistant.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const reqHeaders = buildAuthHeaders({ "Content-Type": "application/json" });

      abortControllerRef.current = new AbortController();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: reqHeaders,
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          messages: toRouteMessages(currentMessages),
          micrositeId,
          pageCode: activePageCode,
          id: activePageCode,
          sessionId: canonicalSessionIdRef.current ?? sessionIdRef.current,
          clientSessionId: sessionIdRef.current,
          workspaceCode,
          taskContext: sessionContextRef.current?.taskContext,
          pageOps: sessionContextRef.current?.pageOps,
          attachments:
            files && files.length
              ? files.map((f) => ({
                  kind: f.kind,
                  format: f.format,
                  name: f.name,
                  dataBase64: f.dataBase64,
                }))
              : undefined,
        }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        const errMsg =
          errData?.message ||
          errData?.error ||
          `Chat request failed with status ${response.status}.`;
        throw new Error(errMsg);
      }

      if (!response.body) {
        throw new Error("Chat response stream was empty.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let syncedMessages = [...currentMessages];
      let hasSyncedMessages = false;
      let assistantMessage = createMessage({
        role: "assistant",
        content: "",
        _isStreaming: true,
      });
      setMessages([...syncedMessages, assistantMessage]);

      const parser = createParser(
        (event: ParsedEventLocal | ReconnectIntervalLocal) => {
          if (event.type !== "event") {
            return;
          }

          try {
            const data = JSON.parse(event.data) as {
              type?: string;
              content?: string;
              patch?: PendingPatch;
              rollback?: ProposedRollback;
              batch?: PendingBatch;
              tool_call_id?: string;
              message?: string;
              messages?: Partial<ChatPanelMessage>[];
              pageCode?: string;
              reason?: string | null;
              micrositeId?: string;
              suggestedName?: string;
              purpose?: string | null;
              pageMap?: unknown;
              suggestions?: ChatSuggestion[];
            };

            if (
              data.type === "text_chunk" &&
              typeof data.content === "string"
            ) {
              assistantMessage = {
                ...assistantMessage,
                content: assistantMessage.content + data.content,
              };
              setMessages(
                hasSyncedMessages
                  ? replaceAssistantMessage(syncedMessages, assistantMessage)
                  : [...syncedMessages, assistantMessage],
              );
              return;
            }

            if (data.type === "patch_proposed" && data.patch) {
              assistantMessage = {
                ...assistantMessage,
                type: "patch_proposed",
                patch: data.patch,
                tool_call_id: data.tool_call_id,
                _isStreaming: false,
                _changeStatus: "proposed",
              };
              setMessages(
                hasSyncedMessages
                  ? replaceAssistantMessage(syncedMessages, assistantMessage)
                  : [...syncedMessages, assistantMessage],
              );
              return;
            }

            if (data.type === "batch_proposed" && data.batch) {
              assistantMessage = {
                ...assistantMessage,
                type: "batch_proposed",
                batch: data.batch,
                tool_call_id: data.tool_call_id,
                _isStreaming: false,
                _changeStatus: "proposed",
              };
              setMessages(
                hasSyncedMessages
                  ? replaceAssistantMessage(syncedMessages, assistantMessage)
                  : [...syncedMessages, assistantMessage],
              );
              return;
            }

            if (data.type === "rollback_proposed" && data.rollback) {
              assistantMessage = {
                ...assistantMessage,
                type: "rollback_proposed",
                rollback: data.rollback,
                tool_call_id: data.tool_call_id,
                _isStreaming: false,
                _changeStatus: "proposed",
              };
              setMessages(
                hasSyncedMessages
                  ? replaceAssistantMessage(syncedMessages, assistantMessage)
                  : [...syncedMessages, assistantMessage],
              );
              return;
            }

            if (
              data.type === "page_creation_proposed" &&
              typeof data.suggestedName === "string"
            ) {
              assistantMessage = {
                ...assistantMessage,
                type: "page_creation_proposed",
                pageCreation: {
                  micrositeId: data.micrositeId ?? (micrositeId as string),
                  suggestedName: data.suggestedName,
                  purpose: data.purpose ?? null,
                },
                tool_call_id: data.tool_call_id,
                _isStreaming: false,
              };
              setMessages(
                hasSyncedMessages
                  ? replaceAssistantMessage(syncedMessages, assistantMessage)
                  : [...syncedMessages, assistantMessage],
              );
              return;
            }

            if (data.type === "navigate" && data.pageCode) {
              // Agent-driven, non-destructive UI navigation.
              setActivePage(data.pageCode);
              addStatusMessage(
                data.reason
                  ? `Navigated to "${data.pageCode}" — ${data.reason}`
                  : `Navigated to "${data.pageCode}".`,
              );
              return;
            }

            if (data.type === "page_map" && data.pageMap) {
              assistantMessage = {
                ...assistantMessage,
                type: "page_map",
                pageMap: data.pageMap,
                tool_call_id: data.tool_call_id,
                _isStreaming: false,
              };
              setMessages(
                hasSyncedMessages
                  ? replaceAssistantMessage(syncedMessages, assistantMessage)
                  : [...syncedMessages, assistantMessage],
              );
              return;
            }

            if (data.type === "suggestions" && Array.isArray(data.suggestions)) {
              setSuggestions(data.suggestions as ChatSuggestion[]);
              return;
            }

            if (data.type === "sync_messages" && Array.isArray(data.messages)) {
              hasSyncedMessages = true;
              syncedMessages = data.messages.map(normalizeIncomingMessage);
              setMessages(syncedMessages);
              return;
            }

            if (data.type === "error" && typeof data.message === "string") {
              appendErrorMessage(data.message, currentMessages);
            }
          } catch (error) {
            console.error("Error parsing SSE event data", error);
          }
        },
      );

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        parser.feed(decoder.decode(value));
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Fetch aborted");
        return;
      }
      console.error(error);
      appendErrorMessage(
        error instanceof Error
          ? error.message
          : "Sorry, I encountered an error.",
        currentMessages,
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const sendMessage = () => {
    const trimmedInput = input.trim();
    const hasFiles = pendingFiles.length > 0;
    // An attachment on its own is valid input, even with no text.
    if ((!trimmedInput && !hasFiles) || isLoading) return;

    const hasImages = pendingFiles.some((f) => f.kind === "image");
    const displayContent =
      trimmedInput ||
      (hasImages
        ? `Configure this page to match the attached ${
            pendingFiles.length > 1 ? "designs" : "design"
          }.`
        : `Use the attached file${pendingFiles.length > 1 ? "s" : ""} as input.`);

    const userMessage = createMessage({
      role: "user",
      content: displayContent,
      _attachedImageNames: hasFiles ? pendingFiles.map((f) => f.name) : undefined,
    });
    const nextMessages = [
      ...messages.filter((message) => !message._isStatus),
      userMessage,
    ];

    const filesForSend = hasFiles ? pendingFiles : undefined;

    setMessages(nextMessages);
    setInput("");
    setPendingFiles([]);
    setSuggestions([]);

    void triggerAgent(nextMessages, filesForSend);
  };

  // Send a specific prompt as the user's next message — used by suggestion pills
  // (agent "next actions" and the empty-state starters).
  const sendPrompt = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    const userMessage = createMessage({ role: "user", content: trimmed });
    const nextMessages = [
      ...messages.filter((message) => !message._isStatus),
      userMessage,
    ];
    setMessages(nextMessages);
    setInput("");
    setSuggestions([]);
    void triggerAgent(nextMessages);
  };

  // Open the component preview panel for a patch/batch proposal message.
  const handleOpenPreview = (message: ChatPanelMessage) => {
    let components: PreviewComponent[] = [];
    let rawNodes: Record<string, any>[] = [];
    let subtitle: string | undefined;
    if (message.type === "patch_proposed" && message.patch) {
      components = extractAddedComponents((message.patch as any).patch);
      rawNodes = extractAddedRawNodes((message.patch as any).patch);
      subtitle = (message.patch as any).description;
    } else if (message.type === "batch_proposed" && message.batch) {
      const ops = (message.batch as any).operations ?? [];
      for (const op of ops) {
        components = components.concat(extractAddedComponents(op.patch));
        rawNodes = rawNodes.concat(extractAddedRawNodes(op.patch));
      }
      subtitle = (message.batch as any).batchDescription;
    }
    // Short, stable header title; the (possibly long) change description rides
    // along as a truncated subtitle so the header never overflows.
    const count = components.length;
    const title = count > 0 ? `Preview · ${count} component${count > 1 ? "s" : ""}` : "Preview";
    setPreviewData({ title, subtitle, components, rawNodes });
    setPreviewOpen(true);
  };

  // Read attached files (images + documents) → base64 for the model. Skips
  // unsupported types, oversized files, and anything beyond MAX_ATTACHMENTS,
  // surfacing a short note for each rejection.
  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const next: AttachedFile[] = [];
    let slotsLeft = MAX_ATTACHMENTS - pendingFiles.length;

    for (const file of Array.from(fileList)) {
      if (slotsLeft <= 0) {
        appendAssistantMessage(
          `You can attach up to ${MAX_ATTACHMENTS} files at a time. "${file.name}" was skipped.`,
        );
        break;
      }
      const classified = classifyAttachment(file.type, file.name);
      if (!classified) {
        appendAssistantMessage(
          `"${file.name}" is not a supported file type (images, PDF, CSV, HTML, Word/Excel, or text/code files).`,
        );
        continue;
      }
      const limit = maxBytesFor(classified.kind);
      if (file.size > limit) {
        appendAssistantMessage(
          `"${file.name}" is too large (max ${formatBytes(limit)} for ${classified.kind}s).`,
        );
        continue;
      }
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const dataBase64 = dataUrl.split(",")[1] ?? "";
      next.push({
        id: createMessageId(),
        name: file.name,
        kind: classified.kind,
        format: classified.format,
        size: file.size,
        dataBase64,
        previewUrl: classified.kind === "image" ? dataUrl : undefined,
      });
      slotsLeft--;
    }
    if (next.length) {
      setPendingFiles((prev) => [...prev, ...next]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Retry affordance for error-styled bubbles: re-sends the same message set
  // through the EXISTING triggerAgent path — no new request logic.
  const handleRetryMessage = (retryMessages?: ChatPanelMessage[]) => {
    if (isLoading) return;
    const fallback = messages.filter(
      (message) => !message._isStatus && !message._isError,
    );
    void triggerAgent(retryMessages && retryMessages.length ? retryMessages : fallback);
  };

  // Interrupt an in-flight model request (the Stop button shown while loading).
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      appendAssistantMessage("Request stopped.");
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleApprove = async (
    patchId: string,
    toolCallId: string,
    editedDsl?: any,
  ) => {
    addStatusMessage("Approving patch...");
    setPreviewOpen(false);

    try {
      const headers = buildAuthHeaders({ "Content-Type": "application/json" });

      const response = await fetch("/api/patch/approve", {
        method: "POST",
        headers,
        body: JSON.stringify({ patchId, toolCallId, editedDsl }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "Patch approval failed.",
        );
      }

      const toolMessage = createMessage({
        role: "tool",
        tool_call_id: toolCallId,
        name: "propose_dsl_patch",
        content: JSON.stringify({
          success: true,
          message: "Patch applied successfully",
        }),
      });

      const assistantMessage = createMessage({
        role: "assistant",
        content:
          "DSL patch approved and saved successfully! I've updated the page. You can reload the preview to see the changes.",
        _changeStatus: "applied",
      });

      const nextMessages = [
        ...messages.filter((message) => !message._isStatus),
        toolMessage,
        assistantMessage,
      ];

      setMessages(nextMessages);
    } catch (error) {
      console.error(error);
      appendErrorMessage(
        error instanceof Error ? error.message : "Patch approval failed.",
      );
    }
  };

  const handleReject = async (
    patchId: string,
    reason: string,
    toolCallId: string,
  ) => {
    addStatusMessage(`Rejecting patch: ${reason}`);
    setPreviewOpen(false);

    try {
      const headers = buildAuthHeaders({ "Content-Type": "application/json" });

      const response = await fetch("/api/patch/reject", {
        method: "POST",
        headers,
        body: JSON.stringify({ patchId, reason }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "Patch rejection failed.",
        );
      }

      const toolMessage = createMessage({
        role: "tool",
        tool_call_id: toolCallId,
        name: "propose_dsl_patch",
        content: JSON.stringify(data),
      });

      const nextMessages = [
        ...messages.filter((message) => !message._isStatus),
        toolMessage,
      ];

      setMessages(nextMessages);

      await triggerAgent(nextMessages);
    } catch (error) {
      console.error(error);
      appendErrorMessage(
        error instanceof Error ? error.message : "Patch rejection failed.",
      );
    }
  };

  const handleApproveBatch = async (batchId: string, toolCallId?: string) => {
    addStatusMessage("Approving batch...");
    setPreviewOpen(false);

    try {
      const headers = buildAuthHeaders({ "Content-Type": "application/json" });

      const response = await fetch("/api/patch/approve-batch", {
        method: "POST",
        headers,
        body: JSON.stringify({ batchId, toolCallId }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        const compensationNote =
          Array.isArray(data?.compensationErrors) && data.compensationErrors.length > 0
            ? ` Compensation also failed on: ${data.compensationErrors
                .map((c: any) => c.pagePath)
                .join(", ")}. Manual verification required.`
            : "";
        const errMsg =
          (typeof data?.error === "string" ? data.error : "Batch approval failed.") +
          compensationNote;
        throw new Error(errMsg);
      }

      const toolMessage = createMessage({
        role: "tool",
        tool_call_id: toolCallId,
        name: "propose_dsl_batch",
        content: JSON.stringify({
          success: true,
          message: "Batch applied successfully",
        }),
      });

      const assistantMessage = createMessage({
        role: "assistant",
        content:
          "DSL batch approved and saved successfully! I've updated all affected pages. You can reload the preview to see the changes.",
        _changeStatus: "applied",
      });

      const nextMessages = [
        ...messages.filter((message) => !message._isStatus),
        toolMessage,
        assistantMessage,
      ];

      setMessages(nextMessages);

      if (data.navigateTo) {
        setActivePage(data.navigateTo);
      }
    } catch (error) {
      console.error(error);
      appendErrorMessage(
        error instanceof Error ? error.message : "Batch approval failed.",
      );
    }
  };

  const handleRejectBatch = async (batchId: string, reason?: string) => {
    addStatusMessage(`Rejecting batch: ${reason || "No reason"}`);
    setPreviewOpen(false);

    try {
      const headers = buildAuthHeaders({ "Content-Type": "application/json" });

      const response = await fetch("/api/patch/reject-batch", {
        method: "POST",
        headers,
        body: JSON.stringify({ batchId, reason }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "Batch rejection failed.",
        );
      }

      const nextMessages = messages.filter((message) => !message._isStatus);
      setMessages(nextMessages);
    } catch (error) {
      console.error(error);
      appendErrorMessage(
        error instanceof Error ? error.message : "Batch rejection failed.",
      );
    }
  };

  const handleCreatePage = async (
    proposalMicrositeId: string,
    name: string,
    isPopup: boolean,
    toolCallId?: string,
  ) => {
    const trimmed = (name || "").trim();
    if (!trimmed) {
      appendAssistantMessage("Please enter a page name.");
      return;
    }
    addStatusMessage(`Creating page "${trimmed}"...`);

    try {
      const headers = buildAuthHeaders({ "Content-Type": "application/json" });
      const response = await fetch("/api/page/create", {
        method: "POST",
        headers,
        body: JSON.stringify({
          micrositeId: proposalMicrositeId || micrositeId,
          name: trimmed,
          isPopup,
          workspaceCode,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          typeof data?.error === "string" ? data.error : "Page creation failed.",
        );
      }

      // Sync the editor: add the page to the dropdown and navigate to it.
      addPage(data.pageCode);
      setActivePage(data.pageCode);

      const popupNote = data.isPopup
        ? " It is configured as a popup (right-aligned, 40% width, closes on backdrop click)."
        : data.popupWarning
          ? ` Note: ${data.popupWarning}`
          : "";

      // Feed the result back to the agent so it can continue the workflow
      // (e.g. route a control to the new page), then let it respond.
      const toolMessage = createMessage({
        role: "tool",
        tool_call_id: toolCallId,
        name: "propose_create_page",
        content: JSON.stringify({
          success: true,
          pageCode: data.pageCode,
          pageVersion: data.pageVersion,
          isPopup: data.isPopup,
        }),
      });
      const assistantMessage = createMessage({
        role: "assistant",
        content: `Created page "${trimmed}" (code: ${data.pageCode}) and navigated to it.${popupNote}`,
        _changeStatus: "applied",
      });

      const nextMessages = [
        ...messages.filter((message) => !message._isStatus),
        toolMessage,
        assistantMessage,
      ];
      setMessages(nextMessages);

      await triggerAgent(nextMessages);
    } catch (error) {
      console.error(error);
      appendErrorMessage(
        error instanceof Error ? error.message : "Page creation failed.",
      );
    }
  };

  const handleCancelCreatePage = () => {
    const nextMessages = messages.filter((message) => !message._isStatus);
    setMessages(nextMessages);
  };

  const handleRollback = async (historyId: string) => {
    if (!micrositeId || !activePageCode) {
      appendAssistantMessage(
        "Open a microsite configurator page before rolling back.",
      );
      return;
    }

    addStatusMessage("Rolling back...");

    try {
      const headers = buildAuthHeaders({ "Content-Type": "application/json" });

      const response = await fetch("/api/patch/rollback", {
        method: "POST",
        headers,
        body: JSON.stringify({
          micrositeId,
          pagePath: activePageCode,
          historyId,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string" ? data.error : "Rollback failed.",
        );
      }

      const assistantMessage = createMessage({
        role: "assistant",
        content:
          "Rollback applied successfully! The page has been reverted. You can reload the preview to see the changes.",
        _changeStatus: "reverted",
      });

      const nextMessages = [
        ...messages.filter((message) => !message._isStatus),
        assistantMessage,
      ];

      setMessages(nextMessages);
    } catch (error) {
      console.error(error);
      appendErrorMessage(
        error instanceof Error ? error.message : "Rollback failed.",
      );
    }
  };

  if (!isOpen) {
    return (
      <>
        {/* Floating Greeting Bubble */}
        {isHoveredLogo && (
          <div className={styles.floatingBubble}>
            <span className={styles.onlineIndicator} />
            Ask LayoutX
            <div className={styles.bubbleArrow} />
          </div>
        )}

        <button
          onClick={() => setIsOpen(true)}
          onMouseEnter={() => setIsHoveredLogo(true)}
          onMouseLeave={() => setIsHoveredLogo(false)}
          className={styles.logoButton}
          style={{
            boxShadow: isHoveredLogo
              ? "0 12px 28px -4px rgba(99, 102, 241, 0.5), 0 8px 16px -4px rgba(217, 70, 239, 0.3)"
              : "0 4px 16px 0 rgba(37, 99, 235, 0.25)",
            transform: isHoveredLogo ? "scale(1.1) rotate(5deg)" : "scale(1)",
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

  return (
    <div
      id="chat-panel-container"
      className={styles.chatPanelContainer}
      style={{ width: `${width}px` }}
    >
      <PatchPreviewPanel
        open={previewOpen}
        title={previewData.title}
        subtitle={previewData.subtitle}
        components={previewData.components}
        rawNodes={previewData.rawNodes}
        width={380}
        offsetRight={width}
        onClose={() => setPreviewOpen(false)}
      />

      {isResizing && <div className={styles.resizeOverlay} />}

      {/* Resize Handle */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
        }}
        onMouseEnter={() => setIsHandleHovered(true)}
        onMouseLeave={() => setIsHandleHovered(false)}
        className={styles.resizeHandle}
        style={{
          background: isResizing
            ? "#3b82f6"
            : isHandleHovered
              ? "rgba(59, 130, 246, 0.5)"
              : "transparent",
        }}
      />

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
        <button onClick={() => setIsOpen(false)} className={styles.closeButton}>
          <X size={20} />
        </button>
        {isLoading && <div className={styles.headerProgressBar} />}
      </div>

      {showRestorePill && (
        <div className={styles.restorePill} role="status">
          ↩ Session restored
        </div>
      )}

      <div className={styles.messagesContainer}>
        {messages
          .filter((m) => m.role !== "tool" && !m._isStatus)
          .map((msg, i) => (
            <ChatMessage
              key={i}
              message={msg}
              onApprove={handleApprove}
              onReject={handleReject}
              onEdit={() => {}}
              onRollback={handleRollback}
              onApproveBatch={handleApproveBatch}
              onRejectBatch={handleRejectBatch}
              onCreatePage={handleCreatePage}
              onCancelCreatePage={handleCancelCreatePage}
              onRetry={handleRetryMessage}
              onNavigatePage={setActivePage}
              activePageCode={activePageCode}
              onOpenPreview={handleOpenPreview}
            />
          ))}
        {isLoading && (
          <div className={styles.loadingIndicator}>
            <span className={styles.typingDots} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            Agent is thinking...
          </div>
        )}
      </div>

      {(() => {
        const visibleCount = messages.filter(
          (m) => m.role !== "tool" && !m._isStatus,
        ).length;
        if (isLoading) return null;
        // Agent's contextual next actions take priority; else, on an empty
        // conversation with a microsite loaded, show static starters.
        if (suggestions.length > 0) {
          return <SuggestionPills items={suggestions} onPick={sendPrompt} label="Next" />;
        }
        if (visibleCount === 0 && micrositeId) {
          return <SuggestionPills items={STARTER_SUGGESTIONS} onPick={sendPrompt} label="Try" />;
        }
        return null;
      })()}

      <div className={styles.inputContainer}>
        {pendingFiles.length > 0 && (
          <div className={styles.attachmentStrip}>
            {pendingFiles.map((f) =>
              f.kind === "image" ? (
                <div key={f.id} className={styles.imageThumb} title={f.name}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.previewUrl} alt={f.name} />
                  <button
                    type="button"
                    className={styles.imageThumbRemove}
                    onClick={() => removePendingFile(f.id)}
                    aria-label={`Remove ${f.name}`}
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div key={f.id} className={styles.fileChip} title={f.name}>
                  <FileText size={15} className={styles.fileChipIcon} />
                  <div className={styles.fileChipMeta}>
                    <span className={styles.fileChipName}>{f.name}</span>
                    <span className={styles.fileChipSize}>
                      {f.format.toUpperCase()} · {formatBytes(f.size)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={styles.fileChipRemove}
                    onClick={() => removePendingFile(f.id)}
                    aria-label={`Remove ${f.name}`}
                  >
                    <X size={12} />
                  </button>
                </div>
              ),
            )}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp,.pdf,.csv,.txt,.md,.markdown,.html,.htm,.json,.log,.xml,.yaml,.yml,.doc,.docx,.xls,.xlsx,.js,.jsx,.ts,.tsx,.css,.scss"
          multiple
          style={{ display: "none" }}
          onChange={(e) => void handleFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || !micrositeId || pendingFiles.length >= MAX_ATTACHMENTS}
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
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={
            isLoading
              ? "Waiting for the agent to respond..."
              : micrositeId
                ? pendingFiles.length > 0
                  ? "Describe what to do with the attached file(s)..."
                  : "Ask me to modify the layout, or attach files..."
                : "Open a microsite configurator page to start chatting..."
          }
          disabled={isLoading || !micrositeId}
          rows={1}
        />
        {isLoading ? (
          <button
            onClick={handleStop}
            className={`${styles.sendButton} ${styles.stopButton}`}
            aria-label="Stop generating"
            title="Stop"
          >
            <Square size={16} color="white" fill="white" />
          </button>
        ) : (
          <button
            onClick={sendMessage}
            disabled={!input.trim() && pendingFiles.length === 0}
            className={styles.sendButton}
            aria-label="Send message"
            style={{
              background:
                input.trim() || pendingFiles.length > 0
                  ? "var(--primary, #1c75bc)"
                  : "var(--light-gray-2, #94a3b8)",
              cursor:
                input.trim() || pendingFiles.length > 0
                  ? "pointer"
                  : "not-allowed",
            }}
          >
            <Send size={18} color="white" />
          </button>
        )}
      </div>
    </div>
  );
}
