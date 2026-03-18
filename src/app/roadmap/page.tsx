import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { hasMinRole } from "@/lib/roles"
import { RoadmapBoard } from "./RoadmapBoard"

export const metadata: Metadata = { title: "Roadmap — C3 Esports" }
export const dynamic = "force-dynamic"

export default async function RoadmapPage() {
  const [session, items] = await Promise.all([
    getSession(),
    prisma.boardItem.findMany({
      orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    }),
  ])

  const canEdit = !!(session && hasMinRole(session.user.role, "ADMIN"))

  return <RoadmapBoard initialItems={items} canEdit={canEdit} />
}
