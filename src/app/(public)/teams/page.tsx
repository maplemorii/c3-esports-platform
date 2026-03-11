/**
 * /teams
 *
 * Public teams list — server component with searchParams-driven search.
 * No auth required.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
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
    <div className="relative min-h-screen">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-0 left-0 h-96 w-96 opacity-10"
        style={{
          background: "radial-gradient(circle, rgba(196,28,53,0.6), transparent 70%)",
          filter: "blur(80px)",
          transform: "translate(-30%, -20%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-0 right-0 h-96 w-96 opacity-10"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.6), transparent 70%)",
          filter: "blur(80px)",
          transform: "translate(30%, -20%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20">

        {/* Header */}
        <div className="mb-12">
          <p className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-[0.3em] text-brand/70">
            Carolina Collegiate Clash
          </p>
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <h1 className="font-display text-5xl font-bold uppercase tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                Teams
              </h1>
              {teams.length > 0 && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {teams.length} team{teams.length !== 1 ? "s" : ""} competing in C3
                </p>
              )}
            </div>

            {/* Search */}
            <form method="GET" className="shrink-0">
              <div className="relative w-72">
                <Search
                  className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50"
                />
                <input
                  type="text"
                  name="search"
                  defaultValue={search}
                  placeholder="Search teams…"
                  className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all duration-150 focus:ring-1 focus:ring-brand/30"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.85)",
                  }}
                />
              </div>
            </form>
          </div>

          <div
            className="mt-6 h-px w-24"
            style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.6), rgba(59,130,246,0.3), transparent)" }}
          />
        </div>

        {/* Grid */}
        {teams.length === 0 ? (
          <div className="flex flex-col items-center gap-5 py-32 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-card">
              <Users className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold uppercase tracking-wide text-foreground/50">
                {search ? "No results" : "No teams yet"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {search
                  ? `No teams found matching "${search}".`
                  : "Check back soon for registered teams."}
              </p>
            </div>
            {search && (
              <Link
                href="/teams"
                className="text-xs text-brand/70 hover:text-brand transition-colors duration-150"
              >
                Clear search
              </Link>
            )}
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {teams.map((team) => (
              <li key={team.id}>
                <TeamCard team={team} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
