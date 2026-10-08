"use client";
import Link from "next/link";
import { Stat } from "@/components/ui/card";
import { Async } from "@/components/ui/states";
import { Badge } from "@/components/ui/badge";
import { DonationsTable } from "@/components/dashboard/donations-table";
import { useLive } from "@/hooks/use-live";
import { money } from "@/lib/format";
import type { ModeratorRow } from "@/components/admin/moderators-manager";

export function ModeratorDetail({ id }: { id: string }) {
  const state = useLive<ModeratorRow>(`/api/moderators/${id}`);
  return (
    <>
      <Link href="/admin/moderators" className="text-sm text-brand-dark hover:underline">
        ← All moderators
      </Link>
      <Async state={state}>
        {(m) => (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold">{m.name}</h1>
              <Badge tone={m.status === "ACTIVE" ? "green" : "gray"}>{m.status === "ACTIVE" ? "Active" : "Inactive"}</Badge>
              <span className="text-sm text-muted">
                {m.email} · {m.mobile}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label="Total collection" value={money(m.total)} />
              <Stat label="Total donations" value={m.donations} />
            </div>
            <DonationsTable admin fixedModeratorId={id} />
          </>
        )}
      </Async>
    </>
  );
}
