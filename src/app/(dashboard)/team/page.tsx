/**
 * /(dashboard)/team
 *
 * My Teams list — all teams the user owns or is an active member of.
 * Server component; direct Prisma queries.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  Plus,
  Users,
  Settings,
  ClipboardList,
  ChevronRight,
  Crown,
  Trophy,
  Globe,
  Twitter,
  MessageSquare,
  ShieldCheck,
  Swords,
  Star,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
} from "lucide-react"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"
import { TeamLogo } from "@/components/team/TeamLogo"
import { hasMinRole } from "@/lib/roles"
import type { MembershipRole, RegistrationStatus, DivisionTier } from "@prisma/client"

export const metadata: Metadata = { title: "My Teams" }

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getMyTeams(userId: string) {
  const [ownedTeams, memberships, activeSeason] = await Promise.all([
    prisma.team.findMany({
      where: { ownerId: userId, deletedAt: null },
      orderBy: { createdAt: "asc" },
      select: {
        id:             true,
        slug:           true,
        name:           true,
        logoUrl:        true,
        primaryColor:   true,
        secondaryColor: true,
        website:        true,
        twitterHandle:  true,
        discordInvite:  true,
        createdAt:      true,
        _count: {
          select: { memberships: { where: { leftAt: null } } },
        },
        registrations: {
          orderBy: { registeredAt: "desc" as const },
          take: 1,
          select: {
            id:     true,
            status: true,
            season: { select: { id: true, name: true, status: true } },
            division: { select: { name: true, tier: true } },
          },
        },
      },
    }),

    prisma.teamMembership.findMany({
      where: {
        leftAt: null,
        player: { userId, deletedAt: null },
        team:   { ownerId: { not: userId }, deletedAt: null },
      },
      select: {
        role:      true,
        isCaptain: true,
        team: {
          select: {
            id:             true,
            slug:           true,
            name:           true,
            logoUrl:        true,
            primaryColor:   true,
            secondaryColor: true,
            website:        true,
            twitterHandle:  true,
            discordInvite:  true,
            createdAt:      true,
            _count: {
              select: { memberships: { where: { leftAt: null } } },
            },
            registrations: {
              orderBy: { registeredAt: "desc" as const },
              take: 1,
              select: {
                id:     true,
                status: true,
                season: { select: { id: true, name: true, status: true } },
                division: { select: { name: true, tier: true } },
              },
            },
          },
        },
      },
    }),

    prisma.season.findFirst({
      where: { status: { in: ["REGISTRATION", "ACTIVE", "PLAYOFFS"] } },
      orderBy: { createdAt: "desc" as const },
      select: { id: true, name: true, status: true },
    }),
  ])

  type TeamRow = (typeof ownedTeams)[number]

  const owned: TeamEntry[] = ownedTeams.map((t) => ({
    ...t,
    isOwner:    true,
    isCaptain:  false,
    memberRole: "PLAYER" as MembershipRole,
  }))

  const member: TeamEntry[] = memberships.map((m) => ({
    ...m.team,
    isOwner:    false,
    isCaptain:  m.isCaptain,
    memberRole: m.role,
  }))

  return { teams: [...owned, ...member], activeSeason }
}

interface TeamEntry {
  id:             string
  slug:           string
  name:           string
  logoUrl:        string | null
  primaryColor:   string | null
  secondaryColor: string | null
  website:        string | null
  twitterHandle:  string | null
  discordInvite:  string | null
  createdAt:      Date
  isOwner:        boolean
  isCaptain:      boolean
  memberRole:     MembershipRole
  _count:         { memberships: number }
  registrations:  {
    id:     string
    status: RegistrationStatus
    season: { id: string; name: string; status: string }
    division: { name: string; tier: DivisionTier } | null
  }[]
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function MyTeamsPage() {
  const session = await getSession()
  if (!session) redirect("/auth/signin")

  const { teams, activeSeason } = await getMyTeams(session.user.id)
  const isStaff = hasMinRole(session.user.role, "STAFF")

  const ownedCount      = teams.filter((t) => t.isOwner).length
  const registeredCount = teams.filter(
    (t) => t.registrations[0]?.status === "APPROVED"
  ).length

  return (
    <div className="mx-auto max-w-5xl space-y-8">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-1">
            Dashboard
          </p>
          <h1 className="font-display text-4xl font-bold uppercase tracking-wide leading-none">
            My Teams
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            All teams you own or compete on.
          </p>
        </div>

        <Link
          href="/team/create"
          className={cn(buttonVariants({ size: "sm" }), "gap-1.5 shrink-0 self-start sm:self-auto")}
        >
          <Plus className="h-3.5 w-3.5" />
          Create Team
        </Link>
      </div>

      {/* ── Stats strip ──────────────────────────────────────────────── */}
      {teams.length > 0 && (
        <div className="relative overflow-hidden grid grid-cols-3 divide-x divide-border rounded-xl border border-border bg-card">
          <div
            className="absolute top-0 left-0 right-0 h-px pointer-events-none"
            style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.5), rgba(59,130,246,0.3), transparent)" }}
            aria-hidden
          />
          <StatCell value={teams.length}    label="Total Teams" />
          <StatCell value={ownedCount}      label="Owned" />
          <StatCell value={registeredCount} label="Registered" />
        </div>
      )}

      {/* ── Active season banner ─────────────────────────────────────── */}
      {activeSeason && (
        <div className={cn(
          "flex items-center gap-3 rounded-xl border px-5 py-4",
          activeSeason.status === "REGISTRATION"
            ? "border-brand/30 bg-brand/5"
            : "border-border bg-card"
        )}>
          <div className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
            activeSeason.status === "REGISTRATION"
              ? "border-brand/30 bg-brand/10"
              : "border-border bg-muted"
          )}>
            <Trophy className={cn(
              "h-4 w-4",
              activeSeason.status === "REGISTRATION" ? "text-brand" : "text-muted-foreground"
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-xs font-semibold uppercase tracking-widest",
              activeSeason.status === "REGISTRATION" ? "text-brand" : "text-muted-foreground"
            )}>
              {activeSeason.status === "REGISTRATION" ? "Registration Open" :
               activeSeason.status === "ACTIVE"        ? "Season Underway" :
               activeSeason.status === "PLAYOFFS"      ? "Playoffs"         : activeSeason.status}
            </p>
            <p className="text-sm font-medium">{activeSeason.name}</p>
          </div>
          {activeSeason.status === "REGISTRATION" && (
            <span className="text-xs text-muted-foreground shrink-0">
              Register your team below
            </span>
          )}
        </div>
      )}

      {/* ── Teams ────────────────────────────────────────────────────── */}
      {teams.length === 0 ? (
        <EmptyState isStaff={isStaff} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              activeSeason={activeSeason}
            />
          ))}

          {/* Create another team CTA card — hidden for staff/admin */}
          {!isStaff && (
          <Link
            href="/team/create"
            className="group flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 p-8 text-center transition-colors hover:border-brand/40 hover:bg-brand/5 min-h-50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-border bg-muted group-hover:border-brand/30 group-hover:bg-brand/10 transition-colors">
              <Plus className="h-5 w-5 text-muted-foreground/50 group-hover:text-brand transition-colors" />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                Create another team
              </p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                Build a new roster and register for a season
              </p>
            </div>
          </Link>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// TeamCard
// ---------------------------------------------------------------------------

function TeamCard({
  team,
  activeSeason,
}: {
  team: TeamEntry
  activeSeason: { id: string; name: string; status: string } | null
}) {
  const reg         = team.registrations[0] ?? null
  const color       = team.primaryColor ?? "oklch(0.50 0.20 15)"
  const isRegistered = reg?.status === "APPROVED"
  const canRegister  =
    activeSeason?.status === "REGISTRATION" &&
    (!reg || reg.status === "WITHDRAWN") &&
    team.isOwner

  return (
    <div className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden transition-colors hover:border-brand/40">
      {/* Thick color bar */}
      <div className="h-2 w-full shrink-0" style={{ backgroundColor: color }} />

      <div className="flex flex-col gap-5 p-5 flex-1">

        {/* ── Identity row ─────────────────────────────────────────── */}
        <div className="flex items-start gap-4">
          <TeamLogo
            name={team.name}
            logoUrl={team.logoUrl}
            primaryColor={team.primaryColor}
            size="lg"
            className="shadow-md"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="font-display text-lg font-bold uppercase tracking-wide leading-tight group-hover:text-brand transition-colors truncate">
                {team.name}
              </h2>
              <RolePip isOwner={team.isOwner} isCaptain={team.isCaptain} role={team.memberRole} />
            </div>

            {/* Color swatches */}
            <div className="mt-1.5 flex items-center gap-1.5">
              {team.primaryColor && (
                <span
                  className="h-3 w-3 rounded-full border border-black/20"
                  style={{ backgroundColor: team.primaryColor }}
                />
              )}
              {team.secondaryColor && (
                <span
                  className="h-3 w-3 rounded-full border border-black/20"
                  style={{ backgroundColor: team.secondaryColor }}
                />
              )}
              <span className="text-xs text-muted-foreground">
                {team._count.memberships} {team._count.memberships === 1 ? "member" : "members"}
              </span>
            </div>

            {/* Social links */}
            {(team.website || team.twitterHandle || team.discordInvite) && (
              <div className="mt-1.5 flex flex-wrap gap-3">
                {team.website && (
                  <a
                    href={team.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Globe className="h-3 w-3" />
                    Web
                  </a>
                )}
                {team.twitterHandle && (
                  <a
                    href={`https://twitter.com/${team.twitterHandle.replace("@", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Twitter className="h-3 w-3" />
                    {team.twitterHandle.startsWith("@") ? team.twitterHandle : `@${team.twitterHandle}`}
                  </a>
                )}
                {team.discordInvite && (
                  <a
                    href={team.discordInvite}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MessageSquare className="h-3 w-3" />
                    Discord
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Registration status ──────────────────────────────────── */}
        {reg ? (
          <RegistrationStatusBlock reg={reg} />
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2.5">
            <XCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
            <span className="text-xs text-muted-foreground">Not registered for any season</span>
          </div>
        )}

        {/* ── Action buttons ───────────────────────────────────────── */}
        <div className="mt-auto flex flex-wrap gap-2 pt-1 border-t border-border">
          <Link
            href={`/team/${team.id}`}
            className={cn(buttonVariants({ size: "sm" }), "gap-1.5 flex-1 justify-center")}
          >
            <Users className="h-3.5 w-3.5" />
            Open Hub
            <ChevronRight className="h-3.5 w-3.5 ml-auto" />
          </Link>

          {team.isOwner && (
            <Link
              href={`/team/${team.id}/settings`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
              title="Team Settings"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </Link>
          )}

          {canRegister && activeSeason && (
            <Link
              href={`/team/${team.id}/register`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5 text-brand border-brand/40 hover:bg-brand/10")}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              Register
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// RegistrationStatus block
// ---------------------------------------------------------------------------

function RegistrationStatusBlock({
  reg,
}: {
  reg: {
    status: RegistrationStatus
    season: { name: string }
    division: { name: string; tier: DivisionTier } | null
  }
}) {
  const STATUS_MAP: Record<RegistrationStatus, {
    label: string
    icon:  React.ElementType
    cls:   string
    dotCls: string
  }> = {
    PENDING:    { label: "Pending Review",  icon: Clock,         cls: "border-yellow-500/30 bg-yellow-500/5 text-yellow-400",    dotCls: "bg-yellow-400" },
    APPROVED:   { label: "Approved",        icon: CheckCircle2,  cls: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400", dotCls: "bg-emerald-400" },
    REJECTED:   { label: "Rejected",        icon: XCircle,       cls: "border-destructive/30 bg-destructive/5 text-destructive", dotCls: "bg-destructive" },
    WAITLISTED: { label: "Waitlisted",      icon: AlertCircle,   cls: "border-orange-500/30 bg-orange-500/5 text-orange-400",   dotCls: "bg-orange-400" },
    WITHDRAWN:  { label: "Withdrawn",       icon: XCircle,       cls: "border-border bg-muted/30 text-muted-foreground",        dotCls: "bg-muted-foreground/30" },
  }

  const TIER_MAP: Record<DivisionTier, { icon: React.ElementType; cls: string }> = {
    PREMIER:    { icon: Star,        cls: "text-yellow-400" },
    CHALLENGERS:{ icon: Swords,      cls: "text-sky-400" },
    CONTENDERS: { icon: ShieldCheck, cls: "text-emerald-400" },
  }

  const { label, icon: StatusIcon, cls, dotCls } = STATUS_MAP[reg.status]
  const divMeta = reg.division ? TIER_MAP[reg.division.tier] : null
  const DivIcon = divMeta?.icon

  return (
    <div className={cn("flex items-center gap-3 rounded-lg border px-3 py-2.5", cls)}>
      <span className={cn("h-2 w-2 shrink-0 rounded-full", dotCls)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold">{label}</span>
          <span className="text-xs opacity-60">·</span>
          <span className="text-xs opacity-80 truncate">{reg.season.name}</span>
        </div>
        {reg.division && (
          <div className="flex items-center gap-1 mt-0.5">
            {DivIcon && <DivIcon className={cn("h-3 w-3", divMeta?.cls)} />}
            <span className="text-[11px] opacity-70">{reg.division.name}</span>
          </div>
        )}
      </div>
      <StatusIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// RolePip
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
      <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-yellow-400 shrink-0">
        <Crown className="h-2.5 w-2.5" />
        Owner
      </span>
    )
  }
  if (isCaptain) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-sky-400 shrink-0">
        <Crown className="h-2.5 w-2.5" />
        Captain
      </span>
    )
  }
  const roleLabel: Record<MembershipRole, string> = {
    PLAYER:     "Player",
    SUBSTITUTE: "Sub",
    COACH:      "Coach",
  }
  const roleCls: Record<MembershipRole, string> = {
    PLAYER:     "border-border text-muted-foreground",
    SUBSTITUTE: "border-sky-500/30 text-sky-400",
    COACH:      "border-blue-500/30 text-blue-400",
  }
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest shrink-0",
      roleCls[role]
    )}>
      {roleLabel[role]}
    </span>
  )
}

// ---------------------------------------------------------------------------
// StatCell
// ---------------------------------------------------------------------------

function StatCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-5 px-4">
      <span className="font-display text-3xl font-bold text-brand">{value}</span>
      <span className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

function EmptyState({ isStaff }: { isStaff?: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-border bg-card">
      {/* Glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-48 w-80 rounded-full bg-brand/15 blur-3xl"
      />

      <div className="relative flex flex-col items-center gap-6 py-20 px-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-muted shadow-inner">
          <Users className="h-8 w-8 text-muted-foreground/40" />
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide">
            No Teams Yet
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs">
            {isStaff
              ? "No teams exist on this platform yet."
              : "Create your own team or ask a team captain to add you to their roster."}
          </p>
        </div>

        {!isStaff && (
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/team/create"
              className={cn(buttonVariants({ size: "lg" }), "gap-2 px-8")}
            >
              <Plus className="h-4 w-4" />
              Create a Team
            </Link>
            <Link
              href="/teams"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "gap-2 px-8")}
            >
              <Users className="h-4 w-4" />
              Browse Teams
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
