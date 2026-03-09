/**
 * /teams/[teamSlug]
 *
 * Public team profile page. No auth required.
 */

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils/dates"
import {
  Globe,
  Twitter,
  MessageSquare,
  Trophy,
  ChevronLeft,
} from "lucide-react"
import type { RegistrationStatus } from "@prisma/client"
import { TeamLogo } from "@/components/team/TeamLogo"
import { RosterTable } from "@/components/team/RosterTable"

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ teamSlug: string }>
}): Promise<Metadata> {
  const { teamSlug } = await params
  const team = await prisma.team.findUnique({
    where:  { slug: teamSlug, deletedAt: null },
    select: { name: true },
  })
  return team
    ? { title: team.name, description: `${team.name} — C3 Esports team profile.` }
    : {}
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getTeam(slug: string) {
  return prisma.team.findUnique({
    where:  { slug, deletedAt: null },
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
      memberships: {
        where:   { leftAt: null },
        orderBy: [{ isCaptain: "desc" }, { role: "asc" }, { joinedAt: "asc" }],
        select: {
          id:        true,
          role:      true,
          isCaptain: true,
          player: {
            select: {
              id:           true,
              displayName:  true,
              avatarUrl:    true,
              epicUsername: true,
              user: { select: { image: true } },
            },
          },
        },
      },
      registrations: {
        orderBy: { registeredAt: "desc" },
        take:    5,
        select: {
          id:           true,
          status:       true,
          registeredAt: true,
          season:   { select: { id: true, name: true, status: true } },
          division: { select: { id: true, name: true, tier: true } },
        },
      },
    },
  })
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function TeamProfilePage({
  params,
}: {
  params: Promise<{ teamSlug: string }>
}) {
  const { teamSlug } = await params
  const team = await getTeam(teamSlug)
  if (!team) notFound()

  const color      = team.primaryColor ?? "oklch(0.50 0.20 15)"
  const currentReg = team.registrations.find((r) => r.status === "APPROVED") ?? null

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 space-y-6">

      {/* ── Back link ────────────────────────────────────────────── */}
      <Link
        href="/teams"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        All Teams
      </Link>

      {/* ── Team header ───────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="h-2 w-full" style={{ backgroundColor: color }} />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <TeamLogo
              name={team.name}
              logoUrl={team.logoUrl}
              primaryColor={team.primaryColor}
              size="xl"
              className="shadow-lg"
            />

            <div className="flex-1 min-w-0">
              <h1 className="font-display text-3xl font-bold uppercase tracking-wide leading-none sm:text-4xl">
                {team.name}
              </h1>

              {currentReg?.division && (
                <div className="mt-2">
                  <DivisionBadge tier={currentReg.division.tier} name={currentReg.division.name} />
                </div>
              )}

              {currentReg && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {currentReg.season.name}
                </p>
              )}

              {(team.primaryColor || team.secondaryColor) && (
                <div className="mt-3 flex items-center gap-1.5">
                  {team.primaryColor && (
                    <span
                      className="h-4 w-4 rounded-full border border-black/20 shadow-sm"
                      style={{ backgroundColor: team.primaryColor }}
                      title={`Primary: ${team.primaryColor}`}
                    />
                  )}
                  {team.secondaryColor && (
                    <span
                      className="h-4 w-4 rounded-full border border-black/20 shadow-sm"
                      style={{ backgroundColor: team.secondaryColor }}
                      title={`Secondary: ${team.secondaryColor}`}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Social links */}
          {(team.website || team.twitterHandle || team.discordInvite) && (
            <div className="mt-6 flex flex-wrap gap-4 border-t border-border pt-5">
              {team.website && (
                <a
                  href={team.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  Website
                </a>
              )}
              {team.twitterHandle && (
                <a
                  href={`https://twitter.com/${team.twitterHandle.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Twitter className="h-4 w-4" />
                  {team.twitterHandle.startsWith("@") ? team.twitterHandle : `@${team.twitterHandle}`}
                </a>
              )}
              {team.discordInvite && (
                <a
                  href={team.discordInvite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  Discord
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Active Roster ─────────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Active Roster
          </h2>
          <span className="text-xs text-muted-foreground">
            {team.memberships.length} {team.memberships.length === 1 ? "player" : "players"}
          </span>
        </div>
        <RosterTable members={team.memberships} />
      </section>

      {/* ── Season History ────────────────────────────────────────── */}
      {team.registrations.length > 0 && (
        <section className="rounded-xl border border-border bg-card">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Season History
            </h2>
          </div>
          <ul className="divide-y divide-border">
            {team.registrations.map((reg) => (
              <li key={reg.id} className="flex items-center justify-between gap-4 px-6 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Trophy className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{reg.season.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {reg.division?.name ?? "Division TBD"} · {formatDate(reg.registeredAt)}
                    </p>
                  </div>
                </div>
                <RegistrationBadge status={reg.status} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-xs text-muted-foreground/40 pb-2">
        Team founded {formatDate(team.createdAt)}
      </p>

    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components (page-specific)
// ---------------------------------------------------------------------------

function DivisionBadge({ tier, name }: { tier: string; name: string }) {
  const map: Record<string, string> = {
    PREMIER:    "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    CHALLENGERS:"bg-sky-500/20 text-sky-400 border-sky-500/30",
    CONTENDERS: "bg-brand/20 text-brand border-brand/30",
  }
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-widest",
      map[tier] ?? "bg-muted text-muted-foreground"
    )}>
      <Trophy className="h-3 w-3" />
      {name}
    </span>
  )
}

function RegistrationBadge({ status }: { status: RegistrationStatus }) {
  const map: Record<RegistrationStatus, { label: string; cls: string }> = {
    PENDING:    { label: "Pending",    cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
    APPROVED:   { label: "Approved",  cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    REJECTED:   { label: "Rejected",  cls: "bg-destructive/15 text-destructive border-destructive/30" },
    WAITLISTED: { label: "Waitlisted",cls: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
    WITHDRAWN:  { label: "Withdrawn", cls: "bg-muted text-muted-foreground" },
  }
  const { label, cls } = map[status]
  return (
    <span className={cn(
      "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
      cls
    )}>
      {label}
    </span>
  )
}
