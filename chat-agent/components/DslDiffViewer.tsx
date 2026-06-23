import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Differ, Viewer } from 'json-diff-kit';
import 'json-diff-kit/dist/viewer.css';
import CodeMirror from '@uiw/react-codemirror';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { lintGutter, linter } from '@codemirror/lint';
import { Check, X, ArrowUp, ArrowDown, AlertTriangle } from 'lucide-react';

export function DslDiffViewer({
  currentDsl,
  patchedDsl,
  description,
  previewHint,
  patchId,
  toolCallId,
  onApprove,
  onReject
}: any) {
  const [activeTab, setActiveTab] = useState<'diff' | 'edit'>('diff');
  const [editedDsl, setEditedDsl] = useState<string>(() => JSON.stringify(patchedDsl, null, 2));
  const [parsedEditedDsl, setParsedEditedDsl] = useState<any>(patchedDsl);
  const [isJsonValid, setIsJsonValid] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  
  const [rejectReasonOpen, setRejectReasonOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const diffContainerRef = useRef<HTMLDivElement>(null);
  const [changeNodes, setChangeNodes] = useState<Element[]>([]);
  const [currentChangeIndex, setCurrentChangeIndex] = useState(0);

  const differ = useMemo(() => new Differ({
    detectCircular: true,
    maxDepth: Infinity,
    showModifications: true,
    arrayDiffMethod: 'lcs'
  }), []);

  const diff = useMemo(() => {
    try {
      return differ.diff(currentDsl, parsedEditedDsl);
    } catch (e) {
      return [[], []] as any;
    }
  }, [currentDsl, parsedEditedDsl, differ]);

  // Try to find IDs in the patch diff
  const affectedComponents = useMemo(() => {
    const ids = new Set<string>();
    // Since we don't have perfect extraction, we could regex the editedDsl string,
    // but without explicit structure, it's safer to leave this lightweight or skip if unneeded.
    return Array.from(ids);
  }, [diff]);

  useEffect(() => {
    if (activeTab === 'diff' && diffContainerRef.current) {
      setTimeout(() => {
        if (!diffContainerRef.current) return;
        const nodes = Array.from(diffContainerRef.current.querySelectorAll('.json-diff-viewer-line-added, .json-diff-viewer-line-deleted, .json-diff-viewer-line-modified, [class*="added"], [class*="deleted"], [class*="modified"]')).filter(n => n.tagName === 'TR' || n.tagName === 'DIV');
        setChangeNodes(nodes);
        if (nodes.length > 0) {
          nodes[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
          setCurrentChangeIndex(0);
        }
      }, 100);
    }
  }, [activeTab, diff]);

  const goToNextChange = () => {
    if (changeNodes.length === 0) return;
    const nextIdx = (currentChangeIndex + 1) % changeNodes.length;
    setCurrentChangeIndex(nextIdx);
    changeNodes[nextIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const goToPrevChange = () => {
    if (changeNodes.length === 0) return;
    const prevIdx = (currentChangeIndex - 1 + changeNodes.length) % changeNodes.length;
    setCurrentChangeIndex(prevIdx);
    changeNodes[prevIdx].scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleEditChange = (value: string) => {
    setEditedDsl(value);
    try {
      const parsed = JSON.parse(value);
      setParsedEditedDsl(parsed);
      setIsJsonValid(true);
    } catch (e) {
      setIsJsonValid(false);
    }
  };

  const handleApprove = async () => {
    if (!isJsonValid) return;
    setIsApproving(true);
    try {
      await onApprove(patchId, toolCallId, parsedEditedDsl);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReasonOpen) {
      setRejectReasonOpen(true);
      return;
    }
    setIsRejecting(true);
    try {
      await onReject(patchId, rejectReason || 'User rejected manually', toolCallId);
    } finally {
      setIsRejecting(false);
      setRejectReasonOpen(false);
    }
  };

  if (isDismissed) return null;

  return (
    <div style={{
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      background: '#ffffff'
    }}>
      {/* Header Tabs & Info */}
      <div style={{ borderBottom: '1px solid #e2e8f0', padding: '12px', background: '#f8fafc' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#1e293b' }}>Proposed Patch</h4>
        {description && <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b' }}>{description}</p>}
        {previewHint && <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#64748b' }}><em>Hint: {previewHint}</em></p>}
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setActiveTab('diff')}
            style={{
              padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer',
              background: activeTab === 'diff' ? '#eff6ff' : '#ffffff',
              color: activeTab === 'diff' ? '#2563eb' : '#475569',
              fontWeight: activeTab === 'diff' ? 600 : 400
            }}
          >
            View Diff
          </button>
          <button 
            onClick={() => setActiveTab('edit')}
            style={{
              padding: '6px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer',
              background: activeTab === 'edit' ? '#eff6ff' : '#ffffff',
              color: activeTab === 'edit' ? '#2563eb' : '#475569',
              fontWeight: activeTab === 'edit' ? 600 : 400
            }}
          >
            Edit Patch
          </button>
        </div>
      </div>

      {/* Editor / Diff Area */}
      <div style={{ maxHeight: '55vh', overflowY: 'auto', position: 'relative' }} ref={diffContainerRef}>
        <style>{`
          .json-diff-viewer-line-added { border-left: 3px solid #10b981; }
          .json-diff-viewer-line-deleted { border-left: 3px solid #ef4444; }
          .json-diff-viewer-line-modified { border-left: 3px solid #f59e0b; }
        `}</style>
        
        {activeTab === 'diff' && (
          <div style={{ padding: '8px' }}>
            <Viewer diff={diff} />
          </div>
        )}

        {activeTab === 'edit' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {!isJsonValid && (
              <div style={{ background: '#fef2f2', color: '#ef4444', padding: '8px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #fee2e2' }}>
                <AlertTriangle size={16} /> You are editing the raw patch. Invalid JSON will block approval.
              </div>
            )}
            {isJsonValid && (
              <div style={{ background: '#fffbeb', color: '#b45309', padding: '8px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #fde68a' }}>
                <AlertTriangle size={16} /> You are editing the raw patch. Invalid JSON will block approval.
              </div>
            )}
            <CodeMirror
              value={editedDsl}
              height="100%"
              extensions={[json(), linter(jsonParseLinter()), lintGutter()]}
              onChange={handleEditChange}
              style={{ fontSize: '13px' }}
            />
          </div>
        )}
      </div>

      {/* Bottom Sticky Action Bar */}
      <div style={{ 
        borderTop: '1px solid #e2e8f0', 
        padding: '12px', 
        background: '#ffffff',
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        {/* Diff Nav */}
        {activeTab === 'diff' && changeNodes.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b', marginRight: 'auto' }}>
            <button onClick={goToPrevChange} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}><ArrowUp size={14}/></button>
            <span>Change {currentChangeIndex + 1} of {changeNodes.length}</span>
            <button onClick={goToNextChange} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}><ArrowDown size={14}/></button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', width: '100%', alignItems: 'center' }}>
          <button 
            onClick={handleApprove} 
            disabled={isApproving || !isJsonValid}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: (!isJsonValid || isApproving) ? '#94a3b8' : '#10b981',
              color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px',
              fontWeight: 600, cursor: (!isJsonValid || isApproving) ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            <Check size={16} /> {isApproving ? 'Applying...' : '✓ Apply Change'}
          </button>

          {!rejectReasonOpen ? (
            <button 
              onClick={handleReject}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'transparent', color: '#ef4444', border: '1px solid #ef4444',
                padding: '7px 16px', borderRadius: '4px', cursor: 'pointer',
                fontSize: '14px', fontWeight: 500
              }}
            >
              <X size={16} /> ✗ Reject
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '4px' }}>
              <input 
                type="text" 
                placeholder="Reason (optional)" 
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '13px', width: '150px' }}
                autoFocus
              />
              <button 
                onClick={handleReject}
                disabled={isRejecting}
                style={{
                  background: '#ef4444', color: 'white', border: 'none',
                  padding: '8px 16px', borderRadius: '4px', cursor: 'pointer',
                  fontSize: '14px', fontWeight: 600
                }}
              >
                Confirm
              </button>
            </div>
          )}

          <button 
            onClick={() => setIsDismissed(true)}
            style={{
              background: 'transparent', color: '#64748b', border: 'none',
              cursor: 'pointer', fontSize: '14px', marginLeft: 'auto'
            }}
          >
            ✕ Close
          </button>
        </div>
      </div>
    </div>
  );
}
