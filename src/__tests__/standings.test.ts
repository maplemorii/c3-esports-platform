/**
 * standings.test.ts
 *
 * Tests for:
 *   - parsePointsConfig (pure)
 *   - nextStreak (pure)
 *   - sortStandingsWithH2H (pure — the most critical standings logic)
 *   - applyMatchToStandings / reverseMatchFromStandings (Prisma-mocked)
 */

import { describe, it, expect, vi, beforeEach } from "vitest"

// ---------------------------------------------------------------------------
// Mocks (hoisted above imports by Vitest)
// ---------------------------------------------------------------------------

vi.mock("@/lib/prisma", async () => {
  const { mockDeep } = await import("vitest-mock-extended")
  return { prisma: mockDeep() }
})
vi.mock("@/lib/cache/standings", () => ({
  invalidateStandingsCache: vi.fn().mockResolvedValue(undefined),
}))

import { prisma } from "@/lib/prisma"
import { mockReset, type DeepMockProxy } from "vitest-mock-extended"
import type { PrismaClient } from "@prisma/client"

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>

import {
  parsePointsConfig,
  nextStreak,
  applyMatchToStandings,
  reverseMatchFromStandings,
} from "@/lib/services/standings.service"
import { sortStandingsWithH2H } from "@/types/standings"
import type { StandingsRow } from "@/types/standings"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRow(teamId: string, points: number, overrides: Partial<StandingsRow> = {}): StandingsRow {
  return {
    id: teamId, rank: 0, teamId,
    team: { id: teamId, name: teamId, slug: teamId, logoUrl: null },
    wins: 0, losses: 0, matchesPlayed: 0, forfeitWins: 0, forfeitLosses: 0,
    gamesWon: 0, gamesLost: 0, gameDifferential: 0,
    goalsFor: 0, goalsAgainst: 0, goalDifferential: 0,
    points, winPct: 0, streak: 0, h2h: [],
    lastUpdated: new Date().toISOString(),
    ...overrides,
  }
}

const baseEntry = (teamId: string) => ({
  id: teamId, divisionId: "div-1", teamId,
  wins: 0, losses: 0, matchesPlayed: 0, forfeitWins: 0, forfeitLosses: 0,
  gamesWon: 0, gamesLost: 0, gameDifferential: 0, goalsFor: 0, goalsAgainst: 0,
  goalDifferential: 0, points: 0, winPct: 0, streak: 0, lastUpdated: new Date(),
})

const baseH2H = (teamId: string, opponentId: string) => ({
  id: `${teamId}-${opponentId}`, divisionId: "div-1", teamId, opponentId,
  wins: 0, losses: 0, gamesWon: 0, gamesLost: 0, points: 0, lastUpdated: new Date(),
})

// ---------------------------------------------------------------------------
// parsePointsConfig
// ---------------------------------------------------------------------------

describe("parsePointsConfig", () => {
  it("returns defaults when input is null", () =>
    expect(parsePointsConfig(null)).toEqual({ win: 3, loss: 0, forfeitWin: 3, forfeitLoss: 0 }))

  it("returns defaults when input is undefined", () =>
    expect(parsePointsConfig(undefined)).toEqual({ win: 3, loss: 0, forfeitWin: 3, forfeitLoss: 0 }))

  it("merges partial config with defaults", () =>
    expect(parsePointsConfig({ win: 2 })).toEqual({ win: 2, loss: 0, forfeitWin: 3, forfeitLoss: 0 }))

  it("fully overrides all fields", () => {
    const cfg = { win: 3, loss: 1, forfeitWin: 3, forfeitLoss: -1 }
    expect(parsePointsConfig(cfg)).toEqual(cfg)
  })

  it("ignores non-object values", () => {
    expect(parsePointsConfig("bad")).toEqual({ win: 3, loss: 0, forfeitWin: 3, forfeitLoss: 0 })
  })
})

// ---------------------------------------------------------------------------
// nextStreak
// ---------------------------------------------------------------------------

describe("nextStreak", () => {
  it("starts a win streak from 0",               () => expect(nextStreak(0, true)).toBe(1))
  it("starts a loss streak from 0",              () => expect(nextStreak(0, false)).toBe(-1))
  it("extends an existing win streak",           () => expect(nextStreak(3, true)).toBe(4))
  it("extends an existing loss streak",          () => expect(nextStreak(-2, false)).toBe(-3))
  it("resets to 1 on win after loss streak",     () => expect(nextStreak(-4, true)).toBe(1))
  it("resets to -1 on loss after win streak",    () => expect(nextStreak(5, false)).toBe(-1))
})

