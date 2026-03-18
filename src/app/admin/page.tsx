/**
 * /admin
 *
 * Admin overview dashboard — platform-wide stats and recent activity.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { formatRelative } from "@/lib/utils/dates"
import {
  Users,
  Shield,
  Calendar,
  Swords,
  ClipboardList,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"

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
  ] = await Promise.all([
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
  const [recentRegistrations, recentMatches, recentAuditEntries] = await Promise.all([
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
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  href?: string
  alert?: boolean
}) {
  const isAlert = alert && value > 0

  const inner = (
    <div
      className="relative overflow-hidden flex items-center gap-4 rounded-2xl p-5 transition-all duration-150 group"
      style={{
        background: isAlert ? "rgba(245,158,11,0.04)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${isAlert ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.07)"}`,
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: isAlert
            ? "linear-gradient(90deg, rgba(245,158,11,0.5), transparent)"
            : "linear-gradient(90deg, rgba(196,28,53,0.4), rgba(59,130,246,0.2), transparent)",
        }}
        aria-hidden
      />
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{
          background: isAlert ? "rgba(245,158,11,0.1)" : "rgba(196,28,53,0.1)",
          border: `1px solid ${isAlert ? "rgba(245,158,11,0.25)" : "rgba(196,28,53,0.2)"}`,
        }}
      >
        <Icon
          className="h-5 w-5"
          style={{ color: isAlert ? "rgba(251,191,36,0.9)" : "rgba(196,28,53,0.9)" }}
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-black font-display tabular-nums">{value.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">{label}</p>
      </div>
      {href && (
        <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors shrink-0" />
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

  const actionRequired = stats.pendingRegistrations + stats.openDisputes

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">

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
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(196,28,53,0.8)" }}>
              Staff Panel
            </p>
            <h1 className="font-display text-3xl font-black uppercase tracking-wide">Overview</h1>
            <p className="mt-1 text-sm text-muted-foreground">Platform health at a glance.</p>
          </div>
          {actionRequired > 0 && (
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-2.5"
              style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}
            >
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400">
                {actionRequired} item{actionRequired !== 1 ? "s" : ""} need attention
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users"     value={stats.totalUsers}           icon={Users}         href="/admin/users" />
        <StatCard label="Total Teams"     value={stats.totalTeams}           icon={Shield}        href="/admin/teams" />
        <StatCard label="Active Seasons"  value={stats.activeSeasons}        icon={Calendar}      href="/admin/seasons" />
        <StatCard label="Pending Reviews" value={stats.pendingRegistrations} icon={ClipboardList} href="/admin/seasons" alert />
        <StatCard label="Total Matches"   value={stats.totalMatches}         icon={Swords}        href="/admin/matches" />
        <StatCard label="Completed"       value={stats.completedMatches}     icon={CheckCircle2} />
        <StatCard label="Open Disputes"   value={stats.openDisputes}         icon={AlertTriangle} href="/admin/disputes" alert />
      </div>

      {/* Activity columns */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* Pending registrations */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Pending Registrations
            </h2>
            <Link href="/admin/seasons" className="text-xs text-brand hover:underline">
              View all
            </Link>
          </div>

          {recentRegistrations.length === 0 ? (
            <div
              className="flex items-center gap-3 rounded-2xl px-4 py-4"
              style={{ background: "rgba(52,211,153,0.04)", border: "1px solid rgba(52,211,153,0.12)" }}
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <p className="text-sm text-emerald-400 font-medium">All caught up — no pending registrations.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentRegistrations.map((reg) => (
                <div
                  key={reg.id}
                  className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
                  style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{reg.team.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{reg.season.name}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
                      style={{
                        background: reg.status === "WAITLISTED" ? "rgba(59,130,246,0.12)" : "rgba(245,158,11,0.12)",
                        color: reg.status === "WAITLISTED" ? "rgba(96,165,250,0.9)" : "rgba(251,191,36,0.9)",
                      }}
                    >
                      {reg.status === "WAITLISTED" ? "Waitlisted" : "Pending"}
                    </span>
                    <Link
                      href={`/admin/seasons/${reg.season.id}/registrations`}
                      className="text-xs text-brand hover:text-brand/80 font-medium transition-colors"
                    >
                      Review →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent completed matches */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Recent Matches
            </h2>
            <Link href="/admin/matches" className="text-xs text-brand hover:underline">
              View all
            </Link>
          </div>

          {recentMatches.length === 0 ? (
            <div
              className="rounded-2xl px-4 py-4 text-sm text-muted-foreground"
              style={{ border: "1px solid rgba(255,255,255,0.06)" }}
            >
              No completed matches yet.
            </div>
          ) : (
            <div className="space-y-2">
              {recentMatches.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between gap-3 rounded-xl px-4 py-3"
                  style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">
                      {match.homeTeam.name}
                      <span className="mx-1.5 text-muted-foreground font-normal">vs</span>
                      {match.awayTeam.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{match.division.name}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-black font-display tabular-nums">
                      {match.homeScore ?? "—"} – {match.awayScore ?? "—"}
                    </p>
                    {match.completedAt && (
                      <p className="text-[10px] text-muted-foreground/60">
                        {formatRelative(match.completedAt)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>

      {/* Audit log preview */}
      {recentAuditEntries.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Recent Staff Activity
            </h2>
            <Link href="/admin/audit" className="text-xs text-brand hover:underline">
              Full audit log
            </Link>
          </div>
          <div
            className="relative overflow-hidden rounded-2xl"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.4), rgba(59,130,246,0.2), transparent)" }}
              aria-hidden
            />
            {recentAuditEntries.map((entry, i) => {
              const actorName =
                entry.actor.player?.displayName ?? entry.actor.name ?? "Unknown"
              return (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-4 px-4 py-2.5"
                  style={i > 0 ? { borderTop: "1px solid rgba(255,255,255,0.04)" } : undefined}
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <code
                      className="shrink-0 text-xs font-mono rounded-md px-2 py-0.5"
                      style={{ background: "rgba(196,28,53,0.1)", color: "rgba(252,165,165,0.8)" }}
                    >
                      {entry.action}
                    </code>
                    <span className="text-xs text-muted-foreground truncate">
                      {entry.entityType} · by {actorName}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground/50 tabular-nums">
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
