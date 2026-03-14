/**
 * /api/admin/seasons/[seasonId]/divisions/[divisionId]/seeds
 *
 * GET  — returns current seed assignments for the division
 * POST — upserts seeds
 *
 * Auth: STAFF+
 */

import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/session"

// ---------------------------------------------------------------------------
// GET — return current seed assignments (auto-assigns from registration order
//       if no TeamSeed rows exist yet)
// ---------------------------------------------------------------------------

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ seasonId: string; divisionId: string }> }
) {
  const { error } = await requireRole("STAFF")
  if (error) return error

  const { divisionId } = await params

  // Verify division exists
  const division = await prisma.division.findUnique({
    where: { id: divisionId },
    select: { id: true },
  })
  if (!division) {
    return NextResponse.json({ error: "Division not found" }, { status: 404 })
  }

  // Get approved registrations for this division
  const registrations = await prisma.seasonRegistration.findMany({
    where: { divisionId, status: "APPROVED" },
    include: { team: { select: { id: true, name: true } } },
    orderBy: { registeredAt: "asc" },
  })

  // Get existing seeds
  const existingSeeds = await prisma.teamSeed.findMany({
    where: { divisionId },
    orderBy: { seed: "asc" },
  })

  const seedMap = new Map(existingSeeds.map((s) => [s.teamId, s.seed]))

  // If no seeds assigned yet, derive from registration order
  if (existingSeeds.length === 0) {
    registrations.forEach((r, i) => seedMap.set(r.team.id, i + 1))
  }

  const seeds = registrations.map((r) => ({
    teamId: r.team.id,
    teamName: r.team.name,
    seed: seedMap.get(r.team.id) ?? null,
    registeredAt: r.registeredAt,
  }))

  return NextResponse.json({ seeds })
}

// ---------------------------------------------------------------------------
// POST — upsert seeds
// ---------------------------------------------------------------------------

const UpsertSeedsSchema = z.object({
  seeds: z
    .array(
      z.object({
        teamId: z.string().min(1),
        seed: z.number().int().min(1),
      })
    )
    .min(1),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ seasonId: string; divisionId: string }> }
) {
  const { error } = await requireRole("STAFF")
  if (error) return error

  const { divisionId } = await params

  // Verify division exists
  const division = await prisma.division.findUnique({
    where: { id: divisionId },
    select: { id: true },
  })
  if (!division) {
    return NextResponse.json({ error: "Division not found" }, { status: 404 })
  }

  // Parse body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = UpsertSeedsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const { seeds } = parsed.data

  // Validate: no duplicate seeds
  const seedValues = seeds.map((s) => s.seed)
  if (new Set(seedValues).size !== seedValues.length) {
    return NextResponse.json(
      { error: "Duplicate seed values are not allowed" },
      { status: 400 }
    )
  }

  // Validate: no duplicate teamIds
  const teamIds = seeds.map((s) => s.teamId)
  if (new Set(teamIds).size !== teamIds.length) {
    return NextResponse.json(
      { error: "Duplicate teamIds are not allowed" },
      { status: 400 }
    )
  }

  // Validate: all teamIds are APPROVED in this division
  const approvedRegs = await prisma.seasonRegistration.findMany({
    where: { divisionId, status: "APPROVED" },
    select: { teamId: true },
  })
  const approvedTeamIds = new Set(approvedRegs.map((r) => r.teamId))

  for (const { teamId } of seeds) {
    if (!approvedTeamIds.has(teamId)) {
      return NextResponse.json(
        { error: `Team ${teamId} is not an approved member of this division` },
        { status: 400 }
      )
    }
  }

  // Upsert all seeds in a transaction
  await prisma.$transaction(
    seeds.map(({ teamId, seed }) =>
      prisma.teamSeed.upsert({
        where: { divisionId_teamId: { divisionId, teamId } },
        create: { divisionId, teamId, seed },
        update: { seed },
      })
    )
  )

  return NextResponse.json({ ok: true, updated: seeds.length })
}
