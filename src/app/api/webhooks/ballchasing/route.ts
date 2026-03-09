/**
 * /api/webhooks/ballchasing
 *
 * POST — receives parse result callbacks from ballchasing.com.
 *
 * ballchasing.com sends a POST with the replay object (same shape as
 * GET /api/v3/replays/:id) once parsing completes. We look up the
 * platform ReplayUpload by ballchasingId, transform the payload into
 * our ParseResult shape, and hand off to handleParseResult().
 *
 * Security: HMAC-SHA256 signature verified via X-Ballchasing-Signature header.
 * Set BALLCHASING_WEBHOOK_SECRET to the shared secret configured in the
 * ballchasing.com dashboard.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyWebhookSignature, toParseResult } from "@/lib/services/ballchasing.service"
import { handleParseResult } from "@/lib/services/replay.service"
import type { BallchasingReplay } from "@/lib/services/ballchasing.service"

export async function POST(req: Request) {
  // Read raw body for signature verification (must happen before .json())
  const rawBody = await req.text()
  const signature = req.headers.get("x-ballchasing-signature") ?? ""

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let payload: BallchasingReplay
  try {
    payload = JSON.parse(rawBody) as BallchasingReplay
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!payload.id) {
    return NextResponse.json({ error: "Missing replay id in payload" }, { status: 400 })
  }

  // Look up which ReplayUpload this belongs to
  const upload = await prisma.replayUpload.findUnique({
    where:  { ballchasingId: payload.id },
    select: { id: true, homeTeamColor: true },
  })

  if (!upload) {
    // Not one of ours (e.g. re-delivery after deletion) — ack and ignore
    return NextResponse.json({ received: true, matched: false })
  }

  const homeTeamColor =
    upload.homeTeamColor === "orange" ? "orange" : "blue"

  const result = toParseResult(payload, homeTeamColor)

  try {
    await handleParseResult(upload.id, result)
  } catch (err) {
    console.error("[webhooks/ballchasing] handleParseResult failed:", err)
    // Return 500 so ballchasing.com retries delivery
    return NextResponse.json({ error: "Internal processing error" }, { status: 500 })
  }

  return NextResponse.json({ received: true, matched: true })
}
