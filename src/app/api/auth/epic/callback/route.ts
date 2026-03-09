/**
 * GET /api/auth/epic/callback
 *
 * Handles the redirect back from Epic Games OAuth.
 * Exchanges the authorization code for tokens, fetches the Epic display name,
 * and saves it to the authenticated user's player profile.
 *
 * Redirects:
 *   /profile?epic=linked        — success
 *   /profile?error=epic_*       — failure
 */

import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

const BASE_URL     = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
const REDIRECT_URI = `${BASE_URL}/api/auth/epic/callback`

const EPIC_TOKEN_URL   = "https://api.epicgames.dev/epic/oauth/v2/token"
const EPIC_ACCOUNT_URL = "https://api.epicgames.dev/epic/id/v2/accounts"

export async function GET(req: NextRequest) {
  // Must be logged in
  const session = await getSession()
  if (!session) return NextResponse.redirect(new URL("/login", BASE_URL))

  const { searchParams } = req.nextUrl
  const code  = searchParams.get("code")
  const error = searchParams.get("error")

  if (error || !code) {
    console.error("[epic] OAuth error:", error)
    return NextResponse.redirect(new URL("/profile?error=epic_denied", BASE_URL))
  }

  const clientId     = process.env.EPIC_CLIENT_ID!
  const clientSecret = process.env.EPIC_CLIENT_SECRET!

  // ── 1. Exchange code for access token ─────────────────────────────────────
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const tokenRes = await fetch(EPIC_TOKEN_URL, {
    method:  "POST",
    headers: {
      "Authorization": `Basic ${basicAuth}`,
      "Content-Type":  "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type:   "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  })

  if (!tokenRes.ok) {
    console.error("[epic] token exchange failed:", await tokenRes.text())
    return NextResponse.redirect(new URL("/profile?error=epic_token", BASE_URL))
  }

  const tokenData = await tokenRes.json() as { access_token: string; account_id: string }

  // ── 2. Fetch Epic display name ─────────────────────────────────────────────
  const accountRes = await fetch(
    `${EPIC_ACCOUNT_URL}?accountId=${tokenData.account_id}`,
    { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
  )

  if (!accountRes.ok) {
    console.error("[epic] account fetch failed:", await accountRes.text())
    return NextResponse.redirect(new URL("/profile?error=epic_account", BASE_URL))
  }

  const accounts = await accountRes.json() as Array<{ displayName?: string }>
  const displayName = accounts[0]?.displayName

  if (!displayName) {
    return NextResponse.redirect(new URL("/profile?error=epic_no_name", BASE_URL))
  }

  // ── 3. Check if username is already linked to another account ─────────────
  const existing = await prisma.player.findFirst({
    where:  { epicUsername: displayName },
    select: { userId: true },
  })
  if (existing && existing.userId !== session.user.id) {
    return NextResponse.redirect(new URL("/profile?error=epic_taken", BASE_URL))
  }

  // ── 4. Require existing player profile ────────────────────────────────────
  const player = await prisma.player.findUnique({
    where:  { userId: session.user.id, deletedAt: null },
    select: { id: true },
  })
  if (!player) {
    return NextResponse.redirect(new URL("/profile/setup?error=no_profile", BASE_URL))
  }

  // ── 5. Save Epic username ──────────────────────────────────────────────────
  await prisma.player.update({
    where: { id: player.id },
    data:  { epicUsername: displayName },
  })

  return NextResponse.redirect(new URL("/profile?epic=linked", BASE_URL))
}
