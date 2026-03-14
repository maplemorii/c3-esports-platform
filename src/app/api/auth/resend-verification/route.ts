/**
 * POST /api/auth/resend-verification
 *
 * Resends the account verification email. Rate-limited to once per 5 minutes
 * by checking emailVerifyExpires (if it was issued < 5 min ago, reject).
 */

import { NextResponse } from "next/server"
import crypto from "node:crypto"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/session"
import { sendEmailVerificationEmail } from "@/lib/email"

export async function POST() {
  const { session, error } = await requireAuth()
  if (error) return error

  const user = await prisma.user.findUnique({
    where: { id: session.user.id, deletedAt: null },
    select: { id: true, email: true, name: true, emailVerified: true, emailVerifyExpires: true },
  })

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  if (user.emailVerified) return NextResponse.json({ error: "Email already verified" }, { status: 400 })

  // Rate-limit: if a token was issued in the last 5 minutes, refuse
  if (user.emailVerifyExpires) {
    const issuedAt = new Date(user.emailVerifyExpires.getTime() - 24 * 60 * 60 * 1000)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    if (issuedAt > fiveMinutesAgo) {
      return NextResponse.json({ error: "Please wait before requesting another email." }, { status: 429 })
    }
  }

  const raw  = crypto.randomBytes(32).toString("hex")
  const hash = crypto.createHash("sha256").update(raw).digest("hex")

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerifyToken:   hash,
      emailVerifyExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  })

  await sendEmailVerificationEmail(user.email, user.name, raw)

  return NextResponse.json({ ok: true })
}
