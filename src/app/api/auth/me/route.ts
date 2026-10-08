import { route, ok } from "@/lib/api";
import { getSession } from "@/lib/auth";

export const GET = route(async () => ok(await getSession()));
