import React from 'react';
import { DslDiffViewer } from './DslDiffViewer';
import { DslBatchDiffViewer } from './DslBatchDiffViewer';
import { RollbackPanel } from './RollbackPanel';
import { Bot, User } from 'lucide-react';
import styles from './ChatMessage.module.scss';

export function ChatMessage({ message, onApprove, onReject, onEdit, onRollback, onApproveBatch, onRejectBatch }: any) {
  const isUser = message.role === 'user';

  return (
    <div className={`${styles.messageWrapper} ${isUser ? styles.wrapperUser : styles.wrapperAgent}`}>
      <div className={`${styles.header} ${isUser ? styles.headerUser : styles.headerAgent}`}>
        {isUser ? <User size={14} /> : <Bot size={14} />}
        <span>{isUser ? 'You' : 'Agent'}</span>
      </div>

      <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAgent}`}>
        <div className={styles.content}>
          {message.content}
        </div>

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
