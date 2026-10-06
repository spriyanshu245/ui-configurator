import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { TOOL_CAPABLE_MODEL } from "./freellm-client";
import { DSL_TOOLS } from "./tool-definitions";
import { logger } from "./logger";
import {
  SUPPORTED_IMAGE_FORMATS,
  SUPPORTED_DOC_FORMATS,
  sanitizeDocName,
} from "./attachments";

/**
 * Convert a message's `content` into Bedrock Converse content blocks.
 * A string becomes a single text block. An array may interleave
 * `{ type: "text", text }`, `{ type: "image", format, dataBase64 }` and
 * `{ type: "document", format, name, dataBase64 }` items — images become
 * Converse `{ image: {...} }` blocks (wireframe/design input) and documents
 * become `{ document: {...} }` blocks (PDFs, spreadsheets, text/code files).
 * Document names are sanitized and de-duplicated to satisfy Bedrock's rules.
 */
export function toBedrockContentBlocks(content: unknown): any[] {
  if (typeof content === "string") {
    return content ? [{ text: content }] : [];
  }
  if (!Array.isArray(content)) {
    return content ? [{ text: JSON.stringify(content) }] : [];
  }

  const blocks: any[] = [];
  const usedDocNames = new Set<string>();
  content.forEach((part, index) => {
    const block = partToBlock(part, index, usedDocNames);
    if (block) blocks.push(block);
  });
  return blocks;
}

function imagePartToBlock(part: any): any | null {
  const format = String(part.format || "png").toLowerCase();
  if (!SUPPORTED_IMAGE_FORMATS.has(format)) {
    logger.warn("Skipping image with unsupported format", { format });
    return null;
  }
  return {
    image: {
      format,
      source: { bytes: Buffer.from(part.dataBase64, "base64") },
    },
  };
}

function documentPartToBlock(
  part: any,
  index: number,
  usedDocNames: Set<string>,
): any | null {
  const format = String(part.format || "").toLowerCase();
  if (!SUPPORTED_DOC_FORMATS.has(format)) {
    logger.warn("Skipping document with unsupported format", { format });
    return null;
  }
  let name = sanitizeDocName(part.name, index);
  let n = 2;
  while (usedDocNames.has(name)) {
    name = sanitizeDocName(`${part.name} ${n}`, index);
    n++;
  }
  usedDocNames.add(name);
  return {
    document: {
      format,
      name,
      source: { bytes: Buffer.from(part.dataBase64, "base64") },
    },
  };
}

function partToBlock(
  part: any,
  index: number,
  usedDocNames: Set<string>,
): any | null {
  if (!part) return null;
  if (typeof part === "string") return { text: part };
  if (part.type === "text" && typeof part.text === "string") {
    return part.text ? { text: part.text } : null;
  }
  if (part.type === "image" && typeof part.dataBase64 === "string") {
    return imagePartToBlock(part);
  }
  if (part.type === "document" && typeof part.dataBase64 === "string") {
    return documentPartToBlock(part, index, usedDocNames);
  }
  return null;
}

function syntheticToolError(toolUseId: string, message: string) {
  return {
    toolResult: {
      toolUseId,
      content: [{ text: JSON.stringify({ error: message }) }],
      status: "error",
    },
  };
}

function buildToolSpecs() {
  return DSL_TOOLS.map((t: any) => ({
    toolSpec: {
      name: t.function.name,
      description: t.function.description,
      inputSchema: {
        json: t.function.parameters,
      },
    },
  }));
}

function assistantBlocks(msg: any, pendingToolUseIds: string[]): any[] {
  const blocks: any[] = [];
  if (msg.content) blocks.push({ text: msg.content });
  for (const tc of msg.tool_calls ?? []) {
    blocks.push({
      toolUse: {
        toolUseId: tc.id,
        name: tc.function.name,
        input:
          typeof tc.function.arguments === "string"
            ? JSON.parse(tc.function.arguments)
            : tc.function.arguments,
      },
    });
    pendingToolUseIds.push(tc.id);
  }
  return blocks;
}

/** Returns blocks for a tool message and removes its id from `pending` when matched. */
function toolBlocks(msg: any, pending: string[]): any[] {
  // Provide stringified content to the text field to entirely bypass Bedrock JSON validation
  const textContent =
    typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);

  const idx = pending.indexOf(msg.tool_call_id);
  if (idx === -1) {
    // Bedrock strictly forbids duplicate toolUseIds. If the system injected a preliminary tool result
    // (like "Patch queued for approval") and then later injected the final result ("Patch approved"),
    // the second one is a duplicate and will crash Bedrock. We convert duplicates to normal text.
    return [{ text: `[Update for tool ${msg.tool_call_id}]: ${textContent}` }];
  }
  const remaining = pending.filter((id) => id !== msg.tool_call_id);
  pending.length = 0;
  pending.push(...remaining);
  return [
    {
      toolResult: {
        toolUseId: msg.tool_call_id,
        content: [{ text: textContent }],
      },
    },
  ];
}

function userBlocks(msg: any, pending: string[]): any[] {
  // If there are pending tool uses that were ignored by the user's text message,
  // we MUST append synthetic toolResults for them to satisfy Bedrock validation.
  const blocks = pending.map((tId) =>
    syntheticToolError(tId, "User ignored or interrupted this tool call."),
  );
  pending.length = 0;
  blocks.push(...toBedrockContentBlocks(msg.content));
  return blocks;
}

function blocksForMessage(msg: any, pending: string[]): any[] {
  if (msg.role === "user") return userBlocks(msg, pending);
  if (msg.role === "assistant") return assistantBlocks(msg, pending);
  if (msg.role === "tool") return toolBlocks(msg, pending);
  return [];
}

/** Bedrock strictly requires alternating turns. Merge adjacent identical roles. */
function pushMerged(messages: any[], role: string, blocks: any[]) {
  const last = messages[messages.length - 1];
  if (last && last.role === role) {
    last.content.push(...blocks);
  } else {
    messages.push({ role, content: blocks });
  }
}

function resolveModelId(): string | undefined {
  return TOOL_CAPABLE_MODEL && TOOL_CAPABLE_MODEL !== "auto"
    ? TOOL_CAPABLE_MODEL
    : undefined;
}

export async function callBedrockWithTools(
  client: BedrockRuntimeClient,
  finalMessages: any[],
) {
  const tools = buildToolSpecs();

  let systemPrompt = "";
  const bedrockMessages: any[] = [];
  const pendingToolUseIds: string[] = [];

  for (const msg of finalMessages) {
    if (msg.role === "system") {
      systemPrompt += `${msg.content}\n`;
      continue;
    }
    const role = msg.role === "tool" ? "user" : msg.role;
    const contentBlocks = blocksForMessage(msg, pendingToolUseIds);
    if (contentBlocks.length === 0) continue;
    pushMerged(bedrockMessages, role, contentBlocks);
  }

  // Close pending tool calls before asking Bedrock to generate a new assistant response.
  if (pendingToolUseIds.length > 0) {
    pushMerged(
      bedrockMessages,
      "user",
      pendingToolUseIds.map((tId) =>
        syntheticToolError(tId, "User ignored this tool call. Please proceed."),
      ),
    );
  }

  const system = systemPrompt ? [{ text: systemPrompt }] : undefined;

  const command = new ConverseCommand({
    modelId: resolveModelId(),
    messages: bedrockMessages,
    system,
    toolConfig: {
      tools,
      toolChoice: { auto: {} },
    },
  });

  return client.send(command);
}
