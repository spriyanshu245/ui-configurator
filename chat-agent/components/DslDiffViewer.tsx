import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

export function DslDiffViewer({ currentDsl, patchedDsl, description, previewHint }: any) {
  return (
    <div className="dsl-diff-viewer" style={{ border: '1px solid #ccc', padding: '10px', marginTop: '10px' }}>
      <p><strong>Description:</strong> {description}</p>
      <p><strong>Preview Hint:</strong> {previewHint}</p>

      <div style={{ display: 'flex', gap: '10px' }}>
        <div style={{ flex: 1 }}>
          <h4>Current</h4>
          <SyntaxHighlighter language="json">
            {JSON.stringify(currentDsl, null, 2)}
          </SyntaxHighlighter>
        </div>
        <div style={{ flex: 1 }}>
          <h4>Proposed</h4>
          <SyntaxHighlighter language="json">
            {JSON.stringify(patchedDsl, null, 2)}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
}
