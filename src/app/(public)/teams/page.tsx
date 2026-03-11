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
    <div className="mx-auto max-w-5xl px-4 py-14">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="mb-12">
        <p
          className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em]"
          style={{ color: "rgba(96,165,250,0.6)" }}
        >
          Carolina Collegiate Clash
        </p>
        <h1
          className="font-sans text-5xl font-black uppercase sm:text-6xl"
          style={{ color: "rgba(255,255,255,0.92)", letterSpacing: "-0.01em" }}
        >
          Teams
        </h1>
        <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.28)" }}>
          {teams.length} team{teams.length !== 1 ? "s" : ""} competing in C3
        </p>
        <div
          className="mt-6 h-px w-20"
          style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.6), rgba(59,130,246,0.3), transparent)" }}
        />
      </div>

      {/* ── Search ───────────────────────────────────────────────── */}
      <form method="GET" className="mb-8">
        <div className="relative max-w-md">
          <Search
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: "rgba(255,255,255,0.25)" }}
          />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search teams…"
            className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm font-sans outline-none transition-all duration-150"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.85)",
            }}
          />
        </div>
      </form>

      {/* ── Grid ─────────────────────────────────────────────────── */}
      {teams.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Users className="h-10 w-10" style={{ color: "rgba(255,255,255,0.1)" }} />
          <p style={{ color: "rgba(255,255,255,0.28)" }}>
            {search ? `No teams found matching "${search}".` : "No teams yet."}
          </p>
          {search && (
            <Link
              href="/teams"
              className="text-xs transition-colors duration-150"
              style={{ color: "rgba(96,165,250,0.7)" }}
            >
              Clear search
            </Link>
          )}
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
