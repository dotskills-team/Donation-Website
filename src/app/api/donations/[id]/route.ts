import { route, ok, parseBody, assertId } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import { hasPermission } from "@/lib/permissions";
import { donationUpdateSchema } from "@/lib/validation";
import { updateDonation } from "@/services/donation.service";

// There is intentionally no DELETE: financial records are cancelled, never removed.
export const PATCH = route<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const session = await getSession();
  if (!session) throw new HttpError(401, "Please sign in");
  if (!hasPermission(session.role, "donation:updateOwn") && !hasPermission(session.role, "donation:updateAny")) {
    throw new HttpError(403, "You do not have permission to do this");
  }
  const { id } = await params;
  const body = await parseBody(req, donationUpdateSchema);
  return ok(await updateDonation(assertId(id), body, session));
});
