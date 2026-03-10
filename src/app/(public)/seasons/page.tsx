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
  DRAFT:        "bg-white/5 text-white/30",
  REGISTRATION: "bg-sky-500/10 text-sky-400",
  ACTIVE:       "bg-violet-500/10 text-violet-400",
  PLAYOFFS:     "bg-amber-500/10 text-amber-400",
  COMPLETED:    "bg-white/5 text-white/30",
  CANCELLED:    "bg-red-500/10 text-red-400",
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
  const isActive = season.status === "ACTIVE" || season.status === "PLAYOFFS" || season.status === "REGISTRATION"

  return (
    <Link
      href={`/seasons/${season.slug}`}
      className={cn(
        "group relative flex flex-col gap-4 rounded-2xl p-5 overflow-hidden transition-all duration-200 border",
        "hover:bg-white/[0.05]",
        isActive
          ? "border-violet-500/20 hover:border-violet-500/35"
          : "border-white/[0.06] hover:border-white/10"
      )}
      style={{ background: "rgba(255,255,255,0.03)" }}
    >
      {/* Subtle violet top border for active */}
      {isActive && (
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.6) 50%, transparent)" }}
          aria-hidden
        />
      )}

      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h2
            className="font-sans text-base font-bold uppercase tracking-wider truncate transition-colors duration-200"
            style={{ color: "rgba(255,255,255,0.85)", letterSpacing: "0.06em" }}
          >
            {season.name}
          </h2>
          {(season.startDate || season.endDate) && (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>
              <Calendar className="h-3 w-3 shrink-0" />
              {formatDateRange(
                season.startDate ? new Date(season.startDate) : null,
                season.endDate   ? new Date(season.endDate)   : null
              )}
            </p>
          )}
        </div>
        <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide", STATUS_CLASSES[season.status])}>
          {STATUS_LABEL[season.status]}
        </span>
      </div>

      {/* Divisions */}
      {sorted.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {sorted.map((div) => (
            <li
              key={div.id}
              className="rounded-lg px-2.5 py-1 text-xs"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span style={{ color: "rgba(255,255,255,0.6)" }}>{div.name}</span>
              {div._count.registrations > 0 && (
                <span className="ml-1" style={{ color: "rgba(255,255,255,0.25)" }}>
                  {div._count.registrations}t
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs mt-auto">
        <span style={{ color: "rgba(255,255,255,0.22)" }}>
          {totalTeams > 0 ? `${totalTeams} team${totalTeams !== 1 ? "s" : ""} registered` : ""}
        </span>
        {cta && (
          <span className="flex items-center gap-1 font-medium transition-all duration-200" style={{ color: "rgba(167,139,250,0.75)" }}>
            {cta} <ChevronRight className="h-3 w-3" />
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
    <div className="mx-auto max-w-4xl px-4 py-14">

      {/* Header */}
      <div className="mb-12">
        <p
          className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em]"
          style={{ color: "rgba(167,139,250,0.6)" }}
        >
          Carolina Collegiate Clash
        </p>
        <h1
          className="font-sans text-5xl font-black uppercase sm:text-6xl"
          style={{ color: "rgba(255,255,255,0.92)", letterSpacing: "-0.01em" }}
        >
          Seasons
        </h1>
        <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.28)" }}>
          {seasons.length} season{seasons.length !== 1 ? "s" : ""}
        </p>
        {/* Decorative line */}
        <div
          className="mt-6 h-px w-20"
          style={{ background: "linear-gradient(90deg, rgba(124,58,237,0.6), rgba(6,182,212,0.3), transparent)" }}
        />
      </div>

      {seasons.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <Trophy className="h-10 w-10" style={{ color: "rgba(255,255,255,0.1)" }} />
          <p style={{ color: "rgba(255,255,255,0.28)" }}>No seasons have been announced yet.</p>
        </div>
      ) : (
        <div className="space-y-12">

          {/* Active / current */}
          {active.length > 0 && (
            <section>
              <h2
                className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em]"
                style={{ color: "rgba(255,255,255,0.22)" }}
              >
                Current
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {active.map((s) => <li key={s.id}><SeasonCard season={s} /></li>)}
              </ul>
            </section>
          )}

          {/* Past seasons */}
          {completed.length > 0 && (
            <section>
              <h2
                className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em]"
                style={{ color: "rgba(255,255,255,0.22)" }}
              >
                Past Seasons
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {completed.map((s) => <li key={s.id}><SeasonCard season={s} /></li>)}
              </ul>
            </section>
          )}

          {/* Draft */}
          {drafts.length > 0 && active.length === 0 && completed.length === 0 && (
            <ul className="grid gap-3 sm:grid-cols-2">
              {drafts.map((s) => <li key={s.id}><SeasonCard season={s} /></li>)}
            </ul>
          )}

        </div>
      )}
    </div>
  )
}
