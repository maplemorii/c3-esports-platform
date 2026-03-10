/**
 * /api/cron/replays
 *
 * GET — called by Vercel Cron (or any scheduler) to poll ballchasing.com
 *        for replay parse results and retry any stale PENDING uploads.
 *
 * Auth: x-cron-secret header must match CRON_SECRET env var.
 *
 * Vercel cron.json entry (runs every minute):
 *   { "path": "/api/cron/replays", "schedule": "* * * * *" }
 *
 * Local dev: hit GET /api/cron/replays with the header to manually trigger.
 */

import { NextResponse } from "next/server"
import { CRON_AUTH_HEADER } from "@/lib/constants"
import { pollProcessingReplays } from "@/lib/services/replay.service"

export async function GET(req: Request) {
  // Authenticate the caller
  const secret = process.env.CRON_SECRET
  if (secret) {
    const provided = req.headers.get(CRON_AUTH_HEADER)
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const started = Date.now()

  try {
    const count = await pollProcessingReplays()
    return NextResponse.json({
      ok:        true,
      processed: count,
      durationMs: Date.now() - started,
    })
  } catch (err) {
    console.error("[cron/replays] poll failed:", err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
