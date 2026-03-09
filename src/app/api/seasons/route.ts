/**
 * /api/seasons
 *
 * GET — public; list visible seasons with their divisions
 *        Query params: status (DRAFT|REGISTRATION|ACTIVE|PLAYOFFS|COMPLETED|CANCELLED)
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiInternalError } from "@/lib/utils/errors"
import type { SeasonStatus } from "@prisma/client"

const VALID_STATUSES: SeasonStatus[] = [
  "DRAFT", "REGISTRATION", "ACTIVE", "PLAYOFFS", "COMPLETED", "CANCELLED",
]

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const statusParam = searchParams.get("status")?.toUpperCase()

    const statusFilter: SeasonStatus | undefined =
      statusParam && VALID_STATUSES.includes(statusParam as SeasonStatus)
        ? (statusParam as SeasonStatus)
        : undefined

    const seasons = await prisma.season.findMany({
      where: {
        isVisible: true,
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      orderBy: { createdAt: "desc" as const },
      select: {
        id:                true,
        slug:              true,
        name:              true,
        status:            true,
        description:       true,
        registrationStart: true,
        registrationEnd:   true,
        startDate:         true,
        endDate:           true,
        divisions: {
          orderBy: { tier: "asc" as const },
          select: {
            id:          true,
            name:        true,
            tier:        true,
            description: true,
            maxTeams:    true,
            _count:      { select: { registrations: true } },
          },
        },
      },
    })

    return NextResponse.json(seasons)
  } catch (err) {
    return apiInternalError(err, "GET /api/seasons")
  }
}
