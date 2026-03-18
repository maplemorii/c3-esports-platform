/**
 * /(dashboard)/profile
 *
 * Player profile view page.
 * Server component — direct Prisma queries.
 *
 * - No player profile → onboarding CTA to /profile/setup
 * - Has profile → rich view with linked accounts, teams, season activity
 */

import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import {
  UserRound,
  Pencil,
  Plus,
  Gamepad2,
  Layers,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Users,
  Calendar,
  Crown,
  ChevronRight,
  Rocket,
} from "lucide-react"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils/dates"
import { buttonVariants } from "@/components/ui/button-variants"
import { DashboardTeamCard, type DashboardTeamCardData } from "@/components/dashboard/DashboardTeamCard"
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist"
import { SteamLinkButton } from "@/components/player/SteamLinkButton"
import { TrackerUrlInput } from "@/components/player/TrackerUrlInput"
import { DiscordLinkButton } from "@/components/player/DiscordLinkButton"
import { TwoFactorSettings } from "@/components/settings/TwoFactorSettings"
import { DeleteAccountButton } from "@/components/settings/DeleteAccountButton"
import type { MembershipRole } from "@prisma/client"

export const metadata: Metadata = { title: "My Profile" }

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getProfileData(userId: string) {
  const [player, user, memberships, activeSeason] = await Promise.all([
    prisma.player.findUnique({
      where:  { userId, deletedAt: null },
      select: {
        id:              true,
        displayName:     true,
        avatarUrl:       true,
        trackerUrl:      true,
        steamId:         true,
        discordUsername: true,
        bio:             true,
        createdAt:       true,
      },
    }),

    // User account (for email + OAuth provider info)
    prisma.user.findUnique({
      where:  { id: userId },
      select: {
        id:        true,
        name:      true,
        email:     true,
        image:     true,
        role:      true,
        createdAt: true,
        accounts:         { select: { provider: true } },
        password:         true,
        twoFactorEnabled: true,
      },
    }),

    // Active team memberships (where team is not deleted)
    prisma.teamMembership.findMany({
      where: {
        leftAt: null,
        player: { userId, deletedAt: null },
        team:   { deletedAt: null },
      },
      orderBy: { joinedAt: "asc" },
      select: {
        role:      true,
        isCaptain: true,
        joinedAt:  true,
        team: {
          select: {
            id:           true,
            slug:         true,
            name:         true,
            logoUrl:      true,
            primaryColor: true,
            ownerId:      true,
            _count: {
              select: { memberships: { where: { leftAt: null } } },
            },
            registrations: {
              where:   { status: { in: ["PENDING", "APPROVED", "WAITLISTED"] } },
              orderBy: { registeredAt: "desc" as const },
              take:    1,
              select: {
                status:   true,
                season:   { select: { name: true } },
                division: { select: { name: true, tier: true } },
              },
            },
          },
        },
      },
    }),

    prisma.season.findFirst({
      where:   { status: { in: ["REGISTRATION", "ACTIVE", "PLAYOFFS"] } },
      orderBy: { createdAt: "desc" as const },
      select:  { id: true, name: true, status: true },
    }),
  ])

  return { player, user, memberships, activeSeason }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect("/auth/signin")

  const { player, user, memberships, activeSeason } = await getProfileData(session.user.id)

  if (!user) redirect("/auth/signin")

  const hasDiscordOAuth = user.accounts.some((a) => a.provider === "discord")

  const teams: (DashboardTeamCardData & {
    isOwner:    boolean
    isCaptain:  boolean
    memberRole: MembershipRole
    joinedAt:   Date
  })[] = memberships.map((m) => ({
    ...m.team,
    isOwner:    m.team.ownerId === session.user.id,
    isCaptain:  m.isCaptain,
    memberRole: m.role,
    joinedAt:   m.joinedAt,
  }))

  const hasActiveReg = teams.some(
    (t) => t.registrations[0]?.status === "APPROVED"
  )
  const registerHref = teams[0]
    ? `/team/${teams[0].id}/register`
    : "/team"

  // No profile yet → onboarding state
  if (!player) {
    return (
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-1">Dashboard</p>
          <h1 className="font-display text-4xl font-bold uppercase tracking-wide leading-none">
            My Profile
          </h1>
        </div>

        {/* No profile CTA */}
        <div className="relative overflow-hidden rounded-2xl border border-dashed border-brand/30 bg-card">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-48 w-80 rounded-full bg-brand/15 blur-3xl"
          />
          <div className="relative flex flex-col items-center gap-6 py-20 px-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 shadow-inner">
              <UserRound className="h-10 w-10 text-brand/60" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold uppercase tracking-wide">
                No Player Profile Yet
              </h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                Set up your player profile to register for seasons and join a team roster.
                It only takes a minute.
              </p>
            </div>
            <Link
              href="/profile/setup"
              className={cn(buttonVariants({ size: "lg" }), "gap-2 px-10")}
            >
              <Rocket className="h-4 w-4" />
              Set Up Profile
            </Link>
          </div>
        </div>

        <OnboardingChecklist
          hasProfile={false}
          hasTeam={teams.length > 0}
          hasRegistration={hasActiveReg}
          registerHref={registerHref}
        />
      </div>
    )
  }

  const displayName = player.displayName
  const avatarSrc   = player.avatarUrl ?? user.image

  return (
    <div className="mx-auto max-w-4xl space-y-8">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-1">
            Dashboard
          </p>
          <h1 className="font-display text-4xl font-bold uppercase tracking-wide leading-none">
            My Profile
          </h1>
        </div>
        <Link
          href="/profile/edit"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit Profile
        </Link>
      </div>

      {/* ── Onboarding checklist (auto-hides when done) ──────────────── */}
      <OnboardingChecklist
        hasProfile={true}
        hasTeam={teams.length > 0}
        hasRegistration={hasActiveReg}
        registerHref={registerHref}
      />

      {/* ── Hero card ────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
        {/* Glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-brand/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-brand/8 blur-2xl"
        />

        <div className="relative flex flex-col gap-6 p-8 sm:flex-row sm:items-start">

          {/* Avatar */}
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-2 border-border bg-muted text-3xl font-bold text-muted-foreground overflow-hidden shadow-lg">
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarSrc} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <UserRound className="h-12 w-12" />
            )}
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-3xl font-bold uppercase tracking-wide leading-tight">
                  {displayName}
                </h2>
                {user.name && user.name !== displayName && (
                  <p className="text-sm text-muted-foreground mt-0.5">{user.name}</p>
                )}
              </div>
              <RoleBadge role={user.role} />
            </div>

            {/* Bio */}
            {player.bio && (
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-lg">
                {player.bio}
              </p>
            )}

            {/* Meta row */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Member since {formatDate(player.createdAt)}
              </span>
              {teams.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  {teams.length} {teams.length === 1 ? "team" : "teams"}
                </span>
              )}
              {hasActiveReg && (
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Registered for current season
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Linked accounts ──────────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Linked Accounts
          </h2>
          <Link
            href="/profile/edit"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1 text-xs")}
          >
            <Pencil className="h-3 w-3" />
            Edit
          </Link>
        </div>

        <div className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <AccountRow
            icon={Gamepad2}
            platform="RL Tracker"
            value={player.trackerUrl ? "Linked" : null}
            hint="tracker.network profile"
            accentClass="text-sky-400"
            action={<TrackerUrlInput trackerUrl={player.trackerUrl} playerId={player.id} />}
          />
          <AccountRow
            icon={Layers}
            platform="Steam"
            value={player.steamId}
            hint="SteamID64 format"
            accentClass="text-blue-400"
            action={<SteamLinkButton steamId={player.steamId} />}
          />
          <AccountRow
            icon={MessageSquare}
            platform="Discord"
            value={player.discordUsername}
            hint={hasDiscordOAuth ? "OAuth connected" : "Username"}
            accentClass="text-indigo-400"
            oauthConnected={hasDiscordOAuth}
            action={<DiscordLinkButton discordUsername={player.discordUsername} />}
          />
        </div>

        {(!player.trackerUrl || !player.steamId || !player.discordUsername) && (
          <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-6 py-3">
            <p className="text-xs text-muted-foreground">
              Link your gaming accounts to improve match verification and team discovery.
            </p>
            <Link
              href="/profile/edit"
              className={cn(buttonVariants({ size: "sm" }), "gap-1.5 shrink-0")}
            >
              <Plus className="h-3.5 w-3.5" />
              Add accounts
            </Link>
          </div>
        )}
      </section>

      {/* ── My Teams ─────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            My Teams
          </h2>
          <Link
            href="/team"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1 text-xs")}
          >
            View all
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {teams.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted">
              <Users className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">You&apos;re not on any teams yet.</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link
                href="/team/create"
                className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
              >
                <Plus className="h-3.5 w-3.5" />
                Create a Team
              </Link>
              <Link
                href="/teams"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
              >
                <Users className="h-3.5 w-3.5" />
                Browse Teams
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {teams.map((team) => (
              <DashboardTeamCard
                key={team.id}
                team={team}
                isOwner={team.isOwner}
                isCaptain={team.isCaptain}
                memberRole={team.memberRole}
              />
            ))}

            {activeSeason?.status === "REGISTRATION" && (
              <Link
                href={teams[0] ? `/team/${teams[0].id}/register` : "/team"}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "gap-1.5 self-start mt-1 border-brand/40 text-brand hover:bg-brand/10"
                )}
              >
                Register for {activeSeason.name}
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        )}
      </section>

      {/* ── Account info ─────────────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Account
          </h2>
        </div>
        <div className="divide-y divide-border">
          <InfoRow label="Email" value={user.email} />
          <InfoRow
            label="Auth Provider"
            value={
              hasDiscordOAuth
                ? "Discord OAuth"
                : user.accounts.length > 0
                  ? user.accounts[0].provider.charAt(0).toUpperCase() + user.accounts[0].provider.slice(1)
                  : "Email / Password"
            }
          />
          <InfoRow label="Account Created" value={formatDate(user.createdAt)} />
          <InfoRow label="Player ID" value={player.id} mono />
        </div>
      </section>

      {/* ── Security ─────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Security
          </h2>
        </div>
        <div className="px-6 py-5">
          <TwoFactorSettings
            twoFactorEnabled={user.twoFactorEnabled}
            hasPassword={!!user.password}
          />
        </div>
      </section>

      {/* ── Danger zone ──────────────────────────────────────────────── */}
      <section className="rounded-xl border border-red-900/30 bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-red-900/20">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-red-500/60">
            Danger Zone
          </h2>
        </div>
        <div className="px-6 py-5 flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
          <DeleteAccountButton userId={user.id} />
        </div>
      </section>

    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function AccountRow({
  icon: Icon,
  platform,
  value,
  hint,
  accentClass,
  oauthConnected = false,
  action,
}: {
  icon:            React.ComponentType<React.SVGProps<SVGSVGElement>>
  platform:        string
  value?:          string | null
  hint:            string
  accentClass:     string
  oauthConnected?: boolean
  action?:         React.ReactNode
}) {
  const linked = !!(value || oauthConnected)

  return (
    <div className="flex items-start gap-3 p-5">
      <div className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
        linked
          ? "border-current/20 bg-current/10"
          : "border-border bg-muted"
      )}
        style={linked ? { color: "inherit" } : undefined}
      >
        <Icon className={cn("h-4 w-4", linked ? accentClass : "text-muted-foreground/40")} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {platform}
          </p>
          {linked ? (
            <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="h-3 w-3 text-muted-foreground/30 shrink-0" />
          )}
        </div>
        {value ? (
          <p className="text-sm font-medium truncate mt-0.5">{value}</p>
        ) : oauthConnected ? (
          <p className="text-sm font-medium text-emerald-400 mt-0.5">Connected via OAuth</p>
        ) : (
          <p className="text-sm text-muted-foreground/50 mt-0.5">Not linked</p>
        )}
        <p className="text-[11px] text-muted-foreground/50 mt-0.5">{hint}</p>
        {action}
      </div>
    </div>
  )
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-3">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className={cn(
        "text-sm text-right truncate",
        mono ? "font-mono text-xs text-muted-foreground" : "font-medium"
      )}>
        {value}
      </span>
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    ADMIN:        { label: "Admin",        cls: "border-red-500/30 bg-red-500/10 text-red-400" },
    STAFF:        { label: "Staff",        cls: "border-blue-500/30 bg-blue-500/10 text-blue-400" },
    TEAM_MANAGER: { label: "Team Manager", cls: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400" },
    USER:         { label: "Player",       cls: "border-border bg-muted text-muted-foreground" },
  }
  const { label, cls } = map[role] ?? map.USER
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest shrink-0",
      cls
    )}>
      {role === "ADMIN" || role === "STAFF" ? <Crown className="h-2.5 w-2.5" /> : null}
      {label}
    </span>
  )
}
