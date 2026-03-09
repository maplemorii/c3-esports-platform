/**
 * /api/seasons/:seasonId/registrations
 *
 * GET  — public; list registrations for a season (staff-filtered or team-filtered)
 *          Query params: teamId
 *
 * POST — team owner or STAFF+; register a team for the season
 *          Body: { teamId, divisionId }
 *          Managers choose their own division at registration time.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/session"
import { assertCanManageTeam } from "@/lib/auth/permissions"
import {
  apiNotFound,
  apiBadRequest,
  apiConflict,
  apiInternalError,
} from "@/lib/utils/errors"
import { z } from "zod"

const RegisterSchema = z.object({
  teamId:     z.string().cuid("Invalid team ID"),
  divisionId: z.string().cuid("Invalid division ID"),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  const { seasonId } = await params
  const teamId = req.nextUrl.searchParams.get("teamId")?.trim()

  try {
    const registrations = await prisma.seasonRegistration.findMany({
      where: {
        seasonId,
        ...(teamId ? { teamId } : {}),
      },
      orderBy: { registeredAt: "desc" as const },
      select: {
        id:           true,
        status:       true,
        notes:        true,
        registeredAt: true,
        updatedAt:    true,
        team: {
          select: { id: true, name: true, slug: true, logoUrl: true, primaryColor: true },
        },
        division: {
          select: { id: true, name: true, tier: true },
        },
      },
    })

    return NextResponse.json(registrations)
  } catch (err) {
    return apiInternalError(err, "GET /api/seasons/:seasonId/registrations")
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ seasonId: string }> }
) {
  const { seasonId } = await params

  const { session, error: authError } = await requireAuth()
  if (authError) return authError

  let body: unknown
  try { body = await req.json() } catch { return apiBadRequest("Invalid JSON") }

  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const { teamId, divisionId } = parsed.data

  // Permission: must manage the team being registered
  const denied = await assertCanManageTeam(session, teamId)
  if (denied) return denied

  try {
    // Season must exist and be open for registration
    const season = await prisma.season.findUnique({
      where:  { id: seasonId },
      select: { id: true, status: true, name: true },
    })
    if (!season) return apiNotFound("Season")
    if (season.status !== "REGISTRATION") {
      return apiBadRequest(
        season.status === "ACTIVE"
          ? "Registration is closed — this season is already underway"
          : "This season is not currently open for registration"
      )
    }

    // Division must belong to this season
    const division = await prisma.division.findFirst({
      where:  { id: divisionId, seasonId },
      select: { id: true, name: true, maxTeams: true },
    })
    if (!division) return apiNotFound("Division")

    // Eligibility: at least 3 active players, all with Epic + Discord linked
    const memberships = await prisma.teamMembership.findMany({
      where:  { teamId, leftAt: null },
      select: { player: { select: { displayName: true, epicUsername: true, discordUsername: true } } },
    })
    if (memberships.length < 3) {
      return apiBadRequest(
        `Your team needs at least 3 players to register (currently ${memberships.length}).`
      )
    }
    const incomplete = memberships
      .filter((m) => !m.player?.epicUsername || !m.player?.discordUsername)
      .map((m) => m.player?.displayName ?? "Unknown")
    if (incomplete.length > 0) {
      return apiBadRequest(
        `The following players are missing required accounts: ${incomplete.join(", ")}. ` +
        `Each player needs an Epic Games username and a Discord username linked to their profile.`
      )
    }

    // Check division capacity
    if (division.maxTeams !== null) {
      const approved = await prisma.seasonRegistration.count({
        where: { divisionId, status: { in: ["APPROVED", "PENDING"] } },
      })
      if (approved >= division.maxTeams) {
        return apiBadRequest(`${division.name} is full (${division.maxTeams} teams max)`)
      }
    }

    // Team must not already be registered for this season
    const existing = await prisma.seasonRegistration.findUnique({
      where: { teamId_seasonId: { teamId, seasonId } },
      select: { id: true, status: true },
    })
    if (existing) {
      if (existing.status === "WITHDRAWN" || existing.status === "REJECTED") {
        // Re-register: update the existing record
        const reg = await prisma.seasonRegistration.update({
          where: { id: existing.id },
          data: {
            divisionId,
            status:       "PENDING",
            registeredAt: new Date(),
            reviewedAt:   null,
            reviewedBy:   null,
            notes:        null,
          },
          select: {
            id: true, status: true, registeredAt: true,
            division: { select: { id: true, name: true, tier: true } },
          },
        })
        return NextResponse.json(reg, { status: 201 })
      }
      return apiConflict("This team is already registered for this season")
    }

    const reg = await prisma.seasonRegistration.create({
      data: { teamId, seasonId, divisionId, status: "PENDING" },
      select: {
        id: true, status: true, registeredAt: true,
        division: { select: { id: true, name: true, tier: true } },
      },
    })

    return NextResponse.json(reg, { status: 201 })
  } catch (err) {
    return apiInternalError(err, "POST /api/seasons/:seasonId/registrations")
  }
}
