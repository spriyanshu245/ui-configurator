import { DSL_TOOLS, READ_ONLY_TOOLS } from "../../../../chat-agent/lib/tool-definitions";
import {
  TOOL_CAPABLE_MODEL,
  freeLLMClient,
} from "../../../../chat-agent/lib/freellm-client";
import { buildSystemPrompt } from "../../../../chat-agent/lib/prompt-builder";
import { executeTool } from "../../../../chat-agent/lib/tool-executor";
import { pendingPatchesDB } from "../../../../chat-agent/db/queries/pending-patches";
import { pendingBatchesDB } from "../../../../chat-agent/db/queries/pending-batches";
import { queuePatch, queueBatch } from "../../../../chat-agent/lib/dsl-patcher";
import { db } from "../../../../chat-agent/db/client";
import { logger } from "../../../../chat-agent/lib/logger";
import { getUserId } from "../../../../chat-agent/lib/getUserId";
import { sessionsOps } from "../../../../chat-agent/db/queries/sessions";
import { sessionOps } from "../../../../chat-agent/db/queries/dsl-history";
import { callBedrockWithTools } from "../../../../chat-agent/lib/aws-bedrock-helper";
import {
  TRACE_NAMES,
  bedrockUsageDetails,
  traceChatTurn,
  traceGeneration,
  traceTool,
  type ChatTurnHandle,
} from "../../../../chat-agent/lib/tracing";

type ChatRouteMessage = {
  role?: string;
  content?: string | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: unknown[];
};

type ModelTurn = {
  content: string;
  toolCalls: any[];
  usage?: Record<string, number>;
  stopReason?: string;
};

type ModelTurnIo = {
  send: (event: object) => void;
  isAborted: () => boolean;
};

async function runBedrockTurn(
  finalMessages: any[],
  io: ModelTurnIo,
): Promise<ModelTurn> {
  logger.debug("Calling Bedrock Native API");
  const bedrockResponse = await callBedrockWithTools(freeLLMClient, finalMessages);
  let content = "";
  const toolCalls: any[] = [];
  for (const block of bedrockResponse.output?.message?.content ?? []) {
    if (io.isAborted()) {
      logger.warn("Bedrock generation aborted mid-stream");
      break;
    }
    if (block.text) {
      content += block.text;
      logger.debug("Bedrock text chunk received", { length: block.text.length });
      io.send({ type: "text_chunk", content: block.text });
    }
    if (block.toolUse) {
      const call = block.toolUse;
      logger.debug("Bedrock tool use", { toolName: call.name });
      toolCalls.push({
        id: call.toolUseId,
        type: "function",
        function: { name: call.name, arguments: JSON.stringify(call.input) },
      });
    }
  }
  return {
    content,
    toolCalls,
    usage: bedrockUsageDetails(bedrockResponse.usage),
    stopReason: bedrockResponse.stopReason,
  };
}

function mergeToolCallDeltas(toolCalls: any[], calls: any[]) {
  for (let i = 0; i < calls.length; i++) {
    const call = calls[i];
    const idx = typeof call.index === "number" ? call.index : i;
    if (!toolCalls[idx]) {
      toolCalls[idx] = {
        id: call.id,
        type: call.type,
        function: { name: call.function?.name || "", arguments: "" },
      };
    }
    if (call.function?.arguments) {
      toolCalls[idx].function.arguments += call.function.arguments;
    }
  }
}

async function runOpenAiTurn(
  finalMessages: any[],
  io: ModelTurnIo,
): Promise<ModelTurn> {
  const response = await (freeLLMClient as any).chat.completions.create({
    model: TOOL_CAPABLE_MODEL,
    messages: finalMessages,
    tools: DSL_TOOLS as any,
    tool_choice: "auto",
    stream: true,
  });

  logger.debug("Stream opened, reading chunks");
  let content = "";
  const toolCalls: any[] = [];
  for await (const chunk of response) {
    if (io.isAborted()) {
      logger.warn("OpenAI generation aborted mid-stream");
      break;
    }
    const delta = chunk.choices[0]?.delta;
    if (delta?.content) {
      content += delta.content;
      logger.debug("Content chunk received", { length: delta.content.length });
      io.send({ type: "text_chunk", content: delta.content });
    }
    if (delta?.tool_calls) {
      logger.debug("Tool calls in chunk", { count: delta.tool_calls.length });
      mergeToolCallDeltas(toolCalls, delta.tool_calls);
    }
  }
  return { content, toolCalls };
}

