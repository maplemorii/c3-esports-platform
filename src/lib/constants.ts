/**
 * constants.ts
 *
 * App-wide configuration constants.
 * Import from here — do not scatter magic numbers throughout the codebase.
 */

import type { Role } from "@prisma/client"

// ---------------------------------------------------------------------------
// Role hierarchy
// ---------------------------------------------------------------------------

/**
 * Numeric rank per role. Higher value = more privileged.
 * Used by requireRole() and canManageTeam() helpers.
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  USER:         0,
  TEAM_MANAGER: 1,
  STAFF:        2,
  ADMIN:        3,
  OWNER:        4,
  DEVELOPER:    5,
}

// ---------------------------------------------------------------------------
// Match timing defaults (season.pointsConfig overrides these per season)
// ---------------------------------------------------------------------------

/** Minutes before scheduledAt that check-in window opens. */
export const DEFAULT_CHECKIN_WINDOW_MINUTES = 15

/** Minutes after scheduledAt that teams can still check in before forfeit. */
export const DEFAULT_CHECKIN_GRACE_MINUTES = 5

/** Hours after scheduledAt to submit match scores before the match is forfeited. */
export const DEFAULT_RESULT_WINDOW_HOURS = 24

// ---------------------------------------------------------------------------
// Points config defaults
// ---------------------------------------------------------------------------

export interface PointsConfig {
  win:         number
  loss:        number
  forfeitWin:  number
  forfeitLoss: number
}

export const DEFAULT_POINTS_CONFIG: PointsConfig = {
  win:         3,
  loss:        0,
  forfeitWin:  3,
  forfeitLoss: 0,
}

// ---------------------------------------------------------------------------
// Match format → games in a series
// ---------------------------------------------------------------------------

export const GAMES_IN_FORMAT: Record<string, number> = {
  BO1: 1,
  BO3: 3,
  BO5: 5,
  BO7: 7,
}

// ---------------------------------------------------------------------------
// File upload limits
// ---------------------------------------------------------------------------

/** Maximum allowed size for a team logo upload (5 MB). */
export const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024

/** Maximum allowed size for a single replay file upload (100 MB). */
export const MAX_REPLAY_SIZE_BYTES = 100 * 1024 * 1024

/** Maximum allowed size for a player avatar upload (2 MB). */
export const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024

/** Presigned URL expiry in seconds (5 minutes). */
export const PRESIGN_EXPIRES_SECONDS = 300

// ---------------------------------------------------------------------------
// Accepted MIME types per upload category
// ---------------------------------------------------------------------------

export const ALLOWED_LOGO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
]

export const ALLOWED_REPLAY_TYPES = [
  "application/octet-stream",
  "application/x-replay",
]

export const ALLOWED_AVATAR_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
]

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

/** Default number of items per page for paginated list endpoints. */
export const DEFAULT_PAGE_SIZE = 20

/** Maximum items per page (prevents abuse on large datasets). */
export const MAX_PAGE_SIZE = 100

// ---------------------------------------------------------------------------
// Divisions per season
// ---------------------------------------------------------------------------

/**
 * The three fixed division names created automatically when a season is published.
 * Do not rename these — they are referenced in seeding and bracket logic.
 */
export const DIVISION_NAMES = {
  PREMIER:    "Premier",
  CHALLENGERS: "Open Challengers",
  CONTENDERS: "Open Contenders",
} as const

// ---------------------------------------------------------------------------
// Standings display
// ---------------------------------------------------------------------------

/** Number of top standings entries to show in a "mini standings" widget. */
export const STANDINGS_PREVIEW_COUNT = 5

// ---------------------------------------------------------------------------
// Cron / background job settings
// ---------------------------------------------------------------------------

/** How often (ms) the matchTick cron should fire in production. */
export const MATCH_TICK_INTERVAL_MS = 60_000 // 1 minute

/**
 * Minimum elapsed time (ms) before a PROCESSING replay is considered stale
 * and gets escalated to FAILED.
 */
export const REPLAY_STALE_AFTER_MS = 30 * 60 * 1000 // 30 minutes

/**
 * Minimum elapsed time (ms) before a VERIFYING match is considered overdue
 * and gets escalated to DISPUTED.
 */
export const VERIFYING_STALE_AFTER_MS = 24 * 60 * 60 * 1000 // 24 hours

// ---------------------------------------------------------------------------
// Slug constraints (must match slug.ts)
// ---------------------------------------------------------------------------

export const SLUG_MAX_LENGTH = 60

// ---------------------------------------------------------------------------
// Team constraints
// ---------------------------------------------------------------------------

export const TEAM_NAME_MIN_LENGTH = 2
export const TEAM_NAME_MAX_LENGTH = 50

/** Maximum active members on a roster (players + substitutes + coaches). */
export const MAX_ROSTER_SIZE = 8

/** Minimum players required to register for a season. */
export const MIN_ROSTER_FOR_REGISTRATION = 3

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const PASSWORD_MIN_LENGTH = 8

/** JWT session max-age in seconds (30 days). */
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60

// ---------------------------------------------------------------------------
// Cron security
// ---------------------------------------------------------------------------

/**
 * Header sent by Vercel Cron or your own scheduler to authenticate cron calls.
 * Compared against CRON_SECRET env var in matchTick handler.
 */
export const CRON_AUTH_HEADER = "x-cron-secret"

// ---------------------------------------------------------------------------
// External URLs
// ---------------------------------------------------------------------------

export const BALLCHASING_BASE_URL = "https://ballchasing.com/api"
