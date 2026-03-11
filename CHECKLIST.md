# C3 Esports Platform — Development Checklist

Based on `ROCKETLEAGUE_PLATFORM_ARCHITECTURE.md` v2.0

Legend: `[x]` = done · `[~]` = partial · `[ ]` = not started

---

## PHASE 1 — FOUNDATION

### Project Setup

- [x] Initialize Next.js project (TypeScript, App Router, Tailwind)
- [x] shadcn/ui installed and configured (`components.json`, `src/components/ui/`, `@base-ui/react`)
- [x] Docker Compose: Postgres + Redis (`docker-compose.yml` exists)
- [x] Dockerfile (production image — multi-stage, standalone output, non-root user)
- [x] `.env.example` template file (DATABASE_URL, NEXTAUTH, DISCORD, S3/R2, BALLCHASING, REDIS, SENTRY)
- [x] Theme configuration (crimson/navy palette, Rajdhani + Inter fonts, `globals.css`)

### Database

- [x] Prisma schema + initial migration (`prisma/migrations/` exists)
- [x] Seed script (`prisma/seed.ts` — admin user, demo teams, active season, 4 matches in different states, standings + H2H records)
- [x] Schema: `LeagueWeek` model
- [x] Schema: `MatchCheckIn` model
- [x] Schema: `MatchGame` model (GameResult — per-game scores + result source)
- [x] Schema: `ReplayUpload` model + `ReplayPlayerStat` model
- [x] Schema: `Bracket` + `BracketSlot` models
- [x] Schema: `Dispute` model (with score snapshot fields for audit)
- [x] Schema: `AuditLog` model
- [x] Schema: `Player` model (displayName, epicUsername, steamId, country, discordUsername)
- [x] Schema: `Season` timing config (`leagueWeeks`, `checkInWindowMinutes`, `checkInGraceMinutes`, `resultWindowHours`, `pointsConfig`)
- [x] Schema: `Match` timing fields (`checkInOpenAt`, `checkInDeadlineAt`, `resultDeadlineAt`, `replaysVerified`, `gamesExpected`, result provenance fields)
- [x] Schema: `HeadToHeadRecord` model (per team-pair per division; both directions stored)

### Auth & Roles

- [x] Auth.js setup — Discord OAuth provider
- [x] Auth.js setup — email/password credentials provider (`CredentialsProvider`, `/api/auth/register`, `/auth/register`)
- [x] Role middleware (`src/middleware.ts`)
- [x] Permission helpers (`src/lib/roles.ts`, `src/lib/session.ts`)
- [x] Permissions module at `src/lib/auth/permissions.ts` (`requireRole`, `canManageTeam`, `canSubmitResult`, `canUploadReplay`)

### Layout & Pages

- [x] Global layout: Navbar, Footer (`src/components/layout/navbar.tsx`, `footer.tsx`)
- [x] Auth pages: sign-in (`/auth/signin`) and error (`/auth/error`) pages
- [x] Layout components: `Sidebar.tsx`, `AdminSidebar.tsx`, `DashboardShell.tsx`
- [x] `not-found.tsx` and `error.tsx` root pages

### Lib Infrastructure

- [x] Service layer directory `src/lib/services/` with stub files for all services (standings, match, matchStatus, checkin, leagueWeek, replay, ballchasing, bracket, swiss, gsl, elimination)
- [x] Zod validators: `src/lib/validators/team.schema.ts`, `match.schema.ts`, `season.schema.ts`, `player.schema.ts`
- [x] Utils: `src/lib/utils/slug.ts`, `dates.ts`, `errors.ts`
- [x] Upload helper: `src/lib/upload/storage.ts` (S3/R2 presigned URL generation)
- [x] Cron handler: `src/lib/cron/matchTick.ts`
- [x] App-wide constants: `src/lib/constants.ts`
- [x] Custom hooks: `src/hooks/useTeam.ts`, `useStandings.ts`, `useMatches.ts`, `useSession.ts`
- [x] Shared types: `src/types/index.ts`, `api.ts`, `bracket.ts`, `standings.ts`

---

## PHASE 2 — TEAM & PLAYER SYSTEM

### Team API

- [x] `POST /api/teams` — create team (`src/app/api/teams/route.ts`)
- [x] `GET /api/teams` — list teams (with `?search=&region=&seasonId=` query params)
- [x] `GET /api/teams/:teamId` — team profile + roster
- [x] `PATCH /api/teams/:teamId` — update team info (manager)
- [x] `DELETE /api/teams/:teamId` — delete team (admin)
- [x] `GET /api/teams/:teamId/roster` — get roster
- [x] `POST /api/teams/:teamId/roster` — add player to roster
- [x] `DELETE /api/teams/:teamId/roster/:entryId` — remove player from roster
- [x] `POST /api/teams/:teamId/logo` — presigned S3/R2 logo upload

