import * as fs from "fs";
import * as path from "path";
import { db } from "../db/client";
import { logger } from "./logger";

import { fetchMicrositePages } from "./microsite-loader";

const NO_KNOWLEDGE_BASE = "# No knowledge base compiled yet.";

function knowledgePath(file: string): string {
  return path.join(process.cwd(), "chat-agent/knowledge", file);
}

function readSkillContent(): string {
  try {
    const skillPath = knowledgePath("agentSkill.md");
    return fs.existsSync(skillPath)
      ? fs.readFileSync(skillPath, "utf-8")
      : NO_KNOWLEDGE_BASE;
  } catch {
    return NO_KNOWLEDGE_BASE;
  }
}

function buildLearnedSection(): string {
  let learnedContent = "";
  try {
    const learnedPath = knowledgePath("learnedSkills.md");
    if (fs.existsSync(learnedPath)) {
      learnedContent = fs.readFileSync(learnedPath, "utf-8").trim();
    }
  } catch (e) {
    logger.warn("Failed to read learned skills", {
      error: (e as Error).message,
    });
  }
  return learnedContent
    ? `\n═══ LEARNED FROM PAST SESSIONS ═══\nPatterns distilled from previously approved changes. Treat as helpful priors, not overrides of the curated knowledge base or the user's explicit instructions.\n${learnedContent}\n`
    : "";
}

async function fetchPreferences(
  context: any,
): Promise<{ key: string; value: string }[]> {
  try {
    return (await db
      .collection("user_preferences")
      .find({
        $or: [
          { userId: context.userId, micrositeId: context.micrositeId },
          { userId: "__global__" },
        ],
      })
      .toArray()) as unknown as { key: string; value: string }[];
  } catch (e) {
    logger.error("Failed to fetch user preferences", {
      error: (e as Error).message,
    });
    return [];
  }
}

async function buildAllPagesContent(context: any): Promise<string> {
  if (!context.micrositeId) return "";
  try {
    const micrositeData = await fetchMicrositePages(context.micrositeId);
    const allPages = micrositeData?.pages || [];
    const header = `Total pages: ${allPages.length}\nPage paths: ${allPages.map((p: any) => p.pageCode).join(", ")}\n\n`;
    const body = allPages
      .map(
        (p: any) => `
--- PAGE: ${p.pageCode} ---
${JSON.stringify(p, null, 2)}
`,
      )
      .join("\n");
    return header + body;
  } catch (e) {
    logger.error("Failed to fetch initial microsite data for system prompt", {
      error: (e as Error).message,
    });
    return "";
  }
}

function readComponentRegistry(): string {
  try {
    const registryPath = knowledgePath("component-registry.json");
    if (fs.existsSync(registryPath)) {
      return fs.readFileSync(registryPath, "utf-8");
    }
  } catch (e) {
    logger.error("Failed to read component registry", {
      error: (e as Error).message,
    });
  }
  return "{}";
}

/** Renders an optional context section: a string as-is, anything else as pretty JSON. */
function optionalSection(title: string, data: unknown): string {
  if (!data) return "";
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return `\n═══ ${title} ═══\n${text}\n`;
}

export async function buildSystemPrompt(context: any): Promise<string> {
  const skillContent = readSkillContent();
  const learnedSection = buildLearnedSection();
  const preferences = await fetchPreferences(context);
  const allPagesContent = await buildAllPagesContent(context);
  const componentRegistryContent = readComponentRegistry();

  const taskContext = context.taskContext || {};
  const pageOps = context.pageOps || {};

  const referenceDslsContent = optionalSection(
    "REFERENCE DSLs",
    context.referenceDsls,
  );
  const sessionContextData = optionalSection(
    "SESSION DATA",
    context.sessionContext,
  );

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
8. To ADD a page, use propose_create_page (the user confirms the name + a popup checkbox); do NOT invent page codes or try to patch a page before it exists. Use navigate_to_page to move the editor to an existing page.
9. When a request spans more than one page (e.g. route a button on page A to a new page B, or configure B as a popup), use propose_dsl_batch to change all affected pages atomically. See the knowledge base sections on Creating a New Page, Routing a Control to a Page, and Configuring a Page as a Popup.
10. LEARN as you work. When the user states a durable preference (a naming convention, a default style, a preferred component, a workflow habit), call log_user_preference. After you work out a NOVEL, reusable DSL recipe that succeeded and isn't already in your knowledge base, call record_skill with a concise how-to that names the exact property keys. Be selective — skip trivial edits, one-off facts, and anything already documented here.
11. GUIDE the user. At the END of a turn — after you've answered a question or finished explaining, and when there are obvious next steps — call suggest_next_actions with 2-4 short, clickable follow-ups (each 'value' phrased as the user's next instruction). Do NOT call it while a patch/batch/page proposal is still awaiting the user's approval, or when there is no natural next step.

═══ WIREFRAME / DESIGN IMAGE INPUT ═══
When the user attaches a wireframe, mock-up, or design image (e.g. a Figma export):
1. Examine the image and identify the visual structure top-to-bottom: sections, rows/columns, and each UI element.
2. Map what you see to the ALLOWED component types below (see COMPONENTS). Typical mapping:
   - Overall column/row layout → "stack" (set columns, columnWidths, columnGap, justification).
   - Grouped card / bordered region with a heading → "sub-section" (label, showLabel, border props).
   - A form area with inputs/labels → "form" wrapping "sub-section" children.
   - A read-only key/value detail grid → "data-grid" (each cell in gridData with label + value).
   - A tabular list with column headers → "table" (build tableColumns; each column is a "table-column").
   - A call-to-action / navigation control → "button-v2" (label, actionType, routing props).
   - Vertical whitespace between blocks → "spacer" (height).
3. Reproduce visible LABELS and text verbatim from the image. Infer column counts and relative widths from the layout.
4. If the image implies data binding (a value field, a fetched table), leave the value as a placeholder unless the user specifies the session-data source — do NOT invent API URLs or session paths.
5. Propose the components with propose_dsl_patch (single page) or propose_dsl_batch (multiple pages). Assign new UUID ids. Ask the user to confirm ambiguous structure rather than guessing.

═══ YOUR KNOWLEDGE BASE ═══
${skillContent}
${learnedSection}
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
