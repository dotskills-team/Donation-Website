import { route, ok, parseQuery } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { customReportSchema } from "@/lib/validation";
import { donationMatch, rangeBounds } from "@/services/filters";
import { dailyReport, methodReport, performance, statsFor } from "@/services/report.service";

export const GET = route(async (req) => {
  await requirePermission("report:admin");
  const q = parseQuery(req, customReportSchema);
  const { start, end } = rangeBounds(q.from || q.to ? "custom" : "all", q.from, q.to);
  const match = donationMatch({ moderatorId: q.moderatorId, method: q.method, status: q.status, start, end });
  const [summary, byMethod, byModerator, daily] = await Promise.all([
    statsFor(match),
    methodReport(match),
    performance(match, undefined, true),
    dailyReport(match),
  ]);
  return ok({ summary, byMethod, byModerator, daily });
});
