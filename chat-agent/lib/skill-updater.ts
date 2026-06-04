import { freeLLMClient, TOOL_CAPABLE_MODEL } from "./freellm-client";
import { skillEntries } from "../db/queries/skill-entries";
import { compileAgentSkill } from "./skill-compiler";

export async function runSkillReflection(operation: any) {
  const reflectionPrompt = `You just completed a DSL modification operation. Analyze it and extract reusable knowledge. USER REQUEST: "${operation.userRequest}"
PATCH APPLIED: ${JSON.stringify(operation.patchApplied, null, 2)}
${operation.userEdits ? `USER CORRECTIONS: ${operation.userEdits}` : ""}
${operation.wasRejected ? `REJECTION REASON: ${operation.rejectionReason}` : ""}

Extract 0-3 reusable knowledge entries. Respond ONLY with a JSON array:
[
  {
    "category": "component_pattern|user_preference|dsl_rule|common_operation|error_fix|routing_pattern",
    "title": "short title",
    "content": "markdown formatted knowledge, 2-5 sentences",
    "confidence": 0.9
  }
]
`;

  try {
    const response = await freeLLMClient.chat.completions.create({
      model: TOOL_CAPABLE_MODEL,
      messages: [{ role: "user", content: reflectionPrompt }],
      max_tokens: 500,
      temperature: 0.2,
    });

    const entries = JSON.parse(response.choices[0].message.content ?? "[]");

    for (const entry of entries) {
      entry.source = "agent_reflection";
      skillEntries.upsert(entry);
    }

    // Optionally trigger recompile
    compileAgentSkill();
  } catch (e) {
    console.error("Reflection failed", e);
  }
}
