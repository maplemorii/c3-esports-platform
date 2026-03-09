/**
 * GET /api/auth/steam/callback
 *
 * Handles the return from Steam's OpenID login.
 * Verifies the assertion, extracts the 17-digit SteamID64, and saves it
 * to the authenticated user's player profile.
 *
 * Redirects:
 *   /profile?steam=linked        — success
 *   /profile?error=steam_*       — various failure modes
 */

import { type NextRequest, NextResponse } from "next/server"
import { RelyingParty } from "openid"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

const BASE_URL   = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
const RETURN_URL = `${BASE_URL}/api/auth/steam/callback`

// Extracts SteamID64 from Steam's claimed_id URL:
// https://steamcommunity.com/openid/id/76561198000000000
const STEAM_ID_REGEX = /\/openid\/id\/(\d{17})$/

export async function GET(req: NextRequest) {
  // Must be logged in first
  const session = await getSession()
  if (!session) {
    return NextResponse.redirect(new URL("/login", BASE_URL))
  }

  // Verify the OpenID assertion
  const party = new RelyingParty(RETURN_URL, BASE_URL, true, false, [])

  const steamId = await new Promise<string | null>((resolve) => {
    party.verifyAssertion(req.url, (err, result) => {
      if (err || !result?.authenticated) {
        console.error("[steam] verifyAssertion failed:", err)
        resolve(null)
        return
      }
      const match = result.claimedIdentifier?.match(STEAM_ID_REGEX)
      resolve(match ? match[1] : null)
    })
  })

  if (!steamId) {
    return NextResponse.redirect(new URL("/profile?error=steam_verify", BASE_URL))
  }

  // Check this Steam ID isn't already linked to a different account
  const existing = await prisma.player.findUnique({
    where:  { steamId },
    select: { userId: true },
  })
  if (existing && existing.userId !== session.user.id) {
    return NextResponse.redirect(new URL("/profile?error=steam_taken", BASE_URL))
  }

  // Require an existing player profile to link to
  const player = await prisma.player.findUnique({
    where:  { userId: session.user.id, deletedAt: null },
    select: { id: true },
  })
  if (!player) {
    return NextResponse.redirect(new URL("/profile/setup?error=no_profile", BASE_URL))
  }

  // Save the Steam ID
  await prisma.player.update({
    where: { id: player.id },
    data:  { steamId },
  })

  return NextResponse.redirect(new URL("/profile?steam=linked", BASE_URL))
}
