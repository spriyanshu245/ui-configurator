import * as fs from "fs";
import * as path from "path";
import { db } from "../db/client";
import { logger } from "./logger";
import { compactDsl } from "./dsl-compact";

import { fetchMicrositePages } from "./microsite-loader";

/**
 * The system prompt is built ONCE per chat turn, in two parts:
 *  - staticText: identity, rules, curated knowledge base and the component
 *    registry. Identical across turns and users, so it sits behind a 1h
 *    prompt-cache point.
 *  - dynamicText: learned skills, microsite context, recap, preferences and
 *    this chat's attachments. Still cached within a turn (the message cache
 *    points cover everything before them), but free to change between turns.
 */

const NO_KNOWLEDGE_BASE = "# No knowledge base compiled yet.";

export interface SystemPromptParts {
  staticText: string;
  dynamicText: string;
}

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
      learnedContent = fs
        .readFileSync(learnedPath, "utf-8")
        .replace(/^_Compiled on .*_\s*$/m, "")
        .trim();
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

/** One line per page list: "Pages (3): a, b@v2, c". Read page content with get_page_dsl. */
async function buildAllPagesContent(context: any): Promise<string> {
  if (!context.micrositeId) return "";
  try {
    const micrositeData: any = await fetchMicrositePages(context.micrositeId);
    const allPages: any[] = (micrositeData?.dslJson ?? micrositeData)?.pages || [];
    const codes = allPages.map((p: any) =>
      p.pageVersion && p.pageVersion !== 1 ? `${p.pageCode}@v${p.pageVersion}` : p.pageCode,
    );
    return `Pages (${allPages.length}): ${codes.join(", ")}`;
  } catch (e) {
    logger.error("Failed to fetch initial microsite data for system prompt", {
      error: (e as Error).message,
    });
    return "";
  }
}

function readComponentRegistry(): Record<string, any> {
  try {
    const registryPath = knowledgePath("component-registry.json");
    if (fs.existsSync(registryPath)) {
      return JSON.parse(fs.readFileSync(registryPath, "utf-8"));
    }
  } catch (e) {
    logger.error("Failed to read component registry", {
      error: (e as Error).message,
    });
  }
  return {};
}

const TYPE_SUFFIX: Record<string, string> = { array: "[]", object: "{}" };

/**
 * One block per component type:
 *   form: name, nameKeyIds[], interceptors[], label* …
 *     children: sub-section, spacer
 *     example: {…compact JSON…}
 * (`*` = required; `[]` array, `{}` object; other props are strings/numbers/booleans.)
 */
export function renderRegistry(registry: Record<string, any>): string {
  const blocks = Object.entries(registry).map(([type, def]) => {
    const props = Object.entries(def?.props ?? {})
      .map(([name, p]: [string, any]) => `${name}${TYPE_SUFFIX[p?.type] ?? ""}${p?.required ? "*" : ""}`)
      .join(", ");
    const lines = [`${type}: ${props || "(no props)"}`];
    if (Array.isArray(def?.children) && def.children.length) lines.push(`  children: ${def.children.join(", ")}`);
    if (def?.notes) lines.push(`  notes: ${def.notes}`);
    if (def?.example) lines.push(`  example: ${JSON.stringify(compactDsl(def.example) ?? def.example)}`);
    return lines.join("\n");
  });
  return blocks.join("\n");
}

/** Renders an optional context section: a string as-is, anything else as pretty JSON. */
function optionalSection(title: string, data: unknown): string {
  if (!data) return "";
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return `\n═══ ${title} ═══\n${text}\n`;
}

function attachmentsSection(attachments: any[] | undefined): string {
  if (!Array.isArray(attachments) || attachments.length === 0) return "";
  const lines = attachments.map(
    (a) => `- ${a.handle} "${a.name}": ${a.summary || a.kind}`,
  );
  return `\n═══ ATTACHMENTS IN THIS CHAT ═══\nStill available — page DSLs via get_page_dsl/query_dsl_path/find_components with page_path = handle; other files via read_attachment.\n${lines.join("\n")}\n`;
}

