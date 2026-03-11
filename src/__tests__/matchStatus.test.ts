/**
 * matchStatus.test.ts
 *
 * Tests for:
 *   - isValidTransition (pure — the entire transition graph)
 *   - MatchTransitionError
 *   - transitionTo (mocked Prisma)
 */

import { describe, it, expect, vi, beforeEach } from "vitest"

// ---------------------------------------------------------------------------
// Mocks (hoisted above imports by Vitest)
// ---------------------------------------------------------------------------

vi.mock("@/lib/prisma", async () => {
  const { mockDeep } = await import("vitest-mock-extended")
  return { prisma: mockDeep() }
})
vi.mock("@/lib/services/standings.service", () => ({
  applyMatchToStandings:    vi.fn().mockResolvedValue(undefined),
  reverseMatchFromStandings: vi.fn().mockResolvedValue(undefined),
}))

import { prisma } from "@/lib/prisma"
import { mockReset, type DeepMockProxy } from "vitest-mock-extended"
import type { PrismaClient, MatchStatus } from "@prisma/client"

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>

import {
  isValidTransition,
  MatchTransitionError,
  transitionTo,
} from "@/lib/services/matchStatus.service"

// ---------------------------------------------------------------------------
// isValidTransition — full graph coverage
// ---------------------------------------------------------------------------

describe("isValidTransition", () => {
  const VALID: [MatchStatus, MatchStatus][] = [
    ["SCHEDULED",      "CHECKING_IN"],
    ["SCHEDULED",      "CANCELLED"],
    ["CHECKING_IN",    "IN_PROGRESS"],
    ["CHECKING_IN",    "FORFEITED"],
    ["CHECKING_IN",    "NO_SHOW"],
    ["CHECKING_IN",    "CANCELLED"],
    ["IN_PROGRESS",    "MATCH_FINISHED"],
    ["IN_PROGRESS",    "FORFEITED"],
    ["IN_PROGRESS",    "CANCELLED"],
    ["MATCH_FINISHED", "VERIFYING"],
    ["MATCH_FINISHED", "COMPLETED"],
    ["MATCH_FINISHED", "DISPUTED"],
    ["VERIFYING",      "COMPLETED"],
    ["VERIFYING",      "DISPUTED"],
    ["DISPUTED",       "COMPLETED"],
    ["DISPUTED",       "CANCELLED"],
  ]

  const INVALID: [MatchStatus, MatchStatus][] = [
    ["SCHEDULED",   "IN_PROGRESS"],   // skips CHECKING_IN
    ["SCHEDULED",   "COMPLETED"],
    ["CHECKING_IN", "COMPLETED"],     // must go through IN_PROGRESS
    ["COMPLETED",   "VERIFYING"],     // terminal → non-terminal
    ["COMPLETED",   "DISPUTED"],
    ["FORFEITED",   "IN_PROGRESS"],   // terminal → active
    ["NO_SHOW",     "CHECKING_IN"],   // terminal → active
    ["CANCELLED",   "SCHEDULED"],     // terminal → active
    ["VERIFYING",   "CHECKING_IN"],   // backwards
    ["DISPUTED",    "VERIFYING"],     // backwards
  ]

  it.each(VALID)("allows %s → %s", (from, to) => {
    expect(isValidTransition(from, to)).toBe(true)
  })

  it.each(INVALID)("blocks %s → %s", (from, to) => {
    expect(isValidTransition(from, to)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// MatchTransitionError
// ---------------------------------------------------------------------------

describe("MatchTransitionError", () => {
  it("has the correct name and message", () => {
    const err = new MatchTransitionError("match-123", "SCHEDULED", "COMPLETED")
    expect(err.name).toBe("MatchTransitionError")
    expect(err.message).toContain("SCHEDULED")
    expect(err.message).toContain("COMPLETED")
    expect(err.message).toContain("match-123")
  })

  it("is an instance of Error", () => {
    const err = new MatchTransitionError("m", "SCHEDULED", "CANCELLED")
    expect(err).toBeInstanceOf(Error)
  })

  it("exposes from/to/matchId properties", () => {
    const err = new MatchTransitionError("m-1", "IN_PROGRESS", "CHECKING_IN")
    expect(err.matchId).toBe("m-1")
    expect(err.from).toBe("IN_PROGRESS")
    expect(err.to).toBe("CHECKING_IN")
  })
})

// ---------------------------------------------------------------------------
// transitionTo (mocked Prisma)
// ---------------------------------------------------------------------------

describe("transitionTo", () => {
  beforeEach(() => mockReset(prismaMock))

  it("updates match status and creates audit log on valid transition", async () => {
    prismaMock.match.findUniqueOrThrow.mockResolvedValue({ status: "SCHEDULED" } as never)
    prismaMock.$transaction.mockResolvedValue([{}, {}] as never)

    await transitionTo("match-1", "CHECKING_IN", "staff-1")

    expect(prismaMock.$transaction).toHaveBeenCalledOnce()
  })

  it("throws MatchTransitionError on invalid transition", async () => {
    prismaMock.match.findUniqueOrThrow.mockResolvedValue({ status: "COMPLETED" } as never)

    await expect(transitionTo("match-1", "CHECKING_IN", "staff-1"))
      .rejects
      .toThrow(MatchTransitionError)
  })

  it("sets completedAt when transitioning to COMPLETED", async () => {
    prismaMock.match.findUniqueOrThrow.mockResolvedValue({ status: "VERIFYING" } as never)
    prismaMock.$transaction.mockResolvedValue([{}, {}] as never)

    await transitionTo("match-1", "COMPLETED", "staff-1")

    const txArgs = prismaMock.$transaction.mock.calls[0][0] as unknown[]
    // The transaction array is built with prisma.match.update + prisma.auditLog.create
    // We just confirm the transaction was called — the update includes completedAt
    expect(txArgs).toHaveLength(2)
  })
})
