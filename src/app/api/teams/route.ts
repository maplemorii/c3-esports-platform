/**
 * /api/teams
 * GET  — public (list all active teams)
 * POST — requires auth (any USER+ can create a team)
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/session"

const CreateTeamSchema = z.object({
  name: z.string().min(2).max(64),
  slug: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase letters, numbers, and hyphens"),
  region: z.string().optional(),
})

export async function GET() {
  const teams = await prisma.team.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      region: true,
      logoUrl: true,
      primaryColor: true,
    },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(teams)
}

export async function POST(req: Request) {
  const { session, error } = await requireAuth()
  if (error) return error

  const body = await req.json().catch(() => null)
  const parsed = CreateTeamSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const team = await prisma.team.create({
    data: {
      ...parsed.data,
      ownerId: session.user.id,
    },
  })

  return NextResponse.json(team, { status: 201 })
}
