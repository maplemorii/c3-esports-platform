# C3 Esports Platform — Pre-Launch Checklist

Everything that must be done **before going live with real teams and a real season.**
Each item has the env var, page, or command needed.

---

## 1. Environment & Secrets

- [ ] `DATABASE_URL` — production Postgres URL set in Railway
- [ ] `NEXTAUTH_SECRET` — strong random secret (`openssl rand -base64 32`)
- [ ] `NEXTAUTH_URL` — production domain (e.g. `https://c3esports.com`)
- [ ] `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` — Discord OAuth app created and redirect URI set to `{NEXTAUTH_URL}/api/auth/callback/discord`
- [ ] `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` / `S3_BUCKET_NAME` — R2/S3 bucket created, CORS policy allows uploads from your domain
- [ ] `BALLCHASING_TOKEN` — ballchasing.com API key set (needed for replay parsing)
- [ ] `CRON_SECRET` — random secret, also set in Railway cron schedule headers
- [ ] `REDIS_URL` — Redis instance provisioned (Railway Redis plugin or Upstash); app degrades gracefully without it but cache + rate limit will be in-memory only
- [ ] `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` — Sentry project DSN (already in sentry configs; verify it matches your project)
- [ ] `SENTRY_AUTH_TOKEN` — for source map upload during CI build
- [ ] `RESEND_API_KEY` (or your email provider key) — email notifications won't send without this
- [ ] `EMAIL_FROM` — sender address (e.g. `noreply@c3esports.com`), must be verified with your email provider

---

## 2. Database

- [ ] Run `npx prisma migrate deploy` against production DB (not `prisma migrate dev`)
- [ ] Confirm all migrations applied: `npx prisma migrate status`
- [ ] Run seed script only if you want demo data: `npx prisma db seed` (skip for clean launch)
- [ ] Verify indexes exist on high-traffic columns (`Match.status`, `StandingEntry.divisionId`, `AuditLog.entityId`)
- [ ] Enable Postgres connection pooling (PgBouncer) if Railway doesn't do this automatically — Prisma uses `?pgbouncer=true&connection_limit=1` in `DATABASE_URL` when behind PgBouncer

---

## 3. Auth & Roles

- [ ] Create the first admin account via seed or manually: set `role = ADMIN` in DB for your user
- [ ] Test Discord OAuth login end-to-end in production (callback URL must match exactly)
- [ ] Test email/password registration: create account, log in, log out
- [ ] Verify role middleware blocks `/admin` for non-staff users

---

## 4. File Storage (R2 / S3)

- [ ] Bucket CORS policy allows `PUT` from your domain (required for presigned upload)
- [ ] Bucket is **not** public-read for replay files (private); logo/avatar bucket can be public-read
- [ ] Test logo upload via team settings page
- [ ] Test replay file upload via match detail page
- [ ] Confirm presigned URLs expire (default 1 hour in `src/lib/upload/storage.ts`)

---

## 5. Email

- [ ] Send a test "result submitted" email end-to-end
- [ ] Verify unsubscribe/preference toggle works (`/profile/edit` → notifications tab → `PATCH /api/users/me/notifications`)
- [ ] Check emails don't land in spam (SPF/DKIM records set for your sender domain)

---

## 6. Ballchasing / Replay Parsing

- [ ] `BALLCHASING_TOKEN` is valid and has upload quota
- [ ] Webhook endpoint `POST /api/webhooks/ballchasing` is publicly reachable (not behind auth)
- [ ] Register your webhook URL in ballchasing.com account settings
- [ ] Verify webhook signature check passes (`BALLCHASING_WEBHOOK_SECRET` set if using signed webhooks)
- [ ] Test a replay upload end-to-end in staging: upload → parse → score auto-populated

---

## 7. Cron Jobs

Configure these in Railway (Cron Service or `railway.toml`) with header `Authorization: Bearer {CRON_SECRET}`:

- [ ] `GET /api/cron/match-tick` — every minute (`* * * * *`)
- [ ] `GET /api/cron/replays` — every 5 minutes (`*/5 * * * *`)
- [ ] Test cron manually: hit the endpoints with the correct `Authorization` header and confirm 200

---

## 8. Sentry / Monitoring

- [ ] Trigger a test error: visit `/sentry-example-page` and click the error button — confirm it appears in Sentry dashboard
- [ ] Source maps uploaded successfully in CI build (check Sentry → Issues → stack traces are readable)
- [ ] Set up a Sentry alert for `error rate > 5/min` → email/Slack
- [ ] Railway metrics dashboard bookmarked; set a memory/CPU alert if available

---

## 9. Security Hardening

- [ ] Rate limits are active on all write endpoints (already wired, verify Redis is connected)
- [ ] `NEXTAUTH_SECRET` is unique to production (never shared with dev/staging)
- [ ] No secrets committed to git (check `.env` is in `.gitignore` ✓)
- [ ] S3/R2 bucket policy: no `s3:*` wildcard; only `PutObject` on `logos/*`, `avatars/*`, `replays/*`
- [ ] Prisma `DATABASE_URL` uses a least-privilege DB user (not `postgres` superuser)
- [ ] Review `Content-Security-Policy` headers (Next.js default is loose; consider adding via `next.config.ts` headers)

---

## 10. First Season Setup (in the admin panel)

- [ ] Create a Season: `/admin/seasons/create` — set name, dates, points config
- [ ] Confirm the three divisions auto-created (Premier, Open Challengers, Open Contenders)
- [ ] Generate league weeks: trigger via season publish or `/api/seasons/:id/weeks/generate`
- [ ] Announce registration open — teams register via `/team/[teamId]/register`
- [ ] Approve registrations via `/admin/registrations`
- [ ] Schedule first week's matches via `/admin/matches` + `MatchScheduleForm`
- [ ] Run `POST /api/divisions/:divisionId/standings/recalculate` after any manual standings edits

---

## 11. Smoke Test (do this before announcing)

- [ ] Register a test user account via email/password
- [ ] Link Discord account
- [ ] Create a player profile
- [ ] Create a team, upload logo
- [ ] Register team for the active season
- [ ] Approve registration as staff
- [ ] Schedule a test match
- [ ] Check in both teams
- [ ] Submit a score
- [ ] Confirm score as opposing team
- [ ] Verify standings update
- [ ] Upload a replay file
- [ ] File and resolve a dispute
- [ ] Check audit log at `/admin/audit`
- [ ] Verify Sentry captured no unexpected errors during this flow

---

## 12. DNS & SSL

- [ ] Custom domain pointed to Railway deployment
- [ ] SSL certificate auto-provisioned (Railway does this automatically)
- [ ] `www` redirect to apex domain (or vice versa) set up
- [ ] `NEXTAUTH_URL` matches exactly (protocol + domain + no trailing slash)
