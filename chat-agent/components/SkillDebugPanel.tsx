import React, { useState, useEffect } from 'react';

export function SkillDebugPanel() {
  const [content, setContent] = useState('');

  useEffect(() => {
    // Ideally fetch from an API route that serves agentSkill.md content
    setContent('Mock Agent Skill Debug Content');
  }, []);

  return (
    <div style={{ padding: '20px', background: '#f4f4f4', borderRadius: '5px', marginTop: '20px' }}>
      <h3>Skill Debug Panel</h3>
      <pre style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {content}
      </pre>
    </div>
  );
}
