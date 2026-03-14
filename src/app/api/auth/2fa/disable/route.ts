/**
 * POST /api/auth/2fa/disable
 * Body: { totp: string }
 *
 * Requires a valid TOTP code to disable 2FA (prevents accidental/unauthorized disabling).
 */

import { NextResponse } from "next/server"
import { verifySync } from "otplib"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/session"

export async function POST(req: Request) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { totp } = await req.json().catch(() => ({}))
  if (!totp || typeof totp !== "string") {
    return NextResponse.json({ error: "TOTP code required" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id, deletedAt: null },
    select: { id: true, twoFactorSecret: true, twoFactorEnabled: true },
  })

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  if (!user.twoFactorEnabled || !user.twoFactorSecret) {
    return NextResponse.json({ error: "2FA is not enabled" }, { status: 400 })
  }

  const result = verifySync({ token: totp.replace(/\s/g, ""), secret: user.twoFactorSecret })
  if (!result.valid) return NextResponse.json({ error: "Invalid code" }, { status: 422 })

  await prisma.user.update({
    where: { id: user.id },
    data:  { twoFactorEnabled: false, twoFactorSecret: null },
  })

  return NextResponse.json({ ok: true })
}
