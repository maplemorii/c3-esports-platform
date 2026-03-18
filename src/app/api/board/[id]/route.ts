import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasMinRole } from "@/lib/roles"

async function requireAdmin() {
  const session = await getSession()
  if (!session || !hasMinRole(session.user.role, "ADMIN")) return null
  return session
}

// PATCH /api/board/[id]
const patchSchema = z.object({
  title:       z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  type:        z.enum(["FEATURE", "BUG", "IMPROVEMENT"]).optional(),
  status:      z.enum(["PLANNED", "IN_DEVELOPMENT", "COMPLETED"]).optional(),
  priority:    z.number().int().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const item = await prisma.boardItem.update({
    where: { id },
    data: parsed.data,
  })
  return NextResponse.json(item)
}

// DELETE /api/board/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  await prisma.boardItem.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
