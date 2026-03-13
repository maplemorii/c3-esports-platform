/**
 * /api/teams/:teamId/invite
 *
 * POST   — team owner or STAFF+; generate a new invite token (valid 7 days)
 * DELETE — team owner or STAFF+; revoke the current token
 */

import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/session"
import { assertCanManageTeam } from "@/lib/auth/permissions"
import { apiNotFound, apiInternalError } from "@/lib/utils/errors"

// ---------------------------------------------------------------------------
// GET /api/teams/:teamId/invite — return current token status (owner/STAFF+)
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params

  const { session, error: authError } = await requireAuth()
  if (authError) return authError

  const denied = await assertCanManageTeam(session, teamId)
  if (denied) return denied

  try {
    const team = await prisma.team.findUnique({
      where:  { id: teamId, deletedAt: null },
      select: { inviteToken: true, inviteExpiresAt: true },
    })
    if (!team) return apiNotFound("Team")

    return NextResponse.json(team)
  } catch (err) {
    return apiInternalError(err, "GET /api/teams/:teamId/invite")
  }
}

// ---------------------------------------------------------------------------
// POST /api/teams/:teamId/invite
// ---------------------------------------------------------------------------

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params

  const { session, error: authError } = await requireAuth()
  if (authError) return authError

  const denied = await assertCanManageTeam(session, teamId)
  if (denied) return denied

  try {
    const team = await prisma.team.findUnique({
      where:  { id: teamId, deletedAt: null },
      select: { id: true },
    })
    if (!team) return apiNotFound("Team")

    const token     = randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const updated = await prisma.team.update({
      where: { id: teamId },
      data:  { inviteToken: token, inviteExpiresAt: expiresAt },
      select: { inviteToken: true, inviteExpiresAt: true },
    })

    return NextResponse.json(updated, { status: 201 })
  } catch (err) {
    return apiInternalError(err, "POST /api/teams/:teamId/invite")
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/teams/:teamId/invite
// ---------------------------------------------------------------------------

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params

  const { session, error: authError } = await requireAuth()
  if (authError) return authError

  const denied = await assertCanManageTeam(session, teamId)
  if (denied) return denied

  try {
    const team = await prisma.team.findUnique({
      where:  { id: teamId, deletedAt: null },
      select: { id: true },
    })
    if (!team) return apiNotFound("Team")

    await prisma.team.update({
      where: { id: teamId },
      data:  { inviteToken: null, inviteExpiresAt: null },
    })

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return apiInternalError(err, "DELETE /api/teams/:teamId/invite")
  }
}
