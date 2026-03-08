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
- [x] Seed script (`prisma/seed.ts` — admin user, demo teams, demo season)
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
- [ ] `GET /api/teams/:teamId` — team profile + roster
- [ ] `PATCH /api/teams/:teamId` — update team info (manager)
- [ ] `DELETE /api/teams/:teamId` — delete team (admin)
- [ ] `GET /api/teams/:teamId/roster` — get roster
- [ ] `POST /api/teams/:teamId/roster` — add player to roster
- [ ] `DELETE /api/teams/:teamId/roster/:entryId` — remove player from roster
- [ ] `POST /api/teams/:teamId/logo` — presigned S3/R2 logo upload

### Player API

- [ ] `GET /api/players` — list/search players
- [ ] `GET /api/players/:playerId` — player profile + history
- [ ] `POST /api/players` — create player profile (one per user)
- [ ] `PATCH /api/players/:playerId` — update own player profile

### Team Pages

- [ ] Team creation page (`/(dashboard)/team/create`)
- [ ] Team management hub (`/(dashboard)/team/[teamId]`)
- [ ] Roster management page (`/(dashboard)/team/[teamId]/roster`)
- [ ] Team settings page (`/(dashboard)/team/[teamId]/settings`)
- [ ] Team season registration page (`/(dashboard)/team/[teamId]/register`)
- [ ] Public team profile pages (`/(public)/teams/[teamSlug]`)
- [ ] Public teams list page (`/(public)/teams`)

### Team Components

- [ ] `TeamCard.tsx`, `TeamLogo.tsx`
- [ ] `RosterTable.tsx`
- [ ] `TeamRegistrationForm.tsx`, `TeamCreateForm.tsx`

---

## PHASE 3 — SEASONS & REGISTRATION

> One season is active at a time. Each season has three fixed divisions:
> **Premier** (top tier) · **Open Challengers** (upper open) · **Open Contenders** (lower open/entry)

### Season API

- [~] `GET /api/seasons` — list seasons (`src/app/api/staff/seasons/route.ts` — needs migration to `/api/seasons`)
- [~] `POST /api/seasons` — create season
- [ ] `GET /api/seasons/:seasonId` — season detail
- [ ] `PATCH /api/seasons/:seasonId` — update season (staff)
- [ ] `DELETE /api/seasons/:seasonId` — delete season (admin)
- [ ] Enforce single ACTIVE season constraint at API level

### Division API

- [ ] `GET /api/seasons/:seasonId/divisions` — list divisions
- [ ] `POST /api/seasons/:seasonId/divisions` — create division (staff)
- [ ] `PATCH /api/seasons/:seasonId/divisions/:id` — update division
- [ ] `DELETE /api/seasons/:seasonId/divisions/:id` — delete division
- [ ] Auto-create Premier, Open Challengers, Open Contenders on season create
- [ ] Division settings (max teams, bracket type per division)

### Registration API

- [ ] `GET /api/seasons/:seasonId/registrations` — list registrations (staff)
- [ ] `POST /api/seasons/:seasonId/registrations` — register team for season (manager)
- [ ] `PATCH /api/seasons/:seasonId/registrations/:id` — approve/reject/assign division (staff)
- [ ] `DELETE /api/seasons/:seasonId/registrations/:id` — withdraw registration (manager)
- [ ] Registration approval queue UI (staff dashboard — assign team to division)

### League Week API

- [ ] `GET /api/seasons/:seasonId/weeks` — list league weeks + match counts
- [ ] `GET /api/seasons/:seasonId/weeks/:weekNumber` — week detail + matches
- [ ] `POST /api/seasons/:seasonId/weeks/generate` — auto-generate weeks on season publish
- [ ] `PATCH /api/seasons/:seasonId/weeks/:weekId` — manually adjust date range

### Season Pages

- [ ] Public seasons list page (`/(public)/seasons`)
- [ ] Public season overview (`/(public)/seasons/[seasonSlug]`)
- [ ] Public standings page per division (`/(public)/seasons/[seasonSlug]/standings`)
- [ ] Public match schedule page (`/(public)/seasons/[seasonSlug]/matches`)

### Season Components

- [ ] `SeasonCard.tsx`, `SeasonCreateForm.tsx`, `DivisionManager.tsx`

### Season Service

- [ ] `src/lib/services/leagueWeek.service.ts` — week generation + completion checks

