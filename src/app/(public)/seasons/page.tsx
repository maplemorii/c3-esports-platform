/**
 * /seasons
 *
 * Public seasons list — server component.
 * Shows all visible seasons ordered newest-first with status badge,
 * date range, division summary, and a call-to-action per status.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { Calendar, ChevronRight, Trophy } from "lucide-react"
import { formatDateRange } from "@/lib/utils/dates"
import type { SeasonStatus, DivisionTier } from "@prisma/client"

export const metadata: Metadata = {
  title: "Seasons",
  description: "All Carolina Collegiate Clash seasons — past, present, and upcoming.",
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function getSeasons() {
  return prisma.season.findMany({
    where:   { isVisible: true },
    orderBy: { createdAt: "desc" },
    select: {
      id:                true,
      slug:              true,
      name:              true,
      status:            true,
      startDate:         true,
      endDate:           true,
      registrationStart: true,
      registrationEnd:   true,
      logoUrl:           true,
      divisions: {
        orderBy: { tier: "asc" },
        select: {
          id:   true,
          name: true,
          tier: true,
          _count: { select: { registrations: { where: { status: "APPROVED" } } } },
        },
      },
    },
  })
}

type Season = Awaited<ReturnType<typeof getSeasons>>[number]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_LABEL: Record<SeasonStatus, string> = {
  DRAFT:        "Draft",
  REGISTRATION: "Registration Open",
  ACTIVE:       "Active",
  PLAYOFFS:     "Playoffs",
  COMPLETED:    "Completed",
  CANCELLED:    "Cancelled",
}

const STATUS_CLASSES: Record<SeasonStatus, string> = {
  DRAFT:        "bg-muted text-muted-foreground",
  REGISTRATION: "bg-sky-500/15 text-sky-400",
  ACTIVE:       "bg-brand/15 text-brand",
  PLAYOFFS:     "bg-amber-500/15 text-amber-400",
  COMPLETED:    "bg-muted text-muted-foreground",
  CANCELLED:    "bg-destructive/15 text-destructive",
}

const TIER_ORDER: Record<DivisionTier, number> = { PREMIER: 0, CHALLENGERS: 1, CONTENDERS: 2 }

function ctaLabel(status: SeasonStatus): string | null {
  if (status === "REGISTRATION") return "Register your team"
  if (status === "ACTIVE" || status === "PLAYOFFS") return "View standings"
  if (status === "COMPLETED") return "View results"
  return null
}

// ---------------------------------------------------------------------------
// SeasonCard
// ---------------------------------------------------------------------------

function SeasonCard({ season }: { season: Season }) {
  const sorted = [...season.divisions].sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier])
  const totalTeams = sorted.reduce((sum, d) => sum + d._count.registrations, 0)
  const cta = ctaLabel(season.status)

  return (
    <Link
      href={`/seasons/${season.slug}`}
      className={cn(
        "group flex flex-col gap-4 rounded-xl border border-border bg-card p-5",
        "hover:border-brand/40 hover:bg-card/80 transition-colors"
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-xl font-bold uppercase tracking-wide truncate group-hover:text-brand transition-colors">
            {season.name}
          </h2>
          {(season.startDate || season.endDate) && (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {formatDateRange(
                season.startDate ? new Date(season.startDate) : null,
                season.endDate   ? new Date(season.endDate)   : null
              )}
            </p>
          )}
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
            STATUS_CLASSES[season.status]
          )}
        >
          {STATUS_LABEL[season.status]}
        </span>
      </div>

      {/* Divisions */}
      {sorted.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {sorted.map((div) => (
            <li
              key={div.id}
              className="rounded-md bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground"
            >
              <span className="font-medium text-foreground">{div.name}</span>
              {div._count.registrations > 0 && (
                <span className="ml-1 text-muted-foreground/60">
                  {div._count.registrations} team{div._count.registrations !== 1 ? "s" : ""}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {totalTeams > 0 ? (
          <span>{totalTeams} team{totalTeams !== 1 ? "s" : ""} registered</span>
        ) : (
          <span />
        )}
        {cta && (
          <span className="flex items-center gap-0.5 text-brand group-hover:gap-1.5 transition-all font-medium">
            {cta} <ChevronRight className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function SeasonsPage() {
  const seasons = await getSeasons()

  const active    = seasons.filter((s) => s.status === "ACTIVE" || s.status === "PLAYOFFS" || s.status === "REGISTRATION")
  const completed = seasons.filter((s) => s.status === "COMPLETED" || s.status === "CANCELLED")
  const drafts    = seasons.filter((s) => s.status === "DRAFT")

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">

      {/* Header */}
      <div className="mb-10">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand">
          Carolina Collegiate Clash
        </p>
        <h1 className="font-display text-4xl font-bold uppercase tracking-wide sm:text-5xl">
          Seasons
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {seasons.length} season{seasons.length !== 1 ? "s" : ""}
        </p>
      </div>

      {seasons.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Trophy className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-muted-foreground">No seasons have been announced yet.</p>
        </div>
      ) : (
        <div className="space-y-10">

          {/* Active / current */}
          {active.length > 0 && (
            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Current
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2">
                {active.map((s) => <li key={s.id}><SeasonCard season={s} /></li>)}
              </ul>
            </section>
          )}

          {/* Past seasons */}
          {completed.length > 0 && (
            <section>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Past Seasons
              </h2>
              <ul className="grid gap-4 sm:grid-cols-2">
                {completed.map((s) => <li key={s.id}><SeasonCard season={s} /></li>)}
              </ul>
            </section>
          )}

          {/* Draft — only shown if there are no other sections (edge case) */}
          {drafts.length > 0 && active.length === 0 && completed.length === 0 && (
            <ul className="grid gap-4 sm:grid-cols-2">
              {drafts.map((s) => <li key={s.id}><SeasonCard season={s} /></li>)}
            </ul>
          )}

        </div>
      )}
    </div>
  )
}
