/**
 * /api/admin/seasons/[seasonId]/divisions/[divisionId]/schedule
 *
 * DELETE — clears the generated schedule for a division.
 *          Deletes only SCHEDULED (not started) matches.
 *          Resets Division.scheduleGeneratedAt and Division.scheduleMode to null.
 *
 * Auth: STAFF+
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/session"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ seasonId: string; divisionId: string }> }
) {
  const { error } = await requireRole("STAFF")
  if (error) return error

  const { divisionId } = await params

  // Verify division exists
  const division = await prisma.division.findUnique({
    where: { id: divisionId },
    select: { id: true, scheduleGeneratedAt: true },
  })
  if (!division) {
    return NextResponse.json({ error: "Division not found" }, { status: 404 })
  }

  // Delete only SCHEDULED matches (not started / in-progress / completed)
  const { count: deleted } = await prisma.match.deleteMany({
    where: {
      divisionId,
      status: "SCHEDULED",
      deletedAt: null,
    },
  })

  // Reset division schedule metadata
  await prisma.division.update({
    where: { id: divisionId },
    data: {
      scheduleGeneratedAt: null,
      scheduleMode: null,
    },
  })

  return NextResponse.json({ ok: true, matchesDeleted: deleted })
}