---

## PHASE 4 — MATCH SYSTEM

### Match API

- [ ] `GET /api/matches` — list matches (with `?divisionId=&weekId=&status=&teamId=&upcoming=` filters)
- [ ] `GET /api/matches/:matchId` — full match detail (status, timing, checkIns, gameResults, replays)
- [ ] `POST /api/matches` — create/schedule match (staff); derives and stores timing timestamps
- [ ] `PATCH /api/matches/:matchId` — reschedule match; recalculates derived timestamps
- [ ] `DELETE /api/matches/:matchId` — cancel match (status → CANCELLED)

### Check-in API

- [ ] `GET /api/matches/:matchId/checkin` — check-in status for both teams
- [ ] `POST /api/matches/:matchId/checkin` — team checks in
- [ ] `POST /api/matches/:matchId/checkin/override` — staff force check-in a team
- [ ] Cron: `SCHEDULED → CHECKING_IN` when `checkInOpenAt` reached
- [ ] Cron: resolve check-in deadline → `IN_PROGRESS` / `FORFEITED` / `NO_SHOW`
- [ ] Check-in flow UI: "Check In" button on team dashboard

### Replay System

- [ ] `GET /api/matches/:matchId/replays` — replay upload slots + parse status
- [ ] `POST /api/matches/:matchId/replays` — upload `.replay` file for one game (fileKey from presigned URL)
- [ ] `GET /api/matches/:matchId/replays/:gameNumber` — replay detail + parse status
- [ ] `DELETE /api/matches/:matchId/replays/:gameNumber` — remove replay (resets slot to manual)
- [ ] `GET /api/matches/:matchId/replays/:gameNumber/reparse` — re-trigger parse for failed replay (staff)
- [ ] `POST /api/upload/presign` — presigned URL for S3/R2 (`logo | replay | avatar`)
- [ ] `POST /api/webhooks/ballchasing` — receive parse result callback + signature verification
- [ ] ballchasing.com API client (`src/lib/services/ballchasing.service.ts`)
- [ ] Replay service (`src/lib/services/replay.service.ts`): upload → parse → GameResult pipeline
- [ ] Parse pipeline: SUCCESS → auto-create `GameResult` (source=`REPLAY_AUTO`) + `ReplayPlayerStat` rows
- [ ] Parse pipeline: FAILED → notify team, enable manual entry for that game slot
- [ ] MISMATCH detection: parsed scores vs manually entered → auto-DISPUTED
- [ ] Dual-upload fast path: both teams uploaded all replays → `COMPLETED` automatically
- [ ] Single-upload path: one team uploaded → `VERIFYING` with pre-filled scores
- [ ] Cron: poll `PROCESSING` replays; escalate stale `VERIFYING` → `DISPUTED`

### Score Entry API

- [ ] `POST /api/matches/:matchId/result` — manual score submission (manager); only for slots without valid replay
- [ ] `POST /api/matches/:matchId/confirm` — opposing team confirms scores (`VERIFYING → COMPLETED` or `DISPUTED`)
- [ ] `PATCH /api/matches/:matchId/result` — staff override at any stage; `AuditLog` entry
- [ ] `POST /api/matches/:matchId/forfeit` — record forfeit (staff)
- [ ] `GET /api/matches/:matchId/timeline` — status history from AuditLog

### Match Services

- [ ] `src/lib/services/match.service.ts` — match lifecycle (create, reschedule)
- [ ] `src/lib/services/matchStatus.service.ts` — all status transitions + guards
- [ ] `src/lib/services/checkin.service.ts` — check-in logic + deadline resolution

### Standings API

- [ ] `GET /api/seasons/:seasonId/standings` — all divisions' standings
- [ ] `GET /api/divisions/:divisionId/standings` — single division standings
- [ ] `POST /api/divisions/:divisionId/standings/recalculate` — force recalculation (staff)
- [ ] `PATCH /api/divisions/:divisionId/standings/:entryId` — manual override (staff)
- [ ] Auto standings update on `COMPLETED` / `FORFEITED`
- [ ] `src/lib/services/standings.service.ts` — recalculate standings

### Disputes API

