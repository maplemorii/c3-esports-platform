/**
 * /(dashboard)/matches
 *
 * All upcoming + recent matches across every team the current user
 * owns or is an active roster member of.
 *
 * Check-in CTAs are surfaced inline when a match enters CHECKING_IN
 * and the user's team has not yet checked in.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  Swords,
  CalendarClock,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Shield,
  Zap,
  Scale,
  Ban,
} from "lucide-react"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"
import type { MatchStatus, MatchFormat } from "@prisma/client"

export const metadata: Metadata = { title: "My Matches" }

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getMyMatches(userId: string) {
  // All teams the user owns or actively plays for
  const [ownedTeams, memberships] = await Promise.all([
    prisma.team.findMany({
      where:  { ownerId: userId, deletedAt: null },
      select: { id: true },
    }),
    prisma.teamMembership.findMany({
      where: { leftAt: null, player: { userId, deletedAt: null }, team: { deletedAt: null } },
      select: { teamId: true },
    }),
  ])

  const teamIds = [...new Set([
    ...ownedTeams.map((t) => t.id),
    ...memberships.map((m) => m.teamId),
  ])]

  const ownedTeamIds = new Set(ownedTeams.map((t) => t.id))

  if (teamIds.length === 0) return { upcoming: [], recent: [], ownedTeamIds }

  const MATCH_SELECT = {
    id:               true,
    status:           true,
    format:           true,
    matchType:        true,
    scheduledAt:      true,
    checkInOpenAt:    true,
    checkInDeadlineAt: true,
    resultDeadlineAt: true,
    homeScore:        true,
    awayScore:        true,
    homeTeam: { select: { id: true, name: true, slug: true, logoUrl: true, primaryColor: true } },
    awayTeam: { select: { id: true, name: true, slug: true, logoUrl: true, primaryColor: true } },
    winner:   { select: { id: true, name: true } },
    division: {
      select: {
        name: true,
        tier: true,
        season: { select: { name: true, slug: true } },
      },
    },
    checkIns: {
      select: { teamId: true, status: true },
    },
  } as const

  const ACTIVE_STATUSES: MatchStatus[] = [
    "SCHEDULED", "CHECKING_IN", "IN_PROGRESS",
    "MATCH_FINISHED", "VERIFYING", "DISPUTED",
  ]
  const RECENT_STATUSES: MatchStatus[] = [
    "COMPLETED", "FORFEITED", "NO_SHOW", "CANCELLED",
  ]

  const teamFilter = { OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }] }

  const [upcoming, recent] = await Promise.all([
    prisma.match.findMany({
      where:   { ...teamFilter, status: { in: ACTIVE_STATUSES }, deletedAt: null },
      orderBy: [{ status: "asc" }, { scheduledAt: "asc" }],
      select:  MATCH_SELECT,
    }),
    prisma.match.findMany({
      where:   { ...teamFilter, status: { in: RECENT_STATUSES }, deletedAt: null },
      orderBy: { scheduledAt: "desc" },
      take:    20,
      select:  MATCH_SELECT,
    }),
  ])

  return { upcoming, recent, ownedTeamIds }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_META: Record<MatchStatus, { label: string; color: string; icon: React.ElementType }> = {
  SCHEDULED:      { label: "Scheduled",       color: "text-muted-foreground bg-muted/40 border-border",               icon: CalendarClock },
  CHECKING_IN:    { label: "Check-in Open",   color: "text-amber-400 bg-amber-400/10 border-amber-400/30",            icon: AlertCircle },
  IN_PROGRESS:    { label: "In Progress",     color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",      icon: Zap },
  MATCH_FINISHED: { label: "Awaiting Result", color: "text-sky-400 bg-sky-400/10 border-sky-400/30",                  icon: Clock },
  VERIFYING:      { label: "Verifying",       color: "text-violet-400 bg-violet-400/10 border-violet-400/30",         icon: Shield },
  DISPUTED:       { label: "Disputed",        color: "text-destructive bg-destructive/10 border-destructive/30",       icon: Scale },
  COMPLETED:      { label: "Completed",       color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",      icon: CheckCircle2 },
  FORFEITED:      { label: "Forfeited",       color: "text-orange-400 bg-orange-400/10 border-orange-400/30",         icon: XCircle },
  NO_SHOW:        { label: "No Show",         color: "text-muted-foreground bg-muted/40 border-border",               icon: XCircle },
  CANCELLED:      { label: "Cancelled",       color: "text-muted-foreground/60 bg-muted/20 border-border",            icon: Ban },
}

const FORMAT_LABEL: Record<MatchFormat, string> = { BO1: "BO1", BO3: "BO3", BO5: "BO5", BO7: "BO7" }

function formatMatchDate(date: Date | null): string {
  if (!date) return "TBD"
  return date.toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  })
}

function TeamLogo({ name, logoUrl, color }: { name: string; logoUrl: string | null; color: string | null }) {
  return (
    <div
      className="h-10 w-10 shrink-0 rounded-lg overflow-hidden flex items-center justify-center text-xs font-bold text-white border border-white/10"
      style={{ backgroundColor: color ?? "oklch(0.50 0.20 15)" }}
    >
      {logoUrl
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={logoUrl} alt={name} className="h-full w-full object-cover" />
        : name.slice(0, 2).toUpperCase()
      }
    </div>
  )
}

// ---------------------------------------------------------------------------
// Match card
// ---------------------------------------------------------------------------

type MatchRow = Awaited<ReturnType<typeof getMyMatches>>["upcoming"][number]

function MatchCard({
  match,
  ownedTeamIds,
}: {
  match: MatchRow
  ownedTeamIds: Set<string>
}) {
  const meta   = STATUS_META[match.status]
  const Icon   = meta.icon

  // Determine the user's side
  const myHomeTeam = ownedTeamIds.has(match.homeTeam.id)
  const myAwayTeam = ownedTeamIds.has(match.awayTeam.id)
  const myTeamId   = myHomeTeam ? match.homeTeam.id : myAwayTeam ? match.awayTeam.id : null

  // Check-in state
  const myCheckIn = myTeamId
    ? match.checkIns.find((c) => c.teamId === myTeamId)
    : null
  const needsCheckIn =
    match.status === "CHECKING_IN" &&
    myTeamId !== null &&
    ownedTeamIds.has(myTeamId) &&
    myCheckIn?.status !== "CHECKED_IN"

  // Result display
  const hasResult = match.homeScore !== null && match.awayScore !== null
  const homeWon   = hasResult && match.homeScore! > match.awayScore!
  const awayWon   = hasResult && match.awayScore! > match.homeScore!

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card transition-colors",
        needsCheckIn
          ? "border-amber-400/40 shadow-[0_0_0_1px_oklch(0.79_0.17_70/0.15)]"
          : "border-border hover:border-brand/30"
      )}
    >
      {/* Accent strip for urgent matches */}
      {needsCheckIn && (
        <div className="h-0.5 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" />
      )}

      <div className="p-4 sm:p-5">
        {/* Top row: division + format + status */}
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-muted-foreground truncate">
              {match.division.season.name} · {match.division.name}
            </span>
            <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase border border-border text-muted-foreground bg-muted/30">
              {FORMAT_LABEL[match.format]}
            </span>
          </div>

          <span className={cn(
            "flex items-center gap-1 shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium",
            meta.color
          )}>
            <Icon className="h-3 w-3" />
            {meta.label}
          </span>
        </div>

        {/* Teams row */}
        <div className="flex items-center gap-3">
          {/* Home team */}
          <div className={cn(
            "flex flex-1 items-center gap-2.5 min-w-0",
            homeWon && "opacity-100",
            awayWon && "opacity-50"
          )}>
            <TeamLogo
              name={match.homeTeam.name}
              logoUrl={match.homeTeam.logoUrl}
              color={match.homeTeam.primaryColor}
            />
            <div className="min-w-0">
              <p className={cn(
                "text-sm font-semibold truncate",
                myHomeTeam && "text-brand",
                homeWon && "font-bold"
              )}>
                {match.homeTeam.name}
                {myHomeTeam && <span className="ml-1 text-[10px] text-brand/70">(You)</span>}
              </p>
              <p className="text-xs text-muted-foreground">Home</p>
            </div>
          </div>

          {/* Score / VS */}
          <div className="flex flex-col items-center shrink-0 px-2">
            {hasResult ? (
              <div className="flex items-center gap-1.5 font-display text-xl font-bold tabular-nums">
                <span className={cn(homeWon ? "text-foreground" : "text-muted-foreground/60")}>
                  {match.homeScore}
                </span>
                <span className="text-muted-foreground/30">–</span>
                <span className={cn(awayWon ? "text-foreground" : "text-muted-foreground/60")}>
                  {match.awayScore}
                </span>
              </div>
            ) : (
              <span className="font-display text-xs font-bold uppercase tracking-widest text-muted-foreground/40">
                vs
              </span>
            )}
            {match.scheduledAt && (
              <p className="text-[10px] text-muted-foreground/60 mt-0.5 whitespace-nowrap">
                {formatMatchDate(match.scheduledAt)}
              </p>
            )}
          </div>

          {/* Away team */}
          <div className={cn(
            "flex flex-1 items-center justify-end gap-2.5 min-w-0",
            awayWon && "opacity-100",
            homeWon && "opacity-50"
          )}>
            <div className="min-w-0 text-right">
              <p className={cn(
                "text-sm font-semibold truncate",
                myAwayTeam && "text-brand",
                awayWon && "font-bold"
              )}>
                {myAwayTeam && <span className="mr-1 text-[10px] text-brand/70">(You)</span>}
                {match.awayTeam.name}
              </p>
              <p className="text-xs text-muted-foreground">Away</p>
            </div>
            <TeamLogo
              name={match.awayTeam.name}
              logoUrl={match.awayTeam.logoUrl}
              color={match.awayTeam.primaryColor}
            />
          </div>
        </div>

        {/* Actions row */}
        <div className="flex items-center justify-between gap-2 mt-4 flex-wrap">
          <div className="text-xs text-muted-foreground/60">
            {match.status === "CHECKING_IN" && match.checkInDeadlineAt && (
              <span className="text-amber-400">
                Check-in closes {formatMatchDate(match.checkInDeadlineAt)}
              </span>
            )}
            {match.status === "COMPLETED" && match.winner && (
              <span className="text-emerald-400 font-medium">
                Winner: {match.winner.name}
              </span>
            )}
            {match.status === "FORFEITED" && match.winner && (
              <span className="text-orange-400 font-medium">
                {match.winner.name} wins by forfeit
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {needsCheckIn && (
              <Link
                href={`/matches/${match.id}`}
                className={cn(buttonVariants({ size: "sm" }), "gap-1.5 text-xs bg-amber-500 hover:bg-amber-400 text-black border-0")}
              >
                <AlertCircle className="h-3.5 w-3.5" />
                Check In Now
              </Link>
            )}
            <Link
              href={`/matches/${match.id}`}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1 text-xs")}
            >
              Details
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardMatchesPage() {
  const session = await getSession()
  if (!session) redirect("/auth/signin")

  const { upcoming, recent, ownedTeamIds } = await getMyMatches(session.user.id)

  // Sort upcoming: check-in required first, then by scheduledAt
  const sortedUpcoming = [...upcoming].sort((a, b) => {
    const aUrgent = a.status === "CHECKING_IN" ? 0 : 1
    const bUrgent = b.status === "CHECKING_IN" ? 0 : 1
    if (aUrgent !== bUrgent) return aUrgent - bUrgent
    if (!a.scheduledAt) return 1
    if (!b.scheduledAt) return -1
    return a.scheduledAt.getTime() - b.scheduledAt.getTime()
  })

  const checkInCount = sortedUpcoming.filter((m) => {
    const myTeamId = ownedTeamIds.has(m.homeTeam.id)
      ? m.homeTeam.id
      : ownedTeamIds.has(m.awayTeam.id)
        ? m.awayTeam.id
        : null
    return (
      m.status === "CHECKING_IN" &&
      myTeamId !== null &&
      m.checkIns.find((c) => c.teamId === myTeamId)?.status !== "CHECKED_IN"
    )
  }).length

  return (
    <div className="mx-auto max-w-4xl space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide">
            My Matches
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Upcoming and recent matches across all your teams
          </p>
        </div>
        {checkInCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-sm font-medium text-amber-400">
            <AlertCircle className="h-4 w-4" />
            {checkInCount} check-in{checkInCount !== 1 ? "s" : ""} required
          </div>
        )}
      </div>

      {/* ── Upcoming & Active ──────────────────────────────────────── */}
      <section>
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Upcoming &amp; Active
        </h2>

        {sortedUpcoming.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted">
              <Swords className="h-5 w-5 text-muted-foreground/40" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">No upcoming matches.</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                Matches will appear here once they&apos;re scheduled.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sortedUpcoming.map((match) => (
              <MatchCard key={match.id} match={match} ownedTeamIds={ownedTeamIds} />
            ))}
          </div>
        )}
      </section>

      {/* ── Recent ──────────────────────────────────────────────────── */}
      {recent.length > 0 && (
        <section>
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Recent Results
          </h2>

          <div className="flex flex-col gap-3">
            {recent.map((match) => (
              <MatchCard key={match.id} match={match} ownedTeamIds={ownedTeamIds} />
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
