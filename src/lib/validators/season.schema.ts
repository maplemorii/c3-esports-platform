/**
 * season.schema.ts
 *
 * Zod v4 schemas for Season, Division, and Registration API inputs.
 *
 * Used by:
 *  - POST   /api/seasons                                   (CreateSeasonSchema)
 *  - PATCH  /api/seasons/:seasonId                         (UpdateSeasonSchema)
 *  - POST   /api/seasons/:seasonId/divisions               (CreateDivisionSchema)
 *  - PATCH  /api/seasons/:seasonId/divisions/:id           (UpdateDivisionSchema)
 *  - POST   /api/seasons/:seasonId/registrations           (RegisterTeamSchema)
 *  - PATCH  /api/seasons/:seasonId/registrations/:id       (ReviewRegistrationSchema)
 *  - POST   /api/seasons/:seasonId/weeks/generate          (GenerateWeeksSchema — no body)
 *  - PATCH  /api/seasons/:seasonId/weeks/:weekId           (AdjustWeekSchema)
 *  - POST   /api/divisions/:divisionId/bracket/generate    (GenerateBracketSchema)
 *  - PATCH  /api/divisions/:divisionId/standings/:entryId  (StandingsOverrideSchema)
 */

import { z } from "zod"
import { BracketType, DivisionTier, RegistrationStatus } from "@prisma/client"

// ---------------------------------------------------------------------------
// Shared field definitions
// ---------------------------------------------------------------------------

const cuid = z.string().cuid("Invalid ID format")

const isoDatetime = z.iso
  .datetime({ offset: true })
  .transform((v) => new Date(v))

const slug = z
  .string()
  .min(2)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
  .optional()

/** Points config JSON — validated at the API boundary. */
const PointsConfigSchema = z
  .object({
    win:         z.number().int().min(0).max(10),
    loss:        z.number().int().min(0).max(10),
    forfeitWin:  z.number().int().min(0).max(10),
    forfeitLoss: z.number().int().min(0).max(10),
  })
  .optional()

// ---------------------------------------------------------------------------
// Season CRUD
// ---------------------------------------------------------------------------

export const CreateSeasonSchema = z
  .object({
    name:              z.string().min(2, "Season name must be at least 2 characters").max(80).trim(),
    slug:              slug,
    description:       z.string().max(2000).optional(),

    // Dates
    startDate:         isoDatetime.optional(),
    endDate:           isoDatetime.optional(),
    registrationStart: isoDatetime.optional(),
    registrationEnd:   isoDatetime.optional(),

    // League play config
    leagueWeeks:            z.number().int().min(1).max(52).default(8),
    checkInWindowMinutes:   z.number().int().min(1).max(60).default(15),
    checkInGraceMinutes:    z.number().int().min(0).max(60).default(5),
    resultWindowHours:      z.number().int().min(1).max(168).default(24),

    pointsConfig:      PointsConfigSchema,
    maxTeamsTotal:     z.number().int().min(1).max(512).optional(),
    isVisible:         z.boolean().default(false),
  })
  .refine(
    (d) => !d.startDate || !d.endDate || d.startDate < d.endDate,
    { message: "startDate must be before endDate", path: ["endDate"] }
  )
  .refine(
    (d) => !d.registrationStart || !d.registrationEnd || d.registrationStart < d.registrationEnd,
    { message: "registrationStart must be before registrationEnd", path: ["registrationEnd"] }
  )

export type CreateSeasonInput = z.infer<typeof CreateSeasonSchema>

export const UpdateSeasonSchema = CreateSeasonSchema.partial()

export type UpdateSeasonInput = z.infer<typeof UpdateSeasonSchema>

// ---------------------------------------------------------------------------
// Divisions
// ---------------------------------------------------------------------------

export const CreateDivisionSchema = z.object({
  name:        z.string().min(2).max(60).trim(),
  tier:        z.enum(Object.values(DivisionTier) as [DivisionTier, ...DivisionTier[]])
                 .default("CONTENDERS"),
  description: z.string().max(500).optional(),
  maxTeams:    z.number().int().min(2).max(256).optional(),
  bracketType: z.enum(Object.values(BracketType) as [BracketType, ...BracketType[]])
                 .default("DOUBLE_ELIMINATION"),
})

export type CreateDivisionInput = z.infer<typeof CreateDivisionSchema>

export const UpdateDivisionSchema = CreateDivisionSchema.partial()

export type UpdateDivisionInput = z.infer<typeof UpdateDivisionSchema>

// ---------------------------------------------------------------------------
// Registrations
// ---------------------------------------------------------------------------

export const RegisterTeamSchema = z.object({
  teamId: cuid,
})

export type RegisterTeamInput = z.infer<typeof RegisterTeamSchema>

export const ReviewRegistrationSchema = z.object({
  status:     z.enum(
    Object.values(RegistrationStatus) as [RegistrationStatus, ...RegistrationStatus[]]
  ),
  divisionId: cuid.optional(),
  notes:      z.string().max(500).optional(),
})
  .refine(
    (d) => d.status !== "APPROVED" || !!d.divisionId,
    { message: "divisionId is required when approving a registration", path: ["divisionId"] }
  )

export type ReviewRegistrationInput = z.infer<typeof ReviewRegistrationSchema>

// ---------------------------------------------------------------------------
// League weeks
// ---------------------------------------------------------------------------

export const AdjustWeekSchema = z.object({
  startDate: isoDatetime,
  endDate:   isoDatetime,
})
  .refine(
    (d) => d.startDate < d.endDate,
    { message: "startDate must be before endDate", path: ["endDate"] }
  )

export type AdjustWeekInput = z.infer<typeof AdjustWeekSchema>

// ---------------------------------------------------------------------------
// Brackets
// ---------------------------------------------------------------------------

export const GenerateBracketSchema = z.object({
  type:  z.enum(Object.values(BracketType) as [BracketType, ...BracketType[]]),
  seeds: z.array(cuid).min(2).max(256).optional(),
})

export type GenerateBracketInput = z.infer<typeof GenerateBracketSchema>

// ---------------------------------------------------------------------------
// Standings override
// ---------------------------------------------------------------------------

export const StandingsOverrideSchema = z.object({
  wins:             z.number().int().min(0).optional(),
  losses:           z.number().int().min(0).optional(),
  gamesWon:         z.number().int().min(0).optional(),
  gamesLost:        z.number().int().min(0).optional(),
  goalsFor:         z.number().int().min(0).optional(),
  goalsAgainst:     z.number().int().min(0).optional(),
  points:           z.number().int().min(0).optional(),
  reason:           z.string().min(1, "A reason is required for manual overrides").max(500),
})

export type StandingsOverrideInput = z.infer<typeof StandingsOverrideSchema>
