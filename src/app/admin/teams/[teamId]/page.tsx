/**
 * /admin/teams/[teamId]
 *
 * Team detail for admin — info, roster, registration history, recent matches.
 * Links to public team profile and registrations queue.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { formatDate, formatRelative } from "@/lib/utils/dates"
import {
  ArrowLeft,
  Shield,
  Users,
  ExternalLink,
  Calendar,
  Swords,
} from "lucide-react"
import type { DivisionTier, RegistrationStatus } from "@prisma/client"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIER_LABEL: Record<DivisionTier, string> = {
  PREMIER:     "Premier",
  CHALLENGERS: "Challengers",
  CONTENDERS:  "Contenders",
}

const REG_STATUS_META: Record<RegistrationStatus, { label: string; cls: string }> = {
  PENDING:    { label: "Pending",    cls: "bg-amber-500/15 text-amber-400" },
  WAITLISTED: { label: "Waitlisted", cls: "bg-sky-500/15 text-sky-400" },
  APPROVED:   { label: "Approved",   cls: "bg-emerald-500/15 text-emerald-400" },
  REJECTED:   { label: "Rejected",   cls: "bg-destructive/15 text-destructive" },
  WITHDRAWN:  { label: "Withdrawn",  cls: "bg-muted text-muted-foreground" },
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

async function getData(teamId: string) {
  return prisma.team.findUnique({
    where: { id: teamId, deletedAt: null },
    select: {
      id:           true,
      name:         true,
      slug:         true,
      logoUrl:      true,
      primaryColor: true,
      website:      true,
      twitterHandle: true,
      discordInvite: true,
      createdAt:    true,
      owner: { select: { id: true, name: true, email: true } },
      memberships: {
        where: { leftAt: null },
        orderBy: { joinedAt: "asc" },
        select: {
          id:       true,
          joinedAt: true,
          player: {
            select: {
              id:          true,
              displayName: true,
              epicUsername: true,
              user: { select: { email: true } },
            },
          },
        },
      },
      registrations: {
        orderBy: { registeredAt: "desc" },
        select: {
          id:           true,
          status:       true,
          notes:        true,
          registeredAt: true,
          reviewedAt:   true,
          season:   { select: { id: true, name: true } },
          division: { select: { id: true, name: true, tier: true } },
        },
      },
      homeMatches: {
        where: { deletedAt: null },
        orderBy: { scheduledAt: "desc" },
        take: 5,
        select: {
          id:          true,
          status:      true,
          scheduledAt: true,
          homeScore:   true,
          awayScore:   true,
          awayTeam:    { select: { id: true, name: true } },
          division:    { select: { name: true } },
        },
      },
      awayMatches: {
        where: { deletedAt: null },
        orderBy: { scheduledAt: "desc" },
        take: 5,
        select: {
          id:          true,
          status:      true,
          scheduledAt: true,
          homeScore:   true,
          awayScore:   true,
          homeTeam:    { select: { id: true, name: true } },
          division:    { select: { name: true } },
        },
      },
    },
  })
}

type Team = NonNullable<Awaited<ReturnType<typeof getData>>>

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamId: string }>
}): Promise<Metadata> {
  const { teamId } = await params
  const team = await getData(teamId)
  return { title: team ? `${team.name} — Admin` : "Team Not Found" }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminTeamDetailPage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = await params
  const team = await getData(teamId)
  if (!team) notFound()

  // Combine and sort recent matches
  const recentMatches = [
    ...team.homeMatches.map((m) => ({
      id:       m.id,
      status:   m.status,
      scheduledAt: m.scheduledAt,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      opponent: m.awayTeam.name,
      isHome:   true,
      division: m.division.name,
    })),
    ...team.awayMatches.map((m) => ({
      id:       m.id,
      status:   m.status,
      scheduledAt: m.scheduledAt,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      opponent: m.homeTeam.name,
      isHome:   false,
      division: m.division.name,
    })),
  ]
    .sort((a, b) => {
      const da = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0
      const db = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0
      return db - da
    })
    .slice(0, 8)

  return (
    <div className="mx-auto max-w-4xl space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/admin/teams" className="flex items-center gap-1 hover:text-brand transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Teams
        </Link>
        <span>/</span>
        <span className="text-foreground">{team.name}</span>
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
        <div className="flex items-start gap-4">
          {team.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={team.logoUrl}
              alt={team.name}
              className="h-16 w-16 rounded-xl object-cover shrink-0"
              style={{ border: "1px solid rgba(255,255,255,0.08)" }}
            />
          ) : (
            <div
              className="h-16 w-16 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(196,28,53,0.1)", border: "1px solid rgba(196,28,53,0.15)" }}
            >
              <Shield className="h-8 w-8" style={{ color: "rgba(196,28,53,0.7)" }} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(196,28,53,0.8)" }}>
              Staff Panel · Team Detail
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-2xl font-black uppercase tracking-wide">{team.name}</h1>
              <Link
                href={`/teams/${team.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-brand transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Public profile
              </Link>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-mono text-muted-foreground/60">{team.slug}</span>
              {" · Owner: "}
              <span className="text-foreground">{team.owner.name ?? team.owner.email}</span>
              {" · Created "}
              {formatRelative(team.createdAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        {/* Roster */}
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div
            className="flex items-center gap-2 px-5 py-3.5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Roster ({team.memberships.length})
            </h2>
          </div>
          {team.memberships.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted-foreground">No active members.</p>
          ) : (
            <div>
              {team.memberships.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.player.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {m.player.user.email}
                      {m.player.epicUsername && ` · ${m.player.epicUsername}`}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground/60 shrink-0">
                    {formatDate(new Date(m.joinedAt))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Registration history */}
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div
            className="flex items-center gap-2 px-5 py-3.5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Registrations ({team.registrations.length})
            </h2>
          </div>
          {team.registrations.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted-foreground">No registrations.</p>
          ) : (
            <div>
              {team.registrations.map((reg) => {
                const meta = REG_STATUS_META[reg.status]
                return (
                  <div
                    key={reg.id}
                    className="flex items-center justify-between gap-3 px-5 py-3"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{reg.season.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {reg.division ? `${TIER_LABEL[reg.division.tier]} · ${reg.division.name}` : "No division"}
                        {" · "}
                        {formatDate(new Date(reg.registeredAt))}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", meta.cls)}>
                        {meta.label}
                      </span>
                      <Link
                        href={`/admin/seasons/${reg.season.id}/registrations`}
                        className="text-xs text-muted-foreground hover:text-brand transition-colors"
                      >
                        →
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {/* Recent matches */}
      {recentMatches.length > 0 && (
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div
            className="flex items-center gap-2 px-5 py-3.5"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <Swords className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Recent Matches
            </h2>
          </div>
          <div>
            {recentMatches.map((m) => (
              <Link
                key={m.id}
                href={`/admin/matches/${m.id}`}
                className="group flex items-center justify-between gap-4 px-5 py-3 hover:bg-white/3 transition-colors"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {m.isHome ? `vs ${m.opponent}` : `@ ${m.opponent}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {m.division}
                    {m.scheduledAt && ` · ${formatDate(new Date(m.scheduledAt))}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {m.homeScore !== null && m.awayScore !== null && (
                    <span className="font-display text-sm font-bold tabular-nums">
                      {m.homeScore} – {m.awayScore}
                    </span>
                  )}
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                    m.status === "COMPLETED" ? "bg-emerald-500/15 text-emerald-400" :
                    m.status === "FORFEITED" ? "bg-destructive/15 text-destructive" :
                    m.status === "CANCELLED" ? "bg-muted text-muted-foreground" :
                    "bg-sky-500/15 text-sky-400",
                  )}>
                    {m.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
