import { route, ok } from "@/lib/api";
import { publicOverview } from "@/services/report.service";

// Public: campaign info + aggregated totals only.
export const GET = route(async () => ok(await publicOverview()));
