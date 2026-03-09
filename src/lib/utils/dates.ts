/**
 * dates.ts
 *
 * Date formatting and calculation helpers.
 * All functions are pure — no side effects, no locale state.
 *
 * Formatting uses the Intl API (built into V8) — no external date library needed.
 */

// ---------------------------------------------------------------------------
// Display formatting
// ---------------------------------------------------------------------------

/**
 * Formats a date as a short human-readable string.
 * @example formatDate(new Date("2025-06-14")) → "Jun 14, 2025"
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date))
}

/**
 * Formats a datetime as a short human-readable string with time.
 * @example formatDateTime(new Date("2025-06-14T19:00:00Z")) → "Jun 14, 2025, 7:00 PM"
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date))
}

/**
 * Formats a time-only value.
 * @example formatTime(new Date("2025-06-14T19:00:00Z")) → "7:00 PM"
 */
export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "—"
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date))
}

/**
 * Returns a relative time string ("in 2 hours", "3 days ago", etc.).
 * Uses Intl.RelativeTimeFormat for locale-aware output.
 *
 * @example
 * formatRelative(new Date(Date.now() + 7_200_000)) // → "in 2 hours"
 * formatRelative(new Date(Date.now() - 86_400_000)) // → "1 day ago"
 */
export function formatRelative(date: Date | string | null | undefined): string {
  if (!date) return "—"

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })
  const diffMs = new Date(date).getTime() - Date.now()
  const diffSecs = Math.round(diffMs / 1_000)
  const diffMins = Math.round(diffSecs / 60)
  const diffHours = Math.round(diffMins / 60)
  const diffDays = Math.round(diffHours / 24)

  if (Math.abs(diffSecs) < 60)  return rtf.format(diffSecs, "second")
  if (Math.abs(diffMins) < 60)  return rtf.format(diffMins, "minute")
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour")
  if (Math.abs(diffDays) < 30)  return rtf.format(diffDays, "day")

  // Fall back to absolute for older/further dates
  return formatDate(date)
}

/**
 * Formats a duration in seconds as "m:ss" or "h:mm:ss".
 * Used for replay game durations.
 *
 * @example
 * formatDuration(305)  // → "5:05"
 * formatDuration(3661) // → "1:01:01"
 */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "—"

  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }
  return `${m}:${String(s).padStart(2, "0")}`
}

// ---------------------------------------------------------------------------
// Date range helpers
// ---------------------------------------------------------------------------

/**
 * Formats a date range as "Jun 14 – Jun 21, 2025".
 * Omits the year on the start date if both dates share the same year.
 */
export function formatDateRange(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined
): string {
  if (!start || !end) return "—"
  const s = new Date(start)
  const e = new Date(end)
  const sameYear = s.getFullYear() === e.getFullYear()

  const startStr = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(s)

  const endStr = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(e)

  return `${startStr} – ${endStr}`
}

/**
 * Returns true if the current time is within [start, end].
 */
export function isWithinRange(
  start: Date | string,
  end: Date | string
): boolean {
  const now = Date.now()
  return now >= new Date(start).getTime() && now <= new Date(end).getTime()
}

/**
 * Returns true if the date is in the past.
 */
export function isPast(date: Date | string): boolean {
  return new Date(date).getTime() < Date.now()
}

/**
 * Returns true if the date is in the future.
 */
export function isFuture(date: Date | string): boolean {
  return new Date(date).getTime() > Date.now()
}

// ---------------------------------------------------------------------------
// Match timing helpers
// ---------------------------------------------------------------------------

/**
 * Returns a human-readable label for a match timing state.
 *
 * @example
 * matchTimingLabel(new Date(Date.now() + 300_000), new Date(Date.now() + 600_000))
 * // → "Check-in opens in 5 minutes"
 */
export function matchTimingLabel(
  checkInOpenAt: Date | null,
  scheduledAt: Date | null
): string {
  if (!scheduledAt) return "Time TBD"
  if (!checkInOpenAt) return `Scheduled: ${formatDateTime(scheduledAt)}`

  const now = Date.now()
  const openMs = new Date(checkInOpenAt).getTime()
  const schedMs = new Date(scheduledAt).getTime()

  if (now < openMs)    return `Check-in opens ${formatRelative(checkInOpenAt)}`
  if (now < schedMs)   return `Check-in open — match starts ${formatRelative(scheduledAt)}`
  return `Match time: ${formatDateTime(scheduledAt)}`
}
