/**
 * GET /api/admin/audit
 * Paginated audit log. Requires ADMIN.
 *
 * Query params:
 *   page   — 1-based (default: 1)
 *   limit  — max 100 (default: 25)
 *   action — filter by action string (optional)
 */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/session"

export async function GET(req: Request) {
  const { error } = await requireRole("ADMIN")
  if (error) return error

  const { searchParams } = new URL(req.url)
  const page   = Math.max(1, Number(searchParams.get("page")  ?? 1))
  const limit  = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 25)))
  const action = searchParams.get("action") ?? undefined

  const where = action ? { action: { contains: action } } : {}

  const [entries, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id:         true,
        action:     true,
        entityType: true,
        entityId:   true,
        before:     true,
        after:      true,
        ipAddress:  true,
        createdAt:  true,
        actor: {
          select: {
            id:     true,
            name:   true,
            email:  true,
            player: { select: { displayName: true } },
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ])

  return NextResponse.json({ entries, total, page, limit })
}
