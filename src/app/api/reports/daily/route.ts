import { route, ok, parseQuery } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { startOfDhakaDay } from "@/lib/dates";
import { rangeSchema } from "@/lib/validation";
import { donationMatch, rangeBounds } from "@/services/filters";
import { getActiveCampaign } from "@/services/campaign.service";
import { dailyReport } from "@/services/report.service";

export const GET = route(async (req) => {
  await requirePermission("report:admin");
  const q = parseQuery(req, rangeSchema);
  const campaign = await getActiveCampaign();
  let { start, end } = rangeBounds(q.range, q.from, q.to);
  if (q.range === "all") {
    // Default daily view: the last 30 days.
    start = new Date(startOfDhakaDay().getTime() - 29 * 86_400_000);
    end = undefined;
  }
  return ok(await dailyReport(donationMatch({ campaignId: campaign?._id, status: "CONFIRMED", start, end })));
});
