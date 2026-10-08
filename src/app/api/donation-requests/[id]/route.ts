import { route, ok, assertId } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { rejectRequest } from "@/services/request.service";

// Marks a pending request as rejected (not a donation). Conversion happens when a moderator records the collection.
export const PATCH = route<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  await requirePermission("request:manage");
  await rejectRequest(assertId((await params).id));
  return ok({ rejected: true });
});
