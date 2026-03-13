/**
 * POST /api/beta-access
 *
 * Validates the beta password and sets an httpOnly access cookie.
 * Always returns 200 to avoid password enumeration timing.
 */

import { NextRequest, NextResponse } from "next/server"

const BETA_COOKIE = "beta_access"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

function expectedToken(): string {
  const secret = process.env.BETA_TOKEN_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev"
  return Buffer.from(`beta:${secret}`).toString("base64url")
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const password: string = typeof body.password === "string" ? body.password.trim() : ""

  const betaPassword = process.env.BETA_PASSWORD ?? ""
  const valid = betaPassword.length > 0 && safeEqual(password, betaPassword)

  if (!valid) {
    // Deliberate 600ms delay to slow brute-force attempts
    await new Promise((r) => setTimeout(r, 600))
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(BETA_COOKIE, expectedToken(), {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge:   COOKIE_MAX_AGE,
    path:     "/",
  })
  return res
}
