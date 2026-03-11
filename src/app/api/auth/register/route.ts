/**
 * POST /api/auth/register
 * Create a new account with email + password.
 * The account is incomplete until the user also links Discord and an Epic Games username.
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { rateLimit, rateLimitResponse } from "@/lib/rateLimit"
import { logger, logRequest } from "@/lib/logger"

const RegisterSchema = z.object({
  name: z.string().min(2).max(64),
  email: z.email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
})

export async function POST(req: Request) {
  const t = Date.now()

  // 5 registration attempts per IP per hour
  const rl = await rateLimit(req, "auth:register", 5, 3600)
  if (!rl.success) return rateLimitResponse(rl.retryAfter)

  const body = await req.json().catch(() => null)
  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) {
    logRequest(req, 400, t)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, email, password } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    logRequest(req, 409, t, { email })
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: { name, email, password: hashedPassword },
  })

  logger.info({ email }, "New user registered")
  logRequest(req, 201, t)
  return NextResponse.json({ success: true }, { status: 201 })
}
