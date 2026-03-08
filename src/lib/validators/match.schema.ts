/**
 * match.schema.ts
 *
 * Zod v4 schemas for Match API inputs.
 *
 * Used by:
 *  - POST   /api/matches                         (CreateMatchSchema)
 *  - PATCH  /api/matches/:matchId                (RescheduleMatchSchema)
 *  - POST   /api/matches/:matchId/checkin/override (ForceCheckInSchema)
 *  - POST   /api/matches/:matchId/result         (SubmitResultSchema)
 *  - PATCH  /api/matches/:matchId/result         (StaffResultOverrideSchema)
 *  - POST   /api/matches/:matchId/confirm        (no body)
 *  - POST   /api/matches/:matchId/forfeit        (ForfeitMatchSchema)
 *  - POST   /api/matches/:matchId/replays        (CreateReplayUploadSchema)
 *  - POST   /api/disputes                        (CreateDisputeSchema)
 *  - PATCH  /api/disputes/:disputeId             (ResolveDisputeSchema)
 */

import { z } from "zod"
import { MatchFormat, MatchType } from "@prisma/client"

// ---------------------------------------------------------------------------
// Shared field definitions
// ---------------------------------------------------------------------------

const cuid = z.string().cuid("Invalid ID format")

const isoDatetime = z.iso
  .datetime({ offset: true })
  .transform((v) => new Date(v))

/** Validates a single game result in a series. */
const GameResultSchema = z.object({
  gameNumber: z.number().int().min(1).max(7, "Max 7 games in a series"),
  homeGoals:  z.number().int().min(0).max(99),
  awayGoals:  z.number().int().min(0).max(99),
  overtime:   z.boolean().optional().default(false),
})
  .refine(
    (g) => g.homeGoals !== g.awayGoals,
    "A game cannot end in a draw"
  )

export type GameResultInput = z.infer<typeof GameResultSchema>

// ---------------------------------------------------------------------------
// Match CRUD
// ---------------------------------------------------------------------------

export const CreateMatchSchema = z
  .object({
    divisionId:   cuid,
    leagueWeekId: cuid.optional(),
    homeTeamId:   cuid,
    awayTeamId:   cuid,
    format:       z.enum(Object.values(MatchFormat) as [MatchFormat, ...MatchFormat[]])
                    .default("BO3"),
    matchType:    z.enum(Object.values(MatchType) as [MatchType, ...MatchType[]])
                    .default("REGULAR_SEASON"),
    scheduledAt:  isoDatetime.optional(),
    notes:        z.string().max(500).optional(),
  })
  .refine((d) => d.homeTeamId !== d.awayTeamId, {
    message: "Home and away teams must be different",
    path: ["awayTeamId"],
  })

export type CreateMatchInput = z.infer<typeof CreateMatchSchema>

export const RescheduleMatchSchema = z.object({
  scheduledAt: isoDatetime,
  notes:       z.string().max(500).optional(),
})

export type RescheduleMatchInput = z.infer<typeof RescheduleMatchSchema>

// ---------------------------------------------------------------------------
// Check-in
// ---------------------------------------------------------------------------

export const ForceCheckInSchema = z.object({
  teamId: cuid,
})

export type ForceCheckInInput = z.infer<typeof ForceCheckInSchema>

// ---------------------------------------------------------------------------
// Score submission
// ---------------------------------------------------------------------------

export const SubmitResultSchema = z
  .object({
    games: z
      .array(GameResultSchema)
      .min(1, "At least one game result is required")
      .max(7),
  })
  .refine(
    (d) => {
      const numbers = d.games.map((g) => g.gameNumber)
      return new Set(numbers).size === numbers.length
    },
    { message: "Duplicate game numbers are not allowed", path: ["games"] }
  )

export type SubmitResultInput = z.infer<typeof SubmitResultSchema>

export const StaffResultOverrideSchema = z.object({
  games:  z.array(GameResultSchema).min(1).max(7),
  reason: z.string().min(1, "A reason is required for staff overrides").max(500),
})

export type StaffResultOverrideInput = z.infer<typeof StaffResultOverrideSchema>

// ---------------------------------------------------------------------------
// Forfeit
// ---------------------------------------------------------------------------

export const ForfeitMatchSchema = z.object({
  forfeitingTeamId: cuid,
  reason:           z.string().min(1, "A reason is required").max(500),
})

export type ForfeitMatchInput = z.infer<typeof ForfeitMatchSchema>

// ---------------------------------------------------------------------------
// Replay upload
// ---------------------------------------------------------------------------

export const CreateReplayUploadSchema = z.object({
  gameNumber: z.number().int().min(1).max(7),
  fileKey:    z.string().min(1, "fileKey is required").max(500),
  /** "blue" | "orange" — helps the parser map RL team colours to home/away */
  homeTeamColor: z.enum(["blue", "orange"]).optional(),
})

export type CreateReplayUploadInput = z.infer<typeof CreateReplayUploadSchema>

// ---------------------------------------------------------------------------
// Disputes
// ---------------------------------------------------------------------------

export const CreateDisputeSchema = z.object({
  matchId:     cuid,
  reason:      z.string().min(10, "Please describe the issue in at least 10 characters").max(1000),
  evidenceUrl: z.string().url("Must be a valid URL").optional(),
})

export type CreateDisputeInput = z.infer<typeof CreateDisputeSchema>

export const ResolveDisputeSchema = z.object({
  resolution:          z.string().min(1, "A resolution note is required").max(1000),
  resolvedHomeScore:   z.number().int().min(0).optional(),
  resolvedAwayScore:   z.number().int().min(0).optional(),
})

export type ResolveDisputeInput = z.infer<typeof ResolveDisputeSchema>

// ---------------------------------------------------------------------------
// Presigned upload
// ---------------------------------------------------------------------------

export const PresignUploadSchema = z.object({
  filename:    z.string().min(1).max(255),
  contentType: z.string().min(1).max(100),
  category:    z.enum(["logo", "replay", "avatar"]),
})

export type PresignUploadInput = z.infer<typeof PresignUploadSchema>
