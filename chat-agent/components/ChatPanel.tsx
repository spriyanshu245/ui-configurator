"use client";
import React, { useRef, useState, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import {
  createParser,
  ParsedEventLocal,
  ReconnectIntervalLocal,
} from "../lib/eventsource-parser-wrapper";
import type { ChatMessage as ChatMessageType } from "../types/types";
import { useMicrosite } from "../../src/app/context/MicrositeContext";
import { useParams } from "next/navigation";
import { X, Send, Bot, Loader2, ImagePlus } from "lucide-react";
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

type AttachedImage = {
  id: string;
  name: string;
  format: string; // png | jpeg | gif | webp
  dataBase64: string; // raw base64 (no data: prefix)
  previewUrl: string; // data: URL for thumbnail rendering
};

const SUPPORTED_IMAGE_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpeg",
  "image/gif": "gif",
  "image/webp": "webp",
};

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
    | "page_creation_proposed";
  patch?: PendingPatch;
  rollback?: ProposedRollback;
  batch?: PendingBatch;
  pageCreation?: PageCreationProposal;
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
  // Per-tab id — only ever logged (tool_call_log provenance), never used as the
  // query key for session state.
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
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddDslModal, setShowAddDslModal] = useState(false);
  const [dslInputText, setDslInputText] = useState("");
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionKeys, setSessionKeys] = useState<string[]>([]);
  const [selectedSessionKeys, setSelectedSessionKeys] = useState<Set<string>>(
    new Set(),
  );
  // Declarative session-restore pill (replaces the old imperative DOM hack).
  const [showRestorePill, setShowRestorePill] = useState(false);
  const restorePillTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  // Wireframe / design-image attachments for the next message.
  const [pendingImages, setPendingImages] = useState<AttachedImage[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!dslInputText.trim()) return;

    const timeoutId = setTimeout(() => {
      try {
        const parsed = JSON.parse(dslInputText);
        const formatted = JSON.stringify(parsed, null, 2);
        if (formatted !== dslInputText) {
          setDslInputText(formatted);
        }
      } catch (e) {
        // Ignore invalid JSON
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [dslInputText]);

  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuIndex, setSlashMenuIndex] = useState(0);

  const slashCommands = [
    { command: "/abort", description: "Interrupt ongoing model request" },
    { command: "/add-dsl", description: "Attach a reference DSL" },
    { command: "/session", description: "Append current session data" },
  ];

  const visibleSlashCommands = slashCommands.filter((c) => {
    const lastWord = input.split(/\s+/).pop() || "";
    return c.command.startsWith(lastWord);
  });

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
    images?: AttachedImage[],
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
          images:
            images && images.length
              ? images.map((img) => ({
                  format: img.format,
                  dataBase64: img.dataBase64,
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
    const hasImages = pendingImages.length > 0;
    // A wireframe image on its own is valid input, even with no text.
    if ((!trimmedInput && !hasImages) || isLoading) return;

    const displayContent =
      trimmedInput ||
      (hasImages
        ? `Configure this page to match the attached ${
            pendingImages.length > 1 ? "designs" : "design"
          }.`
        : "");

    const userMessage = createMessage({
      role: "user",
      content: displayContent,
      _attachedImageNames: hasImages ? pendingImages.map((i) => i.name) : undefined,
    });
    const nextMessages = [
      ...messages.filter((message) => !message._isStatus),
      userMessage,
    ];

    const imagesForSend = hasImages ? pendingImages : undefined;

    setMessages(nextMessages);
    setInput("");
    setPendingImages([]);
    setShowSlashMenu(false);

    void triggerAgent(nextMessages, imagesForSend);
  };

  // Read attached image files → base64 for vision input. Skips unsupported
  // types and files over ~4MB (Bedrock image limit headroom).
  const handleImageFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const MAX_BYTES = 4 * 1024 * 1024;
    const next: AttachedImage[] = [];
    for (const file of Array.from(files)) {
      const format = SUPPORTED_IMAGE_MIME[file.type];
      if (!format) {
        appendAssistantMessage(
          `"${file.name}" is not a supported image type (use PNG, JPEG, GIF, or WebP).`,
        );
        continue;
      }
      if (file.size > MAX_BYTES) {
        appendAssistantMessage(
          `"${file.name}" is too large (max 4MB). Please attach a smaller image.`,
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
        format,
        dataBase64,
        previewUrl: dataUrl,
      });
    }
    if (next.length) {
      setPendingImages((prev) => [...prev, ...next]);
    }
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const removePendingImage = (id: string) => {
    setPendingImages((prev) => prev.filter((img) => img.id !== id));
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

  const executeCommand = (cmd: string) => {
    const lastWordMatch = input.match(/\S+$/);
    const replaceStart = lastWordMatch ? lastWordMatch.index! : input.length;
    let baseInput = input.substring(0, replaceStart).trimEnd();

    if (cmd === "/abort") {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
        appendAssistantMessage("Request aborted by user.");
        setIsLoading(false);
      }
      setInput(baseInput);
    } else if (cmd === "/add-dsl") {
      setInput(baseInput);
      setShowAddDslModal(true);
    } else if (cmd === "/session") {
      setInput(baseInput);
      setSessionKeys(Object.keys(sessionStorage));
      setSelectedSessionKeys(new Set());
      setShowSessionModal(true);
    }

    setShowSlashMenu(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSlashMenu && visibleSlashCommands.length > 0) {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashMenuIndex((prev) =>
          prev > 0 ? prev - 1 : visibleSlashCommands.length - 1,
        );
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashMenuIndex((prev) =>
          prev < visibleSlashCommands.length - 1 ? prev + 1 : 0,
        );
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        executeCommand(visibleSlashCommands[slashMenuIndex].command);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowSlashMenu(false);
        return;
      }
    }

    if (e.key === "ArrowDown" && !showSlashMenu) {
      const cursor = e.currentTarget.selectionStart;
      const textBefore = input.substring(0, cursor);
      const textAfter = input.substring(cursor);

      const lastOpen = textBefore.lastIndexOf("```json");
      const nextClose = textAfter.indexOf("```");

      if (lastOpen !== -1 && nextClose !== -1) {
        e.preventDefault();
        const target = cursor + nextClose + 3;
        e.currentTarget.setSelectionRange(target, target);
        return;
      }
    }

    if (e.key === "{" && e.ctrlKey) {
      e.preventDefault();
      const val = input;
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;

      const insertText = "```json\n\n```";
      const newVal = val.substring(0, start) + insertText + val.substring(end);
      setInput(newVal);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(start + 8, start + 8);
        }
      }, 0);
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    const lastWord = val.split(/\s+/).pop();
    if (lastWord === "/") {
      setShowSlashMenu(true);
      setSlashMenuIndex(0);
    } else if (lastWord?.startsWith("/")) {
      setShowSlashMenu(true);
      setSlashMenuIndex((prev) => {
        const nextCount = slashCommands.filter((c) =>
          c.command.startsWith(lastWord),
        ).length;
        return prev >= nextCount ? Math.max(0, nextCount - 1) : prev;
      });
    } else {
      setShowSlashMenu(false);
    }
  };

  const handleApprove = async (
    patchId: string,
    toolCallId: string,
    editedDsl?: any,
  ) => {
    addStatusMessage("Approving patch...");

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

      <div className={styles.inputContainer}>
        {showSessionModal && (
          <div className={styles.modalContainer}>
            <span className={styles.modalTitle}>Select Session Data</span>
            <div className={styles.sessionScrollArea}>
              {sessionKeys.length === 0 ? (
                <span className={styles.emptyText}>
                  No session data available.
                </span>
              ) : (
                sessionKeys.map((key) => (
                  <label key={key} className={styles.sessionLabel}>
                    <input
                      type="checkbox"
                      checked={selectedSessionKeys.has(key)}
                      onChange={(e) => {
                        const next = new Set(selectedSessionKeys);
                        if (e.target.checked) next.add(key);
                        else next.delete(key);
                        setSelectedSessionKeys(next);
                      }}
                    />
                    <span className={styles.sessionKey}>{key}</span>
                  </label>
                ))
              )}
            </div>
            <div className={styles.modalButtons}>
              <button
                onClick={() => setShowSessionModal(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const selectedData: Record<string, string | null> = {};
                  selectedSessionKeys.forEach((k) => {
                    selectedData[k] = sessionStorage.getItem(k);
                  });
                  const sessionString = JSON.stringify(selectedData, null, 2);
                  setInput(
                    (prev) =>
                      prev +
                      (prev ? "\n\n" : "") +
                      `Session Data:\n\`\`\`json\n${sessionString}\n\`\`\``,
                  );
                  setShowSessionModal(false);
                  setTimeout(() => {
                    if (textareaRef.current) textareaRef.current.focus();
                  }, 0);
                }}
                disabled={selectedSessionKeys.size === 0}
                className={styles.primaryButton}
                style={{
                  background:
                    selectedSessionKeys.size === 0 ? "#94a3b8" : "#2563eb",
                  cursor:
                    selectedSessionKeys.size === 0 ? "not-allowed" : "pointer",
                }}
              >
                Add
              </button>
            </div>
          </div>
        )}
        {showAddDslModal && (
          <div className={styles.modalContainer}>
            <span className={styles.modalTitle}>Add Reference DSL</span>
            <textarea
              className={styles.dslTextarea}
              placeholder="Paste DSL here..."
              value={dslInputText}
              onChange={(e) => setDslInputText(e.target.value)}
              autoFocus
            />
            <div className={styles.modalButtonsBasic}>
              <button
                onClick={() => {
                  setShowAddDslModal(false);
                  setDslInputText("");
                }}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (dslInputText.trim()) {
                    setInput(
                      (prev) =>
                        prev +
                        (prev ? "\n\n" : "") +
                        `Reference DSL:\n\`\`\`json\n${dslInputText}\n\`\`\``,
                    );
                  }
                  setShowAddDslModal(false);
                  setDslInputText("");
                  setTimeout(() => {
                    if (textareaRef.current) textareaRef.current.focus();
                  }, 0);
                }}
                className={styles.primaryButtonBasic}
              >
                Add
              </button>
            </div>
          </div>
        )}
        {showSlashMenu && visibleSlashCommands.length > 0 && (
          <div className={styles.slashMenuContainer}>
            {visibleSlashCommands.map((cmd, idx) => (
              <div
                key={cmd.command}
                onClick={() => executeCommand(cmd.command)}
                className={styles.slashMenuItem}
                style={{
                  background:
                    idx === slashMenuIndex ? "#f1f5f9" : "transparent",
                  borderBottom:
                    idx < visibleSlashCommands.length - 1
                      ? "1px solid #f1f5f9"
                      : "none",
                }}
                onMouseEnter={() => setSlashMenuIndex(idx)}
              >
                <span className={styles.slashMenuCommand}>{cmd.command}</span>
                <span className={styles.slashMenuDesc}>{cmd.description}</span>
              </div>
            ))}
          </div>
        )}
        {pendingImages.length > 0 && (
          <div className={styles.imageStrip}>
            {pendingImages.map((img) => (
              <div key={img.id} className={styles.imageThumb} title={img.name}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.previewUrl} alt={img.name} />
                <button
                  type="button"
                  className={styles.imageThumbRemove}
                  onClick={() => removePendingImage(img.id)}
                  aria-label={`Remove ${img.name}`}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          multiple
          style={{ display: "none" }}
          onChange={(e) => void handleImageFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          disabled={isLoading || !micrositeId}
          className={styles.attachButton}
          aria-label="Attach a wireframe or design image"
          title="Attach a wireframe / design image"
        >
          <ImagePlus size={18} />
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
                ? pendingImages.length > 0
                  ? "Describe changes, or send the design as-is..."
                  : "Ask me to modify the layout, or attach a wireframe..."
                : "Open a microsite configurator page to start chatting..."
          }
          disabled={isLoading || !micrositeId}
          rows={1}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || (!input.trim() && pendingImages.length === 0)}
          className={`${styles.sendButton} ${isLoading ? styles.sendButtonLoading : ""}`}
          aria-busy={isLoading}
          style={{
            background:
              (input.trim() || pendingImages.length > 0) && !isLoading
                ? "var(--primary, #1c75bc)"
                : "var(--light-gray-2, #94a3b8)",
            cursor:
              (input.trim() || pendingImages.length > 0) && !isLoading
                ? "pointer"
                : "not-allowed",
          }}
        >
          {isLoading ? (
            <Loader2 size={18} className={styles.spinIcon} />
          ) : (
            <Send size={18} color="white" />
          )}
        </button>
      </div>
    </div>
  );
}
