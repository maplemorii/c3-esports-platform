/**
 * schedule.service.ts
 *
 * Round-robin schedule generation for league divisions.
 * Supports FULL_RR, PARTIAL_RR, and DOUBLE_RR modes using the circle method
 * (Berger tables) for fair opponent distribution.
 */

import { prisma } from "@/lib/prisma"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScheduleResult {
  matchesCreated: number
  rounds: number
  weeksAvailable: number
  fairnessScore: number
  byeWeeks: string[] // team IDs that receive a bye (if N is odd)
  preview: {
    teams: Array<{
      teamId: string
      teamName: string
      seed: number
      opponents: Array<{
        round: number
        opponentName: string
        opponentSeed: number
      }>
    }>
  }
}

// ---------------------------------------------------------------------------
// Circle method (Berger tables)
// ---------------------------------------------------------------------------

/**
 * Returns all N-1 rounds using the circle method.
 * teams: array of team IDs sorted by seed (seed 1 first).
 * Each round = array of [homeTeamId, awayTeamId] pairs.
 * "BYE" is used as a placeholder when N is odd; pairs containing "BYE" are excluded.
 */
export function circleMethodRounds(teams: string[]): [string, string][][] {
  const list = [...teams]
  if (list.length % 2 !== 0) {
    list.push("BYE")
  }
  const n = list.length
  const rounds: [string, string][][] = []

  // positions[0] is fixed; positions[1..n-1] rotate each round
  const positions = [...list]

  for (let r = 0; r < n - 1; r++) {
    const round: [string, string][] = []
    for (let i = 0; i < n / 2; i++) {
      const a = positions[i]
      const b = positions[n - 1 - i]
      // Skip bye pairs
      if (a === "BYE" || b === "BYE") continue
      // Alternate home/away by round index
      if (r % 2 === 0) {
        round.push([a, b])
      } else {
        round.push([b, a])
      }
    }
    rounds.push(round)

    // Rotate positions[1..n-1] right by 1
    const last = positions[n - 1]
    for (let i = n - 1; i > 1; i--) {
      positions[i] = positions[i - 1]
    }
    positions[1] = last
  }

  return rounds
}

// ---------------------------------------------------------------------------
// Fairness scoring
// ---------------------------------------------------------------------------

/**
 * Computes per-team seed-distribution fairness score.
 * Returns variance of "average opponent seed" across teams (lower = fairer).
 */
