# C3 Esports Discord Bot

> Full feature specification and development checklist for the official C3 Esports Discord bot.
> Bot interfaces with the platform via the `/api/v1` public API (reads) and `/api/bot` authenticated API (writes).

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Permission Model](#permission-model)
5. [Commands — Info (Read-Only)](#commands--info-read-only)
6. [Commands — Staff (Authenticated Writes)](#commands--staff-authenticated-writes)
7. [Automated Notifications](#automated-notifications)
8. [Scheduled Posts](#scheduled-posts)
9. [Embeds & Formatting Guide](#embeds--formatting-guide)
10. [Configuration & Server Setup](#configuration--server-setup)
11. [Error Handling](#error-handling)
12. [Development Checklist](#development-checklist)

---

## Overview

The C3 Esports bot lives in the official Discord server and provides:
- Real-time match info, standings, and player/team lookups
- Staff controls for match management, dispute resolution, and registrations
- Automated alerts for match events, disputes, and weekly standings
- Scheduled posts to keep the community informed without manual effort

---

## Tech Stack

| Tool | Purpose |
|---|---|
| discord.js v14 | Bot framework |
| TypeScript | Language |
| Node.js 20 | Runtime |
| Railway | Hosting (second service in same project) |
| `node-fetch` / native fetch | API calls to platform |
| `cron` or `node-cron` | Scheduled tasks |
| dotenv | Environment config |

---

## Architecture

```
discord-bot/
├── src/
│   ├── index.ts                  # Entry point, client init, event registration
│   ├── deploy-commands.ts        # One-off script to register slash commands
│   ├── commands/
│   │   ├── info/
│   │   │   ├── standings.ts
│   │   │   ├── matches.ts
│   │   │   ├── match.ts
│   │   │   ├── team.ts
│   │   │   ├── player.ts
│   │   │   └── season.ts
│   │   └── staff/
│   │       ├── checkin.ts
│   │       ├── forfeit.ts
│   │       ├── result.ts
│   │       ├── dispute.ts
│   │       ├── registration.ts
│   │       └── announce.ts
│   ├── events/
│   │   ├── ready.ts
│   │   └── interactionCreate.ts
│   ├── jobs/
│   │   ├── weeklyStandings.ts
│   │   ├── matchReminders.ts
│   │   └── pendingRegistrations.ts
│   ├── lib/
│   │   ├── api.ts                # Typed wrapper around platform API
│   │   ├── embeds.ts             # All embed builders
│   │   ├── permissions.ts        # Role-gate helpers
│   │   ├── format.ts             # Score, date, streak formatters
│   │   └── config.ts             # Env var validation
│   └── types/
│       └── api.ts                # API response types mirrored from platform
├── package.json
├── tsconfig.json
└── .env
```

---

## Permission Model

### Discord Role Mapping

| Discord Role | Bot Permission Level | Can Use |
|---|---|---|
| `@everyone` | Public | All `/info` commands |
| `@Staff` | Staff | All staff commands except admin-only |
| `@Admin` | Admin | All commands |
| `@Bot Admin` | Bot Admin | `/config` commands, bot restart |

### Command Visibility

| Command Group | Visibility | Permission Required |
|---|---|---|
| Info commands | Public channels | None |
| Staff commands | Staff-only channels only | `@Staff` role |
| Config commands | Admin DM / private channel | `@Admin` role |

Staff commands must **also** be restricted to specific channels (configured via `/config set-staff-channel`). If used outside the staff channel they silently fail with an ephemeral error.

---

## Commands — Info (Read-Only)

All info commands are public, ephemeral responses by default unless `--public` flag used.

---

### `/standings`

Show division standings for the current or specified season.

**Options:**
| Option | Type | Required | Description |
|---|---|---|---|
| `division` | String (choice) | No | `premier`, `challengers`, `contenders` — defaults to all |
| `season` | String | No | Season slug e.g. `season-1` — defaults to active |
| `public` | Boolean | No | Post visibly to channel instead of ephemeral |

**Behavior:**
- Fetches `GET /api/v1/seasons/:slug/standings`
- If no active season found, replies with "No active season right now."
- If `division` specified, show only that division's table
- If no division specified, post all three divisions as separate embeds in one reply
- Standings table shows: Rank · Team · W · L · GW · GL · PTS · Streak
- Streak shown as `+3` (green) or `-2` (red)
- Current leader gets a 🥇 prefix on their team name
- Top 2 teams highlighted with a subtle gold/silver embed color
- Footer: "Last updated · Season 1 · Open Challengers"

**Example embed:**
```
┌─────────────────────────────────────┐
│ 🏆  Open Challengers Standings       │
│     Season 1 · Week 3 of 8          │
├──────────────────────────────────────┤
│  #  Team            W  L  PTS  STK  │
│  1  🥇 Team Alpha   3  0   9   +3   │
│  2  Team Beta       2  1   6   +1   │
│  3  Team Gamma      1  2   3   -1   │
│  4  Team Delta      0  3   0   -3   │
└──────────────────────────────────────┘
```

---

### `/matches`

List matches with optional filters.

**Options:**
| Option | Type | Required | Description |
|---|---|---|---|
| `team` | String | No | Team name or slug |
| `status` | String (choice) | No | `scheduled`, `checking_in`, `in_progress`, `completed`, `disputed` |
| `week` | Integer | No | League week number |
| `upcoming` | Boolean | No | Show only future matches |
| `limit` | Integer | No | Number of results, 1–10, default 5 |
| `public` | Boolean | No | Post visibly to channel |

**Behavior:**
- Fetches `GET /api/v1/matches` with mapped query params
- Groups results by status (IN PROGRESS first, then CHECKING IN, then SCHEDULED, then COMPLETED)
- Each match shown as a compact line: `Team A vs Team B · BO3 · Week 2 · Sat Mar 21 3:00 PM`
- Completed matches show score: `Team Alpha 2–1 Team Beta`
- If no matches found for filter, reply "No matches found."
- Link to full match list: `https://c3esports.com/matches`

---

### `/match`

Show detailed info for a single match.

**Options:**
| Option | Type | Required | Description |
|---|---|---|---|
| `id` | String | Yes | Match ID |
| `public` | Boolean | No | Post visibly to channel |

**Behavior:**
- Fetches `GET /api/v1/matches?` filtered by id (or add `GET /api/v1/matches/:id` to platform)
- Shows: teams, format, status, scheduled time, check-in window, game-by-game scores if completed
- Status badge color: SCHEDULED=grey, CHECKING_IN=yellow, IN_PROGRESS=blue, COMPLETED=green, DISPUTED=red, FORFEITED=orange
- Game scores shown as individual fields: `Game 1: 3–2 · Game 2: 1–4 · Game 3 (OT): 2–1`
- Winner bolded
- "View on site" button link to `/matches/:id`

---

### `/team`

Show a team's profile and current roster.

**Options:**
| Option | Type | Required | Description |
|---|---|---|---|
| `name` | String | Yes | Team name or slug (autocomplete) |
| `public` | Boolean | No | Post visibly to channel |

**Behavior:**
- Fetches `GET /api/v1/teams/:slug`
- Shows: team name, logo thumbnail, division, W/L record, current roster
- Roster listed as: `⚔️ ApexRocket (Captain) · 🎮 BlazeKicker · 🎮 CipherBoost`
- Captain marked with crown icon
- Team colors used as embed side color
- "View on site" button link to `/team/:slug`
- If team not found: "No team found matching '{name}'."

---

### `/player`

Look up a player's profile.

**Options:**
| Option | Type | Required | Description |
|---|---|---|---|
| `name` | String | Yes | Display name, Epic username, or Discord username (autocomplete) |
| `public` | Boolean | No | Post visibly to channel |

**Behavior:**
- Fetches `GET /api/v1/players?search=:name`
- If multiple results, show a select menu to pick the right player
- Shows: display name, avatar thumbnail, current team + division, Epic username, Steam ID, Discord username, member since date
- Team name links to `/team/:slug`
- "View profile" button link to `/players/:id`
- If not found: "No player found matching '{name}'."

---

### `/season`

Show current season overview.

**Options:**
| Option | Type | Required | Description |
|---|---|---|---|
| `public` | Boolean | No | Post visibly to channel |

**Behavior:**
- Fetches `GET /api/v1/seasons?status=ACTIVE` (first result)
- Shows: season name, status, start/end dates, week progress bar, division list with team counts
- Week progress: `Week 3 of 8 ████░░░░░░ 37.5%`
- Each division listed with registered team count
- "View season" button link to `/seasons/:slug`
- If no active season: "There is no active season right now."

---

### `/help`

Show all available commands with short descriptions.

**Behavior:**
- Ephemeral only
- Lists info commands visible to everyone
- Lists staff commands only if user has `@Staff` role
- Grouped by category with headers

---

## Commands — Staff (Authenticated Writes)

All staff commands are:
- Restricted to designated staff channel (configured via `/config`)
- Require `@Staff` Discord role
- Responses are ephemeral by default
- All actions logged to `#bot-audit-log` channel with: who ran it, what command, what changed, timestamp

---

### `/checkin override`

Force check-in a team for a match.

**Options:**
| Option | Type | Required | Description |
|---|---|---|---|
| `match-id` | String | Yes | Match ID |
| `team` | String (choice) | Yes | `home` or `away` |
| `reason` | String | No | Reason for override (logged) |

**Behavior:**
- Calls `POST /api/bot/matches/:id/checkin-override`
- Confirms with: "✅ Force checked in **Team Alpha** for match `abc123`."
- Logs to `#bot-audit-log`: staff member, team, match, reason, timestamp
- If match not in CHECKING_IN state: "This match is not currently in check-in phase."
- If team already checked in: "Team is already checked in."

---

### `/forfeit`

Award a forfeit win/loss.

**Options:**
| Option | Type | Required | Description |
|---|---|---|---|
| `match-id` | String | Yes | Match ID |
| `team` | String (choice) | Yes | Team that forfeits (`home` or `away`) |
| `reason` | String | Yes | Reason (required for forfeits, stored in audit log) |

**Behavior:**
- Shows confirmation prompt (button: Confirm / Cancel) before executing
- Calls `POST /api/bot/matches/:id/forfeit`
- On confirm: "✅ Match `abc123` recorded as a forfeit. **Team Beta** forfeits. **Team Alpha** wins."
- Logs to `#bot-audit-log` and `#results` channel
- If match already completed/forfeited: "Match is already resolved."

---

### `/result set`

Override match scores manually.

**Options:**
| Option | Type | Required | Description |
|---|---|---|---|
| `match-id` | String | Yes | Match ID |
| `home-score` | Integer | Yes | Home team series score (e.g. 2 for 2-1) |
| `away-score` | Integer | Yes | Away team series score |
| `reason` | String | Yes | Reason for manual override |

**Behavior:**
- Shows confirmation prompt before executing
- Calls `PATCH /api/bot/matches/:id/result`
- On confirm: posts score card embed to `#results`, replies "✅ Result set: **Team Alpha 2 – 1 Team Beta**."
- Validates: scores must not exceed format max (BO3 max 2, BO5 max 3)
- Logs override to `#bot-audit-log`
- If match already completed without dispute: warns "This match is already completed. Override anyway?" with second confirmation

---

### `/dispute resolve`

Resolve or dismiss an open dispute.

**Options:**
| Option | Type | Required | Description |
|---|---|---|---|
| `dispute-id` | String | Yes | Dispute ID |
| `outcome` | String (choice) | Yes | `home-wins`, `away-wins`, `dismiss` |
| `reason` | String | Yes | Staff ruling / notes |

**Behavior:**
- Fetches dispute details first, shows embed with both teams' submissions
- Confirmation prompt showing: match, both team submissions, proposed outcome
- Calls `PATCH /api/bot/disputes/:id`
- On resolve: posts resolution embed to `#results`
- On dismiss: posts dismissal notice
- Logs to `#bot-audit-log` with full reason
- If dispute already resolved: "This dispute has already been resolved."

---

### `/dispute list`

Show all open disputes.

**Options:**
| Option | Type | Required | Description |
|---|---|---|---|
| `status` | String (choice) | No | `open`, `resolved`, `dismissed` — defaults to `open` |

**Behavior:**
- Calls `GET /api/bot/disputes?status=open`
- Lists each dispute: ID, match, teams, filed by, filed at, age
- Old disputes (>48h open) highlighted in red
- "No open disputes 🎉" if empty
- Ephemeral response

---

### `/registration approve`

Approve a team's season registration.

**Options:**
| Option | Type | Required | Description |
|---|---|---|---|
| `registration-id` | String | Yes | Registration ID |
| `note` | String | No | Optional note to team |

**Behavior:**
- Calls `PATCH /api/bot/registrations/:id` with `{ status: "APPROVED" }`
- Replies: "✅ **Team Alpha** approved for Season 1 · Open Challengers."
- Logs to `#bot-audit-log`
- Notifies team owner via DM if bot has DM permissions (best-effort)

---

### `/registration reject`

Reject a team's season registration.

**Options:**
| Option | Type | Required | Description |
|---|---|---|---|
| `registration-id` | String | Yes | Registration ID |
| `reason` | String | Yes | Reason shown to team |

**Behavior:**
- Confirmation prompt before executing
- Calls `PATCH /api/bot/registrations/:id` with `{ status: "REJECTED", note: reason }`
- Replies: "✅ **Team Beta** registration rejected."
- Logs to `#bot-audit-log`

---

### `/registration list`

List pending registrations.

**Options:**
| Option | Type | Required | Description |
|---|---|---|---|
| `season` | String | No | Season slug — defaults to active |
| `status` | String (choice) | No | `pending`, `approved`, `rejected` — defaults to `pending` |

**Behavior:**
- Calls `GET /api/bot/registrations?status=pending`
- Lists: team name, division requested, registered at, team size
- "No pending registrations 🎉" if empty

---

### `/announce`

Post a platform-wide announcement embed to a designated announcement channel.

**Options:**
| Option | Type | Required | Description |
|---|---|---|---|
| `title` | String | Yes | Announcement title (max 100 chars) |
| `body` | String | Yes | Announcement body (max 1000 chars, supports markdown) |
| `ping` | String (choice) | No | `everyone`, `here`, `players`, none — defaults to none |
| `color` | String (choice) | No | `info` (blue), `warning` (yellow), `alert` (red), `success` (green) — default `info` |

**Behavior:**
- Preview shown to staff member first (ephemeral) with Confirm/Cancel buttons
- On confirm: posts branded embed to `#announcements` channel
- Optionally stores announcement in DB via `POST /api/bot/announce`
- Logs to `#bot-audit-log`: who posted, full content, timestamp
- Pinging `@everyone` requires `@Admin` role, not just `@Staff`

---

### `/stats`

Show platform stats (staff/admin only).

**Behavior:**
- Calls `GET /api/bot/stats`
- Shows: total users, total teams, active season, pending registrations, total matches, completed matches, open disputes
- Ephemeral response

---

### `/config`

Configure bot settings for this server. **Admin only.**

**Subcommands:**

| Subcommand | Options | Description |
|---|---|---|
| `/config set-staff-channel` | `channel` | Channel where staff commands are allowed |
| `/config set-results-channel` | `channel` | Channel for match result posts |
| `/config set-alerts-channel` | `channel` | Channel for match check-in / start alerts |
| `/config set-standings-channel` | `channel` | Channel for weekly standings auto-post |
| `/config set-audit-channel` | `channel` | Channel for bot audit log |
| `/config set-announcements-channel` | `channel` | Channel for `/announce` posts |
| `/config set-staff-role` | `role` | Discord role that can use staff commands |
| `/config set-admin-role` | `role` | Discord role that can use admin commands |
| `/config standings-day` | `day` (Mon–Sun) | Day of week for auto standings post |
| `/config show` | — | Show current config |

**Behavior:**
- Config stored in bot's own SQLite or Railway-hosted Postgres table: `bot_config`
- `/config show` displays all current settings in an ephemeral embed
- Changes logged to `#bot-audit-log`

---

## Automated Notifications

These fire automatically based on platform webhook calls (`POST` to bot's `/webhook` HTTP server) or polling.

### Webhook-triggered

| Event | Source | Target Channel | Message |
|---|---|---|---|
| Match check-in opens | Platform webhook | `#match-alerts` | "⏰ Check-in is now open for **Team A vs Team B** — closes in 30 min" |
| Match starts (IN_PROGRESS) | Platform webhook | `#match-alerts` | "🎮 **Team A vs Team B** is now underway!" |
| Match completed | Platform webhook | `#results` | Full score card embed (see embed spec below) |
| Dispute filed | Platform webhook | `#staff-alerts` | "🚨 Dispute filed for **Team A vs Team B** — needs review" |
| Dispute resolved | Platform webhook | `#results` | Resolution embed with ruling and reason |
| Registration submitted | Platform webhook | `#staff-alerts` | "📋 **Team X** applied to **Season 1 · Open Challengers** — awaiting approval" |
| Registration approved | Platform webhook | `#results` | "✅ **Team X** is approved and competing in Season 1!" |

### Polling-based (fallback if webhooks unavailable)

| Job | Interval | Action |
|---|---|---|
| Match reminder | Every 5 min | Alert 1 hour + 10 min before scheduled match |
| Pending registrations digest | Every hour | DM staff lead if >3 registrations pending for >24h |
| Open disputes digest | Every hour | Alert staff channel if dispute >48h unresolved |

---

## Scheduled Posts

| Job | Schedule | Channel | Content |
|---|---|---|---|
| Weekly standings | Monday 9:00 AM | `#standings` | Full standings for all active divisions |
| Weekly match preview | Monday 9:05 AM | `#match-alerts` | Upcoming matches for the current week |
| Season end recap | On season completion | `#announcements` | Final standings, champion, top scorers |

All schedules configurable via `/config`.

---

## Embeds & Formatting Guide

### Score Card Embed (match completed)
```
Color: Green (#16a34a)
Title: Team Alpha 2 — 1 Team Beta
Description: BO3 · Open Challengers · Week 2

Fields:
  Game 1: 3 – 2  (Alpha wins)
  Game 2: 1 – 4  (Beta wins)
  Game 3 (OT): 2 – 1  (Alpha wins)

Footer: Season 1 · Completed Mar 21 2026 · View on site [link]
Thumbnail: Winner team logo
```

### Standings Embed (weekly post)
```
Color: Brand red (#C41C35)
Title: 📊 Week 3 Standings — Season 1
Description: Open Challengers Division

Table (code block):
  #  Team           W  L  PTS
  1  Team Alpha     3  0   9
  2  Team Beta      2  1   6
  ...

Footer: Updated Mon Mar 16 · c3esports.com
```

### Match Alert Embed (check-in opens)
```
Color: Yellow (#d97706)
Title: ⏰ Check-in Open
Fields:
  Match: Team Alpha vs Team Beta
  Format: Best of 3
  Scheduled: Today at 8:00 PM ET
  Check-in closes: 7:50 PM ET (10 min)
Footer: Use /match <id> for details
```

### Dispute Alert Embed
```
Color: Red (#C41C35)
Title: 🚨 Dispute Filed
Fields:
  Match: Team Alpha vs Team Beta
  Filed by: Team Beta
  Submitted scores:
    Team Alpha says: 2–1
    Team Beta says: 1–2
Footer: Use /dispute list to review
```

### Announcement Embed
```
Color: configurable (info/warning/alert/success)
Author: C3 Esports [logo]
Title: [announcement title]
Description: [body]
Footer: Posted by [staff name] · [timestamp]
```

---

## Configuration & Server Setup

### Environment Variables (bot)

```env
# Discord
DISCORD_BOT_TOKEN=""
DISCORD_APPLICATION_ID=""
DISCORD_GUILD_ID=""          # Your server ID

# Platform API
PLATFORM_API_URL="https://c3esports.com"
BOT_API_KEY=""               # Matches BOT_API_KEY on platform

# Webhook receiver (optional — for platform → bot push events)
WEBHOOK_PORT=4000
WEBHOOK_SECRET=""            # Shared secret to verify platform calls

# Logging
LOG_LEVEL="info"
```

### Bot Permissions Required (Discord)

When adding bot to server, request these permissions:
- `Send Messages`
- `Send Messages in Threads`
- `Embed Links`
- `Attach Files`
- `Read Message History`
- `Mention Everyone` (for `/announce` with ping)
- `Use Slash Commands`
- `Manage Messages` (to delete ephemeral follow-ups)

### First-Time Setup Order

1. Add bot to server
2. Assign `@Bot Admin` role to yourself
3. Run `/config set-staff-role @Staff`
4. Run `/config set-staff-channel #bot-commands`
5. Run `/config set-results-channel #results`
6. Run `/config set-alerts-channel #match-alerts`
7. Run `/config set-standings-channel #standings`
8. Run `/config set-audit-channel #bot-audit-log`
9. Run `/config set-announcements-channel #announcements`
10. Run `/config show` to verify

---

## Error Handling

| Error | Bot Response |
|---|---|
| Platform API unreachable | "⚠️ Can't reach the platform right now. Try again in a moment." |
| 401 from platform | Silent alert to `#bot-audit-log`: "Bot API key rejected — needs rotation" |
| 404 from platform | "Nothing found for that ID." |
| 422 validation error | Show the validation message from the API |
| Rate limited by platform | Queue retry after 10s, tell user "Processing..." |
| Discord API error | Log to console, try once more |
| Command used outside staff channel | Ephemeral: "Staff commands can only be used in #bot-commands." |
| Missing role | Ephemeral: "You don't have permission to use this command." |
| Unhandled exception | Log to `#bot-audit-log`, reply "Something went wrong. The team has been notified." |

---

## Development Checklist

### Phase 0 — Repo Setup

- [ ] Create `discord-bot/` repo (separate from platform repo)
- [ ] Init with `npm init` + TypeScript config
- [ ] Install dependencies: `discord.js`, `typescript`, `tsx`, `dotenv`, `node-cron`
- [ ] Set up `tsconfig.json` with `strict: true`, `moduleResolution: "bundler"`
- [ ] Add `dev`, `build`, `start`, `deploy-commands` scripts to `package.json`
- [ ] Create `.env.example` with all required vars
- [ ] Add `.gitignore` — exclude `.env`, `dist/`, `node_modules/`
- [ ] Create Railway service for bot in same project as platform

---

### Phase 1 — Bot Foundation

- [ ] `src/index.ts` — create Discord client with required intents: `Guilds`, `GuildMessages`
- [ ] `src/lib/config.ts` — validate all env vars on startup, throw if any missing
- [ ] `src/events/ready.ts` — log "Bot online" with username and server count on ready
- [ ] `src/events/interactionCreate.ts` — route slash commands and button interactions to handlers
- [ ] `src/lib/permissions.ts` — `isStaff(interaction)`, `isAdmin(interaction)` helpers using configured roles
- [ ] `src/lib/api.ts` — typed fetch wrapper:
  - `get(path)` — public API calls to `/api/v1`
  - `botPost(path, body)` — authenticated calls to `/api/bot` with `BOT_API_KEY` header
  - `botPatch(path, body)` — same
  - Automatic error parsing and typed error throwing
- [ ] `src/lib/format.ts`:
  - `formatDate(iso: string)` — "Sat Mar 21 8:00 PM ET"
  - `formatStreak(n: number)` — "+3" or "-2"
  - `formatRecord(w, l)` — "3–1"
  - `formatScore(home, away, homeTeam, awayTeam)` — "Team Alpha 2–1 Team Beta"
  - `formatStatus(status: MatchStatus)` — human readable + emoji
  - `formatDivision(tier)` — "Premier", "Open Challengers", "Open Contenders"
- [ ] `src/lib/embeds.ts` — embed builder functions (one per embed type, see spec above)
- [ ] `src/deploy-commands.ts` — script to register all slash commands with Discord

---

### Phase 2 — Info Commands

- [ ] **`/standings`**
  - [ ] Build command definition with `division` and `season` options + `public` flag
  - [ ] Fetch from `GET /api/v1/seasons/:slug/standings`
  - [ ] Render standings table as embed with rank, W, L, PTS, streak
  - [ ] Handle no active season
  - [ ] Handle per-division filtering
  - [ ] Handle multiple divisions (3 embeds in one reply)
  - [ ] Streak coloring (green positive, red negative)
  - [ ] Leader gets 🥇 prefix
  - [ ] Test with live data

- [ ] **`/matches`**
  - [ ] Build command definition with all filter options
  - [ ] Fetch from `GET /api/v1/matches`
  - [ ] Group results by status
  - [ ] Format each match line correctly
  - [ ] Handle empty results
  - [ ] Test all filter combinations

- [ ] **`/match`**
  - [ ] Build command definition
  - [ ] Fetch from `GET /api/v1/matches?id=:id` (or direct route once added to platform)
  - [ ] Full match detail embed with game-by-game scores
  - [ ] Status badge color mapping
  - [ ] "View on site" button component
  - [ ] Handle match not found

- [ ] **`/team`**
  - [ ] Build command definition with autocomplete on `name`
  - [ ] Implement autocomplete handler: query `GET /api/v1/teams?search=:query`, return up to 10 options
  - [ ] Fetch from `GET /api/v1/teams/:slug`
  - [ ] Roster list with captain marker
  - [ ] Team color as embed color
  - [ ] Team logo as thumbnail
  - [ ] "View on site" button
  - [ ] Handle team not found

- [ ] **`/player`**
  - [ ] Build command definition with autocomplete on `name`
  - [ ] Implement autocomplete: query `GET /api/v1/players?search=:query`, return up to 10
  - [ ] Fetch from `GET /api/v1/players/:id`
  - [ ] Select menu if multiple matches
  - [ ] Full player embed with all linked accounts
  - [ ] Avatar as thumbnail
  - [ ] Handle player not found

- [ ] **`/season`**
  - [ ] Fetch from `GET /api/v1/seasons?status=ACTIVE`
  - [ ] Week progress bar (█ per completed week, ░ per remaining)
  - [ ] Division list with team counts
  - [ ] Handle no active season

- [ ] **`/help`**
  - [ ] Role-aware: show staff section only to `@Staff`
  - [ ] Grouped by category
  - [ ] Always ephemeral

---

### Phase 3 — Staff Commands

- [ ] Channel guard middleware — wrap all staff commands: reject if not in configured staff channel
- [ ] Role guard middleware — reject if user lacks configured staff role

- [ ] **`/checkin override`**
  - [ ] Build command with `match-id`, `team`, `reason` options
  - [ ] Call `POST /api/bot/matches/:id/checkin-override`
  - [ ] Log to audit channel
  - [ ] Error handling for wrong match status

- [ ] **`/forfeit`**
  - [ ] Build command
  - [ ] Confirmation button (Confirm / Cancel) before executing
  - [ ] Call `POST /api/bot/matches/:id/forfeit`
  - [ ] Post result to `#results` on confirm
  - [ ] Log to audit channel

- [ ] **`/result set`**
  - [ ] Build command with score inputs
  - [ ] Validate scores against format (BO3 max 2, BO5 max 3)
  - [ ] Confirmation prompt with preview of result
  - [ ] Double confirmation if match already completed
  - [ ] Call `PATCH /api/bot/matches/:id/result`
  - [ ] Post score card embed to `#results`
  - [ ] Log to audit channel

- [ ] **`/dispute resolve`**
  - [ ] Build command
  - [ ] Fetch and show dispute details before confirmation
  - [ ] Confirmation prompt showing both team submissions
  - [ ] Call `PATCH /api/bot/disputes/:id`
  - [ ] Post resolution embed to `#results`
  - [ ] Log to audit channel

- [ ] **`/dispute list`**
  - [ ] Fetch from `GET /api/bot/disputes`
  - [ ] Highlight disputes >48h old in red
  - [ ] Age shown as "2h ago", "1d ago" etc.

- [ ] **`/registration approve`**
  - [ ] Build command
  - [ ] Call `PATCH /api/bot/registrations/:id`
  - [ ] Log to audit channel

- [ ] **`/registration reject`**
  - [ ] Confirmation prompt with reason
  - [ ] Call `PATCH /api/bot/registrations/:id`
  - [ ] Log to audit channel

- [ ] **`/registration list`**
  - [ ] Fetch pending registrations
  - [ ] Each entry shows: team, division, registered at, roster size

- [ ] **`/announce`**
  - [ ] Build command with all options
  - [ ] Preview embed shown to staff before posting
  - [ ] Require `@Admin` for `@everyone` ping
  - [ ] Post to configured announcements channel
  - [ ] Call `POST /api/bot/announce` to persist in DB
  - [ ] Log to audit channel

- [ ] **`/stats`**
  - [ ] Fetch from `GET /api/bot/stats`
  - [ ] Compact stats embed

- [ ] **`/config` (all subcommands)**
  - [ ] `set-staff-channel`
  - [ ] `set-results-channel`
  - [ ] `set-alerts-channel`
  - [ ] `set-standings-channel`
  - [ ] `set-audit-channel`
  - [ ] `set-announcements-channel`
  - [ ] `set-staff-role`
  - [ ] `set-admin-role`
  - [ ] `standings-day`
  - [ ] `show`
  - [ ] Persist config to `bot_config` table or local SQLite
  - [ ] Load config on startup

---

### Phase 4 — Automated Notifications

- [ ] Create `src/lib/webhook-server.ts` — small HTTP server (port 4000) to receive platform webhooks
- [ ] Validate incoming webhook with `WEBHOOK_SECRET` HMAC signature check
- [ ] Handle `match.checkin_opened` event → post to `#match-alerts`
- [ ] Handle `match.started` event → post to `#match-alerts`
- [ ] Handle `match.completed` event → post score card to `#results`
- [ ] Handle `dispute.opened` event → post alert to `#staff-alerts`
- [ ] Handle `dispute.resolved` event → post resolution to `#results`
- [ ] Handle `registration.submitted` event → post to `#staff-alerts`
- [ ] Handle `registration.approved` event → post to `#results`
- [ ] Fallback polling job (in case webhook misses): every 5 min check for matches that recently completed

---

### Phase 5 — Scheduled Jobs

- [ ] `src/jobs/weeklyStandings.ts`
  - [ ] Runs on configured day at 9:00 AM
  - [ ] Fetches active season standings
  - [ ] Posts all division standings to `#standings`
  - [ ] Includes weekly match preview
  - [ ] Gracefully skips if no active season

- [ ] `src/jobs/matchReminders.ts`
  - [ ] Runs every 5 minutes
  - [ ] Queries upcoming matches within next 70 minutes
  - [ ] Posts 1-hour warning if not already warned (track in memory/DB)
  - [ ] Posts 10-minute warning for check-in
  - [ ] Deduplication: never post same reminder twice

- [ ] `src/jobs/pendingAlerts.ts`
  - [ ] Runs every hour
  - [ ] Checks for registrations pending >24h → DM staff lead
  - [ ] Checks for disputes open >48h → post reminder to `#staff-alerts`
  - [ ] Deduplication: don't spam same alert repeatedly

---

### Phase 6 — Polish & Testing

- [ ] All commands respond within 3s (defer if needed with `interaction.deferReply()`)
- [ ] All embeds have consistent footer with "C3 Esports · c3esports.com"
- [ ] All timestamps shown in user's local time (Discord `<t:unix:F>` format)
- [ ] All ephemeral responses work correctly (not visible to others)
- [ ] Autocomplete returns results within 500ms
- [ ] Error messages are friendly and never expose internal details
- [ ] Test every command in a private test server before production
- [ ] Test all staff commands with a non-staff account to confirm rejection
- [ ] Test all confirmation prompts (confirm + cancel both work)
- [ ] Test webhook delivery end-to-end
- [ ] Test scheduled jobs fire at correct times
- [ ] Load test: 10 concurrent `/standings` calls don't break anything

---

### Phase 7 — Deployment

- [ ] Create new Railway service: `c3-discord-bot`
- [ ] Add all env vars to Railway service
- [ ] Set start command: `node dist/index.js`
- [ ] Set build command: `npm run build`
- [ ] Connect to same Railway project as platform (shares env var groups)
- [ ] Verify bot starts cleanly in Railway logs
- [ ] Run `/deploy-commands` once to register slash commands with Discord
- [ ] Verify all commands appear in Discord
- [ ] Run `/config show` to confirm settings loaded
- [ ] Monitor `#bot-audit-log` for first 24h
- [ ] Set up Railway restart policy: always restart on crash
