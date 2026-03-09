/**
 * GET /api/auth/steam
 *   Initiates a Steam OpenID 2.0 login flow for account linking.
 *   Redirects to Steam login; callback at /api/auth/steam/callback.
 *
 * DELETE /api/auth/steam
 *   Removes the Steam ID from the authenticated user's player profile.
 */

import { NextResponse } from "next/server"
import { RelyingParty } from "openid"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

const BASE_URL    = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
const RETURN_URL  = `${BASE_URL}/api/auth/steam/callback`

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
    data:  { steamId: null },
  })

  return NextResponse.json({ ok: true })
}

export async function GET() {
  const party = new RelyingParty(RETURN_URL, BASE_URL, /* stateless */ true, false, [])

  return new Promise<NextResponse>((resolve) => {
    party.authenticate("https://steamcommunity.com/openid", false, (err, authUrl) => {
      if (err || !authUrl) {
        console.error("[steam] authenticate error:", err)
        resolve(NextResponse.redirect(new URL("/profile?error=steam_init", BASE_URL)))
        return
      }
      resolve(NextResponse.redirect(authUrl))
    })
  })
}
