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
    <div className="mx-auto max-w-5xl space-y-6">

      {/* ── Hero greeting ───────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-2xl p-8"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Ambient violet glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.4), transparent 70%)", filter: "blur(40px)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(220,38,38,0.3), transparent 70%)", filter: "blur(30px)" }}
        />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}
            >
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt={userName} className="h-full w-full object-cover" />
              ) : (
                <UserRound className="h-7 w-7" style={{ color: "rgba(255,255,255,0.3)" }} />
              )}
            </div>

            <div>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>{greeting},</p>
              <h1
                className="font-sans text-2xl font-black uppercase leading-tight"
                style={{ color: "rgba(255,255,255,0.9)", letterSpacing: "0.02em" }}
              >
                {userName}
              </h1>
              {player?.epicUsername && (
                <p className="text-xs font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.28)" }}>
                  {player.epicUsername}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!hasTeams && (
              <DarkButton href="/team/create" icon={Plus} label="Create Team" accent />
            )}
            {hasTeams && activeSeason && !hasActiveReg && (
              <DarkButton href={`/team/${allTeams[0].id}/register`} icon={ClipboardList} label={`Register for ${activeSeason.name}`} accent />
            )}
            <DarkButton href="/profile" icon={Settings} label="Profile" />
          </div>
        </div>
      </div>

      {/* ── Onboarding checklist ──────────────────────────────────── */}
      {!allDone && (
        <section
          className="rounded-2xl p-6"
          style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)" }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Rocket className="h-4 w-4" style={{ color: "rgba(167,139,250,0.8)" }} />
            <h2
              className="font-sans text-[11px] font-semibold uppercase tracking-[0.28em]"
              style={{ color: "rgba(167,139,250,0.8)" }}
            >
              Getting Started
            </h2>
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
                    ? <CheckCircle2 className="h-4 w-4" style={{ color: "rgba(52,211,153,0.8)" }} />
                    : <Circle className="h-4 w-4" style={{ color: "rgba(255,255,255,0.2)" }} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium"
                    style={{ color: step.done ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.75)", textDecoration: step.done ? "line-through" : "none" }}
                  >
                    {step.label}
                  </p>
                  {!step.done && (
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{step.desc}</p>
                  )}
                </div>
                {!step.done && (
                  <Link
                    href={step.href}
                    className="shrink-0 flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150"
                    style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)", color: "rgba(196,181,253,0.85)" }}
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
          <h2
            className="font-sans text-[11px] font-semibold uppercase tracking-[0.28em]"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            My Teams
          </h2>
          <Link
            href="/team/create"
            className="flex items-center gap-1 text-xs font-medium transition-colors duration-150"
            style={{ color: "rgba(167,139,250,0.6)" }}
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
              <Users className="h-6 w-6" style={{ color: "rgba(255,255,255,0.18)" }} />
            </div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.28)" }}>You&apos;re not on any teams yet.</p>
            <Link
              href="/team/create"
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150"
              style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)", color: "rgba(196,181,253,0.85)" }}
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
                  className="group relative overflow-hidden rounded-xl transition-all duration-150 border border-white/[0.07] hover:bg-white/5 hover:border-violet-500/30"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                >
                  {/* Color strip */}
                  <div className="h-0.5 w-full" style={{ backgroundColor: team.primaryColor ?? "rgba(124,58,237,0.8)" }} />

                  <div className="flex items-center gap-3.5 p-4">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white overflow-hidden"
                      style={{ backgroundColor: team.primaryColor ?? "rgba(124,58,237,0.6)" }}
                    >
                      {team.logoUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={team.logoUrl} alt={team.name} className="h-full w-full object-cover" />
                        : team.name.slice(0, 2).toUpperCase()
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="font-sans text-sm font-bold uppercase tracking-wide truncate"
                          style={{ color: "rgba(255,255,255,0.85)", letterSpacing: "0.05em" }}
                        >
                          {team.name}
                        </span>
                        {team.isOwner && <Crown className="h-3 w-3 shrink-0" style={{ color: "rgba(251,191,36,0.8)" }} />}
                        {team.isCaptain && !team.isOwner && <Crown className="h-3 w-3 shrink-0" style={{ color: "rgba(56,189,248,0.8)" }} />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                          {team.memberships.length} member{team.memberships.length !== 1 ? "s" : ""}
                        </span>
                        {reg && (
                          <>
                            <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
                            <RegistrationPip status={reg.status} />
                            <span className="text-xs truncate" style={{ color: "rgba(255,255,255,0.3)" }}>
                              {reg.division?.name ?? reg.season.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="h-4 w-4 shrink-0 transition-colors duration-150" style={{ color: "rgba(255,255,255,0.18)" }} />
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
          className="rounded-2xl p-5"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.2)" }}
              >
                <Trophy className="h-4 w-4" style={{ color: "rgba(167,139,250,0.85)" }} />
              </div>
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.25em]"
                  style={{ color: "rgba(255,255,255,0.28)" }}
                >
                  {activeSeason.status === "REGISTRATION" ? "Registration Open" : "Season Active"}
                </p>
                <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>{activeSeason.name}</p>
              </div>
            </div>
            {activeSeason.status === "REGISTRATION" && hasTeams && !hasActiveReg && (
              <Link
                href={`/team/${allTeams[0].id}/register`}
                className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-150"
                style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)", color: "rgba(196,181,253,0.85)" }}
              >
                <ClipboardList className="h-3.5 w-3.5" />
                Register your team
              </Link>
            )}
            {hasActiveReg && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: "rgba(52,211,153,0.85)" }}>
                <CheckCircle2 className="h-4 w-4" />
                Registered
              </span>
            )}
          </div>
        </section>
      )}

      {/* ── Upcoming Matches ─────────────────────────────────────────── */}
      <section>
        <h2
          className="font-sans text-[11px] font-semibold uppercase tracking-[0.28em] mb-4"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
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
            <Swords className="h-5 w-5" style={{ color: "rgba(255,255,255,0.15)" }} />
          </div>
          <div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.28)" }}>No matches scheduled yet.</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.15)" }}>
              Matches will appear here once the season begins.
            </p>
          </div>
        </div>
      </section>

      {/* ── Quick actions ────────────────────────────────────────────── */}
      <section>
        <h2
          className="font-sans text-[11px] font-semibold uppercase tracking-[0.28em] mb-4"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          Quick Actions
        </h2>
        <div className="grid gap-2.5 sm:grid-cols-3">
          <QuickLink href="/profile"      icon={UserRound}   label="My Profile"    desc="Edit your player info"  />
          <QuickLink href="/team/create"  icon={Plus}        label="Create Team"   desc="Start a new roster"    />
          <QuickLink href="/seasons"      icon={CalendarClock} label="Seasons"     desc="Browse season history"  />
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

function QuickLink({ href, icon: Icon, label, desc }: { href: string; icon: React.ElementType; label: string; desc: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl p-4 transition-all duration-150 border border-white/[0.07] hover:bg-white/5 hover:border-violet-500/25"
      style={{ background: "rgba(255,255,255,0.03)" }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.18)" }}
      >
        <Icon className="h-4 w-4" style={{ color: "rgba(167,139,250,0.8)" }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>{label}</p>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 transition-colors duration-150" style={{ color: "rgba(255,255,255,0.18)" }} />
    </Link>
  )
}

function DarkButton({ href, icon: Icon, label, accent }: { href: string; icon: React.ElementType; label: string; accent?: boolean }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-150"
      style={{
        background: accent ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.05)",
        border: `1px solid ${accent ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.1)"}`,
        color: accent ? "rgba(196,181,253,0.85)" : "rgba(255,255,255,0.55)",
      }}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Link>
  )
}
