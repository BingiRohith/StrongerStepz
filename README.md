# Stronger Steps Workshop Platform

Registration and payment platform for Stronger Steps wellness workshops — Next.js 15 (App Router), TypeScript, Tailwind CSS v4, MongoDB Atlas, and Razorpay.

## Tech Stack

- **Framework:** Next.js 15 (App Router, Turbopack)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4
- **Database:** MongoDB Atlas via Mongoose
- **Auth:** JWT (`jose`), httpOnly session cookie
- **Payments:** Razorpay (Orders API, Checkout, webhooks)
- **Architecture:** Repository → Service → API route layering (see `src/repositories`, `src/services`, `src/app/api`)

## Installation

```bash
npm install
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in real values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
| --- | --- | --- |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string. |
| `JWT_SECRET` | Yes | Signing secret for admin session tokens. Use a long random value in production (`openssl rand -base64 48`). |
| `JWT_EXPIRES_IN` | No (default `7d`) | Admin session lifetime (`30m`, `12h`, `7d`, …). |
| `ADMIN_SESSION_COOKIE_NAME` | No (default `ss_admin_session`) | Name of the admin session cookie. |
| `ADMIN_SEED_EMAIL` | Only for `npm run seed` | Email for the initial admin account created by the seed script. |
| `ADMIN_SEED_PASSWORD` | Only for `npm run seed` | Password for the initial admin account. Change it after first login if shared. |
| `RAZORPAY_KEY_ID` | Yes (for paid workshops) | Razorpay key id, server-side. |
| `RAZORPAY_KEY_SECRET` | Yes (for paid workshops) | Razorpay key secret. **Never expose client-side.** |
| `RAZORPAY_WEBHOOK_SECRET` | Yes (for paid workshops) | Secret configured on the Razorpay webhook (see below). |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Yes (for paid workshops) | Same value as `RAZORPAY_KEY_ID` — exposed to the browser for Checkout. Baked in at build time. |
| `NEXT_PUBLIC_APP_URL` | Yes | Absolute site URL (e.g. `https://strongersteps.in`). Used for metadata, Open Graph images, `sitemap.xml`, and `robots.txt`. |

Only variables prefixed `NEXT_PUBLIC_` are ever sent to the browser — everything else stays server-side. Never commit `.env.local`; it's gitignored.

## Local Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The homepage renders the one workshop marked `published` **and** `featured` in MongoDB — run the seed script first if the database is empty.

## MongoDB Setup

