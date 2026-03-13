/**
 * /api/teams/:teamId/roster/:entryId
 *
 * DELETE — team owner or STAFF+; remove a player from the active roster
 *          Soft-removes by setting leftAt = now() and clearing activeDivisionId.
 *          The membership record is preserved for historical reference.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/session"
import { assertCanManageTeam } from "@/lib/auth/permissions"
import { hasMinRole } from "@/lib/roles"
import { apiNotFound, apiBadRequest, apiForbidden, apiInternalError } from "@/lib/utils/errors"

async function getRosterLockStatus(teamId: string): Promise<boolean> {
  const reg = await prisma.seasonRegistration.findFirst({
    where: {
      teamId,
      status: "APPROVED",
      season: { rosterLockAt: { lte: new Date() } },
    },
    select: { id: true },
  })
  return reg !== null
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string; entryId: string }> }
) {
  const { teamId, entryId } = await params

  // Auth
  const { session, error: authError } = await requireAuth()
  if (authError) return authError

  // Permission: owner or STAFF+
  const denied = await assertCanManageTeam(session, teamId)
  if (denied) return denied

  try {
    // Roster lock check — STAFF+ may bypass
    if (!hasMinRole(session.user.role, "STAFF")) {
      const locked = await getRosterLockStatus(teamId)
      if (locked) return apiForbidden("Roster is locked for the current season")
    }

    // Team must exist
    const team = await prisma.team.findUnique({
      where:  { id: teamId, deletedAt: null },
      select: { id: true },
    })
    if (!team) return apiNotFound("Team")

    // Entry must belong to this team and still be active
    const membership = await prisma.teamMembership.findUnique({
      where:  { id: entryId },
      select: { id: true, teamId: true, leftAt: true },
    })

    if (!membership || membership.teamId !== teamId) {
      return apiNotFound("Roster entry")
    }

    if (membership.leftAt !== null) {
      return apiBadRequest("This player has already been removed from the roster")
    }

    // Soft-remove: stamp leftAt, clear the division slot so the uniqueness index
    // no longer blocks the player from joining another team in the same division.
    await prisma.teamMembership.update({
      where: { id: entryId },
      data:  { leftAt: new Date(), activeDivisionId: null },
    })

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return apiInternalError(err, "DELETE /api/teams/:teamId/roster/:entryId")
  }
}
