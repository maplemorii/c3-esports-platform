# CLAUDE.md

## Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.

## Reference Images
- If a reference image is provided: match layout, spacing, typography, and color exactly. Swap in placeholder content (images via `https://placehold.co/`, generic copy). Do not improve or add to the design.
- If no reference image: design from scratch with high craft (see guardrails below).
- Screenshot your output, compare against reference, fix mismatches, re-screenshot. Do at least 2 comparison rounds. Stop only when no visible differences remain or user says so.
- Never screenshot a `file:///` URL.

## Screenshot Workflow
- Puppeteer is installed at `C:/Users/benit/AppData/Local/Temp/puppeteer-test/`. Chrome cache is at `C:/Users/benit/.cache/puppeteer/`.
- **Always screenshot from localhost:** `node screenshot.mjs http://localhost:3000`
- Screenshots are saved automatically to `./temporary screenshots/screenshot-N-label.png`
- `screenshot.mjs` lives in the project root. Use it as-is.
- After screenshotting, read the PNG from `temporary screenshots/` with the Read tool - Claude can see and analyze the image directly.
- When comparing, be specific: "heading is 32px but reference shows ~24px", "card gap is 16px but should be 24px"
- Check: spacing/padding, font size/weight/line-height, colors (exact hex), alignment, border-radius, shadows, image sizing

## Commands

```bash
# Local dev stack (PostgreSQL + Redis)
docker-compose up -d

# Database
npx prisma migrate dev          # Run migrations (dev)
npx prisma migrate deploy       # Run migrations (prod)
npm run seed                    # Seed database (tsx prisma/seed.ts)
npx prisma studio               # Open Prisma Studio

# Development
npm run dev                     # Start Next.js dev server on :3000
npm run build                   # Production build
npm run lint                    # ESLint
npm run test                    # Run all tests (vitest)
npm run test:watch              # Watch mode
npm run test:coverage           # Coverage report
```

## Architecture

**C3 Esports Platform** — collegiate esports league management for the Carolinas. Built with Next.js 16 App Router, Prisma 7 + PostgreSQL, Redis, and NextAuth v4.

### Key Conventions

- **Path alias**: `@/*` maps to `./src/*`
- **API routes**: All under `src/app/api/`. Three API tiers:
  - Internal (session auth via NextAuth)
  - Bot API (`/api/bot/*`) — Bearer token via `BOT_API_KEY` env var, auth in `src/lib/bot-auth.ts`
  - Public v1 (`/api/v1/*`) — No auth, rate-limited
- **Cron jobs** hit `/api/cron/*` with `CRON_SECRET` bearer token; run every 1–5 min
- **File uploads** use presigned S3/R2 URLs — client uploads directly, not through the server

### Service Layer

Business logic lives in `src/lib/services/`. Never put complex logic directly in route handlers — put it in a service.

| Service | Responsibility |
|---|---|
| `match.service.ts` | Match CRUD |
| `matchStatus.service.ts` | State machine: SCHEDULED → CHECKING_IN → IN_PROGRESS → VERIFYING → COMPLETED/DISPUTED |
| `checkin.service.ts` | Check-in windows & deadlines |
| `replay.service.ts` | Replay file handling & ballchasing.com integration |
| `standings.service.ts` | W/L/points/goal-diff calculations |
| `schedule.service.ts` | Match scheduling with seeding |
| `bracket.service.ts` / `elimination.service.ts` / `swiss.service.ts` / `gsl.service.ts` | Bracket formats |

### Auth & Roles

Roles are hierarchical integers in `src/lib/roles.ts`: USER(0) < TEAM_MANAGER(1) < STAFF(2) < ADMIN(3) < OWNER(4) < DEVELOPER(5). DEVELOPER is injected via `DEVELOPER_USER_ID` env var.

Route protection is in `src/middleware.ts`. Use `getServerSession` from NextAuth in API routes to get the current user.

### Database

- Prisma schema: `prisma/schema.prisma` (25 models, ~976 lines)
- Notable patterns: soft deletes (`deletedAt`), temporal roster membership (join/leave dates), result provenance enum (`REPLAY_AUTO`, `MANUAL`, `STAFF_OVERRIDE`), head-to-head stored as ordered pairs
- `src/lib/prisma.ts` exports the singleton Prisma client

### Validation

All API input is validated with Zod schemas in `src/lib/validators/*.schema.ts` before hitting services.

### Caching & Rate Limiting

- Redis client: `src/lib/redis.ts`
- Cache helpers: `src/lib/cache/`
- Rate limiting: `src/lib/rateLimit.ts` (Redis-backed, per-user/IP/endpoint)

### Constants

`src/lib/constants.ts` (~976 lines) holds all app-wide enums, config values, and display strings. Check here before hardcoding any league-related values.

## Infrastructure

- **Hosting**: Railway (app + PostgreSQL) — not Vercel/Supabase
- **Redis**: Railway Redis add-on
- **File storage**: Cloudflare R2 (S3-compatible)
- **Replay parsing**: ballchasing.com API
- **Email**: Resend
- **Error monitoring**: Sentry
- **Production startup**: `prisma migrate deploy && node server.js` (see Dockerfile)
