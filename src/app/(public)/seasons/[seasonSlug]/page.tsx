/**
 * /seasons/[seasonSlug]
 *
 * Public season overview — server component.
 * Shows season header, division cards (with team counts + links to
 * standings/matches), registration window, and pinned announcements.
 */

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import {
  Calendar,
  ChevronRight,
  BarChart2,
  Swords,
  Trophy,
  Megaphone,
  Users,
  Clock,
} from "lucide-react"
import { formatDate, formatDateRange } from "@/lib/utils/dates"
import type { SeasonStatus, DivisionTier } from "@prisma/client"

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function getSeason(slug: string) {
  return prisma.season.findFirst({
    where: { slug, isVisible: true },
    select: {
      id:                true,
      slug:              true,
      name:              true,
      description:       true,
      status:            true,
      startDate:         true,
      endDate:           true,
      registrationStart: true,
      registrationEnd:   true,
      leagueWeeks:       true,
      logoUrl:           true,
      divisions: {
        orderBy: { tier: "asc" },
        select: {
          id:          true,
          name:        true,
          tier:        true,
          description: true,
          maxTeams:    true,
          _count: {
            select: {
              registrations: { where: { status: "APPROVED" } },
              matches:        true,
            },
          },
        },
      },
      announcements: {
        where:   { isPinned: true, deletedAt: null, publishedAt: { not: null } },
        orderBy: { publishedAt: "desc" },
        take:    3,
        select: {
          id:          true,
          title:       true,
          body:        true,
          publishedAt: true,
        },
      },
    },
  })
}

