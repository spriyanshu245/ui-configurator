import {
  DSL_TOOLS,
  READ_ONLY_TOOLS,
} from "../../../../chat-agent/lib/tool-definitions";
import {
  TOOL_CAPABLE_MODEL,
  freeLLMClient,
} from "../../../../chat-agent/lib/freellm-client";
import {
  buildSystemPromptParts,
  type SystemPromptParts,
} from "../../../../chat-agent/lib/prompt-builder";
import { executeTool } from "../../../../chat-agent/lib/tool-executor";
import { pendingPatchesDB } from "../../../../chat-agent/db/queries/pending-patches";
import { pendingBatchesDB } from "../../../../chat-agent/db/queries/pending-batches";
import { queuePatch, queueBatch } from "../../../../chat-agent/lib/dsl-patcher";
import { db } from "../../../../chat-agent/db/client";
import { logger } from "../../../../chat-agent/lib/logger";
import { getUserId } from "../../../../chat-agent/lib/getUserId";
import { sessionsOps } from "../../../../chat-agent/db/queries/sessions";
import { sessionOps } from "../../../../chat-agent/db/queries/dsl-history";
import { chatAttachmentsOps } from "../../../../chat-agent/db/queries/chat-attachments";
import { streamBedrockTurn } from "../../../../chat-agent/lib/aws-bedrock-helper";
import { processAttachments } from "../../../../chat-agent/lib/attachment-store";
import {
  toModelHistory,
  type AttachmentRef,
} from "../../../../chat-agent/lib/history";
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
  _attachments?: AttachmentRef[];
};

type ModelTurn = {
  content: string;
  toolCalls: any[];
  bedrockContent?: unknown[];
  usage?: Record<string, number>;
  stopReason?: string;
  metadata?: Record<string, unknown>;
};

type ModelTurnIo = {
  send: (event: object) => void;
  isAborted: () => boolean;
  abortSignal: AbortSignal;
};

async function runBedrockTurn(
  system: SystemPromptParts,
  history: any[],
  current: any[],
  io: ModelTurnIo,
): Promise<ModelTurn> {
  logger.debug("Calling Bedrock ConverseStream");
  const result = await streamBedrockTurn(freeLLMClient as any, {
    system,
    messages: [...history, ...current],
    historyLength: history.length,
    abortSignal: io.abortSignal,
    onText: (text) => {
      if (!io.isAborted()) io.send({ type: "text_chunk", content: text });
    },
  });
  const usage: any = result.usage;
  return {
    content: result.content,
    toolCalls: result.toolCalls,
    bedrockContent: result.bedrockContent,
    usage: bedrockUsageDetails(usage),
    stopReason: result.stopReason,
    metadata: {
      ...(usage?.cacheDetails ? { cacheDetails: usage.cacheDetails } : {}),
      ...(result.metrics?.latencyMs
        ? { latencyMs: result.metrics.latencyMs }
        : {}),
    },
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
      io.send({ type: "text_chunk", content: delta.content });
    }
    if (delta?.tool_calls) {
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
    _bedrockContent?: unknown[];
  } = { role: "assistant", content: content || null };
  if (toolCalls.length > 0) message.tool_calls = toolCalls;
  return message;
}

/**
 * What the browser (and Mongo) get: text content only — never attachment
 * bytes, never the model-internal reasoning blocks. Attachments travel as
 * `_attachments` handles.
 */
function forClient(message: any) {
  const { _bedrockContent, ...rest } = message;
  if (Array.isArray(rest.content)) {
    // Model-only notes (attachment handles) are not part of what the user typed.
    rest.content = rest.content
      .filter(
        (p: any) =>
          p?.type === "text" && typeof p.text === "string" && !p._note,
      )
      .map((p: any) => p.text)
      .join("\n");
  }
  return rest;
}

const MAX_STORED_TOOL_CHARS = 4000;

/** Stored tool results only feed the one-line history notes — keep them small. */
function clipStored(content: string): string {
  if (typeof content !== "string" || content.length <= MAX_STORED_TOOL_CHARS)
    return content;
  return `${content.slice(0, MAX_STORED_TOOL_CHARS)}… [truncated, ${content.length} chars]`;
}

