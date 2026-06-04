import { userPreferences } from "../db/queries/user-preferences";
import { dslHistory } from "../db/queries/dsl-history";
import { fetchMicrositePages } from "./microsite-loader";

export async function executeTool(name: string, args: any) {
  switch (name) {
    case "get_microsite_pages":
      const data = await fetchMicrositePages(args.microsite_id);
      return data;
    case "list_microsites":
      return [{ id: "loan-accounts", name: "Loan Accounts" }];
    case "get_page_dsl":
      // This is a simplified fetch, normally you'd filter the microsite fetch by page path
      const micrositeData = await fetchMicrositePages(args.microsite_id);
      // Assuming pages is an array inside the returned data. Adapt based on actual payload
      const page = micrositeData.pages?.find(
        (p: any) => p.pageCode === args.page_path,
      );
      return { dsl: page || {} };
    case "get_dsl_history":
      return dslHistory.getHistory(
        args.microsite_id,
        args.page_path,
        args.limit,
      );
    case "log_user_preference":
      userPreferences.set(args.key, args.value);
      return { success: true };
    case "propose_rollback":
      return { queued: true, message: "Rollback proposed" };
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
