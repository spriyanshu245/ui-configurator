import {
  BedrockRuntimeClient,
  ConverseStreamCommand,
  type ConverseStreamCommandInput,
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
 * Bedrock ConverseStream client for the chat agent.
 *
 * - Streams text deltas to the caller as they arrive.
 * - Prompt caching: up to 4 cache points — tools (1h), the static system
 *   prompt (1h), the end of the prior conversation history (5m) and a rolling
 *   point on the newest message (5m), so each agent step re-reads the previous
 *   step's prefix from cache instead of paying for it again.
 * - Reasoning (adaptive thinking) blocks are returned verbatim in
 *   `bedrockContent` so they can be sent back on the tool-use continuation.
 */

export type ReasoningBlock = { text: string; signature?: string } | { redacted: string };

/** Serializable copy of an assistant message's Bedrock content blocks, in order. */
export type StoredBlock =
  | { text: string }
  | { reasoning: ReasoningBlock }
  | { toolUse: { toolUseId: string; name: string; input: unknown } };

export interface SystemPromptParts {
  staticText: string;
  dynamicText?: string;
}

export interface BedrockTurnRequest {
  system: SystemPromptParts | string;
  /** Chat messages in the route's internal (OpenAI-like) format, without the system message. */
  messages: any[];
  /** How many leading `messages` are earlier turns; a cache point goes after them. */
  historyLength?: number;
  onText?: (delta: string) => void;
  abortSignal?: AbortSignal;
}

export interface BedrockTurnResult {
  content: string;
  toolCalls: any[];
  bedrockContent: StoredBlock[];
  usage?: Record<string, any>;
  stopReason?: string;
  metrics?: Record<string, any>;
}

const DEFAULT_MAX_OUTPUT_TOKENS = 64000;
const MAX_CACHE_POINTS = 4;
const RETRYABLE_ERRORS = new Set([
  "ThrottlingException",
  "ServiceUnavailableException",
  "ModelStreamErrorException",
  "InternalServerException",
  "ModelNotReadyException",
]);

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

function cachingEnabled(): boolean {
  return (process.env.LLM_PROMPT_CACHE ?? "on").toLowerCase() !== "off";
}

function cachePoint(ttl?: "1h" | "5m"): any {
  return { cachePoint: ttl ? { type: "default", ttl } : { type: "default" } };
}

function staticCacheTtl(): "1h" | "5m" {
  return process.env.LLM_STATIC_CACHE_TTL === "5m" ? "5m" : "1h";
}

function buildToolSpecs(): any[] {
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

function parseArgs(args: unknown): unknown {
  if (typeof args !== "string") return args ?? {};
  try {
    return JSON.parse(args || "{}");
  } catch {
    return {};
  }
}

function storedToBedrock(block: StoredBlock): any | null {
  if ("text" in block) return block.text ? { text: block.text } : null;
  if ("toolUse" in block) return { toolUse: block.toolUse };
  const r = block.reasoning;
  if ("redacted" in r) {
    return { reasoningContent: { redactedContent: Buffer.from(r.redacted, "base64") } };
  }
  return {
    reasoningContent: {
      reasoningText: r.signature ? { text: r.text, signature: r.signature } : { text: r.text },
    },
  };
}

function assistantBlocks(msg: any, pendingToolUseIds: string[]): any[] {
  // Within the current turn the exact streamed blocks (reasoning included) are
  // replayed — required for thinking + tool use continuations.
  if (Array.isArray(msg._bedrockContent) && msg._bedrockContent.length > 0) {
    const blocks = (msg._bedrockContent as StoredBlock[])
      .map(storedToBedrock)
      .filter(Boolean);
    for (const b of blocks) if (b.toolUse) pendingToolUseIds.push(b.toolUse.toolUseId);
    return blocks;
  }
  const blocks: any[] = [];
  if (typeof msg.content === "string" && msg.content) blocks.push({ text: msg.content });
  for (const tc of msg.tool_calls ?? []) {
    blocks.push({
      toolUse: {
        toolUseId: tc.id,
        name: tc.function.name,
        input: parseArgs(tc.function.arguments),
      },
    });
    pendingToolUseIds.push(tc.id);
  }
  return blocks;
}

/** Returns blocks for a tool message and removes its id from `pending` when matched. */
function toolBlocks(msg: any, pending: string[]): any[] {
  const textContent =
    typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content);

  const idx = pending.indexOf(msg.tool_call_id);
  if (idx === -1) {
    // Bedrock forbids duplicate/unknown toolUseIds — keep the information as text.
    return [{ text: `[Update for tool ${msg.tool_call_id}]: ${textContent}` }];
  }
  pending.splice(idx, 1);
  return [
    {
      toolResult: {
        toolUseId: msg.tool_call_id,
        content: [{ text: textContent || "(empty)" }],
      },
    },
  ];
}

function userBlocks(msg: any, pending: string[]): any[] {
  // Pending tool uses the user's text interrupted must still get a result.
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

function hasContent(content: unknown): boolean {
  if (typeof content === "string") return content.trim().length > 0;
  return Array.isArray(content) && content.length > 0;
}

/** Bedrock requires alternating turns. Merge adjacent identical roles. */
function pushMerged(messages: any[], role: string, blocks: any[]) {
  const last = messages[messages.length - 1];
  if (last && last.role === role) {
    last.content.push(...blocks);
  } else {
    messages.push({ role, content: blocks });
  }
}

/**
 * Convert internal messages to Bedrock messages. Returns the Bedrock position
 * right after the last block of the prior history (for the history cache point).
 */
export function toBedrockMessages(
  messages: any[],
  historyLength = 0,
): { messages: any[]; historyEnd: { msg: number; block: number } | null } {
  const bedrockMessages: any[] = [];
  const pending: string[] = [];
  let historyEnd: { msg: number; block: number } | null = null;
  // A conversation must start with a user message: skip anything before it.
  const firstUser = messages.findIndex(
    (m) => m?.role === "user" && hasContent(m.content),
  );

  messages.forEach((msg, i) => {
    if (msg.role === "system" || firstUser === -1 || i < firstUser) return;
    const role = msg.role === "tool" ? "user" : msg.role;
    const blocks = blocksForMessage(msg, pending);
    if (blocks.length > 0) pushMerged(bedrockMessages, role, blocks);
    if (i === historyLength - 1 && bedrockMessages.length > 0) {
      const last = bedrockMessages.length - 1;
      historyEnd = { msg: last, block: bedrockMessages[last].content.length };
    }
  });

  // Close pending tool calls before asking for a new assistant response.
  if (pending.length > 0) {
    pushMerged(
      bedrockMessages,
      "user",
      pending.map((tId) => syntheticToolError(tId, "User ignored this tool call. Please proceed.")),
    );
  }
  return { messages: bedrockMessages, historyEnd };
}

function systemBlocks(system: SystemPromptParts | string, cache: boolean): any[] | undefined {
  const parts: SystemPromptParts =
    typeof system === "string" ? { staticText: system } : system;
  const blocks: any[] = [];
  if (parts.staticText?.trim()) {
    blocks.push({ text: parts.staticText });
    if (cache) blocks.push(cachePoint(staticCacheTtl()));
  }
  if (parts.dynamicText?.trim()) blocks.push({ text: parts.dynamicText });
  return blocks.length ? blocks : undefined;
}

function insertMessageCachePoints(
  messages: any[],
  historyEnd: { msg: number; block: number } | null,
  budget: number,
) {
  if (budget <= 0 || messages.length === 0) return;
  const lastIdx = messages.length - 1;
  const lastLen = messages[lastIdx].content.length;
  const rolling = { msg: lastIdx, block: lastLen };
  const points: { msg: number; block: number }[] = [];
  if (historyEnd && !(historyEnd.msg === rolling.msg && historyEnd.block === rolling.block)) {
    points.push(historyEnd);
  }
  points.push(rolling);
  // Keep the newest points when the budget is short; insert back-to-front so
  // earlier indices stay valid.
  points
    .slice(-budget)
    .sort((a, b) => b.msg - a.msg || b.block - a.block)
    .forEach((p) => messages[p.msg].content.splice(p.block, 0, cachePoint()));
}

function effortFields(): Record<string, any> | undefined {
  const effort = process.env.LLM_EFFORT?.trim();
  if (!effort || effortRejected) return undefined;
  return { output_config: { effort } };
}

let effortRejected = false;

function resolveModelId(): string | undefined {
  return TOOL_CAPABLE_MODEL && TOOL_CAPABLE_MODEL !== "auto" ? TOOL_CAPABLE_MODEL : undefined;
}

/** Build the ConverseStream request (pure; exported for tests). */
export function buildConverseInput(req: BedrockTurnRequest): ConverseStreamCommandInput {
  const cache = cachingEnabled();
  const tools = buildToolSpecs();
  if (cache && tools.length) tools.push(cachePoint(staticCacheTtl()));

  const system = systemBlocks(req.system, cache);
  const { messages, historyEnd } = toBedrockMessages(req.messages, req.historyLength ?? 0);

  if (cache) {
    const used =
      (tools.length ? 1 : 0) + (system?.some((b) => b.cachePoint) ? 1 : 0);
    insertMessageCachePoints(messages, historyEnd, MAX_CACHE_POINTS - used);
  }

  const maxTokens = Number(process.env.LLM_MAX_OUTPUT_TOKENS) || DEFAULT_MAX_OUTPUT_TOKENS;
  const input: ConverseStreamCommandInput = {
    modelId: resolveModelId(),
    messages,
    system,
    toolConfig: { tools, toolChoice: { auto: {} } },
    inferenceConfig: { maxTokens },
  };
  const extra = effortFields();
  if (extra) input.additionalModelRequestFields = extra as any;
  return input;
}

type BlockState =
  | { kind: "text"; text: string }
  | { kind: "reasoning"; text: string; signature?: string; redacted?: Uint8Array[] }
  | { kind: "toolUse"; toolUseId: string; name: string; input: string };

function finalizeBlocks(states: Map<number, BlockState>): StoredBlock[] {
  const out: StoredBlock[] = [];
  for (const idx of [...states.keys()].sort((a, b) => a - b)) {
    const s = states.get(idx)!;
    if (s.kind === "text") {
      if (s.text) out.push({ text: s.text });
    } else if (s.kind === "reasoning") {
      if (s.redacted?.length) {
        out.push({ reasoning: { redacted: Buffer.concat(s.redacted.map((b) => Buffer.from(b))).toString("base64") } });
      } else {
        out.push({ reasoning: s.signature ? { text: s.text, signature: s.signature } : { text: s.text } });
      }
    } else {
      out.push({ toolUse: { toolUseId: s.toolUseId, name: s.name, input: parseArgs(s.input) } });
    }
  }
  return out;
}

function applyDelta(states: Map<number, BlockState>, idx: number, delta: any, onText?: (t: string) => void) {
  if (typeof delta?.text === "string") {
    const s = states.get(idx);
    if (s && s.kind === "text") s.text += delta.text;
    else states.set(idx, { kind: "text", text: delta.text });
    if (delta.text) onText?.(delta.text);
    return;
  }
  if (delta?.toolUse) {
    const s = states.get(idx);
    if (s && s.kind === "toolUse") s.input += delta.toolUse.input ?? "";
    return;
  }
  if (delta?.reasoningContent) {
    let s = states.get(idx);
    if (!s || s.kind !== "reasoning") {
      s = { kind: "reasoning", text: "" };
      states.set(idx, s);
    }
    const rc = delta.reasoningContent;
    if (typeof rc.text === "string") s.text += rc.text;
    if (typeof rc.signature === "string") s.signature = (s.signature ?? "") + rc.signature;
    if (rc.redactedContent) (s.redacted ??= []).push(rc.redactedContent);
  }
}

async function readStream(
  stream: AsyncIterable<any>,
  req: BedrockTurnRequest,
  progress: { emitted: boolean },
): Promise<BedrockTurnResult> {
  const states = new Map<number, BlockState>();
  let stopReason: string | undefined;
  let usage: Record<string, any> | undefined;
  let metrics: Record<string, any> | undefined;
  const onText = (t: string) => {
    progress.emitted = true;
    req.onText?.(t);
  };

  for await (const event of stream) {
    if (req.abortSignal?.aborted) break;
    if (event.contentBlockStart) {
      const idx = event.contentBlockStart.contentBlockIndex ?? 0;
      const tu = event.contentBlockStart.start?.toolUse;
      if (tu) {
        progress.emitted = true;
        states.set(idx, { kind: "toolUse", toolUseId: tu.toolUseId, name: tu.name, input: "" });
      }
    } else if (event.contentBlockDelta) {
      applyDelta(states, event.contentBlockDelta.contentBlockIndex ?? 0, event.contentBlockDelta.delta, onText);
    } else if (event.messageStop) {
      stopReason = event.messageStop.stopReason;
    } else if (event.metadata) {
      usage = event.metadata.usage;
      metrics = event.metadata.metrics;
    } else {
      const errKey = Object.keys(event).find((k) => k.endsWith("Exception"));
      if (errKey) {
        const err: any = new Error(event[errKey]?.message || errKey);
        err.name = errKey.charAt(0).toUpperCase() + errKey.slice(1);
        throw err;
      }
    }
  }

  const bedrockContent = finalizeBlocks(states);
  const content = bedrockContent
    .filter((b): b is { text: string } => "text" in b)
    .map((b) => b.text)
    .join("");
  const toolCalls = bedrockContent
    .filter((b): b is Extract<StoredBlock, { toolUse: any }> => "toolUse" in b)
    .map((b) => ({
      id: b.toolUse.toolUseId,
      type: "function",
      function: { name: b.toolUse.name, arguments: JSON.stringify(b.toolUse.input ?? {}) },
    }));
  return { content, toolCalls, bedrockContent, usage, stopReason, metrics };
}

function isRetryable(e: any): boolean {
  return RETRYABLE_ERRORS.has(e?.name) || e?.$metadata?.httpStatusCode === 429;
}

function isEffortRejection(e: any): boolean {
  return (
    e?.name === "ValidationException" &&
    /output_config|effort|additionalModelRequestFields|extraneous key/i.test(String(e?.message))
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Run one model call over ConverseStream. Retries transient errors before any output. */
export async function streamBedrockTurn(
  client: BedrockRuntimeClient,
  req: BedrockTurnRequest,
  opts: { retries?: number; backoffMs?: number } = {},
): Promise<BedrockTurnResult> {
  const retries = opts.retries ?? 2;
  const backoffMs = opts.backoffMs ?? 1000;
  for (let attempt = 0; ; attempt++) {
    const progress = { emitted: false };
    try {
      const input = buildConverseInput(req);
      const response = await client.send(new ConverseStreamCommand(input), {
        abortSignal: req.abortSignal as any,
      });
      if (!response.stream) throw new Error("Bedrock returned no stream");
      return await readStream(response.stream, req, progress);
    } catch (e: any) {
      if (req.abortSignal?.aborted) throw e;
      if (!effortRejected && process.env.LLM_EFFORT && isEffortRejection(e)) {
        effortRejected = true;
        logger.warn("Model rejected LLM_EFFORT; continuing without it", { error: e.message });
        continue;
      }
      if (progress.emitted || attempt >= retries || !isRetryable(e)) throw e;
      logger.warn("Bedrock call failed; retrying", { error: e.message, attempt: attempt + 1 });
      await sleep(backoffMs * (attempt + 1) * (attempt + 1));
    }
  }
}

/** Test hook: forget a rejected effort setting. */
export function __resetEffortRejection() {
  effortRejected = false;
}
