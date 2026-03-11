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
import { ChevronRight, ArrowUp, ArrowDown, Minus, BarChart2 } from "lucide-react"
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
  PREMIER:     "Premier",
  CHALLENGERS: "Challengers",
  CONTENDERS:  "Contenders",
}

const TIER_ACCENT: Record<DivisionTier, string> = {
  PREMIER:     "text-amber-400 border-amber-400",
  CHALLENGERS: "text-blue-400 border-blue-400",
  CONTENDERS:  "text-cyan-400 border-cyan-400",
}

const RANK_STYLES: Record<number, { color: string; bg: string }> = {
  1: { color: "rgba(234,179,8,0.9)",   bg: "rgba(234,179,8,0.04)" },
  2: { color: "rgba(200,200,200,0.7)", bg: "" },
  3: { color: "rgba(180,110,60,0.9)",  bg: "" },
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
      {isWin ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
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
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <BarChart2 className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No teams registered yet.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <th className="py-4 pl-6 pr-2 text-left w-10">#</th>
            <th className="py-4 px-3 text-left">Team</th>
            <th className="py-4 px-3 text-center">GP</th>
            <th className="py-4 px-3 text-center">W</th>
            <th className="py-4 px-3 text-center">L</th>
            <th className="py-4 px-3 text-center hidden sm:table-cell">GW</th>
            <th className="py-4 px-3 text-center hidden sm:table-cell">GL</th>
            <th className="py-4 px-3 text-center hidden md:table-cell">GD</th>
            <th className="py-4 px-3 text-center font-bold text-foreground/60">PTS</th>
            <th className="py-4 pl-3 pr-6 text-center hidden lg:table-cell">Streak</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => {
            const rank = i + 1
            const rankStyle = RANK_STYLES[rank]
            return (
              <tr
                key={entry.id}
                className="group transition-colors hover:bg-white/[0.03]"
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  background: rankStyle?.bg || undefined,
                }}
              >
                {/* Rank */}
                <td className="py-4 pl-6 pr-2">
                  <span
                    className="font-display text-base font-bold tabular-nums"
                    style={{ color: rankStyle?.color ?? "rgba(255,255,255,0.25)" }}
                  >
                    {rank}
                  </span>
                </td>

                {/* Team */}
                <td className="py-4 px-3">
                  <Link
                    href={`/teams/${entry.team.slug}`}
                    className="flex items-center gap-3 hover:text-brand transition-colors duration-150"
                  >
                    <div
                      className="h-8 w-8 shrink-0 rounded overflow-hidden flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: entry.team.primaryColor ?? "oklch(0.50 0.20 15)" }}
                    >
                      {entry.team.logoUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={entry.team.logoUrl} alt="" className="h-full w-full object-cover" />
                        : entry.team.name.slice(0, 2).toUpperCase()
                      }
                    </div>
                    <span className="font-semibold truncate">{entry.team.name}</span>
                  </Link>
                </td>

                <td className="py-4 px-3 text-center tabular-nums text-muted-foreground">{entry.matchesPlayed}</td>
                <td className="py-4 px-3 text-center tabular-nums font-semibold text-emerald-400">{entry.wins}</td>
                <td className="py-4 px-3 text-center tabular-nums text-destructive">{entry.losses}</td>
                <td className="py-4 px-3 text-center tabular-nums text-muted-foreground hidden sm:table-cell">{entry.gamesWon}</td>
                <td className="py-4 px-3 text-center tabular-nums text-muted-foreground hidden sm:table-cell">{entry.gamesLost}</td>
                <td className={cn(
                  "py-4 px-3 text-center tabular-nums font-medium hidden md:table-cell",
                  entry.gameDifferential > 0 ? "text-emerald-400" : entry.gameDifferential < 0 ? "text-destructive" : "text-muted-foreground"
                )}>
                  {entry.gameDifferential > 0 ? `+${entry.gameDifferential}` : entry.gameDifferential}
                </td>
                <td className="py-4 px-3 text-center">
                  <span className="font-display text-base font-bold tabular-nums text-foreground">
                    {entry.points}
                  </span>
                </td>
                <td className="py-4 pl-3 pr-6 text-center hidden lg:table-cell">
                  <StreakBadge streak={entry.streak} />
                </td>
              </tr>
            )
          })}
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

  const activeDivision: Division =
    season.divisions.find((d) => d.id === divisionParam) ??
    season.divisions[0]

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
          <span className="text-foreground">Standings</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <p className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-[0.3em] text-brand/70">
            {season.name}
          </p>
          <h1 className="font-display text-5xl font-bold uppercase tracking-tight text-foreground sm:text-6xl">
            Standings
          </h1>
          <div
            className="mt-6 h-px w-24"
            style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.6), rgba(59,130,246,0.3), transparent)" }}
          />
        </div>

        {season.divisions.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-32 text-center">
            <BarChart2 className="h-12 w-12 text-muted-foreground/20" />
            <p className="text-muted-foreground">No divisions have been set up yet.</p>
          </div>
        ) : (
          <>
            {/* Division tabs */}
            <div className="mb-6 flex gap-2 flex-wrap">
              {season.divisions.map((div) => {
                const isActive = div.id === activeDivision?.id
                return (
                  <Link
                    key={div.id}
                    href={`/seasons/${season.slug}/standings?division=${div.id}`}
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

            {/* Standings table */}
            {activeDivision && (
              <div className="rounded-2xl overflow-hidden border border-border bg-card">
                {/* Division header */}
                <div
                  className="relative px-6 py-4 border-b border-border"
                  style={{ background: "rgba(255,255,255,0.02)" }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-px"
                    style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.5), rgba(59,130,246,0.3), transparent)" }}
                    aria-hidden
                  />
                  <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                    {TIER_LABEL[activeDivision.tier]} Division · {activeDivision.standingEntries.length} teams
                  </h2>
                </div>
                <StandingsTable entries={activeDivision.standingEntries} />
              </div>
            )}

            {/* Legend */}
            <p className="mt-4 text-xs text-muted-foreground/60">
              GP = Games Played · W = Wins · L = Losses · GW = Game Wins · GL = Game Losses · GD = Game Diff · PTS = Points
            </p>
          </>
        )}
      </div>
    </div>
  )
}
