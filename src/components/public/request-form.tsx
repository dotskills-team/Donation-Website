"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/form";
import { api, ApiError } from "@/lib/client";

export function RequestForm({ disabled }: { disabled?: boolean }) {
  const [f, setF] = useState({ name: "", mobile: "", amount: "", note: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const up = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrors({});
    setSent(false);
    try {
      await api("/api/donation-requests", {
        method: "POST",
        body: { name: f.name, mobile: f.mobile, amount: f.amount === "" ? undefined : Number(f.amount), note: f.note || undefined },
      });
      setSent(true);
      setF({ name: "", mobile: "", amount: "", note: "" });
    } catch (err) {
      if (err instanceof ApiError) setErrors({ ...(err.details ?? {}), _: err.details ? "" : err.message });
      else setErrors({ _: "সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardBody>
        <p className="mb-4 rounded-md bg-warn-soft px-3 py-2 text-sm text-[#7a5200]">
          এটি কোনো পেমেন্ট ফর্ম নয়। এখানে কোনো টাকা কাটা হবে না। ফর্ম জমা দিলে আমাদের একজন moderator আপনার সাথে যোগাযোগ করে অনুদান সংগ্রহ করবেন।
        </p>
        {sent ? (
          <div role="status" className="space-y-3 py-4 text-center">
            <p className="text-lg font-semibold text-brand-dark">আপনার অনুরোধ জমা হয়েছে</p>
            <p className="text-sm text-muted">ধন্যবাদ। শীঘ্রই একজন moderator আপনার মোবাইল নম্বরে যোগাযোগ করবেন।</p>
            <Button variant="secondary" onClick={() => setSent(false)}>
              আরেকটি অনুরোধ পাঠান
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
            <Field label="নাম" required error={errors.name}>
              <Input value={f.name} onChange={up("name")} invalid={!!errors.name} autoComplete="name" />
            </Field>
            <Field label="মোবাইল নম্বর" required error={errors.mobile} hint="যেমন: 01712345678">
              <Input inputMode="tel" value={f.mobile} onChange={up("mobile")} invalid={!!errors.mobile} autoComplete="tel" />
            </Field>
            <Field label="Amount (৳)" required error={errors.amount}>
              <Input inputMode="decimal" value={f.amount} onChange={up("amount")} invalid={!!errors.amount} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Message / Note" error={errors.note}>
                <Textarea rows={3} value={f.note} onChange={up("note")} invalid={!!errors.note} />
              </Field>
            </div>
            {errors._ && (
              <p role="alert" className="text-sm text-danger sm:col-span-2">
                {errors._}
              </p>
            )}
            <div className="sm:col-span-2">
              <Button type="submit" disabled={busy || disabled}>
                {busy ? "জমা হচ্ছে…" : "অনুদানের অনুরোধ পাঠান"}
              </Button>
              {disabled && <span className="ml-3 text-sm text-muted">এই মুহূর্তে কোনো সক্রিয় campaign নেই।</span>}
            </div>
          </form>
        )}
      </CardBody>
    </Card>
  );
}
