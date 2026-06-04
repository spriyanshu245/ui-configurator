"use client";
import React, { useState } from "react";
import { ChatMessage as ChatMessageView } from "./ChatMessage";
import { createParser } from "../lib/eventsource-parser-wrapper";
import type { ChatMessage as ChatMessageType } from "../types/types";

import { MessageSquare, X, Send, Bot, User } from 'lucide-react';

export function ChatPanel({ micrositeId, sessionId }: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const triggerAgent = async (currentMessages: any[]) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: currentMessages, micrositeId, sessionId })
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let localMessages = [...currentMessages];
      let assistantMsg = { role: 'assistant', content: '', _isStreaming: true };
      setMessages([...localMessages, assistantMsg]);

      const parser = createParser((event: ParsedEventLocal | ReconnectIntervalLocal) => {
        if (event.type === "event") {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'text_chunk') {
              assistantMsg.content += data.content;
              setMessages([...localMessages, { ...assistantMsg }]);
            } else if (data.type === 'patch_proposed') {
              assistantMsg = { ...assistantMsg, type: 'patch_proposed', patch: data.patch, tool_call_id: data.tool_call_id };
              setMessages([...localMessages, assistantMsg]);
            } else if (data.type === 'sync_messages') {
              localMessages = data.messages;
              setMessages(localMessages);
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
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = () => {
    if (!input.trim() || isLoading) return;
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    triggerAgent(newMessages);
  };

  const handleApprove = async (patchId: string, toolCallId: string) => {
    setMessages(prev => [...prev, { role: 'user', content: 'Approving patch...', _isStatus: true }]);
    const res = await fetch('/api/patch/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patchId })
    });
    const data = await res.json();

    // Add tool response to history and trigger agent to continue
    const newMessages = [
      ...messages,
      { role: 'tool', tool_call_id: toolCallId, name: 'propose_dsl_patch', content: JSON.stringify(data) }
    ];
    setMessages(newMessages);
    triggerAgent(newMessages);
  };

  const handleReject = async (patchId: string, reason: string, toolCallId: string) => {
    setMessages(prev => [...prev, { role: 'user', content: `Rejecting patch: ${reason}`, _isStatus: true }]);
    const res = await fetch('/api/patch/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patchId, reason })
    });
    const data = await res.json();

    // Add tool response to history and trigger agent to continue
    const newMessages = [
      ...messages,
      { role: 'tool', tool_call_id: toolCallId, name: 'propose_dsl_patch', content: JSON.stringify(data) }
    ];
    setMessages(newMessages);
    triggerAgent(newMessages);
  };

  if (!isOpen) {
    return (
      <button
        style={{ position: 'fixed', bottom: '20px', right: '20px', padding: '15px', zIndex: 9999, background: '#2563eb', color: 'white', border: 'none', borderRadius: '50%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, bottom: 0, width: '450px',
      background: '#ffffff', borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column',
      zIndex: 9999, boxShadow: '-4px 0 15px rgba(0,0,0,0.05)', fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ padding: '16px', background: '#1e293b', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bot size={20} />
          <span style={{ fontWeight: 600 }}>UI Assistant</span>
        </div>
        <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', color: '#cbd5e1', border: 'none', cursor: 'pointer', display: 'flex' }}>
          <X size={20} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#f8fafc' }}>
        {messages.filter(m => m.role !== 'tool' && !m._isStatus).map((msg, i) => (
          <ChatMessage key={i} message={msg} onApprove={handleApprove} onReject={handleReject} onEdit={() => {}} />
        ))}
        {isLoading && <div style={{ alignSelf: 'flex-start', color: '#64748b', fontSize: '14px', fontStyle: 'italic', paddingLeft: '8px' }}>Agent is thinking...</div>}
      </div>

      <div style={{ padding: '16px', background: 'white', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '8px' }}>
        <input
          style={{ flex: 1, padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '24px', outline: 'none', fontSize: '14px' }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask me to modify the layout..."
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          style={{ padding: '10px', background: input.trim() && !isLoading ? '#2563eb' : '#94a3b8', color: 'white', border: 'none', borderRadius: '50%', cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Send size={18} style={{ marginLeft: '2px' }} />
        </button>
      </div>
    </div>
  );
}
