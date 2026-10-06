"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";
import { ChatMessage } from "./ChatMessage";
import { PatchPreviewPanel } from "./PatchPreviewPanel";
import {
  ChatHeader,
  ChatInputBar,
  ChatLauncher,
  LoadingIndicator,
  ResizeHandle,
  SuggestionArea,
} from "./ChatPanelParts";
import {
  attachmentOnlyContent,
  buildAuthHeaders,
  buildChatRequestBody,
  buildPreviewData,
  checkAttachment,
  clampPanelWidth,
  createMessage,
  createMessageId,
  createStreamSession,
  describeFailedResponse,
  errorMessageOf,
  errorText,
  postJson,
  toAttachedFile,
  tooManyFilesNote,
  withoutStatusMessages,
  type AttachedFile,
  type ChatPanelMessage,
  type PreviewData,
} from "./chatPanelUtils";
import type { ChatSuggestion } from "../types/types";
import { useMicrosite } from "../../src/app/context/MicrositeContext";
import { useParams } from "next/navigation";
import { MAX_ATTACHMENTS } from "../lib/attachments";
import styles from "./ChatPanel.module.scss";

const RESTORE_PILL_MS = 5000;

type SessionContext = {
  taskContext?: Record<string, any>;
  pageOps?: Record<string, any[]>;
};

/** Resize the panel by dragging its left edge. */
function useResizablePanel(initialWidth = 450) {
  const [width, setWidth] = useState(initialWidth);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const next = clampPanelWidth(e.clientX, window.innerWidth);
      if (next !== null) setWidth(next);
    };
    const handleMouseUp = () => setIsResizing(false);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const startResize = useCallback(() => setIsResizing(true), []);
  return { width, isResizing, startResize };
}

/** Declarative "session restored" pill that auto-dismisses. */
function useRestorePill() {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  // Clear any pending timeout on unmount.
  useEffect(() => clearTimer, []);

  const show = () => {
    clearTimer();
    setVisible(true);
    timeoutRef.current = setTimeout(() => {
      setVisible(false);
      timeoutRef.current = null;
    }, RESTORE_PILL_MS);
  };

  return { visible, show };
}

const fetchRestoredSession = (micrositeId: string, clientSessionId: string) => {
  const token = sessionStorage.getItem("accessToken");
  return fetch(
    `/api/session/restore?micrositeId=${encodeURIComponent(micrositeId)}&clientSessionId=${encodeURIComponent(clientSessionId)}`,
    { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } },
  ).then((res) => res.json());
};

