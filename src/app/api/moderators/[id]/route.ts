import { route, ok, parseBody, assertId } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { moderatorUpdateSchema } from "@/lib/validation";
import { getModerator, updateModerator } from "@/services/moderator.service";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (_req, { params }) => {
  await requirePermission("moderator:manage");
  return ok(await getModerator(assertId((await params).id)));
});

export const PATCH = route<Ctx>(async (req, { params }) => {
  const actor = await requirePermission("moderator:manage");
  const body = await parseBody(req, moderatorUpdateSchema);
  return ok(await updateModerator(assertId((await params).id), body, actor));
});