1. Create a free or paid cluster on [MongoDB Atlas](https://cloud.mongodb.com).
2. Create a database user with a strong password (Database Access).
3. Under Network Access, allow the IPs that need to connect:
   - For Vercel, either allow `0.0.0.0/0` (Vercel's serverless functions use dynamic IPs) or use Atlas's [Vercel integration](https://www.mongodb.com/docs/atlas/reference/partner-integrations/vercel/) for scoped access.
4. Copy the connection string into `MONGODB_URI` (include the database name in the path, or let the driver use the default).

## Seed Script

Populates one workshop (idempotent — matched by slug, safe to re-run) and, if `ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD` are set, creates the first admin account (skipped if that email already exists — it never resets an existing password).

```bash
npm run seed
```

## Build

```bash
npm run build
npm run start
```

`npm run build` runs a production Next.js build with Turbopack. `npm run start` serves it.

## Linting & Type Checking

```bash
npm run lint
npx tsc --noEmit
```

## Razorpay Configuration

1. Sign up at [dashboard.razorpay.com](https://dashboard.razorpay.com).
2. **Test mode first:** Settings → API Keys → generate a test key pair. Put them in `.env.local` as `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `NEXT_PUBLIC_RAZORPAY_KEY_ID`.
3. **Webhook:** Settings → Webhooks → Add New Webhook.
   - URL: `https://<your-domain>/api/payments/webhook` (e.g. `https://strongersteps.in/api/payments/webhook`)
   - Active events: `payment.captured`, `payment.failed`, `order.paid`
   - Copy the generated webhook secret into `RAZORPAY_WEBHOOK_SECRET`.
4. **Go live:** once the client provides live credentials, replace all four Razorpay env vars with their `rzp_live_*` equivalents in Vercel's project settings and redeploy — no code changes are needed (see `src/lib/payments/razorpay.ts`). Add a second, separate webhook pointing at the same URL for live mode with its own webhook secret.
5. Payment signatures (checkout return) and webhook signatures are verified server-side with HMAC-SHA256 before anything is marked paid — the frontend's reported success is never trusted directly.

## Deployment (Vercel)

### Build Command
```
npm run build
```
Output directory and install command are auto-detected by Vercel for Next.js — no `vercel.json` is required.

### Deployment Checklist

- [ ] All environment variables above are set in Vercel (Project Settings → Environment Variables), for both Production and Preview as appropriate.
- [ ] `NEXT_PUBLIC_APP_URL` matches the final production domain (`https://strongersteps.in`) — it's baked in at build time and drives metadata, sitemap, and robots.txt.
- [ ] Razorpay keys are the **live** keys (not test) before accepting real payments; `NEXT_PUBLIC_RAZORPAY_KEY_ID` matches `RAZORPAY_KEY_ID`.
- [ ] Razorpay webhook is registered against the production URL with `RAZORPAY_WEBHOOK_SECRET` matching the dashboard-generated secret for that webhook.
- [ ] MongoDB Atlas network access allows Vercel's connections (see MongoDB Checklist).
- [ ] `npm run seed` has been run once against the production database (or the workshop/admin user are created via the admin UI) — the seed script reads `.env.local`, so run it locally pointed at the prod `MONGODB_URI`, or seed manually.
- [ ] Change the seeded admin password after first login if the seed credentials were ever shared over an insecure channel.
- [ ] `npm run build` and `npx tsc --noEmit` both pass cleanly.
- [ ] Custom domain is attached in Vercel and DNS is verified (see DNS Checklist).

### DNS Checklist (strongersteps.in on Vercel)

- [ ] Add the domain in Vercel → Project → Settings → Domains.
- [ ] Point DNS at Vercel per Vercel's instructions for the registrar in use — typically either:
  - `A` record for the apex (`strongersteps.in`) → `76.76.21.21`, or Vercel's currently-documented apex IP, **or** ALIAS/ANAME if the registrar supports it.
  - `CNAME` for `www` → `cname.vercel-dns.com`.
- [ ] Decide the canonical host (`strongersteps.in` vs `www.strongersteps.in`) and let Vercel redirect the other.
- [ ] Confirm SSL certificate is issued (automatic via Vercel) before going live.
- [ ] Update `NEXT_PUBLIC_APP_URL` to the final canonical URL and redeploy.

### MongoDB Checklist

- [ ] Production cluster is separate from any dev/test cluster (don't share seed data with production).
- [ ] Database user credentials used in `MONGODB_URI` are unique to this app and scoped to the minimum required database.
- [ ] Network Access allows Vercel (see MongoDB Setup above).
- [ ] Atlas backups/point-in-time recovery are enabled appropriate to the plan tier.

### Razorpay Webhook URL

```
https://strongersteps.in/api/payments/webhook
```

## Production Checklist

- [ ] Environment variables complete and correct (see table above).
- [ ] Razorpay switched to live keys, webhook registered and verified with a test transaction.
- [ ] MongoDB Atlas production cluster reachable, seeded with the real workshop.
- [ ] `npm run lint`, `npx tsc --noEmit`, and `npm run build` all pass with no errors.
- [ ] Full user flow tested end-to-end against production: landing page → register → pay → success → WhatsApp link.
- [ ] Full admin flow tested: login → dashboard → create/edit/publish workshop → view registrations → export Excel → settings.
- [ ] robots.txt / sitemap.xml reachable at `/robots.txt` and `/sitemap.xml` on the production domain.
- [ ] Admin (`/admin/*`) and payment (`/payment/*`) routes confirmed `noindex` (view page source or `curl -I`).

## Known Limitations

- **Admin login has no rate limiting.** Passwords are hashed with bcrypt and errors don't reveal whether the email or password was wrong, but repeated login attempts aren't throttled. Vercel's serverless functions can't hold in-memory rate-limit state across invocations — adding this would require an external store (e.g. Upstash Redis) and is left as a follow-up.
- **Payment/registration lookup pages are secured by unguessable MongoDB ObjectIds, not a login.** Anyone with a registration's exact id can view its payment status page (`/payment/[registrationId]`) or fetch `/api/payments/registration/[id]`. IDs are only ever handed to the registrant themselves and aren't listed anywhere public, but this is "secret link" security, not authentication.
- **`Settings` model/repository/service are unused scaffolding.** Site configuration ended up living on the `Workshop` document itself (zoom link, WhatsApp link, registration window) instead, edited via the admin Settings page. The generic `Settings` collection was never wired up and can be removed in a future cleanup if it stays unused.
- **No Content-Security-Policy header.** Basic security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) are set in `next.config.ts`, but a strict CSP was intentionally left out — Razorpay Checkout loads external scripts and this needs to be tuned against a real Razorpay integration to avoid silently breaking payments.
- **Two moderate `npm audit` advisories** are transitive (a `postcss` copy bundled inside `next`'s own tooling, and `uuid` bundled inside `exceljs`), not top-level dependencies of this project. `npm audit fix --force` would downgrade `next` itself, which is the wrong direction — wait for upstream patches instead.
- **Razorpay credentials are still placeholders.** The integration is complete and verified with simulated data, but real payments won't work until the client provides live (or at minimum, real test-mode) credentials.
