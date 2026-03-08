# C3 Esports Platform — Development Checklist

Based on `ROCKETLEAGUE PLATFORM ARCHITECTURE.pdf` v1.2

Legend: `[x]` = done · `[~]` = partial · `[ ]` = not started

---

## PHASE 1 — FOUNDATION

- [x] Initialize Next.js project (TypeScript, App Router, Tailwind)
- [x] shadcn/ui installed and configured (`components.json`, `src/components/ui/`, `@base-ui/react`)
- [x] Docker Compose: Postgres + Redis (`docker-compose.yml` exists)
- [x] Dockerfile (production image — multi-stage, standalone output, non-root user)
- [x] Prisma schema + initial migration (`prisma/migrations/` exists)
- [x] `.env.example` template file
- [x] Auth.js setup — Discord OAuth provider
- [x] Auth.js setup — email/password credentials provider (`CredentialsProvider`, `/api/auth/register`, `/auth/register`)
- [x] Role middleware (`src/middleware.ts`)
- [x] Permission helpers (`src/lib/roles.ts`, `src/lib/session.ts`)
- [x] Global layout: Navbar, Footer (`src/components/layout/navbar.tsx`, `footer.tsx`)
- [x] Auth pages: sign-in (`/auth/signin`) and error (`/auth/error`) pages
- [x] Theme configuration (crimson/navy palette, Rajdhani + Inter fonts, `globals.css`)
- [x] Seed script (`prisma/seed.ts` — admin user, demo teams, demo season)

---

## PHASE 2 — TEAM SYSTEM

- [~] `POST /api/teams` — create team API route exists (`src/app/api/teams/route.ts`)
- [~] `GET /api/teams` — list teams API route exists
- [ ] Team creation page (`/team/create`)
- [ ] Team logo upload (presigned S3/R2 URL)
- [ ] Roster management (add/remove players, set captain)
- [ ] Public team profile pages (`/teams/[teamSlug]`)
- [ ] Player profile creation + RL/Epic username linking

---

## PHASE 3 — SEASONS & REGISTRATION

> One season is active at a time. Each season has three fixed divisions:
> **Premier** (top tier) · **Open Challengers** (upper open) · **Open Contenders** (lower open/entry)

- [~] `GET/POST /api/staff/seasons` — seasons API route exists (`src/app/api/staff/seasons/route.ts`)
- [ ] Full season CRUD (PATCH, DELETE, publish/archive)
- [ ] Enforce single ACTIVE season constraint at API level
- [ ] Division management — auto-create Premier, Open Challengers, Open Contenders on season create
- [ ] Division settings (max teams, bracket type per division)
- [ ] Team season registration flow (team selects division, manager submits)
- [ ] Registration approval queue (staff dashboard — assign team to division)
- [ ] Public season pages (`/seasons/[seasonSlug]`)
- [ ] Public standings pages per division (Premier / Challengers / Contenders tabs)

---

## PHASE 4 — MATCH SYSTEM

- [ ] League week auto-generation on season publish
- [ ] Match scheduling (assign to week, set scheduledAt)
- [ ] Derived timestamp calculation (checkInOpenAt, checkInDeadlineAt, resultDeadlineAt)
- [ ] Cron job: SCHEDULED → CHECKING_IN when checkInOpenAt reached
- [ ] Check-in flow: team manager "Check In" button + real-time status
- [ ] Cron job: resolve check-in deadline → IN_PROGRESS / FORFEITED / NO_SHOW
- [ ] Score submission flow: IN_PROGRESS → MATCH_FINISHED → VERIFYING
- [ ] Score confirmation flow: VERIFYING → COMPLETED or DISPUTED
- [ ] Staff direct score entry (bypasses confirmation step)
- [ ] Staff result override at any stage + AuditLog entry
- [ ] Replay upload slots on match page (one per game in series)
- [ ] ballchasing.com API client (upload .replay → poll/webhook for parse result)
- [ ] Parse pipeline: SUCCESS → auto-create GameResult (source=REPLAY_AUTO)
- [ ] Parse pipeline: FAILED → notify team, enable manual entry for that game slot
- [ ] MISMATCH detection: parsed scores vs manually entered → auto-DISPUTED
- [ ] ReplayPlayerStat creation from parsed player data
- [ ] Dual-upload fast path: both teams uploaded all replays → COMPLETED automatically
- [ ] Single-upload path: one team uploaded → VERIFYING with pre-filled scores
- [ ] Manual entry fallback: only shown for games with no valid replay
- [ ] Match page UX: per-game grid with replay status indicators
- [ ] Auto standings update on COMPLETED / FORFEITED
- [ ] Dispute auto-creation on score conflict or MISMATCH
- [ ] Match timeline page (status history from AuditLog)
- [ ] Cron job: poll PROCESSING replays; escalate stale VERIFYING → DISPUTED
- [ ] ballchasing.com webhook endpoint + signature verification

---

## PHASE 5 — BRACKETS

- [ ] Double Elimination bracket generation
- [ ] Bracket viewer component (visual tree)
- [ ] Swiss pairing algorithm + round advancement
- [ ] GSL group stage generation
- [ ] Auto match creation on bracket advancement
- [ ] Public bracket page (`/seasons/[seasonSlug]/brackets`)

---

## PHASE 6 — ADMIN PANEL

- [~] `GET/PATCH /api/admin/users` — user management API exists (`src/app/api/admin/users/route.ts`)
- [ ] Admin overview dashboard (stats, recent activity)
- [ ] Dispute resolution workflow
- [ ] Manual standings override
- [ ] Match result override with audit log
- [ ] Season history archive view
- [ ] User management UI (role assignment)

---

## PHASE 7 — POLISH & PRODUCTION

- [ ] SEO: metadata, OG images per team/season/bracket
- [ ] Error boundaries and fallback UI
- [ ] Loading skeletons for data-heavy pages
- [ ] Rate limiting on sensitive endpoints
- [ ] Email notifications (result submitted, dispute opened)
- [ ] CI/CD pipeline (GitHub Actions → Vercel)
- [ ] Monitoring: Sentry + Vercel Analytics

---

## PHASE 8 — FUTURE FEATURES

- [ ] Live match score ticker (WebSocket / Server-Sent Events)
- [ ] Discord bot integration (post results to server)
- [ ] Player stats aggregation across seasons
- [ ] Season-end awards (MVP, Top Scorer)
- [ ] Multi-region support
- [ ] Public API (read-only) for community tools
