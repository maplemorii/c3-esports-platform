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
import { Calendar, ChevronRight, Trophy, Zap, Users } from "lucide-react"
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
  DRAFT:        "bg-white/5 text-white/30 border-white/10",
  REGISTRATION: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ACTIVE:       "bg-brand/10 text-brand border-brand/20",
  PLAYOFFS:     "bg-amber-500/10 text-amber-400 border-amber-500/20",
  COMPLETED:    "bg-white/5 text-white/30 border-white/10",
  CANCELLED:    "bg-red-500/10 text-red-400 border-red-500/20",
}

const TIER_LABEL: Record<DivisionTier, { color: string }> = {
  PREMIER:     { color: "rgba(234,179,8,0.9)" },
  CHALLENGERS: { color: "rgba(96,165,250,0.9)" },
  CONTENDERS:  { color: "rgba(34,211,238,0.9)" },
}

const TIER_ORDER: Record<DivisionTier, number> = { PREMIER: 0, CHALLENGERS: 1, CONTENDERS: 2 }

function ctaLabel(status: SeasonStatus): string | null {
  if (status === "REGISTRATION") return "Register your team"
  if (status === "ACTIVE" || status === "PLAYOFFS") return "View standings"
  if (status === "COMPLETED") return "View results"
  return null
}

// ---------------------------------------------------------------------------
// Featured card — active / current seasons
// ---------------------------------------------------------------------------

function FeaturedSeasonCard({ season }: { season: Season }) {
  const sorted = [...season.divisions].sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier])
  const totalTeams = sorted.reduce((sum, d) => sum + d._count.registrations, 0)
  const cta = ctaLabel(season.status)
  const isLive = season.status === "ACTIVE" || season.status === "PLAYOFFS"

  return (
    <Link
      href={`/seasons/${season.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-blue-500/20 transition-all duration-200 hover:border-blue-500/40 hover:shadow-lg"
      style={{ background: "rgba(59,130,246,0.04)" }}
    >
      {/* Top accent line — red → blue */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.7), rgba(59,130,246,0.5), transparent)" }}
        aria-hidden
      />

      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute top-0 right-0 h-64 w-64 opacity-20 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.5), transparent 70%)",
          filter: "blur(50px)",
          transform: "translate(30%, -30%)",
        }}
        aria-hidden
      />

      <div className="relative flex flex-col gap-6 p-8">
        {/* Top row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-blue-400/60">
              {isLive ? "Now Playing" : "Upcoming Season"}
            </p>
            <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-foreground leading-none">
              {season.name}
            </h2>
            {(season.startDate || season.endDate) && (
              <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                {formatDateRange(
                  season.startDate ? new Date(season.startDate) : null,
                  season.endDate   ? new Date(season.endDate)   : null
                )}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={cn("rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide border", STATUS_CLASSES[season.status])}>
              {STATUS_LABEL[season.status]}
            </span>
            {isLive && (
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
                <span className="font-sans text-[10px] uppercase tracking-widest text-muted-foreground">Live</span>
              </div>
            )}
          </div>
        </div>

        {/* Division pills */}
        {sorted.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {sorted.map((div) => (
              <div
                key={div.id}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <span className="font-sans text-xs font-medium" style={{ color: TIER_LABEL[div.tier].color }}>
                  {div.name}
                </span>
                {div._count.registrations > 0 && (
                  <span className="flex items-center gap-1 font-sans text-[10px] text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {div._count.registrations}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Trophy className="h-4 w-4" />
            <span>
              {totalTeams > 0
                ? `${totalTeams} team${totalTeams !== 1 ? "s" : ""} registered`
                : "Registration pending"}
            </span>
          </div>
          {cta && (
            <span className="flex items-center gap-1.5 text-sm font-semibold text-blue-400 group-hover:text-blue-300 transition-colors duration-150">
              {cta}
              <ChevronRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Standard card — past / draft seasons
// ---------------------------------------------------------------------------

function SeasonCard({ season }: { season: Season }) {
  const sorted = [...season.divisions].sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier])
  const totalTeams = sorted.reduce((sum, d) => sum + d._count.registrations, 0)
  const cta = ctaLabel(season.status)

  return (
    <Link
      href={`/seasons/${season.slug}`}
      className="group relative flex flex-col gap-4 rounded-xl border border-border bg-card p-6 overflow-hidden transition-all duration-200 hover:border-border/80 hover:bg-muted/20"
    >
      {/* Hover accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.4) 50%, transparent)" }}
        aria-hidden
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-bold uppercase tracking-wide text-foreground leading-tight">
          {season.name}
        </h3>
        <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide border", STATUS_CLASSES[season.status])}>
          {STATUS_LABEL[season.status]}
        </span>
      </div>

      {/* Date */}
      {(season.startDate || season.endDate) && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 shrink-0" />
          {formatDateRange(
            season.startDate ? new Date(season.startDate) : null,
            season.endDate   ? new Date(season.endDate)   : null
          )}
        </p>
      )}

      {/* Division pills */}
      {sorted.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {sorted.map((div) => (
            <span
              key={div.id}
              className="rounded-md px-2 py-0.5 text-[11px] font-medium"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: TIER_LABEL[div.tier].color,
              }}
            >
              {div.name}
              {div._count.registrations > 0 && (
                <span className="ml-1 opacity-50">· {div._count.registrations}</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border text-xs">
        <span className="text-muted-foreground">
          {totalTeams > 0 ? `${totalTeams} team${totalTeams !== 1 ? "s" : ""}` : "—"}
        </span>
        {cta && (
          <span className="flex items-center gap-1 font-semibold text-blue-400/80 group-hover:text-blue-400 transition-colors duration-150">
            {cta} <ChevronRight className="h-3 w-3 transition-transform duration-150 group-hover:translate-x-0.5" />
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
    <div className="relative min-h-screen">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute top-0 right-0 h-[600px] w-[600px] opacity-15"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.5), transparent 70%)",
          filter: "blur(100px)",
          transform: "translate(20%, -20%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20">

        {/* Page header */}
        <div className="mb-14">
          <p className="mb-3 font-sans text-[10px] font-semibold uppercase tracking-[0.3em] text-brand/70">
            Carolina Collegiate Clash
          </p>
          <h1 className="font-display text-5xl font-bold uppercase tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Seasons
          </h1>
          {seasons.length > 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              {seasons.length} season{seasons.length !== 1 ? "s" : ""}
            </p>
          )}
          <div
            className="mt-6 h-px w-24"
            style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.6), rgba(59,130,246,0.3), transparent)" }}
          />
        </div>

        {/* Empty state */}
        {seasons.length === 0 ? (
          <div className="flex flex-col items-center gap-5 py-32 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-card">
              <Trophy className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold uppercase tracking-wide text-foreground/50">
                No seasons yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Check back soon for upcoming season announcements.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-16">

            {/* Active / current seasons */}
            {active.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <Zap className="h-4 w-4 text-brand" />
                  <h2 className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                    Current Season
                  </h2>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {active.map((s) => <FeaturedSeasonCard key={s.id} season={s} />)}
                </div>
              </section>
            )}

            {/* Past seasons */}
            {completed.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <Trophy className="h-4 w-4 text-muted-foreground/50" />
                  <h2 className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                    Past Seasons
                  </h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {completed.map((s) => <SeasonCard key={s.id} season={s} />)}
                </div>
              </section>
            )}

            {/* Draft (only when nothing else visible) */}
            {drafts.length > 0 && active.length === 0 && completed.length === 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {drafts.map((s) => <SeasonCard key={s.id} season={s} />)}
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
