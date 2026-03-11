/**
 * /seasons/[seasonSlug]/matches
 *
 * Public match schedule page. Shows matches grouped by league week.
 * Filterable by division (?division=<id>) and week (?week=<number>).
 */

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { ChevronRight, Swords } from "lucide-react"
import { formatDate, formatDateTime } from "@/lib/utils/dates"
import type { MatchStatus, DivisionTier } from "@prisma/client"

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function getData(slug: string, divisionId?: string, weekNumber?: number) {
  const season = await prisma.season.findFirst({
    where: { slug, isVisible: true },
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

  // Build match filter
  const divisionFilter = divisionId
    ? { divisionId }
    : { division: { seasonId: season.id } }

  const weekFilter = weekNumber
    ? { leagueWeek: { seasonId: season.id, weekNumber } }
    : { leagueWeek: { seasonId: season.id } }

  const matches = await prisma.match.findMany({
    where: { ...divisionFilter, ...weekFilter, deletedAt: null },
    orderBy: [
      { leagueWeek: { weekNumber: "asc" } },
      { scheduledAt: "asc" },
    ],
    select: {
      id:         true,
      status:     true,
      format:     true,
      scheduledAt:true,
      homeScore:  true,
      awayScore:  true,
      leagueWeek: { select: { weekNumber: true, label: true, startDate: true, endDate: true } },
      homeTeam:   { select: { id: true, name: true, slug: true, logoUrl: true, primaryColor: true } },
      awayTeam:   { select: { id: true, name: true, slug: true, logoUrl: true, primaryColor: true } },
    },
  })

  return { season, matches }
}

type Season = NonNullable<Awaited<ReturnType<typeof getData>>>["season"]
type Match  = NonNullable<Awaited<ReturnType<typeof getData>>>["matches"][number]

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ seasonSlug: string }>
}): Promise<Metadata> {
  const { seasonSlug } = await params
  const data = await getData(seasonSlug)
  if (!data) return { title: "Match Schedule" }
  const title       = `Schedule — ${data.season.name}`
  const description = `Full match schedule for ${data.season.name} — C3 Esports League.`
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

const STATUS_LABEL: Record<MatchStatus, string> = {
  SCHEDULED:      "Scheduled",
  CHECKING_IN:    "Check-in",
  IN_PROGRESS:    "Live",
  MATCH_FINISHED: "Finished",
  VERIFYING:      "Verifying",
  COMPLETED:      "Final",
  DISPUTED:       "Disputed",
  FORFEITED:      "Forfeit",
  NO_SHOW:        "No Show",
  CANCELLED:      "Cancelled",
}

const STATUS_CLASSES: Record<MatchStatus, string> = {
  SCHEDULED:      "bg-muted text-muted-foreground",
  CHECKING_IN:    "bg-sky-500/15 text-sky-400",
  IN_PROGRESS:    "bg-emerald-500/15 text-emerald-400 animate-pulse",
  MATCH_FINISHED: "bg-amber-500/15 text-amber-400",
  VERIFYING:      "bg-amber-500/15 text-amber-400",
  COMPLETED:      "bg-muted text-muted-foreground",
  DISPUTED:       "bg-destructive/15 text-destructive",
  FORFEITED:      "bg-muted text-muted-foreground",
  NO_SHOW:        "bg-muted text-muted-foreground",
  CANCELLED:      "bg-muted/50 text-muted-foreground/50",
}

// ---------------------------------------------------------------------------
// MatchRow
// ---------------------------------------------------------------------------

function TeamHalf({
  team,
  score,
  side,
  isWinner,
}: {
  team: Match["homeTeam"]
  score: number | null
  side: "home" | "away"
  isWinner: boolean
}) {
  return (
    <div className={cn(
      "flex items-center gap-2 flex-1 min-w-0",
      side === "away" && "flex-row-reverse text-right"
    )}>
      <div
        className="h-8 w-8 shrink-0 rounded overflow-hidden flex items-center justify-center text-[10px] font-bold text-white"
        style={{ backgroundColor: team.primaryColor ?? "oklch(0.50 0.20 15)" }}
      >
        {team.logoUrl
          ? <img src={team.logoUrl} alt="" className="h-full w-full object-cover" />
          : team.name.slice(0, 2).toUpperCase()
        }
      </div>
      <span className={cn(
        "truncate text-sm font-semibold",
        !isWinner && score !== null && "text-muted-foreground"
      )}>
        {team.name}
      </span>
      {score !== null && (
        <span className={cn(
          "shrink-0 text-lg font-bold tabular-nums",
          isWinner ? "text-foreground" : "text-muted-foreground"
        )}>
          {score}
        </span>
      )}
    </div>
  )
}

function MatchRow({ match }: { match: Match }) {
  const isDone    = match.status === "COMPLETED" || match.status === "FORFEITED"
  const homeWon   = isDone && match.homeScore !== null && match.awayScore !== null && match.homeScore > match.awayScore
  const awayWon   = isDone && match.homeScore !== null && match.awayScore !== null && match.awayScore > match.homeScore

  return (
    <Link
      href={`/matches/${match.id}`}
      className="group flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 hover:border-brand/30 transition-colors"
    >
      {/* Home team */}
      <TeamHalf team={match.homeTeam} score={match.homeScore} side="home" isWinner={homeWon} />

      {/* Centre */}
      <div className="flex shrink-0 flex-col items-center gap-1 px-2">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
            STATUS_CLASSES[match.status]
          )}
        >
          {STATUS_LABEL[match.status]}
        </span>
        {match.scheduledAt && match.status === "SCHEDULED" && (
          <span className="text-[10px] text-muted-foreground">
            {formatDateTime(new Date(match.scheduledAt))}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground">{match.format}</span>
      </div>

      {/* Away team */}
      <TeamHalf team={match.awayTeam} score={match.awayScore} side="away" isWinner={awayWon} />
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function MatchesPage({
  params,
  searchParams,
}: {
  params: Promise<{ seasonSlug: string }>
  searchParams: Promise<{ division?: string; week?: string }>
}) {
  const { seasonSlug } = await params
  const { division: divisionParam, week: weekParam } = await searchParams
  const weekNumber = weekParam ? parseInt(weekParam, 10) : undefined

  const data = await getData(seasonSlug, divisionParam, weekNumber)
  if (!data) notFound()

  const { season, matches } = data

  // Group by week number
  type WeekGroup = { weekNumber: number; label: string | null; startDate: Date | null; matches: Match[] }
  const weekMap = new Map<number, WeekGroup>()

  for (const match of matches) {
    const wn = match.leagueWeek?.weekNumber ?? 0
    if (!weekMap.has(wn)) {
      weekMap.set(wn, {
        weekNumber: wn,
        label:      match.leagueWeek?.label ?? null,
        startDate:  match.leagueWeek?.startDate ? new Date(match.leagueWeek.startDate) : null,
        matches:    [],
      })
    }
    weekMap.get(wn)!.matches.push(match)
  }

  const weeks = Array.from(weekMap.values()).sort((a, b) => a.weekNumber - b.weekNumber)

  const activeDivision = season.divisions.find((d) => d.id === divisionParam)

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/seasons" className="hover:text-brand transition-colors">Seasons</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/seasons/${season.slug}`} className="hover:text-brand transition-colors">{season.name}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground">Schedule</span>
      </nav>

      <h1 className="mb-6 font-display text-3xl font-bold uppercase tracking-wide">
        Match Schedule
      </h1>

      {/* Division filter tabs */}
      {season.divisions.length > 1 && (
        <div className="mb-6 flex gap-1 border-b border-border">
          <Link
            href={`/seasons/${season.slug}/matches`}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              !divisionParam
                ? "border-brand text-brand"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            All
          </Link>
          {season.divisions.map((div) => (
            <Link
              key={div.id}
              href={`/seasons/${season.slug}/matches?division=${div.id}`}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
                div.id === divisionParam
                  ? "border-brand text-brand"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {TIER_LABEL[div.tier]}
            </Link>
          ))}
        </div>
      )}

      {/* Matches */}
      {weeks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Swords className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-muted-foreground">No matches scheduled yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {weeks.map((week) => (
            <section key={week.weekNumber}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {week.weekNumber === 0
                    ? "Unscheduled"
                    : week.label ?? `Week ${week.weekNumber}`}
                </h2>
                {week.startDate && (
                  <span className="text-xs text-muted-foreground">
                    {formatDate(week.startDate)}
                  </span>
                )}
              </div>
              <ul className="space-y-2">
                {week.matches.map((match) => (
                  <li key={match.id}>
                    <MatchRow match={match} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