function buildAssistantMessage(content: string, toolCalls: any[]) {
  const message: {
    role: string;
    content: string | null;
    tool_calls?: unknown[];
  } = { role: "assistant", content: content || null };
  if (toolCalls.length > 0) message.tool_calls = toolCalls;
  return message;
}

/**
 * Fresh recap of earlier turns for the system prompt: the saved task context
 * and per-page history (approve/reject/create record real change descriptions).
 * The client's copy is only captured when the chat panel opens, so it goes
 * stale within a session; fall back to it only if Mongo is unavailable.
 */
async function loadRecap(
  userId: string,
  micrositeId: string | undefined,
  fallbackTaskContext: any,
  fallbackPageOps: any,
) {
  if (!micrositeId) return { taskContext: fallbackTaskContext, pageOps: fallbackPageOps };
  try {
    const [conversation, opsDocs] = await Promise.all([
      db.collection("conversations").findOne(
        { userId, micrositeId },
        { projection: { taskContext: 1 } },
      ),
      db.collection("page_ops").find({ userId, micrositeId }).toArray(),
    ]);
    const pageOps: Record<string, any[]> = {};
    for (const doc of opsDocs) pageOps[doc.pagePath] = doc.ops || [];
    return {
      taskContext: conversation?.taskContext ?? fallbackTaskContext,
      pageOps,
    };
  } catch (e) {
    logger.warn("Failed to load recap; using client copy", { error: (e as Error).message });
    return { taskContext: fallbackTaskContext, pageOps: fallbackPageOps };
  }
}

