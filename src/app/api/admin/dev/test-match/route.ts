/**
 * POST /api/admin/dev/test-match
 *
 * Creates a minimal IN_PROGRESS match for testing replay uploads and match
 * flows without needing to run the seed script or set up a full season.
 *
 * - Finds or creates a throwaway season, division, and two test teams
 * - Returns the match ID and a direct link to the match page
 * - Requires ADMIN role
 * - Safe to call multiple times — creates a fresh match each time
 *
 * DELETE /api/admin/dev/test-match
 *   Deletes all matches (and teams/season) created by this endpoint (slug: "dev-test-*")
 */

import { NextResponse } from "next/server"
import { requireRole } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import {
  MatchFormat,
  MatchType,
  MatchStatus,
  SeasonStatus,
  DivisionTier,
  BracketType,
  RegistrationStatus,
} from "@prisma/client"

const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000"

export async function POST() {
  const { error } = await requireRole("ADMIN")
  if (error) return error

  // ── Season ────────────────────────────────────────────────────────────────
  const season = await prisma.season.upsert({
    where:  { slug: "dev-test-season" },
    update: { status: SeasonStatus.ACTIVE },
    create: {
      slug:              "dev-test-season",
      name:              "[DEV] Test Season",
      status:            SeasonStatus.ACTIVE,
      isVisible:         false,
      registrationStart: new Date(),
      registrationEnd:   new Date(),
      startDate:         new Date(),
      endDate:           new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      leagueWeeks:       4,
    },
  })

  // ── Division ──────────────────────────────────────────────────────────────
  const division = await prisma.division.upsert({
    where:  { seasonId_name: { seasonId: season.id, name: "Dev Division" } },
    update: {},
    create: {
      seasonId:    season.id,
      name:        "Dev Division",
      tier:        DivisionTier.CHALLENGERS,
      bracketType: BracketType.DOUBLE_ELIMINATION,
      maxTeams:    8,
    },
  })

  // ── Teams ─────────────────────────────────────────────────────────────────
  const teamA = await prisma.team.upsert({
    where:  { slug: "dev-test-team-a" },
    update: {},
    create: {
      slug:         "dev-test-team-a",
      name:         "[DEV] Team A",
      ownerId:      (await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } }))!.id,
      primaryColor: "#C41C35",
    },
  })

  const teamB = await prisma.team.upsert({
    where:  { slug: "dev-test-team-b" },
    update: {},
    create: {
      slug:         "dev-test-team-b",
      name:         "[DEV] Team B",
      ownerId:      (await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } }))!.id,
      primaryColor: "#1e3a8a",
    },
  })

  // ── Registrations ─────────────────────────────────────────────────────────
  for (const teamId of [teamA.id, teamB.id]) {
    await prisma.seasonRegistration.upsert({
      where:  { teamId_seasonId: { teamId, seasonId: season.id } },
      update: { status: RegistrationStatus.APPROVED, divisionId: division.id },
      create: { teamId, seasonId: season.id, divisionId: division.id, status: RegistrationStatus.APPROVED },
    })
  }

  // ── Match (always fresh) ──────────────────────────────────────────────────
  const match = await prisma.match.create({
    data: {
      divisionId:    division.id,
      homeTeamId:    teamA.id,
      awayTeamId:    teamB.id,
      format:        MatchFormat.BO3,
      matchType:     MatchType.REGULAR_SEASON,
      status:        MatchStatus.IN_PROGRESS,
      scheduledAt:   new Date(),
      gamesExpected: 3,
    },
  })

  return NextResponse.json({
    ok:      true,
    matchId: match.id,
    url:     `${APP_URL}/matches/${match.id}`,
  })
}

export async function DELETE() {
  const { error } = await requireRole("ADMIN")
  if (error) return error

  // Delete test matches
  const season = await prisma.season.findUnique({ where: { slug: "dev-test-season" } })
  if (!season) return NextResponse.json({ ok: true, deleted: 0 })

  const divisions = await prisma.division.findMany({ where: { seasonId: season.id }, select: { id: true } })
  const divIds = divisions.map(d => d.id)

  const { count } = await prisma.match.deleteMany({
    where: { divisionId: { in: divIds }, deletedAt: null },
  })

  return NextResponse.json({ ok: true, deleted: count })
}
