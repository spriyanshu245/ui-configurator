import React from 'react';
import { DslDiffViewer } from './DslDiffViewer';
import { ApprovalGate } from './ApprovalGate';
import { Bot, User } from 'lucide-react';

export function ChatMessage({ message, onApprove, onReject, onEdit }: any) {
  const isUser = message.role === 'user';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: isUser ? 'flex-end' : 'flex-start',
      gap: '4px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        color: '#64748b',
        flexDirection: isUser ? 'row-reverse' : 'row'
      }}>
        {isUser ? <User size={14} /> : <Bot size={14} />}
        <span>{isUser ? 'You' : 'Agent'}</span>
      </div>

      <div style={{
        padding: '12px',
        background: isUser ? '#2563eb' : '#ffffff',
        color: isUser ? '#ffffff' : '#0f172a',
        border: isUser ? 'none' : '1px solid #e2e8f0',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        maxWidth: '90%',
        boxShadow: isUser ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
        lineHeight: '1.5',
        fontSize: '14px'
      }}>
        <div style={{ whiteSpace: 'pre-wrap' }}>
          {message.content}
        </div>

        {message.type === 'patch_proposed' && message.patch && (
          <div style={{ marginTop: '12px' }}>
            <DslDiffViewer
              currentDsl={message.patch.currentDsl}
              patchedDsl={message.patch.patchedDsl}
              description={message.patch.description}
              previewHint={message.patch.previewHint}
            />
            <ApprovalGate
              patchId={message.patch.id}
              toolCallId={message.tool_call_id}
              onApprove={onApprove}
              onReject={onReject}
              onEdit={onEdit}
            />
          </div>
        )}
      </div>
    </div>
  );
}
