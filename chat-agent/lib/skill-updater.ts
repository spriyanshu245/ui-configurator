import type { Operation } from "fast-json-patch";
import { ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { freeLLMClient, TOOL_CAPABLE_MODEL } from "./freellm-client";
import { skillEntries } from "../db/queries/skill-entries";
import { compileAgentSkill } from "./skill-compiler";
import { logger } from "./logger";
import {
  mineSessionBindingCandidates,
  candidateToSkillEntry,
  type SessionBindingCandidate,
  type SkillEntryDraft,
} from "./skill-extractor";

export interface SkillReflectionOperation {
  userRequest?: string;
  patchApplied: Operation[];
  patchedDsl: any;
  sourcePatchId: string;
}

/**
 * DESIGN CHOICE — LLM summarization is OPTIONAL, deterministic extraction is
 * the source of truth:
 *
 * `mineSessionBindingCandidates` already produces structured, correct facts
 * (which primitive, on which component, at which path) with zero risk of
 * hallucination. The LLM step below only tries to turn those facts into a
 * nicer/terser title+content. Because:
 *   - the active client (`freeLLMClient`, see freellm-client.ts) is an AWS
 *     Bedrock `BedrockRuntimeClient`, NOT an OpenAI-compatible client — it has
 *     no `.chat.completions.create` — the previously-commented-out code would
 *     have thrown immediately on every call, and
 *   - reflection runs fire-and-forget after patch approval, so it must never
 *     block or fail that response,
 * the summarization call is wrapped in try/catch and ANY failure (network,
 * missing credentials, malformed JSON response, wrong client shape, etc.)
 * falls back to `candidates.map(candidateToSkillEntry)`, which requires no
 * network access at all. This keeps skill learning fully functional even
 * with no live model configured.
 */
async function summarizeCandidatesWithLLM(
  candidates: SessionBindingCandidate[],
  userRequest?: string,
): Promise<SkillEntryDraft[] | null> {
  const prompt = `You just observed a confirmed DSL modification. Below are deterministically-mined
session-data-binding facts about what changed. Turn them into 0-3 reusable knowledge entries.
${userRequest ? `USER REQUEST: "${userRequest}"` : ""}
CANDIDATES: ${JSON.stringify(candidates, null, 2)}

Respond ONLY with a JSON array, no prose, no markdown fences:
[
  {
    "category": "component_pattern|user_preference|dsl_rule|common_operation|error_fix|routing_pattern",
    "title": "short title",
    "content": "markdown formatted knowledge, 2-5 sentences, must mention the exact property/key names involved",
    "confidence": 0.9
  }
]`;

  const command = new ConverseCommand({
    modelId: TOOL_CAPABLE_MODEL && TOOL_CAPABLE_MODEL !== "auto"
      ? TOOL_CAPABLE_MODEL
      : "anthropic.claude-3-5-sonnet-20240620-v1:0",
    messages: [{ role: "user", content: [{ text: prompt }] }],
    inferenceConfig: { maxTokens: 500, temperature: 0.2 },
  });

  const response = await (freeLLMClient as any).send(command);
  const textBlock = response?.output?.message?.content?.find((c: any) => typeof c?.text === "string");
  const raw = textBlock?.text;
  if (!raw || typeof raw !== "string") return null;

  // Model may wrap the JSON in a code fence despite instructions — strip it defensively.
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) return null;

  return parsed
    .filter((e) => e && typeof e.title === "string" && typeof e.content === "string")
    .slice(0, 3)
    .map((e) => ({
      category: e.category,
      title: e.title,
      content: e.content,
      confidence: typeof e.confidence === "number" ? e.confidence : 0.7,
    }));
}

/**
 * Fire-and-forget skill reflection, triggered after a patch is approved.
 * Never throws — all failures are caught and logged, since callers must not
 * have their response blocked or failed by this.
 */
export async function runSkillReflection(operation: SkillReflectionOperation): Promise<void> {
  try {
    const candidates = mineSessionBindingCandidates(operation.patchApplied, operation.patchedDsl);
    if (candidates.length === 0) {
      return; // Nothing novel to learn from this patch.
    }

    let drafts: SkillEntryDraft[] | null = null;
    try {
      drafts = await summarizeCandidatesWithLLM(candidates, operation.userRequest);
    } catch (e) {
      logger.warn("Skill reflection LLM summarization failed, falling back to deterministic template", {
        error: (e as Error).message,
      });
      drafts = null;
    }

    const entries: SkillEntryDraft[] =
      drafts && drafts.length > 0 ? drafts : candidates.map(candidateToSkillEntry);

    for (const entry of entries) {
      await skillEntries.upsert({
        ...entry,
        source: "agent_reflection",
        sourcePatchId: operation.sourcePatchId,
      });
    }

    await compileAgentSkill();
    await skillEntries.enforceBounds();
  } catch (e) {
    logger.error("Skill reflection failed", { error: (e as Error).message });
  }
}
