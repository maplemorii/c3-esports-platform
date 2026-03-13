/**
 * PATCH /api/admin/users/:userId/disable
 *
 * Soft-ban a user: sets deletedAt (soft delete) and kills all active sessions.
 * Passing { disabled: false } reinstates the account.
 * ADMIN only.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/session"

type Ctx = { params: Promise<{ userId: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { userId } = await params

  const { session, error: authError } = await requireRole("ADMIN")
  if (authError) return authError

  // Prevent an admin from disabling themselves
  if (session.user.id === userId) {
    return NextResponse.json({ error: "You cannot disable your own account." }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const disable: boolean = body.disabled !== false // default to disabling

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  })
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 })

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data:  { deletedAt: disable ? new Date() : null },
    }),
    // Kill all sessions when disabling
    ...(disable ? [prisma.session.deleteMany({ where: { userId } })] : []),
  ])

  return NextResponse.json({ ok: true, disabled: disable })
}
