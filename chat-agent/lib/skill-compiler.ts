import { skillEntries } from "../db/queries/skill-entries";
import * as fs from "fs";
import * as path from "path";

export async function compileAgentSkill() {
  const entries = await skillEntries.findAll({
    orderBy: { category: "asc", usageCount: "desc" },
  });

  let md = "# Agent DSL Knowledge Basenn";
  md += `_Compiled on ${new Date().toISOString()} from ${entries.length} entries_nn---nn`;

  const categories = [...new Set(entries.map((e) => e.category))];

  categories.forEach((cat) => {
    md += `## ${cat.toUpperCase()}nn`;
    const catEntries = entries.filter((e) => e.category === cat);
    catEntries.forEach((entry) => {
      md += `### ${entry.title} (Confidence: ${entry.confidence})nn${entry.content}nn`;
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
  console.log(
    `Agent skill compiled with ${entries.length} entries into ${destPath}`,
  );
}
