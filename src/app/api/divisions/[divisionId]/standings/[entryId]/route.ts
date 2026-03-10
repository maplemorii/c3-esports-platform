/**
 * /api/divisions/:divisionId/standings/:entryId
 *
 * PATCH — STAFF+; applies a manual delta to one team's standing entry.
 *         All fields are deltas (positive or negative integers).
 *         Writes an AuditLog entry.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/session"
import { applyManualOverride } from "@/lib/services/standings.service"
import { apiNotFound, apiBadRequest, handleServiceError } from "@/lib/utils/errors"
import { z } from "zod"

type Params = { params: Promise<{ divisionId: string; entryId: string }> }

const ManualOverrideSchema = z.object({
  wins:          z.number().int().optional(),
  losses:        z.number().int().optional(),
  gamesWon:      z.number().int().optional(),
  gamesLost:     z.number().int().optional(),
  goalsFor:      z.number().int().optional(),
  goalsAgainst:  z.number().int().optional(),
  forfeitWins:   z.number().int().optional(),
  forfeitLosses: z.number().int().optional(),
  points:        z.number().int().optional(),
}).refine(
  (d) => Object.values(d).some((v) => v !== undefined),
  "At least one field must be provided"
)

export async function PATCH(req: Request, { params }: Params) {
  const { session, error } = await requireRole("STAFF")
  if (error) return error

  const { divisionId, entryId } = await params

  // Verify the entry belongs to this division
  const entry = await prisma.standingEntry.findUnique({
    where:  { id: entryId },
    select: { id: true, divisionId: true },
  })
  if (!entry) return apiNotFound("Standing entry")
  if (entry.divisionId !== divisionId) return apiNotFound("Standing entry")

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return apiBadRequest("Request body must be valid JSON")
  }

  const parsed = ManualOverrideSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    )
  }

  try {
    await applyManualOverride(entryId, parsed.data, session.user.id)

    const updated = await prisma.standingEntry.findUnique({
      where:  { id: entryId },
      select: {
        id: true, wins: true, losses: true, matchesPlayed: true,
        forfeitWins: true, forfeitLosses: true,
        gamesWon: true, gamesLost: true, gameDifferential: true,
        goalsFor: true, goalsAgainst: true, goalDifferential: true,
        points: true, streak: true, winPct: true, lastUpdated: true,
        team: { select: { id: true, name: true, slug: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (err) {
    return handleServiceError(err, "PATCH /standings/:entryId")
  }
}
