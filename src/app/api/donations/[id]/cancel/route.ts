import { route, ok, parseBody, assertId } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { cancelSchema } from "@/lib/validation";
import { cancelDonation } from "@/services/donation.service";

export const POST = route<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const actor = await requirePermission("donation:cancel");
  const { id } = await params;
  const { reason } = await parseBody(req, cancelSchema);
  return ok(await cancelDonation(assertId(id), reason, actor));
});