export async function GET() {
  logger.info("API CHAT GET INITIATED");
  logger.debug("Environment check", {
    mongodbUri: process.env.MONGODB_URI ? "set" : "not set",
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
  });
  try {
    await db.command({ ping: 1 });
    return new Response(JSON.stringify({ status: "connected" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ status: "error", error: (error as Error).message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

export async function POST(req: Request) {
  const {
    messages,
    micrositeId,
    sessionId,
    clientSessionId,
    pageCode,
    id,
    referenceDsls,
    sessionContext,
    taskContext,
    pageOps,
    images,
    attachments,
  } = await req.json();

  const safeMessages = Array.isArray(messages) ? messages : [];

  const formattedMessages = safeMessages.map((message: ChatRouteMessage) => {
    const validKeys = ["role", "content", "name", "tool_call_id", "tool_calls"];
    const formatted: Record<string, unknown> = {};

    for (const key of validKeys) {
      const value = message[key as keyof ChatRouteMessage];
      if (value !== undefined) {
        formatted[key] = value;
      }
    }

    return formatted;
  });

  // File input: attach any uploaded files (wireframe/design images AND documents
  // such as PDFs, spreadsheets, or text/code) to the most recent user message as
  // multimodal content so the model can examine them and propose matching DSL.
  // Attachments are for this turn only — they are NOT persisted to session
  // history (which stays text-only). Legacy `images` payloads are still honored.
  const rawAttachments: any[] = Array.isArray(attachments)
    ? attachments
    : Array.isArray(images)
      ? images.map((img: any) => ({ ...img, kind: "image" }))
      : [];
  const safeAttachments = rawAttachments.filter(
    (a: any) => a && typeof a.dataBase64 === "string",
  );
  if (safeAttachments.length > 0) {
    for (let i = formattedMessages.length - 1; i >= 0; i--) {
      if (formattedMessages[i].role === "user") {
        const existing = formattedMessages[i].content;
        const textPart =
          typeof existing === "string"
            ? existing
            : "Use the attached file(s) as input for configuring this page.";
        formattedMessages[i].content = [
          { type: "text", text: textPart },
          ...safeAttachments.map((a: any) =>
            a.kind === "document"
              ? {
                  type: "document",
                  format: a.format,
                  name: a.name,
                  dataBase64: a.dataBase64,
                }
              : {
                  type: "image",
                  format: a.format || "png",
                  dataBase64: a.dataBase64,
                },
          ),
        ];
        break;
      }
    }
    logger.info("Attached files to user message", {
      attachmentCount: safeAttachments.length,
    });
  }

  const userId = getUserId(req);

  const effectiveSessionId = clientSessionId ?? sessionId;

  // Fire-and-forget bump of the canonical (userId, micrositeId) session — do not
  // block the response on this.
  if (micrositeId) {
    sessionsOps
      .resolve(userId, micrositeId, clientSessionId)
      .catch((e: Error) => logger.error("Failed to bump session", { error: e.message }));
  }

  // Save the latest user message (text-only — never persist image bytes to
  // session history; extract the text part if content was made multimodal).
  const lastUserMsg = formattedMessages
    .slice()
    .reverse()
    .find((m) => m.role === "user");
  let lastUserText = "";
  if (lastUserMsg) {
    try {
      const textContent = Array.isArray(lastUserMsg.content)
        ? (lastUserMsg.content as any[])
            .filter((p) => p?.type === "text")
            .map((p) => p.text)
            .join("\n")
        : lastUserMsg.content;
      lastUserText = typeof textContent === "string" ? textContent : "";
      await sessionOps.saveMessage(userId, micrositeId, {
        ...lastUserMsg,
        content: textContent,
      });
    } catch (e) {
      logger.warn("Failed to save user message", { error: (e as Error).message });
    }
  }

  const runChatTurn = async (
    controller: ReadableStreamDefaultController,
    turn: ChatTurnHandle,
  ) => {
      let isAborted = false;
      req.signal.addEventListener("abort", () => {
        logger.warn("Client aborted connection");
        isAborted = true;
      });

      const send = (event: object) => {
        if (isAborted || req.signal.aborted) return;
        try {
          controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
        } catch (e) {
          logger.error("Failed to enqueue data", { error: (e as Error).message });
        }
      };
      const runTool = (name: string, toolArgs: unknown) =>
        traceTool(name, toolArgs, () =>
          executeTool(name, toolArgs as any, { userId, micrositeId }),
        );
      const modelIo = {
        send,
        isAborted: () => isAborted || req.signal.aborted,
      };

      // Earlier turns are NOT sent to the model: only the current prompt and
      // its own tool steps. (They used to be resent in full on every prompt and
      // every agent step — tool results included — until the 200k window
      // overflowed.) The client still receives the full history back through
      // sync_messages (priorMessages + currentMessages), so the chat display is
      // unchanged. What happened earlier reaches the model as a recap: the fresh
      // task context + page history loaded from Mongo below.
      const lastUserIndex = formattedMessages.map((m) => m.role).lastIndexOf("user");
      const priorMessages = lastUserIndex > 0 ? formattedMessages.slice(0, lastUserIndex) : [];
      let currentMessages = lastUserIndex > 0 ? formattedMessages.slice(lastUserIndex) : formattedMessages;
      let loopCount = 0;
      const MAX_LOOPS = 10;

      const recap = await loadRecap(userId, micrositeId, taskContext, pageOps);

      while (loopCount < MAX_LOOPS) {
        if (isAborted || req.signal.aborted) break;
        loopCount++;

        const systemPrompt = await buildSystemPrompt({
          micrositeId,
          pageCode,
          id,
          referenceDsls,
          sessionContext,
          taskContext: recap.taskContext,
          pageOps: recap.pageOps,
          userId,
        });

        try {
          const finalMessages = [
            { role: "system", content: systemPrompt },
            ...(currentMessages as any[]),
          ];

          logger.debug("Chat completions initiated", {
            model: TOOL_CAPABLE_MODEL,
            systemPromptLength: systemPrompt.length,
            messagesCount: finalMessages.length,
            toolsCount: DSL_TOOLS?.length,
          });

          const isBedrock = freeLLMClient.constructor.name === "BedrockRuntimeClient";
          const modelTurn = await traceGeneration(
            TRACE_NAMES.generateResponse,
            {
              model: TOOL_CAPABLE_MODEL,
              input: finalMessages,
              metadata: {
                provider: isBedrock ? "bedrock" : "openai-compatible",
                agentLoopIteration: loopCount,
              },
            },
            async (generation) => {
              const result = isBedrock
                ? await runBedrockTurn(finalMessages, modelIo)
                : await runOpenAiTurn(finalMessages, modelIo);
              generation.update({
                output: buildAssistantMessage(
                  result.content,
                  result.toolCalls.filter(Boolean),
                ),
                usageDetails: result.usage,
                metadata: { stopReason: result.stopReason },
              });
              return result;
            },
          );
          const { content, toolCalls } = modelTurn;

          const validToolCalls = toolCalls.filter(Boolean);
          logger.debug("Stream finished", {
            contentLength: content.length,
            toolCallsCount: validToolCalls.length,
          });

          const assistantMsg = buildAssistantMessage(content, validToolCalls);

          if (!validToolCalls.length) {
            send({
              type: "sync_messages",
              messages: [...priorMessages, ...currentMessages, assistantMsg],
            });
            send({ type: "done" });
            turn.setOutput(assistantMsg.content);
            break;
          }

          const toolResults = [];

          // Start every read-only tool call at once (e.g. several get_page_dsl /
          // query_dsl_path calls in one step); the loop below still handles the
          // results — and every side-effect/gating tool — in the original order.
          const prefetched = new Map<
            string,
            Promise<{ ok: true; result: any } | { ok: false; error: unknown }>
          >();
          for (const toolCall of validToolCalls) {
            if (!READ_ONLY_TOOLS.has(toolCall.function.name)) continue;
            let parsedArgs: any;
            try {
              parsedArgs = JSON.parse(toolCall.function.arguments);
            } catch {
              continue; // reported by the loop below
            }
            prefetched.set(
              toolCall.id,
              runTool(toolCall.function.name, parsedArgs).then(
                (result) => ({ ok: true as const, result }),
                (error) => ({ ok: false as const, error }),
              ),
            );
          }

          for (const toolCall of validToolCalls) {
            let args;
            try {
              args = JSON.parse(toolCall.function.arguments);
            } catch (e) {
              toolResults.push({
                tool_call_id: toolCall.id,
                content: "Error parsing arguments.",
              });
              continue;
            }

            if (toolCall.function.name === "propose_dsl_patch") {
              const pending = await traceTool("propose_dsl_patch", args, () =>
                queuePatch(args, effectiveSessionId),
              );
              if (pending.error) {
                toolResults.push({
                  tool_call_id: toolCall.id,
                  content: `Patch validation failed: ${pending.error}`,
                });
              } else {
                await pendingPatchesDB.save(pending);

                // Update task context for pending patch
                try {
                  await sessionOps.saveTask(userId, micrositeId, {
                    intent: "DSL modification proposed",
                    pendingPatch: true,
                  });
                } catch (e) {
                  logger.warn("Failed to save task context", { error: (e as Error).message });
                }

                toolResults.push({
                  tool_call_id: toolCall.id,
                  content: `Patch queued for user approval. Patch ID: ${pending.id}. Do NOT proceed until you receive the approval confirmation.`,
                });

                send({
                  type: "sync_messages",
                  messages: [
                    ...priorMessages,
                    ...currentMessages,
                    assistantMsg,
                    ...toolResults.map((r) => ({ role: "tool", ...r })),
                  ],
                });

                send({
                  type: "patch_proposed",
                  patch: pending,
                  tool_call_id: toolCall.id,
                });
                send({ type: "awaiting_approval" });
                turn.setOutput({ status: "awaiting_approval", proposal: "dsl_patch", patchId: pending.id });
                controller.close();
                return;
              }
            } else if (toolCall.function.name === "propose_dsl_batch") {
              const pending = await traceTool("propose_dsl_batch", args, () =>
                queueBatch(args, effectiveSessionId),
              );
              if ("error" in pending) {
                toolResults.push({
                  tool_call_id: toolCall.id,
                  content: `Batch validation failed: ${pending.error}`,
                });
              } else {
                await pendingBatchesDB.save(pending);

                // Update task context for pending batch
                try {
                  await sessionOps.saveTask(userId, micrositeId, {
                    intent: "DSL batch modification proposed",
                    pendingPatch: true,
                  });
                } catch (e) {
                  logger.warn("Failed to save task context", { error: (e as Error).message });
                }

                toolResults.push({
                  tool_call_id: toolCall.id,
                  content: `Batch queued for user approval. Batch ID: ${pending.id}. Do NOT proceed until you receive the approval confirmation.`,
                });

                send({
                  type: "sync_messages",
                  messages: [
                    ...priorMessages,
                    ...currentMessages,
                    assistantMsg,
                    ...toolResults.map((r) => ({ role: "tool", ...r })),
                  ],
                });

                send({
                  type: "batch_proposed",
                  batch: pending,
                  tool_call_id: toolCall.id,
                });
                send({ type: "awaiting_approval" });
                turn.setOutput({ status: "awaiting_approval", proposal: "dsl_batch", batchId: pending.id });
                controller.close();
                return;
              }
            } else if (toolCall.function.name === "propose_create_page") {
              await traceTool("propose_create_page", args, async () => ({
                status: "card_shown",
                micrositeId: args.microsite_id ?? micrositeId,
                suggestedName: args.suggested_name ?? null,
              }));
              // Open the Create-Page input card (name + "Open as popup" checkbox)
              // on the client; the client submits to /api/page/create.
              send({
                type: "sync_messages",
                messages: [
                  ...priorMessages,
                  ...currentMessages,
                  assistantMsg,
                  {
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content:
                      "Page creation card shown to the user. Wait for confirmation before continuing.",
                  },
                ],
              });
              send({
                type: "page_creation_proposed",
                micrositeId: args.microsite_id ?? micrositeId,
                suggestedName: args.suggested_name ?? "",
                purpose: args.purpose ?? null,
                tool_call_id: toolCall.id,
              });
              send({ type: "awaiting_approval" });
              turn.setOutput({ status: "awaiting_approval", proposal: "create_page", suggestedName: args.suggested_name ?? null });
              controller.close();
              return;
            } else {
              logger.debug("Executing tool", {
                toolName: toolCall.function.name,
                argsLength: toolCall.function.arguments.length,
              });
              const started = prefetched.get(toolCall.id);
              let result: any;
              if (started) {
                const outcome = await started;
                if (!outcome.ok) throw outcome.error;
                result = outcome.result;
              } else {
                result = await runTool(toolCall.function.name, args);
              }
              logger.debug("Tool execution completed", {
                toolName: toolCall.function.name,
                resultLength: JSON.stringify(result).length,
              });
              toolResults.push({
                tool_call_id: toolCall.id,
                content: JSON.stringify(result),
              });

              if (
                toolCall.function.name === "propose_rollback" &&
                result?.queued &&
                result?.rollback
              ) {
                send({
                  type: "rollback_proposed",
                  rollback: result.rollback,
                  tool_call_id: toolCall.id,
                });
              }

              // Non-destructive UI navigation: tell the client to switch the
              // active page. The agent loop continues (no approval gate).
              if (
                toolCall.function.name === "navigate_to_page" &&
                result?.navigate &&
                result?.pageCode
              ) {
                send({
                  type: "navigate",
                  pageCode: result.pageCode,
                  reason: result.reason ?? null,
                });
              }

              if (
                toolCall.function.name === "suggest_next_actions" &&
                Array.isArray(result?.suggestions) &&
                result.suggestions.length > 0
              ) {
                send({ type: "suggestions", suggestions: result.suggestions });
              }

              if (
                toolCall.function.name === "show_page_map" &&
                result?.pageMap
              ) {
                send({
                  type: "page_map",
                  pageMap: result.pageMap,
                  tool_call_id: toolCall.id,
                });
              }
            }
          }

          const newMessages = [
            ...currentMessages,
            assistantMsg,
            ...toolResults.map((r) => ({ role: "tool", ...r })),
          ];
          currentMessages = newMessages;

          // Save assistant message to session history
          try {
            await sessionOps.saveMessage(userId, micrositeId, assistantMsg);
            for (const r of toolResults) {
              await sessionOps.saveMessage(userId, micrositeId, {
                role: "tool",
                ...r,
              });
            }
          } catch (e) {
            logger.warn("Failed to save assistant messages", { error: (e as Error).message });
          }
        } catch (error: any) {
          logger.error("Error in agent route", {
            message: error.message,
            stack: error.stack,
          });

          let errorMessage = error.message;
          if (error.status === 429 || errorMessage.includes("429")) {
            errorMessage =
              "I am currently experiencing high traffic and hit a rate limit. Please wait a moment and try again.";
          }

          send({ type: "error", message: errorMessage });
          turn.setError(errorMessage);
          turn.setOutput({ status: "error", message: errorMessage });
          break;
        }
      }
      controller.close();
  };

  const stream = new ReadableStream({
    start: (controller) =>
      traceChatTurn(
        {
          userId,
          sessionId: effectiveSessionId,
          input: lastUserText,
          metadata: {
            micrositeId,
            pageCode,
            attachmentCount: String(safeAttachments.length),
          },
        },
        (turn) => runChatTurn(controller, turn),
      ),
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
