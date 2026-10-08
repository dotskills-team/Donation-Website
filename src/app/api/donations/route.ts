import { route, ok, parseBody, parseQuery } from "@/lib/api";
import { getSession, requirePermission } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import { donationCreateSchema, donationQuerySchema } from "@/lib/validation";
import { createDonation, listDonations } from "@/services/donation.service";

export const GET = route(async (req) => {
  const session = await getSession();
  if (!session) throw new HttpError(401, "Please sign in");
  // Admins see everything; moderators are forced to their own rows inside the service.
  return ok(await listDonations(parseQuery(req, donationQuerySchema), session));
});

export const POST = route(async (req) => {
  const actor = await requirePermission("donation:create");
  const body = await parseBody(req, donationCreateSchema);
  return ok(await createDonation(body, actor), 201);
});
