# Bot API Plan

> Changes needed on the platform to support the Discord bot.
> All new routes live under `/api/bot/` — separate from the public `/api/v1/` namespace.
> Authenticated via `Authorization: Bearer {BOT_API_KEY}` header.

---

## Table of Contents

1. [Auth Strategy](#auth-strategy)
2. [Missing Cron Route (fix first)](#missing-cron-route-fix-first)
3. [New `/api/bot/` Routes](#new-apibot-routes)
4. [Additions to `/api/v1/`](#additions-to-apiv1)
5. [Outbound Webhooks (platform → bot)](#outbound-webhooks-platform--bot)
6. [Implementation Checklist](#implementation-checklist)

---

## Auth Strategy

Add a new env var `BOT_API_KEY` — a random 64-char hex string. All `/api/bot/` routes validate:

```
Authorization: Bearer {BOT_API_KEY}
```

Create `src/lib/bot-auth.ts`:

```ts
import { NextRequest, NextResponse } from "next/server"

export function requireBotAuth(req: NextRequest): NextResponse | null {
  const auth = req.headers.get("authorization")
  if (!auth || auth !== `Bearer ${process.env.BOT_API_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}
```

This is intentionally separate from session/JWT auth. The bot never has a user session — it's a service account.

---

## Missing Cron Route (fix first)

**The `/api/cron/match-tick` route does not exist.** The handler `src/lib/cron/matchTick.ts` was built but never wired to an HTTP route. Without this, matches never automatically advance state.

### Create `src/app/api/cron/match-tick/route.ts`

```ts
// Identical auth pattern to /api/cron/replays
// Calls the existing matchTick() handler from src/lib/cron/matchTick.ts
// Returns { ok: true, processed: number, durationMs: number }
```

### Railway cron schedule to add

| Endpoint | Schedule | Header |
|---|---|---|
| `GET /api/cron/match-tick` | `* * * * *` (every minute) | `x-cron-secret: {CRON_SECRET}` |
| `GET /api/cron/replays` | `*/5 * * * *` (every 5 min) | `x-cron-secret: {CRON_SECRET}` |

---

## New `/api/bot/` Routes

### Authentication

Every route in this section requires:
```
Authorization: Bearer {BOT_API_KEY}
```
Return `401` if missing or wrong.

---

### `POST /api/bot/matches/:id/checkin-override`

Force check-in a team for a match. Mirrors the existing staff UI action.

**Request body:**
```json
{
  "team": "home" | "away",
  "reason": "string (optional)"
}
```

**Response:**
```json
{ "ok": true, "teamId": "...", "teamName": "Team Alpha" }
```

**Errors:**
- `404` — match not found
- `409` — match not in `CHECKING_IN` state
- `409` — team already checked in

**Implementation:** Reuse logic from `POST /api/matches/:id/checkin/override` — extract into a shared service function callable from both.

---

### `POST /api/bot/matches/:id/forfeit`

Award a forfeit.

**Request body:**
```json
{
  "forfeitingTeam": "home" | "away",
  "reason": "string (required)"
}
```

**Response:**
```json
{
  "ok": true,
  "winnerId": "...",
  "winnerName": "Team Alpha",
  "loserId": "...",
  "loserName": "Team Beta"
}
```

**Errors:**
- `404` — match not found
- `409` — match already completed/cancelled

**Implementation:** Reuse logic from `POST /api/matches/:id/forfeit`.

---

### `PATCH /api/bot/matches/:id/result`

Override match scores (staff score correction).

**Request body:**
```json
{
  "homeScore": 2,
  "awayScore": 1,
  "games": [
    { "gameNumber": 1, "homeGoals": 3, "awayGoals": 2, "overtime": false },
    { "gameNumber": 2, "homeGoals": 1, "awayGoals": 4, "overtime": false },
    { "gameNumber": 3, "homeGoals": 2, "awayGoals": 1, "overtime": true }
  ],
  "reason": "string (required)"
}
```

**Response:**
```json
{
  "ok": true,
  "homeScore": 2,
  "awayScore": 1,
  "winnerId": "...",
  "winnerName": "Team Alpha"
}
```

**Errors:**
- `404` — match not found
- `422` — scores exceed format maximum (BO3 max 2, BO5 max 3)

---

### `PATCH /api/bot/disputes/:id`

Resolve or dismiss a dispute.

**Request body:**
```json
{
  "outcome": "home_wins" | "away_wins" | "dismissed",
  "reason": "string (required)"
}
```

**Response:**
```json
{
  "ok": true,
  "outcome": "home_wins",
  "winnerId": "...",
  "winnerName": "Team Alpha"
}
```

**Errors:**
- `404` — dispute not found
- `409` — dispute already resolved

**Implementation:** Reuse logic from `PATCH /api/disputes/:id`.

---

### `GET /api/bot/disputes`

List disputes (for `/dispute list` command).

**Query params:**
| Param | Type | Default | Description |
|---|---|---|---|
| `status` | string | `open` | `open`, `resolved`, `dismissed` |
| `limit` | int | 25 | Max results |

**Response:**
```json
{
  "disputes": [
    {
      "id": "...",
      "matchId": "...",
      "homeTeam": "Team Alpha",
      "awayTeam": "Team Beta",
      "filedBy": "Team Beta",
      "filedAt": "2026-03-15T20:00:00Z",
      "status": "open",
      "homeTeamScore": { "home": 2, "away": 1 },
      "awayTeamScore": { "home": 1, "away": 2 }
    }
  ],
  "total": 3
}
```

---

### `PATCH /api/bot/registrations/:id`

Approve or reject a season registration.

**Request body:**
```json
{
  "status": "APPROVED" | "REJECTED",
  "note": "string (optional, shown to team on rejection)"
}
```

**Response:**
```json
{
  "ok": true,
  "teamName": "Team Alpha",
  "status": "APPROVED",
  "divisionName": "Open Challengers"
}
```

**Errors:**
- `404` — registration not found
- `409` — registration already processed

**Implementation:** Reuse logic from `PATCH /api/seasons/:id/registrations/:regId`.

---

### `GET /api/bot/registrations`

List registrations (for `/registration list` command).

**Query params:**
| Param | Type | Default | Description |
|---|---|---|---|
| `status` | string | `PENDING` | `PENDING`, `APPROVED`, `REJECTED` |
| `seasonId` | string | active season | Filter by season |

**Response:**
```json
{
  "registrations": [
    {
      "id": "...",
      "teamId": "...",
      "teamName": "Team Alpha",
      "teamSlug": "team-alpha",
      "divisionName": "Open Challengers",
      "rosterSize": 3,
      "status": "PENDING",
      "registeredAt": "2026-03-15T18:00:00Z"
    }
  ],
  "total": 2
}
```

---

### `POST /api/bot/announce`

Store a platform announcement in the database.

**Request body:**
```json
{
  "title": "string",
  "body": "string",
  "postedByDiscordId": "string (Discord user snowflake)",
  "postedByName": "string"
}
```

**Response:**
```json
{ "ok": true, "id": "..." }
```

**Notes:** This just persists the announcement — the bot handles posting to Discord itself. If you later build an announcements page on the website, it reads from this table.

**Schema addition needed:**
```prisma
model Announcement {
  id                String   @id @default(cuid())
  title             String
  body              String
  postedByDiscordId String?
  postedByName      String?
  createdAt         DateTime @default(now())
}
```

---

### `GET /api/bot/stats`

Platform overview stats for `/stats` command.

**Response:**
```json
{
  "totalUsers": 142,
  "totalTeams": 18,
  "activeSeasons": 1,
  "pendingRegistrations": 3,
  "totalMatches": 47,
  "completedMatches": 31,
  "openDisputes": 1
}
```

**Implementation:** Reuse logic from `GET /api/admin/stats`.

---

### `GET /api/bot/matches/:id`

Single match detail (to support `/match <id>` command cleanly).

Currently `/api/v1/matches` only has a paginated list. Add a direct lookup.

**Response:** Full match object with game results, team names, division, week info.

---

## Additions to `/api/v1/`

These are additions to the existing public read-only API — no auth required.

### `GET /api/v1/matches/:id`

Direct match lookup by ID. Currently only `GET /api/v1/matches` (paginated list) exists.

**Response:** Same shape as a single item in the matches list response.

---

### Autocomplete hints in existing routes

The following existing routes should support faster autocomplete by accepting short prefix queries efficiently (they already do via `search` param — just document and ensure indexes exist):

- `GET /api/v1/teams?search=:q` — used by `/team` autocomplete
- `GET /api/v1/players?search=:q` — used by `/player` autocomplete

Ensure Postgres has indexes on `Team.name`, `Player.displayName`, `Player.epicUsername`, `Player.discordUsername` for fast prefix search.

---

## Outbound Webhooks (platform → bot)

The bot can receive push notifications from the platform instead of polling. This makes notifications instant.

### Setup

Add these env vars to the platform:
```env
BOT_WEBHOOK_URL="http://your-bot-railway-url:4000/webhook"
BOT_WEBHOOK_SECRET=""   # shared HMAC secret
```

Create `src/lib/bot-webhook.ts` on the platform:

```ts
// fire-and-forget POST to bot webhook URL
// payload signed with HMAC-SHA256 using BOT_WEBHOOK_SECRET
// bot verifies signature before processing
```

### Events to emit

Wire these into existing platform code (at the point where the action completes):

| Event type | Where to add | Payload |
|---|---|---|
| `match.checkin_opened` | Match cron tick (SCHEDULED → CHECKING_IN) | matchId, homeTeam, awayTeam, scheduledAt, checkInDeadlineAt |
| `match.started` | Match cron tick (CHECKING_IN → IN_PROGRESS) | matchId, homeTeam, awayTeam, format |
| `match.completed` | Result confirm handler | matchId, homeTeam, awayTeam, homeScore, awayScore, winnerId |
| `match.forfeited` | Forfeit handler | matchId, homeTeam, awayTeam, forfeitingTeam, winnerId |
| `dispute.opened` | Dispute create handler | disputeId, matchId, homeTeam, awayTeam, filedBy |
| `dispute.resolved` | Dispute resolve handler | disputeId, matchId, outcome, winnerName, reason |
| `registration.submitted` | Registration create handler | registrationId, teamName, divisionName, seasonName |
| `registration.approved` | Registration approve handler | registrationId, teamName, divisionName |

All webhooks are best-effort (fire-and-forget). If the bot is down, the platform should not fail — log the error and move on.

---

## Implementation Checklist

### Immediate (unblocks match flow today)
- [x] Create `src/app/api/cron/match-tick/route.ts`
- [x] Add match-tick cron job to Railway
- [x] Verify matches advance state automatically in production (200 OK confirmed)

### Bot API Foundation
- [x] Add `BOT_API_KEY` to Railway env vars (generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- [x] Create `src/lib/bot-auth.ts`
- [x] Create `src/app/api/bot/` directory

### Write Routes
- [x] `POST /api/bot/matches/:id/checkin-override`
- [x] `POST /api/bot/matches/:id/forfeit`
- [x] `PATCH /api/bot/matches/:id/result`
- [x] `PATCH /api/bot/disputes/:id`
- [x] `GET /api/bot/disputes`
- [x] `PATCH /api/bot/registrations/:id`
- [x] `GET /api/bot/registrations`
- [x] `POST /api/bot/announce`
- [x] `GET /api/bot/stats`
- [x] `GET /api/bot/matches/:id`

### Schema
- [x] Add `Announcement` model to `prisma/schema.prisma`
- [ ] Run `railway run npx prisma migrate deploy` to apply migration in production
- [x] Add DB indexes for autocomplete search fields (teams.name, players.displayName, players.discordUsername)

### Webhooks
- [ ] Add `BOT_WEBHOOK_URL` and `BOT_WEBHOOK_SECRET` env vars to Railway
- [x] Create `src/lib/bot-webhook.ts`
- [x] Wire `match.checkin_opened` into cron tick
- [x] Wire `match.started` into cron tick
- [x] Wire `match.completed` into confirm handler
- [x] Wire `match.forfeited` into forfeit handler
- [x] Wire `dispute.opened` into dispute create handler
- [x] Wire `dispute.resolved` into dispute resolve handler
- [x] Wire `registration.submitted` into registration handler
- [x] Wire `registration.approved` into registration approve handler

### v1 API
- [x] Add `GET /api/v1/matches/:id` direct match lookup
- [x] Verify search indexes exist for player/team autocomplete
