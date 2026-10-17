import {
  propagateAttributes,
  startActiveObservation,
} from "@langfuse/tracing";

/**
 * Langfuse tracing helpers for the chat agent.
 *
 * Trace shape (one trace per chat turn, one session per conversation):
 *
 *   chat-turn (agent)
 *   ├─ generate-response (generation)   ← one per model call in the agent loop
 *   ├─ <tool name> (tool)               ← one per tool call, sibling of the generation
 *   ├─ generate-response (generation)
 *   └─ ...
 *
 * Every helper is a transparent pass-through when the Langfuse span processor
 * is not registered (no credentials): the OpenTelemetry API falls back to a
 * no-op tracer, so the app behaves identically with tracing off.
 */

const MAX_TRACED_CHARS = 200_000;

export const TRACE_NAMES = {
  chatTurn: "chat-turn",
  generateResponse: "generate-response",
  summarizeSkillCandidates: "summarize-skill-candidates",
} as const;

/** Replace attachment bytes with a short descriptor — never ship file contents to Langfuse. */
export function sanitizeForTrace<T>(value: T): T {
  return redactAttachments(value) as T;
}

function redactAttachments(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactAttachments);
  if (!value || typeof value !== "object") return value;

  const record = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(record)) {
    out[key] =
      key === "dataBase64" && typeof entry === "string"
        ? `[${record.type ?? "file"}${record.format ? `:${record.format}` : ""}, ${entry.length} base64 chars omitted]`
        : redactAttachments(entry);
  }
  return out;
}

const SECRET_PATTERNS: Array<[RegExp, string]> = [
  [/Bearer\s+[A-Za-z0-9._~+/=-]{16,}/g, "Bearer ***REDACTED***"],
  [/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g, "***REDACTED_AWS_KEY***"],
  [/\bsk-lf-[A-Za-z0-9-]{8,}\b/g, "***REDACTED_LANGFUSE_KEY***"],
];

/**
 * `mask` for LangfuseSpanProcessor. Receives the stringified input/output/metadata
 * attribute of every observation just before export.
 */
export function maskTraceData({ data }: { data: unknown }): unknown {
  if (typeof data !== "string") return data;
  let masked = data;
  for (const [pattern, replacement] of SECRET_PATTERNS) {
    masked = masked.replace(pattern, replacement);
  }
  return masked.length > MAX_TRACED_CHARS
    ? `${masked.slice(0, MAX_TRACED_CHARS)}…[truncated ${masked.length - MAX_TRACED_CHARS} chars]`
    : masked;
}

type BedrockUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cacheReadInputTokens?: number;
  cacheWriteInputTokens?: number;
};

/**
 * Bedrock Converse reports `inputTokens` exclusive of cache reads/writes, which
 * matches Langfuse's mutually-exclusive usage buckets, so no subtraction needed.
 */
export function bedrockUsageDetails(
  usage: BedrockUsage | undefined,
): Record<string, number> | undefined {
  if (!usage) return undefined;
  const details: Record<string, number> = {};
  if (usage.inputTokens != null) details.input = usage.inputTokens;
  if (usage.outputTokens != null) details.output = usage.outputTokens;
  if (usage.cacheReadInputTokens) {
    details.input_cached_tokens = usage.cacheReadInputTokens;
  }
  if (usage.cacheWriteInputTokens) {
    details.input_cache_write_tokens = usage.cacheWriteInputTokens;
  }
  if (Object.keys(details).length === 0) return undefined;
  details.total = Object.values(details).reduce((sum, n) => sum + n, 0);
  return details;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export interface GenerationHandle {
  update(attributes: {
    output?: unknown;
    usageDetails?: Record<string, number>;
    metadata?: Record<string, unknown>;
    level?: "DEBUG" | "DEFAULT" | "WARNING" | "ERROR";
    statusMessage?: string;
  }): unknown;
}

/** Run `fn` inside a `generation` observation that records errors and always ends. */
export function traceGeneration<T>(
  name: string,
  attributes: { model?: string; input: unknown; metadata?: Record<string, unknown> },
  fn: (generation: GenerationHandle) => Promise<T>,
): Promise<T> {
  return startActiveObservation(
    name,
    async (generation) => {
      generation.update({
        model: attributes.model,
        input: sanitizeForTrace(attributes.input),
        metadata: attributes.metadata,
      });
      try {
        return await fn(generation);
      } catch (error) {
        generation.update({ level: "ERROR", statusMessage: errorMessage(error) });
        throw error;
      }
    },
    { asType: "generation" },
  );
}

/** Run `fn` inside a `tool` observation (name = tool name, a stable low-cardinality value). */
export function traceTool<T>(
  name: string,
  input: unknown,
  fn: () => Promise<T>,
): Promise<T> {
  return startActiveObservation(
    name,
    async (tool) => {
      tool.update({ input: sanitizeForTrace(input) });
      try {
        const result = await fn();
        tool.update({ output: sanitizeForTrace(result) });
        return result;
      } catch (error) {
        tool.update({ level: "ERROR", statusMessage: errorMessage(error) });
        throw error;
      }
    },
    { asType: "tool" },
  );
}

export interface ChatTurnContext {
  userId?: string;
  sessionId?: string;
  input: string;
  metadata: Record<string, string | undefined>;
}

export interface ChatTurnHandle {
  /** Set the human-readable trace output (final assistant text or the pending-approval status). */
  setOutput(output: unknown): void;
  /** Mark the turn as failed; the error stays visible on the root observation. */
  setError(message: string): void;
}

/** Langfuse propagated metadata must be string values (<=200 chars each). */
function stringMetadata(
  metadata: Record<string, string | undefined>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value) out[key] = value.slice(0, 200);
  }
  return out;
}

/** Root observation for one chat turn: `chat-turn` (agent) tagged with user/session context. */
export function traceChatTurn<T>(
  context: ChatTurnContext,
  fn: (turn: ChatTurnHandle) => Promise<T>,
): Promise<T> {
  return startActiveObservation(
    TRACE_NAMES.chatTurn,
    (root) => {
      root.update({ input: context.input });
      const turn: ChatTurnHandle = {
        setOutput: (output) => void root.update({ output }),
        setError: (message) =>
          void root.update({ level: "ERROR", statusMessage: message }),
      };
      return propagateAttributes(
        {
          userId: context.userId,
          sessionId: context.sessionId,
          traceName: TRACE_NAMES.chatTurn,
          tags: ["chat-agent"],
          metadata: stringMetadata(context.metadata),
        },
        () => fn(turn),
      );
    },
    { asType: "agent" },
  );
}
