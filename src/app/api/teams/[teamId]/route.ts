/**
 * /api/teams/:teamId
 *
 * GET    — public; full team profile + active roster
 * PATCH  — team owner or STAFF+; update team info
 * DELETE — ADMIN only; soft-delete the team
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole } from "@/lib/session"
import { assertCanManageTeam } from "@/lib/auth/permissions"
import { UpdateTeamSchema } from "@/lib/validators/team.schema"
import {
  parseBody,
  apiNotFound,
  apiConflict,
  apiInternalError,
} from "@/lib/utils/errors"
import { slugify, dedupeSlug } from "@/lib/utils/slug"

// ---------------------------------------------------------------------------
// Shared roster select — reused by GET and returned after PATCH
// ---------------------------------------------------------------------------

const ROSTER_SELECT = {
  id:          true,
  role:        true,
  isCaptain:   true,
  jerseyNumber: true,
  joinedAt:    true,
  player: {
    select: {
      id:              true,
      displayName:     true,
      avatarUrl:       true,
      trackerUrl:      true,
      discordUsername: true,
    },
  },
}

const TEAM_SELECT = {
  id:             true,
  slug:           true,
  name:           true,
  logoUrl:        true,
  primaryColor:   true,
  secondaryColor: true,
  website:        true,
  twitterHandle:  true,
  discordInvite:  true,
  ownerId:        true,
  createdAt:      true,
  updatedAt:      true,
  memberships: {
    where:  { leftAt: null },
    select: ROSTER_SELECT,
    orderBy: [{ isCaptain: "desc" as const }, { role: "asc" as const }, { joinedAt: "asc" as const }],
  },
  owner: {
    select: {
      id:    true,
      name:  true,
      image: true,
    },
  },
}

// ---------------------------------------------------------------------------
// GET /api/teams/:teamId
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params

  try {
    const team = await prisma.team.findUnique({
      where:  { id: teamId, deletedAt: null },
      select: TEAM_SELECT,
    })

    if (!team) return apiNotFound("Team")

    return NextResponse.json(team)
  } catch (err) {
    return apiInternalError(err, "GET /api/teams/:teamId")
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/teams/:teamId
// ---------------------------------------------------------------------------

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params

  // Auth
  const { session, error: authError } = await requireAuth()
  if (authError) return authError

  // Permission: owner or STAFF+
  const denied = await assertCanManageTeam(session, teamId)
  if (denied) return denied

  // Validate body
  const { data, error: bodyError } = await parseBody(req, UpdateTeamSchema)
  if (bodyError) return bodyError

  try {
    // Ensure team exists
    const existing = await prisma.team.findUnique({
      where:  { id: teamId, deletedAt: null },
      select: { id: true, name: true, slug: true },
    })
    if (!existing) return apiNotFound("Team")

    // If name is changing, enforce uniqueness and re-slug
    let newSlug: string | undefined
    if (data.name && data.name !== existing.name) {
      const conflict = await prisma.team.findFirst({
        where: {
          name:      { equals: data.name, mode: "insensitive" },
          deletedAt: null,
          NOT:       { id: teamId },
        },
        select: { id: true },
      })
      if (conflict) return apiConflict(`A team named "${data.name}" already exists`)

      const baseSlug = slugify(data.name)
      const taken = await prisma.team.findMany({
        where:  { slug: { startsWith: baseSlug }, deletedAt: null, NOT: { id: teamId } },
        select: { slug: true },
      })
      newSlug = dedupeSlug(baseSlug, taken.map((t) => t.slug))
    }

    const team = await prisma.team.update({
      where:  { id: teamId },
      data: {
        ...data,
        ...(newSlug ? { slug: newSlug } : {}),
      },
      select: TEAM_SELECT,
    })

    return NextResponse.json(team)
  } catch (err) {
    return apiInternalError(err, "PATCH /api/teams/:teamId")
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/teams/:teamId
// ---------------------------------------------------------------------------

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params

  // Auth: ADMIN only
  const { session: _session, error: authError } = await requireRole("ADMIN")
  if (authError) return authError

  try {
    const existing = await prisma.team.findUnique({
      where:  { id: teamId, deletedAt: null },
      select: { id: true },
    })
    if (!existing) return apiNotFound("Team")

    await prisma.team.update({
      where: { id: teamId },
      data:  { deletedAt: new Date() },
    })

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return apiInternalError(err, "DELETE /api/teams/:teamId")
  }
}
