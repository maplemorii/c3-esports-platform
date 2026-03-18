import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasMinRole } from "@/lib/roles"

// GET /api/board — public, returns all items ordered by status then priority desc
export async function GET() {
  const items = await prisma.boardItem.findMany({
    orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
  })
  return NextResponse.json(items)
}

// POST /api/board — ADMIN/DEVELOPER only
const createSchema = z.object({
  title:       z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  type:        z.enum(["FEATURE", "BUG", "IMPROVEMENT"]),
  status:      z.enum(["PLANNED", "IN_DEVELOPMENT", "COMPLETED"]).optional(),
  priority:    z.number().int().optional(),
})

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || !hasMinRole(session.user.role, "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const item = await prisma.boardItem.create({ data: parsed.data })
  return NextResponse.json(item, { status: 201 })
}
