import { skillEntries } from "../db/queries/skill-entries";
import * as fs from "fs";
import * as path from "path";
import { logger } from "./logger";

export async function compileAgentSkill() {
  const entries = await skillEntries.findAll({
    orderBy: { category: "asc", usageCount: "desc" },
  });

  let md = "# Agent DSL Knowledge Base";
  md += `_Compiled on ${new Date().toISOString()} from ${entries.length} entries_---`;

  const categories = [...new Set(entries.map((e) => e.category))];

  categories.forEach((cat) => {
    md += `## ${cat.toUpperCase()}`;
    const catEntries = entries.filter((e) => e.category === cat);
    catEntries.forEach((entry) => {
      md += `### ${entry.title} (Confidence: ${entry.confidence})${entry.content}`;
    });
  });

  const destPath = path.join(
    process.cwd(),
    "chat-agent/knowledge/agentSkill.md",
  );
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(destPath, md);
  logger.info(
    `Agent skill compiled with ${entries.length} entries into ${destPath}`,
  );
}
