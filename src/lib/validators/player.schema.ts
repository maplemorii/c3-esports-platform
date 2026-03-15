/**
 * player.schema.ts
 *
 * Zod v4 schemas for Player and User API inputs.
 *
 * Used by:
 *  - POST   /api/players               (CreatePlayerSchema)
 *  - PATCH  /api/players/:playerId     (UpdatePlayerSchema)
 *  - PATCH  /api/users/:userId         (UpdateUserSchema)
 *  - PATCH  /api/users/:userId/role    (AssignRoleSchema)
 *  - POST   /api/auth/register         (RegisterUserSchema)
 */

import { z } from "zod"
import { Role } from "@prisma/client"

// ---------------------------------------------------------------------------
// Shared field definitions
// ---------------------------------------------------------------------------

const displayName = z
  .string()
  .min(2, "Display name must be at least 2 characters")
  .max(32, "Display name must be 32 characters or less")
  .trim()

/**
 * Rocket League Tracker Network profile URL.
 * e.g. https://rocketleague.tracker.network/rocket-league/profile/epic/PlayerName/overview
 */
const trackerUrl = z
  .string()
  .url("Must be a valid URL")
  .refine(
    (url) => url.includes("tracker.network") || url.includes("rocketleague.tracker.network"),
    "Must be a Rocket League Tracker Network URL (tracker.network)"
  )
  .optional()

/**
 * Steam ID — 17-digit numeric string (SteamID64 format).
 */
const steamId = z
  .string()
  .regex(/^\d{17}$/, "Steam ID must be a 17-digit number (SteamID64)")
  .optional()

/**
 * Discord username — supports legacy (Username#1234) and new (@username) formats.
 */
const discordUsername = z
  .string()
  .min(2)
  .max(37)
  .regex(
    /^(?:@?[a-z0-9_.]{2,32}|[^#]{2,32}#\d{4})$/i,
    "Must be a valid Discord username (e.g. username or OldName#1234)"
  )
  .optional()

// ---------------------------------------------------------------------------
// Player profile
// ---------------------------------------------------------------------------

export const CreatePlayerSchema = z.object({
  displayName:     displayName,
  trackerUrl:      trackerUrl,
  steamId:         steamId,
  discordUsername: discordUsername,
  bio:             z.string().max(500).optional(),
  avatarUrl:       z.string().url("Must be a valid URL").optional(),
})

export type CreatePlayerInput = z.infer<typeof CreatePlayerSchema>

export const UpdatePlayerSchema = CreatePlayerSchema.partial()

export type UpdatePlayerInput = z.infer<typeof UpdatePlayerSchema>

// ---------------------------------------------------------------------------
// User account
// ---------------------------------------------------------------------------

export const UpdateUserSchema = z.object({
  name:  z.string().min(1).max(100).trim().optional(),
  image: z.string().url("Must be a valid URL").optional(),
})

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>

export const AssignRoleSchema = z.object({
  role: z.enum(Object.values(Role) as [Role, ...Role[]]),
})

export type AssignRoleInput = z.infer<typeof AssignRoleSchema>

// ---------------------------------------------------------------------------
// Registration (credentials sign-up)
// ---------------------------------------------------------------------------

export const RegisterUserSchema = z
  .object({
    name:            z.string().min(1, "Name is required").max(100).trim(),
    email:           z.string().email("Must be a valid email address").toLowerCase(),
    password:        z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72, "Password must be 72 characters or less")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>

/** Server-side only: omit confirmPassword before writing to DB. */
export const RegisterUserServerSchema = RegisterUserSchema.transform(
  ({ confirmPassword: _, ...rest }) => rest
)

export type RegisterUserServerInput = z.infer<typeof RegisterUserServerSchema>