export function computeFairnessScore(
  rounds: [string, string][][],
  seedByTeamId: Map<string, number>
): number {
  // Build per-team list of opponent seeds
  const opponentSeeds = new Map<string, number[]>()

  for (const round of rounds) {
    for (const [home, away] of round) {
      if (home === "BYE" || away === "BYE") continue
      const homeSeed = seedByTeamId.get(home)
      const awaySeed = seedByTeamId.get(away)
      if (homeSeed === undefined || awaySeed === undefined) continue

      if (!opponentSeeds.has(home)) opponentSeeds.set(home, [])
      if (!opponentSeeds.has(away)) opponentSeeds.set(away, [])
      opponentSeeds.get(home)!.push(awaySeed)
      opponentSeeds.get(away)!.push(homeSeed)
    }
  }

  // Compute average opponent seed per team
  const avgSeeds: number[] = []
  for (const [, seeds] of opponentSeeds) {
    if (seeds.length === 0) continue
    avgSeeds.push(seeds.reduce((a, b) => a + b, 0) / seeds.length)
  }

  if (avgSeeds.length === 0) return 0

  // Variance of average opponent seeds
  const mean = avgSeeds.reduce((a, b) => a + b, 0) / avgSeeds.length
  const variance =
    avgSeeds.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / avgSeeds.length

  return Math.round(variance * 1000) / 1000
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function generateDivisionSchedule(
  divisionId: string,
  mode: "FULL_RR" | "PARTIAL_RR" | "DOUBLE_RR",
  preview: boolean
): Promise<ScheduleResult> {
  // ------------------------------------------------------------------
  // 1. Load division + season
  // ------------------------------------------------------------------
  const division = await prisma.division.findUnique({
    where: { id: divisionId },
    select: { id: true, seasonId: true, scheduleGeneratedAt: true },
  })
  if (!division) throw new Error(`Division ${divisionId} not found`)

  if (!preview && division.scheduleGeneratedAt) {
    throw new Error(
      "Schedule already generated. Clear it first before regenerating."
    )
  }

  // ------------------------------------------------------------------
  // 2. Get approved teams
  // ------------------------------------------------------------------
  const registrations = await prisma.seasonRegistration.findMany({
    where: { divisionId, status: "APPROVED" },
    include: { team: { select: { id: true, name: true } } },
    orderBy: { registeredAt: "asc" },
  })

  if (registrations.length < 2) {
    throw new Error("Need at least 2 approved teams to generate a schedule.")
  }

  const teams = registrations.map((r) => r.team)

  // ------------------------------------------------------------------
  // 3. Get or auto-assign seeds
  // ------------------------------------------------------------------
  const existingSeeds = await prisma.teamSeed.findMany({
    where: { divisionId },
    orderBy: { seed: "asc" },
  })

  const seedByTeamId = new Map<string, number>()
  const teamNameById = new Map<string, string>()

  for (const t of teams) {
    teamNameById.set(t.id, t.name)
  }

  if (existingSeeds.length > 0) {
    for (const s of existingSeeds) {
      seedByTeamId.set(s.teamId, s.seed)
    }
    // For any team without an explicit seed, append in registration order
    let nextSeed = existingSeeds.length + 1
    for (const t of teams) {
      if (!seedByTeamId.has(t.id)) {
        seedByTeamId.set(t.id, nextSeed++)
      }
    }
  } else {
    // Auto-assign seeds in registration order
    teams.forEach((t, i) => seedByTeamId.set(t.id, i + 1))
  }

  // Sort teams by seed for circle method
  const sortedTeams = [...teams].sort(
    (a, b) => (seedByTeamId.get(a.id) ?? 99) - (seedByTeamId.get(b.id) ?? 99)
  )
  const sortedIds = sortedTeams.map((t) => t.id)

  // ------------------------------------------------------------------
  // 4. Get league weeks
  // ------------------------------------------------------------------
  const leagueWeeks = await prisma.leagueWeek.findMany({
    where: { seasonId: division.seasonId },
    orderBy: { weekNumber: "asc" },
  })
  const weeksAvailable = leagueWeeks.length

  // ------------------------------------------------------------------
  // 5. Generate all N-1 rounds via circle method
  // ------------------------------------------------------------------
  const allRounds = circleMethodRounds(sortedIds)
  const nMinusOne = allRounds.length

  // Collect team IDs that get a bye (only relevant if odd number of teams)
  const byeTeamIds = new Set<string>()
  if (sortedIds.length % 2 !== 0) {
    for (const round of allRounds) {
      // The circle method excludes BYE pairs; find which team is missing each round
      const teamsInRound = new Set(round.flatMap(([h, a]) => [h, a]))
      for (const id of sortedIds) {
        if (!teamsInRound.has(id)) byeTeamIds.add(id)
      }
    }
  }

  // ------------------------------------------------------------------
  // 6. Select rounds based on mode
  // ------------------------------------------------------------------
  let selectedRounds: [string, string][][]

  if (mode === "FULL_RR") {
    if (nMinusOne > weeksAvailable) {
      console.warn(
        `[schedule] FULL_RR: need ${nMinusOne} weeks but only ${weeksAvailable} available. ` +
          `Truncating to ${weeksAvailable} rounds.`
      )
    }
    selectedRounds = allRounds.slice(0, Math.min(nMinusOne, weeksAvailable))
  } else if (mode === "PARTIAL_RR") {
    selectedRounds = allRounds.slice(0, Math.min(weeksAvailable, nMinusOne))
  } else {
    // DOUBLE_RR: N-1 rounds then repeat with home/away swapped
    const doubleRounds: [string, string][][] = [
      ...allRounds,
      ...allRounds.map((round) =>
        round.map(([home, away]) => [away, home] as [string, string])
      ),
    ]
    selectedRounds = doubleRounds.slice(0, weeksAvailable)
  }

  const totalMatchesPlanned = selectedRounds.reduce(
    (sum, r) => sum + r.length,
    0
  )

  const fairnessScore = computeFairnessScore(selectedRounds, seedByTeamId)

  // ------------------------------------------------------------------
  // 7. Build preview data
  // ------------------------------------------------------------------
  const opponentsByTeam = new Map<
    string,
    Array<{ round: number; opponentName: string; opponentSeed: number }>
  >()
  for (const id of sortedIds) opponentsByTeam.set(id, [])

  selectedRounds.forEach((round, roundIdx) => {
    for (const [home, away] of round) {
      opponentsByTeam.get(home)?.push({
        round: roundIdx + 1,
        opponentName: teamNameById.get(away) ?? away,
        opponentSeed: seedByTeamId.get(away) ?? 0,
      })
      opponentsByTeam.get(away)?.push({
        round: roundIdx + 1,
        opponentName: teamNameById.get(home) ?? home,
        opponentSeed: seedByTeamId.get(home) ?? 0,
      })
    }
  })

  const previewTeams = sortedTeams.map((t) => ({
    teamId: t.id,
    teamName: t.name,
    seed: seedByTeamId.get(t.id) ?? 0,
    opponents: opponentsByTeam.get(t.id) ?? [],
  }))

  const result: ScheduleResult = {
    matchesCreated: totalMatchesPlanned,
    rounds: selectedRounds.length,
    weeksAvailable,
    fairnessScore,
    byeWeeks: [...byeTeamIds],
    preview: { teams: previewTeams },
  }

  if (preview) return result

  // ------------------------------------------------------------------
  // 8. Write matches to DB
  // ------------------------------------------------------------------

  // Fetch existing SCHEDULED matches for idempotency check
  const existingMatches = await prisma.match.findMany({
    where: {
      divisionId,
      status: { in: ["SCHEDULED", "CHECKING_IN", "IN_PROGRESS"] },
      deletedAt: null,
    },
    select: { homeTeamId: true, awayTeamId: true },
  })
  const existingPairSet = new Set(
    existingMatches.flatMap((m) => [
      `${m.homeTeamId}:${m.awayTeamId}`,
      `${m.awayTeamId}:${m.homeTeamId}`,
    ])
  )

  let matchesCreated = 0
  const createOps: Promise<unknown>[] = []

  selectedRounds.forEach((round, roundIdx) => {
    const week = leagueWeeks[roundIdx]
    if (!week) return // no week slot available

    for (const [home, away] of round) {
      // Skip if a match between these teams already exists in any direction
      if (
        existingPairSet.has(`${home}:${away}`) ||
        existingPairSet.has(`${away}:${home}`)
      ) {
        continue
      }

      matchesCreated++
      createOps.push(
        prisma.match.create({
          data: {
            divisionId,
            homeTeamId: home,
            awayTeamId: away,
            leagueWeekId: week.id,
            format: "BO3",
            matchType: "REGULAR_SEASON",
            status: "SCHEDULED",
            scheduledAt: null,
          },
        })
      )
    }
  })

  await Promise.all(createOps)

  // Mark division as generated
  await prisma.division.update({
    where: { id: divisionId },
    data: {
      scheduleGeneratedAt: new Date(),
      scheduleMode: mode,
    },
  })

  return { ...result, matchesCreated }
}
