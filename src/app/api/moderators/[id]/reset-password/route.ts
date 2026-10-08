import { route, ok, parseBody, assertId } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { passwordResetSchema } from "@/lib/validation";
import { resetModeratorPassword } from "@/services/moderator.service";

export const POST = route<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const actor = await requirePermission("moderator:manage");
  const { password } = await parseBody(req, passwordResetSchema);
  await resetModeratorPassword(assertId((await params).id), password, actor);
  return ok({ reset: true });
});