### Player API

- [x] `GET /api/players` — list/search players
- [x] `GET /api/players/:playerId` — player profile + history
- [x] `POST /api/players` — create player profile (one per user)
- [x] `PATCH /api/players/:playerId` — update own player profile

### Team Pages

- [x] Team creation page (`/(dashboard)/team/create`)
- [x] Team management hub (`/(dashboard)/team/[teamId]`)
- [x] Roster management page (`/(dashboard)/team/[teamId]/roster`)
- [x] Team settings page (`/(dashboard)/team/[teamId]/settings`)
- [x] Team season registration page (`/(dashboard)/team/[teamId]/register`)
- [x] Public team profile pages (`/(public)/teams/[teamSlug]`)
- [x] Public teams list page (`/(public)/teams`)

### Team Components

- [x] `TeamCard.tsx`, `TeamLogo.tsx`
- [x] `RosterTable.tsx`
- [x] `TeamRegistrationForm.tsx`, `TeamCreateForm.tsx`

### Dashboard Pages - Comprehensive, detailed, responsive, eye-candy

- [x] Dashboard landing page (`/(dashboard)/dashboard`) — greeting, team summary card, next scheduled match, season registration status
- [x] My Teams list page (`/(dashboard)/team`) — all teams user owns or is an active member of; links to each hub + Create Team CTA
- [x] Player profile page (`/(dashboard)/profile`) — view own player profile + linked accounts status (Epic, Steam, Discord)
- [x] Player profile setup page (`/(dashboard)/profile/setup`) — first-time onboarding flow: create player profile if none exists
- [x] Player profile edit page (`/(dashboard)/profile/edit`) — edit display name, epic/steam/discord usernames, bio

### Dashboard Components

- [x] `PlayerProfileForm.tsx` — create/edit player profile fields (used by setup + edit pages)
- [x] `DashboardTeamCard.tsx` — compact team summary widget (logo, name, division badge, record)
- [x] `OnboardingChecklist.tsx` — progress checklist for new users (no player profile → no team → not registered)

---

## PHASE 3 — SEASONS & REGISTRATION

> One season is active at a time. Each season has three fixed divisions:
> **Premier** (top tier) · **Open Challengers** (upper open) · **Open Contenders** (lower open/entry)

### Season API

- [x] `GET /api/seasons` — list seasons (`src/app/api/seasons/route.ts` — public, filterable by status, includes divisions)
- [x] `POST /api/seasons` — create season
- [x] `GET /api/seasons/:seasonId` — season detail
- [x] `PATCH /api/seasons/:seasonId` — update season (staff)
- [x] `DELETE /api/seasons/:seasonId` — delete season (admin)
- [x] Enforce single ACTIVE season constraint at API level

### Division API

- [x] `GET /api/seasons/:seasonId/divisions` — list divisions
- [x] `POST /api/seasons/:seasonId/divisions` — create division (staff)
- [x] `PATCH /api/seasons/:seasonId/divisions/:id` — update division
- [x] `DELETE /api/seasons/:seasonId/divisions/:id` — delete division
- [x] Auto-create Premier, Open Challengers, Open Contenders on season create
- [x] Division settings (max teams, bracket type per division)

### Registration API

- [x] `GET /api/seasons/:seasonId/registrations` — list registrations (filtered by teamId)
- [x] `POST /api/seasons/:seasonId/registrations` — register team for season (manager picks division)
- [x] `PATCH /api/seasons/:seasonId/registrations/:id` — approve/reject (staff; division already set by manager)
- [x] `DELETE /api/seasons/:seasonId/registrations/:id` — withdraw registration (manager)
- [x] Registration approval queue UI (staff dashboard — approve/reject only)

### League Week API

- [x] `GET /api/seasons/:seasonId/weeks` — list league weeks + match counts
- [x] `GET /api/seasons/:seasonId/weeks/:weekNumber` — week detail + matches
- [x] `POST /api/seasons/:seasonId/weeks/generate` — auto-generate weeks on season publish
- [x] `PATCH /api/seasons/:seasonId/weeks/:weekId` — manually adjust date range

### Season Pages

- [x] Public seasons list page (`/(public)/seasons`)
- [x] Public season overview (`/(public)/seasons/[seasonSlug]`)
- [x] Public standings page per division (`/(public)/seasons/[seasonSlug]/standings`)
- [x] Public match schedule page (`/(public)/seasons/[seasonSlug]/matches`)
- [x] Dashboard standings page (`/(dashboard)/standings`) — standings for the user's active division with H2H column and link to full public standings

### Season Components

- [x] `SeasonCard.tsx`, `SeasonCreateForm.tsx`, `DivisionManager.tsx`

