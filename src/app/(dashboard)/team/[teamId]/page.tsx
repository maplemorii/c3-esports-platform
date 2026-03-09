import { notFound } from "next/navigation"
import Link from "next/link"
import {
  Users,
  Settings,
  ClipboardList,
  Trophy,
  ShieldCheck,
  Crown,
  ChevronRight,
  Globe,
  Twitter,
  MessageSquare,
  UserRound,
} from "lucide-react"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { hasMinRole } from "@/lib/roles"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils/dates"
import { buttonVariants } from "@/components/ui/button-variants"
import { CheckInButton } from "@/components/team/CheckInButton"
import { formatDateTime } from "@/lib/utils/dates"
import type { RegistrationStatus, MembershipRole } from "@prisma/client"

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getTeam(teamId: string) {
  return prisma.team.findUnique({
    where:  { id: teamId, deletedAt: null },
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
      ownerId:        true,
      createdAt:      true,
      owner: {
        select: { id: true, name: true, image: true },
      },
      memberships: {
        where:   { leftAt: null },
        orderBy: [{ isCaptain: "desc" }, { role: "asc" }, { joinedAt: "asc" }],
        select: {
          id:          true,
          role:        true,
          isCaptain:   true,
          jerseyNumber: true,
          joinedAt:    true,
          player: {
            select: {
              id:          true,
              displayName: true,
              avatarUrl:   true,
              epicUsername: true,
            },
          },
        },
      },
      registrations: {
        orderBy: { registeredAt: "desc" },
        take: 3,
        select: {
          id:     true,
          status: true,
          registeredAt: true,
          season: {
            select: { id: true, slug: true, name: true, status: true },
          },
          division: {
            select: { id: true, name: true, tier: true },
          },
        },
      },
    },
  })
}

