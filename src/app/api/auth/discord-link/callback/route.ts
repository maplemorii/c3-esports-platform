/**
 * GET /api/auth/discord-link/callback
 *
 * Handles the redirect back from Discord OAuth.
 * Exchanges the authorization code for a token, fetches the Discord username,
 * and saves it to the authenticated user's player profile.
 *
 * Redirects:
 *   /profile?discord=linked      — success
 *   /profile?error=discord_*     — failure
 */

import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

const BASE_URL    = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
const REDIRECT_URI = `${BASE_URL}/api/auth/discord-link/callback`

const DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token"
const DISCORD_USER_URL  = "https://discord.com/api/users/@me"

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.redirect(new URL("/auth/signin", BASE_URL))

  const { searchParams } = req.nextUrl
  const code  = searchParams.get("code")
  const error = searchParams.get("error")

  if (error || !code) {
    console.error("[discord-link] OAuth error:", error)
    return NextResponse.redirect(new URL("/profile?error=discord_denied", BASE_URL))
  }

  const clientId     = process.env.DISCORD_LINK_CLIENT_ID ?? process.env.DISCORD_CLIENT_ID!
  const clientSecret = process.env.DISCORD_LINK_CLIENT_SECRET ?? process.env.DISCORD_CLIENT_SECRET!

  // ── 1. Exchange code for access token ──────────────────────────────────────
  const tokenRes = await fetch(DISCORD_TOKEN_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     clientId,
      client_secret: clientSecret,
      grant_type:    "authorization_code",
      code,
      redirect_uri:  REDIRECT_URI,
    }),
  })

  if (!tokenRes.ok) {
    console.error("[discord-link] token exchange failed:", await tokenRes.text())
    return NextResponse.redirect(new URL("/profile?error=discord_token", BASE_URL))
  }

  const tokenData = await tokenRes.json() as { access_token: string }

  // ── 2. Fetch Discord user ───────────────────────────────────────────────────
  const userRes = await fetch(DISCORD_USER_URL, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })

  if (!userRes.ok) {
    console.error("[discord-link] user fetch failed:", await userRes.text())
    return NextResponse.redirect(new URL("/profile?error=discord_user", BASE_URL))
  }

  const discordUser = await userRes.json() as { username: string; discriminator: string }

  // Build display name: new usernames have discriminator "0", legacy have #1234
  const discordUsername =
    discordUser.discriminator === "0"
      ? discordUser.username
      : `${discordUser.username}#${discordUser.discriminator}`

  // ── 3. Check if already linked to another account ──────────────────────────
  const existing = await prisma.player.findFirst({
    where:  { discordUsername },
    select: { userId: true },
  })
  if (existing && existing.userId !== session.user.id) {
    return NextResponse.redirect(new URL("/profile?error=discord_taken", BASE_URL))
  }

  // ── 4. Require existing player profile ─────────────────────────────────────
  const player = await prisma.player.findUnique({
    where:  { userId: session.user.id, deletedAt: null },
    select: { id: true },
  })
  if (!player) {
    return NextResponse.redirect(new URL("/profile/setup?error=no_profile", BASE_URL))
  }

  // ── 5. Save Discord username ────────────────────────────────────────────────
  await prisma.player.update({
    where: { id: player.id },
    data:  { discordUsername },
  })

  return NextResponse.redirect(new URL("/profile?discord=linked", BASE_URL))
}
