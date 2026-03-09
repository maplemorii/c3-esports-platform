/**
 * SeasonCard
 *
 * Reusable card summarising a season's status, dates, and division count.
 * Used in public season lists and admin season lists.
 */

import Link from "next/link"
import { cn } from "@/lib/utils"
import { Calendar, ChevronRight } from "lucide-react"
import { formatDateRange } from "@/lib/utils/dates"
import type { SeasonStatus, DivisionTier } from "@prisma/client"

// ---------------------------------------------------------------------------
// Data contract
// ---------------------------------------------------------------------------

export interface SeasonCardData {
  id:        string
  slug:      string
  name:      string
  status:    SeasonStatus
  logoUrl:   string | null
  startDate: Date | string | null
  endDate:   Date | string | null
  divisions: Array<{
    id:   string
    name: string
    tier: DivisionTier
    registrationCount?: number
    maxTeams?:          number | null
  }>
}

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
  CANCELLED:    "bg-muted/50 text-muted-foreground/50",
}

const TIER_ORDER: Record<DivisionTier, number> = {
  PREMIER:    0,
  CHALLENGERS: 1,
  CONTENDERS: 2,
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  season:  SeasonCardData
  /** Href to navigate to on click. Defaults to /seasons/:slug */
  href?:   string
  /** If true, renders as a plain div instead of a Link */
  static?: boolean
}

export function SeasonCard({ season, href, static: isStatic }: Props) {
  const sorted = [...season.divisions].sort(
    (a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]
  )
  const totalTeams = sorted.reduce((sum, d) => sum + (d.registrationCount ?? 0), 0)
  const target = href ?? `/seasons/${season.slug}`

  const startDate = season.startDate ? new Date(season.startDate) : null
  const endDate   = season.endDate   ? new Date(season.endDate)   : null

  const inner = (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-bold uppercase tracking-wide truncate group-hover:text-brand transition-colors">
            {season.name}
          </h3>
          {(startDate || endDate) && (
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {formatDateRange(startDate, endDate)}
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
        <div className="flex flex-wrap gap-1.5">
          {sorted.map((div) => (
            <span
              key={div.id}
              className="rounded-md bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground"
            >
              <span className="font-medium text-foreground">{div.name}</span>
              {div.registrationCount !== undefined && div.registrationCount > 0 && (
                <span className="ml-1 text-muted-foreground/60">
                  {div.registrationCount}
                  {div.maxTeams ? `/${div.maxTeams}` : ""}
                </span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      {!isStatic && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{totalTeams > 0 ? `${totalTeams} teams` : ""}</span>
          <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      )}
    </>
  )

  const cls = cn(
    "flex flex-col gap-3 rounded-xl border border-border bg-card p-4",
    !isStatic && "group hover:border-brand/40 transition-colors cursor-pointer"
  )

  if (isStatic) return <div className={cls}>{inner}</div>
  return (
    <Link href={target} className={cls}>
      {inner}
    </Link>
  )
}
