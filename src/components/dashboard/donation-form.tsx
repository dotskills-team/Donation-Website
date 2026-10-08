"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/client";
import { METHODS, METHOD_LABEL } from "@/lib/format";
import type { CollectionMethod } from "@/types";

export type Prefill = { requestId?: string; name?: string; mobile?: string; amount?: number; note?: string } | null;

const dhakaToday = () => new Date(Date.now() + 6 * 3600_000).toISOString().slice(0, 10);
const newKey = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `k${Date.now()}${Math.random().toString(36).slice(2)}`);

interface FormState {
  donorName: string;
  donorMobile: string;
  amount: string;
  collectionMethod: CollectionMethod | "";
  transactionId: string;
  donationDate: string;
  note: string;
  anonymous: boolean;
}

const blank = (): FormState => ({
  donorName: "",
  donorMobile: "",
  amount: "",
  collectionMethod: "",
  transactionId: "",
  donationDate: dhakaToday(),
  note: "",
  anonymous: false,
});

/** Mounted fresh (via `key`) whenever a new prefill arrives, so initial state always matches the prefill. */
export function DonationForm({ prefill, onDone }: { prefill: Prefill; onDone?: () => void }) {
  const toast = useToast();
  const [f, setF] = useState<FormState>(() => ({
    ...blank(),
    donorName: prefill?.name ?? "",
    donorMobile: prefill?.mobile ?? "",
    amount: prefill?.amount ? String(prefill.amount) : "",
    note: prefill?.note ?? "",
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const keyRef = useRef(newKey());
  const requestId = useRef(prefill?.requestId);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((p) => ({ ...p, [k]: v }));

  async function lookupDonor() {
    if (f.donorName || !/^(\+?88)?01[3-9]\d{8}$/.test(f.donorMobile.replace(/[\s-]/g, ""))) return;
    try {
      const d = await api<{ name: string } | null>(`/api/donors?mobile=${encodeURIComponent(f.donorMobile)}`);
      if (d?.name) setF((p) => (p.donorName ? p : { ...p, donorName: d.name }));
    } catch {
      /* autofill is optional */
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return; // double-submit guard (the server also dedupes by clientKey)
    setBusy(true);
    setErrors({});
    setDone(false);
    try {
      await api("/api/donations", {
        method: "POST",
        body: {
          donorName: f.donorName,
          donorMobile: f.donorMobile,
          amount: f.amount === "" ? undefined : Number(f.amount),
          collectionMethod: f.collectionMethod || undefined,
          transactionId: f.transactionId || undefined,
          donationDate: f.donationDate && f.donationDate !== dhakaToday() ? f.donationDate : undefined,
          note: f.note || undefined,
          anonymous: f.anonymous,
          clientKey: keyRef.current,
          requestId: requestId.current,
        },
      });
      toast.success("Donation recorded successfully.");
      setDone(true);
      setF(blank());
      keyRef.current = newKey();
      requestId.current = undefined;
      onDone?.();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.details ?? {});
        toast.error(err.message);
      } else toast.error("Could not save. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Record a collection" hint="Enter money you have already collected from a donor." />
      <CardBody>
        {prefill?.requestId && !done && (
          <p className="mb-4 rounded-md bg-brand-soft px-3 py-2 text-sm text-brand-dark">Details filled from a public request. Confirm the amount you actually collected.</p>
        )}
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label="Donor Name" required error={errors.donorName}>
            <Input value={f.donorName} onChange={(e) => set("donorName", e.target.value)} invalid={!!errors.donorName} autoComplete="off" />
          </Field>
          <Field label="Mobile Number" required error={errors.donorMobile} hint="e.g. 01712345678">
            <Input inputMode="tel" value={f.donorMobile} onChange={(e) => set("donorMobile", e.target.value)} onBlur={lookupDonor} invalid={!!errors.donorMobile} />
          </Field>
          <Field label="Amount (৳)" required error={errors.amount}>
            <Input inputMode="decimal" value={f.amount} onChange={(e) => set("amount", e.target.value)} invalid={!!errors.amount} />
          </Field>
          <Field label="Collection Method" required error={errors.collectionMethod}>
            <Select value={f.collectionMethod} onChange={(e) => set("collectionMethod", e.target.value as CollectionMethod)} invalid={!!errors.collectionMethod}>
              <option value="">Select method</option>
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {METHOD_LABEL[m]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Transaction ID / Reference" error={errors.transactionId} hint="Optional. Leave empty for cash.">
            <Input value={f.transactionId} onChange={(e) => set("transactionId", e.target.value)} invalid={!!errors.transactionId} />
          </Field>
          <Field label="Donation Date" error={errors.donationDate}>
            <Input type="date" max={dhakaToday()} value={f.donationDate} onChange={(e) => set("donationDate", e.target.value)} invalid={!!errors.donationDate} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Note" error={errors.note}>
              <Textarea rows={2} value={f.note} onChange={(e) => set("note", e.target.value)} invalid={!!errors.note} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" checked={f.anonymous} onChange={(e) => set("anonymous", e.target.checked)} className="size-4 accent-[var(--color-brand)]" />
            Show as &quot;Anonymous&quot; in the public recent-donations list
          </label>
          <div className="flex items-center gap-3 sm:col-span-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save donation"}
            </Button>
            {done && <span className="text-sm text-brand-dark">Donation recorded successfully.</span>}
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
