/**
 * /matches
 *
 * Global public match list. Shows matches for the active season (falling back
 * to the most recently created visible season). Filterable by division.
 */

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import MatchScheduleTable from "@/components/matches/MatchScheduleTable"
import type { DivisionTier } from "@prisma/client"

export const metadata: Metadata = { title: "Matches" }

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function getData(divisionId?: string) {
  // Prefer the active season; fall back to the most recently created visible one
  const season = await prisma.season.findFirst({
    where:   { isVisible: true },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id:   true,
      name: true,
      slug: true,
      divisions: {
        orderBy: { tier: "asc" },
        select:  { id: true, name: true, tier: true },
      },
    },
  })
  if (!season) return null

  const where = divisionId
    ? { divisionId, deletedAt: null as null }
    : { division: { seasonId: season.id }, deletedAt: null as null }

  const matches = await prisma.match.findMany({
    where,
    orderBy: [{ leagueWeek: { weekNumber: "asc" } }, { scheduledAt: "asc" }],
    select: {
      id:          true,
      status:      true,
      format:      true,
      scheduledAt: true,
      homeScore:   true,
      awayScore:   true,
      leagueWeek:  { select: { weekNumber: true, label: true, startDate: true } },
      homeTeam:    { select: { id: true, name: true, slug: true, logoUrl: true, primaryColor: true } },
      awayTeam:    { select: { id: true, name: true, slug: true, logoUrl: true, primaryColor: true } },
      winner:      { select: { id: true } },
    },
  })

  return { season, matches }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TIER_LABEL: Record<DivisionTier, string> = {
  PREMIER:     "Premier",
  CHALLENGERS: "Open Challengers",
  CONTENDERS:  "Open Contenders",
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function PublicMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ division?: string }>
}) {
  const { division: divisionParam } = await searchParams

  const data = await getData(divisionParam)
  if (!data) notFound()

  const { season, matches } = data

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/seasons" className="hover:text-brand transition-colors">Seasons</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/seasons/${season.slug}`} className="hover:text-brand transition-colors">{season.name}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">Matches</span>
      </nav>

      <h1 className="mb-6 font-display text-3xl font-bold uppercase tracking-wide">
        Matches
      </h1>

      {/* Division filter tabs */}
      {season.divisions.length > 1 && (
        <div className="mb-6 flex gap-1 border-b border-border">
          <Link
            href="/matches"
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              !divisionParam
                ? "border-brand text-brand"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            All
          </Link>
          {season.divisions.map((div) => (
            <Link
              key={div.id}
              href={`/matches?division=${div.id}`}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
                div.id === divisionParam
                  ? "border-brand text-brand"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {TIER_LABEL[div.tier]}
            </Link>
          ))}
        </div>
      )}

      <MatchScheduleTable matches={matches} />

    </div>
  )
}
