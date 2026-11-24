# MNI Members App

The private, member-only app for **MNI**, a curated business network. Members sign in (or request login details), browse the admin-curated timeline, request introductions, submit requirements, refer new members, track rewards and manage their profile.

> **Admin is a separate project.** This repository contains no admin UI. MNI administrators use the separate **MNI Admin** app, which talks to this project's API (see [API for the Admin app](#api-for-the-admin-app)).

---

## Features

| Area | What members can do |
| --- | --- |
| **Sign in** | Email **or** Member ID + password. Account lockout after 5 failed attempts, IP rate limiting, suspended accounts blocked. |
| **Request login details** | Public form for new members, forgotten passwords and locked accounts. Rate-limited, with a bot honeypot. |
| **Home timeline** | Sponsored carousel (accessible, swipeable, pausable), category filters, image / text / image + text posts, member info, introduction requests, full-screen images. |
| **Requests** | Track introductions (Pending → Contact shared). Contact details appear only after MNI shares them. Record the business outcome. |
| **Submit** | Send requirements to MNI with an optional image. See review status and MNI's notes. Revise & resubmit when changes are requested. |
| **Refer & earn** | Refer business owners. Coins are credited **only after MNI confirms** the referral. Invite code, activity history. |
| **Rewards** | Meetup prizes with personal progress, live leaderboard and your rank. |
| **Profile** | View business, networking and account details. **Edits go to MNI for review**: nothing changes publicly until approved. Sign out. |
| **Notifications** | Updates on submissions, introductions, referrals and profile reviews, with unread tracking. |

## Stack

- **Next.js 16** (App Router, React 19, Server Components) + **Tailwind CSS 4**
- **Payload CMS 3** (stable) as the backend: auth, access control, REST API, uploads
- **Postgres** in production (Supabase recommended); **SQLite** file for local development
- S3-compatible storage for uploads (Supabase Storage works); local disk in development
- `zod` validation shared by forms and API routes

## Architecture

```
src/
├── app/
│   ├── (frontend)/
│   │   ├── (auth)/            login, login-help, signup → login-help
│   │   ├── (member)/          protected: home, requests, submit, refer, rewards, profile
│   │   ├── layout.tsx         root layout, fonts, toasts, metadata (noindex)
│   │   └── globals.css        design tokens (colour, radius, type) + base styles
│   ├── (payload)/api/[...slug] Payload REST API (shared with the Admin app)
│   └── api/app/…              member-facing API (auth, requests, submissions, referrals, profile, notifications)
├── access/                    role-based access helpers (deny by default)
├── collections/               Members (auth), Admins (auth), Posts, Banners, Submissions,
│                              ContactRequests, Referrals, LoginHelpRequests, Media
├── hooks/                     review workflows (apply approved profile updates, publish
│                              approved submissions, credit confirmed referrals)
├── lib/                       auth/session, data loaders, serializers, schemas, rate limiting
├── components/                ui/ (design system), layout/, timeline/, modals/, requests/,
│                              submit/, refer/, profile/
├── seed/run.ts                demo data (refuses to run in production)
└── scripts/create-member.ts   provision a member account from the CLI
```

**Data flow.** Pages are Server Components that load data with Payload's local API *as the signed-in member*, so access control is enforced. They pass **explicit view-model projections** (`lib/serializers.ts`) to Client Components, so private fields can't leak into the browser by accident. Mutations go through `/api/app/*` route handlers, followed by `router.refresh()`.

## Security model

- **Two roles:** `members` (this app) and `admins` (the Admin app). All access is **deny-by-default**.
- **Members can only read their own records** (profile, submissions, requests, referrals). Other members are shown through an allow-listed public profile (no email, phone, coins or notes).
- **Members never publish.** Posts and banners are admin-only. Status, feedback, coins, tier, verification and member ID are admin-only **at field level**, even if a member calls the REST API directly.
- **Profile edits are reviewed.** Changes are stored as a pending *Profile Update* and applied to the live profile only when an admin approves. If applying fails validation, the approval is rejected too, so the two records can't drift apart.
- **Contact details are consent-gated.** They are revealed to the requester only after MNI moves the request to *Contact shared*.
- **Coins are earned, not claimed.** A referral credits coins exactly once, when an admin confirms it.
- **Sessions:** HTTP-only, `Secure` (in production), `SameSite=Lax` cookie, valid for 14 days. CSRF protection uses an Origin allow-list plus Payload's Fetch-Metadata checks. Logins are rate-limited per IP, accounts lock after 5 failures, and suspended accounts are blocked.
- **Hardening:** security headers (CSP, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy), GraphQL disabled, no Payload admin UI mounted, upload type/size limits, `noindex` on every page.

