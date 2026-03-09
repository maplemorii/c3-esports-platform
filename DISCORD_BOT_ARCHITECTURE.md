# Discord Bot Architecture — C3 Esports

## Overview

The C3 Esports Discord bot serves as the real-time communication layer between the platform and team Discord servers. It posts automated notifications for match events, registration decisions, and standings updates, and provides slash commands for players and staff to query platform data without leaving Discord.

The bot is a standalone Node.js service (separate from the Next.js app) that connects to the same PostgreSQL database and communicates with the platform over an internal webhook API.

---

## Architecture Diagram

```
┌─────────────────────────────┐
│       Next.js Platform      │
│  (API routes / server actions)│
│                             │
│  POST /api/webhooks/bot  ───┼──────────────────────────────┐
│  (internal, HMAC-signed)    │                              │
└─────────────────────────────┘                              │
             │                                               ▼
             │ Prisma (direct DB access)        ┌────────────────────────┐
             │                                  │   Discord Bot Service  │
             ▼                                  │   (discord.js v14)     │
┌─────────────────────────────┐                 │                        │
│       PostgreSQL DB         │◄────────────────│  Reads DB directly     │
│  (shared with platform)     │                 │  for slash commands    │
└─────────────────────────────┘                 │                        │
                                                │  Writes: guild configs │
                                                └────────────────────────┘
                                                             │
                                              ┌──────────────┴──────────────┐
                                              ▼                             ▼
                                   ┌─────────────────┐           ┌──────────────────┐
                                   │  Team Discord   │           │  Staff Discord   │
                                   │  Servers        │           │  Server          │
                                   │  (team notifs)  │           │  (admin notifs)  │
                                   └─────────────────┘           └──────────────────┘
```

---

## Project Structure

```
c3-discord-bot/
├── src/
│   ├── index.ts                  # Entry point — login, register commands, attach handlers
│   ├── client.ts                 # discord.js Client singleton
│   ├── prisma.ts                 # Prisma client (shared DB)
│   │
│   ├── commands/                 # Slash command definitions + handlers
│   │   ├── index.ts              # Command registry (auto-loads all commands)
│   │   ├── standings.ts          # /standings [division]
│   │   ├── schedule.ts           # /schedule [week]
│   │   ├── match.ts              # /match <matchId>
│   │   ├── team.ts               # /team <name>
│   │   ├── register-channel.ts   # /register-channel (admin) — sets notification channel
│   │   ├── ticket.ts             # /ticket open|close|list
│   │   ├── dispute.ts            # /dispute file|view
│   │   ├── disputes.ts           # /disputes [status] — staff list
│   │   └── ping.ts               # /ping — health check
│   │
│   ├── events/                   # discord.js event handlers
│   │   ├── ready.ts              # Client ready — log in, sync guild configs
│   │   ├── interactionCreate.ts  # Route slash commands and button interactions
│   │   └── guildCreate.ts        # Bot added to new server — prompt setup
│   │
│   ├── notifications/            # Embed builders for each event type
│   │   ├── matchScheduled.ts
│   │   ├── matchResult.ts
│   │   ├── matchDispute.ts
│   │   ├── checkInOpen.ts
│   │   ├── registrationApproved.ts
│   │   ├── registrationRejected.ts
│   │   └── seasonAnnouncement.ts
│   │
│   ├── webhook/                  # Internal HTTP server for platform → bot pushes
│   │   ├── server.ts             # Tiny Express/Hono server on port 3001
│   │   ├── verify.ts             # HMAC-SHA256 signature verification
│   │   └── handlers/
│   │       ├── match.ts
│   │       ├── registration.ts
│   │       └── season.ts
│   │
│   ├── lib/
│   │   ├── embeds.ts             # Shared embed styling (colors, footer, logo)
│   │   ├── guildConfig.ts        # Read/write GuildConfig from DB
│   │   └── formatters.ts         # Date/time, score, tier formatters for Discord
│   │
│   └── types.ts                  # Shared types (WebhookPayload, etc.)
│
├── prisma/                       # Symlink or copy of platform schema (read-only access)
├── .env                          # DISCORD_TOKEN, DISCORD_CLIENT_ID, BOT_WEBHOOK_SECRET, DATABASE_URL
├── package.json
└── tsconfig.json
```

