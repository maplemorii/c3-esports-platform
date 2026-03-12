/**
 * /admin/seasons/[seasonId]
 *
 * Season hub — overview of divisions, match counts, registration summary,
 * and quick links to registrations, settings, and standings.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils/dates"
import {
  ArrowLeft,
  Calendar,
  ClipboardList,
  Settings,
  Swords,
  BarChart3,
  ChevronRight,
} from "lucide-react"
import type { SeasonStatus, DivisionTier } from "@prisma/client"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_META: Record<SeasonStatus, { label: string; cls: string }> = {
  DRAFT:        { label: "Draft",        cls: "bg-muted text-muted-foreground" },
  REGISTRATION: { label: "Registration", cls: "bg-sky-500/15 text-sky-400" },
  ACTIVE:       { label: "Active",       cls: "bg-brand/15 text-brand" },
  PLAYOFFS:     { label: "Playoffs",     cls: "bg-amber-500/15 text-amber-400" },
  COMPLETED:    { label: "Completed",    cls: "bg-emerald-500/15 text-emerald-400" },
  CANCELLED:    { label: "Cancelled",    cls: "bg-muted/50 text-muted-foreground/50" },
}

const TIER_LABEL: Record<DivisionTier, string> = {
  PREMIER:     "Premier",
  CHALLENGERS: "Challengers",
  CONTENDERS:  "Contenders",
}

const TIER_CLS: Record<DivisionTier, string> = {
  PREMIER:     "text-amber-400 border-amber-500/20 bg-amber-500/5",
  CHALLENGERS: "text-sky-400 border-sky-500/20 bg-sky-500/5",
  CONTENDERS:  "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function getData(seasonId: string) {
  const season = await prisma.season.findUnique({
    where:  { id: seasonId },
    select: {
      id:                true,
      name:              true,
      slug:              true,
      status:            true,
      description:       true,
      startDate:         true,
      endDate:           true,
      registrationStart: true,
      registrationEnd:   true,
      leagueWeeks:       true,
      isVisible:         true,
      divisions: {
        orderBy: { tier: "asc" },
        select: {
          id:   true,
          name: true,
          tier: true,
          maxTeams: true,
          _count: {
            select: {
              standingEntries: true,
              registrations:   true,
            },
          },
        },
      },
      _count: {
        select: {
          registrations: true,
        },
      },
    },
  })

  if (!season) return null

  // Pending registration count
  const pendingCount = await prisma.seasonRegistration.count({
    where: {
      seasonId,
      status: { in: ["PENDING", "WAITLISTED"] },
    },
  })

  // Match counts per division
  const matchCounts = await prisma.match.groupBy({
    by: ["divisionId"],
    where: {
      division: { seasonId },
      deletedAt: null,
    },
    _count: { id: true },
  })

  const matchCountByDivision = Object.fromEntries(
    matchCounts.map((r) => [r.divisionId, r._count.id])
  )

  return { season, pendingCount, matchCountByDivision }
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ seasonId: string }>
}): Promise<Metadata> {
  const { seasonId } = await params
  const data = await getData(seasonId)
  return { title: data ? `${data.season.name} — Admin` : "Season Not Found" }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminSeasonHubPage({
  params,
}: {
  params: Promise<{ seasonId: string }>
}) {
  const { seasonId } = await params
  const data = await getData(seasonId)
  if (!data) notFound()

  const { season, pendingCount, matchCountByDivision } = data
  const statusMeta = STATUS_META[season.status]

  const quickLinks = [
    {
      href:  `/admin/seasons/${seasonId}/registrations`,
      icon:  ClipboardList,
      label: "Registrations",
      desc:  `${season._count.registrations} total${pendingCount > 0 ? ` · ${pendingCount} pending` : ""}`,
      alert: pendingCount > 0,
    },
    {
      href:  `/admin/standings?seasonId=${seasonId}`,
      icon:  BarChart3,
      label: "Standings",
      desc:  "View and recalculate",
    },
    {
      href:  `/admin/matches?seasonId=${seasonId}`,
      icon:  Swords,
      label: "Matches",
      desc:  "All matches this season",
    },
    {
      href:  `/admin/seasons/${seasonId}/settings`,
      icon:  Settings,
      label: "Settings",
      desc:  "Edit dates, status, config",
    },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/admin/seasons" className="flex items-center gap-1 hover:text-brand transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Seasons
        </Link>
        <span>/</span>
        <span className="text-foreground">{season.name}</span>
      </div>

      {/* Header card */}
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-5"
        style={{ border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.7), rgba(59,130,246,0.4), transparent)" }}
          aria-hidden
        />
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(196,28,53,0.8)" }}>
          Staff Panel · Season Hub
        </p>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-3xl font-black uppercase tracking-wide">{season.name}</h1>
              <span className={cn("rounded-full px-3 py-1 text-xs font-semibold uppercase", statusMeta.cls)}>
                {statusMeta.label}
              </span>
              {!season.isVisible && (
                <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                  Hidden
                </span>
              )}
            </div>
            {season.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{season.description}</p>
            )}
          </div>
          <Link
            href={`/seasons/${season.slug}`}
            target="_blank"
            className="text-xs text-muted-foreground hover:text-brand transition-colors shrink-0"
          >
            Public page →
          </Link>
        </div>
      </div>

      {/* Date info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Reg. Opens",  value: season.registrationStart },
          { label: "Reg. Closes", value: season.registrationEnd },
          { label: "Season Start",value: season.startDate },
          { label: "Season End",  value: season.endDate },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl p-4"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-1 text-sm font-medium">
              {value ? formatDate(new Date(value)) : <span className="text-muted-foreground/50">—</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-2">
        {quickLinks.map(({ href, icon: Icon, label, desc, alert }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-4 rounded-xl p-4 transition-colors hover:bg-white/3"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
              alert ? "border-amber-500/30 bg-amber-500/10" : "border-brand/30 bg-brand/10",
            )}>
              <Icon className={cn("h-5 w-5", alert ? "text-amber-400" : "text-brand")} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs text-muted-foreground truncate">{desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground/60 shrink-0 transition-colors" />
          </Link>
        ))}
      </div>

      {/* Divisions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Divisions ({season.divisions.length})
          </h2>
        </div>

        {season.divisions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No divisions created yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {season.divisions.map((d) => {
              const matchCount = matchCountByDivision[d.id] ?? 0
              return (
                <div key={d.id} className={cn(
                  "rounded-xl border p-4 space-y-3",
                  TIER_CLS[d.tier],
                )}>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider">{TIER_LABEL[d.tier]}</p>
                    <p className="text-sm font-bold mt-0.5">{d.name}</p>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-current/60">Teams</span>
                      <span className="font-medium">
                        {d._count.standingEntries}{d.maxTeams ? ` / ${d.maxTeams}` : ""}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-current/60">Registrations</span>
                      <span className="font-medium">{d._count.registrations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-current/60">Matches</span>
                      <span className="font-medium">{matchCount}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <Link
                      href={`/admin/standings?seasonId=${seasonId}&divisionId=${d.id}`}
                      className="flex-1 text-center rounded-md border border-current/20 py-1 font-medium hover:bg-current/10 transition-colors"
                    >
                      Standings
                    </Link>
                    <Link
                      href={`/admin/matches?divisionId=${d.id}`}
                      className="flex-1 text-center rounded-md border border-current/20 py-1 font-medium hover:bg-current/10 transition-colors"
                    >
                      Matches
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
