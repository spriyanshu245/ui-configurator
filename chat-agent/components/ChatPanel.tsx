"use client";
import React, { useState } from "react";
import { ChatMessage as ChatMessageView } from "./ChatMessage";
import { createParser } from "../lib/eventsource-parser-wrapper";
import type { ChatMessage as ChatMessageType } from "../types/types";

type Message = ChatMessageType & {
  type?: "text" | "patch_proposed";
  patch?: any;
};

// Local SSE event types (keeps typings without relying on external package typings)
type ParsedEventLocal =
  | { type: "event"; id?: string; data: string }
  | { type: "comment"; data: string };

type ReconnectIntervalLocal = { type: "reconnect-interval"; value: number };

interface ChatPanelPropsLocal {
  micrositeId?: string;
  sessionId?: string;
}

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export function ChatPanel({ micrositeId, sessionId }: ChatPanelPropsLocal) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const sendMessage = async (): Promise<void> => {
    if (!input.trim()) return;

    const newMessages: Message[] = [
      ...messages,
      {
        id: makeId(),
        role: "user",
        content: input,
        timestamp: new Date().toISOString(),
      },
    ];
    setMessages(newMessages);
    setInput("");

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, micrositeId, sessionId }),
      });

      // Basic handling for SSE stream using eventsource-parser
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let agentMsg: Message = {
        id: makeId(),
        role: "assistant",
        content: "",
        type: "text",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, agentMsg]);

      const parser = createParser((event: ParsedEventLocal | ReconnectIntervalLocal) => {
        if (event.type === "event") {
          try {
            const parsed = event as ParsedEventLocal;
            const data: { type: string; content?: string; patch?: any } =
              JSON.parse(parsed.data);
            if (data.type === "text_chunk") {
              setMessages((prev) => {
                const last = prev[prev.length - 1] as Message;
                const updated = (last?.content ?? "") + (data.content ?? "");
                return [...prev.slice(0, -1), { ...last, content: updated }];
              });
            } else if (data.type === "patch_proposed") {
              setMessages((prev) => {
                const last = prev[prev.length - 1] as Message;
                return [
                  ...prev.slice(0, -1),
                  { ...last, type: "patch_proposed", patch: data.patch },
                ];
              });
            }
          } catch (e) {
            console.error("Error parsing SSE event data", e);
          }
        }
      });

      while (true) {
        const { value, done } = await reader!.read();
        if (done) break;
        parser.feed(decoder.decode(value));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprove = async (patchId: string): Promise<void> => {
    await fetch("/api/patch/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patchId }),
    });
    setMessages((prev) => [
      ...prev,
      {
        id: makeId(),
        role: "assistant",
        content: "Patch approved and applied successfully!",
        type: "text",
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const handleReject = async (
    patchId: string,
    reason: string,
  ): Promise<void> => {
    await fetch("/api/patch/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patchId, reason }),
    });
    setMessages((prev) => [
      ...prev,
      {
        id: makeId(),
        role: "assistant",
        content: "Patch rejected.",
        type: "text",
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  if (!isOpen) {
    return (
      <button
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          padding: "10px",
          zIndex: 9999,
          background: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "50%",
        }}
        onClick={() => setIsOpen(true)}
      >
        💬
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        bottom: 0,
        width: "400px",
        background: "#f9f9f9",
        borderLeft: "1px solid #ccc",
        display: "flex",
        flexDirection: "column",
        zIndex: 9999,
        boxShadow: "-2px 0 5px rgba(0,0,0,0.1)",
      }}
    >
      <div
        style={{
          padding: "15px",
          background: "#333",
          color: "white",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Chat Agent (Session: {sessionId})</span>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: "transparent",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          ✖
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "15px" }}>
        {messages.map((msg, i) => (
          <ChatMessageView
            key={(msg as Message).id ?? i}
            message={msg}
            onApprove={handleApprove}
            onReject={handleReject}
            onEdit={() => {}}
          />
        ))}
      </div>

      <div
        style={{
          padding: "10px",
          borderTop: "1px solid #ccc",
          display: "flex",
        }}
      >
        <input
          style={{ flex: 1, padding: "10px" }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask me to modify the DSL..."
        />
        <button
          onClick={sendMessage}
          style={{
            padding: "10px",
            background: "#007bff",
            color: "white",
            border: "none",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
