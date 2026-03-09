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
  ClipboardList,
  BarChart2,
  Swords,
  Trophy,
  Megaphone,
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
  return {
    title: season.name,
    description: season.description ?? `${season.name} — Carolina Collegiate Clash`,
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
  DRAFT:        "bg-muted text-muted-foreground",
  REGISTRATION: "bg-sky-500/15 text-sky-400",
  ACTIVE:       "bg-brand/15 text-brand",
  PLAYOFFS:     "bg-amber-500/15 text-amber-400",
  COMPLETED:    "bg-muted text-muted-foreground",
  CANCELLED:    "bg-destructive/15 text-destructive",
}

const TIER_LABEL: Record<DivisionTier, string> = {
  PREMIER:    "Premier",
  CHALLENGERS: "Open Challengers",
  CONTENDERS: "Open Contenders",
}

const TIER_ACCENT: Record<DivisionTier, string> = {
  PREMIER:    "border-amber-500/40 bg-amber-500/5",
  CHALLENGERS:"border-sky-500/40 bg-sky-500/5",
  CONTENDERS: "border-brand/30 bg-brand/5",
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
  const showStandings = status === "ACTIVE" || status === "PLAYOFFS" || status === "COMPLETED"
  const showMatches   = status !== "DRAFT" && status !== "REGISTRATION"

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border p-5",
        TIER_ACCENT[division.tier]
      )}
    >
      {/* Header */}
      <div>
        <p className="mb-0.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {TIER_LABEL[division.tier]}
        </p>
        <h3 className="font-display text-lg font-bold uppercase tracking-wide">
          {division.name}
        </h3>
        {division.description && (
          <p className="mt-1 text-sm text-muted-foreground">{division.description}</p>
        )}
      </div>

      {/* Stats row */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground">
            {division._count.registrations}
          </span>
          {division.maxTeams ? `/${division.maxTeams}` : ""} teams
        </span>
        {division._count.matches > 0 && (
          <span>
            <span className="font-semibold text-foreground">{division._count.matches}</span>{" "}
            matches
          </span>
        )}
      </div>

      {/* Links */}
      <div className="flex flex-wrap gap-2 mt-auto">
        {showStandings && (
          <Link
            href={`/seasons/${seasonSlug}/standings?division=${division.id}`}
            className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-brand/40 hover:text-brand transition-colors"
          >
            <BarChart2 className="h-3.5 w-3.5" />
            Standings
          </Link>
        )}
        {showMatches && (
          <Link
            href={`/seasons/${seasonSlug}/matches?division=${division.id}`}
            className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-brand/40 hover:text-brand transition-colors"
          >
            <Swords className="h-3.5 w-3.5" />
            Matches
          </Link>
        )}
        {status === "PLAYOFFS" || status === "COMPLETED" ? (
          <Link
            href={`/seasons/${seasonSlug}/brackets?division=${division.id}`}
            className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-brand/40 hover:text-brand transition-colors"
          >
            <Trophy className="h-3.5 w-3.5" />
            Bracket
          </Link>
        ) : null}
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="mb-10">
        <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/seasons" className="hover:text-brand transition-colors">
            Seasons
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">{season.name}</span>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-brand">
              Carolina Collegiate Clash
            </p>
            <h1 className="font-display text-4xl font-bold uppercase tracking-wide sm:text-5xl">
              {season.name}
            </h1>
            {(season.startDate || season.endDate) && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                {formatDateRange(
                  season.startDate ? new Date(season.startDate) : null,
                  season.endDate   ? new Date(season.endDate)   : null
                )}
              </p>
            )}
          </div>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium",
              STATUS_CLASSES[season.status]
            )}
          >
            {STATUS_LABEL[season.status]}
          </span>
        </div>

        {season.description && (
          <p className="mt-4 max-w-2xl text-muted-foreground">{season.description}</p>
        )}
      </div>

      {/* ── Registration CTA ─────────────────────────────────────────── */}
      {regOpen && (
        <div className="mb-10 flex items-center justify-between gap-4 rounded-xl border border-brand/30 bg-brand/5 p-5">
          <div>
            <p className="font-semibold">Registration is open!</p>
            {season.registrationEnd && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                Closes {formatDate(new Date(season.registrationEnd))}
              </p>
            )}
          </div>
          <Link
            href="/team"
            className="shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90 transition-colors"
          >
            Register a team
          </Link>
        </div>
      )}

      {/* ── Divisions ────────────────────────────────────────────────── */}
      <section className="mb-12">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Divisions
        </h2>
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

      {/* ── Season info strip ────────────────────────────────────────── */}
      <section className="mb-12 grid gap-3 rounded-xl border border-border bg-card p-5 sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Format</p>
          <p className="font-medium">{season.leagueWeeks}-week regular season</p>
        </div>
        {season.registrationStart && season.registrationEnd && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Registration window
            </p>
            <p className="font-medium">
              {formatDateRange(
                new Date(season.registrationStart),
                new Date(season.registrationEnd)
              )}
            </p>
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Divisions</p>
          <p className="font-medium">{season.divisions.length} division{season.divisions.length !== 1 ? "s" : ""}</p>
        </div>
      </section>

      {/* ── Pinned announcements ──────────────────────────────────────── */}
      {season.announcements.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <Megaphone className="h-3.5 w-3.5" />
            Announcements
          </h2>
          <ul className="space-y-3">
            {season.announcements.map((a) => (
              <li
                key={a.id}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h3 className="font-semibold">{a.title}</h3>
                  {a.publishedAt && (
                    <time className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(new Date(a.publishedAt))}
                    </time>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">{a.body}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

    </div>
  )
}
