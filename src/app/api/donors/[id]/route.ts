import { route, ok, assertId } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { getDonor } from "@/services/donor.service";

export const GET = route<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  await requirePermission("donor:readAll");
  const { id } = await params;
  return ok(await getDonor(assertId(id)));
});
