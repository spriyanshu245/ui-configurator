import { DSL_TOOLS } from "../../../../chat-agent/lib/tool-definitions";
import {
  TOOL_CAPABLE_MODEL,
  freeLLMClient,
} from "../../../../chat-agent/lib/freellm-client";
import { buildSystemPrompt } from "../../../../chat-agent/lib/prompt-builder";
import { executeTool } from "../../../../chat-agent/lib/tool-executor";
import { toolCallLog } from "../../../../chat-agent/db/queries/tool-call-log";
import { pendingPatchesDB } from "../../../../chat-agent/db/queries/pending-patches";
import { queuePatch } from "../../../../chat-agent/lib/dsl-patcher";
import { db } from "../../../../chat-agent/db/client";
import * as fs from "fs";
import * as path from "path";

function logToFile(msg: string) {
  try {
    const logPath = path.join(process.cwd(), "chat-agent.log");
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
  } catch (e) {}
}

type ChatRouteMessage = {
  role?: string;
  content?: string | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: unknown[];
};

export async function GET() {
  console.log("=== API CHAT GET INITIATED ===");
  console.log("process.env.MONGODB_URI:", process.env.MONGODB_URI);
  console.log(
    "process.env.NEXT_PUBLIC_BASE_URL:",
    process.env.NEXT_PUBLIC_BASE_URL,
  );
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
  const { messages, micrositeId, sessionId, pageCode, id } = await req.json();

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

  const authHeader = req.headers.get("authorization");
  let userId = req.headers.get("x-user-id") || "anonymous";
  if (!userId || userId === "anonymous") {
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const tokenPart = authHeader.split(" ")[1];
        const payloadBase64 = tokenPart.split(".")[1];
        const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
        const payloadJson = atob(base64);
        const payload = JSON.parse(payloadJson);
        if (payload.preferred_username) {
          userId = payload.preferred_username.replace(/\D/g, "");
        }
      } catch (e) {
      }
    }
  }

  // Save the latest user message
  const lastUserMsg = formattedMessages.slice().reverse().find(m => m.role === "user");
  if (lastUserMsg) {
     try {
        const { sessionOps } = require("../../../../chat-agent/db/queries/dsl-history");
        await sessionOps.saveMessage(userId, micrositeId, lastUserMsg);
     } catch (e) {
        logToFile(`Failed to save user message: ${e}`);
     }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: object) => {
        controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
      };

      let currentMessages = formattedMessages;
      let loopCount = 0;
      const MAX_LOOPS = 10;

      while (loopCount < MAX_LOOPS) {
        loopCount++;

        const systemPrompt = await buildSystemPrompt({
          micrositeId,
          pageCode,
          id,
        });

        try {
          const finalMessages = [
            { role: "system", content: systemPrompt },
            ...(currentMessages as any[]),
          ];
          logToFile("=== CHAT completions.create INITIATED ===");
          logToFile(`Model: ${TOOL_CAPABLE_MODEL}`);
          logToFile(`System Prompt Length: ${systemPrompt.length}`);
          logToFile(`Messages Count: ${finalMessages.length}`);
          logToFile(`Messages: ${JSON.stringify(finalMessages)}`);
          logToFile(`Tools Count: ${DSL_TOOLS?.length}`);

          const response = await freeLLMClient.chat.completions.create({
            model: TOOL_CAPABLE_MODEL,
            messages: finalMessages,
            tools: DSL_TOOLS as any,
            tool_choice: "auto",
            stream: true,
          });

          let content = "";
          const toolCalls: any[] = [];

          logToFile("Stream opened, reading chunks...");
          for await (const chunk of response) {
            if (chunk.choices[0]?.delta?.content) {
              const chunkContent = chunk.choices[0].delta.content;
              content += chunkContent;
              logToFile(`Chunk content: ${chunkContent}`);
              send({ type: "text_chunk", content: chunkContent });
            }
            if (chunk.choices[0]?.delta?.tool_calls) {
              const calls = chunk.choices[0].delta.tool_calls;
              logToFile(`Chunk tool_calls: ${JSON.stringify(calls)}`);
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

          const validToolCalls = toolCalls.filter(Boolean);
          logToFile(`Stream finished. Content: "${content}". Tool calls count: ${validToolCalls.length}`);

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
              const pending = await queuePatch(args, sessionId);
              if (pending.error) {
                toolResults.push({
                  tool_call_id: toolCall.id,
                  content: `Patch validation failed: ${pending.error}`,
                });
              } else {
                await pendingPatchesDB.save(pending);

                // Update task context for pending patch
                try {
                  const { sessionOps } = require("../../../../chat-agent/db/queries/dsl-history");
                  await sessionOps.saveTask(userId, micrositeId, { intent: "DSL modification proposed", pendingPatch: true });
                } catch (e) {
                  logToFile(`Failed to save task context: ${e}`);
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
            } else {
              logToFile(`Executing tool: ${toolCall.function.name} with args: ${toolCall.function.arguments}`);
              const result = await executeTool(toolCall.function.name, args);
              logToFile(`Tool execution result: ${JSON.stringify(result)}`);
              await toolCallLog.log(
                sessionId,
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
             const { sessionOps } = require("../../../../chat-agent/db/queries/dsl-history");
             await sessionOps.saveMessage(userId, micrositeId, assistantMsg);
             for (const r of toolResults) {
                await sessionOps.saveMessage(userId, micrositeId, { role: "tool", ...r });
             }
          } catch(e) {
             logToFile(`Failed to save assistant messages: ${e}`);
          }
          
        } catch (error: any) {
          logToFile(`Error in agent route: ${error.message}\nStack: ${error.stack}`);
          console.error("Error in agent route:", error);
          
          let errorMessage = error.message;
          if (error.status === 429 || errorMessage.includes("429")) {
            errorMessage = "I am currently experiencing high traffic and hit a rate limit. Please wait a moment and try again.";
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
