"use client";
import { useState } from "react";
import { Card, CardHeader, Stat } from "@/components/ui/card";
import { Async } from "@/components/ui/states";
import { DailyChart, type DailyRow } from "@/components/admin/daily-chart";
import { MethodChart } from "@/components/admin/method-chart";
import { Performance } from "@/components/dashboard/performance";
import { RangeFilter, rangeQuery, type RangeValue } from "@/components/dashboard/range-filter";
import { useLive } from "@/hooks/use-live";
import { money } from "@/lib/format";
import type { MethodRow } from "@/types";

interface Kpis {
  campaignTitle: string | null;
  totalCollection: number;
  totalDonations: number;
  totalDonors: number;
  todayCollection: number;
  activeModerators: number;
  pendingRequests: number;
}

export function AdminOverview() {
  const kpis = useLive<Kpis>("/api/reports/summary");
  const [range, setRange] = useState<RangeValue>({ range: "month" });
  const methods = useLive<MethodRow[]>(`/api/reports/collection-methods?${rangeQuery(range)}`);
  const daily = useLive<DailyRow[]>(`/api/reports/daily?${rangeQuery(range)}`);

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold">Overview</h1>
        <Async state={kpis}>{(k) => <p className="text-sm text-muted">{k.campaignTitle ? `Active campaign: ${k.campaignTitle}` : "No active campaign. Create or activate one in Campaigns."}</p>}</Async>
      </div>
      <Async state={kpis}>
        {(k) => (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            <Stat label="Total collection" value={money(k.totalCollection)} />
            <Stat label="Total donations" value={k.totalDonations} />
            <Stat label="Total donors" value={k.totalDonors} />
            <Stat label="Today's collection" value={money(k.todayCollection)} />
            <Stat label="Active moderators" value={k.activeModerators} />
            <Stat label="Pending requests" value={k.pendingRequests} />
          </div>
        )}
      </Async>
      <Performance />
      <Card>
        <CardHeader title="Collection by method" action={<RangeFilter value={range} onChange={setRange} allowAll />} />
        <Async state={methods}>{(rows) => <MethodChart rows={rows} />}</Async>
      </Card>
      <Card>
        <CardHeader title="Daily collection" hint="Last 30 days unless a range is chosen" />
        <Async state={daily}>{(rows) => <DailyChart rows={rows} />}</Async>
      </Card>
    </>
  );
}