/** Summary recorded in Langfuse for a queued proposal (the full DSLs live in pending_*). */
function slimProposal(pending: any) {
  if (!pending || pending.error) return pending;
  const ops = Array.isArray(pending.operations)
    ? pending.operations.map((o: any) => ({
        page: o.pagePath,
        ops: o.patch?.length ?? 0,
      }))
    : undefined;
  return {
    id: pending.id,
    page: pending.pagePath,
    opCount: Array.isArray(pending.patch) ? pending.patch.length : undefined,
    operations: ops,
    affected: pending.affectedComponents,
    description:
      typeof pending.description === "string"
        ? pending.description.slice(0, 1500)
        : undefined,
  };
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
  if (!micrositeId)
    return { taskContext: fallbackTaskContext, pageOps: fallbackPageOps };
  try {
    const [conversation, opsDocs] = await Promise.all([
      db
        .collection("conversations")
        .findOne({ userId, micrositeId }, { projection: { taskContext: 1 } }),
      db.collection("page_ops").find({ userId, micrositeId }).toArray(),
    ]);
    const pageOps: Record<string, any[]> = {};
    for (const doc of opsDocs) pageOps[doc.pagePath] = doc.ops || [];
    return {
      taskContext: conversation?.taskContext ?? fallbackTaskContext,
      pageOps,
    };
  } catch (e) {
    logger.warn("Failed to load recap; using client copy", {
      error: (e as Error).message,
    });
    return { taskContext: fallbackTaskContext, pageOps: fallbackPageOps };
  }
}

