"use client";
import { useState } from "react";
import { Stat } from "@/components/ui/card";
import { Async } from "@/components/ui/states";
import { Tabs } from "@/components/ui/tabs";
import { DonationForm, type Prefill } from "@/components/dashboard/donation-form";
import { DonationsTable } from "@/components/dashboard/donations-table";
import { Performance } from "@/components/dashboard/performance";
import { RequestsList } from "@/components/dashboard/requests-list";
import { useLive } from "@/hooks/use-live";
import { money } from "@/lib/format";

type Tab = "overview" | "new" | "history" | "requests";
interface MyStats {
  total: number;
  count: number;
  todayTotal: number;
  todayCount: number;
}

export function ModeratorApp({ name }: { name: string }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [prefill, setPrefill] = useState<Prefill>(null);
  const [formKey, setFormKey] = useState(0);
  const stats = useLive<MyStats>("/api/reports/summary");
  const pending = useLive<unknown[]>("/api/donation-requests");

  return (
    <>
      <div>
        <h1 className="text-xl font-semibold">Welcome, {name}</h1>
        <p className="text-sm text-muted">Totals update live as donations are recorded.</p>
      </div>
      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "new", label: "New collection" },
          { id: "history", label: "My donations" },
          { id: "requests", label: "Requests", badge: pending.data?.length },
        ]}
      />

      {tab === "overview" && (
        <div className="space-y-6">
          <Async state={stats}>
            {(s) => (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat label="My total collection" value={money(s.total)} />
                <Stat label="My total donations" value={s.count} />
                <Stat label="Today's collection" value={money(s.todayTotal)} />
                <Stat label="Today's donations" value={s.todayCount} />
              </div>
            )}
          </Async>
          <Performance />
        </div>
      )}

      {tab === "new" && <DonationForm key={formKey} prefill={prefill} onDone={() => setPrefill(null)} />}
      {tab === "history" && <DonationsTable admin={false} />}
      {tab === "requests" && (
        <RequestsList
          onRecord={(p) => {
            setPrefill(p);
            setFormKey((k) => k + 1);
            setTab("new");
          }}
        />
      )}
    </>
  );
}
