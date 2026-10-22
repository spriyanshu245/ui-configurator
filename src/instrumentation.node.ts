import { NodeSDK } from "@opentelemetry/sdk-node";
import { LangfuseSpanProcessor } from "@langfuse/otel";
import { maskTraceData } from "../chat-agent/lib/tracing";
import { logger } from "../chat-agent/lib/logger";

/**
 * Langfuse tracing bootstrap (loaded once by `register()` in instrumentation.ts).
 *
 * Reads LANGFUSE_PUBLIC_KEY / LANGFUSE_SECRET_KEY / LANGFUSE_BASE_URL (and the
 * optional LANGFUSE_TRACING_ENVIRONMENT / LANGFUSE_RELEASE) from the environment.
 * Without credentials — or with LANGFUSE_TRACING_ENABLED=false — nothing is
 * registered and every tracing call in chat-agent is a no-op.
 *
 * No OpenTelemetry auto-instrumentations are installed, so HTTP/DB/framework
 * spans never pollute the trace tree; the processor additionally only exports
 * Langfuse and GenAI spans by default.
 */
function tracingEnabled(): boolean {
  if (process.env.LANGFUSE_TRACING_ENABLED === "false") return false;
  return Boolean(
    process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY,
  );
}

if (tracingEnabled()) {
  const sdk = new NodeSDK({
    spanProcessors: [new LangfuseSpanProcessor({ mask: maskTraceData })],
  });
  sdk.start();
  logger.info("Langfuse tracing enabled", {
    baseUrl: process.env.LANGFUSE_BASE_URL ?? "https://cloud.langfuse.com",
    environment: process.env.LANGFUSE_TRACING_ENVIRONMENT ?? "default",
  });
} else {
  logger.info("Langfuse tracing disabled (no credentials or explicitly off)");
}
