# Discord Bot — Development Checklist

Based on `DISCORD_BOT_ARCHITECTURE.md`

Legend: `[x]` = done · `[~]` = partial · `[ ]` = not started

---

## PHASE 1 — PROJECT SETUP

### Scaffold

- [ ] Initialize `c3-discord-bot/` as a separate Node.js project (TypeScript, `tsconfig.json`)
- [ ] Install core dependencies: `discord.js@14`, `@prisma/client`, `zod`, `express` or `hono`
- [ ] Install dev dependencies: `tsx`, `typescript`, `@types/node`
- [ ] Configure `tsconfig.json` (ESM output, strict mode, path aliases)
- [ ] Set up `.env` with all required variables (see architecture doc)
- [ ] Add `c3-discord-bot/` to the Docker Compose stack (`docker-compose.yml`)
- [ ] Write `Dockerfile` for the bot service (multi-stage, non-root user)

### Database

- [ ] Add `GuildConfig` model to platform Prisma schema
- [ ] Add `Ticket`, `TicketCategory`, `TicketStatus` enum models to platform Prisma schema
- [ ] Add `GuildConfig` relation to `Team` model
- [ ] Run migration: `prisma migrate dev --name add_guild_config_and_tickets`
- [ ] Regenerate Prisma client (`prisma generate`)
- [ ] Verify bot service can connect to shared DB

### Bot Client

- [ ] Create `src/client.ts` — discord.js `Client` singleton with required intents (`Guilds`, `GuildMessages`, `MessageContent`)
- [ ] Create `src/index.ts` — entry point: load commands, attach event handlers, login
- [ ] Register slash commands globally (production) and guild-scoped (development)
- [ ] `ready` event handler — log startup info, confirm command sync
- [ ] `guildCreate` event — DM server admin with setup instructions on bot join
- [ ] `interactionCreate` router — dispatches slash commands and button interactions

---

## PHASE 2 — WEBHOOK RECEIVER

- [ ] Create internal HTTP server (`src/webhook/server.ts`) on `BOT_WEBHOOK_PORT`
- [ ] HMAC-SHA256 signature verification middleware (`src/webhook/verify.ts`)
- [ ] Reject requests with missing or invalid `X-Bot-Signature` header (401)
- [ ] Route handler for `match.*` events → `src/webhook/handlers/match.ts`
- [ ] Route handler for `registration.*` events → `src/webhook/handlers/registration.ts`
- [ ] Route handler for `season.*` events → `src/webhook/handlers/season.ts`
- [ ] Add `POST /api/webhooks/bot` to the Next.js platform that signs and fires events
- [ ] Wire all platform event triggers to the new webhook endpoint:
  - [ ] Match scheduled/rescheduled
  - [ ] Check-in window opens (cron)
  - [ ] Match completed
  - [ ] Match disputed (auto-detected score conflict)
  - [ ] Match forfeited
  - [ ] Registration approved
  - [ ] Registration rejected
  - [ ] Registration waitlisted
  - [ ] Season status → REGISTRATION
  - [ ] Season status → ACTIVE

---

## PHASE 3 — GUILD CONFIG

- [ ] `/register-channel` slash command
  - [ ] Subcommand: `match-results` — set match result notification channel
  - [ ] Subcommand: `schedule` — set schedule/check-in channel
  - [ ] Subcommand: `announcements` — set season announcements channel
  - [ ] Subcommand: `disputes` — set dispute notification channel (staff server only)
  - [ ] Subcommand: `tickets` — set ticket creation channel (staff server only)
  - [ ] Persists to `GuildConfig` in DB
  - [ ] Confirmation embed on success
- [ ] `/setup` staff command — interactive setup wizard (walks through all channels at once)
- [ ] Helper: `src/lib/guildConfig.ts` — typed read/write for `GuildConfig`
- [ ] Helper: `src/lib/resolveChannels.ts` — resolve target channels for a notification given match teams

---

## PHASE 4 — NOTIFICATION EMBEDS

### Embed Infrastructure

- [ ] `src/lib/embeds.ts` — shared colors, footer builder, error embed, success embed
- [ ] `src/lib/formatters.ts` — score formatter, date/time with timezone, tier label, status badge text

