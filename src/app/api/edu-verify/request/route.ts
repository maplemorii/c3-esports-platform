/**
 * POST /api/edu-verify/request
 * Authenticated. Submits a .edu email and sends a verification link.
 * Can be called again to re-send (generates a new token, invalidates the old one).
 */
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { z } from "zod"
import crypto from "node:crypto"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/session"
import { sendEduVerificationEmail } from "@/lib/email"
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit"
import { logger, logRequest } from "@/lib/logger"

// Accepts .edu TLDs — also handles country .edu variants (edu.au, edu.cn, etc.)
const EDU_REGEX = /\.edu(\.[a-z]{2})?$/i

const RequestSchema = z.object({
  eduEmail: z
    .string()
    .email("Must be a valid email address.")
    .refine((e) => EDU_REGEX.test(e), {
      message: "Must be a .edu email address.",
    }),
})

export async function POST(req: Request) {
  const t = Date.now()

  const { session, error } = await requireAuth()
  if (error) return error

  // 3 verification emails per user per hour
  const rl = await rateLimit(req, "edu-verify", 3, 3600, session.user.id)
  if (!rl.success) return rateLimitResponse(rl.retryAfter)

  const body = await req.json().catch(() => null)
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    logRequest(req, 400, t, { userId: session.user.id })
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { eduEmail } = parsed.data

  // Check if this .edu email is already verified on another account
  const conflict = await prisma.user.findFirst({
    where: {
      eduEmail,
      eduEmailVerified: { not: null },
      id: { not: session.user.id },
      deletedAt: null,
    },
  })
  if (conflict) {
    logRequest(req, 409, t, { userId: session.user.id, eduEmail })
    return NextResponse.json(
      { error: "This college email is already verified on another account." },
      { status: 409 }
    )
  }

  // Generate a cryptographically random token
  const rawToken = crypto.randomBytes(32).toString("hex")
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex")
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

  // Fetch current user name for the email
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true },
  })

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      eduEmail,
      eduEmailVerified: null,   // reset if re-sending
      eduVerifyToken: hashedToken,
      eduVerifyExpires: expires,
    },
  })

  await sendEduVerificationEmail({
    to: eduEmail,
    token: rawToken,
    name: user?.name ?? "there",
  })

  logger.info({ userId: session.user.id, eduEmail }, "Edu verification email sent")
  logRequest(req, 200, t, { userId: session.user.id })
  return NextResponse.json({ success: true })
}
