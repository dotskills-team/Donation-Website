"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client";
import { cn } from "@/lib/utils";

export function Shell({
  user,
  nav,
  children,
}: {
  user: { name: string; role: string };
  nav: { href: string; label: string }[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-semibold text-brand-dark">
              Donation Collection
            </Link>
            <nav className="flex gap-1 overflow-x-auto" aria-label="Main">
              {nav.map((n) => {
                const active = n.href === pathname || (n.href !== "/admin" && n.href !== "/dashboard" && pathname.startsWith(n.href));
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={cn("whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium", active ? "bg-brand-soft text-brand-dark" : "text-muted hover:text-ink")}
                  >
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted">
              {user.name} <span className="text-xs">({user.role === "ADMIN" ? "Admin" : "Moderator"})</span>
            </span>
            <Button variant="secondary" size="sm" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">{children}</main>
    </div>
  );
}
