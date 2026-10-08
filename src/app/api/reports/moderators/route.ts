import { route, ok, parseQuery } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { rangeSchema } from "@/lib/validation";
import { donationMatch, rangeBounds } from "@/services/filters";
import { getActiveCampaign } from "@/services/campaign.service";
import { performance } from "@/services/report.service";

// Public leaderboard: names, counts and totals only. Ids are exposed to admins; `isMe` is computed server-side.
export const GET = route(async (req) => {
  const q = parseQuery(req, rangeSchema);
  const session = await getSession();
  const campaign = await getActiveCampaign();
  if (!campaign) return ok([]);
  const { start, end } = rangeBounds(q.range, q.from, q.to);
  const match = donationMatch({ campaignId: campaign._id, status: "CONFIRMED", start, end });
  return ok(await performance(match, session?.id, session?.role === "ADMIN"));
});
