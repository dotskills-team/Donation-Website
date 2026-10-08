"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form";
import { api, ApiError } from "@/lib/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrors({});
    try {
      const u = await api<{ role: "ADMIN" | "MODERATOR" }>("/api/auth/login", { method: "POST", body: { email, password } });
      router.replace(u.role === "ADMIN" ? "/admin" : "/dashboard");
      router.refresh();
    } catch (err) {
      setErrors(err instanceof ApiError ? { ...(err.details ?? {}), _: err.details ? "" : err.message } : { _: "Could not sign in. Try again." });
      setBusy(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardBody className="space-y-5">
        <div>
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted">For moderators and administrators.</p>
        </div>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Email" error={errors.email}>
            <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!errors.email} />
          </Field>
          <Field label="Password" error={errors.password}>
            <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} invalid={!!errors.password} />
          </Field>
          {errors._ && (
            <p role="alert" className="text-sm text-danger">
              {errors._}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <Link href="/" className="block text-center text-sm text-brand-dark hover:underline">
          ← Back to public page
        </Link>
      </CardBody>
    </Card>
  );
}
