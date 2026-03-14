/**
 * POST /api/auth/2fa/setup
 *
 * Generates a new TOTP secret for the authenticated user and returns:
 *   - secret (base32)
 *   - otpauthUrl (for QR code generation on the client)
 *
 * The secret is saved immediately but twoFactorEnabled stays false until
 * the user calls /api/auth/2fa/enable with a valid code.
 */

import { NextResponse } from "next/server"
import { generateSecret, generateURI } from "otplib"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/session"

const APP_NAME = "C3 Esports"

export async function POST() {
  const { session, error } = await requireAuth()
  if (error) return error

  const user = await prisma.user.findUnique({
    where: { id: session.user.id, deletedAt: null },
    select: { id: true, email: true, twoFactorEnabled: true, password: true },
  })

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  if (!user.password) {
    return NextResponse.json({ error: "2FA is only available for email/password accounts" }, { status: 400 })
  }
  if (user.twoFactorEnabled) {
    return NextResponse.json({ error: "2FA is already enabled" }, { status: 400 })
  }

  const secret     = generateSecret()
  const otpauthUrl = generateURI({ issuer: APP_NAME, label: user.email, secret })

  await prisma.user.update({
    where: { id: user.id },
    data:  { twoFactorSecret: secret },
  })

  return NextResponse.json({ secret, otpauthUrl })
}
