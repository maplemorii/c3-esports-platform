/**
 * validators.test.ts
 *
 * Tests for all Zod schemas that gate API inputs.
 * A bad schema means corrupt data in the DB — catch it here first.
 */

import { describe, it, expect } from "vitest"
import {
  CreateMatchSchema,
  SubmitResultSchema,
  StaffResultOverrideSchema,
  CreateDisputeSchema,
  ResolveDisputeSchema,
  CreateReplayUploadSchema,
} from "@/lib/validators/match.schema"
import { CreateTeamSchema } from "@/lib/validators/team.schema"

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function valid<T>(schema: { safeParse: (v: unknown) => { success: boolean; data?: T } }, input: unknown): T {
  const r = schema.safeParse(input)
  if (!r.success) throw new Error(`Expected valid, got invalid: ${JSON.stringify(input)}`)
  return r.data!
}

function invalid(schema: { safeParse: (v: unknown) => { success: boolean } }, input: unknown) {
  const r = schema.safeParse(input)
  expect(r.success).toBe(false)
}

// Two different valid CUIDs
const CUID_A = "cjld2cjxh0000qzrmn831i7rn"
const CUID_B = "cjld2cyuq0000t3rmniod1foy"

// ---------------------------------------------------------------------------
// CreateMatchSchema
// ---------------------------------------------------------------------------

describe("CreateMatchSchema", () => {
  const base = {
    divisionId: CUID_A,
    homeTeamId: CUID_A,
    awayTeamId: CUID_B,   // must differ from homeTeamId
  }

  it("accepts a minimal valid match", () => {
    const d = valid(CreateMatchSchema, base)
    expect(d.format).toBe("BO3")
    expect(d.matchType).toBe("REGULAR_SEASON")
  })

  it("rejects same homeTeamId and awayTeamId", () => {
    invalid(CreateMatchSchema, { ...base, awayTeamId: CUID_A })
  })

  it("rejects missing divisionId", () => {
    invalid(CreateMatchSchema, { ...base, divisionId: undefined })
  })

  it("rejects invalid format", () => {
    invalid(CreateMatchSchema, { ...base, format: "BO10" })
  })

  it("rejects non-CUID teamId", () => {
    invalid(CreateMatchSchema, { ...base, homeTeamId: "not-a-cuid" })
  })
})

// ---------------------------------------------------------------------------
// SubmitResultSchema — game array validation
// ---------------------------------------------------------------------------

