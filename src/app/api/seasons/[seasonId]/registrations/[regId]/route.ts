/**
 * /api/seasons/:seasonId/registrations/:regId
 *
 * DELETE — team owner or STAFF+; withdraw a registration
 *           Only PENDING or WAITLISTED registrations can be withdrawn.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/session"
import { assertCanManageTeam } from "@/lib/auth/permissions"
import { apiNotFound, apiBadRequest, apiInternalError } from "@/lib/utils/errors"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ seasonId: string; regId: string }> }
) {
  const { seasonId, regId } = await params

  const { session, error: authError } = await requireAuth()
  if (authError) return authError

  try {
    const reg = await prisma.seasonRegistration.findUnique({
      where:  { id: regId },
      select: { id: true, teamId: true, seasonId: true, status: true },
    })
    if (!reg || reg.seasonId !== seasonId) return apiNotFound("Registration")

    // Permission: must manage the team
    const denied = await assertCanManageTeam(session, reg.teamId)
    if (denied) return denied

    if (!["PENDING", "WAITLISTED"].includes(reg.status)) {
      return apiBadRequest(
        reg.status === "APPROVED"
          ? "Approved registrations cannot be withdrawn — contact staff"
          : "This registration cannot be withdrawn"
      )
    }

    await prisma.seasonRegistration.update({
      where: { id: regId },
      data:  { status: "WITHDRAWN" },
    })

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return apiInternalError(err, "DELETE /api/seasons/:seasonId/registrations/:regId")
  }
}
