"use client";
import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Async, Empty } from "@/components/ui/states";
import { Table, Td, Th } from "@/components/ui/table";
import { RangeFilter, rangeQuery, type RangeValue } from "@/components/dashboard/range-filter";
import { useLive } from "@/hooks/use-live";
import { cn } from "@/lib/utils";
import { money } from "@/lib/format";
import type { PerformanceRow } from "@/types";

/** Moderator leaderboard. Used on the public page, the moderator dashboard and the admin dashboard. */
export function Performance({ bn = false }: { bn?: boolean }) {
  const [filter, setFilter] = useState<RangeValue>({ range: "month" });
  const state = useLive<PerformanceRow[]>(`/api/reports/moderators?${rangeQuery(filter)}`);
  const t = bn
    ? { title: "Moderator Performance", rank: "র‍্যাংক", name: "নাম", count: "Donation", total: "মোট সংগ্রহ", empty: "এই সময়ে কোনো তথ্য নেই", you: "আপনি" }
    : { title: "Moderator Performance", rank: "Rank", name: "Moderator", count: "Donations", total: "Total collection", empty: "No collections in this period", you: "You" };

  return (
    <Card>
      <CardHeader title={t.title} hint="Only confirmed donations are counted" action={<RangeFilter value={filter} onChange={setFilter} />} />
      <Async state={state}>
        {(rows) =>
          rows.length === 0 ? (
            <Empty title={t.empty} />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th className="w-16">{t.rank}</Th>
                  <Th>{t.name}</Th>
                  <Th className="text-right">{t.count}</Th>
                  <Th className="text-right">{t.total}</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.rank + r.name} className={cn(r.isMe && "bg-highlight font-medium")}>
                    <Td className="tabular-nums">#{r.rank}</Td>
                    <Td>
                      {r.name} {r.isMe && <Badge tone="amber">{t.you}</Badge>}
                    </Td>
                    <Td className="text-right tabular-nums">{r.count}</Td>
                    <Td className="text-right tabular-nums">{money(r.total)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )
        }
      </Async>
    </Card>
  );
}
