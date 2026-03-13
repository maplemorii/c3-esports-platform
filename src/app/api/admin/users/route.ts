/**
 * /api/admin/users
 * GET   — ADMIN: paginated user list
 * PATCH — ADMIN: change a user's role
 */
import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/session"
import { ROLE_HIERARCHY } from "@/lib/roles"

export async function GET(req: Request) {
  const { error } = await requireRole("ADMIN")
  if (error) return error

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get("page") ?? 1))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 25)))

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        player: { select: { displayName: true } },
        // Edu verification status for admin review
        eduEmail: true,
        eduEmailVerified: true,
        eduVerifyOverride: true,
        eduVerifyNote: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where: { deletedAt: null } }),
  ])

  return NextResponse.json({ users, total, page, limit })
}

// DEVELOPER is not assignable via API — it's injected via env var
const UpdateRoleSchema = z.object({
  userId: z.string().cuid(),
  role: z.enum(["USER", "TEAM_MANAGER", "STAFF", "ADMIN", "OWNER"]),
})

export async function PATCH(req: Request) {
  const { session, error } = await requireRole("ADMIN")
  if (error) return error

  const body = await req.json().catch(() => null)
  const parsed = UpdateRoleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const requesterRank = ROLE_HIERARCHY[session.user.role]
  const newRoleRank   = ROLE_HIERARCHY[parsed.data.role]

  // Cannot assign a role >= your own rank
  if (newRoleRank >= requesterRank) {
    return NextResponse.json(
      { error: "You cannot assign a role equal to or higher than your own." },
      { status: 403 }
    )
  }

  // Look up the target user's current role
  const targetUser = await prisma.user.findUnique({
    where:  { id: parsed.data.userId, deletedAt: null },
    select: { id: true, role: true },
  })
  if (!targetUser) {
    return NextResponse.json({ error: "User not found." }, { status: 404 })
  }

  const targetRank = ROLE_HIERARCHY[targetUser.role]

  // Cannot change the role of a user whose rank >= your own
  if (targetRank >= requesterRank) {
    return NextResponse.json(
      { error: "You cannot change the role of a user with equal or higher privileges." },
      { status: 403 }
    )
  }

  const user = await prisma.user.update({
    where:  { id: parsed.data.userId },
    data:   { role: parsed.data.role },
    select: { id: true, name: true, email: true, role: true },
  })

  return NextResponse.json(user)
}
