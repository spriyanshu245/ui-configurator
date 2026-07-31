import { DSL_TOOLS } from "../../../../chat-agent/lib/tool-definitions";
import {
  TOOL_CAPABLE_MODEL,
  freeLLMClient,
} from "../../../../chat-agent/lib/freellm-client";
import { buildSystemPrompt } from "../../../../chat-agent/lib/prompt-builder";
import { executeTool } from "../../../../chat-agent/lib/tool-executor";
import { toolCallLog } from "../../../../chat-agent/db/queries/tool-call-log";
import { pendingPatchesDB } from "../../../../chat-agent/db/queries/pending-patches";
import { pendingBatchesDB } from "../../../../chat-agent/db/queries/pending-batches";
import { queuePatch, queueBatch } from "../../../../chat-agent/lib/dsl-patcher";
import { db } from "../../../../chat-agent/db/client";
import { logger } from "../../../../chat-agent/lib/logger";
import { getUserId } from "../../../../chat-agent/lib/getUserId";
import { sessionsOps } from "../../../../chat-agent/db/queries/sessions";
import { sessionOps } from "../../../../chat-agent/db/queries/dsl-history";
import { callBedrockWithTools } from "../../../../chat-agent/lib/aws-bedrock-helper";

type ChatRouteMessage = {
  role?: string;
  content?: string | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: unknown[];
};

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

  const userId = getUserId(req);

  // The client-supplied sessionId (canonical if session/restore ran, else the
  // per-tab id) is what we use for tool_call_log provenance. clientSessionId is
  // always the per-tab id, used to keep the canonical session's clientSessionIds
  // list in sync.
  const effectiveSessionId = clientSessionId ?? sessionId;

  // Fire-and-forget bump of the canonical (userId, micrositeId) session — do not
  // block the response on this.
  if (micrositeId) {
    sessionsOps
      .resolve(userId, micrositeId, clientSessionId)
      .catch((e: Error) => logger.error("Failed to bump session", { error: e.message }));
  }

  // Save the latest user message
  const lastUserMsg = formattedMessages
    .slice()
    .reverse()
    .find((m) => m.role === "user");
  if (lastUserMsg) {
    try {
      await sessionOps.saveMessage(userId, micrositeId, lastUserMsg);
    } catch (e) {
      logger.warn("Failed to save user message", { error: (e as Error).message });
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
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

      let currentMessages = formattedMessages;
      let loopCount = 0;
      const MAX_LOOPS = 10;

      while (loopCount < MAX_LOOPS) {
        if (isAborted || req.signal.aborted) break;
        loopCount++;

        const systemPrompt = await buildSystemPrompt({
          micrositeId,
          pageCode,
          id,
          referenceDsls,
          sessionContext,
          taskContext,
          pageOps,
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

          let content = "";
          const toolCalls: any[] = [];

          if (freeLLMClient.constructor.name === "BedrockRuntimeClient") {
            logger.debug("Calling Bedrock Native API");
            const bedrockResponse = await callBedrockWithTools(
              freeLLMClient,
              finalMessages,
            );
            const messageOutput = bedrockResponse.output?.message?.content;
            if (messageOutput) {
              for (const block of messageOutput) {
                if (isAborted || req.signal.aborted) {
                  logger.warn("Bedrock generation aborted mid-stream");
                  break;
                }
                if (block.text) {
                  content += block.text;
                  logger.debug("Bedrock text chunk received", { length: block.text.length });
                  send({ type: "text_chunk", content: block.text });
                }
                if (block.toolUse) {
                  const call = block.toolUse;
                  logger.debug("Bedrock tool use", { toolName: call.name });
                  toolCalls.push({
                    id: call.toolUseId,
                    type: "function",
                    function: {
                      name: call.name,
                      arguments: JSON.stringify(call.input),
                    },
                  });
                }
              }
            }
          } else {
            const response = await (
              freeLLMClient as any
            ).chat.completions.create({
              model: TOOL_CAPABLE_MODEL,
              messages: finalMessages,
              tools: DSL_TOOLS as any,
              tool_choice: "auto",
              stream: true,
            });

            logger.debug("Stream opened, reading chunks");
            for await (const chunk of response) {
              if (isAborted || req.signal.aborted) {
                logger.warn("OpenAI generation aborted mid-stream");
                break;
              }
              if (chunk.choices[0]?.delta?.content) {
                const chunkContent = chunk.choices[0].delta.content;
                content += chunkContent;
                logger.debug("Content chunk received", { length: chunkContent.length });
                send({ type: "text_chunk", content: chunkContent });
              }
              if (chunk.choices[0]?.delta?.tool_calls) {
                const calls = chunk.choices[0].delta.tool_calls;
                logger.debug("Tool calls in chunk", { count: calls.length });
                for (let i = 0; i < calls.length; i++) {
                  const call = calls[i];
                  const idx = typeof call.index === "number" ? call.index : i;
                  if (!toolCalls[idx]) {
                    toolCalls[idx] = {
                      id: call.id,
                      type: call.type,
                      function: {
                        name: call.function?.name || "",
                        arguments: "",
                      },
                    };
                  }
                  if (call.function?.arguments) {
                    toolCalls[idx].function.arguments +=
                      call.function.arguments;
                  }
                }
              }
            }
          }

          const validToolCalls = toolCalls.filter(Boolean);
          logger.debug("Stream finished", {
            contentLength: content.length,
            toolCallsCount: validToolCalls.length,
          });

          const assistantMsg: {
            role: string;
            content: string | null;
            tool_calls?: unknown[];
          } = {
            role: "assistant",
            content: content || null,
          };
          if (validToolCalls.length > 0) {
            assistantMsg.tool_calls = validToolCalls;
          }

          if (!validToolCalls.length) {
            send({
              type: "sync_messages",
              messages: [...currentMessages, assistantMsg],
            });
            send({ type: "done" });
            break;
          }

          const toolResults = [];
          for (const toolCall of validToolCalls) {
            const startTime = Date.now();
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
              const pending = await queuePatch(args, effectiveSessionId);
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
                controller.close();
                return;
              }
            } else if (toolCall.function.name === "propose_dsl_batch") {
              const pending = await queueBatch(args, effectiveSessionId);
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
                controller.close();
                return;
              }
            } else {
              logger.debug("Executing tool", {
                toolName: toolCall.function.name,
                argsLength: toolCall.function.arguments.length,
              });
              const result = await executeTool(toolCall.function.name, args, {
                userId,
                micrositeId,
              });
              logger.debug("Tool execution completed", {
                toolName: toolCall.function.name,
                resultLength: JSON.stringify(result).length,
              });
              await toolCallLog.log(
                effectiveSessionId,
                toolCall.function.name,
                args,
                result,
                true,
                Date.now() - startTime,
              );
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
          break;
        }
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
