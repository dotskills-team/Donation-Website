"use client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Async, Empty } from "@/components/ui/states";
import { Table, Td, Th } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { useLive } from "@/hooks/use-live";
import { api } from "@/lib/client";
import { fmtDate, money } from "@/lib/format";
import type { Prefill } from "@/components/dashboard/donation-form";

interface Req {
  id: string;
  name: string;
  mobile: string;
  amount: number;
  note: string;
  createdAt: string;
}

export function RequestsList({ onRecord }: { onRecord: (p: NonNullable<Prefill>) => void }) {
  const state = useLive<Req[]>("/api/donation-requests");
  const toast = useToast();

  async function reject(id: string) {
    try {
      await api(`/api/donation-requests/${id}`, { method: "PATCH" });
      toast.success("Request dismissed.");
      state.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <Card>
      <CardHeader title="Public donation requests" hint="These are not donations yet. Collect the money, then record it." />
      <Async state={state}>
        {(rows) =>
          rows.length === 0 ? (
            <Empty title="No pending requests" hint="New requests from the public page appear here instantly." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Mobile</Th>
                  <Th className="text-right">Amount</Th>
                  <Th>Note</Th>
                  <Th>Received</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <Td>{r.name}</Td>
                    <Td className="tabular-nums">{r.mobile}</Td>
                    <Td className="text-right tabular-nums">{money(r.amount)}</Td>
                    <Td className="max-w-48 truncate">{r.note || "—"}</Td>
                    <Td className="whitespace-nowrap">{fmtDate(r.createdAt, true)}</Td>
                    <Td className="whitespace-nowrap text-right">
                      <Button size="sm" onClick={() => onRecord({ requestId: r.id, name: r.name, mobile: r.mobile, amount: r.amount, note: r.note })}>
                        Record collection
                      </Button>{" "}
                      <Button size="sm" variant="ghost" onClick={() => reject(r.id)}>
                        Dismiss
                      </Button>
                    </Td>
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
