/**
 * /api/staff/seasons
 * GET  — STAFF+: list all seasons with division/registration counts
 * POST — STAFF+: create a new season
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/session"

const CreateSeasonSchema = z.object({
  name: z.string().min(2).max(128),
  slug: z
    .string()
    .min(2)
    .max(128)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export async function GET() {
  const { error } = await requireRole("STAFF")
  if (error) return error

  const seasons = await prisma.season.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
      isVisible: true,
      _count: { select: { divisions: true, registrations: true } },
    },
  })

  return NextResponse.json(seasons)
}

export async function POST(req: Request) {
  const { error } = await requireRole("STAFF")
  if (error) return error

  const body = await req.json().catch(() => null)
  const parsed = CreateSeasonSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { startDate, endDate, ...rest } = parsed.data

  const season = await prisma.season.create({
    data: {
      ...rest,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    },
  })

  return NextResponse.json(season, { status: 201 })
}