- [ ] `GET /api/disputes` — list all disputes (staff)
- [ ] `GET /api/disputes/:disputeId` — dispute detail (staff/manager)
- [ ] `POST /api/disputes` — file a dispute (manager)
- [ ] `PATCH /api/disputes/:disputeId` — resolve/dismiss dispute (staff)
- [ ] Dispute auto-creation on score conflict or MISMATCH

### Match Pages & UI

- [ ] Match report page (`/(dashboard)/matches/[matchId]/report`)
- [ ] Public match list page (`/(public)/matches`)
- [ ] Public match detail page (`/(public)/matches/[matchId]`)
- [ ] Match page UX: per-game grid with replay status indicators
- [ ] `ReplayUploader.tsx` component
- [ ] `ResultSubmitForm.tsx` component
- [ ] `MatchCard.tsx`, `MatchScheduleTable.tsx`, `MatchStatusBadge.tsx`
- [ ] Match timeline page (status history from AuditLog)

---

## PHASE 5 — BRACKETS

### Bracket API

- [ ] `GET /api/divisions/:divisionId/bracket` — bracket structure + results
- [ ] `POST /api/divisions/:divisionId/bracket/generate` — generate bracket (staff)
- [ ] `DELETE /api/divisions/:divisionId/bracket` — reset bracket (admin)

### Bracket Services

- [ ] `src/lib/services/bracket.service.ts` — bracket generation orchestration
- [ ] `src/lib/services/swiss.service.ts` — Swiss pairing algorithm + round advancement
- [ ] `src/lib/services/gsl.service.ts` — GSL group stage logic
- [ ] `src/lib/services/elimination.service.ts` — Double Elimination seeding + advancement

### Bracket Pages & Components

- [ ] Public bracket page (`/(public)/seasons/[seasonSlug]/brackets`)
- [ ] `BracketViewer.tsx` — visual bracket tree
- [ ] `DoubleElimBracket.tsx`, `SwissBracket.tsx`, `GSLBracket.tsx`
- [ ] Auto match creation on bracket advancement

---

## PHASE 6 — ADMIN PANEL

### Admin API

- [ ] `GET /api/admin/stats` — platform-wide stats dashboard (staff)
- [ ] `GET /api/admin/audit` — paginated audit log (admin)
- [~] `GET/PATCH /api/admin/users` — user management (`src/app/api/admin/users/route.ts`)
- [ ] `PATCH /api/users/:userId/role` — assign role to user (admin)

### Admin Pages

- [ ] Admin overview dashboard (`/admin`) — stats + recent activity
- [ ] Admin seasons list + create (`/admin/seasons`, `/admin/seasons/create`)
- [ ] Admin season detail + divisions (`/admin/seasons/[seasonId]`)
- [ ] Admin teams list + detail (`/admin/teams`, `/admin/teams/[teamId]`)
- [ ] Admin match scheduler + create (`/admin/matches`, `/admin/matches/create`)
- [ ] Admin match detail/override (`/admin/matches/[matchId]`)
- [ ] Admin bracket manager (`/admin/brackets/[seasonId]`)
- [ ] Admin standings override (`/admin/standings/[seasonId]`)
- [ ] Admin disputes queue + resolve (`/admin/disputes`, `/admin/disputes/[disputeId]`)
- [ ] User management UI (`/admin/users` — role assignment)

### Admin Components

- [ ] `DisputeCard.tsx`, `StandingsOverrideForm.tsx`, `MatchScheduleForm.tsx`

---

## PHASE 7 — POLISH & PRODUCTION

- [ ] SEO: metadata, OG images per team/season/bracket
- [ ] Error boundaries and fallback UI (`error.tsx`, `not-found.tsx`)
- [ ] Loading skeletons for data-heavy pages
- [ ] Rate limiting on sensitive endpoints (Zod + middleware)
- [ ] Request logging with Pino
- [ ] Email notifications (result submitted, dispute opened, parse failed)
- [ ] CI/CD pipeline (GitHub Actions → Vercel)
- [ ] Monitoring: Sentry + Vercel Analytics
- [ ] Redis cache layer: standings cache, rate limit counters

---

## PHASE 8 — FUTURE FEATURES

- [ ] Live match score ticker (WebSocket / Server-Sent Events)
- [ ] Discord bot integration (post results to server)
- [ ] Player stats aggregation across seasons
- [ ] Season-end awards (MVP, Top Scorer)
- [ ] Multi-region support
- [ ] Public API (read-only) for community tools