### Season Service

- [x] `src/lib/services/leagueWeek.service.ts` — week generation + completion checks

---

## PHASE 4 — MATCH SYSTEM

### Match API

- [x] `GET /api/matches` — list matches (with `?divisionId=&weekId=&status=&teamId=&upcoming=` filters)
- [x] `GET /api/matches/:matchId` — full match detail (status, timing, checkIns, gameResults, replays)
- [x] `POST /api/matches` — create/schedule match (staff); derives and stores timing timestamps
- [x] `PATCH /api/matches/:matchId` — reschedule match; recalculates derived timestamps
- [x] `DELETE /api/matches/:matchId` — cancel match (status → CANCELLED)

### Check-in API

- [x] `GET /api/matches/:matchId/checkin` — check-in status for both teams
- [x] `POST /api/matches/:matchId/checkin` — team checks in
- [x] `POST /api/matches/:matchId/checkin/override` — staff force check-in a team
- [x] Cron: `SCHEDULED → CHECKING_IN` when `checkInOpenAt` reached
- [x] Cron: resolve check-in deadline → `IN_PROGRESS` / `FORFEITED` / `NO_SHOW`
- [x] Check-in flow UI: "Check In" button on team dashboard

### Replay System

- [x] `GET /api/matches/:matchId/replays` — replay upload slots + parse status
- [x] `POST /api/matches/:matchId/replays` — upload `.replay` file for one game (fileKey from presigned URL)
- [x] `GET /api/matches/:matchId/replays/:gameNumber` — replay detail + parse status
- [x] `DELETE /api/matches/:matchId/replays/:gameNumber` — remove replay (resets slot to manual)
- [x] `GET /api/matches/:matchId/replays/:gameNumber/reparse` — re-trigger parse for failed replay (staff)
- [x] `POST /api/upload/presign` — presigned URL for S3/R2 (`logo | replay | avatar`)
- [x] `POST /api/webhooks/ballchasing` — receive parse result callback + signature verification
- [x] ballchasing.com API client (`src/lib/services/ballchasing.service.ts`)
- [x] Replay service (`src/lib/services/replay.service.ts`): upload → parse → GameResult pipeline
- [x] Parse pipeline: SUCCESS → auto-create `GameResult` (source=`REPLAY_AUTO`) + `ReplayPlayerStat` rows
- [x] Parse pipeline: FAILED → notify team, enable manual entry for that game slot
- [x] MISMATCH detection: parsed scores vs manually entered → auto-DISPUTED
- [x] Dual-upload fast path: both teams uploaded all replays → `COMPLETED` automatically
- [x] Single-upload path: one team uploaded → `VERIFYING` with pre-filled scores
- [x] Cron: poll `PROCESSING` replays; escalate stale `VERIFYING` → `DISPUTED`
- [x] Cron: retry stale `PENDING` replays (handles fire-and-forget failures)
- [x] `GET /api/cron/replays` — cron endpoint for replay poll + PENDING retry

### Score Entry API

- [x] `POST /api/matches/:matchId/result` — manual score submission (manager); only for slots without valid replay
- [x] `POST /api/matches/:matchId/confirm` — opposing team confirms scores (`VERIFYING → COMPLETED` or `DISPUTED`)
- [x] `PATCH /api/matches/:matchId/result` — staff override at any stage; `AuditLog` entry
- [x] `POST /api/matches/:matchId/forfeit` — record forfeit (staff)
- [x] `GET /api/matches/:matchId/timeline` — status history from AuditLog

### Match Services

- [x] `src/lib/services/match.service.ts` — match lifecycle (create, reschedule)
- [x] `src/lib/services/matchStatus.service.ts` — all status transitions + guards
- [x] `src/lib/services/checkin.service.ts` — check-in logic + deadline resolution

### Standings API

- [x] `GET /api/seasons/:seasonId/standings` — all divisions' standings
- [x] `GET /api/divisions/:divisionId/standings` — single division standings
- [x] `POST /api/divisions/:divisionId/standings/recalculate` — force recalculation (staff)
- [x] `PATCH /api/divisions/:divisionId/standings/:entryId` — manual override (staff)
- [x] Auto standings update on `COMPLETED` / `FORFEITED`
- [x] `src/lib/services/standings.service.ts` — recalculate standings
- [x] Head-to-head records (`HeadToHeadRecord`) — updated on every completed match; used as tiebreaker
- [x] H2H-aware standings sort (`sortStandingsWithH2H`) — Points → H2H pts → H2H GD → GD → goal diff → wins

### Disputes API

