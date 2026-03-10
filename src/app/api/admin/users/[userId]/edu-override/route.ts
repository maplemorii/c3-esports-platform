/**
 * PATCH /api/admin/users/[userId]/edu-override
 * STAFF+. Manually approve or revoke a user's college student status.
 * Used for edge cases: community colleges without .edu, international students, etc.
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/session"

const OverrideSchema = z.object({
  approved: z.boolean(),
  note: z.string().max(500).optional(),
})

type Params = { params: Promise<{ userId: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const { userId } = await params

  const { error } = await requireRole("STAFF")
  if (error) return error

  const body = await req.json().catch(() => null)
  const parsed = OverrideSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const target = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    select: { id: true },
  })
  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 })
  }

  const { approved, note } = parsed.data

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      eduVerifyOverride: approved,
      eduVerifyNote: note ?? null,
      // When revoking, clear any previous email verification too
      ...(approved === false
        ? { eduEmailVerified: null }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      eduEmail: true,
      eduEmailVerified: true,
      eduVerifyOverride: true,
      eduVerifyNote: true,
    },
  })

  return NextResponse.json(updated)
}
