/**
 * DELETE /api/users/:userId
 *
 * - Own account:          any verified user may soft-delete themselves.
 * - Any account:          OWNER or DEVELOPER may hard-delete (permanent) or soft-delete.
 * - Query param ?hard=1:  OWNER/DEVELOPER only; permanently removes the row.
 *
 * Soft-delete sets deletedAt, invalidating all future sign-ins.
 * Hard-delete cascades via Prisma relations (Account, Session, Player, etc.).
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/session"
import { hasMinRole } from "@/lib/roles"
import { apiForbidden, apiNotFound, apiInternalError } from "@/lib/utils/errors"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const { userId } = await params
  const { session, error: authError } = await requireAuth()
  if (authError) return authError

  const isSelf     = session.user.id === userId
  const isPowerful = hasMinRole(session.user.role, "OWNER")

  if (!isSelf && !isPowerful) return apiForbidden()

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, deletedAt: true, emailVerified: true },
  })
  if (!target) return apiNotFound("User")

  // Regular users must have a verified email to delete their own account
  if (isSelf && !isPowerful && !target.emailVerified) {
    return NextResponse.json(
      { error: "Verify your email before deleting your account." },
      { status: 403 },
    )
  }

  const hard = isPowerful && req.nextUrl.searchParams.get("hard") === "1"

  try {
    if (hard) {
      // Permanent removal — Prisma cascades handle related rows
      await prisma.user.delete({ where: { id: userId } })
      return NextResponse.json({ ok: true, deleted: "hard" })
    }

    // Soft-delete: set deletedAt, clear session tokens so they can't sign in again
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data:  { deletedAt: new Date() },
      })
      // Invalidate all active sessions
      await tx.session.deleteMany({ where: { userId } })
    })

    return NextResponse.json({ ok: true, deleted: "soft" })
  } catch (err) {
    return apiInternalError(err, "DELETE /api/users/:userId")
  }
}