async function listSessionAttachments(sessionId: string | undefined) {
  if (!sessionId) return [];
  try {
    return await chatAttachmentsOps.listForSession(sessionId);
  } catch (e) {
    logger.warn("Failed to list session attachments", {
      error: (e as Error).message,
    });
    return [];
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

const ROUTE_MESSAGE_KEYS = [
  "role",
  "content",
  "name",
  "tool_call_id",
  "tool_calls",
  "_attachments",
];

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
    const formatted: Record<string, unknown> = {};
    for (const key of ROUTE_MESSAGE_KEYS) {
      const value = message[key as keyof ChatRouteMessage];
      if (value !== undefined) formatted[key] = value;
    }
    return formatted;
  });

  const userId = getUserId(req);
  const effectiveSessionId = clientSessionId ?? sessionId;

  // File input: every file is stored under a handle (att-…) so later turns can
  // still read it. A page-DSL JSON is NOT inlined — the model reads it through
  // the DSL tools; images and other documents ride along with this message.
  // Legacy `images` payloads are still honored.
  const rawAttachments: any[] = Array.isArray(attachments)
    ? attachments
    : Array.isArray(images)
      ? images.map((img: any) => ({ ...img, kind: "image" }))
      : [];
  const safeAttachments = rawAttachments.filter(
    (a: any) => a && typeof a.dataBase64 === "string",
  );
  const lastUserIndex = formattedMessages
    .map((m) => m.role)
    .lastIndexOf("user");
  if (safeAttachments.length > 0 && lastUserIndex >= 0) {
    const target = formattedMessages[lastUserIndex];
    const textPart =
      typeof target.content === "string" && target.content
        ? target.content
        : "Use the attached file(s) as input for configuring this page.";
    const processed = await processAttachments(safeAttachments, {
      userId,
      micrositeId,
      sessionId: effectiveSessionId,
    });
    target.content = [{ type: "text", text: textPart }, ...processed.parts];
    if (processed.refs.length) target._attachments = processed.refs;
    logger.info("Attached files to user message", {
      attachmentCount: safeAttachments.length,
      stored: processed.refs.length,
    });
  }

  // Fire-and-forget bump of the canonical (userId, micrositeId) session — do not
  // block the response on this.
  if (micrositeId) {
    sessionsOps
      .resolve(userId, micrositeId, clientSessionId)
      .catch((e: Error) =>
        logger.error("Failed to bump session", { error: e.message }),
      );
  }

  // Save the latest user message (text + attachment handles, never file bytes).
  const lastUserMsg =
    lastUserIndex >= 0 ? formattedMessages[lastUserIndex] : undefined;
  let lastUserText = "";
  if (lastUserMsg) {
    try {
      const clientCopy = forClient(lastUserMsg);
      lastUserText =
        typeof clientCopy.content === "string" ? clientCopy.content : "";
      await sessionOps.saveMessage(userId, micrositeId, clientCopy);
    } catch (e) {
      logger.warn("Failed to save user message", {
        error: (e as Error).message,
      });
    }
  }

  const runChatTurn = async (
    controller: ReadableStreamDefaultController,
    turn: ChatTurnHandle,
  ) => {
    let isAborted = false;
    const abort = new AbortController();
    req.signal.addEventListener("abort", () => {
      logger.warn("Client aborted connection");
      isAborted = true;
      abort.abort();
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
    const modelIo: ModelTurnIo = {
      send,
      isAborted: () => isAborted || req.signal.aborted,
      abortSignal: abort.signal,
    };

    // Earlier turns reach the model as text: every user/assistant message,
    // with tool calls collapsed to one-line notes (DSL is re-read on demand).
    // That keeps the whole conversation — and its attachment handles — in
    // context while the prefix stays prompt-cacheable turn after turn.
    const priorMessages =
      lastUserIndex > 0 ? formattedMessages.slice(0, lastUserIndex) : [];
    let currentMessages: any[] =
      lastUserIndex > 0
        ? formattedMessages.slice(lastUserIndex)
        : formattedMessages;
    const history = toModelHistory(priorMessages);
    const clientMessages = (extra: any[] = []) =>
      [...priorMessages, ...currentMessages, ...extra].map(forClient);

    const persistStep = async (assistantMsg: any, toolResults: any[]) => {
      try {
        await sessionOps.saveMessage(
          userId,
          micrositeId,
          forClient(assistantMsg),
        );
        for (const r of toolResults) {
          await sessionOps.saveMessage(userId, micrositeId, {
            role: "tool",
            ...r,
            content: clipStored(r.content),
          });
        }
      } catch (e) {
        logger.warn("Failed to save assistant messages", {
          error: (e as Error).message,
        });
      }
    };

    const [recap, sessionAttachments] = await Promise.all([
      loadRecap(userId, micrositeId, taskContext, pageOps),
      listSessionAttachments(effectiveSessionId),
    ]);
    // Built once per turn: identical across agent steps, so every step after
    // the first reads it from the prompt cache.
    const systemParts = await buildSystemPromptParts({
      micrositeId,
      pageCode,
      id,
      referenceDsls,
      sessionContext,
      taskContext: recap.taskContext,
      pageOps: recap.pageOps,
      attachments: sessionAttachments,
      userId,
    });
    const systemText = `${systemParts.staticText}${systemParts.dynamicText}`;

    let loopCount = 0;
    const MAX_LOOPS = 10;

    while (loopCount < MAX_LOOPS) {
      if (isAborted || req.signal.aborted) break;
      loopCount++;

      try {
        const finalMessages = [
          { role: "system", content: systemText },
          ...history,
          ...currentMessages,
        ];

        logger.debug("Chat completions initiated", {
          model: TOOL_CAPABLE_MODEL,
          systemPromptLength: systemText.length,
          historyMessages: history.length,
          messagesCount: finalMessages.length,
          toolsCount: DSL_TOOLS?.length,
        });

        const isBedrock =
          freeLLMClient.constructor.name === "BedrockRuntimeClient";
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
              ? await runBedrockTurn(
                  systemParts,
                  history,
                  currentMessages,
                  modelIo,
                )
              : await runOpenAiTurn(
                  finalMessages.map(
                    ({ _bedrockContent, _attachments, ...m }: any) => m,
                  ),
                  modelIo,
                );
            generation.update({
              output: buildAssistantMessage(
                result.content,
                result.toolCalls.filter(Boolean),
              ),
              usageDetails: result.usage,
              metadata: {
                stopReason: result.stopReason,
                ...(result.metadata ?? {}),
              },
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
        // Model-internal: replayed (reasoning included) on the next step only.
        if (modelTurn.bedrockContent?.length)
          assistantMsg._bedrockContent = modelTurn.bedrockContent;

        if (!validToolCalls.length) {
          send({
            type: "sync_messages",
            messages: clientMessages([assistantMsg]),
          });
          send({ type: "done" });
          await persistStep(assistantMsg, []);
          turn.setOutput(assistantMsg.content);
          break;
        }

        const toolResults: Array<{ tool_call_id: string; content: string }> =
          [];

        // Queue a single-page patch (propose_dsl_patch)
        // and end the turn awaiting approval. Returns false when validation failed
        // (the error goes back to the model as the tool result).
        const queuePatchAndWait = async (
          toolCall: any,
          proposal: string,
          build: () => Promise<any>,
        ): Promise<boolean> => {
          const pending = await traceTool(
            toolCall.function.name,
            JSON.parse(toolCall.function.arguments),
            build,
            slimProposal,
          );
          if (pending.error) {
            toolResults.push({
              tool_call_id: toolCall.id,
              content: `Patch validation failed: ${pending.error}`,
            });
            return false;
          }
          await pendingPatchesDB.save(pending);
          try {
            await sessionOps.saveTask(userId, micrositeId, {
              intent: "DSL modification proposed",
              pendingPatch: true,
            });
          } catch (e) {
            logger.warn("Failed to save task context", {
              error: (e as Error).message,
            });
          }
          toolResults.push({
            tool_call_id: toolCall.id,
            content: `Patch queued for user approval. Patch ID: ${pending.id}. ${String(
              pending.description ?? "",
            )
              .split("\n")[0]
              .slice(
                0,
                200,
              )} Do NOT proceed until you receive the approval confirmation.`,
          });
          await persistStep(assistantMsg, toolResults);
          send({
            type: "sync_messages",
            messages: clientMessages([
              assistantMsg,
              ...toolResults.map((r) => ({ role: "tool", ...r })),
            ]),
          });
          send({
            type: "patch_proposed",
            patch: pending,
            tool_call_id: toolCall.id,
          });
          send({ type: "awaiting_approval" });
          turn.setOutput({
            status: "awaiting_approval",
            proposal,
            patchId: pending.id,
          });
          controller.close();
          return true;
        };

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
            if (
              await queuePatchAndWait(toolCall, "dsl_patch", () =>
                queuePatch(args, effectiveSessionId),
              )
            )
              return;
          } else if (toolCall.function.name === "propose_dsl_batch") {
            const pending = await traceTool(
              "propose_dsl_batch",
              args,
              () => queueBatch(args, effectiveSessionId),
              slimProposal,
            );
            if ("error" in pending) {
              toolResults.push({
                tool_call_id: toolCall.id,
                content: `Batch validation failed: ${pending.error}`,
              });
            } else {
              await pendingBatchesDB.save(pending);

              try {
                await sessionOps.saveTask(userId, micrositeId, {
                  intent: "DSL batch modification proposed",
                  pendingPatch: true,
                });
              } catch (e) {
                logger.warn("Failed to save task context", {
                  error: (e as Error).message,
                });
              }

              toolResults.push({
                tool_call_id: toolCall.id,
                content: `Batch queued for user approval. Batch ID: ${pending.id}. Do NOT proceed until you receive the approval confirmation.`,
              });
              await persistStep(assistantMsg, toolResults);
              send({
                type: "sync_messages",
                messages: clientMessages([
                  assistantMsg,
                  ...toolResults.map((r) => ({ role: "tool", ...r })),
                ]),
              });

              send({
                type: "batch_proposed",
                batch: pending,
                tool_call_id: toolCall.id,
              });
              send({ type: "awaiting_approval" });
              turn.setOutput({
                status: "awaiting_approval",
                proposal: "dsl_batch",
                batchId: pending.id,
              });
              controller.close();
              return;
            }
          } else if (toolCall.function.name === "propose_create_page") {
            await traceTool("propose_create_page", args, async () => ({
              status: "card_shown",
              micrositeId: args.microsite_id ?? micrositeId,
              suggestedName: args.suggested_name ?? null,
            }));
            const cardResult = {
              tool_call_id: toolCall.id,
              content:
                "Page creation card shown to the user. Wait for confirmation before continuing.",
            };
            await persistStep(assistantMsg, [...toolResults, cardResult]);
            // Open the Create-Page input card (name + "Open as popup" checkbox)
            // on the client; the client submits to /api/page/create.
            send({
              type: "sync_messages",
              messages: clientMessages([
                assistantMsg,
                ...[...toolResults, cardResult].map((r) => ({
                  role: "tool",
                  ...r,
                })),
              ]),
            });
            send({
              type: "page_creation_proposed",
              micrositeId: args.microsite_id ?? micrositeId,
              suggestedName: args.suggested_name ?? "",
              purpose: args.purpose ?? null,
              tool_call_id: toolCall.id,
            });
            send({ type: "awaiting_approval" });
            turn.setOutput({
              status: "awaiting_approval",
              proposal: "create_page",
              suggestedName: args.suggested_name ?? null,
            });
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

            if (toolCall.function.name === "show_page_map" && result?.pageMap) {
              send({
                type: "page_map",
                pageMap: result.pageMap,
                tool_call_id: toolCall.id,
              });
            }
          }
        }

        currentMessages = [
          ...currentMessages,
          assistantMsg,
          ...toolResults.map((r) => ({ role: "tool", ...r })),
        ];
        await persistStep(assistantMsg, toolResults);
      } catch (error: any) {
        logger.error("Error in agent route", {
          message: error.message,
          stack: error.stack,
        });

        let errorMessage = error.message;
        if (
          error.status === 429 ||
          errorMessage.includes("429") ||
          error.name === "ThrottlingException"
        ) {
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
