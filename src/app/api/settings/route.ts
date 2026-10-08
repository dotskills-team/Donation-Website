import { route, ok, parseBody } from "@/lib/api";
import { requirePermission } from "@/lib/auth";
import { contactSchema } from "@/lib/validation";
import { getContact, setContact } from "@/services/settings.service";

export const GET = route(async () => ok(await getContact()));

export const PUT = route(async (req) => {
  await requirePermission("settings:manage");
  return ok(await setContact(await parseBody(req, contactSchema)));
});