// ---------------------------------------------------------------------------
// sortStandingsWithH2H
// ---------------------------------------------------------------------------

describe("sortStandingsWithH2H", () => {
  it("sorts by points descending (no ties)", () => {
    const rows = [makeRow("C", 3), makeRow("A", 9), makeRow("B", 6)]
    expect(sortStandingsWithH2H(rows).map((r) => r.teamId)).toEqual(["A", "B", "C"])
  })

  it("returns empty array unchanged", () => expect(sortStandingsWithH2H([])).toEqual([]))

  it("returns single-row array unchanged", () => {
    const rows = [makeRow("A", 9)]
    expect(sortStandingsWithH2H(rows)).toEqual(rows)
  })

  it("breaks point ties using H2H points", () => {
    const rows = [
      makeRow("B", 6, { h2h: [{ opponentId: "A", wins: 0, losses: 1, gamesWon: 0, gamesLost: 2, points: 0 }] }),
      makeRow("A", 6, { h2h: [{ opponentId: "B", wins: 1, losses: 0, gamesWon: 2, gamesLost: 0, points: 3 }] }),
    ]
    expect(sortStandingsWithH2H(rows).map((r) => r.teamId)).toEqual(["A", "B"])
  })

  it("breaks H2H ties using H2H game differential", () => {
    const rows = [
      makeRow("B", 6, { h2h: [{ opponentId: "A", wins: 1, losses: 1, gamesWon: 2, gamesLost: 3, points: 3 }] }),
      makeRow("A", 6, { h2h: [{ opponentId: "B", wins: 1, losses: 1, gamesWon: 3, gamesLost: 2, points: 3 }] }),
    ]
    expect(sortStandingsWithH2H(rows).map((r) => r.teamId)).toEqual(["A", "B"])
  })

  it("falls through to overall game differential", () => {
    const rows = [makeRow("B", 6, { gameDifferential: 1 }), makeRow("A", 6, { gameDifferential: 3 })]
    expect(sortStandingsWithH2H(rows).map((r) => r.teamId)).toEqual(["A", "B"])
  })

  it("only uses H2H from tied teams (not higher-point teams)", () => {
    const rows = [
      makeRow("C", 9),
      makeRow("A", 6, {
        gameDifferential: 1,
        h2h: [
          { opponentId: "B", wins: 0, losses: 1, gamesWon: 0, gamesLost: 2, points: 0 },
          { opponentId: "C", wins: 1, losses: 0, gamesWon: 2, gamesLost: 0, points: 3 }, // should be ignored
        ],
      }),
      makeRow("B", 6, {
        gameDifferential: 2,
        h2h: [{ opponentId: "A", wins: 1, losses: 0, gamesWon: 2, gamesLost: 0, points: 3 }],
      }),
    ]
    const sorted = sortStandingsWithH2H(rows)
    expect(sorted.map((r) => r.teamId)).toEqual(["C", "B", "A"])
  })

  it("does not mutate the original array", () => {
    const rows = [makeRow("B", 6), makeRow("A", 9)]
    const ids = rows.map((r) => r.teamId)
    sortStandingsWithH2H(rows)
    expect(rows.map((r) => r.teamId)).toEqual(ids)
  })
})

// ---------------------------------------------------------------------------
// applyMatchToStandings (mocked Prisma)
// ---------------------------------------------------------------------------

