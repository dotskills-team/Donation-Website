"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, Stat } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/form";
import { Async, Empty } from "@/components/ui/states";
import { Table, Td, Th } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { DailyChart, type DailyRow } from "@/components/admin/daily-chart";
import { MethodChart } from "@/components/admin/method-chart";
import { RangeFilter, rangeQuery, type RangeValue } from "@/components/dashboard/range-filter";
import { useLive } from "@/hooks/use-live";
import { METHODS, METHOD_LABEL, money } from "@/lib/format";
import type { MethodRow, PerformanceRow, Stats } from "@/types";

type Tab = "daily" | "moderator" | "method" | "custom";

function ModeratorTable({ rows }: { rows: PerformanceRow[] }) {
  if (rows.length === 0) return <Empty title="No collections in this period" />;
  return (
    <Table className="min-w-0">
      <thead>
        <tr>
          <Th>Rank</Th>
          <Th>Moderator</Th>
          <Th className="text-right">Donations</Th>
          <Th className="text-right">Total collection</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.rank}>
            <Td>#{r.rank}</Td>
            <Td>{r.name}</Td>
            <Td className="text-right tabular-nums">{r.count}</Td>
            <Td className="text-right tabular-nums">{money(r.total)}</Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export function ReportsView() {
  const [tab, setTab] = useState<Tab>("daily");
  const [range, setRange] = useState<RangeValue>({ range: "month" });
  const q = rangeQuery(range);
  const daily = useLive<DailyRow[]>(tab === "daily" ? `/api/reports/daily?${q}` : null);
  const mods = useLive<PerformanceRow[]>(tab === "moderator" ? `/api/reports/moderators?${q}` : null);
  const methods = useLive<MethodRow[]>(tab === "method" ? `/api/reports/collection-methods?${q}` : null);

  return (
    <>
      <h1 className="text-xl font-semibold">Reports</h1>
      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "daily", label: "Daily" },
          { id: "moderator", label: "Moderator" },
          { id: "method", label: "Collection method" },
          { id: "custom", label: "Custom" },
        ]}
      />
      {tab !== "custom" && (
        <Card>
          <CardHeader title={tab === "daily" ? "Daily report" : tab === "moderator" ? "Moderator report" : "Collection method report"} action={<RangeFilter value={range} onChange={setRange} allowAll />} />
          {tab === "daily" && <Async state={daily}>{(rows) => <DailyChart rows={rows} />}</Async>}
          {tab === "moderator" && <Async state={mods}>{(rows) => <ModeratorTable rows={rows} />}</Async>}
          {tab === "method" && <Async state={methods}>{(rows) => <MethodChart rows={rows} />}</Async>}
        </Card>
      )}
      {tab === "custom" && <CustomReport />}
    </>
  );
}

interface Custom {
  summary: Stats;
  byMethod: MethodRow[];
  byModerator: PerformanceRow[];
  daily: DailyRow[];
}

function CustomReport() {
  const [draft, setDraft] = useState({ from: "", to: "", moderatorId: "", method: "", status: "CONFIRMED" });
  const [applied, setApplied] = useState(draft);
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(applied)) if (v) params.set(k, v);
  const state = useLive<Custom>(`/api/reports/custom?${params}`);
  const modList = useLive<{ id: string; name: string }[]>("/api/moderators");
  const up = (k: keyof typeof draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setDraft((d) => ({ ...d, [k]: e.target.value }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Custom report" />
        <CardBody>
          <form
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
            onSubmit={(e) => {
              e.preventDefault();
              setApplied(draft);
            }}
          >
            <Field label="Start Date">
              <Input type="date" value={draft.from} onChange={up("from")} />
            </Field>
            <Field label="End Date">
              <Input type="date" value={draft.to} onChange={up("to")} />
            </Field>
            <Field label="Moderator">
              <Select value={draft.moderatorId} onChange={up("moderatorId")}>
                <option value="">All</option>
                {modList.data?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Collection Method">
              <Select value={draft.method} onChange={up("method")}>
                <option value="">All</option>
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {METHOD_LABEL[m]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={draft.status} onChange={up("status")}>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CANCELLED">Cancelled</option>
              </Select>
            </Field>
            <div className="sm:col-span-2 lg:col-span-5">
              <Button type="submit">Run report</Button>
            </div>
          </form>
        </CardBody>
      </Card>
      <Async state={state}>
        {(r) => (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Total amount" value={money(r.summary.total)} />
              <Stat label="Donations" value={r.summary.count} />
              <Stat label="Donors" value={r.summary.donors} />
            </div>
            <Card>
              <CardHeader title="By collection method" />
              <MethodChart rows={r.byMethod} />
            </Card>
            <Card>
              <CardHeader title="By moderator" />
              <ModeratorTable rows={r.byModerator} />
            </Card>
            <Card>
              <CardHeader title="By day" />
              <DailyChart rows={r.daily} />
            </Card>
          </>
        )}
      </Async>
    </div>
  );
}
