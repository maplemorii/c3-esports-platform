/**
 * DELETE /api/admin/matches/:matchId
 *
 * Hard-deletes a match and all related rows (games, replays, check-ins, etc).
 * Admin only.
 */

import { NextResponse } from "next/server"
import { requireRole } from "@/lib/session"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ matchId: string }> }

export async function DELETE(_req: Request, { params }: Params) {
  const { error } = await requireRole("ADMIN")
  if (error) return error

  const { matchId } = await params

  const match = await prisma.match.findUnique({ where: { id: matchId }, select: { id: true } })
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 })

  await prisma.match.delete({ where: { id: matchId } })

  return NextResponse.json({ ok: true })
}