describe("applyMatchToStandings", () => {
  beforeEach(() => mockReset(prismaMock))

  const baseMatch = {
    divisionId: "div-1", homeTeamId: "team-home", awayTeamId: "team-away",
    homeScore: 2, awayScore: 1, winnerId: "team-home", status: "COMPLETED",
    division: { seasonId: "season-1", season: { pointsConfig: null } },
  }

  it("awards 3 points and 1 win to home team", async () => {
    prismaMock.match.findUniqueOrThrow.mockResolvedValue(baseMatch as never)
    prismaMock.standingEntry.upsert
      .mockResolvedValueOnce(baseEntry("team-home") as never)
      .mockResolvedValueOnce(baseEntry("team-away") as never)
    prismaMock.headToHeadRecord.upsert
      .mockResolvedValueOnce(baseH2H("team-home", "team-away") as never)
      .mockResolvedValueOnce(baseH2H("team-away", "team-home") as never)
    prismaMock.standingEntry.update.mockResolvedValue({} as never)
    prismaMock.headToHeadRecord.update.mockResolvedValue({} as never)

    await applyMatchToStandings("match-1")

    const homeUpdate = prismaMock.standingEntry.update.mock.calls.find(
      (c) => (c[0].data as Record<string, unknown>).wins === 1
    )
    expect(homeUpdate).toBeDefined()
    expect((homeUpdate![0].data as Record<string, unknown>).points).toBe(3)
  })

  it("gives 1 loss and 0 points to away team", async () => {
    prismaMock.match.findUniqueOrThrow.mockResolvedValue(baseMatch as never)
    prismaMock.standingEntry.upsert
      .mockResolvedValueOnce(baseEntry("team-home") as never)
      .mockResolvedValueOnce(baseEntry("team-away") as never)
    prismaMock.headToHeadRecord.upsert
      .mockResolvedValueOnce(baseH2H("team-home", "team-away") as never)
      .mockResolvedValueOnce(baseH2H("team-away", "team-home") as never)
    prismaMock.standingEntry.update.mockResolvedValue({} as never)
    prismaMock.headToHeadRecord.update.mockResolvedValue({} as never)

    await applyMatchToStandings("match-1")

    const awayUpdate = prismaMock.standingEntry.update.mock.calls.find(
      (c) => (c[0].data as Record<string, unknown>).losses === 1
    )
    expect(awayUpdate).toBeDefined()
    expect((awayUpdate![0].data as Record<string, unknown>).points).toBe(0)
  })

  it("gives both teams forfeitLoss on NO_SHOW", async () => {
    prismaMock.match.findUniqueOrThrow.mockResolvedValue({ ...baseMatch, status: "NO_SHOW", winnerId: null } as never)
    prismaMock.standingEntry.upsert.mockResolvedValue(baseEntry("team-home") as never)
    prismaMock.standingEntry.update.mockResolvedValue({} as never)

    await applyMatchToStandings("match-1")

    const forfeitCalls = prismaMock.standingEntry.update.mock.calls.filter(
      (c) => (c[0].data as Record<string, unknown>).forfeitLosses === 1
    )
    expect(forfeitCalls).toHaveLength(2)
  })

  it("awards forfeitWin to winner on FORFEITED", async () => {
    prismaMock.match.findUniqueOrThrow.mockResolvedValue(
      { ...baseMatch, status: "FORFEITED", winnerId: "team-home" } as never
    )
    prismaMock.standingEntry.upsert.mockResolvedValue(baseEntry("team-home") as never)
    prismaMock.standingEntry.update.mockResolvedValue({} as never)

    await applyMatchToStandings("match-1")

    const winCall = prismaMock.standingEntry.update.mock.calls.find(
      (c) => (c[0].data as Record<string, unknown>).forfeitWins === 1
    )
    expect(winCall).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// reverseMatchFromStandings (mocked Prisma)
// ---------------------------------------------------------------------------

describe("reverseMatchFromStandings", () => {
  beforeEach(() => mockReset(prismaMock))

  it("subtracts win and points from home team", async () => {
    prismaMock.match.findUniqueOrThrow.mockResolvedValue({
      divisionId: "div-1", homeTeamId: "team-home", awayTeamId: "team-away",
      homeScore: 2, awayScore: 1, winnerId: "team-home", status: "COMPLETED",
      division: { seasonId: "season-1", season: { pointsConfig: null } },
    } as never)
    prismaMock.standingEntry.upsert.mockResolvedValue({
      ...baseEntry("team-home"), wins: 2, points: 6, streak: 2,
    } as never)
    prismaMock.headToHeadRecord.upsert.mockResolvedValue({
      ...baseH2H("team-home", "team-away"), wins: 1, points: 3,
    } as never)
    prismaMock.standingEntry.update.mockResolvedValue({} as never)
    prismaMock.headToHeadRecord.update.mockResolvedValue({} as never)

    await reverseMatchFromStandings("match-1")

    // wins: 2 + (-1) = 1
    const homeUpdate = prismaMock.standingEntry.update.mock.calls.find(
      (c) => (c[0].data as Record<string, unknown>).wins === 1
    )
    expect(homeUpdate).toBeDefined()
    // points: 6 + (-3) = 3
    expect((homeUpdate![0].data as Record<string, unknown>).points).toBe(3)
  })
})
