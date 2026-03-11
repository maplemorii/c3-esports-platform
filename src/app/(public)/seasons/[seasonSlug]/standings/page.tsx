/**
 * /seasons/[seasonSlug]/standings
 *
 * Public standings page. Shows all divisions for a season as tabs.
 * Pre-selects the division from ?division=<divisionId> if provided.
 */

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { ChevronRight, ArrowUp, ArrowDown, Minus } from "lucide-react"
import type { DivisionTier } from "@prisma/client"

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function getData(slug: string) {
  return prisma.season.findFirst({
    where: { slug, isVisible: true },
    select: {
      id:   true,
      name: true,
      slug: true,
      divisions: {
        orderBy: { tier: "asc" },
        select: {
          id:   true,
          name: true,
          tier: true,
          standingEntries: {
            orderBy: [
              { points:           "desc" },
              { gameDifferential: "desc" },
              { goalDifferential: "desc" },
              { wins:             "desc" },
            ],
            select: {
              id:               true,
              points:           true,
              wins:             true,
              losses:           true,
              matchesPlayed:    true,
              forfeitWins:      true,
              forfeitLosses:    true,
              gamesWon:         true,
              gamesLost:        true,
              gameDifferential: true,
              goalsFor:         true,
              goalsAgainst:     true,
              goalDifferential: true,
              winPct:           true,
              streak:           true,
              team: {
                select: {
                  id:           true,
                  name:         true,
                  slug:         true,
                  logoUrl:      true,
                  primaryColor: true,
                },
              },
            },
          },
        },
      },
    },
  })
}

type Season = NonNullable<Awaited<ReturnType<typeof getData>>>
type Division = Season["divisions"][number]
type Entry = Division["standingEntries"][number]

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ seasonSlug: string }>
}): Promise<Metadata> {
  const { seasonSlug } = await params
  const season = await getData(seasonSlug)
  if (!season) return { title: "Standings" }
  const title       = `Standings — ${season.name}`
  const description = `Division standings for ${season.name} — C3 Esports League.`
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter:   { card: "summary_large_image", title, description },
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TIER_LABEL: Record<DivisionTier, string> = {
  PREMIER:    "Premier",
  CHALLENGERS: "Open Challengers",
  CONTENDERS: "Open Contenders",
}

function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0) return <Minus className="h-3.5 w-3.5 text-muted-foreground" />
  const isWin = streak > 0
  const count = Math.abs(streak)
  return (
    <span className={cn(
      "flex items-center gap-0.5 text-xs font-semibold tabular-nums",
      isWin ? "text-emerald-400" : "text-destructive"
    )}>
      {isWin
        ? <ArrowUp className="h-3 w-3" />
        : <ArrowDown className="h-3 w-3" />}
      {count}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Standings table
// ---------------------------------------------------------------------------

function StandingsTable({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        No teams registered yet.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <th className="py-3 pl-3 pr-2 text-left w-8">#</th>
            <th className="py-3 px-2 text-left">Team</th>
            <th className="py-3 px-2 text-center">GP</th>
            <th className="py-3 px-2 text-center">W</th>
            <th className="py-3 px-2 text-center">L</th>
            <th className="py-3 px-2 text-center hidden sm:table-cell">GW</th>
            <th className="py-3 px-2 text-center hidden sm:table-cell">GL</th>
            <th className="py-3 px-2 text-center hidden md:table-cell">GD</th>
            <th className="py-3 px-2 text-center">PTS</th>
            <th className="py-3 pl-2 pr-3 text-center hidden lg:table-cell">Streak</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {entries.map((entry, i) => (
            <tr
              key={entry.id}
              className={cn(
                "group hover:bg-muted/30 transition-colors",
                i === 0 && "bg-brand/5"
              )}
            >
              {/* Rank */}
              <td className="py-3 pl-3 pr-2 text-muted-foreground tabular-nums font-medium">
                {i + 1}
              </td>

              {/* Team */}
              <td className="py-3 px-2">
                <Link
                  href={`/teams/${entry.team.slug}`}
                  className="flex items-center gap-2.5 hover:text-brand transition-colors"
                >
                  <div
                    className="h-7 w-7 shrink-0 rounded overflow-hidden flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: entry.team.primaryColor ?? "oklch(0.50 0.20 15)" }}
                  >
                    {entry.team.logoUrl
                      ? <img src={entry.team.logoUrl} alt="" className="h-full w-full object-cover" />
                      : entry.team.name.slice(0, 2).toUpperCase()
                    }
                  </div>
                  <span className="font-semibold truncate">{entry.team.name}</span>
                </Link>
              </td>

              <td className="py-3 px-2 text-center tabular-nums text-muted-foreground">{entry.matchesPlayed}</td>
              <td className="py-3 px-2 text-center tabular-nums font-semibold text-emerald-400">{entry.wins}</td>
              <td className="py-3 px-2 text-center tabular-nums text-destructive">{entry.losses}</td>
              <td className="py-3 px-2 text-center tabular-nums text-muted-foreground hidden sm:table-cell">{entry.gamesWon}</td>
              <td className="py-3 px-2 text-center tabular-nums text-muted-foreground hidden sm:table-cell">{entry.gamesLost}</td>
              <td className={cn(
                "py-3 px-2 text-center tabular-nums font-medium hidden md:table-cell",
                entry.gameDifferential > 0 ? "text-emerald-400" : entry.gameDifferential < 0 ? "text-destructive" : "text-muted-foreground"
              )}>
                {entry.gameDifferential > 0 ? `+${entry.gameDifferential}` : entry.gameDifferential}
              </td>
              <td className="py-3 px-2 text-center tabular-nums font-bold">{entry.points}</td>
              <td className="py-3 pl-2 pr-3 text-center hidden lg:table-cell">
                <StreakBadge streak={entry.streak} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function StandingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ seasonSlug: string }>
  searchParams: Promise<{ division?: string }>
}) {
  const { seasonSlug } = await params
  const { division: divisionParam } = await searchParams

  const season = await getData(seasonSlug)
  if (!season) notFound()

  // Select division from query param or default to first
  const activeDivision: Division =
    season.divisions.find((d) => d.id === divisionParam) ??
    season.divisions[0]

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/seasons" className="hover:text-brand transition-colors">Seasons</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/seasons/${season.slug}`} className="hover:text-brand transition-colors">{season.name}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">Standings</span>
      </nav>

      {/* Header */}
      <h1 className="mb-6 font-display text-3xl font-bold uppercase tracking-wide">
        Standings
      </h1>

      {season.divisions.length === 0 ? (
        <p className="text-muted-foreground">No divisions have been set up yet.</p>
      ) : (
        <>
          {/* Division tabs */}
          <div className="mb-4 flex gap-1 border-b border-border">
            {season.divisions.map((div) => (
              <Link
                key={div.id}
                href={`/seasons/${season.slug}/standings?division=${div.id}`}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
                  div.id === activeDivision?.id
                    ? "border-brand text-brand"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {TIER_LABEL[div.tier]}
              </Link>
            ))}
          </div>

          {/* Active division table */}
          {activeDivision && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <StandingsTable entries={activeDivision.standingEntries} />
            </div>
          )}

          {/* Legend */}
          <p className="mt-3 text-xs text-muted-foreground">
            GP = Games Played · W = Wins · L = Losses · GW = Game Wins · GL = Game Losses · GD = Game Differential · PTS = Points
          </p>
        </>
      )}
    </div>
  )
}
