import { route, ok, parseQuery } from "@/lib/api";
import { getSession, requirePermission } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import { donorQuerySchema, MOBILE_RE, normalizeMobile } from "@/lib/validation";
import { findDonorByMobile, listDonors } from "@/services/donor.service";

export const GET = route(async (req) => {
  const mobile = req.nextUrl.searchParams.get("mobile");
  if (mobile) {
    // Autofill helper for the donation form: any signed-in user, exact match only.
    const s = await getSession();
    if (!s) throw new HttpError(401, "Please sign in");
    if (!MOBILE_RE.test(normalizeMobile(mobile))) return ok(null);
    return ok(await findDonorByMobile(mobile));
  }
  await requirePermission("donor:readAll");
  return ok(await listDonors(parseQuery(req, donorQuerySchema)));
});
