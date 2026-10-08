"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardBody, CardHeader, Stat } from "@/components/ui/card";
import { Async, Empty } from "@/components/ui/states";
import { Progress } from "@/components/ui/progress";
import { Performance } from "@/components/dashboard/performance";
import { RequestForm } from "@/components/public/request-form";
import { useLive } from "@/hooks/use-live";
import { fmtDate, money } from "@/lib/format";
import type { CampaignDTO, CampaignSummary } from "@/types";

const VIDEO_ID = "j-eg-cFrXGg";

const NAV_LINKS = [
  { href: "#progress", label: "অগ্রগতি" },
  { href: "#request", label: "অনুদান দিন" },
  { href: "#moderators", label: "Moderator" },
];

interface Overview {
  campaign: CampaignDTO;
  summary: CampaignSummary;
}
interface Recent {
  id: string;
  name: string;
  amount: number;
  date: string;
}
interface Contact {
  phone: string;
  email: string;
  address: string;
  facebook: string;
}

export function PublicSite({ dashboardHref }: { dashboardHref: string | null }) {
  const overview = useLive<Overview | null>("/api/campaigns/active");
  const recent = useLive<Recent[]>("/api/donations/recent");
  const contact = useLive<Contact>("/api/settings");

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <SiteHeader dashboardHref={dashboardHref} />

      <Async state={overview}>
        {(o) =>
          o === null ? (
            <section className="mx-auto max-w-6xl px-3 py-12 sm:px-4 sm:py-16">
              <Empty title="এই মুহূর্তে কোনো সক্রিয় campaign নেই" hint="অনুগ্রহ করে একটু পরে আবার দেখুন।" />
            </section>
          ) : (
            <>
              <Hero s={o.summary} />
              <section className="mx-auto max-w-6xl space-y-6 px-3 py-6 sm:space-y-10 sm:px-4 sm:py-10">
                <VideoSection />
                <CampaignInfo c={o.campaign} />
                <div id="progress" className="scroll-mt-20">
                  <ProgressSection s={o.summary} />
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
                  <Stat label="মোট সংগ্রহ" value={money(o.summary.total)} />
                  <Stat label="মোট Donor" value={o.summary.donors} />
                  <Stat label="মোট Donation" value={o.summary.count} />
                  <Stat label="অবশিষ্ট" value={money(o.summary.remaining)} />
                </div>
              </section>
            </>
          )
        }
      </Async>

      <section className="mx-auto max-w-6xl space-y-6 px-3 pb-10 sm:space-y-10 sm:px-4 sm:pb-12">
        <div id="request" className="scroll-mt-20 space-y-3">
          <h2 className="text-lg font-semibold sm:text-xl">অনুদানের অনুরোধ</h2>
          <RequestForm disabled={overview.data === null} />
        </div>

        <Card>
          <CardHeader title="সাম্প্রতিক অনুদান" hint="শুধু নিশ্চিত হওয়া অনুদান দেখানো হয়" />
          <Async state={recent}>
            {(rows) =>
              rows.length === 0 ? (
                <Empty title="এখনো কোনো অনুদান নেই" />
              ) : (
                <ul className="divide-y divide-line">
                  {rows.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 px-3 py-3 sm:gap-4 sm:px-5">
                      <div className="min-w-0">
                        <p className="break-words font-medium">{r.name}</p>
                        <p className="text-xs text-muted">{fmtDate(r.date)}</p>
                      </div>
                      <p className="shrink-0 font-semibold tabular-nums">{money(r.amount)}</p>
                    </li>
                  ))}
                </ul>
              )
            }
          </Async>
        </Card>

        <div id="moderators" className="scroll-mt-20 overflow-x-auto">
          <Performance bn />
        </div>
      </section>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-5 px-3 py-6 sm:grid-cols-2 sm:gap-6 sm:px-4 sm:py-8">
          <div className="min-w-0">
            <p className="font-semibold text-brand-dark">যোগাযোগ</p>
            <Async state={contact}>
              {(c) =>
                c.phone || c.email || c.address || c.facebook ? (
                  <ul className="mt-2 space-y-1 break-words text-sm text-muted">
                    {c.phone && <li>ফোন: {c.phone}</li>}
                    {c.email && <li>ইমেইল: {c.email}</li>}
                    {c.address && <li>ঠিকানা: {c.address}</li>}
                    {c.facebook && (
                      <li>
                        <a className="text-brand-dark underline" href={c.facebook} rel="noopener noreferrer" target="_blank">
                          Facebook page
                        </a>
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted">যোগাযোগের তথ্য শীঘ্রই যোগ করা হবে।</p>
                )
              }
            </Async>
          </div>
          <p className="text-sm leading-relaxed text-muted sm:text-right">
            এই ওয়েবসাইটে অনলাইন পেমেন্ট নেওয়া হয় । সব অনুদান moderator সরাসরি সংগ্রহ করে সিস্টেমে নথিভুক্ত করেন।
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ───────────────────────── Header + Mobile menu ───────────────────────── */

function SiteHeader({ dashboardHref }: { dashboardHref: string | null }) {
  const [open, setOpen] = useState(false);

  // Esc চাপলে বা স্ক্রিন বড় হলে মেনু বন্ধ
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mq.matches) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onChange);
    return () => {
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onChange);
    };
  }, [open]);

  const authLabel = dashboardHref ? "Dashboard" : "Login";
  const authHref = dashboardHref ?? "/login";

  return (
    <>
      {/* মেনুর বাইরে ট্যাপ করলে বন্ধ হবে */}
      {open && (
        <button
          type="button"
          aria-label="মেনু বন্ধ করুন"
          tabIndex={-1}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-20 cursor-default bg-black/30 md:hidden"
        />
      )}

      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-2.5 sm:px-4 sm:py-3">
          <a href="#" className="min-w-0 truncate text-base font-semibold text-brand-dark sm:text-lg">
            অনুদান সংগ্রহ
          </a>

          {/* Desktop / Tablet */}
          <nav className="hidden items-center gap-5 text-sm md:flex" aria-label="Main">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="text-muted transition-colors hover:text-ink">
                {l.label}
              </a>
            ))}
            <Link href={authHref} className="rounded-md border border-line px-3.5 py-1.5 font-medium hover:bg-brand-soft">
              {authLabel}
            </Link>
          </nav>

          {/* Mobile */}
          <div className="flex shrink-0 items-center gap-2 md:hidden">
            <Link href={authHref} className="rounded-md border border-line px-3 py-1.5 text-sm font-medium hover:bg-brand-soft">
              {authLabel}
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line hover:bg-brand-soft"
            >
              {open ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {open && (
          <nav
            id="mobile-menu"
            aria-label="Mobile"
            className="absolute inset-x-0 top-full border-b border-line bg-surface shadow-lg md:hidden"
          >
            <ul className="mx-auto max-w-6xl divide-y divide-line px-3 py-1 sm:px-4">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-12 items-center justify-between py-3 text-base font-medium text-ink"
                  >
                    {l.label}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted" aria-hidden="true">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
            <div className="mx-auto max-w-6xl px-3 pb-4 pt-2 sm:px-4">
              <a
                href="#request"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 w-full items-center justify-center rounded-md bg-brand-dark px-5 text-sm font-semibold text-white hover:opacity-90"
              >
                অনুদানের অনুরোধ করুন
              </a>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}

/* ───────────────────────────────── Hero ───────────────────────────────── */

function Hero({ s }: { s: CampaignSummary }) {
  return (
    <section className="bg-brand-dark text-white">
      <div className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-10">
        <div className="grid items-center gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          {/* Image: মোবাইলে উপরে, ডেস্কটপে ডানে */}
          <div className="order-first mx-auto w-full max-w-[200px] sm:max-w-[240px] lg:order-last lg:max-w-[280px]">
            <div className="overflow-hidden rounded-xl border border-white/15 bg-white/10 p-2 shadow-lg">
              <Image
                src="/ankan.jpeg"
                alt="অংকন দেবনাথ"
                width={560}
                height={560}
                sizes="(max-width: 640px) 200px, (max-width: 1024px) 240px, 280px"
                className="aspect-square w-full rounded-lg object-cover"
                priority
              />
              <div className="px-2 pb-1 pt-3 text-center">
                <p className="font-semibold">অংকন দেবনাথ</p>
                <p className="mt-1 text-xs text-white/60">চিকিৎসার জন্য আপনাদের সহযোগিতা প্রয়োজন</p>
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="min-w-0">
            <div className="mb-3 inline-flex max-w-full rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
              চিকিৎসার জন্য মানবিক সাহায্যের আবেদন
            </div>

            <h1 className="text-xl font-bold leading-snug sm:text-2xl lg:text-3xl">
              অংকন দেবনাথের চিকিৎসায় সহযোগিতার হাত বাড়িয়ে দিন
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
              অংকনের হার্টে দুটি ছিদ্র ধরা পড়েছে। পাশাপাশি একটি কিডনি জন্মগতভাবে নেই এবং অন্য কিডনিটিও গুরুতরভাবে
              ক্ষতিগ্রস্ত। দ্রুত কিডনি প্রতিস্থাপনের জন্য আপনাদের সহযোগিতা প্রয়োজন।
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
              আপনার সামর্থ্য অনুযায়ী ১০০ টাকা, ৫০০ টাকা, ১,০০০ টাকা—যতটুকু সম্ভব, অংকনের চিকিৎসার জন্য সহযোগিতা
              করুন। 🤲 আপনার কাছে হয়তো এই অর্থটুকু সামান্য, কিন্তু আপনার সামান্য সহযোগিতাই অংকনের জন্য হয়ে উঠতে পারে
              বেঁচে থাকার একটি বড় আশা।
            </p>

            <div className="mt-5 grid max-w-xl grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
              <div className="rounded-lg bg-white/10 p-3">
                <p className="text-xs text-white/60">প্রয়োজন</p>
                <p className="mt-1 text-base font-bold sm:text-lg">৳১৮–২০ লক্ষ</p>
              </div>
              <div className="rounded-lg bg-white/10 p-3">
                <p className="text-xs text-white/60">সংগ্রহ হয়েছে</p>
                <p className="mt-1 break-words text-base font-bold sm:text-lg">{money(s.total)}</p>
              </div>
              <div className="col-span-2 rounded-lg bg-white/10 p-3 sm:col-span-1">
                <p className="text-xs text-white/60">অবশিষ্ট</p>
                <p className="mt-1 break-words text-base font-bold sm:text-lg">{money(s.remaining)}</p>
              </div>
            </div>

            <div className="mt-5 max-w-xl">
              <Progress percent={s.percent} className="h-3" label="Donation progress" />
              <div className="mt-1 flex justify-between gap-2 text-xs text-white/70">
                <span>চিকিৎসার জন্য সংগ্রহ</span>
                <span className="shrink-0">{s.percent}% সম্পন্ন</span>
              </div>
            </div>

            <a
              href="#request"
              className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-md bg-white px-5 text-sm font-semibold text-brand-dark hover:bg-brand-soft sm:h-10 sm:w-auto"
            >
              অনুদানের অনুরোধ করুন
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────────── Video ──────────────────────────────── */

function VideoSection() {
  return (
    <Card>
      <CardHeader title="ভিডিও" hint="অংকনের চিকিৎসা সম্পর্কে" />
      <CardBody>
        <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-lg border border-line bg-black">
          <div className="relative aspect-video w-full">
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${VIDEO_ID}?rel=0`}
              title="অংকন দেবনাথের চিকিৎসা সম্পর্কিত ভিডিও"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

/* ───────────────────────────── Campaign info ──────────────────────────── */

function PayRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-1.5">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-all text-right font-semibold">{value}</dd>
    </div>
  );
}

function CampaignInfo({ c }: { c: CampaignDTO }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <Card className="min-w-0">
        <CardHeader title="Campaign সম্পর্কে" />
        <CardBody className="space-y-3">
          <p className="whitespace-pre-line leading-relaxed [overflow-wrap:anywhere]">
            {c.description || "বিস্তারিত শীঘ্রই যোগ করা হবে।"}
          </p>
          <p className="text-sm text-muted">
            শুরু: {fmtDate(c.startDate)} · শেষ: {fmtDate(c.endDate)}
          </p>
        </CardBody>
      </Card>

      <Card className="min-w-0">
        <CardHeader title="অনুদান কীভাবে সংগ্রহ হয়" />
        <CardBody className="space-y-5">
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed [overflow-wrap:anywhere]">
            <li>আপনি অনুরোধ ফর্ম পূরণ করেন, অথবা সরাসরি একজন moderator-এর সাথে যোগাযোগ করেন।</li>
            <li>Moderator আপনার কাছ থেকে নগদ, bKash, Nagad বা ব্যাংকের মাধ্যমে অনুদান সংগ্রহ করেন।</li>
            <li>সংগ্রহের পর moderator সেটি সিস্টেমে নথিভুক্ত করেন এবং মোট হিসাব সঙ্গে সঙ্গে হালনাগাদ হয়।</li>
          </ol>

          <div className="space-y-4 border-t border-line pt-4 text-sm">
            <div>
              <p className="mb-1 font-semibold">💳 সাহায্য পাঠানোর মাধ্যম</p>
              <dl className="divide-y divide-line">
                <PayRow label="বিকাশ পার্সোনাল" value="01779833238" />
                <PayRow label="নাম" value="অংকন দেবনাথ" />
                <PayRow label="মোবাইল" value="01779833238" />
                <PayRow label="নাম" value="অংকন দেবনাথ" />
              </dl>
            </div>

            <div>
              <p className="mb-1 font-semibold">🏦 ব্যাংক একাউন্ট</p>
              <dl className="divide-y divide-line">
                <PayRow label="ব্যাংক" value="পূবালী ব্যাংক" />
                <PayRow label="একাউন্টের নাম" value="Angkon Debnath" />
                <PayRow label="একাউন্ট নম্বর" value="1634101004983" />
                <PayRow label="শাখা" value="বালিয়াকান্দি উপশাখা" />
              </dl>
            </div>

            <p className="break-words">
              📌 অংকনের ফেসবুক একাউন্ট: <strong>Onkon Dabnath</strong>
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

/* ──────────────────────────────── Progress ────────────────────────────── */

function ProgressSection({ s }: { s: CampaignSummary }) {
  const marks = [25, 50, 75, 100];
  return (
    <Card>
      <CardHeader title="অনুদানের অগ্রগতি" hint="নতুন অনুদান নথিভুক্ত হলে এটি নিজে থেকেই হালনাগাদ হয়" />
      <CardBody>
        <div className="relative pb-6">
          <Progress percent={s.percent} className="h-4 sm:h-5" label="Donation progress" />
          {marks.map((m) => (
            <span
              key={m}
              className="absolute top-5 -translate-x-1/2 text-[11px] text-muted sm:top-6 sm:text-xs"
              style={{ left: `${m === 100 ? 96 : m}%` }}
            >
              {m}%
            </span>
          ))}
        </div>
        <p className="text-sm">
          আজ সংগ্রহ হয়েছে <span className="font-semibold">{money(s.todayTotal)}</span> ({s.todayCount}টি অনুদান)
        </p>
      </CardBody>
    </Card>
  );
}
