import React, { useState } from 'react';

export function ApprovalGate({ patchId, onApprove, onReject, onEdit }: any) {
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    await onApprove(patchId);
    setLoading(false);
  };

  const handleReject = async () => {
    setLoading(true);
    await onReject(patchId, 'User rejected manually');
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
      <button onClick={handleApprove} disabled={loading} style={{ background: 'green', color: 'white', padding: '5px 10px' }}>
        ✅ Approve
      </button>
      <button onClick={() => onEdit(patchId)} disabled={loading} style={{ background: 'blue', color: 'white', padding: '5px 10px' }}>
        ✏️ Edit
      </button>
      <button onClick={handleReject} disabled={loading} style={{ background: 'red', color: 'white', padding: '5px 10px' }}>
        ❌ Reject
      </button>
    </div>
  );
}
