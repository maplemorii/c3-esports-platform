/**
 * /api/seasons/:seasonId/registrations/:regId
 *
 * PATCH  — STAFF+; approve/reject/waitlist a registration
 *           Approval requires a divisionId.
 * DELETE — team owner or STAFF+; withdraw a registration
 *           Only PENDING or WAITLISTED registrations can be withdrawn.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/session"
import { assertCanManageTeam } from "@/lib/auth/permissions"
import { ReviewRegistrationSchema } from "@/lib/validators/season.schema"
import { parseBody, apiNotFound, apiBadRequest, apiInternalError } from "@/lib/utils/errors"
import { sendBotWebhook } from "@/lib/bot-webhook"

type Ctx = { params: Promise<{ seasonId: string; regId: string }> }

// ---------------------------------------------------------------------------
// PATCH /api/seasons/:seasonId/registrations/:regId  (staff review)
// ---------------------------------------------------------------------------

export async function PATCH(
  req: NextRequest,
  { params }: Ctx
) {
  const { seasonId, regId } = await params

  const { session, error: authError } = await requireRole("STAFF")
  if (authError) return authError
  void session

  const { data, error: bodyError } = await parseBody(req, ReviewRegistrationSchema)
  if (bodyError) return bodyError

  try {
    const reg = await prisma.seasonRegistration.findUnique({
      where:  { id: regId },
      select: { id: true, seasonId: true, status: true, teamId: true },
    })
    if (!reg || reg.seasonId !== seasonId) return apiNotFound("Registration")

    if (reg.status === "WITHDRAWN") {
      return apiBadRequest("Withdrawn registrations cannot be reviewed")
    }

    // Verify divisionId belongs to this season when approving
    if (data.status === "APPROVED" && data.divisionId) {
      const div = await prisma.division.findUnique({
        where:  { id: data.divisionId },
        select: { seasonId: true },
      })
      if (!div || div.seasonId !== seasonId) {
        return apiBadRequest("Division does not belong to this season")
      }
    }

    const divisionId = data.status === "APPROVED" ? data.divisionId : undefined

    const [updated] = await prisma.$transaction([
      prisma.seasonRegistration.update({
        where: { id: regId },
        data:  {
          status:     data.status,
          divisionId: divisionId ?? undefined,
          notes:      data.notes,
          reviewedAt: new Date(),
        },
        select: {
          id:         true,
          status:     true,
          divisionId: true,
          notes:      true,
          reviewedAt: true,
          team:     { select: { id: true, name: true, slug: true } },
          season:   { select: { id: true, name: true } },
          division: { select: { id: true, name: true } },
        },
      }),
      // When approving, stamp activeDivisionId on all current members so the
      // uniqueness constraint (one team per division per player) is enforced.
      ...(data.status === "APPROVED" && divisionId
        ? [prisma.teamMembership.updateMany({
            where: { teamId: reg.teamId, leftAt: null },
            data:  { activeDivisionId: divisionId },
          })]
        : []),
      // When un-approving (reject/waitlist), clear the activeDivisionId.
      ...(data.status !== "APPROVED" && reg.status === "APPROVED"
        ? [prisma.teamMembership.updateMany({
            where: { teamId: reg.teamId, leftAt: null },
            data:  { activeDivisionId: null },
          })]
        : []),
    ])

    if (data.status === "APPROVED") {
      sendBotWebhook("registration.approved", {
        registrationId: regId,
        teamId:      updated.team.id,
        teamName:    updated.team.name,
        divisionName: updated.division?.name ?? null,
        seasonName:   updated.season?.name ?? null,
      })
    }

    return NextResponse.json(updated)
  } catch (err) {
    return apiInternalError(err, "PATCH /api/seasons/:seasonId/registrations/:regId")
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/seasons/:seasonId/registrations/:regId  (manager withdraw)
// ---------------------------------------------------------------------------

export async function DELETE(
  _req: NextRequest,
  { params }: Ctx
) {
  const { seasonId, regId } = await params

  const { session, error: authError } = await requireAuth()
  if (authError) return authError

  try {
    const reg = await prisma.seasonRegistration.findUnique({
      where:  { id: regId },
      select: { id: true, teamId: true, seasonId: true, status: true },
    })
    if (!reg || reg.seasonId !== seasonId) return apiNotFound("Registration")

    // Permission: must manage the team
    const denied = await assertCanManageTeam(session, reg.teamId)
    if (denied) return denied

    if (!["PENDING", "WAITLISTED"].includes(reg.status)) {
      return apiBadRequest(
        reg.status === "APPROVED"
          ? "Approved registrations cannot be withdrawn — contact staff"
          : "This registration cannot be withdrawn"
      )
    }

    await prisma.seasonRegistration.update({
      where: { id: regId },
      data:  { status: "WITHDRAWN" },
    })

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return apiInternalError(err, "DELETE /api/seasons/:seasonId/registrations/:regId")
  }
}
