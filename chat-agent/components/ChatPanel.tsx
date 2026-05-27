import React, { useState } from 'react';
import { ChatMessage } from './ChatMessage';
import { createParser } from 'eventsource-parser';

export function ChatPanel({ micrositeId, sessionId }: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, micrositeId, sessionId })
      });

      // Basic implementation for handling stream
      // A full implementation would use eventsource-parser or read the stream chunks properly
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let agentMsg = { role: 'assistant', content: '', type: 'text' };
      setMessages(prev => [...prev, agentMsg]);

      const parser = createParser((event) => {
        if (event.type === 'event') {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'text_chunk') {
              setMessages(prev => {
                const last = prev[prev.length - 1];
                return [...prev.slice(0, -1), { ...last, content: last.content + data.content }];
              });
            } else if (data.type === 'patch_proposed') {
              setMessages(prev => {
                const last = prev[prev.length - 1];
                return [...prev.slice(0, -1), { ...last, type: 'patch_proposed', patch: data.patch }];
              });
            }
          } catch (e) {
            console.error('Error parsing SSE event data', e);
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

  const handleApprove = async (patchId: string) => {
    await fetch('/api/patch/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patchId })
    });
    setMessages(prev => [...prev, { role: 'assistant', content: 'Patch approved and applied successfully!' }]);
  };

  const handleReject = async (patchId: string, reason: string) => {
    await fetch('/api/patch/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patchId, reason })
    });
    setMessages(prev => [...prev, { role: 'assistant', content: 'Patch rejected.' }]);
  };

  if (!isOpen) {
    return (
      <button
        style={{ position: 'fixed', bottom: '20px', right: '20px', padding: '10px', zIndex: 9999, background: '#007bff', color: 'white', border: 'none', borderRadius: '50%' }}
        onClick={() => setIsOpen(true)}
      >
        💬
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, bottom: 0, width: '400px',
      background: '#f9f9f9', borderLeft: '1px solid #ccc', display: 'flex', flexDirection: 'column',
      zIndex: 9999, boxShadow: '-2px 0 5px rgba(0,0,0,0.1)'
    }}>
      <div style={{ padding: '15px', background: '#333', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
        <span>Chat Agent (Session: {sessionId})</span>
        <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', color: 'white', border: 'none', cursor: 'pointer' }}>✖</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} onApprove={handleApprove} onReject={handleReject} onEdit={() => {}} />
        ))}
      </div>

      <div style={{ padding: '10px', borderTop: '1px solid #ccc', display: 'flex' }}>
        <input
          style={{ flex: 1, padding: '10px' }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask me to modify the DSL..."
        />
        <button onClick={sendMessage} style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none' }}>Send</button>
      </div>
    </div>
  );
}
