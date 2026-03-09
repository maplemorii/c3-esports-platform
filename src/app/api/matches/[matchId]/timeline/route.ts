/**
 * /api/matches/:matchId/timeline
 *
 * GET — public; returns the AuditLog entries for this match in chronological
 *       order, giving a complete status history.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiNotFound } from "@/lib/utils/errors"

type Params = { params: Promise<{ matchId: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { matchId } = await params

  // Verify the match exists
  const match = await prisma.match.findUnique({
    where:  { id: matchId, deletedAt: null },
    select: { id: true },
  })
  if (!match) return apiNotFound("Match")

  const entries = await prisma.auditLog.findMany({
    where:   { entityType: "Match", entityId: matchId },
    orderBy: { createdAt: "asc" },
    select: {
      id:         true,
      action:     true,
      after:      true,
      createdAt:  true,
      actor: {
        select: { id: true, name: true, image: true },
      },
    },
  })

  return NextResponse.json(entries)
}
