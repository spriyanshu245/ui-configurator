import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { TOOL_CAPABLE_MODEL } from "./freellm-client";
import { DSL_TOOLS } from "./tool-definitions";

export async function callBedrockWithTools(client: BedrockRuntimeClient, finalMessages: any[]) {
  // Convert OpenAI tools to Bedrock tools
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
            content: [{ text: JSON.stringify({ error: "User ignored or interrupted this tool call." }) }],
            status: "error"
          }
        });
      }
      pendingToolUseIds = []; // clear them

      if (msg.content) {
        contentBlocks.push({ text: msg.content });
      }
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
              input: typeof tc.function.arguments === "string" ? JSON.parse(tc.function.arguments) : tc.function.arguments,
            },
          });
          pendingToolUseIds.push(tc.id);
        }
      }
    } else if (msg.role === "tool") {
      // Provide stringified content to the text field to entirely bypass Bedrock JSON validation
      let textContent = typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);
      
      if (!pendingToolUseIds.includes(msg.tool_call_id)) {
        // Bedrock strictly forbids duplicate toolUseIds. If the system injected a preliminary tool result
        // (like "Patch queued for approval") and then later injected the final result ("Patch approved"),
        // the second one is a duplicate and will crash Bedrock. We convert duplicates to normal text.
        contentBlocks.push({ text: `[Update for tool ${msg.tool_call_id}]: ${textContent}` });
      } else {
        contentBlocks.push({
          toolResult: {
            toolUseId: msg.tool_call_id,
            content: [{ text: textContent }],
          },
        });
        // Remove from pending
        pendingToolUseIds = pendingToolUseIds.filter(id => id !== msg.tool_call_id);
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
    const forcedBlocks = pendingToolUseIds.map(tId => ({
      toolResult: {
        toolUseId: tId,
        content: [{ text: JSON.stringify({ error: "User ignored this tool call. Please proceed." }) }],
        status: "error"
      }
    }));
    
    const lastMsg = bedrockMessages[bedrockMessages.length - 1];
    if (lastMsg && lastMsg.role === "user") {
      lastMsg.content.push(...forcedBlocks);
    } else {
      bedrockMessages.push({ role: "user", content: forcedBlocks });
    }
  }

  const system = systemPrompt ? [{ text: systemPrompt }] : undefined;

  let modelId = "anthropic.claude-3-5-sonnet-20240620-v1:0";
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
