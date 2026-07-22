import React, { useState } from 'react';
import styles from './ApprovalGate.module.scss';

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
    <div className={styles.container}>
      <button onClick={handleApprove} disabled={loading} className={styles.approveBtn}>
        Approve
      </button>
      <button onClick={() => onEdit(patchId)} disabled={loading} className={styles.editBtn}>
        Edit
      </button>
      <button onClick={handleReject} disabled={loading} className={styles.rejectBtn}>
        Reject
      </button>
    </div>
  );
}