### Match Notifications

- [ ] `match.scheduled` embed — teams, date/time, division, "Add to Calendar" link button
- [ ] `match.checkin_open` embed — teams, countdown, **"✅ Check In"** button component
- [ ] `match.result` embed — final score, per-game breakdown, replay source indicators, win/loss color
- [ ] `match.disputed` embed — both teams' submitted scores side-by-side, conflict highlighted, "Open Ticket" button
- [ ] `match.forfeited` embed — forfeiting team, reason, week affected

### Registration Notifications

- [ ] `registration.approved` embed — team name, division assigned, season name, "View on Site" button
- [ ] `registration.rejected` embed — team name, staff notes (if any), "Contact Staff" button
- [ ] `registration.waitlisted` embed — position info, next steps

### Season Notifications

- [ ] `season.open` embed — season name, registration window dates, division list, "Register Now" button
- [ ] `season.start` embed — season name, first week dates, division matchup preview
- [ ] `season.announcement` embed — custom title + body from staff `/announce` command

### Dispute Notifications

- [ ] `match.disputed` fires notification to staff `#disputes` channel
- [ ] Embed includes both score submissions, match link, "Open Ticket" button that auto-creates a `score-dispute` ticket

---

## PHASE 5 — SLASH COMMANDS (READ)

### `/standings [division]`

- [ ] Reads `StandingEntry` records from DB for the active season
- [ ] Formats as embed fields: rank, team, W/L, GW/GL, points
- [ ] Division filter: `premier | challengers | contenders` (optional, defaults to all)
- [ ] Shows "No active season" embed if no ACTIVE/PLAYOFFS season found
- [ ] "View Full Standings" button → platform standings page

### `/schedule [week]`

- [ ] Reads `Match` + `LeagueWeek` from DB for active season
- [ ] Defaults to current week (or next upcoming week if between weeks)
- [ ] Shows home vs away, scheduled time, match status badge
- [ ] "View on Site →" button per match row
- [ ] Previous/Next week pagination buttons

### `/match <matchId>`

- [ ] Reads full match detail from DB (teams, games, replays, result)
- [ ] Shows: status, scheduled time, per-game scores, replay verification status
- [ ] "View on Site" button

### `/team <name>`

- [ ] Autocomplete against team names in DB as user types
- [ ] Shows: team name (colored bar), division, W/L record, active roster (display names), captain
- [ ] "View Team Profile" button → public team page

### `/ping`

- [ ] Returns discord.js WebSocket latency
- [ ] Returns DB round-trip latency (simple `prisma.$queryRaw`)
- [ ] Returns bot uptime

---

## PHASE 6 — TICKET SYSTEM

### Infrastructure

- [ ] `src/commands/ticket.ts` — command group with `open`, `close`, `list` subcommands
- [ ] `src/lib/tickets.ts` — create/close/find ticket helpers (DB + Discord thread)

### `/ticket open <category> [description]`

- [ ] Category choices: `support | roster-appeal | score-dispute | ban-appeal`
- [ ] Creates private thread in the configured `#tickets` channel (staff server)
- [ ] Inserts `Ticket` row in DB with `threadId`, `openedBy`, `category`, `status: OPEN`
- [ ] Posts opening embed in thread: opener's Discord tag, category, description, timestamp
- [ ] Pings `@Staff` role in thread
- [ ] If category is `score-dispute`: prompts for match ID and pre-links to the match

### `/ticket close [reason]`

- [ ] Only usable inside an active ticket thread
- [ ] Updates DB: `status: CLOSED`, `closedAt`, `closedBy`
- [ ] Posts closing embed in thread with reason
- [ ] Archives the thread after a 10-minute delay

### `/ticket list [status]`

- [ ] Staff-only (permission check)
- [ ] Lists tickets filtered by status (default: `open`)
- [ ] Paginated embed: ticket ID, category, opener, opened date, "Jump →" button
- [ ] Status filter choices: `open | in-progress | resolved | closed | all`

### `/ticket claim`

- [ ] Staff-only — marks ticket `IN_PROGRESS`, assigns to the claiming staff member
- [ ] Updates embed in thread to show assigned staff

