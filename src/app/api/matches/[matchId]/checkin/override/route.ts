/**
 * /api/matches/:matchId/checkin/override
 *
 * POST — STAFF+; force check-in a specific team
 */

import { NextResponse } from "next/server"
import { requireRole } from "@/lib/session"
import { forceCheckIn } from "@/lib/services/checkin.service"
import { ForceCheckInSchema } from "@/lib/validators/match.schema"
import { parseBody, handleServiceError } from "@/lib/utils/errors"

type Params = { params: Promise<{ matchId: string }> }

export async function POST(req: Request, { params }: Params) {
  const { session, error } = await requireRole("STAFF")
  if (error) return error

  const { matchId } = await params

  const { data, error: bodyError } = await parseBody(req, ForceCheckInSchema)
  if (bodyError) return bodyError

  try {
    await forceCheckIn(matchId, data.teamId, session.user.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleServiceError(err, "POST /checkin/override")
  }
}
