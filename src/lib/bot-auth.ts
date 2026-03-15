/**
 * bot-auth.ts
 *
 * Validates that an incoming request is from the Discord bot.
 * All /api/bot/ routes call this before doing anything else.
 *
 * Usage:
 *   const authError = requireBotAuth(req)
 *   if (authError) return authError
 *
 * Set BOT_API_KEY in Railway env vars:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

import { NextRequest, NextResponse } from "next/server"

export function requireBotAuth(req: NextRequest): NextResponse | null {
  const key = process.env.BOT_API_KEY
  if (!key) {
    console.error("[bot-auth] BOT_API_KEY is not set")
    return NextResponse.json({ error: "Bot API not configured" }, { status: 503 })
  }

  const auth = req.headers.get("authorization")
  if (!auth || auth !== `Bearer ${key}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return null
}