type Season = NonNullable<Awaited<ReturnType<typeof getSeason>>>

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ seasonSlug: string }>
}): Promise<Metadata> {
  const { seasonSlug } = await params
  const season = await getSeason(seasonSlug)
  if (!season) return { title: "Season Not Found" }
  const title       = season.name
  const description = season.description ?? `${season.name} — divisions, schedule, and standings for Carolina Collegiate Clash.`
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

const STATUS_LABEL: Record<SeasonStatus, string> = {
  DRAFT:        "Draft",
  REGISTRATION: "Registration Open",
  ACTIVE:       "Regular Season",
  PLAYOFFS:     "Playoffs",
  COMPLETED:    "Completed",
  CANCELLED:    "Cancelled",
}

const STATUS_CLASSES: Record<SeasonStatus, string> = {
  DRAFT:        "bg-white/5 text-white/30 border-white/10",
  REGISTRATION: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ACTIVE:       "bg-brand/10 text-brand border-brand/20",
  PLAYOFFS:     "bg-amber-500/10 text-amber-400 border-amber-500/20",
  COMPLETED:    "bg-white/5 text-white/40 border-white/10",
  CANCELLED:    "bg-red-500/10 text-red-400 border-red-500/20",
}

const TIER_CONFIG: Record<DivisionTier, {
  label: string
  topBorder: string
  badge: string
  badgeBg: string
  badgeBorder: string
  glow: string
}> = {
  PREMIER: {
    label:       "Premier",
    topBorder:   "linear-gradient(90deg, rgba(234,179,8,0.8), rgba(234,179,8,0.2), transparent)",
    badge:       "rgba(234,179,8,0.9)",
    badgeBg:     "rgba(234,179,8,0.1)",
    badgeBorder: "rgba(234,179,8,0.25)",
    glow:        "rgba(234,179,8,0.08)",
  },
  CHALLENGERS: {
    label:       "Challengers",
    topBorder:   "linear-gradient(90deg, rgba(59,130,246,0.8), rgba(59,130,246,0.3), transparent)",
    badge:       "rgba(96,165,250,0.9)",
    badgeBg:     "rgba(59,130,246,0.1)",
    badgeBorder: "rgba(59,130,246,0.25)",
    glow:        "rgba(59,130,246,0.06)",
  },
  CONTENDERS: {
    label:       "Contenders",
    topBorder:   "linear-gradient(90deg, rgba(34,211,238,0.7), rgba(34,211,238,0.2), transparent)",
    badge:       "rgba(34,211,238,0.9)",
    badgeBg:     "rgba(34,211,238,0.08)",
    badgeBorder: "rgba(34,211,238,0.22)",
    glow:        "rgba(34,211,238,0.05)",
  },
}

// ---------------------------------------------------------------------------
// DivisionCard
// ---------------------------------------------------------------------------

function DivisionCard({
  division,
  seasonSlug,
  status,
}: {
  division: Season["divisions"][number]
  seasonSlug: string
  status: SeasonStatus
}) {
  const cfg = TIER_CONFIG[division.tier]
  const showStandings = status === "ACTIVE" || status === "PLAYOFFS" || status === "COMPLETED"
  const showMatches   = status !== "DRAFT" && status !== "REGISTRATION"
  const showBracket   = status === "PLAYOFFS" || status === "COMPLETED"

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl transition-all duration-200 hover:-translate-y-1"
      style={{
        background: `rgba(255,255,255,0.025)`,
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Top gradient accent */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: cfg.topBorder }}
        aria-hidden
      />

      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ background: `radial-gradient(circle at 50% 0%, ${cfg.glow} 0%, transparent 60%)` }}
        aria-hidden
      />

      <div className="relative flex flex-col gap-5 p-6 flex-1">
        {/* Tier badge */}
        <div
          className="inline-flex w-fit items-center rounded-full px-3 py-1 font-sans text-[10px] font-semibold uppercase tracking-widest"
          style={{ background: cfg.badgeBg, border: `1px solid ${cfg.badgeBorder}`, color: cfg.badge }}
        >
          {cfg.label}
        </div>

        {/* Division name + description */}
        <div>
          <h3 className="font-display text-2xl font-bold uppercase tracking-wide text-foreground leading-none">
            {division.name}
          </h3>
          {division.description && (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{division.description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-5 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>
              <span className="font-semibold text-foreground">{division._count.registrations}</span>
              {division.maxTeams ? `/${division.maxTeams}` : ""} teams
            </span>
          </div>
          {division._count.matches > 0 && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Swords className="h-3.5 w-3.5" />
              <span>
                <span className="font-semibold text-foreground">{division._count.matches}</span> matches
              </span>
            </div>
          )}
        </div>

        {/* Action links */}
        <div className="flex flex-wrap gap-2 mt-auto">
          {showStandings && (
            <Link
              href={`/seasons/${seasonSlug}/standings?division=${division.id}`}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors duration-150 hover:border-brand/40 hover:text-brand"
            >
              <BarChart2 className="h-3.5 w-3.5" />
              Standings
            </Link>
          )}
          {showMatches && (
            <Link
              href={`/seasons/${seasonSlug}/matches?division=${division.id}`}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors duration-150 hover:border-brand/40 hover:text-brand"
            >
              <Swords className="h-3.5 w-3.5" />
              Matches
            </Link>
          )}
          {showBracket && (
            <Link
              href={`/seasons/${seasonSlug}/brackets?division=${division.id}`}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors duration-150 hover:border-brand/40 hover:text-brand"
            >
              <Trophy className="h-3.5 w-3.5" />
              Bracket
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function SeasonOverviewPage({
  params,
}: {
  params: Promise<{ seasonSlug: string }>
}) {
  const { seasonSlug } = await params
  const season = await getSeason(seasonSlug)
  if (!season) notFound()

  const now = new Date()
  const regOpen =
    season.status === "REGISTRATION" &&
    season.registrationStart &&
    season.registrationEnd &&
    now >= new Date(season.registrationStart) &&
    now <= new Date(season.registrationEnd)

  const totalTeams = season.divisions.reduce((sum, d) => sum + d._count.registrations, 0)

  return (
    <div className="relative min-h-screen">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 h-125 w-175 opacity-10 -translate-x-1/2"
        style={{
          background: "radial-gradient(ellipse, rgba(196,28,53,0.5) 0%, rgba(59,130,246,0.4) 50%, transparent 70%)",
          filter: "blur(80px)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-20">

        {/* Breadcrumb */}
        <div className="mb-8 flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/seasons" className="hover:text-brand transition-colors duration-150">
            Seasons
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">{season.name}</span>
        </div>

        {/* ── Hero header ── */}
        <div className="mb-12">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="mb-2 font-sans text-[10px] font-semibold uppercase tracking-[0.3em] text-brand/70">
                Carolina Collegiate Clash
              </p>
              <h1 className="font-display text-5xl font-bold uppercase tracking-tight text-foreground sm:text-6xl lg:text-7xl leading-none">
                {season.name}
              </h1>
              {(season.startDate || season.endDate) && (
                <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0" />
                  {formatDateRange(
                    season.startDate ? new Date(season.startDate) : null,
                    season.endDate   ? new Date(season.endDate)   : null
                  )}
                </p>
              )}
            </div>
            <span className={cn("rounded-full px-4 py-1.5 text-sm font-semibold border", STATUS_CLASSES[season.status])}>
              {STATUS_LABEL[season.status]}
            </span>
          </div>

          {season.description && (
            <p className="mt-6 max-w-2xl text-muted-foreground leading-relaxed">{season.description}</p>
          )}

          {/* Accent line */}
          <div
            className="mt-8 h-px w-24"
            style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.6), rgba(59,130,246,0.3), transparent)" }}
          />
        </div>

        {/* ── Quick stats strip ── */}
        <div className="mb-12 grid grid-cols-2 gap-px rounded-xl overflow-hidden sm:grid-cols-3 lg:grid-cols-4"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          {[
            { label: "Divisions",       value: season.divisions.length },
            { label: "Teams Registered", value: totalTeams },
            { label: "Season Length",    value: `${season.leagueWeeks}wk` },
            ...(season.registrationEnd ? [{
              label: "Reg. Closes",
              value: formatDate(new Date(season.registrationEnd)),
            }] : []),
          ].slice(0, 4).map(({ label, value }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 px-6 py-6"
              style={{ background: "oklch(0.10 0.02 265)" }}
            >
              <span className="font-display text-2xl font-bold text-foreground">{value}</span>
              <span className="font-sans text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        {/* ── Registration CTA ── */}
        {regOpen && (
          <div className="mb-12 relative overflow-hidden flex items-center justify-between gap-4 rounded-2xl border border-brand/30 bg-brand/5 p-6">
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.6), rgba(59,130,246,0.3), transparent)" }}
              aria-hidden
            />
            <div>
              <p className="font-display text-lg font-bold uppercase tracking-wide text-foreground">
                Registration is open!
              </p>
              {season.registrationEnd && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Closes {formatDate(new Date(season.registrationEnd))}
                </p>
              )}
            </div>
            <Link
              href="/team"
              className="shrink-0 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-brand/90 hover:shadow-lg hover:shadow-brand/20"
            >
              Register a team
            </Link>
          </div>
        )}

        {/* ── Divisions ── */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="h-4 w-4 text-muted-foreground/50" />
            <h2 className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Divisions
            </h2>
          </div>
          {season.divisions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No divisions configured yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {season.divisions.map((div) => (
                <DivisionCard
                  key={div.id}
                  division={div}
                  seasonSlug={season.slug}
                  status={season.status}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Season info ── */}
        {(season.registrationStart || season.registrationEnd) && (
          <section className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="h-4 w-4 text-muted-foreground/50" />
              <h2 className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Schedule
              </h2>
            </div>
            <div className="grid gap-4 rounded-xl border border-border bg-card p-6 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-1">Format</p>
                <p className="text-sm font-medium text-foreground">{season.leagueWeeks}-week regular season</p>
              </div>
              {season.registrationStart && season.registrationEnd && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-1">Registration</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDateRange(new Date(season.registrationStart), new Date(season.registrationEnd))}
                  </p>
                </div>
              )}
              {(season.startDate || season.endDate) && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-1">Season</p>
                  <p className="text-sm font-medium text-foreground">
                    {formatDateRange(
                      season.startDate ? new Date(season.startDate) : null,
                      season.endDate   ? new Date(season.endDate)   : null
                    )}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Pinned announcements ── */}
        {season.announcements.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Megaphone className="h-4 w-4 text-muted-foreground/50" />
              <h2 className="font-display text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Announcements
              </h2>
            </div>
            <ul className="space-y-3">
              {season.announcements.map((a) => (
                <li
                  key={a.id}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="font-display text-base font-bold uppercase tracking-wide text-foreground">
                      {a.title}
                    </h3>
                    {a.publishedAt && (
                      <time className="shrink-0 text-xs text-muted-foreground">
                        {formatDate(new Date(a.publishedAt))}
                      </time>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{a.body}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

      </div>
    </div>
  )
}