---

## Database Model — GuildConfig

Add to the platform's Prisma schema to persist per-server bot configuration:

```prisma
model GuildConfig {
  id                String   @id @default(cuid())
  guildId           String   @unique             // Discord server ID
  teamId            String?                      // Linked C3 team (null = staff server)
  notifChannelId    String?                      // #match-results channel
  scheduleChannelId String?                      // #schedule channel
  announcementChannelId String?                  // #announcements channel
  timezone          String   @default("America/New_York")
  enabled           Boolean  @default(true)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  team              Team?    @relation(fields: [teamId], references: [id])

  @@map("guild_configs")
}
```

Also add to Team model:
```prisma
guildConfig       GuildConfig?
```

---

## Notification Events

The platform fires these events by calling `POST /api/webhooks/bot` (internal, signed with `BOT_WEBHOOK_SECRET`):

| Event Type              | Trigger                                         | Target                         |
|-------------------------|-------------------------------------------------|--------------------------------|
| `match.scheduled`       | Match created/rescheduled by staff              | Both team servers              |
| `match.checkin_open`    | Check-in window opens (cron)                    | Both team servers              |
| `match.result`          | Match marked COMPLETED                          | Both team servers + staff      |
| `match.disputed`        | Score conflict auto-detected                    | Both team servers + staff      |
| `match.forfeited`       | Match forfeited (no-show or forfeit submit)     | Both team servers + staff      |
| `registration.approved` | Staff approves a team registration              | Team server                    |
| `registration.rejected` | Staff rejects a team registration               | Team server                    |
| `registration.waitlisted` | Team placed on waitlist                       | Team server                    |
| `season.open`           | Season status → REGISTRATION                    | All linked servers             |
| `season.start`          | Season status → ACTIVE                          | All linked servers             |
| `season.announcement`   | Staff broadcasts a message to all servers       | All linked servers             |

### Webhook Payload Shape

```ts
interface BotWebhookPayload {
  event:     string           // e.g. "match.result"
  timestamp: string           // ISO 8601
  data:      Record<string, unknown>
}
```

HMAC-SHA256 signature sent in `X-Bot-Signature` header using `BOT_WEBHOOK_SECRET`.

---

## Slash Commands

### `/standings [division]`
Shows the current division standings table as a Discord embed.
- Default: shows all three divisions in one embed with fields
- Optional `division` choice: `premier | challengers | contenders`
- Reads directly from DB (`StandingEntry` table)

### `/schedule [week]`
Lists upcoming or current-week matches.
- Default: current active week
- Shows: home vs away, scheduled time (in server timezone), status badge
- Buttons: "View on site →" deep link per match

### `/match <matchId>`
Full match detail embed: teams, scores per game, replay status, result source.

### `/team <name>`
Team profile embed: logo color bar, division, record, roster list (display names only).

### `/register-channel`
Admin-only command. Sets the current channel as the notification target for a given event type:
```
/register-channel type:match-results
/register-channel type:schedule
/register-channel type:announcements
```
Writes to `GuildConfig` in DB.

### `/ping`
Returns bot latency and DB ping. Used for health checks.

---

## Ticket System

Players and team managers can open support tickets directly in Discord. Each ticket becomes a **private thread** in the staff server's `#tickets` channel, visible only to the opener and staff.

### Ticket Categories

