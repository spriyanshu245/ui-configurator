import React from 'react';

export function RollbackPanel({ history }: any) {
  return (
    <div style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
      <h3>Rollback History</h3>
      {history && history.length > 0 ? (
        <ul>
          {history.map((h: any) => (
            <li key={h.id}>
              {h.description} - {new Date(h.createdAt).toLocaleString()}
              <button disabled title="Coming soon">Rollback to here</button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No history available.</p>
      )}
    </div>
  );
}
