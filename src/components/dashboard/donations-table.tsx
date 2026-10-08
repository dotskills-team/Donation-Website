"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Async, Empty } from "@/components/ui/states";
import { Table, Td, Th } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { useLive } from "@/hooks/use-live";
import { api, ApiError } from "@/lib/client";
import { fmtDate, METHODS, METHOD_LABEL, money } from "@/lib/format";
import type { CollectionMethod, DonationRow, Paginated } from "@/types";

interface Filters {
  q: string;
  from: string;
  to: string;
  moderatorId: string;
  method: string;
  status: string;
  min: string;
  max: string;
}
const EMPTY: Filters = { q: "", from: "", to: "", moderatorId: "", method: "", status: "", min: "", max: "" };

/** Server-paginated donation list. `admin` unlocks the moderator/amount filters and cancel; moderators only ever receive their own rows from the API. */
export function DonationsTable({ admin, fixedModeratorId }: { admin: boolean; fixedModeratorId?: string }) {
  const toast = useToast();
  const [draft, setDraft] = useState<Filters>(EMPTY);
  const [applied, setApplied] = useState<Filters>(EMPTY);
  const [page, setPage] = useState(1);
  const [cancelRow, setCancelRow] = useState<DonationRow | null>(null);
  const [editRow, setEditRow] = useState<DonationRow | null>(null);

  const params = new URLSearchParams({ page: String(page), limit: "15" });
  for (const [k, v] of Object.entries(applied)) if (v) params.set(k, v);
  if (fixedModeratorId) params.set("moderatorId", fixedModeratorId);
  const state = useLive<Paginated<DonationRow>>(`/api/donations?${params}`);
  const mods = useLive<{ id: string; name: string }[]>(admin && !fixedModeratorId ? "/api/moderators" : null);

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setApplied(draft);
  };
  const reset = () => {
    setDraft(EMPTY);
    setApplied(EMPTY);
    setPage(1);
  };
  const upd = (k: keyof Filters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setDraft((d) => ({ ...d, [k]: e.target.value }));

  return (
    <Card>
      <CardHeader title={admin ? "Donations" : "My donations"} hint="Cancelled donations stay on record but are not counted." />
      <form onSubmit={apply} className="grid gap-3 border-b border-line p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input placeholder="Search name, mobile, transaction ID" aria-label="Search" value={draft.q} onChange={upd("q")} className="lg:col-span-2" />
        <Input type="date" aria-label="From date" value={draft.from} onChange={upd("from")} />
        <Input type="date" aria-label="To date" value={draft.to} onChange={upd("to")} />
        {admin && !fixedModeratorId && (
          <Select aria-label="Moderator" value={draft.moderatorId} onChange={upd("moderatorId")}>
            <option value="">All moderators</option>
            {mods.data?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        )}
        <Select aria-label="Collection method" value={draft.method} onChange={upd("method")}>
          <option value="">All methods</option>
          {METHODS.map((m) => (
            <option key={m} value={m}>
              {METHOD_LABEL[m]}
            </option>
          ))}
        </Select>
        <Select aria-label="Status" value={draft.status} onChange={upd("status")}>
          <option value="">All statuses</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
        {admin && (
          <>
            <Input inputMode="decimal" placeholder="Min amount" aria-label="Minimum amount" value={draft.min} onChange={upd("min")} />
            <Input inputMode="decimal" placeholder="Max amount" aria-label="Maximum amount" value={draft.max} onChange={upd("max")} />
          </>
        )}
        <div className="flex gap-2">
          <Button type="submit">Apply</Button>
          <Button type="button" variant="secondary" onClick={reset}>
            Reset
          </Button>
        </div>
      </form>

      <Async state={state}>
        {(res) =>
          res.items.length === 0 ? (
            <Empty title="No donations found" hint="Try changing or clearing the filters." />
          ) : (
            <>
              <Table className="min-w-[56rem]">
                <thead>
                  <tr>
                    <Th>Donor</Th>
                    <Th>Mobile</Th>
                    <Th className="text-right">Amount</Th>
                    <Th>Method</Th>
                    <Th>Transaction ID</Th>
                    {admin && <Th>Moderator</Th>}
                    <Th>Date</Th>
                    <Th>Status</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {res.items.map((d) => (
                    <tr key={d.id} className={d.status === "CANCELLED" ? "text-muted" : ""}>
                      <Td>{d.donorName}</Td>
                      <Td className="tabular-nums">{d.donorMobile}</Td>
                      <Td className={`text-right tabular-nums ${d.status === "CANCELLED" ? "line-through" : ""}`}>{money(d.amount)}</Td>
                      <Td>{METHOD_LABEL[d.collectionMethod]}</Td>
                      <Td>{d.transactionId || "—"}</Td>
                      {admin && <Td>{d.moderator?.name ?? "—"}</Td>}
                      <Td className="whitespace-nowrap">{fmtDate(d.donationDate)}</Td>
                      <Td>
                        <Badge tone={d.status === "CONFIRMED" ? "green" : "red"}>{d.status === "CONFIRMED" ? "Confirmed" : "Cancelled"}</Badge>
                      </Td>
                      <Td className="whitespace-nowrap text-right">
                        {d.status === "CONFIRMED" && (
                          <Button size="sm" variant="ghost" onClick={() => setEditRow(d)}>
                            Edit
                          </Button>
                        )}
                        {admin && d.status === "CONFIRMED" && (
                          <Button size="sm" variant="ghost" className="text-danger hover:bg-danger-soft" onClick={() => setCancelRow(d)}>
                            Cancel
                          </Button>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span className="text-muted">
                  {res.total} donation{res.total === 1 ? "" : "s"} · page {res.page} of {res.pages}
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

      <CancelDialog row={cancelRow} onClose={() => setCancelRow(null)} onDone={() => { setCancelRow(null); state.refresh(); toast.success("Donation cancelled."); }} />
      <EditDialog row={editRow} onClose={() => setEditRow(null)} onDone={() => { setEditRow(null); state.refresh(); toast.success("Donation updated."); }} />
    </Card>
  );
}

function CancelDialog({ row, onClose, onDone }: { row: DonationRow | null; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function go() {
    if (!row || busy) return;
    setBusy(true);
    setErr("");
    try {
      await api(`/api/donations/${row.id}/cancel`, { method: "POST", body: { reason: reason || undefined } });
      onDone();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open={!!row} onClose={onClose} title="Cancel this donation?">
      {row && (
        <div className="space-y-4">
          <p className="text-sm">
            {row.donorName} · {money(row.amount)}. It will be removed from all totals and the public list. The record is kept for audit.
          </p>
          <Field label="Reason" hint="Optional, saved in the audit log">
            <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          {err && <p className="text-sm text-danger" role="alert">{err}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Keep donation
            </Button>
            <Button variant="danger" disabled={busy} onClick={go}>
              {busy ? "Cancelling…" : "Cancel donation"}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

function EditDialog({ row, onClose, onDone }: { row: DonationRow | null; onClose: () => void; onDone: () => void }) {
  return (
    <Dialog open={!!row} onClose={onClose} title="Edit donation">
      {row && <EditForm key={row.id} row={row} onClose={onClose} onDone={onDone} />}
    </Dialog>
  );
}

function EditForm({ row, onClose, onDone }: { row: DonationRow; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState(String(row.amount));
  const [method, setMethod] = useState<CollectionMethod>(row.collectionMethod);
  const [txn, setTxn] = useState(row.transactionId ?? "");
  const [note, setNote] = useState(row.note ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrors({});
    try {
      await api(`/api/donations/${row.id}`, { method: "PATCH", body: { amount: Number(amount), collectionMethod: method, transactionId: txn, note } });
      onDone();
    } catch (err) {
      setErrors(err instanceof ApiError ? (err.details ?? { _: err.message }) : { _: "Could not save" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <p className="text-sm text-muted">
        {row.donorName} · {row.donorMobile}
      </p>
      <Field label="Amount (৳)" error={errors.amount}>
        <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} invalid={!!errors.amount} />
      </Field>
      <Field label="Collection Method" error={errors.collectionMethod}>
        <Select value={method} onChange={(e) => setMethod(e.target.value as CollectionMethod)}>
          {METHODS.map((m) => (
            <option key={m} value={m}>
              {METHOD_LABEL[m]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Transaction ID / Reference" error={errors.transactionId}>
        <Input value={txn} onChange={(e) => setTxn(e.target.value)} />
      </Field>
      <Field label="Note" error={errors.note}>
        <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      {errors._ && <p className="text-sm text-danger" role="alert">{errors._}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

