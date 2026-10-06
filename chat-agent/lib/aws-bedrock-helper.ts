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
    if (!part) return;
    if (typeof part === "string") {
      if (part) blocks.push({ text: part });
      return;
    }
    if (part.type === "text" && typeof part.text === "string") {
      if (part.text) blocks.push({ text: part.text });
    } else if (part.type === "image" && typeof part.dataBase64 === "string") {
      const format = String(part.format || "png").toLowerCase();
      if (!SUPPORTED_IMAGE_FORMATS.has(format)) {
        logger.warn("Skipping image with unsupported format", { format });
        return;
      }
      blocks.push({
        image: {
          format,
          source: { bytes: Buffer.from(part.dataBase64, "base64") },
        },
      });
    } else if (
      part.type === "document" &&
      typeof part.dataBase64 === "string"
    ) {
      const format = String(part.format || "").toLowerCase();
      if (!SUPPORTED_DOC_FORMATS.has(format)) {
        logger.warn("Skipping document with unsupported format", { format });
        return;
      }
      let name = sanitizeDocName(part.name, index);
      let n = 2;
      while (usedDocNames.has(name)) {
        name = sanitizeDocName(`${part.name} ${n}`, index);
        n++;
      }
      usedDocNames.add(name);
      blocks.push({
        document: {
          format,
          name,
          source: { bytes: Buffer.from(part.dataBase64, "base64") },
        },
      });
    }
  });
  return blocks;
}

export async function callBedrockWithTools(
  client: BedrockRuntimeClient,
  finalMessages: any[],
) {
  const tools = DSL_TOOLS.map((t: any) => ({
    toolSpec: {
      name: t.function.name,
      description: t.function.description,
      inputSchema: {
        json: t.function.parameters,
      },
    },
  }));

  let systemPrompt = "";
  const bedrockMessages: any[] = [];
  let pendingToolUseIds: string[] = [];

  for (const msg of finalMessages) {
    if (msg.role === "system") {
      systemPrompt += msg.content + "\n";
      continue;
    }

    let role = msg.role === "tool" ? "user" : msg.role;
    let contentBlocks: any[] = [];

    if (msg.role === "user") {
      // If there are pending tool uses that were ignored by the user's text message,
      // we MUST append synthetic toolResults for them to satisfy Bedrock validation.
      for (const tId of pendingToolUseIds) {
        contentBlocks.push({
          toolResult: {
            toolUseId: tId,
            content: [
              {
                text: JSON.stringify({
                  error: "User ignored or interrupted this tool call.",
                }),
              },
            ],
            status: "error",
          },
        });
      }
      pendingToolUseIds = [];
      contentBlocks.push(...toBedrockContentBlocks(msg.content));
    } else if (msg.role === "assistant") {
      if (msg.content) {
        contentBlocks.push({ text: msg.content });
      }
      if (msg.tool_calls) {
        for (const tc of msg.tool_calls) {
          contentBlocks.push({
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
      }
    } else if (msg.role === "tool") {
      // Provide stringified content to the text field to entirely bypass Bedrock JSON validation
      let textContent =
        typeof msg.content === "string"
          ? msg.content
          : JSON.stringify(msg.content);

      if (!pendingToolUseIds.includes(msg.tool_call_id)) {
        // Bedrock strictly forbids duplicate toolUseIds. If the system injected a preliminary tool result
        // (like "Patch queued for approval") and then later injected the final result ("Patch approved"),
        // the second one is a duplicate and will crash Bedrock. We convert duplicates to normal text.
        contentBlocks.push({
          text: `[Update for tool ${msg.tool_call_id}]: ${textContent}`,
        });
      } else {
        contentBlocks.push({
          toolResult: {
            toolUseId: msg.tool_call_id,
            content: [{ text: textContent }],
          },
        });
        // Remove from pending
        pendingToolUseIds = pendingToolUseIds.filter(
          (id) => id !== msg.tool_call_id,
        );
      }
    }

    if (contentBlocks.length === 0) continue;

    // Bedrock strictly requires alternating turns. Merge adjacent identical roles.
    const lastMsg = bedrockMessages[bedrockMessages.length - 1];
    if (lastMsg && lastMsg.role === role) {
      lastMsg.content.push(...contentBlocks);
    } else {
      bedrockMessages.push({ role, content: contentBlocks });
    }
  }

  // Close pending tool calls before asking Bedrock to generate a new assistant response.
  if (pendingToolUseIds.length > 0) {
    const forcedBlocks = pendingToolUseIds.map((tId) => ({
      toolResult: {
        toolUseId: tId,
        content: [
          {
            text: JSON.stringify({
              error: "User ignored this tool call. Please proceed.",
            }),
          },
        ],
        status: "error",
      },
    }));

    const lastMsg = bedrockMessages[bedrockMessages.length - 1];
    if (lastMsg && lastMsg.role === "user") {
      lastMsg.content.push(...forcedBlocks);
    } else {
      bedrockMessages.push({ role: "user", content: forcedBlocks });
    }
  }

  const system = systemPrompt ? [{ text: systemPrompt }] : undefined;

  let modelId;
  if (TOOL_CAPABLE_MODEL && TOOL_CAPABLE_MODEL !== "auto") {
    modelId = TOOL_CAPABLE_MODEL;
  }

  const command = new ConverseCommand({
    modelId,
    messages: bedrockMessages,
    system,
    toolConfig: {
      tools,
      toolChoice: { auto: {} },
    },
  });

  const response = await client.send(command);
  return response;
}
