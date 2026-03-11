/**
 * replay.test.ts
 *
 * Tests for the replay parse pipeline.
 * Critical paths: SUCCESS, FAILED, MISMATCH detection, checkFastPath.
 */

import { describe, it, expect, vi, beforeEach } from "vitest"

// ---------------------------------------------------------------------------
// Mocks (hoisted above imports by Vitest)
// ---------------------------------------------------------------------------

vi.mock("@/lib/prisma", async () => {
  const { mockDeep } = await import("vitest-mock-extended")
  return { prisma: mockDeep() }
})
vi.mock("@/lib/email",            () => ({ sendParseFailedEmail: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/lib/services/standings.service", () => ({
  applyMatchToStandings: vi.fn().mockResolvedValue(undefined),
}))

import { prisma } from "@/lib/prisma"
import { mockReset, type DeepMockProxy } from "vitest-mock-extended"
import type { PrismaClient } from "@prisma/client"

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>

import { handleParseResult } from "@/lib/services/replay.service"

const BASE_UPLOAD = {
  id:               "upload-1",
  matchId:          "match-1",
  gameNumber:       1,
  fileKey:          "replays/game1.replay",
  uploadedById:     "user-1",
  uploadedByTeamId: "team-home",
  match: {
    homeTeam: { name: "Home FC" },
    awayTeam: { name: "Away FC" },
  },
}

describe("handleParseResult — FAILED", () => {
  beforeEach(() => mockReset(prismaMock))

  it("marks the upload as FAILED", async () => {
    prismaMock.replayUpload.findUnique.mockResolvedValue(BASE_UPLOAD as never)
    prismaMock.replayUpload.update.mockResolvedValue({} as never)
    prismaMock.user.findUnique.mockResolvedValue(null as never)

    await handleParseResult("upload-1", { status: "FAILED", errorMessage: "Bad replay file" })

    expect(prismaMock.replayUpload.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ parseStatus: "FAILED" }),
      })
    )
  })

  it("stores the error message", async () => {
    prismaMock.replayUpload.findUnique.mockResolvedValue(BASE_UPLOAD as never)
    prismaMock.replayUpload.update.mockResolvedValue({} as never)
    prismaMock.user.findUnique.mockResolvedValue(null as never)

    await handleParseResult("upload-1", { status: "FAILED", errorMessage: "Corrupt file" })

    const call = prismaMock.replayUpload.update.mock.calls[0][0]
    expect((call.data as Record<string, unknown>).parseError).toBe("Corrupt file")
  })

  it("uses fallback error message when none provided", async () => {
    prismaMock.replayUpload.findUnique.mockResolvedValue(BASE_UPLOAD as never)
    prismaMock.replayUpload.update.mockResolvedValue({} as never)
    prismaMock.user.findUnique.mockResolvedValue(null as never)

    await handleParseResult("upload-1", { status: "FAILED" })

    const call = prismaMock.replayUpload.update.mock.calls[0][0]
    expect((call.data as Record<string, unknown>).parseError).toBeTruthy()
  })
})

describe("handleParseResult — SUCCESS", () => {
  beforeEach(() => mockReset(prismaMock))

  it("marks the upload as SUCCESS", async () => {
    prismaMock.replayUpload.findUnique.mockResolvedValue(BASE_UPLOAD as never)
    // No manual MatchGame exists
    prismaMock.matchGame.findUnique.mockResolvedValue(null as never)
    prismaMock.replayUpload.update.mockResolvedValue({} as never)
    prismaMock.matchGame.upsert.mockResolvedValue({} as never)
    prismaMock.replayPlayerStat.deleteMany.mockResolvedValue({ count: 0 } as never)
    prismaMock.player.findMany.mockResolvedValue([] as never)
    prismaMock.replayPlayerStat.createMany.mockResolvedValue({ count: 0 } as never)
    prismaMock.match.update.mockResolvedValue({} as never)
    // checkFastPath
    prismaMock.match.findUnique.mockResolvedValue({
      status: "IN_PROGRESS", gamesExpected: 3, homeTeamId: "team-home", awayTeamId: "team-away",
    } as never)
    prismaMock.replayUpload.findMany.mockResolvedValue([] as never)

    await handleParseResult("upload-1", {
      status:    "SUCCESS",
      homeGoals: 3,
      awayGoals: 1,
      duration:  300,
    })

    const successUpdate = prismaMock.replayUpload.update.mock.calls.find(
      (c) => (c[0].data as Record<string, unknown>).parseStatus === "SUCCESS"
    )
    expect(successUpdate).toBeDefined()
  })

  it("upserts a MatchGame with source=REPLAY_AUTO", async () => {
    prismaMock.replayUpload.findUnique.mockResolvedValue(BASE_UPLOAD as never)
    prismaMock.matchGame.findUnique.mockResolvedValue(null as never)
    prismaMock.replayUpload.update.mockResolvedValue({} as never)
    prismaMock.matchGame.upsert.mockResolvedValue({} as never)
    prismaMock.replayPlayerStat.deleteMany.mockResolvedValue({ count: 0 } as never)
    prismaMock.player.findMany.mockResolvedValue([] as never)
    prismaMock.replayPlayerStat.createMany.mockResolvedValue({ count: 0 } as never)
    prismaMock.match.update.mockResolvedValue({} as never)
    prismaMock.match.findUnique.mockResolvedValue({
      status: "IN_PROGRESS", gamesExpected: 3, homeTeamId: "team-home", awayTeamId: "team-away",
    } as never)
    prismaMock.replayUpload.findMany.mockResolvedValue([] as never)

    await handleParseResult("upload-1", { status: "SUCCESS", homeGoals: 2, awayGoals: 0 })

    expect(prismaMock.matchGame.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ source: "REPLAY_AUTO" }),
      })
    )
  })
})