| Category        | Who Can Open  | Use Case                                             |
|-----------------|---------------|------------------------------------------------------|
| `support`       | Anyone        | General questions, account issues, rule clarifications |
| `roster-appeal` | Team manager  | Appeal a roster decision or request an exception     |
| `score-dispute` | Team manager  | Manually file a score dispute for a specific match   |
| `ban-appeal`    | Any user      | Appeal a ban or suspension                           |

### `/ticket open <category> [description]`
Opens a new ticket:
1. Creates a private thread in the staff server's `#tickets` channel
2. Inserts a `Ticket` record in the DB (status = `OPEN`)
3. Posts an embed in the thread with the opener's info, category, and description
4. Pings the `@Staff` role in the thread

### `/ticket close [reason]`
Closes the current ticket thread (staff or opener):
1. Updates DB status → `CLOSED`, records `closedAt` + `closedBy`
2. Posts a closing embed in the thread
3. Archives the thread after 10 minutes

### `/ticket list [status]`
Staff-only. Lists open (or filtered) tickets as a paginated embed with buttons to jump to each thread.

### Ticket DB Model

```prisma
model Ticket {
  id          String       @id @default(cuid())
  guildId     String                          // Discord server where it was opened
  threadId    String       @unique            // Discord thread ID
  openedBy    String                          // Discord user ID
  category    TicketCategory
  description String?      @db.Text
  status      TicketStatus @default(OPEN)
  closedAt    DateTime?
  closedBy    String?                         // Discord user ID of closer

  // Optional link to a platform entity
  matchId     String?
  teamId      String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([status])
  @@index([guildId, status])
  @@map("tickets")
}

enum TicketCategory {
  SUPPORT
  ROSTER_APPEAL
  SCORE_DISPUTE
  BAN_APPEAL
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}
```

---

## Dispute System

### Viewing Disputes

#### `/disputes [status]`
Staff-only slash command. Shows a paginated embed of all open disputes:
- Match ID, teams, filed by, date, status
- Each row has a "View →" button linking to the platform dispute detail page
- Filter choices: `open | all | resolved`

#### Dispute Notifications
When `match.disputed` fires, the bot posts a detailed embed in the staff server's `#disputes` channel:

```
┌─────────────────────────────────────────────┐
│  ⚠️  Score Dispute — Week 3, Premier        │
├─────────────────────────────────────────────┤
│  Storm FC  vs  Team Liquid                  │
│                                             │
│  Reported scores:                           │
│  Storm FC submitted:   2 – 1               │
│  Team Liquid submitted: 1 – 2              │
│                                             │
│  [View Dispute]  [Open Ticket]             │
├─────────────────────────────────────────────┤
│  C3 Esports · auto-detected conflict        │
└─────────────────────────────────────────────┘
```

The **"Open Ticket"** button auto-creates a `score-dispute` ticket thread pre-filled with the match ID, pulling both teams' managers into the thread.

### Filing a Dispute via Discord

#### `/dispute file <matchId> [reason]`
Team manager command (only usable if their team is in the match):
1. Validates they have a pending/active match with that ID
2. Calls `POST /api/disputes` on the platform
3. Opens a `score-dispute` ticket thread automatically
4. Posts confirmation embed

#### `/dispute view <matchId>`
Anyone can view a dispute's current status and submitted scores for a given match.

---

## Embed Design System

All embeds share a consistent style:

```ts
// lib/embeds.ts
const BRAND_COLOR  = 0xC0273A  // crimson — matches platform theme
const STAFF_COLOR  = 0x7289DA  // discord blurple — for staff server embeds
const WIN_COLOR    = 0x2ECC71  // green
const LOSS_COLOR   = 0xE74C3C  // red
const NEUTRAL_COLOR = 0x95A5A6 // grey for pending/disputed

// Footer on every embed
footer: {
  text: "C3 Esports · carolina-collegiate-clash.gg",
  iconURL: C3_LOGO_URL,
}
```

