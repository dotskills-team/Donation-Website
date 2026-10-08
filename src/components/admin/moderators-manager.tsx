"use client";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/form";
import { Async, Empty } from "@/components/ui/states";
import { Table, Td, Th } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { useLive } from "@/hooks/use-live";
import { api, ApiError } from "@/lib/client";
import { money } from "@/lib/format";

export interface ModeratorRow {
  id: string;
  name: string;
  email: string;
  mobile: string;
  status: "ACTIVE" | "INACTIVE";
  donations: number;
  total: number;
}

export function ModeratorsManager() {
  const state = useLive<ModeratorRow[]>("/api/moderators");
  const toast = useToast();
  const [editing, setEditing] = useState<ModeratorRow | "new" | null>(null);
  const [resetFor, setResetFor] = useState<ModeratorRow | null>(null);

  async function toggle(m: ModeratorRow) {
    const next = m.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await api(`/api/moderators/${m.id}`, { method: "PATCH", body: { status: next } });
      toast.success(next === "ACTIVE" ? `${m.name} activated.` : `${m.name} deactivated.`);
      state.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <Card>
      <CardHeader title="Moderators" hint="Inactive moderators cannot sign in." action={<Button onClick={() => setEditing("new")}>Add moderator</Button>} />
      <Async state={state}>
        {(rows) =>
          rows.length === 0 ? (
            <Empty title="No moderators yet" hint="Add a moderator so they can start recording collections." />
          ) : (
            <Table className="min-w-[52rem]">
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Mobile</Th>
                  <Th className="text-right">Donations</Th>
                  <Th className="text-right">Collected</Th>
                  <Th>Status</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id}>
                    <Td>
                      <Link href={`/admin/moderators/${m.id}`} className="font-medium text-brand-dark underline-offset-2 hover:underline">
                        {m.name}
                      </Link>
                    </Td>
                    <Td>{m.email}</Td>
                    <Td className="tabular-nums">{m.mobile}</Td>
                    <Td className="text-right tabular-nums">{m.donations}</Td>
                    <Td className="text-right tabular-nums">{money(m.total)}</Td>
                    <Td>
                      <Badge tone={m.status === "ACTIVE" ? "green" : "gray"}>{m.status === "ACTIVE" ? "Active" : "Inactive"}</Badge>
                    </Td>
                    <Td className="whitespace-nowrap text-right">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(m)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setResetFor(m)}>
                        Reset password
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toggle(m)}>
                        {m.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )
        }
      </Async>

      <Dialog open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "Add moderator" : "Edit moderator"}>
        {editing && (
          <ModeratorForm
            key={editing === "new" ? "new" : editing.id}
            moderator={editing === "new" ? null : editing}
            onDone={(msg) => {
              setEditing(null);
              toast.success(msg);
              state.refresh();
            }}
          />
        )}
      </Dialog>
      <Dialog open={resetFor !== null} onClose={() => setResetFor(null)} title={`Reset password${resetFor ? `: ${resetFor.name}` : ""}`}>
        {resetFor && (
          <ResetForm
            id={resetFor.id}
            onDone={() => {
              setResetFor(null);
              toast.success("Password updated.");
            }}
          />
        )}
      </Dialog>
    </Card>
  );
}

function ModeratorForm({ moderator, onDone }: { moderator: ModeratorRow | null; onDone: (msg: string) => void }) {
  const [name, setName] = useState(moderator?.name ?? "");
  const [email, setEmail] = useState(moderator?.email ?? "");
  const [mobile, setMobile] = useState(moderator?.mobile ?? "");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrors({});
    try {
      if (moderator) {
        await api(`/api/moderators/${moderator.id}`, { method: "PATCH", body: { name, email, mobile } });
        onDone("Moderator updated.");
      } else {
        await api("/api/moderators", { method: "POST", body: { name, email, mobile, password } });
        onDone("Moderator added.");
      }
    } catch (err) {
      setErrors(err instanceof ApiError ? (err.details ?? { _: err.message }) : { _: "Could not save" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Name" required error={errors.name}>
        <Input value={name} onChange={(e) => setName(e.target.value)} invalid={!!errors.name} />
      </Field>
      <Field label="Email" required error={errors.email}>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!errors.email} />
      </Field>
      <Field label="Mobile" required error={errors.mobile}>
        <Input inputMode="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} invalid={!!errors.mobile} />
      </Field>
      {!moderator && (
        <Field label="Password" required error={errors.password} hint="At least 8 characters with a letter and a number">
          <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} invalid={!!errors.password} />
        </Field>
      )}
      {errors._ && <p className="text-sm text-danger" role="alert">{errors._}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save moderator"}
        </Button>
      </div>
    </form>
  );
}

function ResetForm({ id, onDone }: { id: string; onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await api(`/api/moderators/${id}/reset-password`, { method: "POST", body: { password } });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? (err.details?.password ?? err.message) : "Could not reset password");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="New password" required error={error} hint="At least 8 characters with a letter and a number">
        <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} invalid={!!error} />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Set password"}
        </Button>
      </div>
    </form>
  );
}
