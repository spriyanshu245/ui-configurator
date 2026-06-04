import { DSL_TOOLS } from '../../lib/tool-definitions';
import { freeLLMClient, TOOL_CAPABLE_MODEL } from '../../lib/freellm-client';
import { buildSystemPrompt } from '../../lib/prompt-builder';
import { executeTool } from '../../lib/tool-executor';
import { toolCallLog } from '../../db/queries/tool-call-log';
import { queuePatch } from '../../lib/dsl-patcher';
import { db } from '../../db/client';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  const { messages, micrositeId, sessionId } = await req.json();

  // Format messages to ensure only valid OpenAI properties are sent
  const formattedMessages = messages.map((m: any) => {
    const validKeys = ['role', 'content', 'name', 'tool_call_id', 'tool_calls'];
    const formatted: any = {};
    for (const key of validKeys) {
      if (m[key] !== undefined) {
        formatted[key] = m[key];
      }
    }
    return formatted;
  });

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: object) => {
        controller.enqueue(\`data: \${JSON.stringify(event)}\\n\\n\`);
      };

      let currentMessages = formattedMessages;
      let loopCount = 0;
      const MAX_LOOPS = 10;

      while (loopCount < MAX_LOOPS) {
        loopCount++;

        const systemPrompt = await buildSystemPrompt({ micrositeId });

        try {
          const response = await freeLLMClient.chat.completions.create({
            model: TOOL_CAPABLE_MODEL,
            messages: [
              { role: 'system', content: systemPrompt },
              ...currentMessages
            ],
            tools: DSL_TOOLS as any,
            tool_choice: 'auto',
            stream: true
          });

          let content = '';
          const toolCalls: any[] = [];

          for await (const chunk of response) {
            if (chunk.choices[0]?.delta?.content) {
              const chunkContent = chunk.choices[0].delta.content;
              content += chunkContent;
              send({ type: 'text_chunk', content: chunkContent });
            }
            if (chunk.choices[0]?.delta?.tool_calls) {
              const calls = chunk.choices[0].delta.tool_calls;
              for (const call of calls) {
                if (!toolCalls[call.index]) {
                  toolCalls[call.index] = { id: call.id, type: call.type, function: { name: call.function?.name || '', arguments: '' } };
                }
                if (call.function?.arguments) {
                  toolCalls[call.index].function.arguments += call.function.arguments;
                }
              }
            }
          }

          const validToolCalls = toolCalls.filter(Boolean);

          let assistantMsg: any = { role: 'assistant', content: content || null };
          if (validToolCalls.length > 0) {
            assistantMsg.tool_calls = validToolCalls;
          }

          if (!validToolCalls.length) {
            send({ type: 'sync_messages', messages: [...currentMessages, assistantMsg] });
            send({ type: 'done' });
            break;
          }

          const toolResults = [];
          for (const toolCall of validToolCalls) {
            const startTime = Date.now();
            let args;
            try {
               args = JSON.parse(toolCall.function.arguments);
            } catch (e) {
               toolResults.push({ tool_call_id: toolCall.id, content: "Error parsing arguments." });
               continue;
            }

            if (toolCall.function.name === 'propose_dsl_patch') {
              const pending = await queuePatch(args, sessionId);
              if (pending.error) {
                toolResults.push({ tool_call_id: toolCall.id, content: \`Patch validation failed: \${pending.error}\` });
              } else {
                const { pendingPatchesDB } = require('../../db/queries/pending-patches');
                pendingPatchesDB.save(pending);

                toolResults.push({
                  tool_call_id: toolCall.id,
                  content: \`Patch queued for user approval. Patch ID: \${pending.id}. Do NOT proceed until you receive the approval confirmation.\`
                });

                send({ type: 'sync_messages', messages: [
                  ...currentMessages,
                  assistantMsg,
                  ...toolResults.map(r => ({ role: 'tool', ...r }))
                ]});

                send({ type: 'patch_proposed', patch: pending, tool_call_id: toolCall.id });
                send({ type: 'awaiting_approval' });
                controller.close();
                return;
              }
            } else {
              const result = await executeTool(toolCall.function.name, args);
              toolCallLog.log(sessionId, toolCall.function.name, args, result, true, Date.now() - startTime);
              toolResults.push({ tool_call_id: toolCall.id, content: JSON.stringify(result) });
            }
          }

          currentMessages = [
            ...currentMessages,
            assistantMsg,
            ...toolResults.map(r => ({ role: 'tool', ...r }))
          ];

        } catch (error) {
          console.error("Error in agent route:", error);
          send({ type: 'error', message: (error as Error).message });
          break;
        }
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
  });
}
