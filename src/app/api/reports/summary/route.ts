import { route, ok } from "@/lib/api";
import { getSession } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import { adminKpis, moderatorStats } from "@/services/report.service";

export const GET = route(async () => {
  const s = await getSession();
  if (!s) throw new HttpError(401, "Please sign in");
  return ok(s.role === "ADMIN" ? { role: "ADMIN" as const, ...(await adminKpis()) } : { role: "MODERATOR" as const, ...(await moderatorStats(s.id)) });
});
