/**
 * TeamCard
 *
 * Public-facing team card used in the /teams list.
 * Links to /teams/[teamSlug].
 *
 * Usage:
 *   <TeamCard team={...} />
 */

import Link from "next/link"
import { Users, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { TeamLogo } from "./TeamLogo"
import type { DivisionTier } from "@prisma/client"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TeamCardData {
  id:           string
  slug:         string
  name:         string
  logoUrl:      string | null
  primaryColor: string | null
  memberCount:  number
  activeReg?: {
    season:   { name: string }
    division: { name: string; tier: DivisionTier } | null
  } | null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TeamCard({ team }: { team: TeamCardData }) {
  const color = team.primaryColor ?? "oklch(0.50 0.20 15)"

  return (
    <Link
      href={`/teams/${team.slug}`}
      className="group relative flex flex-col rounded-xl border border-border bg-card overflow-hidden transition-all duration-150 hover:border-border/80 hover:bg-muted/10"
    >
      {/* Hover accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.4) 50%, transparent)" }}
        aria-hidden
      />

      {/* Team color strip */}
      <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: color }} />

      <div className="flex items-start gap-4 p-5">
        <TeamLogo
          name={team.name}
          logoUrl={team.logoUrl}
          primaryColor={team.primaryColor}
          size="md"
          className="shadow-sm"
        />

        <div className="flex-1 min-w-0">
          <h2 className="font-display text-base font-bold uppercase tracking-wide truncate group-hover:text-brand transition-colors duration-150">
            {team.name}
          </h2>

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {team.memberCount} {team.memberCount === 1 ? "member" : "members"}
            </span>

            {team.activeReg?.division && (
              <DivisionPip
                tier={team.activeReg.division.tier}
                name={team.activeReg.division.name}
              />
            )}
          </div>

          {team.activeReg && (
            <p className="mt-1 text-[11px] text-muted-foreground/60 truncate">
              {team.activeReg.season.name}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// DivisionPip — small tier badge
// ---------------------------------------------------------------------------

function DivisionPip({ tier, name }: { tier: DivisionTier; name: string }) {
  const map: Record<DivisionTier, string> = {
    PREMIER:     "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
    CHALLENGERS: "bg-blue-500/15 text-blue-400 border-blue-500/25",
    CONTENDERS:  "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        map[tier]
      )}
    >
      <Trophy className="h-2.5 w-2.5" />
      {name}
    </span>
  )
}
