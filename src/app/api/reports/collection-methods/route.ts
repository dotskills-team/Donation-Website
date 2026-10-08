import { route, ok, parseQuery } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { rangeSchema } from "@/lib/validation";
import { donationMatch, rangeBounds } from "@/services/filters";
import { getActiveCampaign } from "@/services/campaign.service";
import { methodReport } from "@/services/report.service";

export const GET = route(async (req) => {
  await requirePermission("report:admin");
  const q = parseQuery(req, rangeSchema);
  const campaign = await getActiveCampaign();
  const { start, end } = rangeBounds(q.range, q.from, q.to);
  return ok(await methodReport(donationMatch({ campaignId: campaign?._id, status: "CONFIRMED", start, end })));
});
