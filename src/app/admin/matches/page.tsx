/**
 * /admin/matches
 *
 * Staff match list — filterable by status, division, and league week.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils/dates"
import { Swords, ChevronRight } from "lucide-react"
import type { MatchStatus } from "@prisma/client"

export const metadata: Metadata = { title: "Matches — Staff" }

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 30

const STATUS_META: Record<MatchStatus, { label: string; cls: string }> = {
  SCHEDULED:      { label: "Scheduled",      cls: "bg-sky-500/15 text-sky-400" },
  CHECKING_IN:    { label: "Check-In",       cls: "bg-amber-500/15 text-amber-400" },
  IN_PROGRESS:    { label: "In Progress",    cls: "bg-brand/15 text-brand" },
  MATCH_FINISHED: { label: "Match Finished", cls: "bg-purple-500/15 text-purple-400" },
  VERIFYING:      { label: "Verifying",      cls: "bg-sky-500/15 text-sky-400" },
  COMPLETED:      { label: "Completed",      cls: "bg-emerald-500/15 text-emerald-400" },
  CANCELLED:      { label: "Cancelled",      cls: "bg-muted text-muted-foreground" },
  FORFEITED:      { label: "Forfeited",      cls: "bg-destructive/15 text-destructive" },
  DISPUTED:       { label: "Disputed",       cls: "bg-orange-500/15 text-orange-400" },
  NO_SHOW:        { label: "No Show",        cls: "bg-muted text-muted-foreground" },
}

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: "All",            value: "" },
  { label: "Scheduled",     value: "SCHEDULED" },
  { label: "Check-In",      value: "CHECKING_IN" },
  { label: "In Progress",   value: "IN_PROGRESS" },
  { label: "Verifying",     value: "VERIFYING" },
  { label: "Completed",     value: "COMPLETED" },
  { label: "Disputed",      value: "DISPUTED" },
  { label: "Forfeited",     value: "FORFEITED" },
  { label: "Cancelled",     value: "CANCELLED" },
]

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function getData(opts: {
  status?: MatchStatus
  divisionId?: string
  weekId?: string
  page: number
}) {
  const { status, divisionId, weekId, page } = opts

  const where = {
    deletedAt: null,
    ...(status     && { status }),
    ...(divisionId && { divisionId }),
    ...(weekId     && { leagueWeekId: weekId }),
  }

  const [matches, total, divisions, seasons] = await Promise.all([
    prisma.match.findMany({
      where,
      orderBy: [{ scheduledAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id:          true,
        status:      true,
        scheduledAt: true,
        completedAt: true,
        homeScore:   true,
        awayScore:   true,
        homeTeam:    { select: { id: true, name: true } },
        awayTeam:    { select: { id: true, name: true } },
        winner:      { select: { id: true } },
        division:    { select: { id: true, name: true, tier: true, season: { select: { id: true, name: true } } } },
        leagueWeek:  { select: { id: true, weekNumber: true } },
      },
    }),
    prisma.match.count({ where }),
    prisma.division.findMany({
      orderBy: [{ season: { createdAt: "desc" } }, { tier: "asc" }],
      select: { id: true, name: true, tier: true, season: { select: { name: true } } },
    }),
    prisma.season.findMany({
      where: { status: { in: ["ACTIVE", "PLAYOFFS", "REGISTRATION"] } },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
  ])

  return { matches, total, totalPages: Math.ceil(total / PAGE_SIZE), divisions, seasons }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminMatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; divisionId?: string; weekId?: string; page?: string }>
}) {
  const { status: statusParam, divisionId, weekId, page: pageParam } = await searchParams
  const status = (statusParam as MatchStatus | undefined) || undefined
  const page   = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1

  const { matches, total, totalPages, divisions } = await getData({ status, divisionId, weekId, page })

  function buildUrl(params: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    if (statusParam)  p.set("status",     statusParam)
    if (divisionId)   p.set("divisionId", divisionId)
    if (weekId)       p.set("weekId",     weekId)
    Object.entries(params).forEach(([k, v]) => {
      if (v) p.set(k, v); else p.delete(k)
    })
    const s = p.toString()
    return `/admin/matches${s ? `?${s}` : ""}`
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide">Matches</h1>
          <p className="mt-1 text-sm text-muted-foreground">{total.toLocaleString()} total</p>
        </div>
        <Link
          href="/admin/matches/create"
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90 transition-colors shrink-0"
        >
          + Schedule Match
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {STATUS_FILTERS.map(({ label, value }) => (
          <Link
            key={value}
            href={buildUrl({ status: value || undefined, page: undefined })}
            className={cn(
              "shrink-0 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              (statusParam ?? "") === value
                ? "border-brand text-brand"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Division filter */}
      <div className="flex gap-2 items-center flex-wrap">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">Division:</span>
        <Link
          href={buildUrl({ divisionId: undefined, page: undefined })}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
            !divisionId ? "border-brand text-brand bg-brand/10" : "border-border text-muted-foreground hover:bg-muted/30",
          )}
        >
          All
        </Link>
        {divisions.map((d) => (
          <Link
            key={d.id}
            href={buildUrl({ divisionId: d.id, page: undefined })}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
              divisionId === d.id ? "border-brand text-brand bg-brand/10" : "border-border text-muted-foreground hover:bg-muted/30",
            )}
          >
            {d.season.name} · {d.name}
          </Link>
        ))}
      </div>

      {/* Match list */}
      {matches.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Swords className="mx-auto h-8 w-8 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No matches found.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          {matches.map((match) => {
            const meta = STATUS_META[match.status]
            return (
              <Link
                key={match.id}
                href={`/admin/matches/${match.id}`}
                className="group flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors"
              >
                {/* Teams + score */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">
                      {match.homeTeam.name}
                    </span>
                    {match.homeScore !== null && match.awayScore !== null ? (
                      <span className="font-display text-sm font-bold tabular-nums">
                        {match.homeScore} – {match.awayScore}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">vs</span>
                    )}
                    <span className="text-sm font-semibold">{match.awayTeam.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {match.division.season.name} · {match.division.name}
                    {match.leagueWeek && ` · Week ${match.leagueWeek.weekNumber}`}
                    {match.scheduledAt && ` · ${formatDate(new Date(match.scheduledAt))}`}
                  </p>
                </div>

                {/* Status badge */}
                <span className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase",
                  meta.cls,
                )}>
                  {meta.label}
                </span>

                <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground/60 shrink-0 transition-colors" />
              </Link>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} matches total</span>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link href={buildUrl({ page: String(page - 1) })} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted/30 transition-colors">
                Previous
              </Link>
            )}
            <span className="text-xs">Page {page} of {totalPages}</span>
            {page < totalPages && (
              <Link href={buildUrl({ page: String(page + 1) })} className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-muted/30 transition-colors">
                Next
              </Link>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
