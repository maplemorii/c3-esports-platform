/**
 * /admin/seasons
 *
 * Full season list for staff. Shows all seasons across all statuses,
 * with links to manage registrations and a button to create a new season.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils/dates"
import { Plus, Calendar, ChevronRight, ClipboardList, Settings } from "lucide-react"
import type { SeasonStatus, DivisionTier } from "@prisma/client"

export const metadata: Metadata = {
  title: "Seasons — Admin — C3 Esports",
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function getSeasons() {
  return prisma.season.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: {
      id:        true,
      name:      true,
      slug:      true,
      status:    true,
      startDate: true,
      endDate:   true,
      isVisible: true,
      _count:    { select: { registrations: true } },
      divisions: {
        select: {
          id:   true,
          name: true,
          tier: true,
          _count: { select: { registrations: { where: { status: "APPROVED" } } } },
        },
        orderBy: { tier: "asc" },
      },
      registrations: {
        where:  { status: { in: ["PENDING", "WAITLISTED"] } },
        select: { id: true },
      },
    },
  })
}

type Season = Awaited<ReturnType<typeof getSeasons>>[number]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_ORDER: SeasonStatus[] = [
  "ACTIVE", "PLAYOFFS", "REGISTRATION", "DRAFT", "COMPLETED", "CANCELLED",
]

const STATUS_META: Record<SeasonStatus, { label: string; cls: string; dotCls: string }> = {
  DRAFT:        { label: "Draft",        cls: "bg-muted text-muted-foreground",        dotCls: "bg-muted-foreground/50" },
  REGISTRATION: { label: "Registration", cls: "bg-sky-500/15 text-sky-400",            dotCls: "bg-sky-400" },
  ACTIVE:       { label: "Active",       cls: "bg-brand/15 text-brand",                dotCls: "bg-brand" },
  PLAYOFFS:     { label: "Playoffs",     cls: "bg-amber-500/15 text-amber-400",        dotCls: "bg-amber-400" },
  COMPLETED:    { label: "Completed",    cls: "bg-muted text-muted-foreground",        dotCls: "bg-muted-foreground/50" },
  CANCELLED:    { label: "Cancelled",    cls: "bg-muted/50 text-muted-foreground/50",  dotCls: "bg-muted-foreground/30" },
}

const TIER_LABEL: Record<DivisionTier, string> = {
  PREMIER:     "Premier",
  CHALLENGERS: "Challengers",
  CONTENDERS:  "Contenders",
}

// ---------------------------------------------------------------------------
// Season row
// ---------------------------------------------------------------------------

function SeasonRow({ season }: { season: Season }) {
  const meta = STATUS_META[season.status]
  const pendingCount = season.registrations.length
  const totalApproved = season.divisions.reduce(
    (sum, d) => sum + d._count.registrations,
    0
  )

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 hover:border-brand/30 transition-colors sm:flex-row sm:items-center">

      {/* Season info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
              meta.cls
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", meta.dotCls)} />
            {meta.label}
          </span>
          {!season.isVisible && (
            <span className="rounded-full bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground/60">
              Hidden
            </span>
          )}
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
              {pendingCount} pending
            </span>
          )}
        </div>

        <h3 className="mt-2 font-display text-lg font-bold uppercase tracking-wide">
          {season.name}
        </h3>

        {(season.startDate || season.endDate) && (
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            {season.startDate ? formatDate(season.startDate) : "TBD"}
            {" – "}
            {season.endDate ? formatDate(season.endDate) : "TBD"}
          </p>
        )}

        {/* Divisions */}
        {season.divisions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {season.divisions.map((div) => (
              <span
                key={div.id}
                className="rounded-md bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground"
              >
                <span className="font-medium text-foreground">{TIER_LABEL[div.tier]}</span>
                {div._count.registrations > 0 && (
                  <span className="ml-1 text-muted-foreground/60">
                    {div._count.registrations} teams
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href={`/admin/seasons/${season.id}/registrations`}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-brand/40 hover:text-foreground transition-colors"
        >
          <ClipboardList className="h-3.5 w-3.5" />
          Registrations
          {pendingCount > 0 && (
            <span className="ml-0.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
              {pendingCount}
            </span>
          )}
        </Link>
        <Link
          href={`/admin/seasons/${season.id}/settings`}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-brand/40 hover:text-foreground transition-colors"
        >
          <Settings className="h-3.5 w-3.5" />
          Settings
        </Link>
        <Link
          href={`/seasons/${season.slug}`}
          target="_blank"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminSeasonsPage() {
  const seasons = await getSeasons()

  // Group by display order
  const grouped = STATUS_ORDER.reduce<Record<SeasonStatus, Season[]>>(
    (acc, s) => {
      acc[s] = seasons.filter((season) => season.status === s)
      return acc
    },
    {} as Record<SeasonStatus, Season[]>
  )

  const hasSeasons = seasons.length > 0

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide">Seasons</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {seasons.length} season{seasons.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          href="/admin/seasons/create"
          className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Season
        </Link>
      </div>

      {!hasSeasons ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card py-20 text-center">
          <Calendar className="h-10 w-10 text-muted-foreground/30" />
          <div>
            <p className="font-medium">No seasons yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Create your first season to get started.</p>
          </div>
          <Link
            href="/admin/seasons/create"
            className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Season
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {STATUS_ORDER.map((status) => {
            const list = grouped[status]
            if (list.length === 0) return null
            return (
              <section key={status}>
                <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  <span className={cn("h-2 w-2 rounded-full", STATUS_META[status].dotCls)} />
                  {STATUS_META[status].label} ({list.length})
                </h2>
                <ul className="space-y-3">
                  {list.map((season) => (
                    <li key={season.id}>
                      <SeasonRow season={season} />
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}

    </div>
  )
}
