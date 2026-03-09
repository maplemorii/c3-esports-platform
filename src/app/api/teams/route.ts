/**
 * /api/teams
 *
 * GET  — public; paginated list of active teams
 *         Query params: search, seasonId, page, pageSize
 *
 * POST — authenticated (any USER+); creates a new team
 *         Promotes the creator to TEAM_MANAGER if they are still USER.
 *         Auto-generates a URL-safe slug from the team name.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/session"
import { CreateTeamSchema } from "@/lib/validators/team.schema"
import { parseBody, apiConflict, apiInternalError } from "@/lib/utils/errors"
import { slugify, dedupeSlug } from "@/lib/utils/slug"
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/constants"
import type { Prisma } from "@prisma/client"

// ---------------------------------------------------------------------------
// GET /api/teams
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl

    // Pagination
    const page     = Math.max(1, Number(searchParams.get("page") ?? 1))
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(searchParams.get("pageSize") ?? DEFAULT_PAGE_SIZE)))
    const skip     = (page - 1) * pageSize

    // Filters
    const search   = searchParams.get("search")?.trim()
    const seasonId = searchParams.get("seasonId")?.trim()

    const where: Prisma.TeamWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { name:   { contains: search, mode: "insensitive" } },
          { slug:   { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(seasonId && {
        registrations: {
          some: { seasonId, status: { in: ["APPROVED", "PENDING"] } },
        },
      }),
    }

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        select: {
          id:           true,
          slug:         true,
          name:         true,
          logoUrl:      true,
          primaryColor: true,
        },
        orderBy: { name: "asc" },
        skip,
        take: pageSize,
      }),
      prisma.team.count({ where }),
    ])

    return NextResponse.json({
      data:       teams,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (err) {
    return apiInternalError(err, "GET /api/teams")
  }
}

// ---------------------------------------------------------------------------
// POST /api/teams
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  // Auth
  const { session, error } = await requireAuth()
  if (error) return error

  // Validate body
  const { data, error: bodyError } = await parseBody(req, CreateTeamSchema)
  if (bodyError) return bodyError

  try {
    // Uniqueness check on name
    const existing = await prisma.team.findFirst({
      where: { name: { equals: data.name, mode: "insensitive" }, deletedAt: null },
      select: { id: true },
    })
    if (existing) return apiConflict(`A team named "${data.name}" already exists`)

    // Build a unique slug
    const baseSlug = slugify(data.name)
    const taken = await prisma.team.findMany({
      where:  { slug: { startsWith: baseSlug }, deletedAt: null },
      select: { slug: true },
    })
    const slug = dedupeSlug(baseSlug, taken.map((t) => t.slug))

    // Create team + promote user role in a single transaction
    const [team] = await prisma.$transaction([
      prisma.team.create({
        data: {
          slug,
          name:           data.name,
          primaryColor:   data.primaryColor,
          secondaryColor: data.secondaryColor,
          website:        data.website,
          twitterHandle:  data.twitterHandle,
          discordInvite:  data.discordInvite,
          ownerId:        session.user.id,
        },
        select: {
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
        },
      }),
      // Promote to TEAM_MANAGER if still USER
      ...(session.user.role === "USER"
        ? [prisma.user.update({
            where: { id: session.user.id },
            data:  { role: "TEAM_MANAGER" },
          })]
        : []),
    ])

    return NextResponse.json(team, { status: 201 })
  } catch (err) {
    return apiInternalError(err, "POST /api/teams")
  }
}
