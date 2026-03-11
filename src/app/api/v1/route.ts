/**
 * GET /api/v1
 *
 * Public — no auth required.
 * Returns a description of all available v1 endpoints and rate-limit policy.
 */

import { NextResponse } from "next/server"
import { v1RateLimit, attachRateLimitHeaders } from "@/lib/api/v1RateLimit"

export async function GET(req: Request) {
  const rl = await v1RateLimit(req)
  if (rl.blocked) return rl.blocked

  const base = new URL(req.url).origin

  const payload = {
    version:    "v1",
    baseUrl:    `${base}/api/v1`,
    rateLimit: {
      limit:      60,
      window:     "60s",
      scope:      "per IP address",
      headers:    ["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Window"],
    },
    endpoints: [
      {
        method:      "GET",
        path:        "/api/v1/seasons",
        description: "List all visible seasons",
        queryParams: ["status"],
      },
      {
        method:      "GET",
        path:        "/api/v1/seasons/:slug",
        description: "Single season with its divisions",
      },
      {
        method:      "GET",
        path:        "/api/v1/seasons/:slug/standings",
        description: "All division standings for a season (combined)",
      },
      {
        method:      "GET",
        path:        "/api/v1/matches",
        description: "Paginated match list",
        queryParams: ["divisionId", "weekId", "status", "teamId", "upcoming", "page", "limit"],
      },
      {
        method:      "GET",
        path:        "/api/v1/teams",
        description: "Paginated team list",
        queryParams: ["search", "seasonId", "page", "pageSize"],
      },
      {
        method:      "GET",
        path:        "/api/v1/teams/:slug",
        description: "Team profile with active roster",
      },
      {
        method:      "GET",
        path:        "/api/v1/players",
        description: "Paginated player list",
        queryParams: ["search", "page", "pageSize"],
      },
      {
        method:      "GET",
        path:        "/api/v1/players/:id",
        description: "Player profile with team membership history",
      },
    ],
  }

  return attachRateLimitHeaders(NextResponse.json(payload), rl.remaining)
}
