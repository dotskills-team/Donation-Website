import { redirect } from "next/navigation";
import { Shell } from "@/components/dashboard/shell";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");
  return (
    <Shell
      user={session}
      nav={[
        { href: "/admin", label: "Overview" },
        { href: "/admin/donations", label: "Donations" },
        { href: "/admin/moderators", label: "Moderators" },
        { href: "/admin/donors", label: "Donors" },
        { href: "/admin/campaigns", label: "Campaigns" },
        { href: "/admin/reports", label: "Reports" },
      ]}
    >
      {children}
    </Shell>
  );
}