const STATIC_PREAMBLE = `
You are a DSL Page Builder Assistant for a microsite UI configurator.
You help users read, understand, and modify microsite pages described as JSON DSL.

═══ CRITICAL OPERATING RULES ═══
1. NEVER modify DSL by writing JSON in the chat. Always use a propose_* tool.
2. NEVER apply a patch without user approval. propose_* tools queue changes — they do NOT write.
3. Use JSON Patch RFC 6902 format for all patches. Validate JSON Pointer paths (RFC 6901).
4. Ask a clarifying question only when the request is genuinely ambiguous AND the answer is not in the page, the attachments or the conversation so far. Otherwise act.
5. When referencing a component, use its ID, not just type.
6. If you are unsure about the current DSL state, call get_page_dsl to refresh.
7. ONE user request = ONE proposal. Put every op for every affected component into a single propose_dsl_patch (one page) or propose_dsl_batch (several pages). Queuing a proposal ENDS your turn — never plan "sequential proposals" or "first this table, then the next". Before proposing, enumerate all targets (find_components / get_page_dsl) and state the coverage in the description (e.g. "6/6 input-tables").
8. To ADD a page, use propose_create_page (the user confirms the name + a popup checkbox); do NOT invent page codes or try to patch a page before it exists. Use navigate_to_page to move the editor to an existing page.
9. When a request spans more than one page (e.g. route a button on page A to a new page B, or configure B as a popup), use propose_dsl_batch to change all affected pages atomically. See the knowledge base sections on Creating a New Page, Routing a Control to a Page, and Configuring a Page as a Popup.
10. LEARN as you work. When the user states a durable preference (a naming convention, a default style, a preferred component, a workflow habit), call log_user_preference. After you work out a NOVEL, reusable DSL recipe that succeeded and isn't already in your knowledge base, call record_skill with a concise how-to that names the exact property keys. Be selective — skip trivial edits, one-off facts, and anything already documented here.
11. GUIDE the user. At the END of a turn — after you've answered a question or finished explaining, and when there are obvious next steps — call suggest_next_actions with 2-4 short, clickable follow-ups (each 'value' phrased as the user's next instruction). Do NOT call it while a patch/batch/page proposal is still awaiting the user's approval, or when there is no natural next step.
12. ATTACHMENTS persist for the whole chat under a handle (att-…). An attached page DSL is never inlined: read it with get_page_dsl / query_dsl_path / find_components using the handle as page_path. Treat it as REFERENCE material — never copy its ids, tableName, form names or nameKeyIds labels; map them to the current page.

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
`;

export async function buildSystemPromptParts(context: any): Promise<SystemPromptParts> {
  const [preferences, allPagesContent] = await Promise.all([
    fetchPreferences(context),
    buildAllPagesContent(context),
  ]);
  const skillContent = readSkillContent();
  const learnedSection = buildLearnedSection();
  const registry = renderRegistry(readComponentRegistry());

  const taskContext = context.taskContext || {};
  const pageOps = context.pageOps || {};

  const staticText = `${STATIC_PREAMBLE}
═══ YOUR KNOWLEDGE BASE ═══
${skillContent}

═══ COMPONENTS ═══
Only use these types. Match props exactly. Never invent props. (* = required, [] = array, {} = object)
${registry}
`;

  const dynamicText = `${learnedSection}
═══ CURRENT MICROSITE CONTEXT ═══
Microsite ID: ${context.micrositeId || "Not provided"}
Active Page Code: ${context.pageCode || "Not provided"}
Active Page ID: ${context.id || "Not provided"}
${allPagesContent}
${optionalSection("REFERENCE DSLs", context.referenceDsls)}${optionalSection("SESSION DATA", context.sessionContext)}${attachmentsSection(context.attachments)}
═══ PRIOR CONTEXT ═══
Last task: ${taskContext.intent || "None"}
${taskContext.pendingPatch ? "Pending unapproved patch exists." : ""}
Page history: ${JSON.stringify(pageOps)}

═══ USER PREFERENCES (learned) ═══
${preferences.map((p) => `${p.key}: ${p.value}`).join("\n")}

═══ CONVERSATION STARTS ═══
`;

  return { staticText, dynamicText };
}

/** The whole prompt as one string (OpenAI-compatible providers, tests). */
export async function buildSystemPrompt(context: any): Promise<string> {
  const { staticText, dynamicText } = await buildSystemPromptParts(context);
  return `${staticText}${dynamicText}`;
}