- [x] `GET /api/disputes` — list all disputes (staff)
- [x] `GET /api/disputes/:disputeId` — dispute detail (staff/manager)
- [x] `POST /api/disputes` — file a dispute (manager)
- [x] `PATCH /api/disputes/:disputeId` — resolve/dismiss dispute (staff)
- [x] Dispute auto-creation on score conflict or MISMATCH

### Match Pages & UI

- [x] Dashboard matches page (`/(dashboard)/dashboard/matches`) — upcoming + recent matches across all of user's teams; check-in CTAs surface here
- [x] Dashboard match detail page (`/(dashboard)/matches/[matchId]`) — status banner, check-in panel, per-game grid, replay upload slots, score entry form
- [x] Match report page (`/(dashboard)/matches/[matchId]/report`) — manual score submission form
- [x] `ReplayUploader.tsx` component — drag-and-drop, progress bar, inline status for all parse states
- [x] `ScoreForm.tsx` (`ResultSubmitForm`) component — per-game score entry with locked replay slots, series preview, staff override
- [x] `CheckInButton.tsx`, `ConfirmButton.tsx` — client-side action components
- [x] Public match list page (`/(public)/matches`)
- [x] Public match detail page (`/matches/[matchId]`) — unified page, works for both auth and public (no redirect)
- [x] `MatchCard.tsx`, `MatchScheduleTable.tsx`, `MatchStatusBadge.tsx`
- [x] Match timeline page (status history from AuditLog — embedded in match detail)

---

## PHASE 5 — STAFF PANEL

> Staff panel lives under `/admin` (accessible to STAFF+). Sidebar says "Staff Panel" for STAFF role.

### Staff Pages

- [x] Staff dashboard (`/admin`) — open disputes + pending registrations + recent match activity
- [x] Disputes queue (`/admin/disputes`) — paginated list of all disputes by status with match context
- [x] Dispute detail (`/admin/disputes/[disputeId]`) — view both teams' submissions, resolve or dismiss
- [x] Match list (`/admin/matches`) — all matches with status/division/week filters
- [x] Match detail/override (`/admin/matches/[matchId]`) — force check-in, score override, forfeit, cancel
- [x] Registrations queue (`/admin/registrations`) — approve or reject pending team registrations (all seasons)
- [x] Standings management (`/admin/standings`) — pick division, view table, recalculate

### Staff Components

- [x] `DisputeCard.tsx` — dispute summary card with match context and inline resolve/dismiss action
- [x] `StaffMatchActions.tsx` — force check-in, override score, forfeit, cancel with confirmation dialogs

---

## PHASE 6 — ADMIN PANEL

### Admin API

- [x] `GET /api/admin/stats` — platform-wide stats dashboard (staff)
- [x] `GET /api/admin/audit` — paginated audit log (admin)
- [x] `GET/PATCH /api/admin/users` — user list + role assignment (`src/app/api/admin/users/route.ts`)
- [x] `PATCH /api/admin/users/:userId/edu-override` — manual edu verification override (staff)

### Admin Pages

- [x] Admin overview dashboard (`/admin`) — stats + recent activity
- [x] Admin seasons list + create (`/admin/seasons`, `/admin/seasons/create`)
- [x] Admin match list (`/admin/matches`) — status/division filters
- [x] Admin match detail/override (`/admin/matches/[matchId]`) — force check-in, score override, forfeit, cancel
- [x] Admin standings (`/admin/standings`) — pick division, view table, recalculate
- [x] Admin registrations queue (`/admin/registrations`) — cross-season pending/waitlisted
- [x] Admin season detail hub (`/admin/seasons/[seasonId]`) — divisions + weeks overview
- [x] Admin teams list + detail (`/admin/teams`, `/admin/teams/[teamId]`)
- [x] User management UI (`/admin/users` — role assignment + edu override)

### Admin Components

- [x] `MatchScheduleForm.tsx` — create/edit match with timing fields

---

## PHASE 7 — POLISH & PRODUCTION

- [x] SEO: metadata, OG images per team/season/bracket
- [x] User profile picture upload (if not registered with Discord)
- [x] Error boundaries and fallback UI (`error.tsx`, `not-found.tsx`)
- [x] Loading skeletons for data-heavy pages
- [ ] Rate limiting on sensitive endpoints (Zod + middleware)
- [ ] Request logging with Pino
- [ ] Email notifications (result submitted, dispute opened, parse failed, toggleable per user)
- [ ] CI/CD pipeline (GitHub Actions → Railway)
- [ ] Monitoring: Sentry + Railway Analytics(?)
- [ ] Redis cache layer: standings cache, rate limit counters

---

## PHASE 8 — FUTURE FEATURES

- [ ] Live match score ticker (WebSocket / Server-Sent Events)
- [ ] Discord bot integration (post results to server)
- [ ] Player stats aggregation across seasons
- [ ] Public API (read-only) for community tools
