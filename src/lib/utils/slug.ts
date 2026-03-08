/**
 * slug.ts
 *
 * URL-safe slug generation and validation.
 * Used for team slugs, season slugs, and any other URL identifiers.
 *
 * Rules:
 *  - Lowercase alphanumeric + hyphens only
 *  - No leading/trailing hyphens
 *  - No consecutive hyphens
 *  - Max 60 characters
 */

const SLUG_MAX_LENGTH = 60

/**
 * Converts an arbitrary string into a URL-safe slug.
 *
 * @example
 * slugify("Team Liquid #1!")  // → "team-liquid-1"
 * slugify("Season 3 — Fall") // → "season-3-fall"
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")                         // decompose accented chars
    .replace(/[\u0300-\u036f]/g, "")          // strip combining diacritics
    .replace(/[^a-z0-9\s-]/g, "")            // remove non-alphanumeric (keep spaces/hyphens)
    .trim()
    .replace(/[\s_]+/g, "-")                  // spaces/underscores → hyphens
    .replace(/-{2,}/g, "-")                   // collapse consecutive hyphens
    .replace(/^-+|-+$/g, "")                  // strip leading/trailing hyphens
    .slice(0, SLUG_MAX_LENGTH)
}

/**
 * Returns true if the string is a valid slug (already slugified).
 *
 * @example
 * isValidSlug("team-liquid")  // → true
 * isValidSlug("Team Liquid")  // → false
 */
export function isValidSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= SLUG_MAX_LENGTH
}

/**
 * Generates a unique-enough slug by appending a short random suffix.
 * Use when slugify() alone might produce collisions (e.g. two teams named "Storm").
 *
 * @example
 * uniqueSlug("Storm") // → "storm-k3f2" (suffix changes each call)
 */
export function uniqueSlug(input: string): string {
  const base = slugify(input).slice(0, SLUG_MAX_LENGTH - 6) // leave room for suffix
  const suffix = Math.random().toString(36).slice(2, 6)     // 4 random alphanumeric chars
  return `${base}-${suffix}`
}

/**
 * Ensures a candidate slug is unique against an existing set of slugs.
 * Appends an incrementing suffix if there's a collision.
 *
 * @example
 * dedupeSlug("storm", ["storm", "storm-2"]) // → "storm-3"
 */
export function dedupeSlug(candidate: string, existing: string[]): string {
  if (!existing.includes(candidate)) return candidate

  let counter = 2
  let attempt = `${candidate}-${counter}`
  while (existing.includes(attempt)) {
    counter++
    attempt = `${candidate}-${counter}`
  }
  return attempt
}
