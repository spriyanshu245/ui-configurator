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
import { X, ArrowUp, Bot } from "lucide-react";

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

type ChatPanelMessage = ChatMessageType & {
  tool_call_id?: string;
  tool_calls?: ToolCall[];
  type?: "patch_proposed";
  patch?: PendingPatch;
  _isStatus?: boolean;
  _isStreaming?: boolean;
};

type RouteMessage = Pick<
  ChatPanelMessage,
  "role" | "content" | "name" | "tool_call_id" | "tool_calls"
>;

const createMessageId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`;

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
  const { microsite, activePageCode } = useMicrosite();
  const micrositeId = microsite.code?.trim();
  const sessionIdRef = useRef(createMessageId());
  const [messages, setMessages] = useState<ChatPanelMessage[]>([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
          `/api/session/restore?micrositeId=${encodeURIComponent(micrositeId)}`,
          {
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          },
        )
          .then((res) => res.json())
          .then((data) => {
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

              // Show pill
              const pill = document.createElement("div");
              pill.innerText = "↩ Session restored";
              pill.className =
                "absolute top-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs opacity-90 z-50 transition-opacity duration-500";
              pill.id = "session-restore-pill";
              document
                .getElementById("chat-panel-container")
                ?.appendChild(pill);
              setTimeout(() => {
                if (pill && pill.parentNode) pill.parentNode.removeChild(pill);
              }, 5000);
            }
          })
          .catch((err) => console.error("Failed to restore session", err));
      }
    }
  }, [isOpen, micrositeId]);

  const appendAssistantMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      createMessage({ role: "assistant", content }),
    ]);
  };

  const addStatusMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      createMessage({ role: "assistant", content, _isStatus: true }),
    ]);
  };

  const triggerAgent = async (currentMessages: ChatPanelMessage[]) => {
    if (!micrositeId) {
      appendAssistantMessage(
        "Open a microsite configurator page before using the assistant.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const reqHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const token = sessionStorage.getItem("accessToken");
      if (token) {
        reqHeaders["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: reqHeaders,
        body: JSON.stringify({
          messages: toRouteMessages(currentMessages),
          micrositeId,
          pageCode: activePageCode,
          id: activePageCode,
          sessionId: sessionIdRef.current,
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
              tool_call_id?: string;
              message?: string;
              messages?: Partial<ChatPanelMessage>[];
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
              };
              setMessages(
                hasSyncedMessages
                  ? replaceAssistantMessage(syncedMessages, assistantMessage)
                  : [...syncedMessages, assistantMessage],
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
              appendAssistantMessage(data.message);
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
    } catch (error) {
      console.error(error);
      appendAssistantMessage(
        error instanceof Error
          ? error.message
          : "Sorry, I encountered an error.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage = createMessage({ role: "user", content: trimmedInput });
    const nextMessages = [
      ...messages.filter((message) => !message._isStatus),
      userMessage,
    ];

    setMessages(nextMessages);
    setInput("");

    void triggerAgent(nextMessages);
  };

  const handleApprove = async (
    patchId: string,
    toolCallId: string,
    editedDsl?: any,
  ) => {
    addStatusMessage("Approving patch...");

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const token = sessionStorage.getItem("accessToken");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/patch/approve", {
        method: "POST",
        headers,
        body: JSON.stringify({ patchId, editedDsl }),
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
      appendAssistantMessage(
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
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      const token = sessionStorage.getItem("accessToken");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

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
      appendAssistantMessage(
        error instanceof Error ? error.message : "Patch rejection failed.",
      );
    }
  };

  if (!isOpen) {
    return (
      <>
        <style>{`
          @keyframes pulse-ring-inner {
            0% { transform: scale(0.98); opacity: 0.6; }
            100% { transform: scale(1.25); opacity: 0; }
          }
          @keyframes pulse-ring-outer {
            0% { transform: scale(0.98); opacity: 0.4; }
            100% { transform: scale(1.5); opacity: 0; }
          }
          @keyframes floating {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
            100% { transform: translateY(0px); }
          }
          @keyframes gradient-bg {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes slide-in-bubble {
            from { opacity: 0; transform: translateX(12px) scale(0.92); }
            to { opacity: 1; transform: translateX(0) scale(1); }
          }
          @keyframes pulse-green {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
          }
        `}</style>

        {/* Floating Greeting Bubble */}
        {isHoveredLogo && (
          <div
            style={{
              position: "fixed",
              bottom: "34px",
              right: "96px",
              padding: "8px 16px",
              background: "rgba(30, 41, 59, 0.95)",
              backdropFilter: "blur(4px)",
              color: "#f8fafc",
              borderRadius: "16px",
              boxShadow:
                "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
              fontSize: "13px",
              fontWeight: 500,
              whiteSpace: "nowrap",
              pointerEvents: "none",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              animation: "slide-in-bubble 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                background: "#10b981",
                borderRadius: "50%",
                animation: "pulse-green 2s infinite",
              }}
            />
            Ask LayoutX
            <div
              style={{
                position: "absolute",
                right: "-6px",
                top: "50%",
                transform: "translateY(-50%) rotate(45deg)",
                width: "12px",
                height: "12px",
                background: "rgba(30, 41, 59, 0.95)",
                borderRight: "1px solid rgba(255,255,255,0.08)",
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}
            />
          </div>
        )}

        <button
          onClick={() => setIsOpen(true)}
          onMouseEnter={() => setIsHoveredLogo(true)}
          onMouseLeave={() => setIsHoveredLogo(false)}
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            width: "60px",
            height: "60px",
            zIndex: 9999,
            background:
              "linear-gradient(135deg, #3b82f6, #6366f1, #d946ef, #3b82f6)",
            backgroundSize: "300% 300%",
            color: "white",
            border: "none",
            borderRadius: "30px",
            boxShadow: isHoveredLogo
              ? "0 12px 28px -4px rgba(99, 102, 241, 0.5), 0 8px 16px -4px rgba(217, 70, 239, 0.3)"
              : "0 4px 16px 0 rgba(37, 99, 235, 0.25)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: isHoveredLogo ? "scale(1.1) rotate(5deg)" : "scale(1)",
            animation:
              "gradient-bg 6s ease infinite, floating 3.5s ease-in-out infinite",
          }}
        >
          {/* Dual Pulse Rings */}
          <div
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              background: "rgba(99, 102, 241, 0.4)",
              zIndex: -1,
              animation:
                "pulse-ring-inner 2.5s cubic-bezier(0.215, 0.610, 0.355, 1) infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              background: "rgba(37, 99, 235, 0.2)",
              zIndex: -2,
              animation:
                "pulse-ring-outer 2.5s cubic-bezier(0.215, 0.610, 0.355, 1) 0.6s infinite",
            }}
          />
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bot size={28} style={{ strokeWidth: 2 }} />
            <span
              style={{
                position: "absolute",
                top: "-2px",
                right: "-2px",
                width: "8px",
                height: "8px",
                background: "#10b981",
                border: "2px solid #ffffff",
                borderRadius: "50%",
              }}
            />
          </div>
        </button>
      </>
    );
  }

  return (
    <div
      id="chat-panel-container"
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        bottom: 0,
        width: `${width}px`,
        background: "#ffffff",
        borderLeft: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        zIndex: 9999,
        boxShadow: "-4px 0 15px rgba(0,0,0,0.05)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Pointer event blocker overlay during resizing */}
      {isResizing && (
        <div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            cursor: "col-resize",
            zIndex: 99998,
            backgroundColor: "transparent",
          }}
        />
      )}

      {/* Resize Handle */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
        }}
        onMouseEnter={() => setIsHandleHovered(true)}
        onMouseLeave={() => setIsHandleHovered(false)}
        style={{
          position: "absolute",
          left: "-4px",
          top: 0,
          bottom: 0,
          width: "8px",
          cursor: "col-resize",
          zIndex: 10000,
          background: isResizing
            ? "#3b82f6"
            : isHandleHovered
              ? "rgba(59, 130, 246, 0.5)"
              : "transparent",
          transition: "background 0.15s ease",
        }}
      />

      <div
        style={{
          padding: "16px",
          background: "#1e293b",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Bot size={20} />
          <span style={{ fontWeight: 600 }}>LayoutX</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: "transparent",
            color: "#cbd5e1",
            border: "none",
            cursor: "pointer",
            display: "flex",
          }}
        >
          <X size={20} />
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          background: "#f8fafc",
        }}
      >
        {messages
          .filter((m) => m.role !== "tool" && !m._isStatus)
          .map((msg, i) => (
            <ChatMessage
              key={i}
              message={msg}
              onApprove={handleApprove}
              onReject={handleReject}
              onEdit={() => {}}
            />
          ))}
        {isLoading && (
          <div
            style={{
              alignSelf: "flex-start",
              color: "#64748b",
              fontSize: "14px",
              fontStyle: "italic",
              paddingLeft: "8px",
            }}
          >
            Agent is thinking...
          </div>
        )}
      </div>

      <div
        style={{
          padding: "16px",
          background: "white",
          borderTop: "1px solid #e5e7eb",
          display: "flex",
          gap: "8px",
        }}
      >
        <input
          style={{
            flex: 1,
            padding: "10px 14px",
            border: "1px solid #cbd5e1",
            borderRadius: "24px",
            outline: "none",
            fontSize: "14px",
          }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder={
            micrositeId
              ? "Ask me to modify the layout..."
              : "Open a microsite configurator page to start chatting..."
          }
          disabled={isLoading || !micrositeId}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          style={{
            padding: "10px",
            background: input.trim() && !isLoading ? "#2563eb" : "#94a3b8",
            color: "white",
            border: "none",
            borderRadius: "50%",
            cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowUp size={18} />
        </button>
      </div>
    </div>
  );
}
