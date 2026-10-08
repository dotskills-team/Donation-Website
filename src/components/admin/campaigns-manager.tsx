"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Async, Empty } from "@/components/ui/states";
import { Table, Td, Th } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { useLive } from "@/hooks/use-live";
import { api, ApiError } from "@/lib/client";
import { fmtDate, money } from "@/lib/format";
import type { CampaignDTO, CampaignStatus } from "@/types";

const TONE = { DRAFT: "gray", ACTIVE: "green", COMPLETED: "amber", CLOSED: "red" } as const;
const ymd = (iso?: string) => (iso ? iso.slice(0, 10) : "");

export function CampaignsManager() {
  const state = useLive<CampaignDTO[]>("/api/campaigns");
  const toast = useToast();
  const [editing, setEditing] = useState<CampaignDTO | "new" | null>(null);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Campaigns" hint="One campaign can be active at a time. The data model supports more." action={<Button onClick={() => setEditing("new")}>New campaign</Button>} />
        <Async state={state}>
          {(rows) =>
            rows.length === 0 ? (
              <Empty title="No campaigns yet" hint="Create a campaign and set it to Active to start collecting." />
            ) : (
              <Table className="min-w-[44rem]">
                <thead>
                  <tr>
                    <Th>Title</Th>
                    <Th className="text-right">Target</Th>
                    <Th>Start</Th>
                    <Th>End</Th>
                    <Th>Status</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id}>
                      <Td className="font-medium">{c.title}</Td>
                      <Td className="text-right tabular-nums">{money(c.targetAmount)}</Td>
                      <Td>{fmtDate(c.startDate)}</Td>
                      <Td>{fmtDate(c.endDate)}</Td>
                      <Td>
                        <Badge tone={TONE[c.status]}>{c.status.charAt(0) + c.status.slice(1).toLowerCase()}</Badge>
                      </Td>
                      <Td className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => setEditing(c)}>
                          Edit
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

      <Dialog open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "New campaign" : "Edit campaign"}>
        {editing && (
          <CampaignForm
            key={editing === "new" ? "new" : editing.id}
            campaign={editing === "new" ? null : editing}
            onDone={() => {
              setEditing(null);
              toast.success("Campaign saved.");
              state.refresh();
            }}
          />
        )}
      </Dialog>

      <ContactSettings />
    </div>
  );
}

function CampaignForm({ campaign, onDone }: { campaign: CampaignDTO | null; onDone: () => void }) {
  const [title, setTitle] = useState(campaign?.title ?? "");
  const [description, setDescription] = useState(campaign?.description ?? "");
  const [target, setTarget] = useState(campaign ? String(campaign.targetAmount) : "");
  const [status, setStatus] = useState<CampaignStatus>(campaign?.status ?? "DRAFT");
  const [start, setStart] = useState(ymd(campaign?.startDate));
  const [end, setEnd] = useState(ymd(campaign?.endDate));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrors({});
    const body = { title, description, targetAmount: target === "" ? undefined : Number(target), status, startDate: start, endDate: end };
    try {
      await api(campaign ? `/api/campaigns/${campaign.id}` : "/api/campaigns", { method: campaign ? "PATCH" : "POST", body });
      onDone();
    } catch (err) {
      setErrors(err instanceof ApiError ? (err.details ?? { _: err.message }) : { _: "Could not save" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Campaign Title" required error={errors.title}>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} invalid={!!errors.title} />
      </Field>
      <Field label="Description" error={errors.description}>
        <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Target Amount (৳)" required error={errors.targetAmount}>
          <Input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} invalid={!!errors.targetAmount} />
        </Field>
        <Field label="Status" error={errors.status}>
          <Select value={status} onChange={(e) => setStatus(e.target.value as CampaignStatus)} invalid={!!errors.status}>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="CLOSED">Closed</option>
          </Select>
        </Field>
        <Field label="Start Date" error={errors.startDate}>
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="End Date" error={errors.endDate}>
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} invalid={!!errors.endDate} />
        </Field>
      </div>
      {errors._ && <p className="text-sm text-danger" role="alert">{errors._}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save campaign"}
        </Button>
      </div>
    </form>
  );
}

interface Contact {
  phone: string;
  email: string;
  address: string;
  facebook: string;
}

function ContactSettings() {
  const state = useLive<Contact>("/api/settings");
  return (
    <Card>
      <CardHeader title="Public contact information" hint="Shown in the footer of the public page." />
      <CardBody>
        <Async state={state}>{(c) => <ContactForm key={JSON.stringify(c)} initial={c} />}</Async>
      </CardBody>
    </Card>
  );
}

function ContactForm({ initial }: { initial: Contact }) {
  const toast = useToast();
  const [c, setC] = useState(initial);
  const [busy, setBusy] = useState(false);
  const up = (k: keyof Contact) => (e: React.ChangeEvent<HTMLInputElement>) => setC((p) => ({ ...p, [k]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await api("/api/settings", { method: "PUT", body: c });
      toast.success("Contact information saved.");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
      <Field label="Phone">
        <Input value={c.phone} onChange={up("phone")} />
      </Field>
      <Field label="Email">
        <Input type="email" value={c.email} onChange={up("email")} />
      </Field>
      <Field label="Address">
        <Input value={c.address} onChange={up("address")} />
      </Field>
      <Field label="Facebook page link">
        <Input value={c.facebook} onChange={up("facebook")} />
      </Field>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save contact info"}
        </Button>
      </div>
    </form>
  );
}
