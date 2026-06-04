import React, { useState } from 'react';

export function ApprovalGate({ patchId, toolCallId, onApprove, onReject, onEdit }: any) {
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    await onApprove(patchId, toolCallId);
    setLoading(false);
  };

  const handleReject = async () => {
    setLoading(true);
    await onReject(patchId, 'User rejected manually', toolCallId);
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
      <button onClick={handleApprove} disabled={loading} style={{ background: '#10b981', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, flex: 1 }}>
        Approve
      </button>
      <button onClick={() => onEdit(patchId)} disabled={loading} style={{ background: '#f8fafc', color: '#475569', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
        Edit
      </button>
      <button onClick={handleReject} disabled={loading} style={{ background: '#ef4444', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
        Reject
      </button>
    </div>
  );
}
