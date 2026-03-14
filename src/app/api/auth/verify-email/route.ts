/**
 * GET /api/auth/verify-email?token=<raw>
 *
 * Verifies the raw token against its SHA-256 hash stored on the user row.
 * On success, sets emailVerified and clears the token fields.
 * Redirects to /dashboard with a query param indicating success or failure.
 */

import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")
  if (!token) {
    return NextResponse.redirect(new URL("/dashboard?verified=invalid", req.url))
  }

  const hash = crypto.createHash("sha256").update(token).digest("hex")

  const user = await prisma.user.findFirst({
    where: {
      emailVerifyToken:   hash,
      emailVerifyExpires: { gt: new Date() },
      deletedAt: null,
    },
    select: { id: true },
  })

  if (!user) {
    return NextResponse.redirect(new URL("/dashboard?verified=invalid", req.url))
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified:      new Date(),
      emailVerifyToken:   null,
      emailVerifyExpires: null,
    },
  })

  return NextResponse.redirect(new URL("/dashboard?verified=1", req.url))
}
