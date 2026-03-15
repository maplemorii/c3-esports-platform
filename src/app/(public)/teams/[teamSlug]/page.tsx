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
  Users,
  Calendar,
} from "lucide-react"
import type { RegistrationStatus, DivisionTier } from "@prisma/client"
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
  if (!team) return {}
  const title       = team.name
  const description = `${team.name} — View the roster, season history, and profile for this C3 Esports League team.`
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter:   { card: "summary_large_image", title, description },
  }
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
    <div className="relative min-h-screen">
      {/* Team color ambient glow */}
      <div
        className="pointer-events-none absolute top-0 left-0 right-0 h-80 opacity-15"
        style={{
          background: `radial-gradient(ellipse 60% 100% at 30% 0%, ${color}, transparent 70%)`,
          filter: "blur(60px)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-6 py-12 md:px-10 md:py-16">

        {/* Back link */}
        <Link
          href="/teams"
          className="mb-8 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          All Teams
        </Link>

        {/* Hero card */}
        <div className="relative rounded-2xl border border-border bg-card overflow-hidden mb-6">
          {/* Top accent using team color */}
          <div className="h-1.5 w-full" style={{ backgroundColor: color }} />

          <div className="p-8 sm:p-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              {/* Logo */}
              <TeamLogo
                name={team.name}
                logoUrl={team.logoUrl}
                primaryColor={team.primaryColor}
                size="xl"
                className="shadow-xl"
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h1 className="font-display text-4xl font-bold uppercase tracking-tight leading-none sm:text-5xl">
                  {team.name}
                </h1>

                {currentReg?.division && (
                  <div className="mt-3">
                    <DivisionBadge tier={currentReg.division.tier} name={currentReg.division.name} />
                  </div>
                )}
                {currentReg && (
                  <p className="mt-2 text-sm text-muted-foreground">{currentReg.season.name}</p>
                )}

                {/* Team colors */}
                {(team.primaryColor || team.secondaryColor) && (
                  <div className="mt-4 flex items-center gap-2">
                    {team.primaryColor && (
                      <span
                        className="h-5 w-5 rounded-full border border-black/20 shadow-sm"
                        style={{ backgroundColor: team.primaryColor }}
                        title={`Primary: ${team.primaryColor}`}
                      />
                    )}
                    {team.secondaryColor && (
                      <span
                        className="h-5 w-5 rounded-full border border-black/20 shadow-sm"
                        style={{ backgroundColor: team.secondaryColor }}
                        title={`Secondary: ${team.secondaryColor}`}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-6 sm:flex-col sm:items-end shrink-0">
                <div className="text-center sm:text-right">
                  <p className="font-display text-3xl font-bold text-foreground">
                    {team.memberships.length}
                  </p>
                  <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:justify-end">
                    <Users className="h-3 w-3" />
                    Players
                  </p>
                </div>
                <div className="text-center sm:text-right">
                  <p className="font-display text-3xl font-bold text-foreground">
                    {team.registrations.length}
                  </p>
                  <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:justify-end">
                    <Trophy className="h-3 w-3" />
                    Seasons
                  </p>
                </div>
              </div>
            </div>

            {/* Social links */}
            {(team.website || team.twitterHandle || team.discordInvite) && (
              <div className="mt-8 flex flex-wrap gap-4 border-t border-border pt-6">
                {team.website && (
                  <a
                    href={team.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand transition-colors duration-150"
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
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand transition-colors duration-150"
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
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand transition-colors duration-150"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Discord
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">

          {/* Roster — takes 2/3 */}
          <section className="lg:col-span-2 rounded-2xl border border-border bg-card overflow-hidden">
            <div
              className="relative px-6 py-4 border-b border-border"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.5), rgba(59,130,246,0.3), transparent)" }}
                aria-hidden
              />
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  Active Roster
                </h2>
                <span className="text-xs text-muted-foreground">
                  {team.memberships.length} {team.memberships.length === 1 ? "player" : "players"}
                </span>
              </div>
            </div>
            <RosterTable members={team.memberships} />
          </section>

          {/* Season history — takes 1/3 */}
          <section className="rounded-2xl border border-border bg-card overflow-hidden self-start">
            <div
              className="relative px-6 py-4 border-b border-border"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.5), rgba(59,130,246,0.3), transparent)" }}
                aria-hidden
              />
              <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                Season History
              </h2>
            </div>

            {team.registrations.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                <Trophy className="h-8 w-8 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground">No seasons yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {team.registrations.map((reg) => (
                  <li key={reg.id} className="flex items-start justify-between gap-3 px-6 py-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{reg.season.name}</p>
                      {reg.division && (
                        <p className="mt-0.5 text-xs text-muted-foreground truncate">
                          {reg.division.name}
                        </p>
                      )}
                      <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground/60">
                        <Calendar className="h-3 w-3" />
                        {formatDate(reg.registeredAt)}
                      </p>
                    </div>
                    <RegistrationBadge status={reg.status} />
                  </li>
                ))}
              </ul>
            )}

            <div className="px-6 py-3 border-t border-border">
              <p className="text-[10px] text-muted-foreground/40">
                Founded {formatDate(team.createdAt)}
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DivisionBadge({ tier, name }: { tier: DivisionTier | string; name: string }) {
  const map: Record<string, string> = {
    PREMIER:     "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    CHALLENGERS: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    CONTENDERS:  "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
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
    APPROVED:   { label: "Approved",   cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    REJECTED:   { label: "Rejected",   cls: "bg-destructive/15 text-destructive border-destructive/30" },
    WAITLISTED: { label: "Waitlisted", cls: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
    WITHDRAWN:  { label: "Withdrawn",  cls: "bg-muted text-muted-foreground border-border" },
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
