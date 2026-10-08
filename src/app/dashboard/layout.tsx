import { redirect } from "next/navigation";
import { Shell } from "@/components/dashboard/shell";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "MODERATOR") redirect("/admin");
  return (
    <Shell user={session} nav={[{ href: "/dashboard", label: "My dashboard" }]}>
      {children}
    </Shell>
  );
}
