/**
 * GET /api/auth/discord-link
 *   Initiates Discord OAuth 2.0 for account linking (saves username to player profile).
 *   Callback at /api/auth/discord-link/callback.
 *
 * DELETE /api/auth/discord-link
 *   Removes the Discord username from the authenticated user's player profile.
 *
 * Required env vars:
 *   DISCORD_LINK_CLIENT_ID, DISCORD_LINK_CLIENT_SECRET, NEXTAUTH_URL
 *   (use separate app credentials from the NextAuth Discord provider to avoid conflicts)
 */

import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

const BASE_URL    = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
const REDIRECT_URI = `${BASE_URL}/api/auth/discord-link/callback`

export async function GET() {
  const clientId = process.env.DISCORD_LINK_CLIENT_ID ?? process.env.DISCORD_CLIENT_ID
  if (!clientId) {
    console.error("[discord-link] DISCORD_LINK_CLIENT_ID is not set")
    return NextResponse.redirect(new URL("/profile?error=discord_config", BASE_URL))
  }

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  REDIRECT_URI,
    response_type: "code",
    scope:         "identify",
  })

  return NextResponse.redirect(
    `https://discord.com/api/oauth2/authorize?${params.toString()}`
  )
}

export async function DELETE() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const player = await prisma.player.findUnique({
    where:  { userId: session.user.id, deletedAt: null },
    select: { id: true },
  })
  if (!player) return NextResponse.json({ error: "No player profile" }, { status: 404 })

  await prisma.player.update({
    where: { id: player.id },
    data:  { discordUsername: null },
  })

  return NextResponse.json({ ok: true })
}
