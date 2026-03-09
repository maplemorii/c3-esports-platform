/**
 * /api/matches/:matchId/replays/:gameNumber/reparse
 *
 * GET — STAFF+; re-triggers ballchasing.com parsing for a FAILED replay slot.
 *       Uses GET per the checklist convention (staff action via link/button).
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/session"
import { retriggerParse } from "@/lib/services/replay.service"
import { apiNotFound, handleServiceError } from "@/lib/utils/errors"

type Params = { params: Promise<{ matchId: string; gameNumber: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { session, error } = await requireRole("STAFF")
  if (error) return error

  const { matchId, gameNumber: gameNumberStr } = await params
  const gameNumber = parseInt(gameNumberStr, 10)

  if (isNaN(gameNumber) || gameNumber < 1) {
    return NextResponse.json({ error: "gameNumber must be a positive integer" }, { status: 400 })
  }

  const upload = await prisma.replayUpload.findUnique({
    where:  { matchId_gameNumber: { matchId, gameNumber } },
    select: { id: true, parseStatus: true },
  })
  if (!upload) return apiNotFound(`Replay for game ${gameNumber}`)

  try {
    await retriggerParse(upload.id, session.user.id)
    return NextResponse.json({ message: "Re-parse triggered", replayUploadId: upload.id })
  } catch (err) {
    return handleServiceError(err, "GET /reparse")
  }
}