## Getting started

```bash
pnpm install
cp .env.example .env          # then set PAYLOAD_SECRET (openssl rand -base64 48)
pnpm seed                     # creates an admin, 5 demo members and timeline content
pnpm dev                      # http://localhost:3000
```

Demo members sign in with `SEED_MEMBER_PASSWORD`, using an email (e.g. `shivani@example.com`) or a Member ID (e.g. `MNI-002184`).

### Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` / `pnpm build` / `pnpm start` | Develop, build, run |
| `pnpm typecheck` | TypeScript checks |
| `pnpm seed` | Seed local/staging data (blocked in production) |
| `pnpm payload run src/scripts/create-member.ts -- --email … --name … --phone … --city … --member-id … --business … --category …` | Provision a member and print a one-time temporary password |
| `pnpm generate:types` | Regenerate `src/payload-types.ts` after changing collections |

## Deploying (Supabase + Node host)

1. Create a Supabase project. Set `DATABASE_URI` to the **pooled** Postgres connection string.
2. Create the schema. The Postgres adapter runs with `push: false`, so production schema changes go through migrations:
   ```bash
   pnpm payload migrate:create initial   # once, against an empty database
   pnpm payload migrate                  # on every deploy
   ```
3. Optional: create a Supabase Storage bucket and set the `S3_*` variables for uploads.
4. Set `PAYLOAD_SECRET` and `NEXT_PUBLIC_SITE_URL`. Add the Admin app's origin to `ALLOWED_ORIGINS`.
5. Run `pnpm build && pnpm start` (or `node .next/standalone/server.js`) on any Node 20+ host.

> Rate limiting is in-memory (per instance). For multi-instance or serverless hosting, swap `lib/rate-limit.ts` for a shared store such as Upstash Redis.

## API for the Admin app

The Admin app authenticates against `POST /api/admins/login` (or with `Authorization: JWT <token>`) and uses Payload's REST API: `GET/POST/PATCH/DELETE /api/<collection>`. Business rules are enforced on the server, so the Admin app only needs to change statuses:

| Admin action | API call | Server-side effect |
| --- | --- | --- |
| Approve a profile update | `PATCH /api/submissions/:id { status: "approved" }` | Applies the proposed fields to the member |
| Publish a requirement | `PATCH /api/submissions/:id { status: "published" }` | Creates the timeline post once and links it |
| Request changes / reject | `PATCH /api/submissions/:id { status, adminFeedback }` | Member sees the note and can revise |
| Share a contact | `PATCH /api/contact-requests/:id { status: "contact_received", adminNote? }` | Reveals contact details to the requester |
| Confirm a referral | `PATCH /api/referrals/:id { status: "confirmed" }` | Credits coins to the referrer exactly once |
| Suspend a member | `PATCH /api/members/:id { accountStatus: "suspended" }` | Blocks sign-in and existing sessions |
| Posts & banners | `POST/PATCH /api/posts`, `/api/banners` | Shown to members immediately |

## Accessibility

Designed for WCAG 2.2 AA. All text and background token pairs are at least 4.5:1, touch targets are at least 44px, and modals use the native `<dialog>` (focus trap, Esc, inert background). Tabs follow the WAI-ARIA pattern with arrow-key navigation, and every form field has a label and linked hint/error. The carousel has a pause control and respects reduced motion. There is a skip link, and `aria-current` marks the active navigation item.

## Known follow-ups

- Replace the placeholder monogram in `components/layout/Logo.tsx` and `public/favicon.svg` with the official MNI logo.
- Configure an email adapter (e.g. Resend) for password-reset and notification emails.
- Move the meetup and prize configuration (`lib/rewards.ts`) into a Payload global so admins can edit it.
