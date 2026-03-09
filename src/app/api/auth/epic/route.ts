/**
 * GET /api/auth/epic
 *   Initiates Epic Games OAuth 2.0 for account linking.
 *   Redirects to Epic's authorization page.
 *   Callback at /api/auth/epic/callback.
 *
 * DELETE /api/auth/epic
 *   Removes the Epic username from the authenticated user's player profile.
 *
 * Required env vars:
 *   EPIC_CLIENT_ID, EPIC_CLIENT_SECRET, NEXTAUTH_URL
 */

import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

const BASE_URL    = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
const REDIRECT_URI = `${BASE_URL}/api/auth/epic/callback`

export async function GET() {
  const clientId = process.env.EPIC_CLIENT_ID
  if (!clientId) {
    console.error("[epic] EPIC_CLIENT_ID is not set")
    return NextResponse.redirect(new URL("/profile?error=epic_config", BASE_URL))
  }

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  REDIRECT_URI,
    response_type: "code",
    scope:         "basic_profile",
  })

  return NextResponse.redirect(
    `https://www.epicgames.com/id/authorize?${params.toString()}`
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
    data:  { epicUsername: null },
  })

  return NextResponse.json({ ok: true })
}
