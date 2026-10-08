import { route, ok, parseBody } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { requestCreateSchema } from "@/lib/validation";
import { createRequest, listRequests } from "@/services/request.service";

// Public form: saves a *request* only. It never counts toward any total.
export const POST = route(async (req) => {
  rateLimit(`request:${clientIp(req)}`, 5, 10 * 60_000);
  const body = await parseBody(req, requestCreateSchema);
  await createRequest(body);
  return ok({ received: true }, 201);
});

export const GET = route(async () => {
  await requirePermission("request:manage");
  return ok(await listRequests("PENDING"));
});