async function getCheckInMatches(teamId: string) {
  return prisma.match.findMany({
    where: {
      status:    "CHECKING_IN",
      deletedAt: null,
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    },
    select: {
      id:          true,
      scheduledAt: true,
      checkInDeadlineAt: true,
      homeTeam:    { select: { id: true, name: true } },
      awayTeam:    { select: { id: true, name: true } },
      checkIns:    { select: { teamId: true, status: true } },
    },
    orderBy: { scheduledAt: "asc" },
  })
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function TeamHubPage({
  params,
}: {
  params: Promise<{ teamId: string }>
}) {
  const { teamId } = await params
  const [session, team, checkInMatches] = await Promise.all([
    getSession(),
    getTeam(teamId),
    getCheckInMatches(teamId),
  ])

  if (!team) notFound()

  const isManager =
    session?.user.id === team.ownerId ||
    hasMinRole(session?.user.role, "STAFF")

  const activeRegistration = team.registrations.find(
    (r) => r.status === "APPROVED"
  )

  return (
    <div className="mx-auto max-w-4xl space-y-6">

      {/* ── Team header ───────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Color accent bar */}
        <div
          className="h-2 w-full"
          style={{ backgroundColor: team.primaryColor ?? "oklch(0.50 0.20 15)" }}
        />

        <div className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

            {/* Identity */}
            <div className="flex items-center gap-4">
              {/* Logo / fallback */}
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-border text-xl font-bold text-white"
                style={{ backgroundColor: team.primaryColor ?? "oklch(0.50 0.20 15)" }}
              >
                {team.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={team.logoUrl}
                    alt={team.name}
                    className="h-full w-full rounded-xl object-cover"
                  />
                ) : (
                  team.name.slice(0, 2).toUpperCase()
                )}
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl font-bold uppercase tracking-wide leading-none">
                    {team.name}
                  </h1>
                </div>

                {activeRegistration && (
                  <p className="text-sm text-muted-foreground">
                    {activeRegistration.division?.name} ·{" "}
                    <span className="text-foreground">{activeRegistration.season.name}</span>
                  </p>
                )}

                {/* Color swatches */}
                {(team.primaryColor || team.secondaryColor) && (
                  <div className="flex items-center gap-1.5 mt-1">
                    {team.primaryColor && (
                      <span
                        className="h-4 w-4 rounded-full border border-black/20"
                        style={{ backgroundColor: team.primaryColor }}
                        title={team.primaryColor}
                      />
                    )}
                    {team.secondaryColor && (
                      <span
                        className="h-4 w-4 rounded-full border border-black/20"
                        style={{ backgroundColor: team.secondaryColor }}
                        title={team.secondaryColor}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {isManager && (
              <div className="flex flex-wrap gap-2 sm:shrink-0">
                <Link
                  href={`/team/${teamId}/settings`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
                >
                  <Settings className="h-3.5 w-3.5" />
                  Settings
                </Link>
                <Link
                  href={`/team/${teamId}/register`}
                  className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  Register for Season
                </Link>
              </div>
            )}
          </div>

          {/* External links */}
          {(team.website || team.twitterHandle || team.discordInvite) && (
            <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-4">
              {team.website && (
                <a
                  href={team.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Website
                </a>
              )}
              {team.twitterHandle && (
                <a
                  href={`https://twitter.com/${team.twitterHandle.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Twitter className="h-3.5 w-3.5" />
                  {team.twitterHandle}
                </a>
              )}
              {team.discordInvite && (
                <a
                  href={team.discordInvite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Discord
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick nav cards ───────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-3">
        <NavCard
          href={`/team/${teamId}/roster`}
          icon={Users}
          label="Roster"
          value={`${team.memberships.length} member${team.memberships.length !== 1 ? "s" : ""}`}
        />
        <NavCard
          href={`/team/${teamId}/register`}
          icon={Trophy}
          label="Season Registration"
          value={activeRegistration
            ? activeRegistration.season.name
            : "Not registered"}
        />
        {isManager && (
          <NavCard
            href={`/team/${teamId}/settings`}
            icon={Settings}
            label="Settings"
            value="Edit team info"
          />
        )}
      </div>

      {/* ── Check-in required ────────────────────────────────────── */}
      {isManager && checkInMatches.length > 0 && (
        <section className="rounded-xl border border-sky-500/30 bg-sky-500/5">
          <div className="px-6 py-4 border-b border-sky-500/20">
            <h2 className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-widest text-sky-400">
              <ShieldCheck className="h-4 w-4" />
              Check-In Required
            </h2>
          </div>
          <ul className="divide-y divide-sky-500/10">
            {checkInMatches.map((match) => {
              const myCheckIn = match.checkIns.find((c) => c.teamId === teamId)
              const alreadyDone = myCheckIn?.status === "CHECKED_IN"
              const opponent = match.homeTeam.id === teamId ? match.awayTeam : match.homeTeam
              return (
                <li key={match.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">vs {opponent.name}</p>
                    {match.scheduledAt && (
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(match.scheduledAt)}
                        {match.checkInDeadlineAt && (
                          <> · Deadline {formatDateTime(match.checkInDeadlineAt)}</>
                        )}
                      </p>
                    )}
                  </div>
                  <CheckInButton matchId={match.id} alreadyDone={alreadyDone} />
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* ── Roster ───────────────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Active Roster
          </h2>
          {isManager && (
            <Link
              href={`/team/${teamId}/roster`}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1 text-xs")}
            >
              Manage
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {team.memberships.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Users className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No players on the roster yet.</p>
            {isManager && (
              <Link
                href={`/team/${teamId}/roster`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-1")}
              >
                Add Players
              </Link>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {team.memberships.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-6 py-3">
                {/* Avatar */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-semibold text-muted-foreground">
                  {m.player?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.player.avatarUrl}
                      alt={m.player.displayName}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <UserRound className="h-4 w-4" />
                  )}
                </div>

                {/* Name + username */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-sm font-medium truncate">
                      {m.player?.displayName ?? "Unknown"}
                    </span>
                    {m.isCaptain && (
                      <Crown className="h-3 w-3 text-yellow-500 shrink-0" aria-label="Captain" />
                    )}
                  </div>
                  {m.player?.epicUsername && (
                    <p className="text-xs text-muted-foreground truncate">
                      {m.player.epicUsername}
                    </p>
                  )}
                </div>

                <RoleBadge role={m.role} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Season registrations ─────────────────────────────────── */}
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
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{reg.season.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {reg.division?.name ?? "Division TBD"} · Registered {formatDate(reg.registeredAt)}
                  </p>
                </div>
                <RegistrationBadge status={reg.status} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Meta ─────────────────────────────────────────────────── */}
      <p className="text-xs text-muted-foreground/50 pb-2">
        Team created {formatDate(team.createdAt)} · Owner: {team.owner.name ?? "Unknown"}
      </p>

    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function NavCard({
  href,
  icon: Icon,
  label,
  value,
}: {
  href:  string
  icon:  React.ElementType
  label: string
  value: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-brand/40 hover:bg-card"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand/30 bg-brand/10">
        <Icon className="h-4 w-4 text-brand" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
    </Link>
  )
}

function RoleBadge({ role }: { role: MembershipRole }) {
  const map: Record<MembershipRole, { label: string; className: string }> = {
    PLAYER:     { label: "Player",    className: "bg-muted text-muted-foreground" },
    SUBSTITUTE: { label: "Sub",       className: "bg-sky-500/15 text-sky-400 border-sky-500/30" },
    COACH:      { label: "Coach",     className: "bg-violet-500/15 text-violet-400 border-violet-500/30" },
  }
  const { label, className } = map[role]
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", className)}>
      {label}
    </span>
  )
}

function RegistrationBadge({ status }: { status: RegistrationStatus }) {
  const map: Record<RegistrationStatus, { label: string; className: string }> = {
    PENDING:    { label: "Pending",    className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
    APPROVED:   { label: "Approved",  className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    REJECTED:   { label: "Rejected",  className: "bg-destructive/15 text-destructive border-destructive/30" },
    WAITLISTED: { label: "Waitlisted",className: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
    WITHDRAWN:  { label: "Withdrawn", className: "bg-muted text-muted-foreground" },
  }
  const { label, className } = map[status]
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide shrink-0", className)}>
      {label}
    </span>
  )
}
