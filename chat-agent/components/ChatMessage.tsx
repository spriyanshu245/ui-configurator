import React from 'react';
import { DslDiffViewer } from './DslDiffViewer';
import { DslBatchDiffViewer } from './DslBatchDiffViewer';
import { RollbackPanel } from './RollbackPanel';
import { Bot, User, AlertTriangle, RotateCcw, Clock, CheckCircle2, Undo2, ImageIcon } from 'lucide-react';
import styles from './ChatMessage.module.scss';

const CHANGE_STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ size?: number }>; className: string }
> = {
  proposed: { label: 'Pending review', icon: Clock, className: 'chipProposed' },
  applied: { label: 'Applied', icon: CheckCircle2, className: 'chipApplied' },
  reverted: { label: 'Reverted', icon: Undo2, className: 'chipReverted' },
};

export function ChatMessage({ message, onApprove, onReject, onEdit, onRollback, onApproveBatch, onRejectBatch, onRetry }: any) {
  const isUser = message.role === 'user';
  const isError = Boolean(message._isError);
  const isStreaming = Boolean(message._isStreaming);
  const changeStatus = message._changeStatus as keyof typeof CHANGE_STATUS_CONFIG | undefined;
  const statusConfig = changeStatus ? CHANGE_STATUS_CONFIG[changeStatus] : undefined;

  const bubbleClassNames = [
    styles.bubble,
    isUser ? styles.bubbleUser : styles.bubbleAgent,
    isError ? styles.bubbleError : '',
    isStreaming ? styles.bubbleStreaming : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`${styles.messageWrapper} ${isUser ? styles.wrapperUser : styles.wrapperAgent}`}>
      <div className={`${styles.header} ${isUser ? styles.headerUser : styles.headerAgent}`}>
        {isUser ? <User size={14} /> : <Bot size={14} />}
        <span>{isUser ? 'You' : 'Agent'}</span>
      </div>

      <div className={bubbleClassNames}>
        {isError && (
          <div className={styles.errorHeader}>
            <AlertTriangle size={14} />
            <span>Something went wrong</span>
          </div>
        )}

        {statusConfig && (
          <div className={`${styles.statusChip} ${styles[statusConfig.className]}`}>
            <statusConfig.icon size={11} />
            <span>{statusConfig.label}</span>
          </div>
        )}

        <div className={styles.content}>
          {message.content}
          {isStreaming && (
            <span className={styles.streamingDots} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          )}
        </div>

        {Array.isArray(message._attachedImageNames) &&
          message._attachedImageNames.length > 0 && (
            <div className={styles.attachmentNote}>
              <ImageIcon size={12} />
              <span>
                {message._attachedImageNames.length === 1
                  ? message._attachedImageNames[0]
                  : `${message._attachedImageNames.length} images attached`}
              </span>
            </div>
          )}

        {isError && typeof onRetry === 'function' && (
          <button
            type="button"
            className={styles.retryButton}
            onClick={() => onRetry(message._retryMessages)}
          >
            <RotateCcw size={13} />
            <span>Retry</span>
          </button>
        )}

        {message.type === 'patch_proposed' && message.patch && (
          <div className={styles.patchContainer}>
            <DslDiffViewer
              currentDsl={message.patch.currentDsl}
              patchedDsl={message.patch.patchedDsl}
              description={message.patch.description}
              previewHint={message.patch.previewHint}
              patchId={message.patch.id}
              toolCallId={message.tool_call_id}
              patch={message.patch.patch}
              onApprove={onApprove}
              onReject={onReject}
            />
          </div>
        )}

        {message.type === 'batch_proposed' && message.batch && (
          <div className={styles.patchContainer}>
            <DslBatchDiffViewer
              batch={message.batch}
              toolCallId={message.tool_call_id}
              onApproveBatch={onApproveBatch}
              onRejectBatch={onRejectBatch}
            />
          </div>
        )}

        {message.type === 'rollback_proposed' && message.rollback && (
          <div className={styles.patchContainer}>
            <RollbackPanel
              history={[
                {
                  id: message.rollback.historyId,
                  description: message.rollback.description,
                  createdAt: message.rollback.createdAt,
                },
              ]}
              micrositeId={message.rollback.micrositeId}
              pagePath={message.rollback.pagePath}
              onRollback={onRollback}
            />
          </div>
        )}
      </div>
    </div>
  );
}
