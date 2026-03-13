/**
 * PATCH /api/admin/teams/:teamId
 *
 * Admin override: rename a team and/or clear its logo.
 * STAFF+ only.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/session"
import { z } from "zod/v4"

const Schema = z.object({
  name:      z.string().min(1).max(60).optional(),
  clearLogo: z.boolean().optional(),
})

type Ctx = { params: Promise<{ teamId: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { teamId } = await params

  const { error: authError } = await requireRole("STAFF")
  if (authError) return authError

  const body = await req.json().catch(() => ({}))
  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 })
  }

  const { name, clearLogo } = parsed.data

  const team = await prisma.team.findUnique({
    where: { id: teamId, deletedAt: null },
    select: { id: true },
  })
  if (!team) return NextResponse.json({ error: "Team not found." }, { status: 404 })

  const updated = await prisma.team.update({
    where: { id: teamId },
    data: {
      ...(name     ? { name }                            : {}),
      ...(clearLogo ? { logoUrl: null, logoKey: null }   : {}),
    },
    select: { id: true, name: true, logoUrl: true },
  })

  return NextResponse.json(updated)
}
