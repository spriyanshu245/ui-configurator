import * as fs from "fs";
import * as path from "path";
import { db } from "../db/client";
import { logger } from "./logger";

import { fetchMicrositePages } from "./microsite-loader";

export async function buildSystemPrompt(context: any): Promise<string> {
  const skillPath = path.join(
    process.cwd(),
    "chat-agent/knowledge/agentSkill.md",
  );
  let skillContent = "";
  try {
    if (fs.existsSync(skillPath)) {
      skillContent = fs.readFileSync(skillPath, "utf-8");
    } else {
      skillContent = "# No knowledge base compiled yet.";
    }
  } catch (e) {
    skillContent = "# No knowledge base compiled yet.";
  }

  let preferences: { key: string; value: string }[] = [];
  try {
    const preferencesCollection = db.collection("user_preferences");
    preferences = (await preferencesCollection.find({}).toArray()) as unknown as { key: string; value: string }[];
  } catch (e) {
    logger.error("Failed to fetch user preferences", { error: (e as Error).message });
  }

  let allPagesContent = "";
  try {
    if (context.micrositeId) {
      const micrositeData = await fetchMicrositePages(context.micrositeId);
      const allPages = micrositeData?.pages || [];
      allPagesContent = `Total pages: ${allPages.length}\nPage paths: ${allPages.map((p: any) => p.pageCode).join(", ")}\n\n`;
      allPagesContent += allPages
        .map(
          (p: any) => `
--- PAGE: ${p.pageCode} ---
${JSON.stringify(p, null, 2)}
`,
        )
        .join("\n");
    }
  } catch (e) {
    logger.error(
      "Failed to fetch initial microsite data for system prompt",
      { error: (e as Error).message },
    );
  }

  let componentRegistryContent = "{}";
  try {
    const registryPath = path.join(process.cwd(), "chat-agent/knowledge/component-registry.json");
    if (fs.existsSync(registryPath)) {
      componentRegistryContent = fs.readFileSync(registryPath, "utf-8");
    }
  } catch (e) {
    logger.error("Failed to read component registry", { error: (e as Error).message });
  }

  const taskContext = context.taskContext || {};
  const pageOps = context.pageOps || {};

  const referenceDslsContent = context.referenceDsls 
    ? `\n═══ REFERENCE DSLs ═══\n${typeof context.referenceDsls === 'string' ? context.referenceDsls : JSON.stringify(context.referenceDsls, null, 2)}\n`
    : "";

  const sessionContextData = context.sessionContext
    ? `\n═══ SESSION DATA ═══\n${typeof context.sessionContext === 'string' ? context.sessionContext : JSON.stringify(context.sessionContext, null, 2)}\n`
    : "";

  return `
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
${skillContent}

═══ COMPONENTS ═══
Only use these types. Match props exactly. Never invent props.
${componentRegistryContent}

═══ CURRENT MICROSITE CONTEXT ═══
Microsite ID: ${context.micrositeId || "Not provided"}
Active Page Code: ${context.pageCode || "Not provided"}
Active Page ID: ${context.id || "Not provided"}
${allPagesContent}
${referenceDslsContent}
${sessionContextData}

═══ PRIOR CONTEXT ═══
Last task: ${taskContext.intent || "None"}
${taskContext.pendingPatch ? "Pending unapproved patch exists." : ""}
Page history: ${JSON.stringify(pageOps)}

═══ USER PREFERENCES (learned) ═══
${preferences.map((p) => `${p.key}: ${p.value}`).join("\n")}

═══ CONVERSATION STARTS ═══
`;
}
