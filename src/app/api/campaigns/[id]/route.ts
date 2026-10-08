import { route, ok, parseBody, assertId } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { campaignUpdateSchema } from "@/lib/validation";
import { updateCampaign } from "@/services/campaign.service";

export const PATCH = route<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const actor = await requirePermission("campaign:manage");
  const { id } = await params;
  const body = await parseBody(req, campaignUpdateSchema);
  return ok(await updateCampaign(assertId(id), body, actor));
});
