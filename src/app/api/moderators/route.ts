import { route, ok, parseBody } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { moderatorCreateSchema } from "@/lib/validation";
import { createModerator, listModerators } from "@/services/moderator.service";

export const GET = route(async () => {
  await requirePermission("moderator:manage");
  return ok(await listModerators());
});

export const POST = route(async (req) => {
  const actor = await requirePermission("moderator:manage");
  const body = await parseBody(req, moderatorCreateSchema);
  return ok(await createModerator(body, actor), 201);
});
