/**
 * /matches
 *
 * Global public match list. Shows matches for the active season (falling back
 * to the most recently created visible season). Filterable by division.
 */

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Swords } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import MatchScheduleTable from "@/components/matches/MatchScheduleTable"
import type { DivisionTier } from "@prisma/client"

export const metadata: Metadata = {
  title: "Matches",
  description: "Live match schedule and results — C3 Esports League.",
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function getData(divisionId?: string) {
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
  CHALLENGERS: "Challengers",
  CONTENDERS:  "Contenders",
}

const TIER_ACCENT: Record<DivisionTier, string> = {
  PREMIER:     "text-amber-400 border-amber-400",
  CHALLENGERS: "text-blue-400 border-blue-400",
  CONTENDERS:  "text-cyan-400 border-cyan-400",
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
    <div className="relative min-h-screen">
      {/* Ambient glow */}
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

        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/seasons" className="hover:text-brand transition-colors duration-150">Seasons</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href={`/seasons/${season.slug}`} className="hover:text-brand transition-colors duration-150">{season.name}</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">Matches</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <p className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-[0.3em] text-brand/70">
            {season.name}
          </p>
          <h1 className="font-display text-5xl font-bold uppercase tracking-tight text-foreground sm:text-6xl">
            Matches
          </h1>
          <div
            className="mt-6 h-px w-24"
            style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.6), rgba(59,130,246,0.3), transparent)" }}
          />
        </div>

        {/* Division tabs */}
        {season.divisions.length > 1 && (
          <div className="mb-8 flex gap-2 flex-wrap">
            <Link
              href="/matches"
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 border",
                !divisionParam
                  ? "bg-card text-foreground border-border"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              All Divisions
            </Link>
            {season.divisions.map((div) => {
              const isActive = div.id === divisionParam
              return (
                <Link
                  key={div.id}
                  href={`/matches?division=${div.id}`}
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 border",
                    isActive
                      ? cn("bg-card text-foreground border-border", TIER_ACCENT[div.tier])
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {TIER_LABEL[div.tier]}
                </Link>
              )
            })}
          </div>
        )}

        {/* Match list */}
        {matches.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-32 text-center">
            <Swords className="h-12 w-12 text-muted-foreground/20" />
            <p className="text-muted-foreground">No matches scheduled yet.</p>
          </div>
        ) : (
          <MatchScheduleTable matches={matches} />
        )}

      </div>
    </div>
  )
}
