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
import { ChevronRight, Swords, Calendar } from "lucide-react"
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
      id:          true,
      status:      true,
      format:      true,
      scheduledAt: true,
      homeScore:   true,
      awayScore:   true,
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
  PREMIER:     "Premier",
  CHALLENGERS: "Challengers",
  CONTENDERS:  "Contenders",
}

const TIER_ACCENT: Record<DivisionTier, string> = {
  PREMIER:     "text-amber-400 border-amber-400",
  CHALLENGERS: "text-blue-400 border-blue-400",
  CONTENDERS:  "text-cyan-400 border-cyan-400",
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
  SCHEDULED:      "bg-white/5 text-muted-foreground border border-white/10",
  CHECKING_IN:    "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  IN_PROGRESS:    "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse",
  MATCH_FINISHED: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  VERIFYING:      "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  COMPLETED:      "bg-white/5 text-muted-foreground border border-white/10",
  DISPUTED:       "bg-destructive/15 text-destructive border border-destructive/30",
  FORFEITED:      "bg-white/5 text-muted-foreground border border-white/10",
  NO_SHOW:        "bg-white/5 text-muted-foreground border border-white/10",
  CANCELLED:      "bg-white/5 text-muted-foreground/40 border border-white/5",
}

// ---------------------------------------------------------------------------
// TeamSide — one side of the match card
// ---------------------------------------------------------------------------

function TeamSide({
  team,
  score,
  side,
  isWinner,
  isDone,
}: {
  team: Match["homeTeam"]
  score: number | null
  side: "home" | "away"
  isWinner: boolean
  isDone: boolean
}) {
  return (
    <div className={cn(
      "flex items-center gap-3 flex-1 min-w-0",
      side === "away" && "flex-row-reverse"
    )}>
      {/* Logo */}
      <div
        className="h-10 w-10 shrink-0 rounded-lg overflow-hidden flex items-center justify-center text-[11px] font-bold text-white shadow-sm"
        style={{ backgroundColor: team.primaryColor ?? "oklch(0.50 0.20 15)" }}
      >
        {team.logoUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={team.logoUrl} alt="" className="h-full w-full object-cover" />
          : team.name.slice(0, 2).toUpperCase()
        }
      </div>

      {/* Name */}
      <div className={cn("min-w-0 flex-1", side === "away" && "text-right")}>
        <p className={cn(
          "text-sm font-semibold truncate transition-colors",
          isDone && !isWinner ? "text-muted-foreground" : "text-foreground",
          isWinner && "text-white"
        )}>
          {team.name}
        </p>
      </div>

      {/* Score */}
      {score !== null && (
        <span className={cn(
          "shrink-0 font-display text-2xl font-bold tabular-nums",
          isWinner ? "text-white" : "text-muted-foreground"
        )}>
          {score}
        </span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// MatchCard
// ---------------------------------------------------------------------------

function MatchCard({ match }: { match: Match }) {
  const isDone  = match.status === "COMPLETED" || match.status === "FORFEITED"
  const homeWon = isDone && match.homeScore !== null && match.awayScore !== null && match.homeScore > match.awayScore
  const awayWon = isDone && match.homeScore !== null && match.awayScore !== null && match.awayScore > match.homeScore
  const isLive  = match.status === "IN_PROGRESS" || match.status === "CHECKING_IN"

  return (
    <Link
      href={`/matches/${match.id}`}
      className={cn(
        "group relative flex items-center gap-4 rounded-xl border bg-card px-5 py-4 overflow-hidden transition-all duration-150",
        isLive
          ? "border-emerald-500/30 hover:border-emerald-500/50"
          : "border-border hover:border-border/80 hover:bg-muted/10"
      )}
    >
      {/* Live pulse bar */}
      {isLive && (
        <div
          className="absolute top-0 left-0 right-0 h-px animate-pulse"
          style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.6), rgba(59,130,246,0.5), transparent)" }}
          aria-hidden
        />
      )}

      {/* Home team */}
      <TeamSide team={match.homeTeam} score={match.homeScore} side="home" isWinner={homeWon} isDone={isDone} />

      {/* Centre */}
      <div className="flex shrink-0 flex-col items-center gap-1.5 px-3 min-w-25">
        <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide", STATUS_CLASSES[match.status])}>
          {STATUS_LABEL[match.status]}
        </span>
        {match.scheduledAt && match.status === "SCHEDULED" && (
          <span className="text-[10px] text-muted-foreground text-center">
            {formatDateTime(new Date(match.scheduledAt))}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground/60 font-medium">{match.format}</span>
      </div>

      {/* Away team */}
      <TeamSide team={match.awayTeam} score={match.awayScore} side="away" isWinner={awayWon} isDone={isDone} />
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
  type WeekGroup = { weekNumber: number; label: string | null; startDate: Date | null; endDate: Date | null; matches: Match[] }
  const weekMap = new Map<number, WeekGroup>()

  for (const match of matches) {
    const wn = match.leagueWeek?.weekNumber ?? 0
    if (!weekMap.has(wn)) {
      weekMap.set(wn, {
        weekNumber: wn,
        label:      match.leagueWeek?.label ?? null,
        startDate:  match.leagueWeek?.startDate ? new Date(match.leagueWeek.startDate) : null,
        endDate:    match.leagueWeek?.endDate   ? new Date(match.leagueWeek.endDate)   : null,
        matches:    [],
      })
    }
    weekMap.get(wn)!.matches.push(match)
  }

  const weeks = Array.from(weekMap.values()).sort((a, b) => a.weekNumber - b.weekNumber)

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
          <span className="text-foreground">Schedule</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <p className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-[0.3em] text-brand/70">
            {season.name}
          </p>
          <h1 className="font-display text-5xl font-bold uppercase tracking-tight text-foreground sm:text-6xl">
            Schedule
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
              href={`/seasons/${season.slug}/matches`}
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
                  href={`/seasons/${season.slug}/matches?division=${div.id}`}
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
        {weeks.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-32 text-center">
            <Swords className="h-12 w-12 text-muted-foreground/20" />
            <p className="text-muted-foreground">No matches scheduled yet.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {weeks.map((week) => (
              <section key={week.weekNumber}>
                {/* Week header */}
                <div className="mb-4 flex items-center gap-4">
                  <div>
                    <h2 className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                      {week.weekNumber === 0
                        ? "Unscheduled"
                        : week.label ?? `Week ${week.weekNumber}`}
                    </h2>
                    {week.startDate && (
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                        <Calendar className="h-3 w-3" />
                        {formatDate(week.startDate)}
                        {week.endDate && ` – ${formatDate(week.endDate)}`}
                      </p>
                    )}
                  </div>
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                  <span className="text-[11px] text-muted-foreground/50">
                    {week.matches.length} {week.matches.length === 1 ? "match" : "matches"}
                  </span>
                </div>

                <ul className="space-y-2">
                  {week.matches.map((match) => (
                    <li key={match.id}>
                      <MatchCard match={match} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
