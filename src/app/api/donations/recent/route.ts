import { route, ok } from "@/lib/api";
import { recentPublicDonations } from "@/services/donation.service";

export const GET = route(async () => ok(await recentPublicDonations(10)));
