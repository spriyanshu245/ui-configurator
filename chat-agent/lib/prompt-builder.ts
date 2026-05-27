import * as fs from 'fs';
import * as path from 'path';
import { db } from '../db/client';

export async function buildSystemPrompt(context: any): Promise<string> {
  const skillPath = path.join(process.cwd(), 'chat-agent/knowledge/agentSkill.md');
  let skillContent = '';
  try {
    if (fs.existsSync(skillPath)) {
      skillContent = fs.readFileSync(skillPath, 'utf-8');
    } else {
      skillContent = '# No knowledge base compiled yet.';
    }
  } catch (e) {
    skillContent = '# No knowledge base compiled yet.';
  }

  const stmt = db.prepare('SELECT * FROM user_preferences');
  const preferences = stmt.all() as {key: string, value: string}[];

  return \`
You are a DSL Page Builder Assistant for a microsite UI configurator.
You help users read, understand, and modify microsite pages described as JSON DSL.

═══ CRITICAL OPERATING RULES ═══
1. NEVER modify DSL by writing JSON in the chat. Always use the propose_dsl_patch tool.
2. NEVER apply a patch without user approval. The propose_dsl_patch tool queues it — it does NOT write.
3. Use JSON Patch RFC 6902 format for all patches. Validate JSON Pointer paths (RFC 6901).
4. Ask clarifying questions before proposing complex changes.
5. When referencing a component, use its ID, not just type.
6. If you are unsure about the current DSL state, call get_page_dsl to refresh.
7. One logical change per patch proposal. Break multi-section changes into sequential proposals.

═══ YOUR KNOWLEDGE BASE ═══
\${skillContent}

═══ CURRENT MICROSITE CONTEXT ═══
Microsite ID: \${context.micrositeId || 'Not provided'}
\${context.allPages ? \`Total pages: \${context.allPages.length}\` : ''}

═══ USER PREFERENCES (learned) ═══
\${preferences.map(p => \`\${p.key}: \${p.value}\`).join('\\n')}

═══ CONVERSATION STARTS ═══
\`;
}
