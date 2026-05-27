import { skillEntries } from '../db/queries/skill-entries';
import * as fs from 'fs';
import * as path from 'path';

export async function compileAgentSkill() {
  const entries = skillEntries.findAll({ orderBy: { category: 'asc', usageCount: 'desc' } });

  let md = '# Agent DSL Knowledge Base\\n\\n';
  md += \`_Compiled on \${new Date().toISOString()} from \${entries.length} entries_\n\n---\n\n\`;

  const categories = [...new Set(entries.map(e => e.category))];

  categories.forEach(cat => {
    md += \`## \${cat.toUpperCase()}\n\n\`;
    const catEntries = entries.filter(e => e.category === cat);
    catEntries.forEach(entry => {
      md += \`### \${entry.title} (Confidence: \${entry.confidence})\n\n\${entry.content}\n\n\`;
    });
  });

  const destPath = path.join(process.cwd(), 'chat-agent/knowledge/agentSkill.md');
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(destPath, md);
}
