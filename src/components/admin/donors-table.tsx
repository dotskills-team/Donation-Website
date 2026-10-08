"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/form";
import { Async, Empty } from "@/components/ui/states";
import { Table, Td, Th } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useLive } from "@/hooks/use-live";
import { fmtDate, METHOD_LABEL, money } from "@/lib/format";
import type { CollectionMethod, DonationStatus, Paginated } from "@/types";

interface DonorRow {
  id: string;
  name: string;
  mobile: string;
  email: string;
  donations: number;
  total: number;
}
interface DonorDetail {
  name: string;
  mobile: string;
  email: string;
  donations: { id: string; amount: number; collectionMethod: CollectionMethod; status: DonationStatus; donationDate: string }[];
}

export function DonorsTable() {
  const [q, setQ] = useState("");
  const [applied, setApplied] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);
  const params = new URLSearchParams({ page: String(page), limit: "15" });
  if (applied) params.set("q", applied);
  const state = useLive<Paginated<DonorRow>>(`/api/donors?${params}`);

  return (
    <Card>
      <CardHeader title="Donors" hint="Donors are created automatically from recorded collections (matched by mobile number)." />
      <form
        className="flex gap-2 border-b border-line p-4"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setApplied(q);
        }}
      >
        <Input placeholder="Search name, mobile, email" aria-label="Search donors" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button type="submit">Search</Button>
      </form>
      <Async state={state}>
        {(res) =>
          res.items.length === 0 ? (
            <Empty title="No donors found" />
          ) : (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th>Name</Th>
                    <Th>Mobile</Th>
                    <Th>Email</Th>
                    <Th className="text-right">Donations</Th>
                    <Th className="text-right">Total</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {res.items.map((d) => (
                    <tr key={d.id}>
                      <Td>{d.name}</Td>
                      <Td className="tabular-nums">{d.mobile}</Td>
                      <Td>{d.email || "—"}</Td>
                      <Td className="text-right tabular-nums">{d.donations}</Td>
                      <Td className="text-right tabular-nums">{money(d.total)}</Td>
                      <Td className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => setOpen(d.id)}>
                          View
                        </Button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-muted">
                  {res.total} donors · page {res.page} of {res.pages}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" disabled={res.page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <Button size="sm" variant="secondary" disabled={res.page >= res.pages} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            </>
          )
        }
      </Async>
      <Dialog open={open !== null} onClose={() => setOpen(null)} title="Donor details">
        {open && <DonorDetailView id={open} />}
      </Dialog>
    </Card>
  );
}

function DonorDetailView({ id }: { id: string }) {
  const state = useLive<DonorDetail>(`/api/donors/${id}`);
  return (
    <Async state={state}>
      {(d) => (
        <div className="space-y-3">
          <p className="text-sm">
            <span className="font-medium">{d.name}</span> · {d.mobile} {d.email && `· ${d.email}`}
          </p>
          <Table className="min-w-0">
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Method</Th>
                <Th className="text-right">Amount</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {d.donations.map((x) => (
                <tr key={x.id}>
                  <Td>{fmtDate(x.donationDate)}</Td>
                  <Td>{METHOD_LABEL[x.collectionMethod]}</Td>
                  <Td className="text-right tabular-nums">{money(x.amount)}</Td>
                  <Td>
                    <Badge tone={x.status === "CONFIRMED" ? "green" : "red"}>{x.status === "CONFIRMED" ? "Confirmed" : "Cancelled"}</Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </Async>
  );
}
