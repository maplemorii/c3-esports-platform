/**
 * DashboardTeamCard
 *
 * Compact team summary widget for the dashboard and profile page.
 * Shows logo, name, user's role, division badge, and registration status.
 *
 * Usage:
 *   <DashboardTeamCard team={...} isOwner isCaptain memberRole="PLAYER" />
 */

import Link from "next/link"
import { Crown, ChevronRight, Trophy, ShieldCheck, Swords, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { TeamLogo } from "@/components/team/TeamLogo"
import type { MembershipRole, RegistrationStatus, DivisionTier } from "@prisma/client"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardTeamCardData {
  id:           string
  slug:         string
  name:         string
  logoUrl:      string | null
  primaryColor: string | null
  _count:       { memberships: number }
  registrations: {
    status:   RegistrationStatus
    season:   { name: string }
    division: { name: string; tier: DivisionTier } | null
  }[]
}

interface DashboardTeamCardProps {
  team:       DashboardTeamCardData
  isOwner:    boolean
  isCaptain:  boolean
  memberRole: MembershipRole
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DashboardTeamCard({
  team,
  isOwner,
  isCaptain,
  memberRole,
}: DashboardTeamCardProps) {
  const reg   = team.registrations[0] ?? null
  const color = team.primaryColor ?? "oklch(0.50 0.20 15)"

  return (
    <Link
      href={`/team/${team.id}`}
      className="group relative flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all duration-150 hover:border-brand/40 overflow-hidden"
    >
      <TeamLogo
        name={team.name}
        logoUrl={team.logoUrl}
        primaryColor={team.primaryColor}
        size="sm"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-display text-sm font-bold uppercase tracking-wide truncate group-hover:text-brand transition-colors">
            {team.name}
          </span>
          <RolePip isOwner={isOwner} isCaptain={isCaptain} role={memberRole} />
        </div>

        <div className="mt-0.5 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">
            {team._count.memberships} {team._count.memberships === 1 ? "member" : "members"}
          </span>
          {reg?.division && (
            <>
              <span className="text-muted-foreground/30 text-xs">·</span>
              <DivisionPip tier={reg.division.tier} name={reg.division.name} />
            </>
          )}
          {reg && !reg.division && (
            <>
              <span className="text-muted-foreground/30 text-xs">·</span>
              <RegistrationPip status={reg.status} />
            </>
          )}
        </div>
      </div>

      {/* Color dot + chevron */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="h-2.5 w-2.5 rounded-full border border-black/10"
          style={{ backgroundColor: color }}
        />
        <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RolePip({
  isOwner,
  isCaptain,
  role,
}: {
  isOwner:   boolean
  isCaptain: boolean
  role:      MembershipRole
}) {
  if (isOwner) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-yellow-400 shrink-0">
        <Crown className="h-2.5 w-2.5" />
        Owner
      </span>
    )
  }
  if (isCaptain) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-sky-400 shrink-0">
        <Crown className="h-2.5 w-2.5" />
        Captain
      </span>
    )
  }
  const cls: Record<MembershipRole, string> = {
    PLAYER:     "border-border text-muted-foreground",
    SUBSTITUTE: "border-sky-500/30 text-sky-400",
    COACH:      "border-blue-500/30 text-blue-400",
  }
  const label: Record<MembershipRole, string> = {
    PLAYER: "Player", SUBSTITUTE: "Sub", COACH: "Coach",
  }
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest shrink-0",
      cls[role]
    )}>
      {label[role]}
    </span>
  )
}

function DivisionPip({ tier, name }: { tier: DivisionTier; name: string }) {
  const map: Record<DivisionTier, { cls: string; icon: React.ElementType }> = {
    PREMIER:    { cls: "text-yellow-400",  icon: Star },
    CHALLENGERS:{ cls: "text-sky-400",     icon: Swords },
    CONTENDERS: { cls: "text-emerald-400", icon: ShieldCheck },
  }
  const { cls, icon: Icon } = map[tier]
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[11px]", cls)}>
      <Icon className="h-3 w-3" />
      {name}
    </span>
  )
}

function RegistrationPip({ status }: { status: RegistrationStatus }) {
  const map: Record<RegistrationStatus, { label: string; cls: string }> = {
    PENDING:    { label: "Pending",    cls: "text-yellow-400" },
    APPROVED:   { label: "Approved",  cls: "text-emerald-400" },
    REJECTED:   { label: "Rejected",  cls: "text-destructive" },
    WAITLISTED: { label: "Waitlisted",cls: "text-orange-400" },
    WITHDRAWN:  { label: "Withdrawn", cls: "text-muted-foreground" },
  }
  const { label, cls } = map[status]
  return (
    <span className={cn("flex items-center gap-1 text-[11px]", cls)}>
      <Trophy className="h-3 w-3" />
      {label}
    </span>
  )
}
