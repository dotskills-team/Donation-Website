import { PublicSite } from "@/components/public/site";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();
  const href = session ? (session.role === "ADMIN" ? "/admin" : "/dashboard") : null;
  return <PublicSite dashboardHref={href} />;
}
