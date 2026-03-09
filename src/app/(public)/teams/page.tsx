/**
 * /teams
 *
 * Public teams list — server component with searchParams-driven search.
 * No auth required.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { Users, Search } from "lucide-react"
import { TeamCard } from "@/components/team/TeamCard"
import type { TeamCardData } from "@/components/team/TeamCard"

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Teams",
  description: "Browse all teams competing in the Carolina Collegiate Clash.",
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getTeams(search: string): Promise<TeamCardData[]> {
  const rows = await prisma.team.findMany({
    where: {
      deletedAt: null,
      ...(search
        ? { name: { contains: search, mode: "insensitive" as const } }
        : {}),
    },
    orderBy: { name: "asc" },
    select: {
      id:           true,
      slug:         true,
      name:         true,
      logoUrl:      true,
      primaryColor: true,
      _count: {
        select: {
          memberships: { where: { leftAt: null } },
        },
      },
      registrations: {
        where:   { status: "APPROVED" },
        take:    1,
        orderBy: { registeredAt: "desc" },
        select: {
          season:   { select: { name: true } },
          division: { select: { name: true, tier: true } },
        },
      },
    },
  })

  return rows.map((t) => ({
    id:           t.id,
    slug:         t.slug,
    name:         t.name,
    logoUrl:      t.logoUrl,
    primaryColor: t.primaryColor,
    memberCount:  t._count.memberships,
    activeReg:    t.registrations[0] ?? null,
  }))
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search = "" } = await searchParams
  const teams = await getTeams(search.trim())

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand">
          Carolina Collegiate Clash
        </p>
        <h1 className="font-display text-4xl font-bold uppercase tracking-wide sm:text-5xl">
          Teams
        </h1>
        <p className="mt-2 text-muted-foreground text-sm">
          {teams.length} team{teams.length !== 1 ? "s" : ""} competing in C3
        </p>
      </div>

      {/* ── Search ───────────────────────────────────────────────── */}
      <form method="GET" className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search teams…"
            className={cn(
              "w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2.5 text-sm",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand/60",
              "transition-colors"
            )}
          />
        </div>
      </form>

      {/* ── Grid ─────────────────────────────────────────────────── */}
      {teams.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Users className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-muted-foreground">
            {search ? `No teams found matching "${search}".` : "No teams yet."}
          </p>
          {search && (
            <Link href="/teams" className="text-xs text-brand hover:underline">
              Clear search
            </Link>
          )}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <li key={team.id}>
              <TeamCard team={team} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
