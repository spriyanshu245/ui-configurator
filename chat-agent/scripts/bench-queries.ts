import { db } from "../db/client";

interface BenchRow {
  query: string;
  totalDocsExamined: number | string;
  executionTimeMillis: number | string;
  winningPlanStage: string;
}

/**
 * Runs .explain('executionStats') against the hot queries used by chat-agent's
 * db/queries/* modules and prints a summary table.
 *
 * This does NOT seed any data — it runs against whatever DB is currently connected
 * (see chat-agent/db/client.ts). Against an empty collection the plan will typically
 * report a COLLSCAN with 0 docs examined; the point of this script is to sanity-check
 * that indexes are being picked up (IXSCAN) once real data / indexes exist.
 */
export async function runBench(): Promise<BenchRow[]> {
  const rows: BenchRow[] = [];

  const record = (query: string, explainResult: any) => {
    const stats = explainResult?.executionStats;
    const winningPlan = explainResult?.queryPlanner?.winningPlan;
    rows.push({
      query,
      totalDocsExamined: stats?.totalDocsExamined ?? "n/a",
      executionTimeMillis: stats?.executionTimeMillis ?? "n/a",
      winningPlanStage:
        winningPlan?.inputStage?.stage ?? winningPlan?.stage ?? "n/a",
    });
  };

  // dsl_history.getHistory filter
  record(
    "dsl_history.getHistory({micrositeId,pagePath}) sort createdAt:-1 limit 3",
    await db
      .collection("dsl_history")
      .find(
        { micrositeId: "bench-microsite", pagePath: "bench-page" },
        { sort: { createdAt: -1 }, limit: 3 },
      )
      .explain("executionStats"),
  );

  // skill_entries find (findAll with sort by category/usageCount, mirroring compile order)
  record(
    "skill_entries.findAll sort {category:1,usageCount:-1}",
    await db
      .collection("skill_entries")
      .find({})
      .sort({ category: 1, usageCount: -1 })
      .explain("executionStats"),
  );

  // pending_patches findOne by id
  record(
    "pending_patches.get findOne({id})",
    await db
      .collection("pending_patches")
      .find({ id: "bench-id" })
      .explain("executionStats"),
  );

  // temp_dsl findOne by toolCallId
  record(
    "temp_dsl.getDsl findOne({toolCallId})",
    await db
      .collection("temp_dsl")
      .find({ toolCallId: "bench-tool-call-id" })
      .explain("executionStats"),
  );

  return rows;
}

function printTable(rows: BenchRow[]) {
  console.table(
    rows.map((r) => ({
      query: r.query,
      totalDocsExamined: r.totalDocsExamined,
      executionTimeMillis: r.executionTimeMillis,
      "winningPlan.stage": r.winningPlanStage,
    })),
  );
}

async function main() {
  const rows = await runBench();
  printTable(rows);
  process.exit(0);
}

if (require.main === module) {
  main().catch((err) => {
    console.error("bench-queries failed:", err);
    process.exit(1);
  });
}
