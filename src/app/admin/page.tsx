/**
 * /admin
 *
 * Admin overview dashboard — platform-wide stats and recent activity.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { formatRelative } from "@/lib/utils/dates"
import {
  Users,
  Shield,
  Calendar,
  Swords,
  ClipboardList,
  ChevronRight,
  AlertTriangle,
} from "lucide-react"
import type { SeasonStatus } from "@prisma/client"

export const metadata: Metadata = {
  title: "Admin Overview — C3 Esports",
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function getStats() {
  const [
    totalUsers,
    totalTeams,
    activeSeasons,
    pendingRegistrations,
    totalMatches,
    completedMatches,
    openDisputes,
  ] = await prisma.$transaction([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.team.count({ where: { deletedAt: null } }),
    prisma.season.count({ where: { status: { in: ["REGISTRATION", "ACTIVE", "PLAYOFFS"] } } }),
    prisma.seasonRegistration.count({ where: { status: { in: ["PENDING", "WAITLISTED"] } } }),
    prisma.match.count({ where: { deletedAt: null } }),
    prisma.match.count({ where: { status: "COMPLETED", deletedAt: null } }),
    prisma.dispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
  ])

  return {
    totalUsers,
    totalTeams,
    activeSeasons,
    pendingRegistrations,
    totalMatches,
    completedMatches,
    openDisputes,
  }
}

async function getRecentActivity() {
  const [recentRegistrations, recentMatches, recentAuditEntries] = await prisma.$transaction([
    prisma.seasonRegistration.findMany({
      where:   { status: { in: ["PENDING", "WAITLISTED"] } },
      orderBy: { registeredAt: "desc" },
      take: 5,
      select: {
        id:           true,
        status:       true,
        registeredAt: true,
        team:   { select: { id: true, name: true, slug: true } },
        season: { select: { id: true, name: true } },
      },
    }),
    prisma.match.findMany({
      where:   { status: "COMPLETED", deletedAt: null },
      orderBy: { completedAt: "desc" },
      take: 5,
      select: {
        id:          true,
        completedAt: true,
        homeScore:   true,
        awayScore:   true,
        homeTeam: { select: { name: true, slug: true } },
        awayTeam: { select: { name: true, slug: true } },
        division: { select: { name: true } },
      },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id:         true,
        action:     true,
        entityType: true,
        createdAt:  true,
        actor: { select: { name: true, player: { select: { displayName: true } } } },
      },
    }),
  ])

  return { recentRegistrations, recentMatches, recentAuditEntries }
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_BADGE: Record<SeasonStatus, { label: string; cls: string }> = {
  DRAFT:        { label: "Draft",        cls: "bg-muted text-muted-foreground" },
  REGISTRATION: { label: "Registration", cls: "bg-sky-500/15 text-sky-400" },
  ACTIVE:       { label: "Active",       cls: "bg-brand/15 text-brand" },
  PLAYOFFS:     { label: "Playoffs",     cls: "bg-amber-500/15 text-amber-400" },
  COMPLETED:    { label: "Completed",    cls: "bg-muted text-muted-foreground" },
  CANCELLED:    { label: "Cancelled",    cls: "bg-muted/50 text-muted-foreground/50" },
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon: Icon,
  href,
  alert,
}: {
  label: string
  value: number
  icon: React.ElementType
  href?: string
  alert?: boolean
}) {
  const inner = (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border bg-card p-5 transition-colors",
        href && "hover:border-brand/40 group",
        alert && value > 0 ? "border-amber-500/30" : "border-border"
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
          alert && value > 0
            ? "border-amber-500/30 bg-amber-500/10"
            : "border-brand/30 bg-brand/10"
        )}
      >
        <Icon
          className={cn(
            "h-5 w-5",
            alert && value > 0 ? "text-amber-400" : "text-brand"
          )}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-bold font-display">{value.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">{label}</p>
      </div>
      {href && (
        <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-foreground/60 transition-colors shrink-0" />
      )}
    </div>
  )

  if (href) return <Link href={href}>{inner}</Link>
  return inner
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminOverviewPage() {
  const [stats, activity] = await Promise.all([getStats(), getRecentActivity()])

  const { recentRegistrations, recentMatches, recentAuditEntries } = activity

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-10">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform at a glance.</p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Total Users"      value={stats.totalUsers}           icon={Users}         href="/admin/users" />
        <StatCard label="Total Teams"      value={stats.totalTeams}           icon={Shield}        href="/admin/teams" />
        <StatCard label="Active Seasons"   value={stats.activeSeasons}        icon={Calendar}      href="/admin/seasons" />
        <StatCard label="Pending Reviews"  value={stats.pendingRegistrations} icon={ClipboardList} href="/admin/seasons" alert />
        <StatCard label="Total Matches"    value={stats.totalMatches}         icon={Swords}        href="/admin/matches" />
        <StatCard label="Completed"        value={stats.completedMatches}     icon={Swords} />
        <StatCard label="Open Disputes"    value={stats.openDisputes}         icon={AlertTriangle} href="/admin/disputes" alert />
      </div>

      {/* Activity columns */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Pending registrations */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Pending Registrations
            </h2>
            <Link href="/admin/seasons" className="text-xs text-brand hover:underline">
              View all
            </Link>
          </div>

          {recentRegistrations.length === 0 ? (
            <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              No pending registrations.
            </p>
          ) : (
            <ul className="space-y-2">
              {recentRegistrations.map((reg) => (
                <li key={reg.id}>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{reg.team.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{reg.season.name}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-400">
                        {reg.status === "WAITLISTED" ? "Waitlisted" : "Pending"}
                      </span>
                      <Link
                        href={`/admin/seasons/${reg.season.id}/registrations`}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Review →
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent completed matches */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Recent Matches
            </h2>
            <Link href="/admin/matches" className="text-xs text-brand hover:underline">
              View all
            </Link>
          </div>

          {recentMatches.length === 0 ? (
            <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              No completed matches yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {recentMatches.map((match) => (
                <li key={match.id}>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {match.homeTeam.name}
                        <span className="mx-1.5 text-muted-foreground font-normal">vs</span>
                        {match.awayTeam.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{match.division.name}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold font-display tabular-nums">
                        {match.homeScore ?? "—"} – {match.awayScore ?? "—"}
                      </p>
                      {match.completedAt && (
                        <p className="text-xs text-muted-foreground">
                          {formatRelative(match.completedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

      </div>

      {/* Audit log preview */}
      {recentAuditEntries.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Recent Staff Activity
            </h2>
            <Link href="/admin/audit" className="text-xs text-brand hover:underline">
              Full audit log
            </Link>
          </div>
          <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
            {recentAuditEntries.map((entry) => {
              const actorName =
                entry.actor.player?.displayName ?? entry.actor.name ?? "Unknown"
              return (
                <div key={entry.id} className="flex items-center justify-between gap-4 px-4 py-2.5">
                  <div className="min-w-0 flex items-center gap-3">
                    <code className="shrink-0 text-xs font-mono text-brand bg-brand/10 rounded px-1.5 py-0.5">
                      {entry.action}
                    </code>
                    <span className="text-xs text-muted-foreground truncate">
                      {entry.entityType} · by {actorName}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground/60 tabular-nums">
                    {formatRelative(entry.createdAt)}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

    </div>
  )
}
