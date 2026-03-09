import Link from "next/link"
import { redirect } from "next/navigation"
import {
  Users,
  Trophy,
  ClipboardList,
  ChevronRight,
  Plus,
  UserRound,
  CheckCircle2,
  Circle,
  Crown,
  Settings,
  Rocket,
  CalendarClock,
  AlertCircle,
  Swords,
} from "lucide-react"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"
import type { RegistrationStatus, MembershipRole } from "@prisma/client"

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getDashboardData(userId: string) {
  const [player, ownedTeams, memberships, activeSeason] = await Promise.all([
    // Player profile
    prisma.player.findUnique({
      where: { userId, deletedAt: null },
      select: { id: true, displayName: true, avatarUrl: true, epicUsername: true },
    }),

    // Teams the user owns
    prisma.team.findMany({
      where: { ownerId: userId, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        primaryColor: true,
        memberships: {
          where: { leftAt: null },
          select: { id: true },
        },
        registrations: {
          orderBy: { registeredAt: "desc" as const },
          take: 1,
          select: {
            status: true,
            season: { select: { name: true, status: true } },
            division: { select: { name: true } },
          },
        },
      },
    }),

    // Teams the user is a member of (but doesn't own)
    prisma.teamMembership.findMany({
      where: {
        leftAt: null,
        player: { userId, deletedAt: null },
        team: { deletedAt: null },
      },
      select: {
        role: true,
        isCaptain: true,
        team: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            primaryColor: true,
            ownerId: true,
            memberships: {
              where: { leftAt: null },
              select: { id: true },
            },
            registrations: {
              orderBy: { registeredAt: "desc" as const },
              take: 1,
              select: {
                status: true,
                season: { select: { name: true, status: true } },
                division: { select: { name: true } },
              },
            },
          },
        },
      },
    }),

    // Active or upcoming season for registration CTA
    prisma.season.findFirst({
      where: { status: { in: ["REGISTRATION", "ACTIVE", "PLAYOFFS"] } },
      orderBy: { createdAt: "desc" as const },
      select: { id: true, name: true, status: true },
    }),
  ])

  // Deduplicate: merge owned teams + member teams (filter out owned from member list)
  const ownedIds = new Set(ownedTeams.map((t) => t.id))
  const memberTeams = memberships
    .filter((m) => !ownedIds.has(m.team.id))
    .map((m) => ({ ...m.team, memberRole: m.role, isCaptain: m.isCaptain, isOwner: false }))

  const allTeams = [
    ...ownedTeams.map((t) => ({ ...t, memberRole: "PLAYER" as MembershipRole, isCaptain: false, isOwner: true })),
    ...memberTeams,
  ]

  return { player, allTeams, activeSeason }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect("/auth/signin")

  const { player, allTeams, activeSeason } = await getDashboardData(session.user.id)

  const userName = player?.displayName ?? session.user.name ?? "Player"
  const hasTeams = allTeams.length > 0
  const hasActiveReg = allTeams.some((t) =>
    t.registrations[0]?.status === "APPROVED"
  )

  // Onboarding steps
  const steps = [
    {
      done: !!player,
      label: "Create your player profile",
      desc: "Set your display name and Epic username.",
      href: "/profile/setup",
      cta: "Set up profile",
    },
    {
      done: hasTeams,
      label: "Join or create a team",
      desc: "Own a team or ask a captain to add you to their roster.",
      href: "/team/create",
      cta: "Create team",
    },
    {
      done: hasActiveReg,
      label: "Register for the season",
      desc: "Submit your team for staff review to compete this season.",
      href: allTeams[0] ? `/team/${allTeams[0].id}/register` : "/team/create",
      cta: "Register now",
    },
  ]
  const allDone = steps.every((s) => s.done)

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  return (
    <div className="mx-auto max-w-5xl space-y-8">

      {/* ── Hero greeting ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
        {/* Glow accents */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-brand/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-brand/10 blur-2xl"
        />

        <div className="relative flex flex-col gap-6 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted text-lg font-bold text-muted-foreground overflow-hidden">
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={userName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound className="h-7 w-7" />
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground">{greeting},</p>
              <h1 className="font-display text-2xl font-bold uppercase tracking-wide leading-tight">
                {userName}
              </h1>
              {player?.epicUsername && (
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {player.epicUsername}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!hasTeams && (
              <Link
                href="/team/create"
                className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
              >
                <Plus className="h-3.5 w-3.5" />
                Create Team
              </Link>
            )}
            {hasTeams && activeSeason && !hasActiveReg && (
              <Link
                href={`/team/${allTeams[0].id}/register`}
                className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
              >
                <ClipboardList className="h-3.5 w-3.5" />
                Register for {activeSeason.name}
              </Link>
            )}
            <Link
              href="/profile"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
            >
              <Settings className="h-3.5 w-3.5" />
              Profile
            </Link>
          </div>
        </div>
      </div>

      {/* ── Onboarding checklist (hidden when all done) ──────────────── */}
      {!allDone && (
        <section className="rounded-xl border border-brand/20 bg-brand/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Rocket className="h-4 w-4 text-brand" />
            <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-brand">
              Getting Started
            </h2>
          </div>
          <ol className="flex flex-col gap-3">
            {steps.map((step, i) => (
              <li
                key={i}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-4 transition-colors",
                  step.done
                    ? "border-emerald-500/20 bg-emerald-500/5 opacity-60"
                    : "border-border bg-card"
                )}
              >
                <div className="mt-0.5 shrink-0">
                  {step.done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", step.done && "line-through text-muted-foreground")}>
                    {step.label}
                  </p>
                  {!step.done && (
                    <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                  )}
                </div>
                {!step.done && (
                  <Link
                    href={step.href}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 text-xs")}
                  >
                    {step.cta}
                    <ChevronRight className="h-3 w-3 ml-0.5" />
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ── My Teams ─────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            My Teams
          </h2>
          <Link
            href="/team/create"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1 text-xs")}
          >
            <Plus className="h-3.5 w-3.5" />
            New Team
          </Link>
        </div>

        {allTeams.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card flex flex-col items-center gap-3 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted">
              <Users className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">You&apos;re not on any teams yet.</p>
            <Link
              href="/team/create"
              className={cn(buttonVariants({ size: "sm" }), "gap-1.5 mt-1")}
            >
              <Plus className="h-3.5 w-3.5" />
              Create your first team
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {allTeams.map((team) => {
              const reg = team.registrations[0]
              return (
                <Link
                  key={team.id}
                  href={`/team/${team.id}`}
                  className="group relative overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-brand/40"
                >
                  {/* Color strip */}
                  <div
                    className="h-1 w-full"
                    style={{ backgroundColor: team.primaryColor ?? "oklch(0.50 0.20 15)" }}
                  />

                  <div className="flex items-center gap-4 p-4">
                    {/* Logo / initials */}
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border text-sm font-bold text-white overflow-hidden"
                      style={{ backgroundColor: team.primaryColor ?? "oklch(0.50 0.20 15)" }}
                    >
                      {team.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={team.logoUrl} alt={team.name} className="h-full w-full object-cover" />
                      ) : (
                        team.name.slice(0, 2).toUpperCase()
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-display text-sm font-bold uppercase tracking-wide truncate">
                          {team.name}
                        </span>
                        {team.isOwner && (
                          <Crown className="h-3 w-3 text-yellow-500 shrink-0" aria-label="Owner" />
                        )}
                        {team.isCaptain && !team.isOwner && (
                          <Crown className="h-3 w-3 text-sky-400 shrink-0" aria-label="Captain" />
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {team.memberships.length} member{team.memberships.length !== 1 ? "s" : ""}
                        </span>
                        {reg && (
                          <>
                            <span className="text-muted-foreground/30">·</span>
                            <RegistrationPip status={reg.status} />
                            <span className="text-xs text-muted-foreground truncate">
                              {reg.division?.name ?? reg.season.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Season status strip ──────────────────────────────────────── */}
      {activeSeason && (
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand/30 bg-brand/10">
                <Trophy className="h-4 w-4 text-brand" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                  {activeSeason.status === "REGISTRATION" ? "Registration Open" : "Season Active"}
                </p>
                <p className="text-sm font-medium">{activeSeason.name}</p>
              </div>
            </div>
            {activeSeason.status === "REGISTRATION" && hasTeams && !hasActiveReg && (
              <Link
                href={`/team/${allTeams[0].id}/register`}
                className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
              >
                <ClipboardList className="h-3.5 w-3.5" />
                Register your team
              </Link>
            )}
            {hasActiveReg && (
              <span className="inline-flex items-center gap-1.5 text-sm text-emerald-400 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Registered
              </span>
            )}
          </div>
        </section>
      )}

      {/* ── Upcoming Matches (empty state for now) ──────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Upcoming Matches
          </h2>
        </div>

        <div className="rounded-xl border border-dashed border-border bg-card flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted">
            <Swords className="h-5 w-5 text-muted-foreground/40" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">No matches scheduled yet.</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Matches will appear here once the season begins.
            </p>
          </div>
        </div>
      </section>

      {/* ── Quick actions ────────────────────────────────────────────── */}
      <section>
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Quick Actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <QuickLink
            href="/profile"
            icon={UserRound}
            label="My Profile"
            desc="Edit your player info"
          />
          <QuickLink
            href="/team/create"
            icon={Plus}
            label="Create Team"
            desc="Start a new roster"
          />
          <QuickLink
            href="/seasons"
            icon={CalendarClock}
            label="Seasons"
            desc="Browse season history"
          />
        </div>
      </section>

    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RegistrationPip({ status }: { status: RegistrationStatus }) {
  const map: Record<RegistrationStatus, string> = {
    PENDING:    "bg-yellow-400",
    APPROVED:   "bg-emerald-400",
    REJECTED:   "bg-destructive",
    WAITLISTED: "bg-orange-400",
    WITHDRAWN:  "bg-muted-foreground/40",
  }
  return (
    <span
      className={cn("h-1.5 w-1.5 rounded-full shrink-0", map[status])}
      title={status}
    />
  )
}

function QuickLink({
  href,
  icon: Icon,
  label,
  desc,
}: {
  href: string
  icon: React.ElementType
  label: string
  desc: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-brand/40"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-brand/30 bg-brand/10">
        <Icon className="h-4 w-4 text-brand" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
    </Link>
  )
}