### `/ticket resolve [reason]`

- [ ] Staff-only — marks ticket `RESOLVED`
- [ ] Posts resolution embed, archives thread

---

## PHASE 7 — DISPUTE SYSTEM

### Viewing

- [ ] `/disputes [status]` — staff-only paginated embed of all disputes from DB
  - [ ] Shows: match, teams, filed by, status, date
  - [ ] "View Dispute →" button links to platform dispute detail page
  - [ ] Status filter: `open | all | resolved`
  - [ ] Previous/Next page buttons

- [ ] `/dispute view <matchId>` — anyone can see dispute status for a match
  - [ ] Shows: both teams' submitted scores, conflict summary, current status
  - [ ] "View on Site" button

### Filing

- [ ] `/dispute file <matchId> [reason]`
  - [ ] Validates the user's linked player is on one of the match's teams
  - [ ] Calls `POST /api/disputes` on the platform (service token)
  - [ ] Auto-opens a `score-dispute` ticket thread with match pre-linked
  - [ ] Posts confirmation embed with dispute ID and next steps

### Auto-Dispute Flow

- [ ] When `match.disputed` webhook fires, bot posts to `#disputes` (staff server)
- [ ] "Open Ticket" button in the embed auto-creates a `score-dispute` ticket, pulling both team managers in (if their Discord accounts are linked)

---

## PHASE 8 — INTERACTIVE CHECK-IN

- [ ] Check-in button handler (`interactionCreate` → button ID `checkin:<matchId>`)
- [ ] Look up Discord user → linked Player (via `Player.discordUsername` or future Discord OAuth)
- [ ] Verify the player is on one of the match's teams
- [ ] Call `POST /api/matches/:matchId/checkin` on the platform (service token)
- [ ] Update the original check-in embed to reflect which teams have checked in
- [ ] Lock button after both teams check in; update with ✅ confirmed message

---

## PHASE 9 — STAFF TOOLS

- [ ] `/announce <message> [division]` — staff-only broadcast
  - [ ] Fires `season.announcement` event to all linked servers (or division-specific servers)
  - [ ] Requires `STAFF` role on the bot (checked via platform service token user lookup)
- [ ] `/admin sync-commands` — re-register slash commands (useful after updates)
- [ ] `/admin guilds` — list all servers the bot is in, their config status
- [ ] `/admin unlink <guildId>` — remove a guild's config (bot removed from server)

---

## PHASE 10 — POLISH & RELIABILITY

- [ ] Global error handler for uncaught exceptions and unhandled rejections (log + alert staff channel)
- [ ] Per-interaction error boundary — catch errors in command handlers, reply with generic error embed instead of crashing
- [ ] Rate limit handling — exponential backoff on Discord API 429 responses
- [ ] Webhook retry queue — if Discord send fails, retry up to 3 times with backoff
- [ ] Pino logging: structured JSON logs, log level from `LOG_LEVEL` env var
- [ ] Health check endpoint on webhook server (`GET /health` → 200 OK + uptime JSON)
- [ ] Graceful shutdown — `SIGTERM` handler flushes queue and disconnects cleanly
- [ ] Bot status presence — rotating status messages: "Watching C3 Season X", "Tracking N matches"
- [ ] Unit tests for embed formatters and webhook payload parsing
- [ ] Integration test: full match-result notification pipeline (mock Discord, real DB)

---

## DEPENDENCY SUMMARY

```
discord.js@14
@prisma/client
zod
hono                  # lightweight webhook HTTP server
pino                  # structured logging
pino-pretty           # dev log formatter
tsx                   # TS execution for dev
typescript
@types/node
```

---

## NOTES

- The bot service must **never** be exposed to the public internet. The webhook receiver (`BOT_WEBHOOK_PORT`) is internal-only (Docker network).
- All platform → bot calls are HMAC-signed. Reject any unsigned request immediately.
- Discord user identity (for check-in, ticket ownership, dispute filing) resolves through `Player.discordUsername`. A future improvement is full Discord OAuth linking so the bot can resolve by Discord user ID instead of username string.
- Keep the bot single-instance. Discord gateway connections are not horizontally scalable without a sharding manager; at C3's scale this is not needed.
