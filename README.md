# Donation Collection Management System

Next.js 16 (App Router) + TypeScript + MongoDB/Mongoose. Frontend and backend live in one Next.js app (Route Handlers). **This is not a payment gateway**: Cash/bKash/Nagad/Bank/Other are only recorded *collection methods*.

## Run

```bash
npm install
cp .env.example .env.local      # set MONGODB_URI and AUTH_SECRET (32+ chars)
npm run seed                    # creates the first admin + a sample active campaign
npm run dev                     # http://localhost:3000
npm run lint && npm run build
```

Sign in at `/login` with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`, then add moderators under **Admin → Moderators**. Change the seeded password after first login (use Reset password from a new admin, or update `.env.local` and re-seed on a clean DB).

## How it maps to the spec

| Area | Where |
|---|---|
| Public page (hero, progress, stats, request form, recent, performance, contact) | `src/components/public/*`, `src/app/page.tsx` |
| Moderator dashboard (stats, entry form, history, requests, performance) | `src/components/dashboard/*`, `/dashboard` |
| Admin (overview, donations, moderators, donors, campaigns, reports, contact settings) | `src/components/admin/*`, `/admin/*` |
| Business logic | `src/services/*` (no logic in UI components) |
| Auth / RBAC | `src/lib/auth.ts` (signed httpOnly cookie, user re-read from DB each request), `src/lib/permissions.ts` |
| Validation | `src/lib/validation.ts` (Zod, shared by every route) |
| Realtime | `src/app/api/realtime/route.ts` (SSE) + `src/lib/realtime*.ts` + `src/hooks/use-live.ts` |

## Key design decisions

- **Totals are never stored or sent by the client.** Every total, count, donor count, ranking and method total is aggregated in MongoDB from `CONFIRMED` donations. Cancelling a donation only flips its status, so every number corrects itself (no counters to drift). Records are never hard-deleted (there is no DELETE endpoint).
- **Public requests are separate.** The public form writes to `DonationRequest` (never counted). A moderator records the real collection (optionally from the request, which marks it `CONVERTED`).
- **Double submit**: the form disables the button and sends a `clientKey`; a unique partial index makes the server return the original donation on retries.
- **Realtime** sends a data-less "changed" signal over SSE; each client refetches through the normal permission-checked APIs, so no private data ever travels on the public stream. A 30s poll is a safety net.
- Donor records are matched/updated by normalised mobile number. Donations also keep a name/mobile snapshot for fast search.
- Dates/"today" use Asia/Dhaka (UTC+6).
- Multi-campaign ready: every donation has `campaignId`; the app enforces one `ACTIVE` campaign (MVP rule) in `campaign.service.ts` only.
- Admins cancel/edit; only moderators create donations (so the leaderboard contains moderators only).

## Production notes

- SSE pub/sub and the rate limiter are **in-memory**, correct for a single Node instance. For multiple instances, swap `src/lib/realtime.ts` for MongoDB change streams (needs a replica set) or Redis pub/sub, and `src/lib/ratelimit.ts` for Redis.
- Run behind HTTPS (cookie is `secure` in production). Set a strong `AUTH_SECRET`.
- Route protection is enforced in server layouts and in every API route (server-side), not by client state.
- UI primitives in `src/components/ui` are shadcn-style hand-written components (no CLI available offline). You can replace them with `npx shadcn@latest add ...` using the same names/paths.