describe("SubmitResultSchema", () => {
  const validGame = { gameNumber: 1, homeGoals: 3, awayGoals: 1 }

  it("accepts a valid BO3 game result", () => {
    const d = valid(SubmitResultSchema, { games: [validGame] })
    expect(d.games).toHaveLength(1)
  })

  it("rejects a drawn game (homeGoals === awayGoals)", () => {
    invalid(SubmitResultSchema, { games: [{ gameNumber: 1, homeGoals: 2, awayGoals: 2 }] })
  })

  it("rejects gameNumber above 7", () => {
    invalid(SubmitResultSchema, { games: [{ gameNumber: 8, homeGoals: 3, awayGoals: 1 }] })
  })

  it("rejects gameNumber 0", () => {
    invalid(SubmitResultSchema, { games: [{ gameNumber: 0, homeGoals: 3, awayGoals: 1 }] })
  })

  it("rejects negative goals", () => {
    invalid(SubmitResultSchema, { games: [{ gameNumber: 1, homeGoals: -1, awayGoals: 2 }] })
  })

  it("rejects empty games array", () => {
    invalid(SubmitResultSchema, { games: [] })
  })

  it("rejects duplicate game numbers", () => {
    invalid(SubmitResultSchema, {
      games: [
        { gameNumber: 1, homeGoals: 3, awayGoals: 1 },
        { gameNumber: 1, homeGoals: 2, awayGoals: 0 },
      ],
    })
  })

  it("defaults overtime to false", () => {
    const d = valid(SubmitResultSchema, { games: [validGame] })
    expect(d.games[0].overtime).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// StaffResultOverrideSchema
// ---------------------------------------------------------------------------

describe("StaffResultOverrideSchema", () => {
  it("accepts valid override with reason", () => {
    const d = valid(StaffResultOverrideSchema, {
      games:  [{ gameNumber: 1, homeGoals: 3, awayGoals: 2 }],
      reason: "Score dispute resolved",
    })
    expect(d.reason).toBe("Score dispute resolved")
  })

  it("rejects missing reason", () => {
    invalid(StaffResultOverrideSchema, {
      games: [{ gameNumber: 1, homeGoals: 3, awayGoals: 2 }],
    })
  })

  it("rejects empty reason", () => {
    invalid(StaffResultOverrideSchema, {
      games:  [{ gameNumber: 1, homeGoals: 3, awayGoals: 2 }],
      reason: "",
    })
  })
})

// ---------------------------------------------------------------------------
// CreateDisputeSchema
// ---------------------------------------------------------------------------

describe("CreateDisputeSchema", () => {
  it("accepts valid dispute", () => {
    const d = valid(CreateDisputeSchema, {
      matchId: CUID_A,
      reason:  "Opponent used illegal lineup",
    })
    expect(d.matchId).toBe(CUID_A)
  })

  it("rejects reason under 10 chars", () => {
    invalid(CreateDisputeSchema, { matchId: CUID_A, reason: "Short" })
  })

  it("rejects missing matchId", () => {
    invalid(CreateDisputeSchema, { reason: "Valid reason here long enough" })
  })

  it("accepts optional evidenceUrl", () => {
    const d = valid(CreateDisputeSchema, {
      matchId:     CUID_A,
      reason:      "Valid reason here that is long enough",
      evidenceUrl: "https://example.com/screenshot.png",
    })
    expect(d.evidenceUrl).toBe("https://example.com/screenshot.png")
  })

  it("rejects invalid evidenceUrl", () => {
    invalid(CreateDisputeSchema, {
      matchId:     CUID_A,
      reason:      "Valid reason here that is long enough",
      evidenceUrl: "not-a-url",
    })
  })
})

// ---------------------------------------------------------------------------
// ResolveDisputeSchema
// (resolution note + optional score correction — no status field)
// ---------------------------------------------------------------------------

describe("ResolveDisputeSchema", () => {
  it("accepts a resolution note", () => {
    const d = valid(ResolveDisputeSchema, { resolution: "Reviewed replay; original scores stand." })
    expect(d.resolution).toBe("Reviewed replay; original scores stand.")
  })

  it("accepts optional resolved scores", () => {
    const d = valid(ResolveDisputeSchema, {
      resolution:        "Corrected to actual replay scores.",
      resolvedHomeScore: 2,
      resolvedAwayScore: 1,
    })
    expect(d.resolvedHomeScore).toBe(2)
    expect(d.resolvedAwayScore).toBe(1)
  })

  it("rejects missing resolution", () => {
    invalid(ResolveDisputeSchema, {})
  })

  it("rejects empty resolution", () => {
    invalid(ResolveDisputeSchema, { resolution: "" })
  })

  it("rejects negative resolved scores", () => {
    invalid(ResolveDisputeSchema, { resolution: "Fixed.", resolvedHomeScore: -1 })
  })
})

// ---------------------------------------------------------------------------
// CreateReplayUploadSchema
// ---------------------------------------------------------------------------

describe("CreateReplayUploadSchema", () => {
  it("accepts valid replay upload", () => {
    const d = valid(CreateReplayUploadSchema, { gameNumber: 1, fileKey: "replays/abc.replay" })
    expect(d.gameNumber).toBe(1)
  })

  it("accepts optional homeTeamColor", () => {
    const d = valid(CreateReplayUploadSchema, {
      gameNumber: 2, fileKey: "replays/g2.replay", homeTeamColor: "blue",
    })
    expect(d.homeTeamColor).toBe("blue")
  })

  it("rejects invalid homeTeamColor", () => {
    invalid(CreateReplayUploadSchema, {
      gameNumber: 1, fileKey: "replays/abc.replay", homeTeamColor: "red",
    })
  })

  it("rejects gameNumber 0", () => {
    invalid(CreateReplayUploadSchema, { gameNumber: 0, fileKey: "replays/abc.replay" })
  })

  it("rejects missing fileKey", () => {
    invalid(CreateReplayUploadSchema, { gameNumber: 1 })
  })
})

// ---------------------------------------------------------------------------
// CreateTeamSchema
// ---------------------------------------------------------------------------

describe("CreateTeamSchema", () => {
  it("accepts a valid team", () => {
    const d = valid(CreateTeamSchema, { name: "Carolina Crushers" })
    expect(d.name).toBe("Carolina Crushers")
  })

  it("rejects team name under 2 chars", () => {
    invalid(CreateTeamSchema, { name: "X" })
  })

  it("rejects team name over 64 chars", () => {
    invalid(CreateTeamSchema, { name: "A".repeat(65) })
  })

  it("accepts optional primaryColor", () => {
    const d = valid(CreateTeamSchema, { name: "Test Team", primaryColor: "#ff0000" })
    expect(d.primaryColor).toBe("#ff0000")
  })
})
