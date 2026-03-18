# Multi-Game Migration Checklist

Migrating C3 Esports Platform from Rocket League-only to a multi-title system supporting
Valorant, Overwatch 2, and any future game titles. Each section is ordered by dependency.

**Confirmed titles:** Rocket League · Valorant · Overwatch 2

---

## 1. Database Schema

### 1.1 — Add `GameTitle` model
- [ ] Add `GameTitle` model with fields:
  - `id`, `slug` (unique, URL-safe), `name`, `shortName`
  - `logoUrl`, `coverImageUrl`
  - `isActive` (controls visibility)
  - `rosterMin`, `rosterMax` (e.g. RL: 3/6, Valorant: 5/7, OW2: 5/7)
  - `substituteMax`
  - `defaultFormat` (BO1/BO3/BO5)
  - `replayProvider` (`BALLCHASING` | `NONE` — extensible enum)
  - `createdAt`, `updatedAt`
- [ ] Seed the three confirmed titles (Rocket League, Valorant, Overwatch 2)

### 1.2 — Add `gameId` to `Division`
- [ ] Add `gameId String` foreign key to `Division` → `GameTitle`
- [ ] Remove the `@@unique([seasonId, name])` constraint (division names can repeat across games within a season)
- [ ] Add `@@unique([seasonId, gameId, name])` instead
- [ ] Add `@@index([gameId])` to `Division`
- [ ] Backfill existing divisions with Rocket League `gameId`

### 1.3 — Generalize `Player` game identifiers
- [ ] Keep `epicUsername` and `steamId` as RL-specific fields (nullable, already unique)
- [ ] Add `PlayerGameIdentifier` join model:
  - `id`, `playerId`, `gameId`
  - `identifier` (the in-game username/tag, e.g. Riot ID `Name#TAG` or BattleTag `Name#1234`)
  - `identifierType` (`EPIC` | `STEAM` | `RIOT_ID` | `BATTLE_TAG` | `CUSTOM`)
  - `isPrimary` (boolean — main identifier shown on profile)
  - `@@unique([playerId, gameId])` — one identifier per player per game
  - `@@unique([gameId, identifier])` — identifier unique within a game
- [ ] Keep `epicUsername` on `Player` as RL legacy (used by ballchasing matching) — do NOT remove

### 1.4 — Generalize `ReplayPlayerStat`
- [ ] Add `gameId String` to `ReplayPlayerStat`
- [ ] Add `gameSpecificData Json?` column for game-specific raw stats (replaces hard-coded RL fields in future)
- [ ] Keep existing RL stat columns (`goals`, `assists`, `saves`, `shots`, `demos`, `boostUsed`, etc.) — mark as RL-only in comments, nullable for other games
- [ ] Add `@@index([gameId])` to `ReplayPlayerStat`

### 1.5 — Add `gameId` to `Season` (optional but recommended)
- [ ] Consider adding `gameId String?` to `Season` — a season can be single-game or multi-game
  - If single-game: `gameId` set → all divisions inherit the game
  - If multi-game: `gameId` null → each division has its own `gameId`
- [ ] This allows a "Season 5" that spans multiple games with per-game divisions

### 1.6 — Write and apply migration
- [ ] Run `npx prisma migrate dev --name add_game_titles` (dev)
- [ ] Verify `npx prisma generate` succeeds with no type errors
- [ ] Write seed data for `GameTitle` entries

---

## 2. Admin UI — Game Title Management

### 2.1 — Game titles CRUD page (`/admin/games`)
- [ ] List all game titles with logo, name, roster config, active status
- [ ] Create game form: slug, name, shortName, logoUrl, rosterMin/Max, defaultFormat, replayProvider
- [ ] Edit game form (all fields editable)
- [ ] Toggle `isActive` (soft-disable without deletion)
- [ ] Add to `STAFF_NAV` in `DashboardSidebar.tsx`

### 2.2 — Division creation with game selection
- [ ] Update admin season/division creation form to include game title selector
- [ ] Show game logo + name in division list views
- [ ] Filter divisions by game in admin matches/standings views

---

## 3. Admin UI — Division & Season Updates

### 3.1 — Season creation/edit
- [ ] Add optional "Primary Game" selector to season form (for single-game seasons)
- [ ] Show game badges on season cards and detail pages

### 3.2 — Division creation/edit
- [ ] **Required**: game title selector (dropdown of active `GameTitle` records)
- [ ] Auto-populate `rosterMin`, `rosterMax`, `defaultFormat` from selected game (editable)
- [ ] Show selected game on division detail pages and registration lists

### 3.3 — Registration review
- [ ] Show which game each registration is for
- [ ] Validate roster size against `GameTitle.rosterMin`/`rosterMax` on approval

---

## 4. Team & Roster Updates

### 4.1 — Team page multi-game rosters
- [ ] Teams can have memberships across multiple games/divisions
- [ ] Group roster display by game on team detail page (`/teams/[slug]`)
- [ ] Team settings: display active games the team competes in

### 4.2 — Player game identifiers
- [ ] Profile edit page: allow adding/editing in-game identifier per game title
- [ ] Validator: Riot ID format (`Name#TAG`), BattleTag format (`Name#1234`)
- [ ] Admin user page: show all game identifiers for a player

### 4.3 — Roster size enforcement
- [ ] `api/teams/[teamId]/roster` — enforce `GameTitle.rosterMin`/`rosterMax` per division
- [ ] Registration flow — warn if roster size doesn't meet game requirements before submission

