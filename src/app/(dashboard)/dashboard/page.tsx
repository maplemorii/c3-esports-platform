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
  Swords,
} from "lucide-react"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import type { RegistrationStatus, MembershipRole } from "@prisma/client"

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getDashboardData(userId: string) {
  const [player, ownedTeams, memberships, activeSeason] = await Promise.all([
    prisma.player.findUnique({
      where: { userId, deletedAt: null },
      select: { id: true, displayName: true, avatarUrl: true },
    }),

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

    prisma.season.findFirst({
      where: { status: { in: ["REGISTRATION", "ACTIVE", "PLAYOFFS"] } },
      orderBy: { createdAt: "desc" as const },
      select: { id: true, name: true, status: true },
    }),
  ])

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
  const hasActiveReg = allTeams.some((t) => t.registrations[0]?.status === "APPROVED")

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
  const doneCount = steps.filter((s) => s.done).length

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* ── Hero greeting ─────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Top gradient accent */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.7) 0%, rgba(59,130,246,0.6) 60%, transparent 100%)" }}
          aria-hidden
        />
        {/* Ambient glows */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(59,130,246,0.5), transparent 70%)", filter: "blur(40px)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, rgba(196,28,53,0.4), transparent 70%)", filter: "blur(30px)" }}
        />

        <div className="relative flex flex-col gap-5 p-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar with brand ring */}
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl overflow-hidden"
              style={{
                border: "1.5px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)",
                boxShadow: "0 0 0 3px rgba(196,28,53,0.15), 0 0 0 5px rgba(59,130,246,0.08)",
              }}
            >
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt={userName} className="h-full w-full object-cover" />
              ) : (
                <UserRound className="h-8 w-8" style={{ color: "rgba(255,255,255,0.3)" }} />
              )}
            </div>

            <div>
              <p
                className="text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                {greeting}
              </p>
              <h1
                className="font-display text-3xl font-black uppercase leading-tight"
                style={{ color: "rgba(255,255,255,0.92)", letterSpacing: "0.02em" }}
              >
                {userName}
              </h1>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {!hasTeams && (
              <Link
                href="/team/create"
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, rgba(196,28,53,0.9), rgba(59,130,246,0.9))",
                  boxShadow: "0 0 16px rgba(196,28,53,0.2)",
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Create Team
              </Link>
            )}
            {hasTeams && activeSeason && !hasActiveReg && (
              <Link
                href={`/team/${allTeams[0].id}/register`}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, rgba(196,28,53,0.9), rgba(59,130,246,0.9))",
                  boxShadow: "0 0 16px rgba(196,28,53,0.2)",
                }}
              >
                <ClipboardList className="h-3.5 w-3.5" />
                Register for {activeSeason.name}
              </Link>
            )}
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors duration-150"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.55)",
              }}
            >
              <Settings className="h-3.5 w-3.5" />
              Profile
            </Link>
          </div>
        </div>

        {/* Stats strip */}
        <div
          className="relative grid grid-cols-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          {[
            { label: "Teams",  value: String(allTeams.length) },
            { label: "Season", value: activeSeason?.name ?? "—" },
            { label: "Status", value: hasActiveReg ? "Registered" : activeSeason?.status === "REGISTRATION" ? "Open" : "—" },
          ].map(({ label, value }, i) => (
            <div
              key={label}
              className="flex flex-col items-center gap-0.5 py-3"
              style={i < 2 ? { borderRight: "1px solid rgba(255,255,255,0.05)" } : undefined}
            >
              <p className="font-display text-base font-bold text-foreground/80 truncate max-w-full px-2 text-center">
                {value}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Onboarding checklist ──────────────────────────────────── */}
      {!allDone && (
        <section
          className="relative overflow-hidden rounded-2xl p-6"
          style={{
            background: "rgba(196,28,53,0.04)",
            border: "1px solid rgba(196,28,53,0.12)",
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.5), rgba(59,130,246,0.3), transparent)" }}
            aria-hidden
          />

          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-brand" />
              <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-brand">
                Getting Started
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative h-1.5 w-20 rounded-full overflow-hidden bg-white/10">
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                  style={{
                    width: `${(doneCount / steps.length) * 100}%`,
                    background: "linear-gradient(90deg, rgba(196,28,53,0.8), rgba(59,130,246,0.8))",
                  }}
                />
              </div>
              <span className="text-xs font-bold text-brand">{doneCount}/{steps.length}</span>
            </div>
          </div>

          <ol className="flex flex-col gap-2.5">
            {steps.map((step, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-xl p-4"
                style={{
                  background: step.done ? "rgba(52,211,153,0.04)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${step.done ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.06)"}`,
                  opacity: step.done ? 0.55 : 1,
                }}
              >
                <div className="mt-0.5 shrink-0">
                  {step.done
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    : <Circle className="h-4 w-4 text-muted-foreground/20" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium"
                    style={{
                      color: step.done ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.8)",
                      textDecoration: step.done ? "line-through" : "none",
                    }}
                  >
                    {step.label}
                  </p>
                  {!step.done && (
                    <p className="text-xs mt-0.5 text-muted-foreground">{step.desc}</p>
                  )}
                </div>
                {!step.done && (
                  <Link
                    href={step.href}
                    className="shrink-0 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-150"
                    style={{
                      background: "rgba(196,28,53,0.15)",
                      border: "1px solid rgba(196,28,53,0.25)",
                      color: "rgba(252,165,165,0.85)",
                    }}
                  >
                    {step.cta}
                    <ChevronRight className="h-3 w-3" />
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
          <h2 className="font-sans text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground/60">
            My Teams
          </h2>
          <Link
            href="/team/create"
            className="flex items-center gap-1 text-xs font-medium text-brand/70 hover:text-brand transition-colors duration-150"
          >
            <Plus className="h-3 w-3" />
            New Team
          </Link>
        </div>

        {allTeams.length === 0 ? (
          <div
            className="rounded-2xl flex flex-col items-center gap-3 py-14 text-center"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.07)" }}
          >
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ border: "1px solid rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.03)" }}
            >
              <Users className="h-6 w-6 text-muted-foreground/20" />
            </div>
            <p className="text-sm text-muted-foreground/50">You&apos;re not on any teams yet.</p>
            <Link
              href="/team/create"
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, rgba(196,28,53,0.85), rgba(59,130,246,0.85))" }}
            >
              <Plus className="h-3.5 w-3.5" />
              Create your first team
            </Link>
          </div>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2">
            {allTeams.map((team) => {
              const reg = team.registrations[0]
              return (
                <Link
                  key={team.id}
                  href={`/team/${team.id}`}
                  className="group relative overflow-hidden rounded-xl transition-all duration-150"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  {/* Team color top strip */}
                  <div
                    className="h-0.5 w-full"
                    style={{ backgroundColor: team.primaryColor ?? "rgba(59,130,246,0.8)" }}
                  />

                  <div className="flex items-center gap-3.5 p-4">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white overflow-hidden"
                      style={{ backgroundColor: team.primaryColor ?? "rgba(59,130,246,0.6)" }}
                    >
                      {team.logoUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={team.logoUrl} alt={team.name} className="h-full w-full object-cover" />
                        : team.name.slice(0, 2).toUpperCase()
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-display text-sm font-bold uppercase tracking-wide truncate text-foreground/85 group-hover:text-foreground transition-colors">
                          {team.name}
                        </span>
                        {team.isOwner && <Crown className="h-3 w-3 shrink-0 text-amber-400/80" />}
                        {team.isCaptain && !team.isOwner && <Crown className="h-3 w-3 shrink-0 text-sky-400/80" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground/50">
                          {team.memberships.length} member{team.memberships.length !== 1 ? "s" : ""}
                        </span>
                        {reg && (
                          <>
                            <span className="text-muted-foreground/20">·</span>
                            <RegistrationPip status={reg.status} />
                            <span className="text-xs truncate text-muted-foreground/50">
                              {reg.division?.name ?? reg.season.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Season status ──────────────────────────────────────────── */}
      {activeSeason && (
        <section
          className="relative overflow-hidden rounded-2xl p-5"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}
              >
                <Trophy className="h-4 w-4 text-blue-400/85" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground/50">
                  {activeSeason.status === "REGISTRATION" ? "Registration Open" : "Season Active"}
                </p>
                <p className="text-sm font-semibold text-foreground/75">{activeSeason.name}</p>
              </div>
            </div>
            {activeSeason.status === "REGISTRATION" && hasTeams && !hasActiveReg && (
              <Link
                href={`/team/${allTeams[0].id}/register`}
                className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, rgba(196,28,53,0.85), rgba(59,130,246,0.85))" }}
              >
                <ClipboardList className="h-3.5 w-3.5" />
                Register your team
              </Link>
            )}
            {hasActiveReg && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Registered
              </span>
            )}
          </div>
        </section>
      )}

      {/* ── Upcoming Matches ─────────────────────────────────────────── */}
      <section>
        <h2 className="font-sans text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground/60 mb-4">
          Upcoming Matches
        </h2>
        <div
          className="rounded-2xl flex flex-col items-center gap-3 py-12 text-center"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.06)" }}
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
          >
            <Swords className="h-5 w-5 text-muted-foreground/20" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground/40">No matches scheduled yet.</p>
            <p className="text-xs mt-0.5 text-muted-foreground/25">
              Matches will appear here once the season begins.
            </p>
          </div>
        </div>
      </section>

      {/* ── Quick actions ────────────────────────────────────────────── */}
      <section>
        <h2 className="font-sans text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground/60 mb-4">
          Quick Actions
        </h2>
        <div className="grid gap-2.5 sm:grid-cols-3">
          <QuickLink href="/profile"     icon={UserRound}     label="My Profile"  desc="Edit your player info"  iconColor="rgba(196,28,53,0.85)"  />
          <QuickLink href="/team/create" icon={Plus}          label="Create Team" desc="Start a new roster"     iconColor="rgba(59,130,246,0.85)" />
          <QuickLink href="/seasons"     icon={CalendarClock} label="Seasons"     desc="Browse season history"  iconColor="rgba(196,28,53,0.7)"   />
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
    PENDING:    "rgba(251,191,36,0.8)",
    APPROVED:   "rgba(52,211,153,0.8)",
    REJECTED:   "rgba(248,113,113,0.8)",
    WAITLISTED: "rgba(251,146,60,0.8)",
    WITHDRAWN:  "rgba(255,255,255,0.2)",
  }
  return (
    <span
      className="h-1.5 w-1.5 rounded-full shrink-0 inline-block"
      style={{ backgroundColor: map[status] }}
      title={status}
    />
  )
}

function QuickLink({
  href,
  icon: Icon,
  label,
  desc,
  iconColor,
}: {
  href:      string
  icon:      React.ComponentType<React.SVGProps<SVGSVGElement>>
  label:     string
  desc:      string
  iconColor: string
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl p-4 transition-all duration-150"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{
          background: iconColor.replace(/[\d.]+\)$/, "0.12)"),
          border: `1px solid ${iconColor.replace(/[\d.]+\)$/, "0.2)")}`,
        }}
      >
        <Icon className="h-4 w-4" style={{ color: iconColor }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground/80 group-hover:text-foreground transition-colors">{label}</p>
        <p className="text-xs text-muted-foreground/50">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors" />
    </Link>
  )
}