Example — match result embed:
```
┌─────────────────────────────────────────┐
│  ✅  Match Result — Week 4              │
│  Premier Division                       │
├─────────────────────────────────────────┤
│  Team Liquid        3 – 1      Storm FC │
│                                         │
│  Game 1  3-0  ✓ replay                  │
│  Game 2  2-1  ✓ replay                  │
│  Game 3  1-3  ✓ replay                  │
│  Game 4  4-2  ✓ replay                  │
│                                         │
│  [View Full Match]                      │
├─────────────────────────────────────────┤
│  C3 Esports · carolina-collegiate-clash │
└─────────────────────────────────────────┘
```

---

## Check-in Flow (Interactive)

When `match.checkin_open` fires, the bot posts an embed with an **"✅ Check In"** button in the team's notification channel. Clicking it:

1. Bot verifies the Discord user is linked to a player on this team (via `Player.discordUsername` or future Discord OAuth link)
2. Bot calls `POST /api/matches/:matchId/checkin` on the platform API with a service token
3. Embed updates to show which team(s) have checked in

---

## Environment Variables

```env
# Bot credentials
DISCORD_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_GUILD_ID=          # Staff server ID (for guild-scoped command registration in dev)

# Internal webhook secret (must match platform's BOT_WEBHOOK_SECRET)
BOT_WEBHOOK_SECRET=

# Platform API base URL (for check-in and other write actions)
PLATFORM_API_URL=https://carolina-collegiate-clash.gg
PLATFORM_SERVICE_TOKEN=    # Long-lived JWT or API key for bot→platform calls

# Shared database
DATABASE_URL=

# Webhook listener port
BOT_WEBHOOK_PORT=3001
```

---

## Deployment

The bot runs as a separate process alongside the Next.js app. In production:

- **Docker**: single `c3-discord-bot` container in the same Compose stack
- **Process**: `node dist/index.js` (bot gateway) + embedded Express server on port 3001
- **Platform → Bot**: Next.js calls `http://bot:3001/webhook` (internal Docker network, never public)
- **Scaling**: single instance only — Discord gateway connections are stateful

```yaml
# docker-compose.yml addition
  bot:
    build: ./c3-discord-bot
    restart: unless-stopped
    environment:
      - DISCORD_TOKEN
      - DISCORD_CLIENT_ID
      - BOT_WEBHOOK_SECRET
      - PLATFORM_API_URL=http://web:3000
      - PLATFORM_SERVICE_TOKEN
      - DATABASE_URL
    depends_on:
      - db
    networks:
      - internal
```

---

## Implementation Phases

### Phase 1 — Core Notifications
- [ ] Project scaffold (discord.js v14, TypeScript, Prisma)
- [ ] `GuildConfig` schema migration
- [ ] `/register-channel` admin command
- [ ] Webhook receiver with HMAC verification
- [ ] `match.result` notification embed
- [ ] `registration.approved` / `registration.rejected` embeds
- [ ] `season.open` announcement embed

### Phase 2 — Query Commands
- [ ] `/standings` command
- [ ] `/schedule` command
- [ ] `/team` command
- [ ] `/match` command

### Phase 3 — Interactive Check-in
- [ ] Check-in button on `match.checkin_open` embed
- [ ] Discord user → Player lookup
- [ ] Bot calls platform check-in API

### Phase 4 — Staff Tools
- [ ] `/announce` staff command (broadcast to all linked servers)
- [ ] Dispute notifications with "View Dispute" button
- [ ] `season.announcement` broadcast
- [ ] Staff server: dispute queue embeds

---

## Security Notes

- The webhook endpoint (`POST /bot:3001/webhook`) is **never exposed to the public internet** — traffic flows only over the internal Docker network
- All platform → bot calls are signed with HMAC-SHA256; the bot rejects unsigned requests
- The bot service token (for bot → platform API calls) is scoped to bot-specific actions only (check-in, read standings) and cannot modify team/season data
- Discord user → player binding is optional for read commands; required only for interactive check-in
