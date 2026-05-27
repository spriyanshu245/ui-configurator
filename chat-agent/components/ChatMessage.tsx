import React from 'react';
import { DslDiffViewer } from './DslDiffViewer';
import { ApprovalGate } from './ApprovalGate';

export function ChatMessage({ message, onApprove, onReject, onEdit }: any) {
  return (
    <div style={{ margin: '10px 0', padding: '10px', background: message.role === 'user' ? '#e0f7fa' : '#fff', border: '1px solid #ccc', borderRadius: '5px' }}>
      <strong>{message.role === 'user' ? 'You' : 'Agent'}:</strong>
      <div style={{ marginTop: '5px', whiteSpace: 'pre-wrap' }}>
        {message.content}
      </div>

      {message.type === 'patch_proposed' && message.patch && (
        <div style={{ marginTop: '10px' }}>
          <DslDiffViewer
            currentDsl={message.patch.currentDsl}
            patchedDsl={message.patch.patchedDsl}
            description={message.patch.description}
            previewHint={message.patch.previewHint}
          />
          <ApprovalGate
            patchId={message.patch.id}
            onApprove={onApprove}
            onReject={onReject}
            onEdit={onEdit}
          />
        </div>
      )}
    </div>
  );
}
