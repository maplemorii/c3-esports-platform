/**
 * team.schema.ts
 *
 * Zod v4 schemas for Team and TeamMembership API inputs.
 *
 * Used by:
 *  - POST   /api/teams
 *  - PATCH  /api/teams/:teamId
 *  - POST   /api/teams/:teamId/roster
 *  - DELETE /api/teams/:teamId/roster/:entryId (no body needed)
 *  - POST   /api/teams/:teamId/logo
 */

import { z } from "zod"
import { MembershipRole } from "@prisma/client"

// ---------------------------------------------------------------------------
// Shared field definitions
// ---------------------------------------------------------------------------

const teamName = z
  .string()
  .min(2, "Team name must be at least 2 characters")
  .max(50, "Team name must be 50 characters or less")
  .trim()

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex colour e.g. #C0273A")
  .optional()

const httpUrl = z
  .string()
  .url("Must be a valid URL")
  .max(255)
  .optional()

const twitterHandle = z
  .string()
  .regex(/^@?[A-Za-z0-9_]{1,15}$/, "Must be a valid Twitter/X handle")
  .transform((v) => (v.startsWith("@") ? v : `@${v}`))
  .optional()

// ---------------------------------------------------------------------------
// Team CRUD
// ---------------------------------------------------------------------------

export const CreateTeamSchema = z.object({
  name:           teamName,
  region:         z.string().min(1).max(10).optional(),
  primaryColor:   hexColor,
  secondaryColor: hexColor,
  website:        httpUrl,
  twitterHandle:  twitterHandle,
  discordInvite:  httpUrl,
})

export type CreateTeamInput = z.infer<typeof CreateTeamSchema>

export const UpdateTeamSchema = CreateTeamSchema.partial()

export type UpdateTeamInput = z.infer<typeof UpdateTeamSchema>

// ---------------------------------------------------------------------------
// Roster management
// ---------------------------------------------------------------------------

export const AddRosterMemberSchema = z.object({
  playerId:    z.string().cuid("Invalid player ID"),
  role:        z.enum(Object.values(MembershipRole) as [MembershipRole, ...MembershipRole[]])
                 .default("PLAYER"),
  isCaptain:   z.boolean().default(false),
  jerseyNumber: z.number().int().min(0).max(99).optional(),
})

export type AddRosterMemberInput = z.infer<typeof AddRosterMemberSchema>

export const UpdateRosterMemberSchema = AddRosterMemberSchema
  .omit({ playerId: true })
  .partial()

export type UpdateRosterMemberInput = z.infer<typeof UpdateRosterMemberSchema>

// ---------------------------------------------------------------------------
// Logo upload
// ---------------------------------------------------------------------------

export const TeamLogoPresignSchema = z.object({
  filename:    z.string().min(1).max(255),
  contentType: z
    .string()
    .refine(
      (v) => ["image/jpeg", "image/png", "image/webp", "image/svg+xml"].includes(v),
      "Only JPEG, PNG, WebP, or SVG images are allowed"
    ),
})

export type TeamLogoPresignInput = z.infer<typeof TeamLogoPresignSchema>
