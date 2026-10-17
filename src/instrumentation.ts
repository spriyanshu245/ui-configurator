export async function register() {
  // The Langfuse/OpenTelemetry Node SDK cannot load in the Edge runtime.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation.node");
  }
}