export function ChatPanel() {
  const { microsite, activePageCode, setActivePage, addPage } = useMicrosite();
  const routeParams = useParams();
  const workspaceCode = routeParams?.workspaceCode as string | undefined;
  const micrositeId = microsite.code?.trim();
  // Per-tab id — used to keep the canonical session's clientSessionIds list in
  // sync, never used as the query key for session state.
  const sessionIdRef = useRef(createMessageId());
  // Canonical (userId, micrositeId) session id resolved by /api/session/restore.
  // Falls back to the per-tab id until restore completes.
  const canonicalSessionIdRef = useRef<string | null>(null);
  // taskContext + pageOps stashed from /api/session/restore so continuity survives
  // across chat turns instead of being dropped on the floor.
  const sessionContextRef = useRef<SessionContext>({});
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<ChatPanelMessage[]>([]);
  const [input, setInput] = useState("");
  // Agent-emitted "next action" pills for the current turn (hybrid: paired with
  // static empty-state starters).
  const [suggestions, setSuggestions] = useState<ChatSuggestion[]>([]);
  // Component preview side panel (opened from a patch/batch proposal).
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData>({
    title: "Preview",
    components: [],
    rawNodes: [],
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const restorePill = useRestorePill();
  // File attachments (images + documents) for the next message.
  const [pendingFiles, setPendingFiles] = useState<AttachedFile[]>([]);
  const { width, isResizing, startResize } = useResizablePanel();

  const applyRestoredSession = (data: any) => {
    if (typeof data.sessionId === "string") {
      canonicalSessionIdRef.current = data.sessionId;
    }
    sessionContextRef.current = {
      taskContext: data.taskContext,
      pageOps: data.pageOps,
    };

    if (data.messages?.length > 0 && messages.length === 0) {
      setMessages(
        data.messages.map((msg: any) =>
          createMessage({
            role: msg.role,
            content: msg.content,
            type: msg.type,
            patch: msg.patch,
            tool_call_id: msg.tool_call_id,
            tool_calls: msg.tool_calls,
          }),
        ),
      );
      restorePill.show();
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/chat").catch((err) =>
      console.error("Failed to init DB connection on window open:", err),
    );
    if (!micrositeId) return;
    fetchRestoredSession(micrositeId, sessionIdRef.current)
      .then(applyRestoredSession)
      .catch((err) => console.error("Failed to restore session", err));
  }, [isOpen, micrositeId]);

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

  /** Drop transient status bubbles, append `extra`, and make that the history. */
  const commitMessages = (...extra: ChatPanelMessage[]) => {
    const nextMessages = [...withoutStatusMessages(messages), ...extra];
    setMessages(nextMessages);
    return nextMessages;
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
      abortControllerRef.current = new AbortController();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: buildAuthHeaders({ "Content-Type": "application/json" }),
        signal: abortControllerRef.current.signal,
        body: buildChatRequestBody({
          messages: currentMessages,
          micrositeId,
          activePageCode,
          sessionId: canonicalSessionIdRef.current ?? sessionIdRef.current,
          clientSessionId: sessionIdRef.current,
          workspaceCode,
          taskContext: sessionContextRef.current?.taskContext,
          pageOps: sessionContextRef.current?.pageOps,
          files,
        }),
      });
      if (!response.ok) {
        throw new Error(await describeFailedResponse(response));
      }
      if (!response.body) {
        throw new Error("Chat response stream was empty.");
      }

      const stream = createStreamSession({
        currentMessages,
        micrositeId,
        setMessages,
        setSuggestions,
        setActivePage,
        addStatusMessage,
        appendErrorMessage,
      });
      stream.start();
      await stream.consume(response.body);
    } catch (error: any) {
      if (error.name === "AbortError") return;
      console.error(error);
      appendErrorMessage(
        errorMessageOf(error, "Sorry, I encountered an error."),
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

    const userMessage = createMessage({
      role: "user",
      content: trimmedInput || attachmentOnlyContent(pendingFiles),
      _attachedImageNames: hasFiles ? pendingFiles.map((f) => f.name) : undefined,
    });
    const nextMessages = commitMessages(userMessage);
    const filesForSend = hasFiles ? pendingFiles : undefined;

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
    const nextMessages = commitMessages(
      createMessage({ role: "user", content: trimmed }),
    );
    setInput("");
    setSuggestions([]);
    void triggerAgent(nextMessages);
  };

  // Open the component preview panel for a patch/batch proposal message.
  const handleOpenPreview = (message: ChatPanelMessage) => {
    setPreviewData(buildPreviewData(message));
    setPreviewOpen(true);
  };

  // Read attached files (images + documents) → base64 for the model. Skips
  // unsupported types, oversized files, and anything beyond MAX_ATTACHMENTS,
  // surfacing a short note for each rejection.
  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const next: AttachedFile[] = [];
    let slotsLeft = MAX_ATTACHMENTS - pendingFiles.length;

    for (const file of Array.from(fileList)) {
      if (slotsLeft <= 0) {
        appendAssistantMessage(tooManyFilesNote(file.name));
        break;
      }
      const checked = checkAttachment(file);
      if ("error" in checked) {
        appendAssistantMessage(checked.error);
        continue;
      }
      next.push(await toAttachedFile(file, checked.classified));
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
    void triggerAgent(retryMessages?.length ? retryMessages : fallback);
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

  const handleApprove = async (
    patchId: string,
    toolCallId: string,
    editedDsl?: any,
  ) => {
    addStatusMessage("Approving patch...");
    setPreviewOpen(false);

    try {
      const { response, data } = await postJson("/api/patch/approve", {
        patchId,
        toolCallId,
        editedDsl,
      });
      if (!response.ok) {
        throw new Error(errorText(data, "Patch approval failed."));
      }

      commitMessages(
        createMessage({
          role: "tool",
          tool_call_id: toolCallId,
          name: "propose_dsl_patch",
          content: JSON.stringify({
            success: true,
            message: "Patch applied successfully",
          }),
        }),
        createMessage({
          role: "assistant",
          content:
            "DSL patch approved and saved successfully! I've updated the page. You can reload the preview to see the changes.",
          _changeStatus: "applied",
        }),
      );
    } catch (error) {
      console.error(error);
      appendErrorMessage(errorMessageOf(error, "Patch approval failed."));
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
      const { response, data } = await postJson("/api/patch/reject", {
        patchId,
        reason,
      });
      if (!response.ok) {
        throw new Error(errorText(data, "Patch rejection failed."));
      }

      const nextMessages = commitMessages(
        createMessage({
          role: "tool",
          tool_call_id: toolCallId,
          name: "propose_dsl_patch",
          content: JSON.stringify(data),
        }),
      );

      await triggerAgent(nextMessages);
    } catch (error) {
      console.error(error);
      appendErrorMessage(errorMessageOf(error, "Patch rejection failed."));
    }
  };

  const handleApproveBatch = async (batchId: string, toolCallId?: string) => {
    addStatusMessage("Approving batch...");
    setPreviewOpen(false);

    try {
      const { response, data } = await postJson("/api/patch/approve-batch", {
        batchId,
        toolCallId,
      });

      if (!response.ok || !data.success) {
        const failed: string[] = Array.isArray(data?.compensationErrors)
          ? data.compensationErrors.map((c: any) => c.pagePath)
          : [];
        const compensationNote = failed.length
          ? ` Compensation also failed on: ${failed.join(", ")}. Manual verification required.`
          : "";
        throw new Error(errorText(data, "Batch approval failed.") + compensationNote);
      }

      commitMessages(
        createMessage({
          role: "tool",
          tool_call_id: toolCallId,
          name: "propose_dsl_batch",
          content: JSON.stringify({
            success: true,
            message: "Batch applied successfully",
          }),
        }),
        createMessage({
          role: "assistant",
          content:
            "DSL batch approved and saved successfully! I've updated all affected pages. You can reload the preview to see the changes.",
          _changeStatus: "applied",
        }),
      );

      if (data.navigateTo) {
        setActivePage(data.navigateTo);
      }
    } catch (error) {
      console.error(error);
      appendErrorMessage(errorMessageOf(error, "Batch approval failed."));
    }
  };

  const handleRejectBatch = async (batchId: string, reason?: string) => {
    addStatusMessage(`Rejecting batch: ${reason || "No reason"}`);
    setPreviewOpen(false);

    try {
      const { response, data } = await postJson("/api/patch/reject-batch", {
        batchId,
        reason,
      });
      if (!response.ok) {
        throw new Error(errorText(data, "Batch rejection failed."));
      }
      commitMessages();
    } catch (error) {
      console.error(error);
      appendErrorMessage(errorMessageOf(error, "Batch rejection failed."));
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
      const { response, data } = await postJson("/api/page/create", {
        micrositeId: proposalMicrositeId || micrositeId,
        name: trimmed,
        isPopup,
        workspaceCode,
      });

      if (!response.ok || !data.success) {
        throw new Error(errorText(data, "Page creation failed."));
      }

      // Sync the editor: add the page to the dropdown and navigate to it.
      addPage(data.pageCode);
      setActivePage(data.pageCode);

      let popupNote = "";
      if (data.isPopup) {
        popupNote =
          " It is configured as a popup (right-aligned, 40% width, closes on backdrop click).";
      } else if (data.popupWarning) {
        popupNote = ` Note: ${data.popupWarning}`;
      }

      // Feed the result back to the agent so it can continue the workflow
      // (e.g. route a control to the new page), then let it respond.
      const nextMessages = commitMessages(
        createMessage({
          role: "tool",
          tool_call_id: toolCallId,
          name: "propose_create_page",
          content: JSON.stringify({
            success: true,
            pageCode: data.pageCode,
            pageVersion: data.pageVersion,
            isPopup: data.isPopup,
          }),
        }),
        createMessage({
          role: "assistant",
          content: `Created page "${trimmed}" (code: ${data.pageCode}) and navigated to it.${popupNote}`,
          _changeStatus: "applied",
        }),
      );

      await triggerAgent(nextMessages);
    } catch (error) {
      console.error(error);
      appendErrorMessage(errorMessageOf(error, "Page creation failed."));
    }
  };

  const handleCancelCreatePage = () => {
    commitMessages();
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
      const { response, data } = await postJson("/api/patch/rollback", {
        micrositeId,
        pagePath: activePageCode,
        historyId,
      });
      if (!response.ok) {
        throw new Error(errorText(data, "Rollback failed."));
      }

      commitMessages(
        createMessage({
          role: "assistant",
          content:
            "Rollback applied successfully! The page has been reverted. You can reload the preview to see the changes.",
          _changeStatus: "reverted",
        }),
      );
    } catch (error) {
      console.error(error);
      appendErrorMessage(errorMessageOf(error, "Rollback failed."));
    }
  };

  if (!isOpen) {
    return <ChatLauncher onOpen={() => setIsOpen(true)} />;
  }

  const visibleMessages = messages.filter(
    (m) => m.role !== "tool" && !m._isStatus,
  );

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
      <ResizeHandle isResizing={isResizing} onStart={startResize} />

      <ChatHeader isLoading={isLoading} onClose={() => setIsOpen(false)} />

      {restorePill.visible && (
        <div className={styles.restorePill} role="status">
          ↩ Session restored
        </div>
      )}

      <div className={styles.messagesContainer}>
        {visibleMessages.map((msg, i) => (
          <ChatMessage
            key={i}
            message={msg}
            onApprove={handleApprove}
            onReject={handleReject}
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
        {isLoading && <LoadingIndicator />}
      </div>

      <SuggestionArea
        isLoading={isLoading}
        suggestions={suggestions}
        visibleCount={visibleMessages.length}
        hasMicrosite={Boolean(micrositeId)}
        onPick={sendPrompt}
      />

      <ChatInputBar
        input={input}
        isLoading={isLoading}
        hasMicrosite={Boolean(micrositeId)}
        pendingFiles={pendingFiles}
        fileInputRef={fileInputRef}
        onInputChange={setInput}
        onSend={sendMessage}
        onStop={handleStop}
        onFiles={(files) => void handleFiles(files)}
        onRemoveFile={removePendingFile}
      />
    </div>
  );
}