---

## 5. Match & Result System

### 5.1 — Match context
- [ ] `Match` already has `divisionId → Division → gameId` — no direct match field needed
- [ ] Add `gameId` to `MatchGame` denormalized for query performance (optional)
- [ ] Update `formatMatchDate` and score display helpers to be game-agnostic

### 5.2 — Score reporting
- [ ] `MatchReport.gameBreakdown` is already generic JSON — no change needed
- [ ] Update UI labels: "Goals" is RL-specific → use "Points" or game-configurable label
- [ ] Add `GameTitle.scoringLabel` field (`"Goals"` | `"Rounds"` | `"Maps"`) for display

### 5.3 — Replay system (RL-specific, needs abstraction)
- [ ] Add `replayProvider` enum to `GameTitle`: `BALLCHASING | NONE`
- [ ] Wrap `replay.service.ts` and `ballchasing` calls behind a `getReplayProvider(gameId)` factory
- [ ] For games without replay support (`NONE`): skip replay upload UI, go straight to manual score entry
- [ ] `ReplayUpload.homeTeamColor` is RL-specific (blue/orange) — make nullable, document as RL-only
- [ ] Add `GameTitle.supportsReplays Boolean` flag as a simpler check in UI

### 5.4 — Cron jobs
- [ ] `api/cron/parse-replays` — guard with `division.game.replayProvider === 'BALLCHASING'` check
- [ ] No changes needed for check-in, forfeit, or standings crons — already game-agnostic

---

## 6. Public Pages

### 6.1 — Game filter on all public listing pages
- [ ] `/seasons` — add game filter tabs (All / Rocket League / Valorant / Overwatch 2)
- [ ] `/matches` — add game filter
- [ ] `/schedule` — add game filter (currently has division filter; add game level above)
- [ ] `/standings` — add game filter
- [ ] `/teams` — add game filter
- [ ] `/players` — add game filter (filter by players active in a specific game's division)

### 6.2 — Season/division display
- [ ] Show game logo + name badge on season cards
- [ ] Show game badge on division pills throughout the site

### 6.3 — Player profile
- [ ] Show game identifiers (Riot ID, BattleTag, etc.) on public player card
- [ ] Group stats by game on player detail page (future)

---

## 7. Navbar & Navigation

- [ ] Update mega menu "League" section to reference games (or keep generic — seasons auto-organize)
- [ ] `/schedule` already in mega menu ✓
- [ ] `/players` already fixed to correct href ✓
- [ ] Consider adding a "Games" nav item once 2+ games are live

---

## 8. Bot API

### 8.1 — Webhook/event updates
- [ ] Match webhooks (`POST /api/bot/webhooks`) — include `gameTitle` in payload
- [ ] Match detail endpoint (`GET /api/v1/matches/[matchId]`) — include `gameTitle` in response

### 8.2 — Bot commands (if applicable)
- [ ] Any `!score`, `!standings`, `!schedule` commands should accept an optional game filter

---

## 9. Stats & Analytics (future scope)

- [ ] Per-game stat schemas differ significantly — design `GameStatDefinition` if needed
- [ ] Valorant: rounds won/lost, ACS, kills, deaths, assists, KAST
- [ ] OW2: map score, eliminations, deaths, healing, damage
- [ ] RL: goals, assists, saves, shots, demos (existing schema)
- [ ] Consider generic `PlayerStatEntry` with `gameId` + `data Json` rather than adding columns per game

---

## 10. Infrastructure & Config

- [ ] Add game logos to R2 bucket + update `next.config.ts` `remotePatterns` if needed
- [ ] Environment variable: no new vars needed (game config lives in DB)
- [ ] Verify Railway memory/connection limits are sufficient for expanded schema

---

## 11. Testing

- [ ] Unit tests: `standings.service.ts` (already game-agnostic — verify)
- [ ] Unit tests: `checkin.service.ts` (game-agnostic — verify)
- [ ] Integration tests: registration flow with game-specific roster validation
- [ ] Integration tests: replay parse gated behind `replayProvider` check
- [ ] E2E: create a Valorant season → division → team registration → match result

---

## 12. Migration & Rollout Order

1. **DB migration** — add `GameTitle`, `gameId` on `Division`, `PlayerGameIdentifier`
2. **Seed game titles** — Rocket League (backfill existing divisions), Valorant, Overwatch 2
3. **Admin UI** — game management page + game selector in division forms
4. **Player identifiers** — profile edit + admin user pages
5. **Public pages** — game filter on all listing pages
6. **Replay abstraction** — gate ballchasing behind `replayProvider` flag
7. **Registration validation** — roster size from `GameTitle`
8. **Bot/webhook updates** — add `gameTitle` to payloads
9. **Stats system** — only after at least two games are actively played

---

## Quick Reference: Per-Game Defaults

| Field | Rocket League | Valorant | Overwatch 2 |
|---|---|---|---|
| `rosterMin` | 3 | 5 | 5 |
| `rosterMax` | 6 | 7 | 7 |
| `substituteMax` | 3 | 2 | 2 |
| `defaultFormat` | BO3 | BO3 | BO3 |
| `replayProvider` | BALLCHASING | NONE | NONE |
| `scoringLabel` | Goals | Rounds | Maps |
| `supportsReplays` | true | false | false |
