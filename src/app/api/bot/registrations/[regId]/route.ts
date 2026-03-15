/**
 * PATCH /api/bot/registrations/:regId
 * Approve or reject a season registration via the Discord bot. Bot auth required.
 */

import { type NextRequest, NextResponse } from "next/server"
import { requireBotAuth } from "@/lib/bot-auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const Schema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  note:   z.string().optional(),
})

type Params = { params: Promise<{ regId: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const authError = requireBotAuth(req)
  if (authError) return authError

  const { regId } = await params

  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 422 })

  const { status, note } = parsed.data

  const reg = await prisma.seasonRegistration.findUnique({
    where:  { id: regId },
    select: {
      id:       true,
      status:   true,
      teamId:   true,
      team:     { select: { name: true } },
      division: { select: { name: true } },
    },
  })

  if (!reg) return NextResponse.json({ error: "Registration not found" }, { status: 404 })
  if (reg.status === "WITHDRAWN") {
    return NextResponse.json({ error: "Withdrawn registrations cannot be reviewed" }, { status: 409 })
  }
  if (reg.status === status) {
    return NextResponse.json({ error: `Registration is already ${status}` }, { status: 409 })
  }

  await prisma.seasonRegistration.update({
    where: { id: regId },
    data:  { status, notes: note, reviewedAt: new Date() },
  })

  if (status !== "APPROVED") {
    await prisma.teamMembership.updateMany({
      where: { teamId: reg.teamId, leftAt: null },
      data:  { activeDivisionId: null },
    })
  }

  return NextResponse.json({
    ok:           true,
    teamName:     reg.team?.name,
    status,
    divisionName: reg.division?.name,
  })
}
