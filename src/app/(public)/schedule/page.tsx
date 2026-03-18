/**
 * /schedule
 *
 * Upcoming match schedule for the active season, grouped by week.
 * Shows all divisions by default; filterable per division.
 * Completed / cancelled matches are excluded — use /matches for full history.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { CalendarDays, ChevronRight, Clock } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import type { DivisionTier, MatchStatus } from "@prisma/client"

export const metadata: Metadata = {
  title: "Schedule — C3 Esports",
  description: "Upcoming match schedule for the C3 Esports collegiate league.",
}
export const dynamic = "force-dynamic"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MatchRow = {
  id: string
  status: MatchStatus
  scheduledAt: Date | null
  format: string
  homeScore: number | null
  awayScore: number | null
  homeTeam: { id: string; name: string; slug: string; logoUrl: string | null; primaryColor: string | null }
  awayTeam: { id: string; name: string; slug: string; logoUrl: string | null; primaryColor: string | null }
  division:  { id: string; name: string; tier: DivisionTier }
  leagueWeek: { weekNumber: number; label: string | null; startDate: Date | null } | null
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

  const where = {
    deletedAt: null as null,
    status:    { in: ["SCHEDULED", "CHECKING_IN", "IN_PROGRESS"] as MatchStatus[] },
    ...(divisionId
      ? { divisionId }
      : { division: { seasonId: season.id } }),
  }

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
      division:    { select: { id: true, name: true, tier: true } },
      homeTeam:    { select: { id: true, name: true, slug: true, logoUrl: true, primaryColor: true } },
      awayTeam:    { select: { id: true, name: true, slug: true, logoUrl: true, primaryColor: true } },
    },
  })

  return { season, matches: matches as MatchRow[] }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TIER_LABEL: Record<DivisionTier, string> = {
  PREMIER:     "Premier",
  CHALLENGERS: "Challengers",
  CONTENDERS:  "Contenders",
}

const TIER_COLOR: Record<DivisionTier, string> = {
  PREMIER:     "text-amber-400 border-amber-400/40 bg-amber-400/8",
  CHALLENGERS: "text-blue-400 border-blue-400/40 bg-blue-400/8",
  CONTENDERS:  "text-cyan-400 border-cyan-400/40 bg-cyan-400/8",
}

const STATUS_LABEL: Partial<Record<MatchStatus, { label: string; color: string }>> = {
  CHECKING_IN: { label: "Check-in Open", color: "text-amber-400" },
  IN_PROGRESS: { label: "Live",          color: "text-emerald-400" },
}

function formatMatchDate(d: Date | null) {
  if (!d) return { date: "TBD", time: "" }
  const date = new Date(d)
  return {
    date: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    time: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  }
}

// ---------------------------------------------------------------------------
// Match card
// ---------------------------------------------------------------------------
function ScheduleMatchCard({ match }: { match: MatchRow }) {
  const { date, time } = formatMatchDate(match.scheduledAt)
  const statusMeta = STATUS_LABEL[match.status]

  return (
    <Link
      href={`/matches/${match.id}`}
      className="group flex items-center gap-4 rounded-xl border px-4 py-3.5 transition-all duration-150"
      style={{
        background:   "rgba(255,255,255,0.025)",
        borderColor:  "rgba(255,255,255,0.07)",
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.background    = "rgba(255,255,255,0.05)"
        ;(e.currentTarget as HTMLElement).style.borderColor   = "rgba(255,255,255,0.12)"
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.background    = "rgba(255,255,255,0.025)"
        ;(e.currentTarget as HTMLElement).style.borderColor   = "rgba(255,255,255,0.07)"
      }}
    >
      {/* Date/time column */}
      <div className="w-20 shrink-0 text-right hidden sm:block">
        <p className="text-xs font-semibold text-white/60 leading-tight">{date}</p>
        {time && <p className="text-[11px] text-white/30 mt-0.5">{time}</p>}
      </div>

      <div className="h-8 w-px shrink-0 hidden sm:block" style={{ background: "rgba(255,255,255,0.07)" }} />

      {/* Home team */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end">
        <p className="text-sm font-semibold text-white/80 truncate group-hover:text-white transition-colors">
          {match.homeTeam.name}
        </p>
        <div
          className="h-7 w-7 shrink-0 rounded-md flex items-center justify-center text-[10px] font-bold text-white"
          style={{ background: match.homeTeam.primaryColor ?? "oklch(0.50 0.20 15)" }}
        >
          {match.homeTeam.logoUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={match.homeTeam.logoUrl} alt="" className="h-full w-full object-cover rounded-md" />
            : match.homeTeam.name.slice(0, 2).toUpperCase()
          }
        </div>
      </div>

      {/* VS / score */}
      <div className="flex flex-col items-center gap-0.5 shrink-0 w-14">
        {statusMeta ? (
          <span className={cn("text-[10px] font-bold uppercase tracking-wide", statusMeta.color)}>
            {statusMeta.label}
          </span>
        ) : (
          <span className="text-[11px] font-bold text-white/25 uppercase tracking-widest">vs</span>
        )}
        <span className="text-[10px] text-white/20 uppercase tracking-wider">{match.format}</span>
      </div>

      {/* Away team */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <div
          className="h-7 w-7 shrink-0 rounded-md flex items-center justify-center text-[10px] font-bold text-white"
          style={{ background: match.awayTeam.primaryColor ?? "oklch(0.50 0.20 15)" }}
        >
          {match.awayTeam.logoUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={match.awayTeam.logoUrl} alt="" className="h-full w-full object-cover rounded-md" />
            : match.awayTeam.name.slice(0, 2).toUpperCase()
          }
        </div>
        <p className="text-sm font-semibold text-white/80 truncate group-hover:text-white transition-colors">
          {match.awayTeam.name}
        </p>
      </div>

      {/* Division badge — right */}
      <div className="hidden lg:block shrink-0">
        <span className={cn(
          "rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
          TIER_COLOR[match.division.tier]
        )}>
          {TIER_LABEL[match.division.tier]}
        </span>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-white/20 group-hover:text-white/50 transition-colors" />
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Week group
// ---------------------------------------------------------------------------
function WeekGroup({
  weekNumber,
  label,
  startDate,
  matches,
}: {
  weekNumber: number
  label: string | null
  startDate: Date | null
  matches: MatchRow[]
}) {
  const weekLabel = label ?? `Week ${weekNumber}`
  const weekDate  = startDate
    ? new Date(startDate).toLocaleDateString("en-US", { month: "long", day: "numeric" })
    : null

  return (
    <div>
      {/* Week header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" style={{ color: "rgba(59,130,246,0.7)" }} />
          <span className="font-display text-sm font-bold uppercase tracking-wide text-white/70">
            {weekLabel}
          </span>
          {weekDate && (
            <span className="text-xs text-white/30">— {weekDate}</span>
          )}
        </div>
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
        <span className="text-xs text-white/25 tabular-nums">{matches.length} match{matches.length !== 1 ? "es" : ""}</span>
      </div>

      <div className="flex flex-col gap-2 mb-8">
        {matches.map((m) => (
          <ScheduleMatchCard key={m.id} match={m} />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ division?: string }>
}) {
  const { division: divisionParam } = await searchParams
  const data = await getData(divisionParam)

  // Group matches by week
  type WeekGroup = { weekNumber: number; label: string | null; startDate: Date | null; matches: MatchRow[] }
  const weekMap = new Map<number, WeekGroup>()

  if (data) {
    for (const m of data.matches) {
      const wn = m.leagueWeek?.weekNumber ?? 0
      if (!weekMap.has(wn)) {
        weekMap.set(wn, { weekNumber: wn, label: m.leagueWeek?.label ?? null, startDate: m.leagueWeek?.startDate ?? null, matches: [] })
      }
      weekMap.get(wn)!.matches.push(m)
    }
  }

  const weeks = Array.from(weekMap.values()).sort((a, b) => a.weekNumber - b.weekNumber)
  const totalMatches = data?.matches.length ?? 0

  return (
    <div className="relative min-h-screen">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 h-64 w-[600px] -translate-x-1/2 opacity-15"
        style={{ background: "radial-gradient(ellipse, rgba(59,130,246,0.5), transparent 70%)", filter: "blur(60px)" }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-5xl px-6 py-16 md:px-10 md:py-20">

        {/* Header */}
        <div className="mb-10">
          <p className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-[0.3em]"
            style={{ color: "rgba(196,28,53,0.7)" }}>
            {data?.season.name ?? "C3 Esports"}
          </p>
          <h1 className="font-display text-5xl font-bold uppercase tracking-tight text-white sm:text-6xl">
            Schedule
          </h1>
          <p className="mt-3 text-sm text-white/40">
            Upcoming matches · {totalMatches} match{totalMatches !== 1 ? "es" : ""} remaining
          </p>
          <div
            className="mt-5 h-px w-24"
            style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.6), rgba(59,130,246,0.3), transparent)" }}
          />
        </div>

        {/* Division filter */}
        {data && data.season.divisions.length > 1 && (
          <div className="mb-8 flex gap-2 flex-wrap">
            <Link
              href="/schedule"
              className={cn(
                "rounded-lg border px-4 py-1.5 text-sm font-semibold transition-all duration-150",
                !divisionParam
                  ? "bg-white/8 text-white border-white/20"
                  : "border-transparent text-white/40 hover:text-white/70 hover:bg-white/5"
              )}
            >
              All Divisions
            </Link>
            {data.season.divisions.map((div) => (
              <Link
                key={div.id}
                href={`/schedule?division=${div.id}`}
                className={cn(
                  "rounded-lg border px-4 py-1.5 text-sm font-semibold transition-all duration-150",
                  div.id === divisionParam
                    ? cn("bg-white/8 text-white border-white/20", TIER_COLOR[div.tier])
                    : "border-transparent text-white/40 hover:text-white/70 hover:bg-white/5"
                )}
              >
                {TIER_LABEL[div.tier]}
              </Link>
            ))}
          </div>
        )}

        {/* Content */}
        {!data || totalMatches === 0 ? (
          <div className="flex flex-col items-center gap-5 py-32 text-center">
            <div className="rounded-full p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Clock className="h-8 w-8 text-white/20" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white/50">No upcoming matches</p>
              <p className="mt-1 text-xs text-white/25">
                Check back when the next week is scheduled, or view{" "}
                <Link href="/matches" className="text-blue-400/70 hover:text-blue-400 underline underline-offset-2">all results</Link>.
              </p>
            </div>
          </div>
        ) : (
          <div>
            {weeks.map((week) => (
              <WeekGroup key={week.weekNumber} {...week} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
