/**
 * /api/divisions/:divisionId/standings/recalculate
 *
 * POST — STAFF+; triggers a full standings recalculation for the division,
 *        replaying every COMPLETED / FORFEITED match from scratch.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/session"
import { recalculateStandings } from "@/lib/services/standings.service"
import { apiNotFound, handleServiceError } from "@/lib/utils/errors"

type Params = { params: Promise<{ divisionId: string }> }

export async function POST(_req: Request, { params }: Params) {
  const { error } = await requireRole("STAFF")
  if (error) return error

  const { divisionId } = await params

  const division = await prisma.division.findUnique({
    where:  { id: divisionId },
    select: { id: true },
  })
  if (!division) return apiNotFound("Division")

  try {
    await recalculateStandings(divisionId)
    return NextResponse.json({ recalculated: true, divisionId })
  } catch (err) {
    return handleServiceError(err, "POST /standings/recalculate")
  }
}
