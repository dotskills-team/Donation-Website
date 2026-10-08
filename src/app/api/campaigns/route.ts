import { route, ok, parseBody } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { campaignSchema } from "@/lib/validation";
import { createCampaign, listCampaigns } from "@/services/campaign.service";

export const GET = route(async () => {
  await requirePermission("campaign:manage");
  return ok(await listCampaigns());
});

export const POST = route(async (req) => {
  const actor = await requirePermission("campaign:manage");
  const body = await parseBody(req, campaignSchema);
  return ok(await createCampaign(body, actor), 201);
});
