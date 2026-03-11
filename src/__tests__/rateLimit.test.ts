/**
 * rateLimit.test.ts
 *
 * Tests for the in-memory fallback rate limiter (Redis path not tested here
 * since it requires a real Redis connection; use integration tests for that).
 *
 * Strategy: mock Redis to return null so the in-memory path runs every time.
 */

import { describe, it, expect, vi, beforeEach } from "vitest"

// Force in-memory path by making getRedis() return null
vi.mock("@/lib/redis", () => ({ getRedis: () => null, withRedis: vi.fn() }))
vi.mock("@/lib/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}))

import { rateLimit, rateLimitResponse } from "@/lib/rateLimit"

function makeReq(ip = "1.2.3.4"): Request {
  return new Request("http://localhost/api/test", {
    headers: { "x-forwarded-for": ip },
  })
}

describe("rateLimit (in-memory)", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it("allows requests under the limit", async () => {
    const req = makeReq("10.0.0.1")
    const res = await rateLimit(req, "test:allow", 5, 60)
    expect(res.success).toBe(true)
    expect(res.remaining).toBe(4)
  })

  it("blocks the (limit+1)th request", async () => {
    const req = makeReq("10.0.0.2")
    const ns = "test:block"
    for (let i = 0; i < 3; i++) {
      await rateLimit(req, ns, 3, 60)
    }
    const blocked = await rateLimit(req, ns, 3, 60)
    expect(blocked.success).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.retryAfter).toBeGreaterThan(0)
  })

  it("different IPs get separate buckets", async () => {
    const ns = "test:separate"
    const limit = 2

    // Exhaust IP A
    await rateLimit(makeReq("10.0.1.1"), ns, limit, 60)
    await rateLimit(makeReq("10.0.1.1"), ns, limit, 60)
    const blockedA = await rateLimit(makeReq("10.0.1.1"), ns, limit, 60)
    expect(blockedA.success).toBe(false)

    // IP B should still be fine
    const allowedB = await rateLimit(makeReq("10.0.1.2"), ns, limit, 60)
    expect(allowedB.success).toBe(true)
  })

  it("allows requests again after the window expires", async () => {
    const req = makeReq("10.0.0.3")
    const ns = "test:expire"
    const limit = 2

    await rateLimit(req, ns, limit, 1) // 1s window
    await rateLimit(req, ns, limit, 1)
    const blocked = await rateLimit(req, ns, limit, 1)
    expect(blocked.success).toBe(false)

    // Advance time past the window
    vi.advanceTimersByTime(1100)

    const allowed = await rateLimit(req, ns, limit, 1)
    expect(allowed.success).toBe(true)
  })

  it("keys by userId when provided", async () => {
    const req = makeReq("same-ip")
    const ns = "test:userid"
    const limit = 1

    // Different user IDs → separate buckets
    const r1 = await rateLimit(req, ns, limit, 60, "user-A")
    const r2 = await rateLimit(req, ns, limit, 60, "user-B")
    expect(r1.success).toBe(true)
    expect(r2.success).toBe(true)

    // Same user ID → blocked on second attempt
    const r3 = await rateLimit(req, ns, limit, 60, "user-A")
    expect(r3.success).toBe(false)
  })
})

describe("rateLimitResponse", () => {
  it("returns 429 status", () => {
    const res = rateLimitResponse(30)
    expect(res.status).toBe(429)
  })

  it("includes Retry-After header", () => {
    const res = rateLimitResponse(45)
    expect(res.headers.get("Retry-After")).toBe("45")
  })

  it("includes X-RateLimit-Remaining: 0 header", () => {
    const res = rateLimitResponse(10)
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0")
  })
})
