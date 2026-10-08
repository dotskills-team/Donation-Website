import { ModeratorApp } from "@/components/dashboard/moderator-app";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  return <ModeratorApp name={session?.name ?? ""} />;
}