describe("handleParseResult — MISMATCH detection", () => {
  beforeEach(() => mockReset(prismaMock))

  it("marks upload as MISMATCH when scores conflict with manual entry", async () => {
    prismaMock.replayUpload.findUnique.mockResolvedValue(BASE_UPLOAD as never)
    // Manual entry exists with different score
    prismaMock.matchGame.findUnique.mockResolvedValue({
      source: "MANUAL", homeGoals: 2, awayGoals: 1,
    } as never)
    prismaMock.replayUpload.update.mockResolvedValue({} as never)
    prismaMock.dispute.upsert.mockResolvedValue({} as never)
    prismaMock.match.update.mockResolvedValue({} as never)

    await handleParseResult("upload-1", { status: "SUCCESS", homeGoals: 3, awayGoals: 0 })

    const mismatchUpdate = prismaMock.replayUpload.update.mock.calls.find(
      (c) => (c[0].data as Record<string, unknown>).parseStatus === "MISMATCH"
    )
    expect(mismatchUpdate).toBeDefined()
  })

  it("auto-creates a dispute on MISMATCH", async () => {
    prismaMock.replayUpload.findUnique.mockResolvedValue(BASE_UPLOAD as never)
    prismaMock.matchGame.findUnique.mockResolvedValue({
      source: "MANUAL", homeGoals: 1, awayGoals: 2,
    } as never)
    prismaMock.replayUpload.update.mockResolvedValue({} as never)
    prismaMock.dispute.upsert.mockResolvedValue({} as never)
    prismaMock.match.update.mockResolvedValue({} as never)

    await handleParseResult("upload-1", { status: "SUCCESS", homeGoals: 3, awayGoals: 0 })

    expect(prismaMock.dispute.upsert).toHaveBeenCalledOnce()
    expect(prismaMock.match.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "DISPUTED" } })
    )
  })

  it("does NOT create a dispute when scores match the manual entry", async () => {
    prismaMock.replayUpload.findUnique.mockResolvedValue(BASE_UPLOAD as never)
    // Scores match → no conflict
    prismaMock.matchGame.findUnique.mockResolvedValue({
      source: "MANUAL", homeGoals: 3, awayGoals: 1,
    } as never)
    prismaMock.replayUpload.update.mockResolvedValue({} as never)
    prismaMock.matchGame.upsert.mockResolvedValue({} as never)
    prismaMock.replayPlayerStat.deleteMany.mockResolvedValue({ count: 0 } as never)
    prismaMock.player.findMany.mockResolvedValue([] as never)
    prismaMock.replayPlayerStat.createMany.mockResolvedValue({ count: 0 } as never)
    prismaMock.match.update.mockResolvedValue({} as never)
    prismaMock.match.findUnique.mockResolvedValue({
      status: "IN_PROGRESS", gamesExpected: 3, homeTeamId: "team-home", awayTeamId: "team-away",
    } as never)
    prismaMock.replayUpload.findMany.mockResolvedValue([] as never)

    await handleParseResult("upload-1", { status: "SUCCESS", homeGoals: 3, awayGoals: 1 })

    expect(prismaMock.dispute.upsert).not.toHaveBeenCalled()
  })
})
